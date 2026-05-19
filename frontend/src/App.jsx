import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AgentAudiobookPage from "./pages/AgentAudiobookPage";
import AgentCoverPage from "./pages/AgentCoverPage";
import AgentEbookPage from "./pages/AgentEbookPage";
import AgentGrammarPage from "./pages/AgentGrammarPage";
import AgentMetadataPage from "./pages/AgentMetadataPage";
import AgentRagPage from "./pages/AgentRagPage";
import AgentSocialPage from "./pages/AgentSocialPage";
import AgentSummaryPage from "./pages/AgentSummaryPage";
import AgentTranslationPage from "./pages/AgentTranslationPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import UploadPage from "./pages/UploadPage";

const AUTH_KEY = "bookleaf_auth_user";

function isAuthenticated() {
  try {
    return Boolean(localStorage.getItem(AUTH_KEY));
  } catch {
    return false;
  }
}

function ProtectedApp() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/agents/summary" element={<AgentSummaryPage />} />
        <Route path="/agents/metadata" element={<AgentMetadataPage />} />
        <Route path="/agents/social" element={<AgentSocialPage />} />
        <Route path="/agents/grammar" element={<AgentGrammarPage />} />
        <Route path="/agents/translation" element={<AgentTranslationPage />} />
        <Route path="/agents/cover" element={<AgentCoverPage />} />
        <Route path="/agents/ebook" element={<AgentEbookPage />} />
        <Route path="/agents/audiobook" element={<AgentAudiobookPage />} />
        <Route path="/agents/rag" element={<AgentRagPage />} />
      </Routes>
    </AppLayout>
  );
}

function LoginRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="*" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  );
}
