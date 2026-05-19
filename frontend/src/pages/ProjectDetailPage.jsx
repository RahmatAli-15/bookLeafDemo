import { IconBook } from "../components/Icons";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService } from "../services/api";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

function renderText(value) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && "text" in value) return String(value.text || "-");
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function viaProxy(url) {
  if (!url) return "";
  return `${API_BASE}/proxy/image?url=${encodeURIComponent(url)}`;
}

function promptToImageUrl(prompt, seed = 1) {
  if (!prompt) return "";
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1536&seed=${seed}&nologo=true`;
}

function toPublicAudioUrl(audioFilePath) {
  if (!audioFilePath) return "";
  const normalized = String(audioFilePath).replaceAll("\\", "/");
  const index = normalized.indexOf("storage/");
  const relative = index >= 0 ? normalized.slice(index) : normalized;
  return `http://localhost:8000/${relative}`;
}

export default function ProjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, type: "success", text: "" });
  const [editForm, setEditForm] = useState({ title: "", description: "", manuscript_type: "" });
  const [publishForm, setPublishForm] = useState({
    include_summary: false,
    include_translation: false,
    include_cover: false,
    include_ebook: false,
    include_audiobook: false,
    target_channels: ["web_store"],
    final_notes: "",
  });

  const refreshWorkspace = async () => {
    const data = await apiService.dashboardProject(id);
    setWorkspace(data);
    setEditForm({
      title: data.title || "",
      description: data.description || "",
      manuscript_type: data.manuscript_type || "",
    });
  };

  useEffect(() => {
    refreshWorkspace().catch(() => setWorkspace(null));
  }, [id]);

  const latest = useMemo(() => {
    const assets = workspace?.assets || {};
    const getLatest = (key) => (assets?.[key] || [])[0]?.content;
    return {
      summary: getLatest("summary"),
      metadata: getLatest("metadata"),
      translation: getLatest("translation"),
      cover: getLatest("cover"),
      audiobook: getLatest("audiobook"),
      ebook: getLatest("ebook"),
    };
  }, [workspace]);

  const coverRenders = useMemo(() => {
    const explicit = latest?.cover?.image_renders;
    if (explicit && Object.keys(explicit).length > 0) return explicit;
    const prompts = latest?.cover?.prompts || {};
    return {
      cinematic: promptToImageUrl(prompts.cinematic, 11),
      minimalist: promptToImageUrl(prompts.minimalist, 22),
      genre_specific: promptToImageUrl(prompts.genre_specific, 33),
    };
  }, [latest]);

  const primaryCover = useMemo(() => {
    const first = Object.entries(coverRenders || {}).find(([, url]) => Boolean(url));
    if (!first) return null;
    return { style: first[0], url: first[1] };
  }, [coverRenders]);

  if (!workspace) return <p className="text-slate-500">Loading project workspace...</p>;

  const channels = [
    { key: "web_store", label: "Web Store" },
    { key: "amazon_kdp", label: "Amazon KDP" },
    { key: "amazon_kindle", label: "Amazon Kindle" },
    { key: "google_books", label: "Google Books" },
    { key: "apple_books", label: "Apple Books" },
    { key: "kobo", label: "Kobo" },
    { key: "barnes_noble", label: "Barnes & Noble" },
    { key: "audiobook_platforms", label: "Audiobook Platforms" },
  ];

  const toggleChannel = (channel) => {
    setPublishForm((prev) => {
      const exists = prev.target_channels.includes(channel);
      return {
        ...prev,
        target_channels: exists ? prev.target_channels.filter((c) => c !== channel) : [...prev.target_channels, channel],
      };
    });
  };

  const saveProjectEdits = async () => {
    setSavingEdit(true);
    setError("");
    try {
      await apiService.updateProject(id, editForm);
      await refreshWorkspace();
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update project details.");
    } finally {
      setSavingEdit(false);
    }
  };

  const finalizeAndPublish = async () => {
    const selectedCount = [
      publishForm.include_summary,
      publishForm.include_translation,
      publishForm.include_cover,
      publishForm.include_ebook,
      publishForm.include_audiobook,
    ].filter(Boolean).length;

    if (selectedCount === 0) {
      setToast({ show: true, type: "error", text: "Please select at least one output to publish." });
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 2200);
      return;
    }

    setPublishing(true);
    setError("");
    try {
      await apiService.finalizePublish(id, { ...publishForm, selected_asset_ids: {} });
      await refreshWorkspace();
      setToast({ show: true, type: "success", text: "Submitted successfully." });
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 2200);
    } catch (err) {
      setError(err.message || "Failed to finalize publish.");
    } finally {
      setPublishing(false);
    }
  };

  const openEbookPreview = () => {
    const html = latest?.ebook?.html_book || "";
    if (!html) {
      window.alert("No ebook preview available yet.");
      return;
    }
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const outputOption = (key, label, assetKey) => (
    <div className="rounded-xl border border-rose-100 bg-white px-4 py-3 text-sm text-slate-700">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(publishForm[key])}
            onChange={(e) => setPublishForm((prev) => ({ ...prev, [key]: e.target.checked }))}
          />
          {label}
        </label>
        <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 ml-auto">
          Latest Output
        </span>
        <button
          type="button"
          onClick={() => {
            const routeMap = {
              summary: "/agents/summary",
              translation: "/agents/translation",
              cover: "/agents/cover",
              ebook: "/agents/ebook",
              audiobook: "/agents/audiobook",
            };
            navigate(routeMap[assetKey] || "/");
          }}
          className="rounded bg-slate-900 px-2 py-1 text-xs text-white"
        >
          Edit / Generate
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className={`pointer-events-none fixed right-6 top-6 z-50 transition-all duration-300 ${toast.show ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}>
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {toast.text}
        </div>
      </div>

      <div className="rounded-2xl border border-rose-200 bg-white p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-3xl font-bold text-rose-700"><IconBook className="h-6 w-6" /> {workspace.title}</h2>
            <p className="text-sm text-rose-400">Project Workspace</p>
          </div>
          <button onClick={() => setIsEditing((v) => !v)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">
            {isEditing ? "Cancel Edit" : "Edit Project"}
          </button>
        </div>

        {isEditing && (
          <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/40 p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-lg border border-rose-200 px-3 py-2 text-sm" value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} placeholder="Project title" />
              <input className="rounded-lg border border-rose-200 px-3 py-2 text-sm" value={editForm.manuscript_type} onChange={(e) => setEditForm((p) => ({ ...p, manuscript_type: e.target.value }))} placeholder="Manuscript type" />
            </div>
            <textarea className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm" rows={3} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} placeholder="Project description" />
            <button onClick={saveProjectEdits} disabled={savingEdit} className="rounded-lg bg-rose-600 px-4 py-2 text-sm text-white disabled:opacity-60">{savingEdit ? "Saving..." : "Save Changes"}</button>
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-sm"><span className="font-semibold text-rose-700">Manuscript Type:</span> <span className="text-slate-700">{workspace.manuscript_type || "-"}</span></div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-sm md:col-span-2"><span className="font-semibold text-rose-700">Description:</span> <span className="text-slate-700">{renderText(workspace.description)}</span></div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-rose-700">Publish Selection</h3>
        <p className="text-sm text-slate-600">Select what you want to publish. Only selected outputs will be shown below.</p>

        <div className="grid gap-2 md:grid-cols-2">
          {outputOption("include_summary", "Summary", "summary")}
          {outputOption("include_translation", "Translation", "translation")}
          {outputOption("include_cover", "Cover", "cover")}
          {outputOption("include_ebook", "Ebook", "ebook")}
          {outputOption("include_audiobook", "Audiobook", "audiobook")}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {publishForm.include_summary && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-500">Summary Preview</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap"><span className="font-semibold">Short:</span> {renderText(latest.summary?.short_summary || "-")}</p>
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap"><span className="font-semibold">Detailed:</span> {renderText(latest.summary?.detailed_synopsis || "-")}</p>
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap"><span className="font-semibold">Blurb:</span> {renderText(latest.summary?.back_cover_blurb || "-")}</p>
            </div>
          )}

          {publishForm.include_translation && (
            <div className="rounded-xl border border-rose-100 bg-white p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-500">Translation Preview</p>
              <p className="text-sm text-slate-700">Language: {renderText(String(latest.translation?.lang_code || "").toUpperCase() || "-")}</p>
              <p className="text-sm text-slate-700">Chapters: {Array.isArray(latest.translation?.translated_chapters) ? latest.translation.translated_chapters.length : 0}</p>
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap"><span className="font-semibold">Translated Summary:</span> {renderText(latest.translation?.translated_summary || "-")}</p>
            </div>
          )}

          {publishForm.include_cover && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-500">Cover Preview</p>
              <p className="text-sm text-slate-700">Themes: {Array.isArray(latest.cover?.visual_themes) ? latest.cover.visual_themes.length : 0}</p>
              <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Theme List:</span> {Array.isArray(latest.cover?.visual_themes) ? latest.cover.visual_themes.join(", ") : "-"}</p>
              <div className="mt-3 rounded-lg border border-rose-100 bg-white p-2">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{primaryCover?.style || "cover"}</p>
                {primaryCover?.url ? (
                  <>
                    <img src={viaProxy(primaryCover.url)} alt="Cover preview" className="h-52 w-full rounded object-contain bg-slate-100" />
                    <a href={primaryCover.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-blue-600 underline">
                      View Full Image
                    </a>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">No image</p>
                )}
              </div>
            </div>
          )}

          {publishForm.include_ebook && (
            <div className="rounded-xl border border-rose-100 bg-white p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-500">Ebook Preview</p>
              <p className="text-sm text-slate-700">Chapters: {renderText(latest.ebook?.chapter_count)}</p>
              <p className="text-sm text-slate-700">Formats: {Object.keys(latest.ebook?.export_files || {}).join(", ") || "-"}</p>
              <button onClick={openEbookPreview} className="mt-3 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
                Open Book
              </button>
            </div>
          )}

          {publishForm.include_audiobook && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-500">Audiobook Preview</p>
              <p className="text-sm text-slate-700">Voice: {renderText(latest.audiobook?.voice)}</p>
              <p className="text-sm text-slate-700">Audio chapters: {Array.isArray(latest.audiobook?.chapters) ? latest.audiobook.chapters.length : 0}</p>
              {Array.isArray(latest.audiobook?.chapters) && latest.audiobook.chapters[0] && (
                <div className="mt-3 rounded-lg border border-rose-100 bg-white p-3">
                  <p className="text-sm font-medium text-slate-800">
                    {renderText(latest.audiobook.chapters[0].chapter_number)}. {renderText(latest.audiobook.chapters[0].title)}
                  </p>
                  <p className="text-xs text-slate-500">Duration: {renderText(latest.audiobook.chapters[0].duration_seconds || 0)}s</p>
                  <audio controls className="mt-2 w-full">
                    <source src={toPublicAudioUrl(latest.audiobook.chapters[0].audio_file)} type="audio/wav" />
                  </audio>
                  <a href={toPublicAudioUrl(latest.audiobook.chapters[0].audio_file)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-blue-600 underline">
                    Open Full Audio
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Publish Channels</p>
          <div className="flex flex-wrap gap-2">
            {channels.map((ch) => (
              <button
                key={ch.key}
                onClick={() => toggleChannel(ch.key)}
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs ${publishForm.target_channels.includes(ch.key) ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-700"}`}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm"
          rows={3}
          value={publishForm.final_notes}
          onChange={(e) => setPublishForm((p) => ({ ...p, final_notes: e.target.value }))}
          placeholder="Final notes before publishing"
        />

        <button
          onClick={finalizeAndPublish}
          disabled={publishing}
          className="rounded-lg bg-rose-700 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {publishing ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
