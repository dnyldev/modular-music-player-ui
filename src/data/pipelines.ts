import type { JobKind, PipelineStage } from "@/data/types";

export const PIPELINES: Record<JobKind, PipelineStage[]> = {
  chords: [
    { id: "decode", label: "Decoding source", detail: "48 kHz stereo · PCM float32", ms: 720 },
    { id: "tempo", label: "Estimating tempo", detail: "Onset envelope · 128 beats", ms: 980 },
    { id: "chroma", label: "Computing chroma", detail: "CQT 6 octaves · key = A minor", ms: 1100 },
    { id: "hmm", label: "Inferring sequence", detail: "32 bars · 12 unique voicings", ms: 1240 },
    { id: "voicing", label: "Mapping voicings", detail: "Guitar shapes · barre detection", ms: 860 },
    { id: "align", label: "Aligning to grid", detail: "4/4 locked · downbeat 0.97", ms: 640 },
  ],
  lyrics: [
    { id: "isolate", label: "Isolating vocal", detail: "Source separation · mask 0.86", ms: 880 },
    { id: "asr", label: "Transcribing phrases", detail: "12 lines · English · studio mix", ms: 1320 },
    { id: "align", label: "Forced alignment", detail: "Beat-locked timestamps · ±18 ms", ms: 980 },
    { id: "format", label: "Formatting lines", detail: "LRC-ready · 12 phrases", ms: 560 },
  ],
  stems: [
    { id: "prep", label: "Preparing source", detail: "Resample · loudness −14 LUFS", ms: 720 },
    { id: "vocals", label: "Separating vocals", detail: "Mask refine · residual check", ms: 1100 },
    { id: "drums", label: "Separating drums", detail: "Transient lock · kit image", ms: 980 },
    { id: "bass", label: "Separating bass", detail: "Sub isolation · 40–180 Hz", ms: 860 },
    { id: "other", label: "Building residual", detail: "Pad · guitar · atmosphere", ms: 740 },
  ],
};

export const JOB_META: Record<
  JobKind,
  { title: string; action: string; running: string; done: string; hint: string }
> = {
  chords: {
    title: "Chord analysis",
    action: "Extract chords",
    running: "Extracting chords",
    done: "Chords extracted",
    hint: "Harmonic structure, voicings, and the chord ribbon are produced from the mix.",
  },
  lyrics: {
    title: "Lyric transcription",
    action: "Transcribe lyrics",
    running: "Transcribing lyrics",
    done: "Lyrics transcribed",
    hint: "Vocal phrases are transcribed and aligned to the beat grid.",
  },
  stems: {
    title: "Stem separation",
    action: "Separate stems",
    running: "Separating stems",
    done: "Stems separated",
    hint: "Vocals, drums, bass, and the residual mix become independent buses.",
  },
};

export function pipelineDuration(kind: JobKind) {
  return PIPELINES[kind].reduce((sum, stage) => sum + stage.ms, 0);
}
