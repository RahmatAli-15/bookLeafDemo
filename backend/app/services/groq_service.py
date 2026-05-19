import json
from typing import Any

import httpx

from app.utils.config import settings

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def _call_groq(messages: list[dict[str, str]], temperature: float = 0.3) -> str:
    if not settings.groq_api_key:
        return ""

    payload = {
        "model": settings.groq_model,
        "messages": messages,
        "temperature": temperature,
    }

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=60.0) as client:
        response = client.post(GROQ_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()


def generate_text(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:
    return _call_groq(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
    )


def generate_json(system_prompt: str, user_prompt: str, fallback: dict[str, Any], temperature: float = 0.2) -> dict[str, Any]:
    raw = _call_groq(
        messages=[
            {"role": "system", "content": system_prompt + " Return valid JSON only."},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
    )

    if not raw:
        return fallback

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(raw[start : end + 1])
            except json.JSONDecodeError:
                return fallback
        return fallback
