"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { saveRide } from "./rideSave";

const AUTOSAVE_MS = 10_000;

/** Saves the ride every few seconds while playing, and as the page closes. */
export function RideAutosave() {
  const playing = useGameStore((s) => s.phase === "playing");

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(saveRide, AUTOSAVE_MS);
    window.addEventListener("pagehide", saveRide);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", saveRide);
    };
  }, [playing]);

  return null;
}
