const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

function uploadWithProgress(projectId, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("project_id", String(projectId));
    formData.append("file", file);

    xhr.open("POST", `${API_BASE}/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(xhr.responseText || "Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

export const apiService = {
  health: () => request("/health"),
  dashboardProjects: () => request("/dashboard/projects"),
  dashboardProject: (id) => request(`/dashboard/project/${id}`),
  listProjects: () => request("/projects"),
  getProject: (id) => request(`/projects/${id}`),
  updateProject: (id, payload) =>
    request(`/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),
  getManuscript: (id) => request(`/manuscripts/${id}`),
  deleteManuscript: (id) => request(`/manuscripts/${id}`, { method: "DELETE" }),
  getChapter: (id) => request(`/chapters/${id}`),
  getAssets: (projectId) => request(`/assets/${projectId}`),
  getAssetsByType: (projectId, assetType) => request(`/assets/${projectId}/${assetType}`),
  getWorkflowStatus: (projectId) => request(`/workflow/status/${projectId}`),
  runWorkflow: (projectId) => request(`/workflow/run/${projectId}`, { method: "POST" }),
  createProject: (payload) =>
    request("/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  uploadManuscript: uploadWithProgress,
  runTranslation: (projectId, language) =>
    request(`/agents/translate/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    }),
  runCover: (projectId) => request(`/agents/cover/${projectId}`, { method: "POST" }),
  runEbook: (projectId) => request(`/agents/ebook/${projectId}`, { method: "POST" }),
  runAudiobook: (projectId, voice) =>
    request(`/agents/audiobook/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voice }),
    }),
  finalizePublish: (projectId, payload) =>
    request(`/projects/${projectId}/finalize-publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  ragChat: (projectId, question) =>
    request(`/rag/chat/${projectId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    }),
};
