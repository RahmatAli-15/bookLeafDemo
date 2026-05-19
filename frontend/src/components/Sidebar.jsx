import { NavLink } from "react-router-dom";
import {
  IconAudiobook,
  IconCover,
  IconDashboard,
  IconEbook,
  IconGrammar,
  IconMetadata,
  IconRag,
  IconSocial,
  IconSummary,
  IconTranslation,
  IconUpload,
} from "./Icons";

const groups = [
  {
    title: "Workspace",
    links: [
      { to: "/", label: "Dashboard", icon: IconDashboard },
      { to: "/upload", label: "Upload", icon: IconUpload },
    ],
  },
  {
    title: "Agents",
    links: [
      { to: "/agents/summary", label: "Summary Agent", icon: IconSummary },
      { to: "/agents/metadata", label: "Metadata Agent", icon: IconMetadata },
      { to: "/agents/social", label: "Social Agent", icon: IconSocial },
      { to: "/agents/grammar", label: "Grammar Agent", icon: IconGrammar },
      { to: "/agents/translation", label: "Translation Agent", icon: IconTranslation },
      { to: "/agents/cover", label: "Cover Agent", icon: IconCover },
      { to: "/agents/ebook", label: "Ebook Agent", icon: IconEbook },
      { to: "/agents/audiobook", label: "Audiobook Agent", icon: IconAudiobook },
      { to: "/agents/rag", label: "Assistant Chat Agent", icon: IconRag },
    ],
  },
];

export default function Sidebar({ onToggle }) {
  return (
    <aside className="relative sticky top-0 h-screen w-72 overflow-y-auto border-r border-rose-100/70 bg-white/90 p-5 backdrop-blur">
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-3 rounded-lg border border-rose-200 bg-white p-1.5 text-rose-700 shadow-sm hover:bg-rose-50"
        title="Hide sidebar"
        aria-label="Hide sidebar"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <h2 className="text-2xl font-bold text-rose-700">BookLeaf</h2>
      <p className="mb-7 text-xs text-rose-400">Automation Workspace</p>

      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-300">{group.title}</p>
            <nav className="space-y-1">
              {group.links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${isActive ? "bg-rose-500 text-white shadow" : "text-rose-700 hover:bg-rose-50"}`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
