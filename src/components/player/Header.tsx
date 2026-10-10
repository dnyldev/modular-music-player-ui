import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, MoreHorizontal, Moon, Sun } from "lucide-react";
import { SPRING_PRESS } from "@/lib/ease";
import type { DockId, JobState, Theme } from "@/data/types";
import { cn } from "@/utils/cn";

interface HeaderProps {
  theme: Theme;
  onTheme: () => void;
  onClose: () => void;
  onPanel: (id: DockId) => void;
  onToast: (message: string) => void;
  jobs: Record<"chords" | "lyrics" | "stems", JobState>;
}

export function Header({ theme, onTheme, onClose, onPanel, onToast, jobs }: HeaderProps) {
  const [menu, setMenu] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setMenu(false);
    };
    window.addEventListener("pointerdown", onDoc);
    return () => window.removeEventListener("pointerdown", onDoc);
  }, [menu]);

  return (
    <header className="relative flex items-center justify-between px-3 pt-[max(10px,calc(var(--safe-t)+6px))]">
      <motion.button
        type="button"
        aria-label="Close player"
        onClick={onClose}
        whileTap={{ scale: 0.9 }}
        transition={SPRING_PRESS}
        className="grid size-11 place-items-center rounded-full text-[var(--fg)] hover:bg-[var(--fill)]"
      >
        <ChevronDown className="size-6" strokeWidth={1.7} />
      </motion.button>

      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--fg-3)]">Now playing</p>

      <div ref={wrap} className="relative">
        <motion.button
          type="button"
          aria-label="More"
          onClick={() => setMenu((v) => !v)}
          whileTap={{ scale: 0.9 }}
          transition={SPRING_PRESS}
          className="grid size-11 place-items-center rounded-full hover:bg-[var(--fill)]"
        >
          <MoreHorizontal className="size-5" />
        </motion.button>

        <AnimatePresence>
          {menu ? (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-12 z-40 w-56 overflow-hidden rounded-2xl py-1.5"
              style={{
                background: "var(--surface)",
                boxShadow: "var(--shadow-float)",
                border: "0.5px solid var(--hairline)",
              }}
            >
              <MenuItem
                onClick={() => {
                  onTheme();
                  setMenu(false);
                }}
              >
                {theme === "day" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                {theme === "day" ? "Night appearance" : "Day appearance"}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  onPanel("chords");
                  setMenu(false);
                }}
              >
                Chord diagrams
              </MenuItem>
              <MenuItem
                onClick={() => {
                  onPanel("lyrics");
                  setMenu(false);
                }}
              >
                Lyrics
              </MenuItem>
              <MenuItem
                onClick={() => {
                  onPanel("mixer");
                  setMenu(false);
                }}
              >
                Mixer
              </MenuItem>
              <MenuItem
                onClick={() => {
                  onToast("Link copied — display only");
                  setMenu(false);
                }}
              >
                Share
              </MenuItem>
              <div className="mx-3 my-1.5 h-px" style={{ background: "var(--hairline)" }} />
              <div className="px-3.5 py-2">
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--fg-3)]">
                  Keyboard
                </p>
                <div className="flex flex-wrap gap-1">
                  {["Space", "←", "→", "C", "L", "M", "T", "K"].map((k) => (
                    <span
                      key={k}
                      className="rounded-md px-1.5 py-0.5 font-mono text-[10px] text-[var(--fg-2)]"
                      style={{ background: "var(--fill)" }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
                {jobs.chords.status === "complete" ? (
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--success)]">
                    <Check className="size-3" /> Analysis ready
                  </p>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}

function MenuItem({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13.5px] hover:bg-[var(--fill)]",
      )}
    >
      {children}
    </button>
  );
}
