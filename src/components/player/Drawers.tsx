import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { SPRING_PRESS } from "@/lib/ease";
import { NOTE_NAMES, SONG, transposeChord } from "@/data/song";
import { cn } from "@/utils/cn";

const PRESETS = [80, 92, 100, 110, 120, 140];

export function TempoSheet({
  open,
  onOpenChange,
  bpm,
  onBpm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bpm: number;
  onBpm: (bpm: number) => void;
}) {
  const original = bpm === SONG.bpm;
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Tempo" description="Live — changes apply immediately">
      <div className="px-5 pb-6 pt-2">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <NumberTicker value={bpm} className="text-[56px] font-semibold leading-none tracking-[-0.04em] tabular-nums" />
              <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[var(--fg-3)]">BPM</span>
            </div>
            <p className="mt-2 text-[13px] text-[var(--fg-3)]">
              {original ? "Original tempo" : `${bpm > SONG.bpm ? "+" : ""}${bpm - SONG.bpm} from ${SONG.bpm}`}
            </p>
          </div>
          {!original ? (
            <button
              type="button"
              onClick={() => onBpm(SONG.bpm)}
              className="h-9 rounded-full px-3 text-[12px] text-[var(--fg-2)] hover:bg-[var(--fill)] hover:text-[var(--fg)]"
            >
              Reset
            </button>
          ) : null}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <StepButton label="Slower" onHold={() => onBpm(bpm - 1)}>
            −
          </StepButton>
          <TempoRuler bpm={bpm} onBpm={onBpm} />
          <StepButton label="Faster" onHold={() => onBpm(bpm + 1)}>
            +
          </StepButton>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onBpm(p)}
              className={cn(
                "h-9 rounded-full px-3.5 text-[13px] transition-colors",
                p === bpm ? "bg-[var(--fg)] text-[var(--bg)]" : "text-[var(--fg-2)] hover:bg-[var(--fill)]",
              )}
              style={p !== bpm ? { background: "var(--fill)" } : undefined}
            >
              {p}
              {p === SONG.bpm ? <span className="ml-1 text-[10px] opacity-70">orig</span> : null}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}

function TempoRuler({ bpm, onBpm }: { bpm: number; onBpm: (n: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = (bpm - 40) * 8 - el.clientWidth / 2 + 4;
    el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [bpm]);

  return (
    <div ref={ref} className="no-scrollbar relative h-14 flex-1 overflow-x-auto overscroll-x-contain">
      <div className="relative h-full" style={{ width: (200 - 40) * 8 + 16 }}>
        {Array.from({ length: 161 }).map((_, i) => {
          const value = 40 + i;
          const major = value % 10 === 0;
          return (
            <button
              key={value}
              type="button"
              aria-label={`${value} BPM`}
              onClick={() => onBpm(value)}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: i * 8, width: 8 }}
            >
              <span
                className="w-px rounded-full"
                style={{
                  height: major ? 22 : 10,
                  background: value === bpm ? "var(--fg)" : "var(--hairline-2)",
                }}
              />
              {major ? <span className="mt-1 text-[9px] tabular-nums text-[var(--fg-3)]">{value}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepButton({ label, onHold, children }: { label: string; onHold: () => void; children: ReactNode }) {
  const timer = useRef<number | null>(null);
  const start = () => {
    onHold();
    let delay = 220;
    const loop = () => {
      onHold();
      delay = Math.max(40, delay * 0.86);
      timer.current = window.setTimeout(loop, delay);
    };
    timer.current = window.setTimeout(loop, delay);
  };
  const stop = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };
  return (
    <motion.button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        start();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      whileTap={{ scale: 0.92 }}
      transition={SPRING_PRESS}
      className="grid size-11 shrink-0 place-items-center rounded-full text-[22px] font-medium"
      style={{ background: "var(--fill)" }}
    >
      {children}
    </motion.button>
  );
}

const WHITE = [
  { pc: 0, name: "C" },
  { pc: 2, name: "D" },
  { pc: 4, name: "E" },
  { pc: 5, name: "F" },
  { pc: 7, name: "G" },
  { pc: 9, name: "A" },
  { pc: 11, name: "B" },
];
const BLACK = [
  { pc: 1, n: 1 },
  { pc: 3, n: 2 },
  { pc: 6, n: 4 },
  { pc: 8, n: 5 },
  { pc: 10, n: 6 },
];
const BASE_PC = 9;

export function KeySheet({
  open,
  onOpenChange,
  semitones,
  onSemitones,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semitones: number;
  onSemitones: (n: number) => void;
}) {
  const wrapped = ((semitones % 12) + 12) % 12;
  const index = (BASE_PC + wrapped) % 12;
  const name = `${transposeChord("A", semitones)}m`;
  const original = semitones === 0;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Key" description="Chords transpose together">
      <div className="px-5 pb-6 pt-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[56px] font-semibold leading-none tracking-[-0.04em]">{name}</p>
            <p className="mt-2 text-[13px] text-[var(--fg-3)]">
              {original
                ? "Original key"
                : `${Math.abs(semitones)} ${Math.abs(semitones) === 1 ? "semitone" : "semitones"} ${semitones > 0 ? "up" : "down"}`}
            </p>
          </div>
          {!original ? (
            <button
              type="button"
              onClick={() => onSemitones(0)}
              className="h-9 rounded-full px-3 text-[12px] text-[var(--fg-2)] hover:bg-[var(--fill)] hover:text-[var(--fg)]"
            >
              Reset
            </button>
          ) : null}
        </div>

        <div className="relative mt-6 h-36">
          <div className="absolute inset-0 flex gap-1">
            {WHITE.map((k) => {
              const active = index === k.pc;
              return (
                <motion.button
                  key={k.name}
                  type="button"
                  aria-label={NOTE_NAMES[k.pc]}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    onSemitones(k.pc - BASE_PC);
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={SPRING_PRESS}
                  className="relative h-full flex-1 rounded-[10px]"
                  style={{
                    background: active ? "var(--fg)" : "var(--surface-2)",
                    color: active ? "var(--bg)" : "var(--fg-2)",
                  }}
                >
                  <span className="absolute bottom-3 left-0 right-0 text-center text-[12px] font-medium">{k.name}</span>
                </motion.button>
              );
            })}
          </div>
          {BLACK.map((k) => {
            const active = index === k.pc;
            const left = `calc(${(k.n / 7) * 100}% - 14px)`;
            return (
              <motion.button
                key={k.pc}
                type="button"
                aria-label={NOTE_NAMES[k.pc]}
                onPointerDown={(e) => {
                  e.preventDefault();
                  onSemitones(k.pc - BASE_PC);
                }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING_PRESS}
                className="absolute top-0 h-[58%] w-7 rounded-[8px]"
                style={{
                  left,
                  background: active ? "var(--fg)" : "var(--fg)",
                  opacity: active ? 1 : 0.88,
                  color: "var(--bg)",
                }}
              />
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}
