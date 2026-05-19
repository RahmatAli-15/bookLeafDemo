import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.generated_asset import GeneratedAsset


async def get_assets_grouped(db: AsyncSession, project_id: int, asset_type: str | None = None):
    query = select(GeneratedAsset).where(GeneratedAsset.project_id == project_id).order_by(GeneratedAsset.created_at.desc())
    if asset_type:
        query = query.where(GeneratedAsset.asset_type == asset_type)

    result = await db.execute(query)
    rows = result.scalars().all()

    grouped: dict[str, list] = {}
    for row in rows:
        content = row.content
        if content.startswith("{") or content.startswith("["):
            try:
                content = json.loads(content)
            except json.JSONDecodeError:
                pass

        grouped.setdefault(row.asset_type, []).append(
            {
                "id": row.id,
                "asset_type": row.asset_type,
                "content": content,
                "meta_json": row.meta_json,
                "created_at": row.created_at,
            }
        )

    return grouped
