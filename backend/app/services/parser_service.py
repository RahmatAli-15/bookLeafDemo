import re
from typing import Any

from docx import Document
from pypdf import PdfReader


def extract_text_from_txt(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def extract_text_from_pdf(path: str) -> str:
    reader = PdfReader(path)
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages)


def extract_text_from_docx(path: str) -> str:
    document = Document(path)
    paragraphs = [p.text for p in document.paragraphs]
    return "\n".join(paragraphs)


def extract_text(file_path: str, extension: str) -> str:
    ext = extension.lower()
    if ext == ".txt":
        return extract_text_from_txt(file_path)
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    if ext == ".docx":
        return extract_text_from_docx(file_path)
    raise ValueError("Unsupported file format")


def detect_chapters(full_text: str) -> list[dict[str, Any]]:
    normalized = full_text.replace("\r\n", "\n").strip()
    lines = normalized.split("\n")

    chapter_pattern = re.compile(r"^(chapter\s+\d+|ch\.?\s*\d+|#\s+.+)$", re.IGNORECASE)
    chapters: list[dict[str, Any]] = []

    current_title = "Introduction"
    current_lines: list[str] = []
    chapter_number = 1

    for line in lines:
        stripped = line.strip()
        if chapter_pattern.match(stripped) and current_lines:
            chapters.append(
                {
                    "title": current_title,
                    "content": "\n".join(current_lines).strip(),
                    "chapter_number": chapter_number,
                }
            )
            chapter_number += 1
            current_title = stripped
            current_lines = []
        elif chapter_pattern.match(stripped):
            current_title = stripped
        else:
            current_lines.append(line)

    if current_lines:
        chapters.append(
            {
                "title": current_title,
                "content": "\n".join(current_lines).strip(),
                "chapter_number": chapter_number,
            }
        )

    if not chapters:
        return [{"title": "Chapter 1", "content": normalized, "chapter_number": 1}]

    return chapters
