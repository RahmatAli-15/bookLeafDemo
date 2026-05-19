import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.utils.config import settings

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt"}


def _validate_file(file: UploadFile) -> str:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    extension = Path(file.filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file format. Use PDF, DOCX, or TXT")

    return extension


async def save_upload_file(file: UploadFile, project_id: int) -> tuple[str, str]:
    extension = _validate_file(file)

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    unique_name = f"project_{project_id}_{uuid.uuid4().hex}{extension}"
    destination = upload_dir / unique_name

    content = await file.read()
    destination.write_bytes(content)

    return str(destination), extension
