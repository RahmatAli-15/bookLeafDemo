import { useEffect, useRef, useState } from "react";
import { IconRag } from "./Icons";
import { apiService } from "../services/api";

export default function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [projectOpen, setProjectOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const projectRef = useRef(null);
  const quickPrompts = [
    "What is the current project status and next best step?",
    "Give me a snapshot of latest summary, metadata, and translation.",
    "Share a quality checklist before publishing.",
    "Suggest social content ideas for this manuscript.",
  ];

  useEffect(() => {
    apiService.listProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    const onDocClick = (event) => {
      if (!projectRef.current?.contains(event.target)) {
        setProjectOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const ask = async (e) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || !projectId || loading) return;
    setQuestion("");
    setLoading(true);
    try {
      const response = await apiService.ragChat(projectId, q);
      setHistory((prev) => [{ question: q, answer: response.answer || "No answer available." }, ...prev]);
    } catch (error) {
      setHistory((prev) => [{ question: q, answer: `Error: ${error.message}` }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!open && showHint && (
        <div className="mb-3 ml-auto w-64 rounded-xl border border-rose-200 bg-white p-3 shadow-xl">
          <div className="mb-1 flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-rose-700">Personalized Assistant</p>
            <button
              type="button"
              onClick={() => setShowHint(false)}
              className="rounded px-1 text-xs text-slate-500 hover:bg-slate-100"
              aria-label="Hide assistant hint"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-slate-600">Need help? Ask me about your project, summaries, and metadata.</p>
        </div>
      )}

      {open && (
        <div className="mb-3 w-[22rem] rounded-2xl border border-rose-200 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="mb-3 flex items-center justify-between border-b border-rose-100 pb-2">
            <h3 className="text-base font-semibold text-rose-700">Personalized Assistant</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-rose-50"
              aria-label="Close assistant"
            >
              ×
            </button>
          </div>

          <div ref={projectRef} className="relative mb-2">
            <button
              type="button"
              onClick={() => setProjectOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-rose-200 bg-gradient-to-b from-white to-rose-50/30 px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm"
            >
              <span className="truncate">
                {projects.find((p) => String(p.id) === String(projectId))?.title || "Select Project"}
              </span>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-slate-500">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
            {projectOpen && (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-rose-200 bg-white shadow-lg">
                <button
                  type="button"
                  className={`block w-full px-3 py-2 text-left text-sm ${!projectId ? "bg-rose-100 text-rose-700" : "text-slate-700 hover:bg-rose-50"}`}
                  onClick={() => {
                    setProjectId("");
                    setProjectOpen(false);
                  }}
                >
                  Select Project
                </button>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-sm ${String(projectId) === String(p.id) ? "bg-rose-100 text-rose-700" : "text-slate-700 hover:bg-rose-50"}`}
                    onClick={() => {
                      setProjectId(String(p.id));
                      setProjectOpen(false);
                    }}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <form onSubmit={ask} className="mb-3 flex gap-2">
            <input
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ask about project, books, data..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button
              type="submit"
              disabled={!projectId || loading}
              className="rounded-lg bg-rose-600 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {loading ? "..." : "Ask"}
            </button>
          </form>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setQuestion(prompt)}
                className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] text-rose-700 hover:bg-rose-100"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {history.length === 0 && (
              <p className="text-xs text-slate-500">Choose a project and ask anything about workflow, assets, chapters, or metadata.</p>
            )}
            {history.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-rose-100 bg-rose-50/30 p-2 text-xs">
                <p className="font-semibold text-slate-700">Q: {item.question}</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-600">A: {item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setShowHint(false);
        }}
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl transition hover:bg-rose-700 ${open ? "" : "animate-bounce"}`}
        aria-label="Open assistant chat"
      >
        <IconRag className="h-6 w-6" />
      </button>
    </div>
  );
}
