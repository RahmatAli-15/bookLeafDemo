from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.api.schemas import AudiobookRequest, FinalizePublishRequest, ProjectCreate, ProjectUpdate, TranslationRequest
from app.db.session import get_db
from app.models.chapter import Chapter
from app.models.manuscript import Manuscript
from app.models.project import Project
from app.services.asset_manager_service import get_assets_grouped
from app.services.asset_service import save_generated_asset
from app.services.ebook_service import build_ebook_payload
from app.services.manuscript_type_service import append_manuscript_type, clean_description, extract_manuscript_type
from app.services.processing_service import (
    get_chapter_detail,
    get_manuscript_detail,
    get_project_detail,
    process_manuscript,
)
from app.services.rag_service import answer_with_context
from app.services.translation_service import build_translation_payload
from app.services.unified_project_service import dashboard_project, dashboard_projects
from app.services.upload_service import save_upload_file
from app.services.workflow_manager_service import (
    get_project_chunks,
    get_workflow_status,
    run_full_workflow,
)

router = APIRouter()


async def _latest_project_chapters(db: AsyncSession, project_id: int) -> list[dict]:
    manuscript_result = await db.execute(
        select(Manuscript).where(Manuscript.project_id == project_id).order_by(Manuscript.created_at.desc())
    )
    manuscript = manuscript_result.scalars().first()
    if not manuscript:
        return []

    chapter_result = await db.execute(
        select(Chapter).where(Chapter.manuscript_id == manuscript.id).order_by(Chapter.chapter_number.asc())
    )
    return [
        {"id": c.id, "title": c.title, "content": c.content, "chapter_number": c.chapter_number}
        for c in chapter_result.scalars().all()
    ]


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/proxy/image")
async def proxy_image(url: str = Query(...)):
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="Invalid image URL")

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            r = await client.get(url, headers={"User-Agent": "Mozilla/5.0", "Referer": ""})
            r.raise_for_status()
            media_type = r.headers.get("content-type", "image/jpeg")
            return Response(content=r.content, media_type=media_type)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Image fetch failed: {exc}") from exc


@router.post("/projects")
async def create_project(payload: ProjectCreate, db: AsyncSession = Depends(get_db)):
    stored_description = append_manuscript_type(payload.description, payload.manuscript_type)
    project = Project(title=payload.title, description=stored_description, status="draft")
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return {
        "id": project.id,
        "title": project.title,
        "description": clean_description(project.description),
        "manuscript_type": extract_manuscript_type(project.description),
        "status": project.status,
        "created_at": project.created_at,
    }


@router.get("/projects")
async def list_projects(db: AsyncSession = Depends(get_db)):
    data = await dashboard_projects(db)
    return data["projects"]


@router.get("/projects/{project_id}")
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    data = await get_project_detail(db, project_id)
    if not data:
        raise HTTPException(status_code=404, detail="Project not found")
    return data


