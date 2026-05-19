import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.generated_asset import GeneratedAsset


async def save_generated_asset(
    db: AsyncSession,
    project_id: int,
    asset_type: str,
    content: Any,
    meta: dict[str, Any] | None = None,
) -> GeneratedAsset:
    payload = content if isinstance(content, str) else json.dumps(content, ensure_ascii=False, indent=2)
    asset = GeneratedAsset(
        project_id=project_id,
        asset_type=asset_type,
        content=payload,
        meta_json=json.dumps(meta or {}, ensure_ascii=False),
    )
    db.add(asset)
    await db.flush()
    return asset


async def list_assets_by_project(db: AsyncSession, project_id: int) -> list[GeneratedAsset]:
    result = await db.execute(
        select(GeneratedAsset)
        .where(GeneratedAsset.project_id == project_id)
        .order_by(GeneratedAsset.created_at.desc())
    )
    return list(result.scalars().all())
