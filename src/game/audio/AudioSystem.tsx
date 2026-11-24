"use client";

import { useEffect } from "react";
import { useGameEvent } from "@/hooks/useGameEvent";
import { useSettingsStore } from "@/store/settingsStore";
import { audioEngine } from "./AudioEngine";
import { playBicycleBell } from "./synth";

/** Turns game events into sound. Nothing else in the game touches audio. */
export function AudioSystem() {
  const master = useSettingsStore((s) => s.masterVolume);
  const sfx = useSettingsStore((s) => s.sfxVolume);

  useEffect(() => audioEngine.installUnlock(), []);
  useEffect(() => audioEngine.setVolumes(master, sfx, false), [master, sfx]);

  useGameEvent("bike:bell", () => {
    const output = audioEngine.sfxOutput();
    if (output) playBicycleBell(output.ctx, output.out);
  });

  return null;
}
