from pathlib import Path
import wave

import pyttsx3


VOICE_ALIASES = {
    "narrator": "",
    "male": "male",
    "female": "female",
    "calm": "",
    "motivated": "",
    "angry": "",
    "dramatic": "",
    "whisper": "",
    "energetic": "",
}

VOICE_STYLE_SETTINGS = {
    "narrator": {"base_voice": "narrator", "rate_delta": -20, "volume": 1.0},
    "male": {"base_voice": "male", "rate_delta": -15, "volume": 1.0},
    "female": {"base_voice": "female", "rate_delta": -15, "volume": 1.0},
    "calm": {"base_voice": "narrator", "rate_delta": -35, "volume": 0.9},
    "motivated": {"base_voice": "narrator", "rate_delta": 5, "volume": 1.0},
    "angry": {"base_voice": "male", "rate_delta": 18, "volume": 1.0},
    "dramatic": {"base_voice": "narrator", "rate_delta": -5, "volume": 1.0},
    "whisper": {"base_voice": "female", "rate_delta": -28, "volume": 0.55},
    "energetic": {"base_voice": "female", "rate_delta": 22, "volume": 1.0},
}


def _pick_voice(engine: pyttsx3.Engine, requested_voice: str) -> str | None:
    voices = engine.getProperty("voices") or []
    if not voices:
        return None

    req = VOICE_ALIASES.get(requested_voice.lower(), requested_voice.lower())
    if not req:
        return voices[0].id

    for voice in voices:
        label = f"{voice.id} {getattr(voice, 'name', '')}".lower()
        if req in label:
            return voice.id

    return voices[0].id


def _estimate_wav_duration_seconds(wav_path: Path) -> float:
    try:
        with wave.open(str(wav_path), "rb") as wf:
            frames = wf.getnframes()
            rate = wf.getframerate() or 1
            return round(frames / float(rate), 2)
    except Exception:
        return 0.0


def generate_chapter_audio_files(project_id: int, chapters: list[dict], voice: str, audio_dir: str) -> list[dict]:
    path = Path(audio_dir)
    path.mkdir(parents=True, exist_ok=True)

    engine = pyttsx3.init()
    style = VOICE_STYLE_SETTINGS.get(voice.lower(), VOICE_STYLE_SETTINGS["narrator"])
    requested_base_voice = style.get("base_voice", "narrator")
    selected_voice_id = _pick_voice(engine, requested_base_voice)
    if selected_voice_id:
        engine.setProperty("voice", selected_voice_id)

    # Apply style-specific speaking profile while preserving intelligibility.
    current_rate = engine.getProperty("rate")
    if isinstance(current_rate, int):
        engine.setProperty("rate", max(110, min(260, current_rate + int(style.get("rate_delta", -20)))))

    current_volume = engine.getProperty("volume")
    target_volume = float(style.get("volume", 1.0))
    if isinstance(current_volume, (float, int)):
        engine.setProperty("volume", max(0.2, min(1.0, target_volume)))

    assets = []
    for chapter in chapters:
        filename = f"project_{project_id}_chapter_{chapter['chapter_number']}_{voice}.wav"
        file_path = path / filename
        chapter_text = (chapter.get("content") or "").strip()
        if not chapter_text:
            chapter_text = f"Chapter {chapter['chapter_number']} has no content."

        spoken_text = f"Chapter {chapter['chapter_number']}. {chapter['title']}. {chapter_text}"
        engine.save_to_file(spoken_text, str(file_path))
        engine.runAndWait()

        assets.append(
            {
                "chapter_id": chapter["id"],
                "chapter_number": chapter["chapter_number"],
                "title": chapter["title"],
                "voice": voice,
                "voice_id": selected_voice_id,
                "audio_file": str(file_path),
                "audio_format": "wav",
                "duration_seconds": _estimate_wav_duration_seconds(file_path),
                "text_length": len(chapter_text),
            }
        )

    engine.stop()
    return assets
