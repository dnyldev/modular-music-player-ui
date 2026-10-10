import type { ReactNode } from "react";
import { Heart, ListPlus, Play, Share, Trash2 } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { Track } from "@/data/types";
import { hashHue } from "@/lib/format";

interface QuickActionsProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlay: () => void;
  onFavorite: () => void;
  onQueue: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export function QuickActions({
  track,
  open,
  onOpenChange,
  onPlay,
  onFavorite,
  onQueue,
  onShare,
  onDelete,
}: QuickActionsProps) {
  if (!track) return null;
  const hue = hashHue(track.title);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="px-5 pb-4 pt-1">
        <div className="mb-4 flex items-center gap-3">
          {track.cover ? (
            <img src={track.cover} alt="" className="size-12 rounded-[14px] object-cover" />
          ) : (
            <div
              className="grid size-12 place-items-center rounded-[14px] text-[15px] font-semibold text-white"
              style={{ background: `linear-gradient(145deg, hsl(${hue} 32% 42%), hsl(${(hue + 40) % 360} 28% 28%))` }}
            >
              {track.letter}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[16px] font-medium tracking-[-0.02em]">{track.title}</p>
            <p className="truncate text-[13px] text-[var(--fg-3)]">{track.artist}</p>
          </div>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--hairline)" }}>
          <Action icon={<Play className="size-4" fill="currentColor" />} label="Play now" onClick={onPlay} />
          <Action
            icon={<Heart className="size-4" fill={track.favorite ? "currentColor" : "none"} />}
            label={track.favorite ? "Remove from favorites" : "Favorite"}
            onClick={onFavorite}
          />
          <Action
            icon={<ListPlus className="size-4" />}
            label={track.queued ? "Remove from queue" : "Play next"}
            onClick={onQueue}
          />
          <Action icon={<Share className="size-4" />} label="Share" onClick={onShare} />
          <Action icon={<Trash2 className="size-4" />} label="Remove from library" danger onClick={onDelete} />
        </div>
      </div>
    </BottomSheet>
  );
}

function Action({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-3.5 text-left text-[15px]"
      style={{ color: danger ? "var(--danger)" : "var(--fg)", borderColor: "var(--hairline)" }}
    >
      <span className="grid size-8 place-items-center">{icon}</span>
      {label}
    </button>
  );
}
