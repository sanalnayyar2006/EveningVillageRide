"use client";

import { useEffect } from "react";
import { useGameEvent } from "@/hooks/useGameEvent";
import { ambient, windStrength } from "@/game/ambient/ambientState";
import type { Vec3Tuple } from "@/types/game";
import { useSettingsStore } from "@/store/settingsStore";
import { smoothstep } from "@/utils/math";
import { audioEngine } from "./AudioEngine";
import {
  playBark,
  playBicycleBell,
  playBleat,
  playCheer,
  playChirp,
  playMoo,
  playShutter,
  playTempleBell,
  playTrainHorn,
  playWings,
  startLoop,
} from "./synth";

type Sound = (ctx: AudioContext, out: AudioNode) => void;

/** How far (m) each sound carries. */
const RANGE = { animal: 45, bell: 220, horn: 600, wings: 35, cheer: 80 };
/** How often the ambient beds are adjusted, and the chance of a bird calling each time. */
const AMBIENT_TICK_MS = 250;
const CHIRP_CHANCE = 0.12;

function playAt(position: Vec3Tuple, range: number, sound: Sound) {
  const output = audioEngine.spatialOutput(position, range);
  if (output) sound(output.ctx, output.out);
}

/** Turns game events into sound, and keeps the wind, insects and birdsong going. Nothing else touches audio. */
export function AudioSystem() {
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const sfxVolume = useSettingsStore((s) => s.sfxVolume);

  useEffect(() => audioEngine.installUnlock(), []);
  useEffect(() => audioEngine.setVolumes(masterVolume, sfxVolume), [masterVolume, sfxVolume]);

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

  // The beds of sound under everything: wind that swells with the gusts,
  // birds calling through the golden hour, crickets as dusk comes on.
  useEffect(() => {
    let wind: GainNode | null = null;
    let insects: GainNode | null = null;
    const timer = window.setInterval(() => {
      const bus = audioEngine.sfxOutput();
      if (!bus) return;
      wind ??= startLoop(bus.ctx, bus.out, "wind");
      insects ??= startLoop(bus.ctx, bus.out, "insects");
      const now = bus.ctx.currentTime;
      wind.gain.setTargetAtTime(0.04 + windStrength() * 0.22, now, 0.5);
      insects.gain.setTargetAtTime(smoothstep(0.35, 0.9, ambient.dayProgress) * 0.05, now, 1);

      const daylight = 1 - smoothstep(0.5, 0.85, ambient.dayProgress);
      if (Math.random() < CHIRP_CHANCE * daylight) {
        const panner = bus.ctx.createStereoPanner();
        panner.pan.value = Math.random() * 2 - 1;
        panner.connect(bus.out);
        playChirp(bus.ctx, panner);
        window.setTimeout(() => panner.disconnect(), 1000);
      }
    }, AMBIENT_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
