import { useEffect, useRef, useState } from "react";
import { IconBook, IconUpload } from "../components/Icons";
import { apiService } from "../services/api";

const supported = ".pdf,.docx,.txt";
const manuscriptTypes = [
  "Fiction",
  "Non-Fiction",
  "Technical",
  "Academic",
  "Business",
  "Self-Help",
  "Biography",
  "Children",
  "Poetry",
  "Other",
];

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [manuscriptType, setManuscriptType] = useState("");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const typeRef = useRef(null);

  useEffect(() => {
    const onDocClick = (event) => {
      if (!typeRef.current?.contains(event.target)) {
        setTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const onFileSelected = (nextFile) => {
    setFile(nextFile);
    setMessage("");
    setProgress(0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileSelected(dropped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !file || !manuscriptType) {
      setMessage("Title, manuscript type, and file are required.");
      return;
    }

    try {
      const project = await apiService.createProject({ title, description, manuscript_type: manuscriptType });
      await apiService.uploadManuscript(project.id, file, setProgress);
      setMessage("Upload and parsing completed.");
      setTitle("");
      setDescription("");
      setManuscriptType("");
      setFile(null);
      setProgress(100);
    } catch (error) {
      setMessage(`Failed: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-4xl font-bold text-rose-700"><IconUpload className="h-7 w-7" /> Upload Manuscript</h2>
        <p className="mt-2 text-sm text-slate-500">Create a project, choose manuscript type, and upload source file for parsing.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-rose-500">Project Title</label>
          <input className="w-full rounded-2xl border border-rose-200 bg-rose-50/20 px-4 py-3 text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100" placeholder="Project title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-rose-500">Manuscript Type</label>
          <div ref={typeRef} className="relative">
            <button
              type="button"
              onClick={() => setTypeOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-2xl border border-rose-200 bg-gradient-to-b from-white to-rose-50/30 px-4 py-3 text-left text-slate-800 shadow-sm outline-none transition hover:border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            >
              <span>{manuscriptType || "Select manuscript type"}</span>
              <span className={`transition ${typeOpen ? "rotate-180" : ""}`}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-slate-500">
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </button>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
              <input type="hidden" name="manuscriptType" value={manuscriptType} />
            </span>
            {typeOpen && (
              <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-rose-200 bg-white p-1 shadow-xl">
                <button
                  type="button"
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${!manuscriptType ? "bg-rose-100 text-rose-700" : "text-slate-700 hover:bg-rose-50"}`}
                  onClick={() => {
                    setManuscriptType("");
                    setTypeOpen(false);
                  }}
                >
                  Select manuscript type
                </button>
                {manuscriptTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${manuscriptType === type ? "bg-rose-100 text-rose-700" : "text-slate-700 hover:bg-rose-50"}`}
                    onClick={() => {
                      setManuscriptType(type);
                      setTypeOpen(false);
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-rose-500">Description</label>
          <textarea className="w-full rounded-2xl border border-rose-200 bg-rose-50/20 px-4 py-3 text-slate-800 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100" rows={4} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-rose-500 bg-rose-50" : "border-rose-200 bg-gradient-to-br from-rose-50/20 to-white"}`}
        >
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-slate-700"><IconBook className="h-4 w-4 text-rose-500" /> Drag and drop manuscript here</p>
          <p className="mt-1 text-xs text-slate-500">Supported: PDF, DOCX, TXT</p>
          <p className="my-3 text-xs text-slate-500">or</p>
          <label className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm">
            Choose File
            <input type="file" accept={supported} className="hidden" onChange={(e) => onFileSelected(e.target.files?.[0] || null)} />
          </label>
          {file && <p className="mt-3 rounded-lg bg-rose-100/70 px-3 py-2 text-sm text-rose-700">Selected: {file.name}</p>}
        </div>

        {progress > 0 && (
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-500">Upload Progress: {progress}%</div>
            <div className="h-2.5 w-full rounded-full bg-rose-100">
              <div className="h-2.5 rounded-full bg-rose-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <button type="submit" className="rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm">Create + Upload + Parse</button>
      </form>

      {message && <p className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-slate-700">{message}</p>}
    </div>
  );
}
