"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { events } from "@/game/core/events";
import { FRAME_ORDER, MAX_DT } from "@/game/core/frameOrder";
import { ambient } from "@/game/ambient/ambientState";
import type { Point } from "@/game/world/data/mapSource";
import { useBikeStore, type BikeTelemetry } from "@/store/bikeStore";
import { clamp, damp, mulberry32 } from "@/utils/math";
import { createAnimalParts, drawAnimal, type Animal, type Species } from "./animal";
import { glanceYaw, moveTowards, updateAgent } from "./brain";
import { CreatureBodies } from "./CreatureBodies";
import { createAnimals } from "./data/animals";

/** A sleeping dog wakes if a bike goes past faster than this (m/s) within this distance (m). */
const DOG_WAKE = { speed: 2.2, distance: 11 };
/** How long a dog runs alongside the bike before giving up, and how long it then naps. */
const DOG_CHASE_SECONDS = 6;
const DOG_COOLDOWN_SECONDS = 25;
/** Cows don't move out of the way; they just stand still. */
const COW_STANDOFF = 3;

interface DogMood {
  home: Point;
  homeHeading: number;
  mode: "rest" | "chase" | "return";
  timer: number;
  cooldown: number;
  barkIn: number;
}

/** Seconds until an animal next makes a sound on its own. */
interface Voice {
  nextCall: number;
}

const COLLIDER: Record<Species, { radius: number; halfHeight: number }> = {
  cow: { radius: 0.6, halfHeight: 0.7 },
  goat: { radius: 0.3, halfHeight: 0.35 },
  dog: { radius: 0.25, halfHeight: 0.25 },
};

const position = (a: Animal): [number, number, number] => [a.x, 1, a.z];

function updateDog(dog: Animal, mood: DogMood, bike: BikeTelemetry, dt: number) {
  const distance = Math.hypot(dog.x - bike.x, dog.z - bike.z);
  mood.cooldown -= dt;

  switch (mood.mode) {
    case "rest":
      dog.held = null;
      if (
        mood.cooldown <= 0 &&
        distance < DOG_WAKE.distance &&
        Math.abs(bike.speed) > DOG_WAKE.speed
      ) {
        mood.mode = "chase";
        mood.timer = 0;
        mood.barkIn = 0;
      }
      return;
    case "chase": {
      mood.timer += dt;
      // Run alongside the bike, on whichever side the dog is already on.
      const side =
        Math.sign(
          (dog.x - bike.x) * Math.cos(bike.heading) - (dog.z - bike.z) * Math.sin(bike.heading),
        ) || 1;
      const target: Point = [
        bike.x + Math.cos(bike.heading) * 1.8 * side,
        bike.z - Math.sin(bike.heading) * 1.8 * side,
      ];
      dog.held = "run";
      moveTowards(dog, target, clamp(Math.abs(bike.speed) + 1.5, 3, 7.5), dt);
      mood.barkIn -= dt;
      if (mood.barkIn <= 0) {
        events.emit("life:bark", { position: position(dog) });
        mood.barkIn = 0.7 + Math.random() * 0.5;
      }
      if (mood.timer > DOG_CHASE_SECONDS || distance > 25) mood.mode = "return";
      return;
    }
    case "return":
      dog.held = "walk";
      if (moveTowards(dog, mood.home, 1.6, dt)) {
        dog.heading = mood.homeHeading;
        mood.mode = "rest";
        mood.cooldown = DOG_COOLDOWN_SECONDS;
      }
  }
}

/** Cows, goats and dogs: grazing, ambling, dozing, and reacting to the bike. */
export function Animals() {
  const animals = useMemo(() => createAnimals(), []);
  const parts = useMemo(
    () => ({
      cow: createAnimalParts("cow", animals.filter((a) => a.species === "cow").length),
      goat: createAnimalParts("goat", animals.filter((a) => a.species === "goat").length),
      dog: createAnimalParts("dog", animals.filter((a) => a.species === "dog").length),
    }),
    [animals],
  );
  const moods = useMemo(
    () =>
      new Map(
        animals
          .filter((a) => a.species === "dog")
          .map((d): [Animal, DogMood] => [
            d,
            {
              home: [d.x, d.z],
              homeHeading: d.heading,
              mode: "rest",
              timer: 0,
              cooldown: 0,
              barkIn: 0,
            },
          ]),
      ),
    [animals],
  );
  const voices = useMemo(() => {
    const random = mulberry32(3);
    return new Map(animals.map((a): [Animal, Voice] => [a, { nextCall: 10 + random() * 40 }]));
  }, [animals]);
  const random = useMemo(() => mulberry32(17), []);
  const bySpecies = useMemo(
    () =>
      (["cow", "goat", "dog"] as const).map((s) => ({
        species: s,
        list: animals.filter((a) => a.species === s),
      })),
    [animals],
  );

  useEffect(() => () => Object.values(parts).forEach((p) => p.dispose()), [parts]);

  useFrame((_, frameDelta) => {
    const dt = Math.min(frameDelta, MAX_DT);
    const bike = useBikeStore.getState().telemetry;

    for (const a of animals) {
      const distance = Math.hypot(a.x - bike.x, a.z - bike.z);
      const voice = voices.get(a)!;
      voice.nextCall -= dt;

      if (a.species === "dog") {
        // The dog's mood sets `held` (run, walk), which updateAgent turns into its pose.
        updateDog(a, moods.get(a)!, bike, dt);
        updateAgent(a, dt, random);
      } else {
        // Stand still while the bike squeezes past; cows may moo about it.
        if (distance < COW_STANDOFF) {
          a.held = "stand";
          if (a.species === "cow" && voice.nextCall > 4) voice.nextCall = Math.random() * 2;
        } else if (a.held && distance > COW_STANDOFF + 1.5) {
          a.held = null;
        }
        updateAgent(a, dt, random);
        if (voice.nextCall <= 0) {
          events.emit(a.species === "cow" ? "life:moo" : "life:bleat", { position: position(a) });
          voice.nextCall = 25 + random() * 45;
        }
      }

      const look = a.activity === "lie" ? 0 : glanceYaw(a, bike.x, bike.z, dt, 0.9);
      a.headYaw += (look - a.headYaw) * damp(3, dt);
    }

    for (const { species, list } of bySpecies) {
      const set = parts[species];
      set.begin();
      for (const a of list) drawAnimal(set, a, ambient.time);
      set.end();
    }
  }, FRAME_ORDER.life);

  return (
    <>
      {Object.values(parts).flatMap((set) =>
        set.meshes.map((mesh) => <primitive key={mesh.uuid} object={mesh} />),
      )}
      {bySpecies.map(({ species, list }) => (
        <CreatureBodies key={species} creatures={list} {...COLLIDER[species]} />
      ))}
    </>
  );
}
