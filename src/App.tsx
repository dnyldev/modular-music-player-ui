import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Library } from "@/components/library/Library";
import { UploadSheet } from "@/components/library/UploadSheet";
import { PlayerShell } from "@/components/player/PlayerShell";
import { KeySheet, TempoSheet } from "@/components/player/Drawers";
import { Toast } from "@/components/ui/Toast";
import { useExtraction } from "@/hooks/useExtraction";
import { useLibrary } from "@/hooks/useLibrary";
import { useToast } from "@/hooks/useToast";
import { useTransport } from "@/hooks/useTransport";
import { JOB_META } from "@/data/pipelines";
import { EASE_OUT } from "@/lib/ease";
import type { DockId, JobKind, PanelId, RibbonMode, Theme } from "@/data/types";

export default function App() {
  const transport = useTransport();
  const extraction = useExtraction();
  const library = useLibrary();
  const { toast, flash, dismiss } = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("day");
  const [mode, setMode] = useState<RibbonMode>("follow");
  const [panels, setPanels] = useState<PanelId[]>([]);
  const [tempoOpen, setTempoOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [mixerOpen, setMixerOpen] = useState(false);
  const [mixerPeek, setMixerPeek] = useState(true);
  const peekTimer = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector("meta[name='theme-color']")?.setAttribute("content", theme === "night" ? "#0b0b0c" : "#ecebe7");
  }, [theme]);

  const bumpPeek = useCallback(() => {
    setMixerPeek(true);
    if (peekTimer.current) window.clearTimeout(peekTimer.current);
    peekTimer.current = window.setTimeout(() => setMixerPeek(false), 3200);
  }, []);

  useEffect(() => {
    if (sheetOpen && !mixerOpen) bumpPeek();
    return () => {
      if (peekTimer.current) window.clearTimeout(peekTimer.current);
    };
  }, [sheetOpen, mixerOpen, bumpPeek]);

  const togglePanel = useCallback((id: PanelId) => {
    setPanels((open) => (open.includes(id) ? open.filter((p) => p !== id) : [...open, id]));
  }, []);

  const closePanel = useCallback((id: PanelId) => {
    setPanels((open) => open.filter((p) => p !== id));
  }, []);

  const toggleDock = useCallback(
    (id: DockId) => {
      if (id === "mixer") {
        setMixerOpen((open) => !open);
        return;
      }
      togglePanel(id);
    },
    [togglePanel],
  );

  const openPanel = useCallback((id: DockId) => {
    if (id === "mixer") setMixerOpen(true);
    else setPanels((open) => (open.includes(id) ? open : [...open, id]));
    setSheetOpen(true);
  }, []);

  const startJob = useCallback(
    (kind: JobKind) => {
      extraction.start(kind);
      flash(`${JOB_META[kind].running}…`);
    },
    [extraction, flash],
  );

  const cancelJob = useCallback(
    (kind: JobKind) => {
      extraction.cancel(kind);
      flash("Job cancelled");
    },
    [extraction, flash],
  );

  const retryJob = useCallback(
    (kind: JobKind) => {
      extraction.reset(kind);
      extraction.start(kind);
      flash(`${JOB_META[kind].running}…`);
    },
    [extraction, flash],
  );

  const prevJobs = useRef(extraction.jobs);
  const prevUpload = useRef(library.upload.phase);
  useEffect(() => {
    (["chords", "lyrics", "stems"] as const).forEach((kind) => {
      if (prevJobs.current[kind].status !== "complete" && extraction.jobs[kind].status === "complete") {
        flash(JOB_META[kind].done, { tone: "success" });
      }
      if (prevJobs.current[kind].status !== "error" && extraction.jobs[kind].status === "error") {
        flash(extraction.jobs[kind].error ?? "Analysis failed", { tone: "danger" });
      }
    });
    prevJobs.current = extraction.jobs;
  }, [extraction.jobs, flash]);

  useEffect(() => {
    const phase = library.upload.phase;
    if (prevUpload.current !== phase) {
      if (phase === "success") flash("Track added to library", { tone: "success" });
      if (phase === "error") flash(library.upload.error ?? "Upload failed", { tone: "danger" });
      if (phase === "cancelled") flash("Upload cancelled");
      if (phase === "rejected") flash(library.upload.error ?? "File rejected");
    }
    prevUpload.current = phase;
  }, [flash, library.upload.error, library.upload.phase]);

  const toggle = transport.toggle;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      switch (event.key) {
        case " ":
          event.preventDefault();
          toggle();
          break;
        case "ArrowLeft":
          transport.skip(-5);
          break;
        case "ArrowRight":
          transport.skip(5);
          break;
        case "c":
        case "C":
          togglePanel("chords");
          setSheetOpen(true);
          break;
        case "l":
        case "L":
          togglePanel("lyrics");
          setSheetOpen(true);
          break;
        case "m":
        case "M":
          setMixerOpen((open) => !open);
          setSheetOpen(true);
          break;
        case "t":
        case "T":
          setTempoOpen(true);
          break;
        case "k":
        case "K":
          setKeyOpen(true);
          break;
        case "f":
        case "F":
          setMode((m) => (m === "follow" ? "map" : "follow"));
          break;
        case "Escape":
          if (tempoOpen || keyOpen || mixerOpen) {
            setTempoOpen(false);
            setKeyOpen(false);
            setMixerOpen(false);
            return;
          }
          if (panels.length) {
            setPanels([]);
            return;
          }
          setSheetOpen(false);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, transport, togglePanel, tempoOpen, keyOpen, mixerOpen, panels.length]);

  const prevEnded = useRef(false);
  useEffect(() => {
    if (transport.ended && !prevEnded.current) flash("Reached the end");
    prevEnded.current = transport.ended;
  }, [flash, transport.ended]);

  const onTheme = useCallback(() => setTheme((t) => (t === "night" ? "day" : "night")), []);

  const openTrack = useCallback(
    (id: string) => {
      const track = library.tracks.find((t) => t.id === id);
      if (!track) return;
      if (track.status !== "ready") {
        flash(track.status === "failed" ? "This upload failed — retry it first." : "Still preparing this track.");
        library.setUploadOpen(true);
        return;
      }
      library.setCurrentId(id);
      setSheetOpen(true);
    },
    [flash, library],
  );

  return (
    <div
      className="flex min-h-full items-center justify-center md:p-6"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="relative isolate h-dvh w-full max-w-[430px] overflow-hidden md:h-[min(844px,calc(100dvh-48px))] md:rounded-[36px]"
        style={{ background: "var(--bg)", boxShadow: "0 0 0 0.5px var(--hairline), var(--shadow-float)" }}
      >
        <motion.div
          className="h-full origin-center"
          animate={{ scale: sheetOpen ? 0.978 : 1, opacity: sheetOpen ? 0.72 : 1 }}
          transition={{ duration: 0.42, ease: EASE_OUT }}
        >
          <Library
            tracks={library.tracks}
            current={library.current}
            playing={transport.playing}
            sheetOpen={sheetOpen}
            onToggle={() => transport.toggle()}
            onOpen={openTrack}
            onOpenPanel={openPanel}
            onClose={() => setSheetOpen(false)}
            onUpload={() => library.setUploadOpen(true)}
            onFavorite={(id) => {
              library.toggleFavorite(id);
              const t = library.tracks.find((x) => x.id === id);
              flash(t && !t.favorite ? "Added to favorites" : "Removed from favorites");
            }}
            onQueue={(id) => {
              library.toggleQueued(id);
              const t = library.tracks.find((x) => x.id === id);
              flash(t && !t.queued ? "Queued next" : "Removed from queue");
            }}
            onDelete={(id) => {
              library.removeTrack(id);
              flash("Removed from library", {
                action: { label: "Undo", onClick: library.undoRemove },
              });
            }}
            onRetry={library.retryTrack}
            onShare={() => flash("Link copied — display only")}
          />
        </motion.div>

        <PlayerShell
          open={sheetOpen}
          onOpenChange={(open) => {
            if (!open && (tempoOpen || keyOpen || mixerOpen)) {
              setTempoOpen(false);
              setKeyOpen(false);
              setMixerOpen(false);
              return;
            }
            setSheetOpen(open);
          }}
          theme={theme}
          onTheme={onTheme}
          track={library.current}
          mode={mode}
          onMode={setMode}
          panels={panels}
          mixerOpen={mixerOpen}
          mixerPeek={mixerPeek}
          onMixerPeekReveal={bumpPeek}
          jobs={extraction.jobs}
          onPanel={toggleDock}
          onClosePanel={closePanel}
          onExtract={startJob}
          onCancelExtract={cancelJob}
          onRetryExtract={retryJob}
          onToast={flash}
          beat={transport.beat}
          playing={transport.playing}
          bpm={transport.bpm}
          semitones={transport.semitones}
          secPerBeat={transport.secPerBeat}
          mix={transport.mix}
          levels={transport.levels}
          onToggle={() => transport.toggle()}
          onSeek={transport.seekBeat}
          onSkip={transport.skip}
          onOpenTempo={() => setTempoOpen(true)}
          onOpenKey={() => setKeyOpen(true)}
          onMixerChange={setMixerOpen}
          onStemLevel={transport.setStemLevel}
          onMute={transport.toggleMute}
          onResetMix={transport.resetMix}
        />

        <TempoSheet open={tempoOpen} onOpenChange={setTempoOpen} bpm={transport.bpm} onBpm={transport.setBpm} />
        <KeySheet open={keyOpen} onOpenChange={setKeyOpen} semitones={transport.semitones} onSemitones={transport.setSemitones} />

        <UploadSheet
          open={library.uploadOpen}
          onOpenChange={library.setUploadOpen}
          upload={library.upload}
          onFile={library.beginFile}
          onCancel={library.cancelUpload}
          onRetry={library.retryUpload}
          onReset={library.resetUpload}
        />

        <Toast toast={toast} onDismiss={dismiss} />
      </div>
    </div>
  );
}