@router.patch("/projects/{project_id}")
async def update_project(project_id: int, payload: ProjectUpdate, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if payload.title is not None:
        project.title = payload.title.strip() or project.title

    current_type = extract_manuscript_type(project.description)
    new_type = payload.manuscript_type if payload.manuscript_type is not None else current_type
    new_description = payload.description if payload.description is not None else clean_description(project.description)
    project.description = append_manuscript_type(new_description, new_type)

    await db.commit()
    await db.refresh(project)
    return {
        "id": project.id,
        "title": project.title,
        "description": clean_description(project.description),
        "manuscript_type": extract_manuscript_type(project.description),
        "status": project.status,
        "created_at": project.created_at,
    }


@router.delete("/projects/{project_id}")
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()
    return {"message": "Project deleted", "project_id": project_id}


@router.post("/upload")
async def upload_manuscript(
    project_id: int = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    file_path, extension = await save_upload_file(file, project_id)
    project.status = "processing"
    await db.flush()

    result = await process_manuscript(
        db=db,
        project_id=project_id,
        filename=file.filename or "uploaded_file",
        file_path=file_path,
        extension=extension,
    )

    return {
        "message": "Upload and parsing completed",
        "project_id": project_id,
        **result,
    }


@router.delete("/manuscripts/{manuscript_id}")
async def delete_manuscript(manuscript_id: int, db: AsyncSession = Depends(get_db)):
    row = await db.get(Manuscript, manuscript_id)
    if not row:
        raise HTTPException(status_code=404, detail="Manuscript not found")
    project_id = row.project_id
    await db.delete(row)
    await db.commit()
    return {"message": "Manuscript deleted", "manuscript_id": manuscript_id, "project_id": project_id}


@router.post("/workflow/run/{project_id}")
async def run_workflow(project_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await run_full_workflow(db=db, project_id=project_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Workflow failed: {exc}") from exc
    return result


@router.get("/workflow/status/{project_id}")
async def workflow_status(project_id: int, db: AsyncSession = Depends(get_db)):
    return await get_workflow_status(db, project_id)


@router.get("/dashboard/projects")
async def get_dashboard_projects(db: AsyncSession = Depends(get_db)):
    return await dashboard_projects(db)


@router.get("/dashboard/project/{project_id}")
async def get_dashboard_project(project_id: int, db: AsyncSession = Depends(get_db)):
    data = await dashboard_project(db, project_id)
    if not data:
        raise HTTPException(status_code=404, detail="Project not found")
    return data


@router.get("/assets/{project_id}")
async def get_assets(project_id: int, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return await get_assets_grouped(db, project_id)


@router.get("/assets/{project_id}/{asset_type}")
async def get_assets_by_type(project_id: int, asset_type: str, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    grouped = await get_assets_grouped(db, project_id, asset_type=asset_type)
    return grouped.get(asset_type, [])


@router.post("/agents/translate/{project_id}")
async def run_translate_agent(project_id: int, payload: TranslationRequest, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    chapters = await _latest_project_chapters(db, project_id)
    if not chapters:
        raise HTTPException(status_code=400, detail="No parsed manuscript chapters found")

    try:
        translation_payload = build_translation_payload(project.title, chapters, payload.language)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    await save_generated_asset(db, project_id, "translation", translation_payload)
    await db.commit()
    return {
        "status": "completed",
        "asset_type": "translation",
        "language": translation_payload.get("language"),
        "lang_code": translation_payload.get("lang_code"),
        "chapter_count": len(chapters),
    }


@router.post("/agents/cover/{project_id}")
async def run_cover_agent(project_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await run_full_workflow(db=db, project_id=project_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"status": result["status"], "workflow_run_id": result["workflow_run_id"]}


@router.post("/agents/audiobook/{project_id}")
async def run_audiobook_agent(project_id: int, payload: AudiobookRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await run_full_workflow(db=db, project_id=project_id, voice=payload.voice)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"status": result["status"], "workflow_run_id": result["workflow_run_id"]}


@router.post("/agents/ebook/{project_id}")
async def run_ebook_agent(project_id: int, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    chapters = await _latest_project_chapters(db, project_id)
    if not chapters:
        raise HTTPException(status_code=400, detail="No parsed manuscript chapters found")

    genre_hint = extract_manuscript_type(project.description) or "literary"
    payload = build_ebook_payload(project.title, chapters, genre_hint)
    await save_generated_asset(db, project_id, "ebook", payload)
    await db.commit()
    return {"status": "completed", "asset_type": "ebook", "chapter_count": len(chapters)}


@router.post("/projects/{project_id}/finalize-publish")
async def finalize_publish_project(
    project_id: int,
    payload: FinalizePublishRequest,
    db: AsyncSession = Depends(get_db),
):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    grouped_assets = await get_assets_grouped(db, project_id)
    asset_counts = {k: len(v) for k, v in grouped_assets.items()}
    selected_outputs = {
        "summary": payload.include_summary,
        "metadata": payload.include_metadata,
        "translation": payload.include_translation,
        "cover": payload.include_cover,
        "ebook": payload.include_ebook,
        "audiobook": payload.include_audiobook,
    }

    manifest = {
        "project_id": project_id,
        "project_title": project.title,
        "published_status": "published",
        "selected_outputs": selected_outputs,
        "selected_asset_ids": payload.selected_asset_ids,
        "target_channels": payload.target_channels,
        "final_notes": payload.final_notes or "",
        "asset_counts": asset_counts,
    }

    await save_generated_asset(db, project_id, "publish_manifest", manifest)
    project.status = "published"
    await db.commit()
    return {"status": "published", "project_id": project_id, "manifest": manifest}


@router.post("/rag/chat/{project_id}")
async def rag_chat(project_id: int, payload: dict, db: AsyncSession = Depends(get_db)):
    question = payload.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="question is required")
    chunks = await get_project_chunks(db, project_id)
    project_context = await dashboard_project(db, project_id)
    if not project_context:
        raise HTTPException(status_code=404, detail="Project not found")
    return answer_with_context(question, chunks, project_context=project_context)


@router.get("/manuscripts/{manuscript_id}")
async def get_manuscript(manuscript_id: int, db: AsyncSession = Depends(get_db)):
    data = await get_manuscript_detail(db, manuscript_id)
    if not data:
        raise HTTPException(status_code=404, detail="Manuscript not found")
    return data


@router.get("/chapters/{chapter_id}")
async def get_chapter(chapter_id: int, db: AsyncSession = Depends(get_db)):
    data = await get_chapter_detail(db, chapter_id)
    if not data:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return data
