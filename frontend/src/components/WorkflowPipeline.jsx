import { IconCheck, IconClock, IconSpark } from "./Icons";

export default function WorkflowPipeline({ workflow }) {
  const steps = ["upload", "parser", "supervisor", "summary", "metadata", "social", "grammar", "translation", "cover", "audiobook", "rag_prep", "completed"];

  const statusByAgent = {};
  for (const agent of workflow?.agents || []) {
    statusByAgent[agent.agent_name] = agent.status;
  }

  return (
    <div className="rounded-xl border border-rose-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-rose-700"><IconSpark className="h-4 w-4" /> Workflow Visualization</h3>
      <div className="grid gap-2 md:grid-cols-6">
        {steps.map((step) => {
          const status = step === "upload" ? "completed" : step === "supervisor" ? "completed" : step === "completed" ? (workflow?.status || "pending") : (statusByAgent[step] || "pending");
          const color = status === "completed" ? "bg-emerald-100 text-emerald-700" : status === "running" ? "bg-amber-100 text-amber-700" : status === "failed" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600";
          const Icon = status === "completed" ? IconCheck : IconClock;
          return (
            <div key={step} className={`rounded p-2 text-center text-xs font-medium ${color}`}>
              <div className="mb-1 flex items-center justify-center"><Icon className="h-3.5 w-3.5" /></div>
              {step}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-slate-600">Workflow Status: <span className="font-semibold">{workflow?.status || "pending"}</span></p>
    </div>
  );
}
