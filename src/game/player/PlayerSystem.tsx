"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";

/** Owns the player's lifecycle; for now, mounting the bike once the ride starts. */
export function PlayerSystem() {
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    const { state, transition } = usePlayerStore.getState();
    if (phase === "playing" && state === "idle") transition("cycling");
  }, [phase]);

  return null;
}
