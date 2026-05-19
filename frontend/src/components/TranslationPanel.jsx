import { useMemo, useState } from "react";

const tabItems = [
  { code: "hi", label: "Hindi" },
  { code: "hinglish", label: "Hinglish" },
  { code: "bn", label: "Bengali" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "mr", label: "Marathi" },
  { code: "gu", label: "Gujarati" },
  { code: "pa", label: "Punjabi" },
  { code: "ml", label: "Malayalam" },
  { code: "kn", label: "Kannada" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ar", label: "Arabic" },
  { code: "ja", label: "Japanese" },
];

function renderSafe(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function TranslationPanel({ translationAssets = [], onRun, loading = false, runningLang = "" }) {
  const [active, setActive] = useState("hi");

  const grouped = useMemo(() => {
    const map = {};
    for (const asset of translationAssets) {
      const payload = asset.content || {};
      map[payload.lang_code] = payload;
    }
    return map;
  }, [translationAssets]);

  const current = grouped[active];
  const isRunningActive = loading && runningLang === active;
  const runningLabel = tabItems.find((t) => t.code === runningLang)?.label || "selected language";

  return (
    <div className="rounded-xl border border-rose-100 bg-white p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Translation Outputs</h3>
        {onRun && (
          <button
            onClick={() => onRun(active)}
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunningActive ? "Translating..." : "Run Translation"}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
          <span>Translating {runningLabel}. Please wait...</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabItems.map((tab) => (
          <button
            key={tab.code}
            onClick={() => setActive(tab.code)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${active === tab.code ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!current && <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Is language ka translation abhi generate nahi hua.</p>}

      {current && (
        <div className="space-y-3">
          <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Translated Summary</p>
            <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{renderSafe(current.translated_summary)}</p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Translated Metadata</p>
            <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{renderSafe(current.translated_metadata)}</pre>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Translated Chapters</p>
            <div className="space-y-2">
              {current.translated_chapters?.map((chapter, idx) => (
                <div key={chapter.chapter_id || idx} className="rounded-lg border border-rose-100 bg-white p-3">
                  <p className="font-medium text-slate-800">{renderSafe(chapter.chapter_number)}. {renderSafe(chapter.title)}</p>
                  <pre className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{renderSafe(chapter.content).slice(0, 500)}...</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { TranslationPanel };
export default TranslationPanel;
