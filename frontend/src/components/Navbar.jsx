import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconSpark } from "./Icons";
import { apiService } from "../services/api";

const AUTH_KEY = "bookleaf_auth_user";

export default function Navbar() {
  const [creditsUsed, setCreditsUsed] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    apiService
      .dashboardProjects()
      .then((d) => setCreditsUsed(d.credits_used || 0))
      .catch(() => setCreditsUsed(0));
  }, []);

  const userEmail = localStorage.getItem(AUTH_KEY) || "Guest";

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    navigate("/login", { replace: true });
  };

  return (
    <header className="border-b border-rose-100/70 bg-white/70 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2">
          <IconSpark className="mt-1 h-4 w-4 text-rose-500" />
          <div>
            <h1 className="text-lg font-semibold text-rose-700">BookLeaf Studio</h1>
            <p className="text-sm text-rose-400">AI Publishing Automation Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-rose-100 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            User: {userEmail}
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
            Credits Used: {creditsUsed}
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
            Pipeline Live
          </span>
          <button
            type="button"
            onClick={logout}
            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
