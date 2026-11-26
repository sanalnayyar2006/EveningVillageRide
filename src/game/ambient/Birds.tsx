"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color, Matrix4 } from "three";
import { useGameEvent } from "@/hooks/useGameEvent";
import { events } from "@/game/core/events";
import { MAX_DT } from "@/game/core/frameOrder";
import { joint, PartSet, root } from "@/game/life/rig";
import { GeometryBatch } from "@/game/world/batch";
import { localToWorld } from "@/game/world/data/geometry";
import { POWER_POLES, WIRE_OFFSETS, wirePoint } from "@/game/world/data/props";
import { BENCHES, TEMPLE } from "@/game/world/data/structures";
import { heightAt } from "@/game/world/terrain";
import { useBikeStore } from "@/store/bikeStore";
import { mulberry32, smoothstep } from "@/utils/math";
import { ambient } from "./ambientState";

type Vec3 = [number, number, number];

interface Bird {
  home: Vec3;
  /** Facing while perched. */
  heading: number;
  /** Where along the orbit this bird flies, so the flock spreads out. */
  phase: number;
  /** Ground birds peck; wire birds sit still. */
  pecks: boolean;
}

interface Flock {
  birds: Bird[];
  colour: Color;
  centre: Vec3;
  /** Seconds since the flock took off, or null while perched. */
  flying: number | null;
  /** How long this flight lasts. */
  flightSeconds: number;
  /** Bike distance that startles the flock. */
  wariness: number;
}

const FLAP_RATE = 17;
const ORBIT = { radius: 11, height: 9, speed: 0.55 };

function shape(build: (b: GeometryBatch) => void) {
  const batch = new GeometryBatch();
  build(batch);
  return batch.build()!;
}

function createParts(capacity: number) {
  return new PartSet(
    {
      body: {
        capacity,
        geometry: shape((b) => {
          b.sphere(1, [0, 0, 0], "#ffffff", [0.045, 0.045, 0.1]);
          b.sphere(0.035, [0, 0.03, 0.09], "#ffffff");
          b.cone(0.012, 0.035, [0, 0.025, 0.13], "#d9a73a", 4, [Math.PI / 2, 0, 0]);
          b.box([0.05, 0.01, 0.07], [0, 0.01, -0.12], "#ffffff");
        }),
      },
      // One wing pointing along +X from the shoulder; the other side is the same wing turned round.
      wing: {
        capacity: capacity * 2,
        geometry: shape((b) => b.box([0.17, 0.008, 0.07], [0.085, 0, 0], "#ffffff")),
      },
    },
    false,
  );
}

function wireFlock(span: number, count: number, seed: number): Flock {
  const random = mulberry32(seed);
  const a = POWER_POLES[span]!;
  const b = POWER_POLES[span + 1]!;
  const birds: Bird[] = [];
  for (let i = 0; i < count; i++) {
    const t = 0.25 + random() * 0.5;
    const offset = WIRE_OFFSETS[Math.floor(random() * WIRE_OFFSETS.length)]!;
    const [x, y, z] = wirePoint(a, b, offset, t);
    // Birds on a wire face across it, some one way, some the other.
    birds.push({
      home: [x, y + 0.05, z],
      heading: a.rot + (random() < 0.5 ? Math.PI / 2 : -Math.PI / 2),
      phase: random() * 6.28,
      pecks: false,
    });
  }
  const [cx, cy, cz] = wirePoint(a, b, 0, 0.5);
  return {
    birds,
    colour: new Color("#2a2a2e"),
    centre: [cx, cy, cz],
    flying: null,
    flightSeconds: 14,
    wariness: 12,
  };
}

function templeFlock(): Flock {
  const random = mulberry32(21);
  const roof = TEMPLE.plinth.h + 2.9;
  const birds = Array.from({ length: 7 }, (_, i): Bird => {
    const [x, z] = localToWorld(TEMPLE.x, TEMPLE.z, TEMPLE.rot, -1.8 + i * 0.6, 1.2 + random() * 3);
    return {
      home: [x, heightAt(TEMPLE.x, TEMPLE.z) + roof, z],
      heading: random() * 6.28,
      phase: random() * 6.28,
      pecks: false,
    };
  });
  return {
    birds,
    colour: new Color("#8d9099"),
    centre: birds[3]!.home,
    flying: null,
    flightSeconds: 16,
    wariness: 9,
  };
}

function groundFlock(): Flock {
  const random = mulberry32(33);
  const bench = BENCHES.find((b) => b.id === "banyanBench")!;
  const birds = Array.from({ length: 6 }, (): Bird => {
    const [x, z] = localToWorld(
      bench.x,
      bench.z,
      bench.rot,
      (random() - 0.5) * 3,
      1.5 + random() * 2,
    );
    return {
      home: [x, heightAt(x, z) + 0.05, z],
      heading: random() * 6.28,
      phase: random() * 6.28,
      pecks: true,
    };
  });
  return {
    birds,
    colour: new Color("#6b5a48"),
    centre: birds[0]!.home,
    flying: null,
    flightSeconds: 10,
    wariness: 7,
  };
}

/** A V of birds crossing high over the village. */
interface Flyover {
  start: Vec3;
  direction: Vec3;
  time: number;
}

const FLYOVER_SIZE = 9;
const FLYOVER_SPEED = 10;
const FLYOVER_SECONDS = 40;

const matrix = new Matrix4();
const body = new Matrix4();
const wing = new Matrix4();

