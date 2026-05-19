import { useEffect, useState } from "react";
import AgentShell from "../components/AgentShell";
import { IconMetadata } from "../components/Icons";
import ProjectSelector from "../components/ProjectSelector";
import { apiService } from "../services/api";

export default function AgentMetadataPage() {
  const [projectId, setProjectId] = useState("");
  const [data, setData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationText, setOperationText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setAssets([]);
    setError("");
    setOperationText("");
  }, [projectId]);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setOperationText("Loading metadata...");
    setError("");
    try {
      const rows = await apiService.getAssetsByType(projectId, "metadata");
      setAssets(rows || []);
      setData(rows?.[0]?.content || null);
    } catch (err) {
      setError(err.message || "Failed to load metadata.");
    } finally {
      setLoading(false);
      setOperationText("");
    }
  };

  const keywords = Array.isArray(data?.keywords) ? data.keywords : [];
  const themes = Array.isArray(data?.themes) ? data.themes : [];

  return (
    <AgentShell title="Metadata Agent" subtitle="Genre, keywords, themes" controls={<><ProjectSelector value={projectId} onChange={setProjectId} /><button onClick={load} className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-white" disabled={loading}>{loading ? "Loading..." : "Load"}</button></>}>
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {loading && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {operationText || "Working..."}
          </div>
        )}

        <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-rose-600">
            <IconMetadata className="h-4 w-4" /> Metadata Output
          </h4>

          {!data && (
            <p className="text-sm text-slate-600">Select a project and click Load to view metadata.</p>
          )}

          {data && (
            <div className="space-y-4">
              <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Genre</p>
                <p className="text-base font-medium text-slate-700">{data.genre || "Not available."}</p>
              </div>

              <div className="rounded-xl border border-rose-100 bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {keywords.length > 0 ? keywords.map((keyword) => (
                    <span key={keyword} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                      {keyword}
                    </span>
                  )) : <p className="text-sm text-slate-600">Not available.</p>}
                </div>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Themes</p>
                <div className="flex flex-wrap gap-2">
                  {themes.length > 0 ? themes.map((theme) => (
                    <span key={theme} className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                      {theme}
                    </span>
                  )) : <p className="text-sm text-slate-600">Not available.</p>}
                </div>
              </div>

              <div className="rounded-xl border border-rose-100 bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Target Audience</p>
                <p className="text-[15px] leading-7 text-slate-700">{data.target_audience || "Not available."}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AgentShell>
  );
}


