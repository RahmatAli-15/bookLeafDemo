import { useEffect, useMemo, useState } from "react";
import AgentShell from "../components/AgentShell";
import { IconSocial } from "../components/Icons";
import ProjectSelector from "../components/ProjectSelector";
import { apiService } from "../services/api";

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && value && "text" in value) return String(value.text || "");
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function asArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => normalizeText(v)).filter(Boolean);
}

function buildReelIdeas(captions = [], tweets = []) {
  const pool = [...captions, ...tweets].filter(Boolean);
  const fallback = [
    "Reveal a dramatic chapter hook in first 3 seconds.",
    "Character intro reel: who they are and what they risk.",
    "World-building montage with one powerful quote on screen.",
  ];
  const selected = pool.slice(0, 3);
  if (selected.length === 0) return fallback;
  return selected.map((text, idx) => `Reel ${idx + 1}: ${text}`);
}

export default function AgentSocialPage() {
  const [projectId, setProjectId] = useState("");
  const [data, setData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setAssets([]);
    setError("");
  }, [projectId]);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      const rows = await apiService.getAssetsByType(projectId, "social");
      setAssets(rows || []);
      setData(rows?.[0]?.content || null);
    } catch (err) {
      setError(err.message || "Failed to load social assets.");
    } finally {
      setLoading(false);
    }
  };

  const instagramCaptions = asArray(data?.instagram_captions);
  const twitterPosts = asArray(data?.twitter_posts);
  const hashtags = asArray(data?.hashtags);
  const reelIdeas = useMemo(() => buildReelIdeas(instagramCaptions, twitterPosts), [instagramCaptions, twitterPosts]);

  const chapterHooks = useMemo(() => {
    const source = instagramCaptions.length > 0 ? instagramCaptions : twitterPosts;
    return source.slice(0, 3).map((line, idx) => `Hook ${idx + 1}: ${line}`);
  }, [instagramCaptions, twitterPosts]);

  const hashtagLine = hashtags.join(" ");

  const copyToClipboard = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      window.alert("Copied.");
    } catch {
      window.alert("Unable to copy.");
    }
  };

  return (
    <AgentShell
      title="Social Agent"
      subtitle="Instagram Reels ideas, chapter hooks, captions, and hashtags"
      controls={<><ProjectSelector value={projectId} onChange={setProjectId} /><button onClick={load} className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-white" disabled={loading}>{loading ? "Loading..." : "Load"}</button></>}
    >
      <div className="space-y-4">
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-rose-600"><IconSocial className="h-4 w-4" /> Instagram Reels Creator</h4>

          {!data && <p className="text-sm text-slate-600">Select a project and load social output to generate styled reels content.</p>}

          {data && (
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Reel Ideas From Book</p>
                    <button onClick={() => copyToClipboard(reelIdeas.join("\n"))} className="rounded bg-rose-600 px-2 py-1 text-[11px] text-white">Copy</button>
                  </div>
                  <div className="space-y-2 text-sm text-slate-700">
                    {reelIdeas.map((idea) => <p key={idea}>{idea}</p>)}
                  </div>
                </div>

                <div className="rounded-xl border border-rose-100 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Chapter Hooks</p>
                    <button onClick={() => copyToClipboard(chapterHooks.join("\n"))} className="rounded bg-slate-900 px-2 py-1 text-[11px] text-white">Copy</button>
                  </div>
                  <div className="space-y-2 text-sm text-slate-700">
                    {chapterHooks.length > 0 ? chapterHooks.map((hook) => <p key={hook}>{hook}</p>) : <p>No hooks yet.</p>}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-rose-100 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Instagram Captions</p>
                    <button onClick={() => copyToClipboard(instagramCaptions.join("\n\n"))} className="rounded bg-rose-600 px-2 py-1 text-[11px] text-white">Copy</button>
                  </div>
                  <div className="space-y-2 text-sm text-slate-700">
                    {instagramCaptions.length > 0 ? instagramCaptions.map((caption, idx) => <p key={`${idx}-${caption}`}>{caption}</p>) : <p>No captions generated.</p>}
                  </div>
                </div>

                <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Hashtag Bank</p>
                    <button onClick={() => copyToClipboard(hashtagLine)} className="rounded bg-slate-900 px-2 py-1 text-[11px] text-white">Copy</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.length > 0 ? hashtags.map((tag) => <span key={tag} className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs text-rose-700">{tag.startsWith("#") ? tag : `#${tag}`}</span>) : <p className="text-sm text-slate-700">No hashtags generated.</p>}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-rose-100 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">X / Twitter Posts</p>
                  <button onClick={() => copyToClipboard(twitterPosts.join("\n\n"))} className="rounded bg-rose-600 px-2 py-1 text-[11px] text-white">Copy</button>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                  {twitterPosts.length > 0 ? twitterPosts.map((post, idx) => <p key={`${idx}-${post}`}>{post}</p>) : <p>No posts generated.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AgentShell>
  );
}

