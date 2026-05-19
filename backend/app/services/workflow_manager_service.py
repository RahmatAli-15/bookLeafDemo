import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workflow_run import AgentRun, WorkflowRun
from app.models.chapter import Chapter
from app.models.chunk import Chunk
from app.models.manuscript import Manuscript
from app.models.project import Project
from app.services.manuscript_type_service import extract_manuscript_type

from app.services.asset_service import save_generated_asset
from app.utils.config import settings
from app.workflows.book_workflow import build_parser_workflow

workflow = build_parser_workflow()

DEFAULT_AGENT_ORDER = [
    "parser",
    "summary",
    "metadata",
    "social",
    "grammar",
    "translation",
    "cover",
    "audiobook",
    "rag_prep",
]


async def _latest_manuscript_and_chapters(db: AsyncSession, project_id: int):
    manuscript_result = await db.execute(
        select(Manuscript).where(Manuscript.project_id == project_id).order_by(Manuscript.created_at.desc())
    )
    manuscript = manuscript_result.scalars().first()
    if not manuscript:
        return None, []

    chapter_result = await db.execute(
        select(Chapter).where(Chapter.manuscript_id == manuscript.id).order_by(Chapter.chapter_number.asc())
    )
    chapters = [
        {"id": c.id, "title": c.title, "content": c.content, "chapter_number": c.chapter_number}
        for c in chapter_result.scalars().all()
    ]
    return manuscript, chapters


async def _create_agent_runs(db: AsyncSession, workflow_run_id: int, selected_agents: list[str]) -> dict[str, AgentRun]:
    rows = {}
    for name in DEFAULT_AGENT_ORDER:
        status = "pending"
        if name in selected_agents:
            status = "running" if name == "parser" else "pending"
        row = AgentRun(
            workflow_run_id=workflow_run_id,
            agent_name=name,
            status=status,
            output_reference=None,
        )
        db.add(row)
        rows[name] = row
    await db.flush()
    return rows


async def run_full_workflow(
    db: AsyncSession,
    project_id: int,
    target_language: str = "es",
    voice: str = "narrator",
) -> dict:
    project = await db.get(Project, project_id)
    if not project:
        raise ValueError("Project not found")

    manuscript, chapters = await _latest_manuscript_and_chapters(db, project_id)
    if not manuscript or not chapters:
        raise ValueError("No parsed manuscript/chapters available")

    workflow_run = WorkflowRun(
        project_id=project_id,
        workflow_name="bookai_publishing_pipeline",
        status="running",
    )
    db.add(workflow_run)
    await db.flush()

    selected_agents = DEFAULT_AGENT_ORDER.copy()
    agent_runs = await _create_agent_runs(db, workflow_run.id, selected_agents)

    manuscript_type = extract_manuscript_type(project.description) or "literary"

    state = {
        "project_id": project.id,
        "project_title": project.title,
        "manuscript_id": manuscript.id,
        "chapters": chapters,
        "selected_agents": selected_agents,
        "target_language": target_language,
        "voice": voice,
        "genre_hint": manuscript_type,
        "audio_dir": settings.audio_dir,
        "outputs": {},
        "agent_status": {},
        "errors": [],
    }

    try:
        result = workflow.invoke(state)
    except Exception as exc:  # noqa: BLE001
        workflow_run.status = "failed"
        workflow_run.completed_at = datetime.now(timezone.utc)
        for row in agent_runs.values():
            if row.status == "running":
                row.status = "failed"
                row.output_reference = str(exc)
        await db.commit()
        raise

    for name, row in agent_runs.items():
        status = result.get("agent_status", {}).get(name, "pending")
        row.status = status
        if name in result.get("outputs", {}):
            output = result["outputs"][name if name != "rag_prep" else "rag_prep"]
            row.output_reference = json.dumps(output, ensure_ascii=False)[:4000]

    for asset_type, content in result.get("outputs", {}).items():
        await save_generated_asset(db, project.id, asset_type, content)

    workflow_failed = any(v == "failed" for v in result.get("agent_status", {}).values())
    workflow_run.status = "failed" if workflow_failed else "completed"
    workflow_run.completed_at = datetime.now(timezone.utc)
    project.status = "processed" if workflow_run.status == "completed" else "failed"

    await db.commit()

    return {
        "workflow_run_id": workflow_run.id,
        "status": workflow_run.status,
        "agent_status": result.get("agent_status", {}),
        "errors": result.get("errors", []),
        "outputs": list(result.get("outputs", {}).keys()),
    }


async def get_workflow_status(db: AsyncSession, project_id: int) -> dict:
    run_result = await db.execute(
        select(WorkflowRun)
        .where(WorkflowRun.project_id == project_id)
        .order_by(WorkflowRun.started_at.desc())
    )
    run = run_result.scalars().first()
    if not run:
        return {"status": "pending", "agents": []}

    agents_result = await db.execute(
        select(AgentRun).where(AgentRun.workflow_run_id == run.id).order_by(AgentRun.id.asc())
    )
    agents = agents_result.scalars().all()

    return {
        "workflow_run_id": run.id,
        "workflow_name": run.workflow_name,
        "status": run.status,
        "started_at": run.started_at,
        "completed_at": run.completed_at,
        "agents": [
            {
                "agent_name": a.agent_name,
                "status": a.status,
                "output_reference": a.output_reference,
                "created_at": a.created_at,
            }
            for a in agents
        ],
    }


async def get_project_chunks(db: AsyncSession, project_id: int) -> list[dict]:
    manuscript_result = await db.execute(
        select(Manuscript).where(Manuscript.project_id == project_id).order_by(Manuscript.created_at.desc())
    )
    manuscript = manuscript_result.scalars().first()
    if not manuscript:
        return []

    chapter_result = await db.execute(select(Chapter.id).where(Chapter.manuscript_id == manuscript.id))
    chapter_ids = [row[0] for row in chapter_result.all()]
    if not chapter_ids:
        return []

    chunk_result = await db.execute(
        select(Chunk).where(Chunk.chapter_id.in_(chapter_ids)).order_by(Chunk.id.asc())
    )
    return [{"id": c.id, "content": c.content, "chapter_id": c.chapter_id} for c in chunk_result.scalars().all()]
