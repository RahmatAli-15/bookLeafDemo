def build_style_reference(genre_hint: str | None) -> str:
    genre = (genre_hint or "").strip().lower()
    if "fairy" in genre or "fantasy" in genre or "moon" in genre:
        return (
            "Reference style guide (do not copy text, only follow tone/pattern): "
            "lyrical fairytale prose, magical kingdom worldbuilding, emotionally warm hero journey, "
            "clear chapter beats, cinematic moonlit imagery, wonder + danger balance, hopeful ending."
        )
    return (
        "Reference style guide: strong narrative clarity, vivid imagery, emotional character arc, "
        "structured pacing, and commercially publishable tone."
    )
