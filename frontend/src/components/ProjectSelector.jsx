import { useEffect, useRef, useState } from "react";
import { apiService } from "../services/api";

export default function ProjectSelector({ value, onChange }) {
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    apiService.listProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    const onDocClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = projects.find((p) => String(p.id) === String(value));

  return (
    <div ref={wrapperRef} className="relative min-w-56">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-2xl border border-rose-200 bg-white/95 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{selected?.title || "Select Project"}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-rose-200 bg-white shadow-lg">
          <button
            type="button"
            className={`block w-full px-4 py-2 text-left text-sm transition ${!value ? "bg-rose-50 text-rose-700" : "text-slate-700 hover:bg-rose-50"}`}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Select Project
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`block w-full px-4 py-2 text-left text-sm transition ${String(value) === String(p.id) ? "bg-rose-100 text-rose-700" : "text-slate-700 hover:bg-rose-50"}`}
              onClick={() => {
                onChange(String(p.id));
                setOpen(false);
              }}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}