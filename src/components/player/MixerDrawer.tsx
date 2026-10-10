import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AudioLines, Drum, Guitar, Mic, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/Slider";
import { ExtractState } from "@/components/extract/ExtractState";
import { STEMS } from "@/data/song";
import { EASE_DRAWER, SPRING_PRESS } from "@/lib/ease";
import type { JobState, MixState, StemId } from "@/data/types";
import { cn } from "@/utils/cn";

const ICONS: Record<StemId, typeof Mic> = {
  vocals: Mic,
  drums: Drum,
  bass: AudioLines,
  other: Guitar,
};

interface MixerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mix: Record<StemId, MixState>;
  levels: Record<StemId, number>;
  stemsJob: JobState;
  onStemLevel: (id: StemId, level: number) => void;
  onMute: (id: StemId) => void;
  onReset: () => void;
  onExtract: () => void;
  onCancelExtract: () => void;
  onRetryExtract: () => void;
}

export function MixerDrawer({
  open,
  onOpenChange,
  mix,
  levels,
  stemsJob,
  onStemLevel,
  onMute,
  onReset,
  onExtract,
  onCancelExtract,
  onRetryExtract,
}: MixerDrawerProps) {
  const ready = stemsJob.status === "complete";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close mixer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40"
            style={{ background: "var(--scrim)" }}
            onClick={() => onOpenChange(false)}
          />
          <motion.aside
            role="dialog"
            aria-label="Mixer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.42, ease: EASE_DRAWER }}
            className="absolute bottom-0 left-0 top-0 z-50 flex w-[min(86%,340px)] flex-col"
            style={{ background: "var(--sheet)", boxShadow: "var(--shadow-float)" }}
          >
            <div className="flex items-end justify-between px-5 pb-2 pt-[max(18px,calc(var(--safe-t)+14px))]">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--fg-3)]">Mix</p>
                <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">Stems</h2>
              </div>
              {ready ? (
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[12px] text-[var(--fg-2)] hover:bg-[var(--fill)]"
                >
                  <RotateCcw className="size-3" />
                  Reset
                </button>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-2">
              {ready ? (
                <div className="space-y-5">
                  {STEMS.map((stem) => {
                    const Icon = ICONS[stem.id];
                    const bus = mix[stem.id];
                    return (
                      <div key={stem.id} className="flex items-center gap-3">
                        <motion.button
                          type="button"
                          aria-label={`${bus.muted ? "Unmute" : "Mute"} ${stem.label}`}
                          onClick={() => onMute(stem.id)}
                          whileTap={{ scale: 0.92 }}
                          transition={SPRING_PRESS}
                          className={cn(
                            "grid size-10 shrink-0 place-items-center rounded-full",
                            bus.muted && "opacity-40",
                          )}
                          style={{ background: "var(--fill)" }}
                        >
                          <Icon className="size-4" />
                        </motion.button>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-baseline justify-between">
                            <span className="text-[13px] font-medium">{stem.label}</span>
                            <span className="font-mono text-[11px] tabular-nums text-[var(--fg-3)]">
                              {Math.round(bus.level * 100)}
                            </span>
                          </div>
                          <div className="relative">
                            <Slider
                              value={bus.level}
                              onChange={(v) => onStemLevel(stem.id, v)}
                              disabled={bus.muted}
                              ariaLabel={`${stem.label} level`}
                            />
                            <span
                              className="pointer-events-none absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
                              style={{
                                left: `${Math.min(96, levels[stem.id] * 100)}%`,
                                background: "var(--accent)",
                                opacity: bus.muted ? 0 : 0.9,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ExtractState
                  kind="stems"
                  job={stemsJob}
                  onStart={onExtract}
                  onCancel={onCancelExtract}
                  onRetry={onRetryExtract}
                />
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function MixerPeek({
  visible,
  onOpen,
  onReveal,
}: {
  visible: boolean;
  onOpen: () => void;
  onReveal: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="pointer-events-none absolute bottom-[148px] left-0 z-30"
      onPointerEnter={() => {
        setHovered(true);
        onReveal();
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <motion.button
        type="button"
        aria-label="Open mixer"
        onClick={onOpen}
        onPointerDown={onReveal}
        animate={{
          x: visible || hovered ? 0 : -18,
          opacity: visible || hovered ? 1 : 0.85,
        }}
        transition={{ duration: 0.45, ease: EASE_DRAWER }}
        className="pointer-events-auto flex h-12 items-center rounded-r-full pl-2 pr-3"
        style={{
          background: "var(--fg)",
          color: "var(--bg)",
          boxShadow: "var(--shadow-float)",
        }}
      >
        <SlidersHorizontal className="size-[15px]" />
      </motion.button>
    </div>
  );
}
