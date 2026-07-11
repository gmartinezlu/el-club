import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { EmotionalResource } from "../../resources/types";
import { EmotionalGlass } from "./EmotionalGlass";

export function MeditationPlayer({ resource }: { resource: EmotionalResource }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function togglePlay() {
    if (!resource.mediaUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  }

  return (
    <EmotionalGlass className="p-6 md:p-8">
      <p className="font-display text-3xl text-club-green">{resource.title}</p>
      {resource.description ? (
        <p className="mt-2 text-sm leading-relaxed text-club-muted">
          {resource.description}
        </p>
      ) : null}

      {resource.mediaUrl ? (
        <>
          <audio
            ref={audioRef}
            src={resource.mediaUrl}
            onEnded={() => setPlaying(false)}
            preload="metadata"
          />
          <button
            type="button"
            onClick={togglePlay}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-club-green px-5 py-3 text-sm text-club-paper shadow-soft transition hover:opacity-95"
          >
            {playing ? (
              <Pause className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Play className="h-4 w-4" strokeWidth={1.5} />
            )}
            {playing ? "Pausar" : "Reproducir"}
          </button>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-club-green/10 bg-white/50 p-4">
          <p className="text-sm text-club-muted">
            {resource.content ??
              "Próximamente: audio guiado. Mientras tanto, puedes leer la guía con calma."}
          </p>
          {resource.durationMinutes ? (
            <p className="mt-2 text-xs text-club-green">
              Duración sugerida: {resource.durationMinutes} min
            </p>
          ) : null}
        </div>
      )}
    </EmotionalGlass>
  );
}
