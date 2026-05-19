import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconBook,
  IconAudiobook,
  IconCheck,
  IconClock,
  IconDashboard,
  IconSpark,
} from "../components/Icons";
import { apiService } from "../services/api";

function toPublicFileUrl(filePath) {
  if (!filePath) return "";
  const normalized = String(filePath).replaceAll("\\", "/");
  const index = normalized.indexOf("storage/");
  const relative = index >= 0 ? normalized.slice(index) : normalized;
  return `http://localhost:8000/${relative}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [openingFileId, setOpeningFileId] = useState(null);

  useEffect(() => {
    apiService.dashboardProjects().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <p className="text-sm text-slate-500">Loading dashboard...</p>;

  const manuscriptsCount = data.total_projects || 0;
  const assetsCount = data.total_assets || 0;
  const completedRuns = data.completed_workflows || 0;
  const refresh = () => apiService.dashboardProjects().then(setData).catch(() => setData(null));

  const runWorkflow = async (projectId) => {
    setActionLoadingId(projectId);
    try {
      await apiService.runWorkflow(projectId);
      await refresh();
    } finally {
      setActionLoadingId(null);
    }
  };

  const removeProject = async (projectId) => {
    if (!window.confirm("Delete this project and all related data?")) return;
    setActionLoadingId(projectId);
    try {
      await apiService.deleteProject(projectId);
      await refresh();
    } finally {
      setActionLoadingId(null);
    }
  };

  const openUploadedPdf = async (projectId) => {
    setOpeningFileId(projectId);
    try {
      const detail = await apiService.dashboardProject(projectId);
      const latestManuscript = Array.isArray(detail?.manuscripts) ? detail.manuscripts[0] : null;
      const filePath = latestManuscript?.file_path || "";
      if (!filePath) {
        window.alert("No uploaded manuscript file found for this project.");
        return;
      }
      const url = toPublicFileUrl(filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setOpeningFileId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-rose-700">Publishing Control Center</h2>
          <p className="text-sm text-rose-400">From manuscript ingestion to multi-format publishing outputs</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Manuscripts" value={manuscriptsCount} icon={IconBook} />
        <Metric label="Generated Assets" value={assetsCount} icon={IconDashboard} />
        <Metric label="Completed Workflows" value={completedRuns} icon={IconCheck} />
        <Metric label="Active Agents" value={data.active_agents.length} icon={IconSpark} />
      </div>

      <section className="rounded-xl border border-rose-100 bg-white p-5 shadow-sm">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-rose-700">
          <IconAudiobook className="h-5 w-5 text-rose-500" />
          Manuscript Workspace
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          Review manuscript lifecycle status, open individual workspaces, and manage generated publishing outputs for each title.
        </p>

        {data.projects.length === 0 && <p className="text-sm text-slate-500">No manuscripts available yet.</p>}
        <div className="space-y-2">
          {data.projects.map((project) => {
            const status = String(project.status || "pending").toLowerCase();
            const statusIcon = status === "completed" || status === "processed" ? IconCheck : IconClock;
            const StatusIcon = statusIcon;
            const statusClass =
              status === "failed"
                ? "bg-rose-100 text-rose-700"
                : status === "completed" || status === "processed"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700";

            return (
              <div key={project.id} className="rounded-lg border border-rose-100 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-[260px] space-y-2">
                    <p className="font-semibold text-slate-800">{project.title}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <InfoPill label="Manuscripts" value={project.manuscript_count || 0} />
                      <InfoPill label="Chapters" value={project.chapter_count || 0} />
                      <InfoPill label="Assets" value={project.asset_count || 0} />
                      <InfoPill label="Workflows" value={project.workflow_runs || 0} />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className="rounded bg-slate-100 px-2 py-1">
                        Type: {project.manuscript_type || "unknown"}
                      </span>
                      {status === "published" && (
                        <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-700">Published</span>
                      )}
                    </div>
                    {project.latest_manuscript && (
                      <p className="text-xs text-slate-500">Latest file: {project.latest_manuscript}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs ${statusClass}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {project.status}
                    </span>
                    <button className="rounded bg-rose-600 px-2 py-1 text-xs text-white" onClick={() => navigate(`/projects/${project.id}`)}>Open</button>
                    <button
                      className="rounded bg-indigo-600 px-2 py-1 text-xs text-white disabled:opacity-60"
                      onClick={() => openUploadedPdf(project.id)}
                      disabled={openingFileId === project.id}
                    >
                      {openingFileId === project.id ? "Opening..." : "Open Uploaded PDF"}
                    </button>
                    <button
                      className="rounded bg-amber-500 px-2 py-1 text-xs text-white disabled:opacity-60"
                      onClick={() => runWorkflow(project.id)}
                      disabled={actionLoadingId === project.id}
                    >
                      {actionLoadingId === project.id ? "Running..." : "Run"}
                    </button>
                    <button
                      className="rounded bg-slate-800 px-2 py-1 text-xs text-white disabled:opacity-60"
                      onClick={() => removeProject(project.id)}
                      disabled={actionLoadingId === project.id}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <span className="rounded bg-rose-50 px-2 py-1 text-rose-700">
      {label}: {value}
    </span>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-rose-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="rounded-lg bg-rose-100 p-2 text-rose-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-rose-700">{value}</p>
    </div>
  );
}
