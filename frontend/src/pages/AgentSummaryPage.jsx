import { useEffect, useState } from "react";
import AgentShell from "../components/AgentShell";
import { IconSummary } from "../components/Icons";
import ProjectSelector from "../components/ProjectSelector";
import { apiService } from "../services/api";

function toDisplayText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object" && value && "text" in value) {
    return String(value.text || "");
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function AgentSummaryPage() {
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
    setOperationText("Loading summary data...");
    setError("");
    try {
      const rows = await apiService.getAssetsByType(projectId, "summary");
      setAssets(rows || []);
      setData(rows?.[0]?.content || null);
    } catch (err) {
      setError(err.message || "Failed to load summary.");
    } finally {
      setLoading(false);
      setOperationText("");
    }
  };

  const shortSummary = toDisplayText(data?.short_summary);
  const detailedSynopsis = toDisplayText(data?.detailed_synopsis);
  const backCoverBlurb = toDisplayText(data?.back_cover_blurb);

  return (
    <AgentShell
      title="Summary Agent"
      subtitle="Short summary, synopsis, and blurb"
      controls={<><ProjectSelector value={projectId} onChange={setProjectId} /><button onClick={load} className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-white" disabled={loading}>{loading ? "Loading..." : "Load"}</button></>}
    >
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
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-rose-600">
            <IconSummary className="h-4 w-4" /> Summary Output
          </h4>
          {!data && (
            <p className="text-sm text-slate-600">Select a project and click Load to view formatted summary sections.</p>
          )}

          {data && (
            <div className="space-y-4">
              <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Short Summary</p>
                <p className="text-[15px] leading-7 text-slate-700">{shortSummary || "Not available."}</p>
              </div>

              <div className="rounded-xl border border-rose-100 bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Detailed Synopsis</p>
                <p className="text-[15px] leading-7 text-slate-700">{detailedSynopsis || "Not available."}</p>
              </div>

              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Back Cover Blurb</p>
                <p className="text-[15px] leading-7 text-slate-700">{backCoverBlurb || "Not available."}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AgentShell>
  );
}


