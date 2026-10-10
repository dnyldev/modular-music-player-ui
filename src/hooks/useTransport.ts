import { useCallback, useEffect, useRef, useState } from "react";
import { SONG, STEMS, TOTAL_BEATS } from "@/data/song";
import { clamp } from "@/lib/format";
import type { MixState, StemId } from "@/data/types";

const initialMix = Object.fromEntries(
  STEMS.map((s) => [s.id, { level: s.defaultLevel / 100, muted: false }]),
) as Record<StemId, MixState>;

const silent: Record<StemId, number> = { vocals: 0, drums: 0, bass: 0, other: 0 };

export function useTransport() {
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [bpm, setBpmState] = useState(SONG.bpm);
  const [semitones, setSemitones] = useState(0);
  const [mix, setMix] = useState<Record<StemId, MixState>>(initialMix);
  const [levels, setLevels] = useState<Record<StemId, number>>(silent);
  const [ended, setEnded] = useState(false);

  const playingRef = useRef(false);
  const beatRef = useRef(0);
  const bpmRef = useRef(SONG.bpm);
  const lastTs = useRef<number | null>(null);
  const mixRef = useRef(mix);

  playingRef.current = playing;
  beatRef.current = beat;
  bpmRef.current = bpm;
  mixRef.current = mix;

  const secPerBeat = 60 / bpm;

  useEffect(() => {
    let raf = 0;
    const loop = (ts: number) => {
      if (playingRef.current) {
        if (lastTs.current == null) lastTs.current = ts;
        const dt = (ts - lastTs.current) / 1000;
        lastTs.current = ts;
        const next = beatRef.current + dt / (60 / bpmRef.current);
        if (next >= TOTAL_BEATS) {
          beatRef.current = 0;
          setBeat(0);
          setPlaying(false);
          setEnded(true);
          setLevels(silent);
          playingRef.current = false;
          lastTs.current = null;
        } else {
          beatRef.current = next;
          setBeat(next);
          const t = ts / 1000;
          const m = mixRef.current;
          setLevels({
            vocals: m.vocals.muted ? 0 : m.vocals.level * (0.35 + 0.65 * Math.abs(Math.sin(t * 5.2))),
            drums: m.drums.muted ? 0 : m.drums.level * (0.25 + 0.75 * Math.abs(Math.sin(t * 8.1 + 0.4))),
            bass: m.bass.muted ? 0 : m.bass.level * (0.4 + 0.6 * Math.abs(Math.sin(t * 2.4 + 1.1))),
            other: m.other.muted ? 0 : m.other.level * (0.3 + 0.7 * Math.abs(Math.sin(t * 3.6 + 2))),
          });
        }
      } else {
        lastTs.current = null;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggle = useCallback(() => {
    setEnded(false);
    setPlaying((p) => !p);
  }, []);

  const seekBeat = useCallback((target: number) => {
    const clamped = clamp(target, 0, TOTAL_BEATS - 0.05);
    beatRef.current = clamped;
    setBeat(clamped);
    setEnded(false);
  }, []);

  const skip = useCallback(
    (seconds: number) => {
      seekBeat(beatRef.current + seconds / (60 / bpmRef.current));
    },
    [seekBeat],
  );

  const setBpm = useCallback((value: number) => {
    const next = clamp(Math.round(value), 40, 200);
    bpmRef.current = next;
    setBpmState(next);
  }, []);

  const setStemLevel = useCallback((id: StemId, level: number) => {
    setMix((prev) => ({ ...prev, [id]: { ...prev[id], level: clamp(level, 0, 1) } }));
  }, []);

  const toggleMute = useCallback((id: StemId) => {
    setMix((prev) => ({ ...prev, [id]: { ...prev[id], muted: !prev[id].muted } }));
  }, []);

  const resetMix = useCallback(() => setMix(initialMix), []);

  const stop = useCallback(() => {
    setPlaying(false);
    setBeat(0);
    beatRef.current = 0;
    setEnded(false);
    setLevels(silent);
  }, []);

  return {
    playing,
    beat,
    bpm,
    semitones,
    mix,
    levels,
    ended,
    secPerBeat,
    toggle,
    seekBeat,
    skip,
    setBpm,
    setSemitones,
    setStemLevel,
    toggleMute,
    resetMix,
    stop,
  };
}
