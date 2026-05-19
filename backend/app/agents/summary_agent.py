from typing import Any

from app.services.groq_service import generate_json
from app.services.style_reference_service import build_style_reference


def run_summary_agent(state: dict[str, Any]) -> dict[str, Any]:
    text = "\n\n".join([c["content"][:1500] for c in state["chapters"][:4]])
    style_reference = build_style_reference(state.get("genre_hint"))
    fallback = {
        "short_summary": "Summary unavailable.",
        "detailed_synopsis": "Synopsis unavailable.",
        "back_cover_blurb": "Blurb unavailable.",
    }

    state["outputs"]["summary"] = generate_json(
        system_prompt="You are a book publishing summary agent.",
        user_prompt=(
            "Create a short_summary, detailed_synopsis, and back_cover_blurb from this manuscript excerpt:\n\n"
            f"{text}\n\n"
            f"{style_reference}\n"
            "Use this as a style reference only. Do not copy exact wording."
        ),
        fallback=fallback,
    )
    return state