/** Crows on the wires, pigeons on the temple, a few birds by the banyan, and the odd flock overhead. */
export function Birds() {
  const flocks = useMemo(() => {
    const spans = [2, Math.floor(POWER_POLES.length / 2), POWER_POLES.length - 4].filter(
      (i) => i >= 0 && i < POWER_POLES.length - 1,
    );
    return [...spans.map((s, i) => wireFlock(s, 8, 40 + i)), templeFlock(), groundFlock()];
  }, []);
  const capacity = flocks.reduce((sum, f) => sum + f.birds.length, 0) + FLYOVER_SIZE;
  const parts = useMemo(() => createParts(capacity), [capacity]);
  const flyover = useMemo<{ current: Flyover | null }>(() => ({ current: null }), []);
  const crow = useMemo(() => new Color("#2a2a2e"), []);

  useEffect(() => () => parts.dispose(), [parts]);

  const startle = (flock: Flock) => {
    if (flock.flying !== null) return;
    flock.flying = 0;
    events.emit("life:birdsFlush", { position: flock.centre });
  };

  useGameEvent("ambient:templeBell", () => startle(flocks[flocks.length - 2]!));
  useGameEvent("bike:bell", ({ position: [x, , z] }) => {
    for (const f of flocks)
      if (Math.hypot(f.centre[0] - x, f.centre[2] - z) < f.wariness * 1.6) startle(f);
  });
  useGameEvent("ambient:flyover", () => {
    const bike = useBikeStore.getState().telemetry;
    const angle = Math.random() * Math.PI * 2;
    const direction: Vec3 = [Math.cos(angle), 0, Math.sin(angle)];
    const half = (FLYOVER_SPEED * FLYOVER_SECONDS) / 2;
    flyover.current = {
      start: [
        bike.x - direction[0] * half,
        heightAt(bike.x, bike.z) + 38,
        bike.z - direction[2] * half,
      ],
      direction,
      time: 0,
    };
  });

  useFrame((_, frameDelta) => {
    const dt = Math.min(frameDelta, MAX_DT);
    const t = ambient.time;
    const bike = useBikeStore.getState().telemetry;
    parts.begin();

    for (const flock of flocks) {
      const [cx, cy, cz] = flock.centre;
      const near = Math.hypot(cx - bike.x, cz - bike.z) < flock.wariness;
      if (near && Math.abs(bike.speed) > 1) startle(flock);
      if (flock.flying !== null) {
        flock.flying += dt;
        if (flock.flying > flock.flightSeconds && !near) flock.flying = null;
      }
      const f = flock.flying ?? 0;
      // 0 perched → 1 fully airborne, easing up at take-off and down at landing.
      const airborne =
        flock.flying === null
          ? 0
          : smoothstep(0, 2, f) * (1 - smoothstep(flock.flightSeconds - 3, flock.flightSeconds, f));

      for (const bird of flock.birds) {
        const angle = bird.phase + f * ORBIT.speed;
        const ox = cx + Math.cos(angle) * ORBIT.radius;
        const oy = cy + ORBIT.height + Math.sin(f * 1.3 + bird.phase) * 1.5;
        const oz = cz + Math.sin(angle) * ORBIT.radius;
        const x = bird.home[0] + (ox - bird.home[0]) * airborne;
        const y = bird.home[1] + (oy - bird.home[1]) * airborne;
        const z = bird.home[2] + (oz - bird.home[2]) * airborne;
        // In the air they face along the orbit; perched, their own way.
        const heading = airborne > 0.2 ? angle + Math.PI : bird.heading;
        const peck =
          bird.pecks && airborne === 0 ? Math.max(0, Math.sin(t * 3 + bird.phase)) ** 8 * 0.6 : 0;
        const flap = airborne > 0.05 ? Math.sin(t * FLAP_RATE + bird.phase) * 0.9 : 0.15;

        root(matrix, x, y, z, heading);
        joint(body, matrix, 0, 0.04, 0, peck);
        parts.place("body", body, flock.colour);
        joint(wing, body, 0.03, 0.02, 0, 0, 0, flap);
        parts.place("wing", wing, flock.colour);
        joint(wing, body, -0.03, 0.02, 0, 0, Math.PI, flap);
        parts.place("wing", wing, flock.colour);
      }
    }

    const over = flyover.current;
    if (over) {
      over.time += dt;
      if (over.time > FLYOVER_SECONDS) flyover.current = null;
      const heading = Math.atan2(over.direction[0], over.direction[2]);
      const travel = over.time * FLYOVER_SPEED;
      for (let i = 0; i < FLYOVER_SIZE; i++) {
        // A V: the leader in front, the others trailing out to either side.
        const rank = Math.ceil(i / 2);
        const side = i % 2 === 0 ? 1 : -1;
        const [x, z] = localToWorld(
          over.start[0] + over.direction[0] * travel,
          over.start[2] + over.direction[2] * travel,
          heading,
          side * rank * 1.6,
          -rank * 1.8,
        );
        root(matrix, x, over.start[1] + Math.sin(t + i) * 0.3, z, heading, 1.6);
        parts.place("body", matrix, crow);
        const flap = Math.sin(t * 9 + i * 0.7) * 0.7;
        joint(wing, matrix, 0.03, 0.02, 0, 0, 0, flap);
        parts.place("wing", wing, crow);
        joint(wing, matrix, -0.03, 0.02, 0, 0, Math.PI, flap);
        parts.place("wing", wing, crow);
      }
    }
    parts.end();
  });

  return (
    <>
      {parts.meshes.map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
    </>
  );
}
