import { useEffect, useState } from "react";
import AgentShell from "../components/AgentShell";
import { IconGrammar } from "../components/Icons";
import ProjectSelector from "../components/ProjectSelector";
import { apiService } from "../services/api";

export default function AgentGrammarPage() {
  const [projectId, setProjectId] = useState("");
  const [data, setData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationText, setOperationText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setAssets([]);
    setData(null);
    setError("");
    setOperationText("");
  }, [projectId]);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setOperationText("Loading grammar report...");
    setError("");
    try {
      const rows = await apiService.getAssetsByType(projectId, "grammar");
      setAssets(rows || []);
      setData(rows?.[0]?.content || null);
    } catch (err) {
      setError(err.message || "Failed to load grammar report.");
    } finally {
      setLoading(false);
      setOperationText("");
    }
  };

  const run = async () => {
    if (!projectId) return;
    if ((assets || []).length > 0) {
      setOperationText("Grammar report already exists. Reusing latest report.");
      setTimeout(() => setOperationText(""), 1800);
      return;
    }
    setLoading(true);
    setOperationText("Running grammar analysis...");
    setError("");
    try {
      await apiService.runWorkflow(projectId);
      await load();
    } catch (err) {
      setError(err.message || "Failed to run grammar check.");
    } finally {
      setLoading(false);
      setOperationText("");
    }
  };

  const issues = Array.isArray(data?.issues) ? data.issues : [];
  const score = Number.isFinite(data?.overall_score) ? data.overall_score : null;

  const severityStyles = {
    critical: "bg-red-100 text-red-700 border-red-200",
    major: "bg-amber-100 text-amber-700 border-amber-200",
    minor: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  return (
    <AgentShell
      title="Grammar Agent"
      subtitle="Grammar, style, and readability checks"
      controls={
        <>
          <ProjectSelector value={projectId} onChange={setProjectId} />
          <button onClick={load} className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-white" disabled={loading}>Load</button>
          <button onClick={run} className="rounded-xl bg-rose-700 px-4 py-2 text-sm text-white" disabled={loading}>{loading ? "Running..." : "Run Grammar"}</button>
        </>
      }
    >
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

        <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-rose-600">
            <IconGrammar className="h-4 w-4" /> Grammar Report
          </h4>

          {!data && (
            <p className="text-sm text-slate-600">Select a project and load grammar report.</p>
          )}

          {data && (
            <div className="space-y-4">
              <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-rose-500">Overall Score</p>
                <p className="text-2xl font-bold text-slate-800">{score ?? "N/A"}<span className="ml-1 text-sm font-medium text-slate-500">/ 10</span></p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Issues Found ({issues.length})</p>
                {issues.length === 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    No grammar or readability issues were reported.
                  </div>
                )}

                {issues.map((issue, index) => {
                  const severity = String(issue?.severity || "minor").toLowerCase();
                  const badgeClass = severityStyles[severity] || severityStyles.minor;
                  return (
                    <div key={`${issue?.type || "issue"}-${index}`} className="rounded-xl border border-rose-100 bg-white p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">{issue?.type || "Issue"}</p>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}>
                          {severity}
                        </span>
                      </div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Example</p>
                      <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{issue?.example || "No example provided."}</p>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Suggestion</p>
                      <p className="text-sm leading-7 text-slate-700">{issue?.suggestion || "No suggestion provided."}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AgentShell>
  );
}


