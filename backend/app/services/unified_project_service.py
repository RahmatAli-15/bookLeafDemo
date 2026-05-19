import json
from collections import Counter

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chapter import Chapter
from app.models.generated_asset import GeneratedAsset
from app.models.manuscript import Manuscript
from app.models.project import Project
from app.models.workflow_run import WorkflowRun
from app.services.asset_manager_service import get_assets_grouped
from app.services.manuscript_type_service import extract_manuscript_type
from app.services.processing_service import get_project_detail
from app.services.workflow_manager_service import get_workflow_status


def _parse_metadata_genre(content: str) -> str | None:
    try:
        data = json.loads(content)
        genre = data.get("genre")
        if isinstance(genre, str) and genre.strip():
            return genre.strip()
    except Exception:
        return None
    return None


async def dashboard_projects(db: AsyncSession):
    projects_result = await db.execute(select(Project).order_by(Project.created_at.desc()))
    projects = projects_result.scalars().all()
    project_ids = [p.id for p in projects]

    total_assets_result = await db.execute(select(func.count(GeneratedAsset.id)))
    total_assets = total_assets_result.scalar() or 0

    workflow_result = await db.execute(select(func.count(WorkflowRun.id).filter(WorkflowRun.status == "completed")))
    completed_workflows = workflow_result.scalar() or 0

    metadata_rows_result = await db.execute(
        select(GeneratedAsset.content).where(GeneratedAsset.asset_type == "metadata")
    )
    genres = []
    for row in metadata_rows_result.all():
        genre = _parse_metadata_genre(row[0])
        if genre:
            genres.append(genre)

    genre_counter = Counter(genres)
    manuscript_types = [{"name": name, "count": count} for name, count in genre_counter.most_common(8)]

    manuscript_count_by_project: dict[int, int] = {}
    chapter_count_by_project: dict[int, int] = {}
    latest_manuscript_by_project: dict[int, str] = {}
    asset_count_by_project: dict[int, int] = {}
    asset_breakdown_by_project: dict[int, dict[str, int]] = {}
    workflow_count_by_project: dict[int, int] = {}
    latest_workflow_status_by_project: dict[int, str] = {}

    if project_ids:
        manuscript_counts_result = await db.execute(
            select(Manuscript.project_id, func.count(Manuscript.id)).where(Manuscript.project_id.in_(project_ids)).group_by(Manuscript.project_id)
        )
        manuscript_count_by_project = {int(pid): int(count or 0) for pid, count in manuscript_counts_result.all()}

        chapter_counts_result = await db.execute(
            select(Manuscript.project_id, func.count(Chapter.id))
            .join(Chapter, Chapter.manuscript_id == Manuscript.id)
            .where(Manuscript.project_id.in_(project_ids))
            .group_by(Manuscript.project_id)
        )
        chapter_count_by_project = {int(pid): int(count or 0) for pid, count in chapter_counts_result.all()}

        latest_manuscripts_result = await db.execute(
            select(Manuscript.project_id, Manuscript.filename)
            .where(
                Manuscript.project_id.in_(project_ids),
                Manuscript.id.in_(
                    select(func.max(Manuscript.id)).where(Manuscript.project_id.in_(project_ids)).group_by(Manuscript.project_id)
                ),
            )
        )
        latest_manuscript_by_project = {int(pid): name for pid, name in latest_manuscripts_result.all()}

        asset_counts_result = await db.execute(
            select(GeneratedAsset.project_id, func.count(GeneratedAsset.id))
            .where(GeneratedAsset.project_id.in_(project_ids))
            .group_by(GeneratedAsset.project_id)
        )
        asset_count_by_project = {int(pid): int(count or 0) for pid, count in asset_counts_result.all()}

        asset_breakdown_result = await db.execute(
            select(GeneratedAsset.project_id, GeneratedAsset.asset_type, func.count(GeneratedAsset.id))
            .where(GeneratedAsset.project_id.in_(project_ids))
            .group_by(GeneratedAsset.project_id, GeneratedAsset.asset_type)
        )
        for pid, asset_type, count in asset_breakdown_result.all():
            pid_int = int(pid)
            asset_breakdown_by_project.setdefault(pid_int, {})
            asset_breakdown_by_project[pid_int][asset_type] = int(count or 0)

        workflow_counts_result = await db.execute(
            select(WorkflowRun.project_id, func.count(WorkflowRun.id))
            .where(WorkflowRun.project_id.in_(project_ids))
            .group_by(WorkflowRun.project_id)
        )
        workflow_count_by_project = {int(pid): int(count or 0) for pid, count in workflow_counts_result.all()}

        latest_workflow_rows = await db.execute(
            select(WorkflowRun.project_id, WorkflowRun.status)
            .where(
                WorkflowRun.project_id.in_(project_ids),
                WorkflowRun.id.in_(
                    select(func.max(WorkflowRun.id)).where(WorkflowRun.project_id.in_(project_ids)).group_by(WorkflowRun.project_id)
                ),
            )
        )
        latest_workflow_status_by_project = {int(pid): status for pid, status in latest_workflow_rows.all()}

    return {
        "total_projects": len(projects),
        "total_assets": total_assets,
        "credits_used": total_assets,
        "completed_workflows": completed_workflows,
        "active_agents": ["parser", "summary", "metadata", "social", "grammar", "translation", "cover", "audiobook", "rag_prep"],
        "manuscript_types": manuscript_types,
        "projects": [
            {
                "id": p.id,
                "title": p.title,
                "status": p.status,
                "created_at": p.created_at,
                "manuscript_type": extract_manuscript_type(p.description),
                "manuscript_count": manuscript_count_by_project.get(p.id, 0),
                "chapter_count": chapter_count_by_project.get(p.id, 0),
                "latest_manuscript": latest_manuscript_by_project.get(p.id),
                "asset_count": asset_count_by_project.get(p.id, 0),
                "asset_breakdown": asset_breakdown_by_project.get(p.id, {}),
                "workflow_runs": workflow_count_by_project.get(p.id, 0),
                "latest_workflow_status": latest_workflow_status_by_project.get(p.id, "pending"),
            }
            for p in projects[:20]
        ],
    }


async def dashboard_project(db: AsyncSession, project_id: int):
    detail = await get_project_detail(db, project_id)
    if not detail:
        return None

    workflow = await get_workflow_status(db, project_id)
    assets = await get_assets_grouped(db, project_id)

    detail["workflow"] = workflow
    detail["assets"] = assets
    detail["asset_counts"] = {k: len(v) for k, v in assets.items()}
    return detail
