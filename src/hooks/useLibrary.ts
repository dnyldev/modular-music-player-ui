import { useCallback, useRef, useState } from "react";
import { REJECT_COPY, SEED_TRACKS, validateUpload } from "@/data/library";
import type { Track, UploadPhase, UploadReject } from "@/data/types";


export interface UploadState {
  phase: UploadPhase;
  fileName: string | null;
  fileSize: number;
  progress: number;
  reject: UploadReject | null;
  error: string | null;
  trackId: string | null;
  stage: string;
}

const idleUpload = (): UploadState => ({
  phase: "idle",
  fileName: null,
  fileSize: 0,
  progress: 0,
  reject: null,
  error: null,
  trackId: null,
  stage: "",
});

function titleFromFile(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function useLibrary() {
  const [tracks, setTracks] = useState<Track[]>(SEED_TRACKS);
  const [currentId, setCurrentId] = useState(SEED_TRACKS[0].id);
  const [upload, setUpload] = useState<UploadState>(idleUpload());
  const [uploadOpen, setUploadOpen] = useState(false);
  const timers = useRef<number[]>([]);
  const cancelled = useRef(false);
  const trash = useRef<Track | null>(null);

  const patchTrack = useCallback((id: string, next: Partial<Track>) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...next } : t)));
  }, []);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const later = (ms: number, fn: () => void) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  const resetUpload = useCallback(() => {
    cancelled.current = true;
    clearTimers();
    setUpload(idleUpload());
  }, []);

  const cancelUpload = useCallback(() => {
    cancelled.current = true;
    clearTimers();
    setUpload((u) => {
      if (u.trackId) {
        setTracks((prev) => prev.filter((t) => t.id !== u.trackId));
      }
      return { ...u, phase: "cancelled", progress: 0, stage: "Stopped", error: "Upload cancelled." };
    });
  }, []);

  const runPipeline = useCallback(
    (id: string, file: File, forceError: boolean) => {
      cancelled.current = false;
      const stages: { phase: UploadPhase; label: string; ms: number }[] = [
        { phase: "uploading", label: "Uploading source", ms: 1600 },
        { phase: "processing", label: "Decoding & loudness", ms: 1100 },
        { phase: "analyzing", label: "Fingerprinting mix", ms: 1400 },
      ];

      const tickPhase = (index: number) => {
        if (cancelled.current) return;
        if (forceError && index === 1) {
          patchTrack(id, { status: "failed", progress: 0.42, error: "The server dropped the transfer." });
          setUpload((u) => ({
            ...u,
            phase: "error",
            progress: 0.42,
            error: "Connection dropped while uploading. You can retry.",
            stage: "Failed",
          }));
          return;
        }
        if (index >= stages.length) {
          patchTrack(id, { status: "ready", progress: 1, error: null });
          setUpload((u) => ({
            ...u,
            phase: "success",
            progress: 1,
            stage: "Ready in library",
            error: null,
          }));
          return;
        }
        const stage = stages[index];
        const started = Date.now();
        setUpload((u) => ({ ...u, phase: stage.phase, stage: stage.label, error: null }));
        patchTrack(id, {
          status: stage.phase === "uploading" ? "uploading" : stage.phase === "processing" ? "processing" : "analyzing",
          error: null,
        });

        const step = () => {
          if (cancelled.current) return;
          const t = Math.min(1, (Date.now() - started) / stage.ms);
          const eased = 1 - Math.pow(1 - t, 2);
          const base = index / stages.length;
          const progress = base + eased / stages.length;
          setUpload((u) => ({ ...u, progress }));
          patchTrack(id, { progress });
          if (t < 1) later(40, step);
          else tickPhase(index + 1);
        };
        step();
      };

      tickPhase(0);
      void file;
    },
    [patchTrack],
  );

  const beginFile = useCallback(
    (file: File) => {
      cancelled.current = false;
      clearTimers();
      setUpload({
        ...idleUpload(),
        phase: "validating",
        fileName: file.name,
        fileSize: file.size,
        stage: "Checking file",
      });

      later(220, () => {
        const result = validateUpload(file, tracks);
        if (!result.ok) {
          setUpload((u) => ({
            ...u,
            phase: "rejected",
            reject: result.reason,
            error: REJECT_COPY[result.reason].detail,
            stage: REJECT_COPY[result.reason].title,
          }));
          return;
        }

        const id = `local-${Date.now()}`;
        const title = titleFromFile(file.name);
        const track: Track = {
          id,
          title,
          artist: "Imported",
          album: "Uploads",
          duration: "—",
          cover: "",
          letter: title[0] ?? "U",
          status: "queued",
          progress: 0,
          favorite: false,
          queued: false,
          error: null,
          local: true,
        };
        setTracks((prev) => [track, ...prev]);
        setUpload((u) => ({
          ...u,
          phase: "uploading",
          trackId: id,
          stage: "Uploading source",
          reject: null,
          error: null,
        }));
        const forceError = /fail|error/i.test(file.name);
        runPipeline(id, file, forceError);
      });
    },
    [runPipeline, tracks],
  );

  const retryUpload = useCallback(() => {
    const id = upload.trackId;
    if (!id) return;
    cancelled.current = false;
    patchTrack(id, { status: "queued", progress: 0, error: null });
    setUpload((u) => ({ ...u, phase: "uploading", progress: 0, error: null, stage: "Retrying" }));
    const fake = new File([new Uint8Array(12)], upload.fileName ?? "retry.mp3", { type: "audio/mpeg" });
    runPipeline(id, fake, false);
  }, [patchTrack, runPipeline, upload.fileName, upload.trackId]);

  const retryTrack = useCallback(
    (id: string) => {
      const track = tracks.find((t) => t.id === id);
      if (!track) return;
      cancelled.current = false;
      patchTrack(id, { status: "queued", progress: 0, error: null });
      setUpload({
        phase: "uploading",
        fileName: `${track.title}.mp3`,
        fileSize: 4_200_000,
        progress: 0,
        reject: null,
        error: null,
        trackId: id,
        stage: "Retrying",
      });
      setUploadOpen(true);
      const fake = new File([new Uint8Array(12)], `${track.title}.mp3`, { type: "audio/mpeg" });
      runPipeline(id, fake, false);
    },
    [patchTrack, runPipeline, tracks],
  );

  const toggleFavorite = useCallback((id: string) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t)));
  }, []);

  const toggleQueued = useCallback((id: string) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, queued: !t.queued } : t)));
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracks((prev) => {
      const found = prev.find((t) => t.id === id) ?? null;
      trash.current = found;
      return prev.filter((t) => t.id !== id);
    });
    setCurrentId((cur) => {
      if (cur !== id) return cur;
      return SEED_TRACKS[0].id;
    });
  }, []);

  const undoRemove = useCallback(() => {
    const found = trash.current;
    if (!found) return;
    setTracks((prev) => [found, ...prev.filter((t) => t.id !== found.id)]);
    trash.current = null;
  }, []);

  const current = tracks.find((t) => t.id === currentId) ?? tracks[0] ?? SEED_TRACKS[0];

  return {
    tracks,
    current,
    currentId,
    setCurrentId,
    upload,
    uploadOpen,
    setUploadOpen,
    beginFile,
    cancelUpload,
    resetUpload,
    retryUpload,
    retryTrack,
    toggleFavorite,
    toggleQueued,
    removeTrack,
    undoRemove,
  };
}
