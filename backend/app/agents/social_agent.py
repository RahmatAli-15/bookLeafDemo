from typing import Any

from app.services.groq_service import generate_json


def run_social_agent(state: dict[str, Any]) -> dict[str, Any]:
    text = "\n\n".join([c["content"][:600] for c in state["chapters"][:2]])
    fallback = {
        "instagram_captions": [f"Discover {state['project_title']} with BookAI."],
        "twitter_posts": [f"New manuscript: {state['project_title']} #BookAI"],
        "hashtags": ["#BookAI", "#Writers"],
    }

    state["outputs"]["social"] = generate_json(
        system_prompt="You are a social media marketing agent for book launches.",
        user_prompt=(
            "Create JSON with instagram_captions (array), twitter_posts (array), hashtags (array).\n"
            f"Title: {state['project_title']}\nExcerpt:\n{text}"
        ),
        fallback=fallback,
    )
    return state
