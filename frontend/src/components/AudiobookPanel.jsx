function toPublicAudioUrl(audioFilePath) {
  if (!audioFilePath) return "";
  const normalized = audioFilePath.replaceAll("\\", "/");
  const index = normalized.indexOf("storage/");
  const relative = index >= 0 ? normalized.slice(index) : normalized;
  return `http://localhost:8000/${relative}`;
}

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

function formatVoiceLabel(voice) {
  if (!voice) return "Voice";
  return String(voice)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AudiobookPanel({ audiobookAssets = [], onRun, loading = false, runningVoice = "" }) {
  const latest = audiobookAssets[0]?.content;
  const fallbackVoices = ["narrator", "male", "female", "calm", "motivated", "angry", "dramatic", "whisper", "energetic"];
  const availableVoices = Array.isArray(latest?.available_voices) && latest.available_voices.length > 0 ? latest.available_voices : fallbackVoices;
  const activeVoiceLabel = runningVoice ? formatVoiceLabel(runningVoice) : "Selected Voice";

  return (
    <div className="rounded-xl border border-rose-100 bg-white p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-800">Audiobook Panel</h3>
        <div className="flex flex-wrap gap-2">
          {availableVoices.map((voice, idx) => (
            <button
              key={voice}
              onClick={() => onRun(voice)}
              disabled={loading}
              className={`rounded-lg px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60 ${idx === 0 ? "bg-slate-900" : "bg-slate-600"}`}
            >
              {loading && runningVoice === voice ? "Generating..." : formatVoiceLabel(voice)}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-700" />
          <span>Generating audiobook for {activeVoiceLabel}. Please wait...</span>
        </div>
      )}

      {!latest && <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">No audiobook chapters generated yet.</p>}

      {latest && (
        <>
          <div className="space-y-3">
            {latest.chapters?.map((chapter, idx) => {
              const audioUrl = toPublicAudioUrl(chapter.audio_file);
              const audioType = chapter.audio_format === "wav" ? "audio/wav" : "audio/mpeg";
              return (
                <div key={chapter.chapter_id || idx} className="rounded-xl border border-rose-100 bg-white p-4">
                  <p className="font-medium text-slate-800">{renderSafe(chapter.chapter_number)}. {renderSafe(chapter.title)}</p>
                  <p className="text-xs text-slate-500">
                    Voice: {renderSafe(chapter.voice)} | Duration: {renderSafe(chapter.duration_seconds || 0)}s
                  </p>
                  {chapter.notes && <pre className="mt-1 whitespace-pre-wrap text-xs leading-6 text-slate-600">{renderSafe(chapter.notes)}</pre>}
                  <audio controls className="mt-2 w-full">
                    <source src={audioUrl} type={audioType} />
                  </audio>
                  <a className="mt-2 inline-block text-sm text-blue-600 underline" href={audioUrl} download>
                    Download {renderSafe(chapter.audio_format || "audio").toUpperCase()}
                  </a>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4 text-sm">
            <p><span className="font-semibold">Voice:</span> {renderSafe(latest.voice)}</p>
            <p><span className="font-semibold">Pacing:</span> {renderSafe(latest.voice_plan?.pacing_notes || "balanced")}</p>
            <p><span className="font-semibold">Narration:</span> {renderSafe(latest.voice_plan?.narration_notes || "clear")}</p>
            {latest.voice_plan && (
              <pre className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-600">{renderSafe(latest.voice_plan)}</pre>
            )}
          </div>
        </>
      )}
    </div>
  );
}
