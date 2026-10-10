import { AnimatePresence, motion } from "motion/react";
import { Header } from "@/components/player/Header";
import { Ribbon } from "@/components/player/Ribbon";
import { Transport } from "@/components/player/Transport";
import { PanelHost } from "@/components/player/PanelHost";
import { Visualizer } from "@/components/player/Visualizer";
import { MixerDrawer, MixerPeek } from "@/components/player/MixerDrawer";
import { EASE_OUT } from "@/lib/ease";
import type { DockId, JobState, MixState, PanelId, RibbonMode, StemId, Theme, Track } from "@/data/types";

interface PlayerShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: Theme;
  onTheme: () => void;
  track: Track;
  mode: RibbonMode;
  onMode: (mode: RibbonMode) => void;
  panels: PanelId[];
  mixerOpen: boolean;
  mixerPeek: boolean;
  onMixerPeekReveal: () => void;
  jobs: Record<"chords" | "lyrics" | "stems", JobState>;
  onPanel: (panel: DockId) => void;
  onClosePanel: (panel: PanelId) => void;
  onExtract: (kind: "chords" | "lyrics" | "stems") => void;
  onCancelExtract: (kind: "chords" | "lyrics" | "stems") => void;
  onRetryExtract: (kind: "chords" | "lyrics" | "stems") => void;
  onToast: (message: string) => void;
  beat: number;
  playing: boolean;
  bpm: number;
  semitones: number;
  secPerBeat: number;
  mix: Record<StemId, MixState>;
  levels: Record<StemId, number>;
  onToggle: () => void;
  onSeek: (beat: number) => void;
  onSkip: (seconds: number) => void;
  onOpenTempo: () => void;
  onOpenKey: () => void;
  onMixerChange: (open: boolean) => void;
  onStemLevel: (id: StemId, level: number) => void;
  onMute: (id: StemId) => void;
  onResetMix: () => void;
}

export function PlayerShell(props: PlayerShellProps) {
  const { open, playing, beat, panels, jobs, track } = props;
  const anyPanel = panels.length > 0;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="absolute inset-0 z-20 flex flex-col overflow-hidden"
          style={{ background: "var(--sheet)", color: "var(--fg)" }}
          onPointerDown={props.onMixerPeekReveal}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.46, ease: EASE_OUT }}
        >
          <Header
            theme={props.theme}
            onTheme={props.onTheme}
            onClose={() => props.onOpenChange(false)}
            onPanel={props.onPanel}
            onToast={props.onToast}
            jobs={jobs}
          />

          <Ribbon
            beat={beat}
            playing={playing}
            semitones={props.semitones}
            mode={props.mode}
            compact={anyPanel}
            chords={jobs.chords}
            onModeChange={props.onMode}
            onSeek={props.onSeek}
            onExtract={() => props.onExtract("chords")}
            onCancelExtract={() => props.onCancelExtract("chords")}
            onRetryExtract={() => props.onRetryExtract("chords")}
          />

          {anyPanel ? (
            <PanelHost
              panels={panels}
              beat={beat}
              semitones={props.semitones}
              jobs={{ chords: jobs.chords, lyrics: jobs.lyrics }}
              onClose={props.onClosePanel}
              onExtract={props.onExtract}
              onCancel={props.onCancelExtract}
              onRetry={props.onRetryExtract}
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8">
              <p className="text-center text-[26px] font-semibold leading-tight tracking-[-0.04em]">{track.title}</p>
              <p className="mt-2 text-[14px] text-[var(--fg-3)]">
                {track.artist} · {track.album}
              </p>
              <div className="mt-8 w-full max-w-[280px]">
                <Visualizer playing={playing} levels={props.levels} height={42} />
              </div>
            </div>
          )}

          <MixerPeek visible={props.mixerPeek && !props.mixerOpen} onOpen={() => props.onMixerChange(true)} onReveal={props.onMixerPeekReveal} />

          <Transport
            playing={playing}
            beat={beat}
            bpm={props.bpm}
            semitones={props.semitones}
            secPerBeat={props.secPerBeat}
            onToggle={props.onToggle}
            onSeek={props.onSeek}
            onSkip={props.onSkip}
            onOpenTempo={props.onOpenTempo}
            onOpenKey={props.onOpenKey}
          />

          <MixerDrawer
            open={props.mixerOpen}
            onOpenChange={props.onMixerChange}
            mix={props.mix}
            levels={props.levels}
            stemsJob={jobs.stems}
            onStemLevel={props.onStemLevel}
            onMute={props.onMute}
            onReset={props.onResetMix}
            onExtract={() => props.onExtract("stems")}
            onCancelExtract={() => props.onCancelExtract("stems")}
            onRetryExtract={() => props.onRetryExtract("stems")}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
