import { useState } from "react";

export default function ChapterViewer({ chapters }) {
  const [openChapterId, setOpenChapterId] = useState(null);

  if (!chapters?.length) {
    return <p className="text-sm text-slate-500">No chapters available.</p>;
  }

  return (
    <div className="space-y-3">
      {chapters.map((chapter) => {
        const isOpen = openChapterId === chapter.id;
        return (
          <div key={chapter.id} className="rounded border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              onClick={() => setOpenChapterId(isOpen ? null : chapter.id)}
            >
              <span className="font-medium">{chapter.chapter_number}. {chapter.title}</span>
              <span className="text-xs text-slate-500">{isOpen ? "Hide" : "View"}</span>
            </button>
            {isOpen && (
              <div className="border-t px-4 py-3">
                <p className="whitespace-pre-wrap text-sm text-slate-700">{chapter.content}</p>
                <p className="mt-2 text-xs text-slate-500">Chunks: {chapter.chunks?.length || 0}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
