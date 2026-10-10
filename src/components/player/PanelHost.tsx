import { motion } from "motion/react";
import { X } from "lucide-react";
import { BARS, LYRICS, UNIQUE_CHORDS, lyricIndexAtBeat } from "@/data/song";
import { ChordDiagram } from "@/components/player/ChordDiagram";
import { ExtractState } from "@/components/extract/ExtractState";
import { EASE_OUT } from "@/lib/ease";
import type { JobState, PanelId } from "@/data/types";
import { cn } from "@/utils/cn";

interface PanelHostProps {
  panels: PanelId[];
  beat: number;
  semitones: number;
  jobs: Record<"chords" | "lyrics", JobState>;
  onClose: (id: PanelId) => void;
  onExtract: (kind: "chords" | "lyrics") => void;
  onCancel: (kind: "chords" | "lyrics") => void;
  onRetry: (kind: "chords" | "lyrics") => void;
}

export function PanelHost({ panels, beat, semitones, jobs, onClose, onExtract, onCancel, onRetry }: PanelHostProps) {
  if (!panels.length) return null;
  const split = panels.length > 1;

  return (
    <div className={cn("flex min-h-0 flex-1 gap-0 px-5", split && "flex-col sm:flex-row")}>
      {panels.map((id) => (
        <section key={id} className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between pb-2 pt-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--fg-3)]">
              {id === "chords" ? "Voicings" : "Lyrics"}
            </p>
            <button
              type="button"
              aria-label={`Close ${id}`}
              onClick={() => onClose(id)}
              className="grid size-7 place-items-center rounded-full text-[var(--fg-3)] hover:bg-[var(--fill)] hover:text-[var(--fg)]"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pb-3">
            {id === "chords" ? (
              <ChordsPanel
                job={jobs.chords}
                semitones={semitones}
                onExtract={() => onExtract("chords")}
                onCancel={() => onCancel("chords")}
                onRetry={() => onRetry("chords")}
              />
            ) : (
              <LyricsPanel
                beat={beat}
                job={jobs.lyrics}
                onExtract={() => onExtract("lyrics")}
                onCancel={() => onCancel("lyrics")}
                onRetry={() => onRetry("lyrics")}
              />
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function ChordsPanel({
  job,
  semitones,
  onExtract,
  onCancel,
  onRetry,
}: {
  job: JobState;
  semitones: number;
  onExtract: () => void;
  onCancel: () => void;
  onRetry: () => void;
}) {
  if (job.status !== "complete") {
    return (
      <ExtractState kind="chords" job={job} onStart={onExtract} onCancel={onCancel} onRetry={onRetry} />
    );
  }

  return (
    <div>
      {BARS[0] ? (
        <p className="mb-4 text-[12px] text-[var(--fg-3)]">Afterglow Sessions · guitar shapes</p>
      ) : null}
      <div className="grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-4">
        {UNIQUE_CHORDS.map((symbol) => (
          <ChordDiagram key={symbol} symbol={symbol} semitones={semitones} />
        ))}
      </div>
    </div>
  );
}

function LyricsPanel({
  beat,
  job,
  onExtract,
  onCancel,
  onRetry,
}: {
  beat: number;
  job: JobState;
  onExtract: () => void;
  onCancel: () => void;
  onRetry: () => void;
}) {
  if (job.status !== "complete") {
    return (
      <ExtractState kind="lyrics" job={job} onStart={onExtract} onCancel={onCancel} onRetry={onRetry} />
    );
  }

  const active = lyricIndexAtBeat(beat);

  return (
    <div className="space-y-1 pr-1">
      {LYRICS.map((line, i) => {
        const on = i === active;
        const past = i < active;
        return (
          <motion.p
            key={line.beat}
            layout
            initial={false}
            animate={{ opacity: on ? 1 : past ? 0.38 : 0.72, x: on ? 0 : 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className={cn(
              "py-1.5 text-[18px] leading-snug tracking-[-0.02em]",
              on && "font-medium",
            )}
          >
            {line.text}
          </motion.p>
        );
      })}
    </div>
  );
}


