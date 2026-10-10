import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";
import type { StemId } from "@/data/types";

export function Visualizer({
  playing,
  levels,
  height = 36,
  bars = 48,
  className,
}: {
  playing: boolean;
  levels: Record<StemId, number>;
  height?: number;
  bars?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelsRef = useRef(levels);
  const playingRef = useRef(playing);
  levelsRef.current = levels;
  playingRef.current = playing;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let alive = true;
    let raf = 0;
    const smooth = Array.from({ length: bars }, () => 0.08);

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const energy = () => {
      const l = levelsRef.current;
      return (l.vocals + l.drums + l.bass + l.other) / 4;
    };

    const draw = (t: number) => {
      if (!alive) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const styles = getComputedStyle(document.documentElement);
      const fg = styles.getPropertyValue("--fg").trim() || "#161615";
      const gap = Math.max(2, w / bars / 3.4);
      const barW = (w - gap * (bars - 1)) / bars;
      const isPlaying = playingRef.current;
      const e = isPlaying ? Math.max(0.12, energy()) : 0.08;
      for (let i = 0; i < bars; i++) {
        const n = Math.sin(t / 180 + i * 0.38) * 0.5 + 0.5;
        const n2 = Math.sin(t / 90 + i * 0.17) * 0.5 + 0.5;
        const target = isPlaying ? e * (0.25 + 0.75 * n * n2) : 0.08;
        smooth[i] += (target - smooth[i]) * 0.16;
        const bh = Math.max(2, smooth[i] * h * 0.92);
        ctx.globalAlpha = 0.22 + smooth[i] * 0.7;
        ctx.fillStyle = fg;
        ctx.fillRect(i * (barW + gap), h - bh, barW, bh);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [bars]);

  return <canvas ref={canvasRef} className={cn("w-full", className)} style={{ height }} />;
}
