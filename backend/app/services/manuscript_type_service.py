TYPE_PREFIX = "[ManuscriptType]"


def append_manuscript_type(description: str | None, manuscript_type: str | None) -> str | None:
    base = (description or "").strip()
    mtype = (manuscript_type or "").strip()
    if not mtype:
        return base or None
    if base:
        return f"{base}\n{TYPE_PREFIX} {mtype}"
    return f"{TYPE_PREFIX} {mtype}"


def extract_manuscript_type(description: str | None) -> str | None:
    if not description:
        return None
    for line in description.splitlines():
        current = line.strip()
        if current.startswith(TYPE_PREFIX):
            value = current.replace(TYPE_PREFIX, "", 1).strip()
            return value or None
    return None


def clean_description(description: str | None) -> str | None:
    if not description:
        return None
    cleaned = [line for line in description.splitlines() if not line.strip().startswith(TYPE_PREFIX)]
    text = "\n".join(cleaned).strip()
    return text or None
