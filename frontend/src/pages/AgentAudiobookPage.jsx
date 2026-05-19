import { useEffect, useState } from "react";
import AgentShell from "../components/AgentShell";
import { IconAudiobook } from "../components/Icons";
import AudiobookPanel from "../components/AudiobookPanel";
import ProjectSelector from "../components/ProjectSelector";
import { apiService } from "../services/api";

export default function AgentAudiobookPage() {
  const [projectId, setProjectId] = useState("");
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationText, setOperationText] = useState("");
  const [runningVoice, setRunningVoice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setAssets([]);
    setError("");
    setOperationText("");
    setRunningVoice("");
  }, [projectId]);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setOperationText("Loading audiobook assets...");
    setError("");
    try {
      setAssets(await apiService.getAssetsByType(projectId, "audiobook"));
    } catch (err) {
      setError(err.message || "Failed to load audiobook assets.");
    } finally {
      setLoading(false);
      setOperationText("");
    }
  };

  const run = async (voice) => {
    if (!projectId) return;
    const requestedVoice = String(voice || "").toLowerCase();
    const existing = (assets || []).find(
      (row) => String(row?.content?.voice || "").toLowerCase() === requestedVoice
    );
    if (existing) {
      setOperationText(`${voice} voice audiobook already exists. Reusing saved output.`);
      setTimeout(() => setOperationText(""), 1800);
      return;
    }
    setLoading(true);
    setRunningVoice(voice);
    setOperationText(`Generating audiobook in ${voice} voice...`);
    setError("");
    try {
      await apiService.runAudiobook(projectId, voice);
      setAssets(await apiService.getAssetsByType(projectId, "audiobook"));
    } catch (err) {
      setError(err.message || "Failed to generate audiobook.");
    } finally {
      setLoading(false);
      setRunningVoice("");
      setOperationText("");
    }
  };

  return (
    <AgentShell title="Audiobook Agent" subtitle="Chapter narration and audio assets" controls={<><ProjectSelector value={projectId} onChange={setProjectId} /><button onClick={load} className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-white" disabled={loading}>{loading ? "Loading..." : "Load"}</button></>}>
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
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-600"><IconAudiobook className="h-4 w-4" /> Audiobook Studio</h4>
        <AudiobookPanel audiobookAssets={assets} onRun={run} loading={loading} runningVoice={runningVoice} />
      </div>
      </div>
    </AgentShell>
  );
}


