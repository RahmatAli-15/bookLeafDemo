from pydantic import BaseModel


class ProjectCreate(BaseModel):
    title: str
    description: str | None = None
    manuscript_type: str | None = None


class ProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    manuscript_type: str | None = None


class TranslationRequest(BaseModel):
    language: str = "es"


class AudiobookRequest(BaseModel):
    voice: str = "narrator"


class FinalizePublishRequest(BaseModel):
    include_summary: bool = True
    include_metadata: bool = True
    include_translation: bool = False
    include_cover: bool = True
    include_ebook: bool = True
    include_audiobook: bool = False
    target_channels: list[str] = []
    final_notes: str | None = None
    selected_asset_ids: dict[str, int] = {}
