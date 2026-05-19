const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

function promptToImageUrl(prompt, seed = 1) {
  if (!prompt) return "";
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1536&seed=${seed}&nologo=true`;
}

function viaProxy(url) {
  if (!url) return "";
  return `${API_BASE}/proxy/image?url=${encodeURIComponent(url)}`;
}

export default function CoverStudio({ coverAssets = [], onRun, loading = false }) {
  const latest = coverAssets[0]?.content;

  const fallbackRenders = {
    cinematic: promptToImageUrl(latest?.prompts?.cinematic, 11),
    minimalist: promptToImageUrl(latest?.prompts?.minimalist, 22),
    genre_specific: promptToImageUrl(latest?.prompts?.genre_specific, 33),
  };

  const renders = latest?.image_renders || fallbackRenders;

  return (
    <div className="rounded-xl border border-rose-100 bg-white p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Cover Studio</h3>
        {onRun && (
          <button
            onClick={onRun}
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate Cover Ideas"}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
          <span>Generating cover ideas and visual concepts. Please wait...</span>
        </div>
      )}

      {!latest && <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">No cover concepts generated yet.</p>}

      {latest && (
        <div className="space-y-4 text-sm text-slate-700">
          <section className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Generated Cover Visuals</p>
            <div className="mt-2 grid gap-3 md:grid-cols-3">
              {Object.entries(renders || {}).map(([key, url]) => {
                const proxied = viaProxy(url);
                return (
                  <div key={key} className="rounded-lg border border-rose-100 bg-white p-2">
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">{key}</p>
                    {url ? (
                      <>
                        <img src={proxied} alt={`${key} cover`} className="max-h-[640px] w-full rounded object-contain bg-slate-100" />
                        <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-blue-600 underline">Open Full Image</a>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">Prompt missing for this style.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-rose-100 bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Prompts</p>
            <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-7">{JSON.stringify(latest.prompts, null, 2)}</pre>
          </section>

          <section className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Visual Themes</p>
            <ul className="list-disc space-y-1 pl-5">
              {latest.visual_themes?.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </section>

          <section className="rounded-xl border border-rose-100 bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Typography</p>
            <ul className="list-disc space-y-1 pl-5">
              {latest.typography_styles?.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
          </section>

          <section className="rounded-xl border border-rose-100 bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-500">Color Palettes</p>
            <div className="space-y-2">
              {latest.color_palettes?.map((palette, idx) => (
                <div key={idx} className="flex gap-2">
                  {palette.map((color) => (
                    <div key={color} className="h-8 w-8 rounded border" style={{ backgroundColor: color }} title={color} />
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
