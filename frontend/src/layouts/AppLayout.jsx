import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import FloatingAssistant from "../components/FloatingAssistant";
import { useState } from "react";

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-transparent">
      {sidebarOpen && <Sidebar onToggle={() => setSidebarOpen(false)} />}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-3 top-3 z-40 rounded-lg border border-rose-200 bg-white p-1.5 text-rose-700 shadow-sm hover:bg-rose-50"
          title="Show sidebar"
          aria-label="Show sidebar"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
      <FloatingAssistant />
    </div>
  );
}
