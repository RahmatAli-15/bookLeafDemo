import { useState } from "react";
import AgentShell from "../components/AgentShell";
import { IconRag } from "../components/Icons";
import ProjectSelector from "../components/ProjectSelector";
import RagChatPanel from "../components/RagChatPanel";
import { apiService } from "../services/api";

export default function AgentRagPage() {
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (question) => {
    if (!projectId) return { answer: "Select a project first." };
    setLoading(true);
    try {
      return await apiService.ragChat(projectId, question);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AgentShell title="Personalized Assistant" subtitle="Ask anything about your project, books, workflow, and generated data" controls={<ProjectSelector value={projectId} onChange={setProjectId} />}>
      <div className="rounded-2xl border border-rose-100 bg-white p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-600"><IconRag className="h-4 w-4" /> Assistant Workspace</h4>
        <RagChatPanel onAsk={ask} loading={loading} />
      </div>
    </AgentShell>
  );
}
