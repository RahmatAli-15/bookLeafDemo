from typing import Any

from app.services.groq_service import generate_json

SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "hinglish": "Hinglish",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "ml": "Malayalam",
    "kn": "Kannada",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ar": "Arabic",
    "ja": "Japanese",
}


def build_translation_payload(project_title: str, chapters: list[dict[str, Any]], lang_code: str) -> dict[str, Any]:
    if lang_code not in SUPPORTED_LANGUAGES:
        raise ValueError("Unsupported language")

    language = SUPPORTED_LANGUAGES[lang_code]
    input_chapters = [
        {
            "chapter_id": chapter["id"],
            "chapter_number": chapter["chapter_number"],
            "title": chapter["title"],
            "content": chapter["content"],
        }
        for chapter in chapters
    ]
    summary_source = "\n\n".join([c["content"][:500] for c in chapters[:2]]) or project_title
    metadata_source = f"Title: {project_title}\nLanguage: {language}\nChapter Count: {len(chapters)}"

    fallback = {
        "language": language,
        "lang_code": lang_code,
        "translated_summary": f"[{language}] {summary_source}",
        "translated_metadata": f"[{language}] {metadata_source}",
        "translated_chapters": [
            {
                "chapter_id": c["chapter_id"],
                "chapter_number": c["chapter_number"],
                "title": f"[{language}] {c['title']}",
                "content": f"[{language}] {c['content']}",
            }
            for c in input_chapters
        ],
    }

    translated = generate_json(
        system_prompt=(
            "You are an expert literary translator. "
            "Translate content naturally and faithfully, preserving structure. "
            "Do not add commentary."
        ),
        user_prompt=(
            f"Translate this manuscript package into {language}.\n"
            "Return JSON keys exactly: language, lang_code, translated_summary, translated_metadata, translated_chapters.\n"
            "translated_chapters must be array of {chapter_id, chapter_number, title, content}.\n\n"
            f"lang_code: {lang_code}\n"
            f"summary_source: {summary_source}\n"
            f"metadata_source: {metadata_source}\n"
            f"chapters: {input_chapters}"
        ),
        fallback=fallback,
        temperature=0.2,
    )

    translated["language"] = language
    translated["lang_code"] = lang_code
    if not isinstance(translated.get("translated_chapters"), list):
        translated["translated_chapters"] = fallback["translated_chapters"]
    return translated
