def split_into_chunks(text: str, chunk_size: int = 800, overlap: int = 120) -> list[str]:
    if not text.strip():
        return []

    if overlap >= chunk_size:
        overlap = max(0, chunk_size // 4)

    chunks: list[str] = []
    start = 0
    length = len(text)

    while start < length:
        end = min(start + chunk_size, length)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == length:
            break
        start = max(0, end - overlap)

    return chunks
