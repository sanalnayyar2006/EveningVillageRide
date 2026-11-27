"use client";

import { useEffect, useState } from "react";
import { renderStats } from "@/game/core/debug";

const REFRESH_MS = 500;

interface Reading {
  fps: number;
  frameMs: number;
  drawCalls: number;
  triangles: number;
  pixelRatio: number;
}

/**
 * Development-only performance readout, toggled with F2: frame rate, the
 * slowest frame in the last half second, draw calls and triangles.
 */
export function DevStats() {
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "F2") setOpen((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    let frames = 0;
    let worst = 0;
    let last = performance.now();
    let windowStart = last;
    let raf = requestAnimationFrame(function tick(now) {
      frames++;
      worst = Math.max(worst, now - last);
      last = now;
      if (now - windowStart >= REFRESH_MS) {
        const stats = renderStats();
        setReading({
          fps: Math.round((frames * 1000) / (now - windowStart)),
          frameMs: Math.round(worst * 10) / 10,
          drawCalls: stats?.drawCalls ?? 0,
          triangles: stats?.triangles ?? 0,
          pixelRatio: stats?.pixelRatio ?? 1,
        });
        frames = 0;
        worst = 0;
        windowStart = now;
      }
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (!open || !reading) return null;
  return (
    <dl className="pointer-events-none absolute top-4 right-4 z-50 grid grid-cols-[auto_auto] gap-x-3 rounded-md bg-dusk-900/80 px-3 py-2 font-mono text-xs text-dusk-50 tabular-nums">
      <dt>fps</dt>
      <dd className="text-right">{reading.fps}</dd>
      <dt>worst frame</dt>
      <dd className="text-right">{reading.frameMs} ms</dd>
      <dt>draw calls</dt>
      <dd className="text-right">{reading.drawCalls}</dd>
      <dt>triangles</dt>
      <dd className="text-right">{(reading.triangles / 1000).toFixed(0)}k</dd>
      <dt>pixel ratio</dt>
      <dd className="text-right">{reading.pixelRatio}</dd>
    </dl>
  );
}
