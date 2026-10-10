import { useCallback, useRef, useState } from "react";
import type { ToastData } from "@/data/types";

export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setToast(null);
  }, []);

  const flash = useCallback(
    (message: string, extras?: Partial<Omit<ToastData, "id" | "message">>) => {
      const id = Date.now();
      setToast({ id, message, ...extras });
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, extras?.action ? 4200 : 2200);
    },
    [],
  );

  return { toast, flash, dismiss };
}
