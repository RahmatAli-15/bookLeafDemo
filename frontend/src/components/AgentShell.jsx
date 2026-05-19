export default function AgentShell({ title, subtitle, controls, children }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-rose-100 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-rose-700">{title}</h2>
            <p className="text-sm text-rose-400">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">{controls}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
