from __future__ import annotations

import re
from typing import Any

from app.services.groq_service import generate_json
from app.services.style_reference_service import build_style_reference


def _slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", value).strip("_")
    return cleaned.lower() or "book"


def _normalize_text(value: str) -> str:
    return value.replace("â€”", "-").replace("â€“", "-").replace("’", "'").strip()


def _split_embedded_chapters(chapters: list[dict[str, Any]]) -> list[dict[str, Any]]:
    split_pattern = re.compile(
        r"(?im)^\s*chapter\s+(\d+)\s*[-—:]\s*(.+?)\s*$"
    )
    normalized: list[dict[str, Any]] = []

    for chapter in chapters:
        content = _normalize_text(chapter.get("content", ""))
        title = _normalize_text(chapter.get("title", "Untitled"))
        matches = list(split_pattern.finditer(content))
        if not matches:
            normalized.append(
                {
                    "chapter_number": chapter.get("chapter_number", len(normalized) + 1),
                    "title": title,
                    "content": content,
                }
            )
            continue

        for index, match in enumerate(matches):
            start = match.end()
            end = matches[index + 1].start() if index + 1 < len(matches) else len(content)
            body = content[start:end].strip()
            heading_number = int(match.group(1))
            heading_title = _normalize_text(match.group(2))
            normalized.append(
                {
                    "chapter_number": heading_number,
                    "title": heading_title or f"Chapter {heading_number}",
                    "content": body or "Content unavailable.",
                }
            )

    normalized.sort(key=lambda item: int(item["chapter_number"]))
    for i, item in enumerate(normalized, start=1):
        item["chapter_number"] = i
    return normalized


def _build_markdown_book(project_title: str, chapters: list[dict[str, Any]], front_matter: dict[str, str]) -> str:
    lines = [
        f"# {project_title}",
        "",
        f"**Subtitle:** {front_matter.get('subtitle', '')}",
        f"**Tagline:** {front_matter.get('tagline', '')}",
        "",
        "## Introduction",
        front_matter.get("introduction", ""),
        "",
        "## Copyright",
        front_matter.get("copyright_notice", ""),
        "",
        "## Table of Contents",
    ]
    for chapter in chapters:
        lines.append(f"- Chapter {chapter['chapter_number']}: {chapter['title']}")

    for chapter in chapters:
        lines.extend(
            [
                "",
                f"## Chapter {chapter['chapter_number']} - {chapter['title']}",
                "",
                _normalize_text(chapter["content"]),
            ]
        )

    lines.extend(["", "## About the Author", front_matter.get("about_author", "")])
    return "\n".join(lines).strip()


def _with_page_numbers(chapter_html_pages: list[str], start_page: int) -> str:
    rendered: list[str] = []
    for index, section in enumerate(chapter_html_pages):
        page_no = start_page + index
        rendered.append(f"{section}<div class='page-number'>{page_no}</div></section>")
    return "".join(rendered)


