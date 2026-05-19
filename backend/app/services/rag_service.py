from collections import Counter

from app.services.groq_service import generate_text


def _score_overlap(question: str, text: str) -> int:
    q_tokens = [t.lower() for t in question.split() if t.strip()]
    t_tokens = [t.lower() for t in text.split() if t.strip()]
    if not q_tokens or not t_tokens:
        return 0
    q_count = Counter(q_tokens)
    t_count = Counter(t_tokens)
    return sum(min(q_count[k], t_count.get(k, 0)) for k in q_count)


def _project_context_block(project_context: dict) -> str:
    manuscripts = project_context.get("manuscripts", []) or []
    manuscript_lines = []
    for m in manuscripts[:8]:
        manuscript_lines.append(
            f"- {m.get('filename', 'Untitled')} (chapters: {m.get('chapter_count', 0)})"
        )

    asset_counts = project_context.get("asset_counts", {}) or {}
    asset_lines = [f"- {k}: {v}" for k, v in asset_counts.items()]

    assets = project_context.get("assets", {}) or {}
    summary_asset = (assets.get("summary", []) or [{}])[0]
    metadata_asset = (assets.get("metadata", []) or [{}])[0]
    translation_asset = (assets.get("translation", []) or [{}])[0]
    grammar_asset = (assets.get("grammar", []) or [{}])[0]
    cover_asset = (assets.get("cover", []) or [{}])[0]
    ebook_asset = (assets.get("ebook", []) or [{}])[0]
    audiobook_asset = (assets.get("audiobook", []) or [{}])[0]

    summary_text = summary_asset.get("content", {})
    short_summary = ""
    if isinstance(summary_text, dict):
        short_summary = summary_text.get("short_summary", "")

    metadata_text = metadata_asset.get("content", {})
    genre = ""
    keywords = []
    if isinstance(metadata_text, dict):
        genre = metadata_text.get("genre", "")
        keywords = metadata_text.get("keywords", []) or []

    translation_text = translation_asset.get("content", {})
    translation_lang = ""
    if isinstance(translation_text, dict):
        translation_lang = translation_text.get("language", "")

    grammar_text = grammar_asset.get("content", {})
    grammar_score = ""
    grammar_issues = 0
    if isinstance(grammar_text, dict):
        grammar_score = grammar_text.get("overall_score", "")
        grammar_issues = len(grammar_text.get("issues", []) or [])

    cover_text = cover_asset.get("content", {})
    cover_themes = []
    if isinstance(cover_text, dict):
        cover_themes = cover_text.get("visual_themes", []) or []

    ebook_text = ebook_asset.get("content", {})
    ebook_chapters = ""
    ebook_formats = []
    if isinstance(ebook_text, dict):
        ebook_chapters = ebook_text.get("chapter_count", "")
        ebook_formats = list((ebook_text.get("export_files", {}) or {}).keys())

    audiobook_text = audiobook_asset.get("content", {})
    audiobook_voice = ""
    audiobook_chapters = 0
    if isinstance(audiobook_text, dict):
        audiobook_voice = audiobook_text.get("voice", "")
        audiobook_chapters = len(audiobook_text.get("chapters", []) or [])

    return (
        f"Project title: {project_context.get('title', '')}\n"
        f"Project description: {project_context.get('description', '')}\n"
        f"Manuscript type: {project_context.get('manuscript_type', '')}\n"
        f"Project status: {project_context.get('status', '')}\n"
        f"Manuscripts:\n{chr(10).join(manuscript_lines) if manuscript_lines else '- None'}\n"
        f"Generated asset counts:\n{chr(10).join(asset_lines) if asset_lines else '- None'}\n"
        f"Summary snippet: {short_summary}\n"
        f"Metadata genre: {genre}\n"
        f"Metadata keywords: {', '.join(keywords[:10]) if keywords else '-'}\n"
        f"Latest translation language: {translation_lang or '-'}\n"
        f"Grammar score: {grammar_score if grammar_score != '' else '-'} | issue count: {grammar_issues}\n"
        f"Cover themes: {', '.join(cover_themes[:6]) if cover_themes else '-'}\n"
        f"Ebook chapters: {ebook_chapters if ebook_chapters != '' else '-'} | formats: {', '.join(ebook_formats) if ebook_formats else '-'}\n"
        f"Audiobook voice: {audiobook_voice or '-'} | chapters: {audiobook_chapters}"
    )


def answer_with_context(question: str, chunks: list[dict], project_context: dict | None = None) -> dict:
    scored = []
    for chunk in chunks:
        score = _score_overlap(question, chunk.get("content", ""))
        scored.append((score, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    best = [item[1] for item in scored[:5] if item[0] > 0]
    if not best and scored:
        best = [item[1] for item in scored[:2]]

    project_context = project_context or {}

    if not best and not project_context:
        return {
            "answer": "I could not find enough project data yet. Upload a manuscript or run the workflow, then ask again.",
            "contexts": [],
        }

    contexts = [b["content"][:700] for b in best]
    project_block = _project_context_block(project_context) if project_context else ""
    context_block = "\n\n".join(contexts)
    answer = ""
    try:
        answer = generate_text(
            system_prompt=(
                "You are a personalized publishing assistant for this user. "
                "Answer questions about the user's project, manuscript, chapters, generated assets, and workflow status. "
                "Use only the provided context. If something is missing, clearly say what data is unavailable. "
                "Write in clear, practical style with short sections and action-oriented guidance."
            ),
            user_prompt=(
                f"Question: {question}\n\n"
                f"Project Context:\n{project_block}\n\n"
                f"Manuscript Context:\n{context_block}\n\n"
                "Return answer in this format:\n"
                "1) Direct Answer\n"
                "2) Supporting Details From Project\n"
                "3) Suggested Next Steps (2-4 bullets)\n"
            ),
            temperature=0.2,
        )
    except Exception:  # noqa: BLE001
        answer = ""

    if not answer:
        fallback_context = " ".join(contexts)[:900] if contexts else project_block[:900]
        answer = (
            "1) Direct Answer\n"
            "I am currently rate-limited by the AI provider, so here is the best available project context.\n\n"
            "2) Supporting Details From Project\n"
            f"{fallback_context or 'No additional project context available yet.'}\n\n"
            "3) Suggested Next Steps\n"
            "- Try your question again in 20-40 seconds.\n"
            "- Narrow the question to one area (summary, metadata, translation, cover, ebook).\n"
            "- Ensure latest workflow outputs are generated for richer answers."
        )

    return {"answer": answer, "contexts": contexts, "project": {"title": project_context.get("title"), "status": project_context.get("status")}}
