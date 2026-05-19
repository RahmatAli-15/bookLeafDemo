from typing import Any

from app.services.groq_service import generate_json


def run_cover_agent(state: dict[str, Any]) -> dict[str, Any]:
    excerpt = "\n\n".join([c["content"][:700] for c in state["chapters"][:3]])
    fallback = {
        "visual_themes": ["cinematic lighting", "minimal contrast"],
        "typography_styles": ["bold serif", "clean sans-serif"],
        "color_palettes": [["#101828", "#F59E0B", "#F8FAFC"]],
        "prompts": {
            "cinematic": f"Cinematic cover for {state['project_title']}",
            "minimalist": f"Minimalist cover for {state['project_title']}",
            "genre_specific": f"Genre-specific cover for {state['project_title']}",
        },
        "cover_concepts": ["symbolic object in dramatic scene"],
    }

    state["outputs"]["cover"] = generate_json(
        system_prompt="You are a cover design ideation agent.",
        user_prompt=(
            "Generate JSON with keys: visual_themes(array), typography_styles(array), color_palettes(array of arrays), "
            "prompts(object with cinematic, minimalist, genre_specific), cover_concepts(array).\n"
            f"Title: {state['project_title']}\nExcerpt:\n{excerpt}"
        ),
        fallback=fallback,
    )
    return state
