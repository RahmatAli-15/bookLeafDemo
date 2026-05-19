from urllib.parse import quote

from app.services.groq_service import generate_json


def _image_url_from_prompt(prompt: str, seed: int) -> str:
    encoded = quote(prompt)
    # Public image generation endpoint driven by text prompt.
    return f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1536&seed={seed}&nologo=true"


def build_cover_payload(project_title: str, genre_hint: str = "literary") -> dict:
    fallback = {
        "visual_themes": [
            "Cinematic contrast with atmospheric lighting",
            "Minimalist focal symbol with negative space",
            f"{genre_hint.title()} mood board with textured composition",
        ],
        "typography_styles": [
            "Bold serif title with wide tracking",
            "Modern sans-serif with high contrast subtitle",
            "Elegant condensed serif for premium shelf feel",
        ],
        "color_palettes": [
            ["#101828", "#F59E0B", "#F8FAFC"],
            ["#0F172A", "#E11D48", "#E2E8F0"],
            ["#1F2937", "#22C55E", "#F3F4F6"],
        ],
        "prompts": {
            "cinematic": f"Book cover for '{project_title}', cinematic lighting, dramatic depth, print-ready composition, high detail",
            "minimalist": f"Minimalist book cover for '{project_title}', strong central symbol, clean typography zone, modern aesthetic",
            "genre_specific": f"{genre_hint} novel cover concept for '{project_title}', emotionally resonant, market-ready visual hierarchy",
        },
        "cover_concepts": [
            "Single symbolic object emerging from shadows",
            "Landscape split between conflict and resolution",
            "Character silhouette facing abstract world motif",
        ],
    }

    generated = generate_json(
        system_prompt="You are a creative book cover director.",
        user_prompt=(
            "Return JSON with keys: visual_themes(array), typography_styles(array), color_palettes(array of arrays), "
            "prompts(object with cinematic, minimalist, genre_specific), cover_concepts(array)."
            f"\nTitle: {project_title}\nGenre Hint: {genre_hint}"
        ),
        fallback=fallback,
    )

    prompts = generated.get("prompts", fallback["prompts"])
    image_renders = {
        "cinematic": _image_url_from_prompt(prompts.get("cinematic", fallback["prompts"]["cinematic"]), 11),
        "minimalist": _image_url_from_prompt(prompts.get("minimalist", fallback["prompts"]["minimalist"]), 22),
        "genre_specific": _image_url_from_prompt(prompts.get("genre_specific", fallback["prompts"]["genre_specific"]), 33),
    }

    generated["image_renders"] = image_renders
    generated["image_note"] = "Image URLs generated from Groq-crafted prompts."
    return generated
