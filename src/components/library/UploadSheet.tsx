import { useRef } from "react";
import { motion } from "motion/react";
import { AlertCircle, Check, FileAudio, LoaderCircle, RotateCcw, Upload } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { REJECT_COPY } from "@/data/library";
import type { UploadState } from "@/hooks/useLibrary";
import { SPRING_PRESS } from "@/lib/ease";
import { formatBytes } from "@/lib/format";

interface UploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  upload: UploadState;
  onFile: (file: File) => void;
  onCancel: () => void;
  onRetry: () => void;
  onReset: () => void;
}

export function UploadSheet({ open, onOpenChange, upload, onFile, onCancel, onRetry, onReset }: UploadSheetProps) {
  const input = useRef<HTMLInputElement>(null);
  const busy = upload.phase === "uploading" || upload.phase === "processing" || upload.phase === "analyzing" || upload.phase === "validating";

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next && busy) return;
        if (!next) onReset();
        onOpenChange(next);
      }}
      title="Add a track"
      description="Audio stays on this device. Analysis is simulated."
    >
      <div className="px-5 pb-6 pt-3">
        <input
          ref={input}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.aac,.m4a,.ogg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onFile(file);
          }}
        />

        {upload.phase === "idle" || upload.phase === "picking" ? (
          <IdleDrop onPick={() => input.current?.click()} onFile={onFile} />
        ) : null}

        {upload.phase === "validating" ? <StatusRow icon="spin" title="Checking file" detail={upload.fileName ?? ""} /> : null}

        {upload.phase === "rejected" && upload.reject ? (
          <FailBlock
            title={REJECT_COPY[upload.reject].title}
            detail={REJECT_COPY[upload.reject].detail}
            onPick={() => {
              onReset();
              input.current?.click();
            }}
          />
        ) : null}

        {busy && upload.phase !== "validating" ? (
          <BusyBlock upload={upload} onCancel={onCancel} />
        ) : null}

        {upload.phase === "success" ? (
          <DoneBlock
            title="Added to library"
            detail={`${upload.fileName ?? "Track"} is ready to play.`}
            onClose={() => {
              onReset();
              onOpenChange(false);
            }}
          />
        ) : null}

        {upload.phase === "error" ? (
          <FailBlock title="Upload didn’t finish" detail={upload.error ?? "Something went wrong."} onRetry={onRetry} onPick={() => input.current?.click()} />
        ) : null}

        {upload.phase === "cancelled" ? (
          <FailBlock
            title="Upload cancelled"
            detail="Nothing was added. You can start again whenever you like."
            onPick={() => {
              onReset();
              input.current?.click();
            }}
          />
        ) : null}

        <p className="mt-5 text-[11px] leading-relaxed text-[var(--fg-3)]">
          MP3, WAV, FLAC, AAC · under 50 MB. Name a file with “fail” to preview the error path.
        </p>
      </div>
    </BottomSheet>
  );
}

function IdleDrop({ onPick, onFile }: { onPick: () => void; onFile: (file: File) => void }) {
  return (
    <motion.button
      type="button"
      onClick={onPick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      whileTap={{ scale: 0.985 }}
      transition={SPRING_PRESS}
      className="flex w-full flex-col items-center gap-2 rounded-[22px] px-4 py-10"
      style={{ background: "var(--fill)", border: "0.5px dashed var(--hairline-2)" }}
    >
      <span className="grid size-12 place-items-center rounded-full" style={{ background: "var(--surface)" }}>
        <Upload className="size-5" />
      </span>
      <p className="text-[15px] font-medium">Choose an audio file</p>
      <p className="text-[12px] text-[var(--fg-3)]">Or drop one onto this sheet</p>
    </motion.button>
  );
}

function StatusRow({ icon, title, detail }: { icon: "spin" | "file"; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {icon === "spin" ? <LoaderCircle className="size-5 animate-spin text-[var(--fg-3)]" /> : <FileAudio className="size-5" />}
      <div className="min-w-0">
        <p className="text-[14px] font-medium">{title}</p>
        <p className="truncate text-[12px] text-[var(--fg-3)]">{detail}</p>
      </div>
    </div>
  );
}

function BusyBlock({ upload, onCancel }: { upload: UploadState; onCancel: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[15px] font-medium">
            <LoaderCircle className="size-4 animate-spin text-[var(--fg-3)]" />
            {upload.stage}
          </p>
          <p className="mt-1 truncate text-[12px] text-[var(--fg-3)]">
            {upload.fileName} · {formatBytes(upload.fileSize)}
          </p>
        </div>
        <span className="font-mono text-[12px] tabular-nums text-[var(--fg-3)]">{Math.round(upload.progress * 100)}%</span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full" style={{ background: "var(--fill)" }}>
        <motion.div className="h-full rounded-full" style={{ width: `${upload.progress * 100}%`, background: "var(--fg)" }} />
      </div>
      <button type="button" onClick={onCancel} className="text-[12px] text-[var(--fg-3)] hover:text-[var(--fg)]">
        Cancel upload
      </button>
    </div>
  );
}

function DoneBlock({ title, detail, onClose }: { title: string; detail: string; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5">
        <span className="grid size-8 place-items-center rounded-full" style={{ background: "var(--success-soft)", color: "var(--success)" }}>
          <Check className="size-4" />
        </span>
        <div>
          <p className="text-[15px] font-medium">{title}</p>
          <p className="mt-1 text-[13px] text-[var(--fg-3)]">{detail}</p>
        </div>
      </div>
      <motion.button
        type="button"
        onClick={onClose}
        whileTap={{ scale: 0.97 }}
        transition={SPRING_PRESS}
        className="h-10 rounded-full px-4 text-[13px] font-medium"
        style={{ background: "var(--fg)", color: "var(--bg)" }}
      >
        Done
      </motion.button>
    </div>
  );
}

function FailBlock({
  title,
  detail,
  onRetry,
  onPick,
}: {
  title: string;
  detail: string;
  onRetry?: () => void;
  onPick: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5">
        <span className="grid size-8 place-items-center rounded-full" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
          <AlertCircle className="size-4" />
        </span>
        <div>
          <p className="text-[15px] font-medium">{title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--fg-3)]">{detail}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {onRetry ? (
          <motion.button
            type="button"
            onClick={onRetry}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_PRESS}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium"
            style={{ background: "var(--fg)", color: "var(--bg)" }}
          >
            <RotateCcw className="size-3.5" />
            Retry
          </motion.button>
        ) : null}
        <motion.button
          type="button"
          onClick={onPick}
          whileTap={{ scale: 0.97 }}
          transition={SPRING_PRESS}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px]"
          style={{ background: "var(--fill)" }}
        >
          Choose another
        </motion.button>
      </div>
    </div>
  );
}


