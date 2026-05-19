import { useState } from "react";

export default function RagChatPanel({ onAsk, loading }) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState([]);

  const submit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    const q = question;
    setQuestion("");
    const response = await onAsk(q);
    setHistory((prev) => [{ question: q, answer: response.answer }, ...prev]);
  };

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold">Personalized Assistant</h3>
      <form onSubmit={submit} className="flex gap-2">
        <input className="flex-1 rounded border p-2" placeholder="Ask about your project, books, chapters, metadata, assets, or workflow..." value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white" type="submit" disabled={loading}>{loading ? "Asking..." : "Ask"}</button>
      </form>
      <div className="mt-4 space-y-2">
        {history.map((item, idx) => (
          <div key={idx} className="rounded border p-3 text-sm">
            <p className="font-semibold">Q: {item.question}</p>
            <p className="mt-1 text-slate-700">A: {item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
