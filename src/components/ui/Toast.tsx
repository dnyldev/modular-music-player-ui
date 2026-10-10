import { AnimatePresence, motion } from "motion/react";
import { SPRING_PANEL } from "@/lib/ease";
import type { ToastData } from "@/data/types";

export function Toast({ toast, onDismiss }: { toast: ToastData | null; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={SPRING_PANEL}
          className="pointer-events-auto absolute inset-x-0 z-[80] mx-auto flex w-[min(92%,380px)] items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            bottom: "max(24px, calc(var(--safe-b) + 16px))",
            background: "var(--fg)",
            color: "var(--bg)",
            boxShadow: "var(--shadow-float)",
          }}
        >
          <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug">{toast.message}</p>
          {toast.action ? (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.08em] opacity-80 hover:opacity-100"
            >
              {toast.action.label}
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
