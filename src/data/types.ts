export type Theme = "day" | "night";
export type PanelId = "chords" | "lyrics";
export type DockId = PanelId | "mixer";
export type RibbonMode = "follow" | "map";
export type StemId = "vocals" | "drums" | "bass" | "other";
export type JobKind = "chords" | "lyrics" | "stems";
export type JobStatus = "idle" | "running" | "complete" | "error" | "cancelled";
export type TrackStatus =
  | "ready"
  | "queued"
  | "uploading"
  | "processing"
  | "analyzing"
  | "failed";

export type UploadReject = "format" | "size" | "empty" | "duplicate";

export type UploadPhase =
  | "idle"
  | "picking"
  | "validating"
  | "rejected"
  | "uploading"
  | "processing"
  | "analyzing"
  | "success"
  | "error"
  | "cancelled";

export interface MixState {
  level: number;
  muted: boolean;
}

export interface JobState {
  status: JobStatus;
  progress: number;
  stageIndex: number;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  cover: string;
  letter: string;
  status: TrackStatus;
  progress: number;
  favorite: boolean;
  queued: boolean;
  error: string | null;
  local: boolean;
}

export interface ChordDef {
  name: string;
  shape: number[];
  fingers: number[];
  barre?: [number, number, number];
}

export interface Bar {
  index: number;
  section: string;
  changes: [number, string][];
}

export interface LyricLine {
  beat: number;
  text: string;
}

export interface PipelineStage {
  id: string;
  label: string;
  detail: string;
  ms: number;
}

export interface ToastData {
  id: number;
  message: string;
  tone?: "default" | "success" | "danger";
  action?: { label: string; onClick: () => void };
}
