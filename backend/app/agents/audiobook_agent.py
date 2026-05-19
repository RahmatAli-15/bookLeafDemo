from typing import Any

from app.services.audiobook_service import generate_chapter_audio_files
from app.services.groq_service import generate_json


VOICE_CHOICES = [
    "narrator",
    "male",
    "female",
    "calm",
    "motivated",
    "angry",
    "dramatic",
    "whisper",
    "energetic",
]


def run_audiobook_agent(state: dict[str, Any]) -> dict[str, Any]:
    preview = [
        {"chapter_number": c["chapter_number"], "title": c["title"], "content": c["content"][:500]}
        for c in state["chapters"][:3]
    ]

    requested_voice = state.get("voice", "narrator")
    if requested_voice not in VOICE_CHOICES:
        requested_voice = "narrator"

    voice_plan = generate_json(
        system_prompt="You are an audiobook production planning agent.",
        user_prompt=(
            "Generate JSON with voice_style, pacing_notes, narration_notes based on chapters.\n"
            f"Voice requested: {requested_voice}\nChapters:\n{preview}"
        ),
        fallback={
            "voice_style": requested_voice,
            "pacing_notes": "balanced",
            "narration_notes": "clear and expressive",
        },
    )

    audios = generate_chapter_audio_files(
        project_id=state["project_id"],
        chapters=state["chapters"],
        voice=requested_voice,
        audio_dir=state["audio_dir"],
    )

    state["outputs"]["audiobook"] = {
        "voice": requested_voice,
        "voice_plan": voice_plan,
        "available_voices": VOICE_CHOICES,
        "chapters": audios,
    }
    return state
