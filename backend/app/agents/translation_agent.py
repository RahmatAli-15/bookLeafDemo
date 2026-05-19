from typing import Any

from app.services.groq_service import generate_json

LANGUAGES = {
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


def run_translation_agent(state: dict[str, Any]) -> dict[str, Any]:
    code = state.get("target_language", "es")
    language = LANGUAGES.get(code, "Hindi")

    chapter_text = [
        {
            "chapter_id": c["id"],
            "chapter_number": c["chapter_number"],
            "title": c["title"],
            "content": c["content"][:1800],
        }
        for c in state["chapters"][:5]
    ]

    fallback = {
        "language": language,
        "lang_code": code,
        "translated_summary": f"[{language}] Translation unavailable.",
        "translated_metadata": f"[{language}] Metadata translation unavailable.",
        "translated_chapters": [],
    }

    state["outputs"]["translation"] = generate_json(
        system_prompt="You are a translation agent. Preserve structure and formatting.",
        user_prompt=(
            f"Translate manuscript content into {language}. "
            "Return JSON keys: language, lang_code, translated_summary, translated_metadata, translated_chapters. "
            "translated_chapters must be array of {chapter_id, chapter_number, title, content}.\n"
            f"Input chapters:\n{chapter_text}"
        ),
        fallback=fallback,
    )

    return state
