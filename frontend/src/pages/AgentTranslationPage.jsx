import { useEffect, useState } from "react";
import AgentShell from "../components/AgentShell";
import { IconTranslation } from "../components/Icons";
import ProjectSelector from "../components/ProjectSelector";
import TranslationPanel from "../components/TranslationPanel";
import { apiService } from "../services/api";

export default function AgentTranslationPage() {
  const [projectId, setProjectId] = useState("");
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationText, setOperationText] = useState("");
  const [runningLang, setRunningLang] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setAssets([]);
    setError("");
    setOperationText("");
    setRunningLang("");
  }, [projectId]);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setOperationText("Loading translation history...");
    setError("");
    try {
      setAssets(await apiService.getAssetsByType(projectId, "translation"));
    } catch (err) {
      setError(err.message || "Failed to load translations.");
    } finally {
      setLoading(false);
      setOperationText("");
    }
  };

  const run = async (lang) => {
    if (!projectId) return;
    const requestedLang = String(lang || "").toLowerCase();
    const existing = (assets || []).find(
      (row) => String(row?.content?.lang_code || "").toLowerCase() === requestedLang
    );
    if (existing) {
      setOperationText(`Translation for ${String(lang).toUpperCase()} already exists. Reusing saved output.`);
      setTimeout(() => setOperationText(""), 1800);
      return;
    }
    setLoading(true);
    setRunningLang(lang);
    setOperationText(`Translating content to ${String(lang).toUpperCase()}...`);
    setError("");
    try {
      const runResult = await apiService.runTranslation(projectId, lang);
      const freshAssets = await apiService.getAssetsByType(projectId, "translation");
      setAssets(freshAssets || []);

      const nowExists = (freshAssets || []).some(
        (row) => String(row?.content?.lang_code || "").toLowerCase() === requestedLang
      );

      if (!nowExists) {
        const status = String(runResult?.status || "unknown");
        if (status !== "completed") {
          setError(`Translation run ${status}. Output was not saved. Please retry or check workflow errors.`);
        } else {
          setError("Translation run completed, but selected language output was not found. Please retry once.");
        }
      }
    } catch (err) {
      setError(err.message || "Failed to run translation.");
    } finally {
      setLoading(false);
      setRunningLang("");
      setOperationText("");
    }
  };

  return (
    <AgentShell title="Translation Agent" subtitle="Indian + Global languages, Hinglish support" controls={<><ProjectSelector value={projectId} onChange={setProjectId} /><button onClick={load} className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-white" disabled={loading}>{loading ? "Loading..." : "Load"}</button></>}>
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
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-600"><IconTranslation className="h-4 w-4" /> Translation Workspace</h4>
        <TranslationPanel translationAssets={assets} onRun={run} loading={loading} runningLang={runningLang} />
        </div>
      </div>
    </AgentShell>
  );
}


