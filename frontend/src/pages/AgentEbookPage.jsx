import { useEffect, useState } from "react";
import AgentShell from "../components/AgentShell";
import { IconEbook } from "../components/Icons";
import ProjectSelector from "../components/ProjectSelector";
import { apiService } from "../services/api";

const FORMAT_INFO = {
  epub: "Reflowable ebook for Apple Books and many e-readers.",
  pdf: "Fixed-layout printable book with page numbers.",
  mobi: "Legacy Kindle-compatible ebook format.",
  html: "Web version of your full ebook.",
  markdown: "Editable manuscript source for publishing workflows.",
};

export default function AgentEbookPage() {
  const [projectId, setProjectId] = useState("");
  const [data, setData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationText, setOperationText] = useState("");
  const [error, setError] = useState("");
  const [activePreview, setActivePreview] = useState("book");

  useEffect(() => {
    setAssets([]);
    setData(null);
    setError("");
    setOperationText("");
    setActivePreview("book");
  }, [projectId]);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setOperationText("Loading ebook package...");
    setError("");
    try {
      const rows = await apiService.getAssetsByType(projectId, "ebook");
      setAssets(rows || []);
      setData(rows?.[0]?.content || null);
    } catch (err) {
      setError(err.message || "Failed to load ebook assets.");
    } finally {
      setLoading(false);
      setOperationText("");
    }
  };

  const run = async () => {
    if (!projectId) return;
    if ((assets || []).length > 0) {
      setOperationText("Ebook package already exists. Reusing latest export.");
      setTimeout(() => setOperationText(""), 1800);
      return;
    }
    setError("");
    setLoading(true);
    setOperationText("Converting manuscript into ebook package...");
    try {
      await apiService.runEbook(projectId);
      await load();
    } catch (err) {
      setError(err.message || "Failed to generate ebook.");
    } finally {
      setLoading(false);
      setOperationText("");
    }
  };

  const exportFileName = (format) => data?.export_files?.[format] || `book.${format}`;

  const downloadTextFile = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const openHtmlPreview = () => {
    const html = data?.html_book || "";
    if (!html) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const handleExportAction = (format) => {
    if (!data) return;
    if (format === "html") {
      downloadTextFile(exportFileName("html"), data.html_book || "", "text/html;charset=utf-8");
      return;
    }
    if (format === "markdown") {
      downloadTextFile(exportFileName("markdown"), data.markdown_book || "", "text/markdown;charset=utf-8");
      return;
    }
    if (format === "pdf") {
      openHtmlPreview();
      return;
    }
    if (format === "epub" || format === "mobi") {
      setError(`${format.toUpperCase()} conversion is not generated yet. Use HTML/Markdown now; EPUB/MOBI can be converted in publishing tools.`);
    }
  };

  return (
    <AgentShell
      title="Ebook Agent"
      subtitle="Professional ebook package from manuscript chapters"
      controls={
        <>
          <ProjectSelector value={projectId} onChange={setProjectId} />
          <button onClick={load} className="rounded-xl bg-rose-500 px-4 py-2 text-sm text-white" disabled={loading}>{loading ? "Loading..." : "Load"}</button>
          <button onClick={run} className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white" disabled={loading}>{loading ? "Generating..." : "Generate Ebook"}</button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error.includes("Not Found")
              ? "Ebook endpoint not found. Restart backend server so new /agents/ebook route is loaded."
              : error}
          </div>
        )}
        {operationText && (
          <div className={`rounded-xl px-4 py-3 text-sm ${loading ? "border border-blue-200 bg-blue-50 text-blue-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {operationText}
          </div>
        )}
        {data && (
          <div className="rounded-2xl border border-rose-100 bg-white p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-rose-600">Book Preview</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setActivePreview("book")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${activePreview === "book" ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-700"}`}
                >
                  Styled Pages
                </button>
                <button
                  onClick={() => setActivePreview("markdown")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${activePreview === "markdown" ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-700"}`}
                >
                  Markdown
                </button>
              </div>
            </div>

            {activePreview === "book" ? (
              <iframe
                title="Book preview"
                srcDoc={data.html_book || ""}
                className="h-[720px] w-full rounded-xl border border-rose-100"
              />
            ) : (
              <pre className="max-h-[720px] overflow-auto whitespace-pre-wrap rounded-xl border border-rose-100 bg-rose-50/30 p-4 text-sm text-slate-700">
                {data.markdown_book || "No markdown preview available."}
              </pre>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-rose-100 bg-white p-6">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-rose-600"><IconEbook className="h-4 w-4" /> Ebook Package</h4>
          {!data && <p className="text-sm text-slate-600">Select a project and generate ebook output.</p>}
          {data && (
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(data.export_files || {}).map(([format, name]) => (
                <div key={format} className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{format}</p>
                  <p className="font-medium text-slate-700">{name}</p>
                  <p className="mt-1 text-xs text-slate-500">{FORMAT_INFO[format] || "Book export format."}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleExportAction(format)}
                      className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      {format === "pdf" ? "Open Print View" : "Download"}
                    </button>
                    {format === "html" && (
                      <button
                        onClick={openHtmlPreview}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Open
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AgentShell>
  );
}


