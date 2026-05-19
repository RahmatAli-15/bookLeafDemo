import { useEffect, useState } from "react";
import AgentShell from "../components/AgentShell";
import { IconCover } from "../components/Icons";
import CoverStudio from "../components/CoverStudio";
import ProjectSelector from "../components/ProjectSelector";
import { apiService } from "../services/api";

export default function AgentCoverPage() {
  const [projectId, setProjectId] = useState("");
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationText, setOperationText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setAssets([]);
    setError("");
    setOperationText("");
  }, [projectId]);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setOperationText("Loading cover assets...");
    setError("");
    try {
      setAssets(await apiService.getAssetsByType(projectId, "cover"));
    } catch (err) {
      setError(err.message || "Failed to load cover assets.");
    } finally {
      setLoading(false);
      setOperationText("");
    }
  };

  const run = async () => {
    if (!projectId) return;
    if ((assets || []).length > 0) {
      setOperationText("Cover ideas already generated. Reusing latest output.");
      setTimeout(() => setOperationText(""), 1800);
      return;
    }
    setLoading(true);
    setOperationText("Generating cover ideas and visual concepts...");
    setError("");
    try {
      await apiService.runCover(projectId);
      setAssets(await apiService.getAssetsByType(projectId, "cover"));
    } catch (err) {
      setError(err.message || "Failed to generate cover ideas.");
    } finally {
      setLoading(false);
      setOperationText("");
    }
  };

  return (
    <AgentShell title="Cover Agent" subtitle="Concepts, prompts, visual theme" controls={<><ProjectSelector value={projectId} onChange={setProjectId} /><button onClick={load} className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-white" disabled={loading}>{loading ? "Loading..." : "Load"}</button></>}>
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {operationText && (
          <div className={`rounded-xl px-4 py-3 text-sm ${loading ? "border border-blue-200 bg-blue-50 text-blue-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {operationText}
          </div>
        )}

        <div className="rounded-2xl border border-rose-100 bg-white p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-600"><IconCover className="h-4 w-4" /> Cover Studio</h4>
        <CoverStudio coverAssets={assets} onRun={run} loading={loading} />
        </div>
      </div>
    </AgentShell>
  );
}


