import { useState } from "react";

function formatTime(value) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function formatValue(value) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && "text" in value) return String(value.text || "-");
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function ActivityHistory({ title = "Activity History", entries = [] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-rose-600">{title}</h4>
      {entries.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No activity yet for this agent.
        </p>
      )}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <button
              type="button"
              key={`${entry.timestamp || "t"}-${idx}`}
              onClick={() => setSelectedIndex(idx)}
              className={`w-full rounded-xl border p-3 text-left ${selectedIndex === idx ? "border-rose-300 bg-rose-50" : "border-rose-100 bg-rose-50/30"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{entry.title}</p>
                <span className="text-xs text-slate-500">{formatTime(entry.timestamp)}</span>
              </div>
              {entry.subtitle && <p className="mt-1 text-xs text-slate-600">{entry.subtitle}</p>}
              {selectedIndex === idx && Array.isArray(entry.details) && entry.details.length > 0 && (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {entry.details.map((detail, didx) => (
                    <div key={`${detail.label}-${didx}`} className="rounded-lg border border-rose-100 bg-white p-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">{detail.label}</p>
                      <p className="mt-1 text-xs text-slate-700 whitespace-pre-wrap">{formatValue(detail.value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