def build_ebook_payload(project_title: str, chapters: list[dict[str, Any]], genre_hint: str = "literary") -> dict[str, Any]:
    chapters = _split_embedded_chapters(chapters)
    style_reference = build_style_reference(genre_hint)
    fallback_front_matter = {
        "subtitle": f"A {genre_hint.title()} Manuscript",
        "tagline": "A professionally packaged reading experience",
        "copyright_notice": f"Copyright (c) {project_title}. All rights reserved.",
        "description": f"{project_title} prepared as a professional eBook package.",
        "introduction": f"Welcome to {project_title}. This edition opens with a curated reading path and polished front matter.",
        "about_author": "The author is a passionate storyteller dedicated to crafting immersive and meaningful narratives.",
    }

    front_matter = generate_json(
        system_prompt="You are a professional publishing editor preparing front matter for an ebook.",
        user_prompt=(
            "Return JSON keys: subtitle, tagline, copyright_notice, description, introduction, about_author.\n"
            f"Title: {project_title}\n"
            f"Genre Hint: {genre_hint}\n"
            f"{style_reference}\n"
            "Use reference style direction only, do not copy specific text."
        ),
        fallback=fallback_front_matter,
    )

    toc = [
        {
            "chapter_number": chapter["chapter_number"],
            "title": chapter["title"],
            "anchor": f"chapter-{chapter['chapter_number']}",
        }
        for chapter in chapters
    ]

    slug = _slugify(project_title)
    markdown_book = _build_markdown_book(project_title, chapters, front_matter)

    chapter_pages = []
    for chapter in chapters:
        chapter_html = _normalize_text(chapter["content"]).replace("\n", "<br/>")
        chapter_pages.append(
            "<section class='book-page chapter-page' "
            f"id='chapter-{chapter['chapter_number']}'><h2>Chapter {chapter['chapter_number']} - {chapter['title']}</h2><p>{chapter_html}</p>"
        )

    html_book = (
        "<!doctype html><html><head><meta charset='utf-8'/>"
        f"<title>{project_title}</title>"
        "<style>"
        "@page{size:A4;margin:22mm 18mm 18mm 18mm;}"
        "*{box-sizing:border-box;}"
        "body{font-family:Georgia,serif;line-height:1.7;color:#1f2937;background:#f8fafc;margin:0;padding:24px;}"
        ".book-page{background:#fff;max-width:820px;margin:0 auto 20px;padding:48px 56px 36px;border:1px solid #e5e7eb;"
        "border-radius:8px;min-height:1040px;position:relative;page-break-after:always;}"
        ".cover-page{display:flex;flex-direction:column;justify-content:center;text-align:center;gap:12px;}"
        ".cover-page h1{font-size:42px;line-height:1.2;margin:0;color:#9f1239;}"
        ".cover-page .subtitle{font-size:20px;color:#475569;margin:0;}"
        ".cover-page .tagline{font-size:16px;color:#64748b;margin:0;}"
        "h1,h2{color:#9f1239;margin-top:0;} h2{font-size:30px;} p{font-size:16px;}"
        "ul{padding-left:20px;} .page-number{position:absolute;bottom:12px;left:0;right:0;text-align:center;color:#64748b;font-size:13px;}"
        "@media print{body{background:#fff;padding:0;} .book-page{border:none;border-radius:0;margin:0;min-height:auto;page-break-after:always;}}"
        "</style></head><body>"
        f"<section class='book-page cover-page'><h1>{project_title}</h1>"
        f"<p class='subtitle'>{front_matter.get('subtitle', '')}</p>"
        f"<p class='tagline'>{front_matter.get('tagline', '')}</p><div class='page-number'>1</div></section>"
        "<section class='book-page'><h2>Introduction</h2>"
        f"<p>{front_matter.get('introduction', '')}</p><div class='page-number'>2</div></section>"
        "<section class='book-page'><h2>Table of Contents</h2><ul>"
        + "".join([f"<li>Chapter {item['chapter_number']}: {item['title']}</li>" for item in toc])
        + "</ul><div class='page-number'>3</div></section>"
        + _with_page_numbers(chapter_pages, 4)
        + "<section class='book-page'><h2>About the Author</h2>"
        f"<p>{front_matter.get('about_author', '')}</p>"
        f"<p>{front_matter.get('copyright_notice', '')}</p>"
        f"<div class='page-number'>{len(chapters) + 4}</div></section>"
        + "</body></html>"
    )

    return {
        "title": project_title,
        "genre_hint": genre_hint,
        "front_matter": front_matter,
        "table_of_contents": toc,
        "chapter_count": len(chapters),
        "export_files": {
            "epub": f"{slug}.epub",
            "pdf": f"{slug}.pdf",
            "mobi": f"{slug}.mobi",
            "html": f"{slug}.html",
            "markdown": f"{slug}.md",
        },
        "production_notes": [
            "Use markdown/html output as source for EPUB conversion.",
            "Validate chapter headings and table of contents before distribution.",
            "Embed cover, metadata, and ISBN in final publishing toolchain.",
        ],
        "markdown_book": markdown_book,
        "html_book": html_book,
    }
