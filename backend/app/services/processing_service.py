from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chapter import Chapter
from app.models.chunk import Chunk
from app.models.manuscript import Manuscript
from app.models.project import Project
from app.services.manuscript_type_service import clean_description, extract_manuscript_type
from app.services.parser_service import detect_chapters, extract_text
from app.utils.chunking import split_into_chunks
from app.utils.config import settings


async def process_manuscript(
    db: AsyncSession,
    project_id: int,
    filename: str,
    file_path: str,
    extension: str,
) -> dict:
    full_text = extract_text(file_path=file_path, extension=extension)

    manuscript = Manuscript(
        project_id=project_id,
        filename=filename,
        file_path=file_path,
        content=full_text,
    )
    db.add(manuscript)
    await db.flush()

    chapters_payload = detect_chapters(full_text)
    chapter_rows: list[Chapter] = []

    for chapter_data in chapters_payload:
        chapter = Chapter(
            manuscript_id=manuscript.id,
            title=chapter_data["title"] or "Untitled",
            content=chapter_data["content"],
            chapter_number=chapter_data["chapter_number"],
        )
        db.add(chapter)
        chapter_rows.append(chapter)

    await db.flush()

    total_chunks = 0
    for chapter in chapter_rows:
        chunks = split_into_chunks(chapter.content, chunk_size=settings.chunk_size, overlap=settings.chunk_overlap)
        for idx, chunk_text in enumerate(chunks):
            db.add(Chunk(chapter_id=chapter.id, content=chunk_text, chunk_index=idx))
        total_chunks += len(chunks)

    project = await db.get(Project, project_id)
    if not project:
        raise ValueError("Project not found")

    project.status = "parsed"

    await db.commit()
    await db.refresh(manuscript)

    return {
        "manuscript_id": manuscript.id,
        "chapters": len(chapters_payload),
        "chunks": total_chunks,
    }


async def get_project_detail(db: AsyncSession, project_id: int):
    project = await db.get(Project, project_id)
    if not project:
        return None

    manuscripts_query = (
        select(Manuscript)
        .where(Manuscript.project_id == project_id)
        .order_by(Manuscript.created_at.desc())
    )
    manuscripts_result = await db.execute(manuscripts_query)
    manuscripts = list(manuscripts_result.scalars().all())

    manuscript_ids = [m.id for m in manuscripts]
    chapter_map: dict[int, list[Chapter]] = {mid: [] for mid in manuscript_ids}

    if manuscript_ids:
        chapters_result = await db.execute(
            select(Chapter)
            .where(Chapter.manuscript_id.in_(manuscript_ids))
            .order_by(Chapter.chapter_number.asc())
        )
        for chapter in chapters_result.scalars().all():
            chapter_map.setdefault(chapter.manuscript_id, []).append(chapter)

    return {
        "id": project.id,
        "title": project.title,
        "description": clean_description(project.description),
        "manuscript_type": extract_manuscript_type(project.description),
        "status": project.status,
        "created_at": project.created_at,
        "manuscripts": [
            {
                "id": m.id,
                "filename": m.filename,
                "file_path": m.file_path,
                "created_at": m.created_at,
                "chapter_count": len(chapter_map.get(m.id, [])),
                "chapters": [
                    {
                        "id": ch.id,
                        "title": ch.title,
                        "chapter_number": ch.chapter_number,
                        "content_preview": ch.content[:220],
                    }
                    for ch in chapter_map.get(m.id, [])
                ],
            }
            for m in manuscripts
        ],
    }


async def get_manuscript_detail(db: AsyncSession, manuscript_id: int):
    query = (
        select(Manuscript)
        .options(selectinload(Manuscript.chapters).selectinload(Chapter.chunks))
        .where(Manuscript.id == manuscript_id)
    )
    result = await db.execute(query)
    manuscript = result.scalar_one_or_none()
    if not manuscript:
        return None

    ordered_chapters = sorted(manuscript.chapters, key=lambda x: x.chapter_number)

    return {
        "id": manuscript.id,
        "project_id": manuscript.project_id,
        "filename": manuscript.filename,
        "file_path": manuscript.file_path,
        "created_at": manuscript.created_at,
        "chapters": [
            {
                "id": chapter.id,
                "title": chapter.title,
                "chapter_number": chapter.chapter_number,
                "content": chapter.content,
                "chunks": [
                    {"id": c.id, "chunk_index": c.chunk_index, "content": c.content}
                    for c in sorted(chapter.chunks, key=lambda x: x.chunk_index)
                ],
            }
            for chapter in ordered_chapters
        ],
    }


async def get_chapter_detail(db: AsyncSession, chapter_id: int):
    query = select(Chapter).options(selectinload(Chapter.chunks)).where(Chapter.id == chapter_id)
    result = await db.execute(query)
    chapter = result.scalar_one_or_none()
    if not chapter:
        return None

    chunks = sorted(chapter.chunks, key=lambda x: x.chunk_index)
    return {
        "id": chapter.id,
        "manuscript_id": chapter.manuscript_id,
        "title": chapter.title,
        "chapter_number": chapter.chapter_number,
        "content": chapter.content,
        "chunks": [{"id": c.id, "chunk_index": c.chunk_index, "content": c.content} for c in chunks],
    }
