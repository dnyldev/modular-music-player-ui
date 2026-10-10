import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { House, LayoutGrid, ListMusic, Pause, Play, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { LibraryRow } from "@/components/library/LibraryRow";
import { QuickActions } from "@/components/library/QuickActions";
import { SPRING_PRESS } from "@/lib/ease";
import type { DockId, Track } from "@/data/types";
import { cn } from "@/utils/cn";

interface LibraryProps {
  tracks: Track[];
  current: Track;
  playing: boolean;
  sheetOpen: boolean;
  onToggle: () => void;
  onOpen: (id: string) => void;
  onOpenPanel: (panel: DockId) => void;
  onClose: () => void;
  onUpload: () => void;
  onFavorite: (id: string) => void;
  onQueue: (id: string) => void;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
  onShare: (track: Track) => void;
}

const TABS: { id: DockId | "home"; label: string; Icon: typeof House }[] = [
  { id: "home", label: "Library", Icon: House },
  { id: "chords", label: "Chords", Icon: LayoutGrid },
  { id: "lyrics", label: "Lyrics", Icon: ListMusic },
  { id: "mixer", label: "Mixer", Icon: SlidersHorizontal },
];

export function Library({
  tracks,
  current,
  playing,
  sheetOpen,
  onToggle,
  onOpen,
  onOpenPanel,
  onClose,
  onUpload,
  onFavorite,
  onQueue,
  onDelete,
  onRetry,
  onShare,
}: LibraryProps) {
  const [query, setQuery] = useState("");
  const [held, setHeld] = useState<Track | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q),
    );
  }, [query, tracks]);

  return (
    <div className="relative flex h-full min-h-full flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <header className="px-5 pb-3 pt-[max(18px,calc(var(--safe-t)+14px))]">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--fg-3)]">Midnight</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h1 className="text-[32px] font-semibold leading-none tracking-[-0.04em]">Library</h1>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[var(--fg-3)]">{filtered.length} tracks</span>
            <motion.button
              type="button"
              aria-label="Upload a track"
              onClick={onUpload}
              whileTap={{ scale: 0.9 }}
              transition={SPRING_PRESS}
              className="grid size-9 place-items-center rounded-full"
              style={{ background: "var(--fg)", color: "var(--bg)" }}
            >
              <Plus className="size-4" />
            </motion.button>
          </div>
        </div>
        <label className="mt-4 flex h-11 items-center gap-2 rounded-full px-3.5" style={{ background: "var(--fill)" }}>
          <Search className="size-4 shrink-0 text-[var(--fg-3)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles and artists"
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-3)]"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="grid size-7 place-items-center rounded-full text-[var(--fg-3)] hover:text-[var(--fg)]"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </label>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-40">
        {tracks.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-[15px] font-medium">Library is empty</p>
            <p className="mt-1 text-[13px] text-[var(--fg-3)]">Upload a track to get started.</p>
            <button
              type="button"
              onClick={onUpload}
              className="mt-4 h-10 rounded-full px-4 text-[13px] font-medium"
              style={{ background: "var(--fg)", color: "var(--bg)" }}
            >
              Add a track
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-[15px] font-medium">No matching tracks</p>
            <p className="mt-1 text-[13px] text-[var(--fg-3)]">Try a different title or artist.</p>
          </div>
        ) : null}
        {filtered.map((track) => (
          <LibraryRow
            key={track.id}
            track={track}
            current={track.id === current.id}
            playing={playing && track.id === current.id}
            onOpen={() => onOpen(track.id)}
            onFavorite={() => onFavorite(track.id)}
            onQueue={() => onQueue(track.id)}
            onDelete={() => onDelete(track.id)}
            onRetry={() => onRetry(track.id)}
            onLongPress={() => setHeld(track)}
          />
        ))}
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center px-3 transition-opacity duration-300",
          sheetOpen && "opacity-0",
        )}
        style={{ paddingBottom: "max(12px, var(--safe-b))" }}
      >
        <motion.div
          layout
          className={cn(
            "mb-2 flex w-full items-center gap-2 rounded-[22px] border border-[var(--hairline)] p-1.5",
            sheetOpen ? "pointer-events-none" : "pointer-events-auto",
          )}
          style={{ background: "var(--glass)", backdropFilter: "blur(22px) saturate(160%)", boxShadow: "var(--shadow-float)" }}
        >
          <button type="button" onClick={() => onOpen(current.id)} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[16px] px-1 py-0.5 text-left">
            {current.cover ? (
              <img src={current.cover} alt="" className="size-11 rounded-[12px] object-cover" />
            ) : (
              <div className="grid size-11 place-items-center rounded-[12px] text-[13px] font-semibold" style={{ background: "var(--fill)" }}>
                {current.letter}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium tracking-[-0.015em]">{current.title}</p>
              <p className="truncate text-[12px] text-[var(--fg-3)]">{current.artist}</p>
            </div>
          </button>
          <motion.button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={onToggle}
            whileTap={{ scale: 0.9 }}
            transition={SPRING_PRESS}
            className="grid size-11 shrink-0 place-items-center rounded-full"
            style={{ background: "var(--fg)", color: "var(--bg)" }}
          >
            {playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4 translate-x-px" fill="currentColor" />}
          </motion.button>
        </motion.div>

        <div
          className={cn(
            "flex w-full items-center rounded-[22px] border border-[var(--hairline)] p-1",
            sheetOpen ? "pointer-events-none" : "pointer-events-auto",
          )}
          style={{ background: "var(--glass)", backdropFilter: "blur(22px) saturate(160%)" }}
        >
          {TABS.map(({ id, label, Icon }) => {
            const active = id === "home";
            return (
              <button
                key={id}
                type="button"
                aria-label={label}
                aria-current={active ? "page" : undefined}
                onClick={() => (id === "home" ? onClose() : onOpenPanel(id))}
                className="relative flex h-11 flex-1 items-center justify-center text-[var(--fg-2)]"
              >
                {active ? (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-1 rounded-full"
                    style={{ background: "var(--fill-strong)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                ) : null}
                <span className="relative flex items-center gap-1.5">
                  <Icon className="size-[18px]" />
                  <span className={cn("hidden text-[12px] sm:inline", active && "text-[var(--fg)]")}>{label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <QuickActions
        track={held}
        open={!!held}
        onOpenChange={(open) => {
          if (!open) setHeld(null);
        }}
        onPlay={() => {
          if (held) onOpen(held.id);
          setHeld(null);
        }}
        onFavorite={() => {
          if (held) onFavorite(held.id);
          setHeld(null);
        }}
        onQueue={() => {
          if (held) onQueue(held.id);
          setHeld(null);
        }}
        onShare={() => {
          if (held) onShare(held);
          setHeld(null);
        }}
        onDelete={() => {
          if (held) onDelete(held.id);
          setHeld(null);
        }}
      />
    </div>
  );
}
