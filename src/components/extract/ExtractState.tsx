import { motion } from "motion/react";
import { Check, LoaderCircle, RotateCcw, X } from "lucide-react";
import { JOB_META, PIPELINES } from "@/data/pipelines";
import type { JobKind, JobState } from "@/data/types";
import { SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/utils/cn";

interface ExtractStateProps {
  kind: JobKind;
  job: JobState;
  onStart: () => void;
  onCancel: () => void;
  onRetry: () => void;
  compact?: boolean;
}

export function ExtractState({ kind, job, onStart, onCancel, onRetry, compact }: ExtractStateProps) {
  const meta = JOB_META[kind];
  const stages = PIPELINES[kind];
  const stage = stages[job.stageIndex] ?? stages[0];

  if (job.status === "complete") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[var(--success)]">
        <Check className="size-3.5" strokeWidth={2.2} />
        <span>{meta.done}</span>
      </div>
    );
  }

  if (job.status === "running") {
    const remaining = Math.max(1, Math.round(((1 - job.progress) * stages.reduce((s, x) => s + x.ms, 0)) / 1000));
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[14px] font-medium">
              <LoaderCircle className="size-3.5 animate-spin text-[var(--fg-3)]" />
              {stage.label}
            </p>
            {!compact ? <p className="mt-1 text-[12px] text-[var(--fg-3)]">{stage.detail}</p> : null}
          </div>
          <div className="shrink-0 text-right font-mono text-[12px] tabular-nums text-[var(--fg-3)]">
            <p>{Math.round(job.progress * 100)}%</p>
            <p>~{remaining}s left</p>
          </div>
        </div>
        <div className="h-[3px] overflow-hidden rounded-full" style={{ background: "var(--fill)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--fg)", width: `${job.progress * 100}%` }}
          />
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] text-[var(--fg-3)] transition-colors hover:text-[var(--fg)]"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (job.status === "error" || job.status === "cancelled") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <X className="mt-0.5 size-3.5 shrink-0 text-[var(--danger)]" />
          <div>
            <p className="text-[14px] font-medium">
              {job.status === "cancelled" ? "Analysis cancelled" : "Analysis failed"}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--fg-3)]">{job.error}</p>
          </div>
        </div>
        <motion.button
          type="button"
          onClick={onRetry}
          whileTap={{ scale: 0.97 }}
          transition={SPRING_PRESS}
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px]"
          style={{ background: "var(--fill)" }}
        >
          <RotateCcw className="size-3.5" />
          Try again
        </motion.button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {!compact ? <p className="text-[13px] leading-relaxed text-[var(--fg-3)]">{meta.hint}</p> : null}
      <motion.button
        type="button"
        onClick={onStart}
        whileTap={{ scale: 0.97 }}
        transition={SPRING_PRESS}
        className="inline-flex h-10 items-center rounded-full px-4 text-[13px] font-medium"
        style={{ background: "var(--fg)", color: "var(--bg)" }}
      >
        {meta.action}
      </motion.button>
    </div>
  );
}
