import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Heart, ListPlus, LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import type { Track } from "@/data/types";
import { SPRING_GLIDE, SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/utils/cn";
import { hashHue } from "@/lib/format";

interface LibraryRowProps {
  track: Track;
  current: boolean;
  playing: boolean;
  onOpen: () => void;
  onFavorite: () => void;
  onQueue: () => void;
  onDelete: () => void;
  onRetry: () => void;
  onLongPress: () => void;
}

const ACTION = 72;

export function LibraryRow({
  track,
  current,
  playing,
  onOpen,
  onFavorite,
  onQueue,
  onDelete,
  onRetry,
  onLongPress,
}: LibraryRowProps) {
  const [x, setX] = useState(0);
  const start = useRef({ x: 0, y: 0, t: 0, armed: false });
  const hold = useRef<number | null>(null);
  const dragging = useRef(false);
  const busy = track.status !== "ready" && track.status !== "failed";
  const hue = hashHue(track.title);

  const clearHold = () => {
    if (hold.current) window.clearTimeout(hold.current);
    hold.current = null;
  };

  const snap = (dx: number) => {
    if (dx > ACTION * 0.55) setX(ACTION);
    else if (dx < -ACTION * 0.55) setX(-ACTION * 2);
    else setX(0);
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 flex w-[72px] items-stretch">
        <button
          type="button"
          aria-label={track.favorite ? "Unfavorite" : "Favorite"}
          onClick={() => {
            onFavorite();
            setX(0);
          }}
          className="flex flex-1 items-center justify-center"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <Heart className="size-4" fill={track.favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex w-[144px] items-stretch">
        <button
          type="button"
          aria-label="Add to queue"
          onClick={() => {
            onQueue();
            setX(0);
          }}
          className="flex flex-1 items-center justify-center"
          style={{ background: "var(--fill-strong)", color: "var(--fg)" }}
        >
          <ListPlus className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Remove"
          onClick={() => {
            onDelete();
            setX(0);
          }}
          className="flex flex-1 items-center justify-center"
          style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <motion.div
        className="relative"
        style={{ background: "var(--bg)" }}
        animate={{ x }}
        transition={dragging.current ? { duration: 0 } : SPRING_GLIDE}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY, t: Date.now(), armed: true };
          dragging.current = false;
          clearHold();
          hold.current = window.setTimeout(() => {
            if (!start.current.armed) return;
            onLongPress();
            start.current.armed = false;
          }, 430);
        }}
        onPointerMove={(e) => {
          if (!start.current.armed) return;
          const dx = e.clientX - start.current.x;
          const dy = e.clientY - start.current.y;
          if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearHold();
          if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            setX(Math.max(-ACTION * 2, Math.min(ACTION, dx)));
          }
        }}
        onPointerUp={(e) => {
          clearHold();
          const dx = e.clientX - start.current.x;
          const dy = e.clientY - start.current.y;
          const dt = Date.now() - start.current.t;
          const wasDrag = dragging.current;
          dragging.current = false;
          start.current.armed = false;
          if (wasDrag) {
            snap(dx);
            return;
          }
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 400) {
            if (x !== 0) setX(0);
            else if (track.status === "ready") onOpen();
          }
        }}
        onPointerCancel={() => {
          clearHold();
          dragging.current = false;
          start.current.armed = false;
          snap(x);
        }}
      >
        <div
          className={cn(
            "flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors",
            current && "bg-[var(--fill)]",
          )}
        >
          <Cover track={track} current={current} playing={playing} hue={hue} />
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-[15px] tracking-[-0.015em]", current && "font-medium")}>{track.title}</p>
            <p className="truncate text-[13px] text-[var(--fg-3)]">
              {statusLabel(track) ?? `${track.artist}`}
            </p>
            {busy ? (
              <div className="mt-1.5 h-[2px] overflow-hidden rounded-full" style={{ background: "var(--fill)" }}>
                <div className="h-full rounded-full" style={{ width: `${track.progress * 100}%`, background: "var(--fg)" }} />
              </div>
            ) : null}
          </div>
          {track.status === "failed" ? (
            <motion.button
              type="button"
              aria-label="Retry upload"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              whileTap={{ scale: 0.9 }}
              transition={SPRING_PRESS}
              className="grid size-9 place-items-center rounded-full"
              style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
            >
              <RotateCcw className="size-3.5" />
            </motion.button>
          ) : current && playing && track.status === "ready" ? (
            <Eq />
          ) : current ? (
            <span className="size-1.5 rounded-full bg-[var(--fg)]" />
          ) : null}
          {track.status === "ready" ? (
            <span className="font-mono text-[12px] tabular-nums text-[var(--fg-3)]">{track.duration}</span>
          ) : busy ? (
            <LoaderCircle className="size-3.5 animate-spin text-[var(--fg-3)]" />
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

function statusLabel(track: Track) {
  switch (track.status) {
    case "queued":
      return "Waiting to upload";
    case "uploading":
      return `Uploading ${Math.round(track.progress * 100)}%`;
    case "processing":
      return "Processing audio";
    case "analyzing":
      return "Fingerprinting mix";
    case "failed":
      return track.error ?? "Upload failed";
    default:
      return null;
  }
}

function Cover({ track, current, playing, hue }: { track: Track; current: boolean; playing: boolean; hue: number }) {
  return (
    <div
      className="relative size-12 shrink-0 overflow-hidden rounded-[14px]"
      style={{ boxShadow: current ? "0 0 0 1px var(--fg)" : undefined }}
    >
      {track.cover ? (
        <img src={track.cover} alt="" className="size-full object-cover" />
      ) : (
        <div
          className="grid size-full place-items-center text-[16px] font-semibold"
          style={{
            background: `linear-gradient(145deg, hsl(${hue} 32% 42%), hsl(${(hue + 40) % 360} 28% 28%))`,
            color: "white",
          }}
        >
          {track.letter}
        </div>
      )}
      {playing && current ? <div className="absolute inset-0 bg-black/20" /> : null}
    </div>
  );
}

function Eq() {
  return (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[2px] origin-bottom rounded-full bg-[var(--fg)]"
          style={{
            height: 12,
            animation: `eq-bar 0.9s ease-in-out ${i * 0.14}s infinite`,
          }}
        />
      ))}
    </span>
  );
}
