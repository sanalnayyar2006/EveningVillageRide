"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { BufferGeometry, Group } from "three";
import { events } from "@/game/core/events";
import { MAX_DT } from "@/game/core/frameOrder";
import { GeometryBatch } from "@/game/world/batch";
import { RAILWAY } from "@/game/world/data/layout";
import { railHeight } from "@/game/world/terrain";
import { PALETTE, WORLD_MATERIALS } from "@/game/world/worldMaterials";
import { useBikeStore } from "@/store/bikeStore";
import { mulberry32 } from "@/utils/math";

/** Narrow gauge: 762 mm, like the real Kangra Valley line. */
const GAUGE = 0.76;
const SLEEPER_SPACING = 1.3;
const RAIL_SEGMENT = 8;
const COACHES = 4;
const LOCO_LENGTH = 7;
const COACH_LENGTH = 8.5;
const GAP = 0.6;
const SPEED = 9;
/** Seconds between trains, give or take. */
const INTERVAL = { min: 150, max: 230 };
const BLUE = "#2f5b9a";
const CREAM = "#efe2c4";

function buildTrack(): BufferGeometry {
  const b = new GeometryBatch();
  const { z, halfLength } = RAILWAY;
  for (let x = -halfLength; x < halfLength; x += SLEEPER_SPACING) {
    b.box([0.28, 0.12, 1.7], [x, railHeight(x) + 0.02, z], "#5a4a3c");
  }
  for (let x = -halfLength; x < halfLength; x += RAIL_SEGMENT) {
    const x1 = x + RAIL_SEGMENT;
    for (const side of [-1, 1]) {
      const rz = z + (side * GAUGE) / 2;
      b.beam([x, railHeight(x) + 0.12, rz], [x1, railHeight(x1) + 0.12, rz], 0.07, "#6f6a66");
    }
  }
  return b.build()!;
}

interface CarShape {
  solid: BufferGeometry;
  glow: BufferGeometry | null;
}

/** Cars are built along local X (the direction of travel), centred on their middle. */
function buildCar(kind: "loco" | "coach"): CarShape {
  const b = new GeometryBatch();
  const length = kind === "loco" ? LOCO_LENGTH : COACH_LENGTH;
  const wheel = (x: number) => {
    for (const side of [-1, 1]) {
      b.cylinder(0.3, 0.3, 0.1, [x, 0.3, (side * GAUGE) / 2], PALETTE.iron, 10, [
        Math.PI / 2,
        0,
        0,
      ]);
    }
  };
  b.box([length, 0.35, 1.9], [0, 0.65, 0], PALETTE.iron);
  for (const x of [-length * 0.32, -length * 0.18, length * 0.18, length * 0.32]) wheel(x);

  if (kind === "loco") {
    b.box([length * 0.6, 1.5, 1.8], [-length * 0.1, 1.6, 0], BLUE);
    b.box([length * 0.62, 0.2, 1.84], [-length * 0.1, 1.9, 0], CREAM);
    b.box([length * 0.32, 2.1, 1.9], [length * 0.32, 1.9, 0], BLUE);
    b.box([length * 0.34, 0.15, 2.0], [length * 0.32, 3.0, 0], PALETTE.iron);
    b.box([0.1, 0.5, 1.2], [length * 0.48, 2.3, 0], PALETTE.windowDark);
    b.cylinder(0.12, 0.15, 0.6, [-length * 0.3, 2.6, 0], PALETTE.iron, 8);
    b.glowing(() => b.sphere(0.14, [-length * 0.42, 1.8, 0], "#ffffff"));
  } else {
    b.box([length, 1.9, 1.95], [0, 1.8, 0], BLUE);
    b.box([length + 0.04, 0.35, 1.99], [0, 1.95, 0], CREAM);
    b.box([length + 0.2, 0.15, 2.1], [0, 2.82, 0], "#3d3a38");
    // Lit windows down both sides: the evening passengers' carriage lights.
    b.glowing(() => {
      for (let i = 0; i < 6; i++) {
        const x = -length / 2 + 0.8 + i * ((length - 1.6) / 5);
        for (const side of [-1, 1]) b.box([0.7, 0.55, 0.03], [x, 2.05, side * 0.99], "#ffffff");
      }
    });
  }
  return { solid: b.build()!, glow: b.build("glow") };
}

/** The evening train on the Kangra Valley line, passing south of the village every few minutes. */
export function Train() {
  const track = useMemo(() => buildTrack(), []);
  const loco = useMemo(() => buildCar("loco"), []);
  const coach = useMemo(() => buildCar("coach"), []);
  const cars = useRef<(Group | null)[]>([]);
  const state = useMemo(() => {
    const random = mulberry32(47);
    return {
      random,
      /** Distance travelled along the line on this run, or null between trains. */
      travelled: null as number | null,
      direction: 1,
      wait: 40 + random() * 40,
      hornedNear: false,
    };
  }, []);

  useEffect(
    () => () => {
      track.dispose();
      for (const car of [loco, coach]) {
        car.solid.dispose();
        car.glow?.dispose();
      }
    },
    [track, loco, coach],
  );

  useFrame((_, frameDelta) => {
    const dt = Math.min(frameDelta, MAX_DT);
    const trainLength = LOCO_LENGTH + COACHES * (COACH_LENGTH + GAP);
    const runLength = RAILWAY.halfLength * 2 + trainLength;

    if (state.travelled === null) {
      state.wait -= dt;
      if (state.wait <= 0) {
        state.travelled = 0;
        state.direction = state.random() < 0.5 ? 1 : -1;
        state.hornedNear = false;
        const startX = -state.direction * RAILWAY.halfLength;
        events.emit("ambient:trainHorn", { position: [startX, railHeight(startX) + 3, RAILWAY.z] });
      }
    } else {
      state.travelled += SPEED * dt;
      if (state.travelled > runLength) {
        state.travelled = null;
        state.wait = INTERVAL.min + state.random() * (INTERVAL.max - INTERVAL.min);
      }
    }

    const running = state.travelled !== null;
    const front = -state.direction * RAILWAY.halfLength + state.direction * (state.travelled ?? 0);
    // One more long whistle as the engine passes closest to the rider.
    const bikeX = useBikeStore.getState().telemetry.x;
    if (running && !state.hornedNear && Math.abs(front - bikeX) < 20) {
      state.hornedNear = true;
      events.emit("ambient:trainHorn", { position: [front, railHeight(front) + 3, RAILWAY.z] });
    }

    let offset = 0;
    cars.current.forEach((car, i) => {
      if (!car) return;
      car.visible = running;
      const length = i === 0 ? LOCO_LENGTH : COACH_LENGTH;
      const centre = front - state.direction * (offset + length / 2);
      offset += length + GAP;
      car.position.set(centre, railHeight(centre) + 0.15, RAILWAY.z);
      car.rotation.y = state.direction > 0 ? 0 : Math.PI;
    });
  });

  return (
    <>
      <mesh geometry={track} material={WORLD_MATERIALS.painted} receiveShadow />
      {[loco, ...Array.from({ length: COACHES }, () => coach)].map((car, i) => (
        <group
          key={i}
          ref={(g) => {
            cars.current[i] = g;
          }}
          visible={false}
        >
          <mesh geometry={car.solid} material={WORLD_MATERIALS.painted} castShadow />
          {car.glow && <mesh geometry={car.glow} material={WORLD_MATERIALS.glow} />}
        </group>
      ))}
    </>
  );
}
