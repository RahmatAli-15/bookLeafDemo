from typing import Any

from app.services.groq_service import generate_json
from app.services.style_reference_service import build_style_reference


def run_metadata_agent(state: dict[str, Any]) -> dict[str, Any]:
    text = "\n\n".join([c["content"][:700] for c in state["chapters"][:3]])
    style_reference = build_style_reference(state.get("genre_hint"))
    fallback = {
        "genre": state.get("genre_hint", "literary"),
        "keywords": ["publishing", "book", "manuscript", "ai"],
        "themes": ["growth", "conflict"],
        "target_audience": "General readers",
    }

    state["outputs"]["metadata"] = generate_json(
        system_prompt="You are a metadata extraction agent for books.",
        user_prompt=(
            "Generate JSON with keys: genre, keywords (array), themes (array), target_audience.\n"
            f"Project title: {state['project_title']}\n"
            f"{style_reference}\n"
            "Use style reference for genre/theme direction, not for copying text.\n"
            f"Excerpt:\n{text}"
        ),
        fallback=fallback,
    )
    return state
