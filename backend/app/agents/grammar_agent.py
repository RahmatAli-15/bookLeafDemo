from typing import Any

from app.services.groq_service import generate_json


def run_grammar_agent(state: dict[str, Any]) -> dict[str, Any]:
    chapters = state.get("chapters", [])
    excerpt = [
        {
            "chapter_number": c.get("chapter_number"),
            "title": c.get("title"),
            "content": (c.get("content") or "")[:1200],
        }
        for c in chapters[:4]
    ]

    fallback = {
        "overall_score": 7.5,
        "issues": [
            {"type": "grammar", "severity": "medium", "example": "Sentence agreement issue", "suggestion": "Adjust subject-verb agreement."},
        ],
        "improved_excerpt": "Improved excerpt unavailable.",
        "style_notes": ["Keep tense consistent", "Shorten very long sentences"],
    }

    output = generate_json(
        system_prompt="You are a professional grammar and style editor for books.",
        user_prompt=(
            "Review the manuscript excerpt and return JSON with keys: "
            "overall_score (0-10), issues (array of {type,severity,example,suggestion}), "
            "improved_excerpt (string), style_notes (array).\n"
            f"Excerpt:\n{excerpt}"
        ),
        fallback=fallback,
    )

    state["outputs"]["grammar"] = output
    return state
