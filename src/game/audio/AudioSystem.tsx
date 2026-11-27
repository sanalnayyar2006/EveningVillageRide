"use client";

import { useEffect } from "react";
import { useGameEvent } from "@/hooks/useGameEvent";
import type { Vec3Tuple } from "@/types/game";
import { useBikeStore } from "@/store/bikeStore";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { audioEngine } from "./AudioEngine";
import { Soundscape, SOUNDSCAPE_TICK_MS } from "./soundscape";
import {
  playBark,
  playBicycleBell,
  playBleat,
  playCheer,
  playMoo,
  playShutter,
  playTempleBell,
  playTrainHorn,
  playWings,
} from "./synth";

type Sound = (ctx: AudioContext, out: AudioNode) => void;

/** How far (m) each sound carries. */
const RANGE = { animal: 45, bell: 220, horn: 600, wings: 35, cheer: 80, bicycleBell: 40 };

function playAt(position: Vec3Tuple, range: number, sound: Sound) {
  const output = audioEngine.spatialOutput(position, range);
  if (output) sound(output.ctx, output.out);
}

/** Turns game events into sound and keeps the soundscape going. Nothing else touches audio. */
export function AudioSystem() {
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);

  useEffect(() => audioEngine.installUnlock(), []);
  const paused = usePlayerStore((s) => s.state === "paused");

  useEffect(() => audioEngine.setVolumes(masterVolume, sfxVolume), [masterVolume, sfxVolume]);
  useEffect(() => audioEngine.setPaused(paused), [paused]);

  useGameEvent("bike:bell", () => {
    const output = audioEngine.sfxOutput();
    if (output) playBicycleBell(output.ctx, output.out);
  });
  useGameEvent("photo:taken", () => {
    const output = audioEngine.sfxOutput();
    if (output) playShutter(output.ctx, output.out);
  });
  useGameEvent("life:moo", ({ position }) => playAt(position, RANGE.animal, playMoo));
  useGameEvent("life:bark", ({ position }) => playAt(position, RANGE.animal, playBark));
  useGameEvent("life:bleat", ({ position }) => playAt(position, RANGE.animal, playBleat));
  useGameEvent("life:birdsFlush", ({ position }) => playAt(position, RANGE.wings, playWings));
  useGameEvent("life:cheer", ({ position }) => playAt(position, RANGE.cheer, playCheer));
  useGameEvent("ambient:templeBell", ({ position }) =>
    playAt(position, RANGE.bell, playTempleBell),
  );
  useGameEvent("ambient:trainHorn", ({ position }) => playAt(position, RANGE.horn, playTrainHorn));
  useGameEvent("life:bicycleBell", ({ position }) =>
    playAt(position, RANGE.bicycleBell, playBicycleBell),
  );

  // The soundscape starts once the browser lets audio play, then follows the ride.
  useEffect(() => {
    let soundscape: Soundscape | null = null;
    const timer = window.setInterval(() => {
      const bus = audioEngine.sfxOutput();
      if (!bus) return;
      soundscape ??= new Soundscape(bus.ctx, bus.out);
      soundscape.update(useBikeStore.getState().telemetry);
    }, SOUNDSCAPE_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
