import type { Bar, ChordDef, LyricLine, StemId } from "@/data/types";

export const SONG = {
  title: "Midnight Society",
  artist: "Neon Veil",
  album: "Afterglow Sessions",
  bpm: 92,
  keyRoot: "A",
  keyMode: "Minor" as const,
  timeSignature: 4 as const,
  totalBars: 32,
  durationLabel: "3:07",
  cover: "/covers/midnight-society.jpg",
};

export const CHORDS: Record<string, ChordDef> = {
  Am7: { name: "Am7", shape: [-1, 0, 2, 0, 1, 0], fingers: [-1, 0, 2, 0, 1, 0] },
  Fmaj7: { name: "Fmaj7", shape: [-1, -1, 3, 2, 1, 0], fingers: [-1, -1, 3, 2, 1, 0] },
  Cmaj7: { name: "Cmaj7", shape: [-1, 3, 2, 0, 0, 0], fingers: [-1, 3, 2, 0, 0, 0] },
  G6: { name: "G6", shape: [3, 2, 0, 0, 0, 0], fingers: [3, 2, 0, 0, 0, 0] },
  Dm7: { name: "Dm7", shape: [-1, -1, 0, 2, 1, 1], fingers: [-1, -1, 0, 2, 1, 1] },
  G7: { name: "G7", shape: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  Aadd9: { name: "Aadd9", shape: [-1, 0, 2, 2, 0, 0], fingers: [-1, 0, 1, 3, 0, 0] },
  Bbmaj7: {
    name: "B♭maj7",
    shape: [-1, 1, 3, 2, 3, 1],
    fingers: [-1, 1, 3, 2, 4, 1],
    barre: [1, 1, 5],
  },
  Gm7: {
    name: "Gm7",
    shape: [3, 5, 3, 3, 3, 3],
    fingers: [1, 3, 1, 1, 1, 1],
    barre: [3, 0, 5],
  },
  Em7: { name: "Em7", shape: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
  E7: { name: "E7", shape: [0, 2, 0, 1, 0, 0], fingers: [0, 3, 0, 1, 0, 0] },
  G7sus4: { name: "G7sus4", shape: [3, 3, 0, 0, 1, 1], fingers: [1, 2, 0, 0, 3, 4] },
};

type BarSpec = [chord: string, midChord?: string];

const spec: BarSpec[] = [
  ["Am7"],
  ["Am7"],
  ["Am7"],
  ["Fmaj7"],
  ["Cmaj7", "G7"],
  ["G6"],
  ["Am7"],
  ["Fmaj7"],
  ["Dm7"],
  ["G7", "E7"],
  ["Dm7"],
  ["Aadd9"],
  ["Bbmaj7"],
  ["G7"],
  ["Cmaj7"],
  ["Gm7"],
  ["Aadd9"],
  ["Fmaj7"],
  ["Cmaj7"],
  ["Gm7"],
  ["Aadd9"],
  ["G7", "G7sus4"],
  ["Dm7"],
  ["Em7"],
  ["Fmaj7"],
  ["G7", "E7"],
  ["Am7"],
  ["Fmaj7"],
  ["Cmaj7"],
  ["G6"],
  ["Am7"],
  ["Am7"],
];

const sectionAt = (bar: number) => {
  if (bar < 8) return "Intro";
  if (bar < 16) return "Verse";
  if (bar < 24) return "Chorus";
  return "Outro";
};

export const BARS: Bar[] = spec.map(([prime, mid], index) => ({
  index,
  section: sectionAt(index),
  changes: mid ? [[0, prime], [2, mid]] : [[0, prime]],
}));

export const TOTAL_BARS = BARS.length;
export const TOTAL_BEATS = TOTAL_BARS * SONG.timeSignature;

export function chordAtBeat(beat: number): string {
  const barIndex = Math.min(TOTAL_BARS - 1, Math.max(0, Math.floor(beat / 4)));
  const inBar = Math.floor(beat % 4);
  const bar = BARS[barIndex];
  let name = bar.changes[0][1];
  for (const [at, chord] of bar.changes) if (inBar >= at) name = chord;
  return name;
}

export const CHANGES = BARS.flatMap((bar) =>
  bar.changes.map(([beatInBar, chord]) => ({
    beat: bar.index * 4 + beatInBar,
    chord,
    bar: bar.index,
    section: bar.section,
  })),
);

export const LYRICS: LyricLine[] = [
  { beat: 8, text: "Midnight city, lights are low" },
  { beat: 16, text: "Neon veil in afterglow" },
  { beat: 24, text: "Whispers echo down the street" },
  { beat: 32, text: "Shadows dancing to the beat" },
  { beat: 40, text: "Hold me close in satin dreams" },
  { beat: 48, text: "Silver rivers, quiet streams" },
  { beat: 56, text: "Your perfume, a gentle ghost" },
  { beat: 64, text: "In this night we need the most" },
  { beat: 72, text: "Society of midnight hearts" },
  { beat: 80, text: "Where every end is where it starts" },
  { beat: 88, text: "Every heartbeat keeps the time" },
  { beat: 96, text: "You and I, a stolen rhyme" },
];

export function lyricIndexAtBeat(beat: number): number {
  let idx = -1;
  for (let i = 0; i < LYRICS.length; i++) {
    if (beat >= LYRICS[i].beat) idx = i;
  }
  return idx;
}

export const STEMS: { id: StemId; label: string; defaultLevel: number }[] = [
  { id: "vocals", label: "Vocals", defaultLevel: 92 },
  { id: "drums", label: "Drums", defaultLevel: 78 },
  { id: "bass", label: "Bass", defaultLevel: 84 },
  { id: "other", label: "Other", defaultLevel: 70 },
];

export const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

const FLAT_TO_SHARP: Record<string, string> = {
  "D♭": "C♯",
  "E♭": "D♯",
  "G♭": "F♯",
  "A♭": "G♯",
  "B♭": "A♯",
};

const ENHARMONIC: Record<string, string> = {
  "C♯": "D♭",
  "D♯": "E♭",
  "F♯": "G♭",
  "G♯": "A♭",
  "A♯": "B♭",
};

export function transposeChord(name: string, semitones: number): string {
  if (!semitones) return name;
  const match = name.match(/^([A-G][♯♭b#]?)(.*)$/);
  if (!match) return name;
  let [, root, rest] = match;
  root = root.replace("b", "♭").replace("#", "♯");
  const preferFlat = root.includes("♭");
  const sharp = FLAT_TO_SHARP[root] ?? root;
  const idx = NOTE_NAMES.indexOf(sharp);
  if (idx < 0) return name;
  const next = NOTE_NAMES[(idx + ((semitones % 12) + 12)) % 12];
  const display = preferFlat && ENHARMONIC[next] ? ENHARMONIC[next] : next;
  return display + rest;
}

export function lookupChord(name: string): ChordDef | undefined {
  const key = Object.keys(CHORDS).find((k) => CHORDS[k].name === name || k === name);
  return key ? CHORDS[key] : undefined;
}

export const UNIQUE_CHORDS = Array.from(new Set(BARS.flatMap((b) => b.changes.map(([, c]) => c))));
