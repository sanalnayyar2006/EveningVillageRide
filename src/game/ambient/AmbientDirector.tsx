"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { events } from "@/game/core/events";
import { MAX_DT } from "@/game/core/frameOrder";
import { localToWorld } from "@/game/world/data/geometry";
import { TEMPLE_BELL } from "@/game/world/data/structures";
import { heightAt } from "@/game/world/terrain";
import { damp, mulberry32 } from "@/utils/math";
import { ambient, DUSK_SECONDS, windStrength } from "./ambientState";
import { windUniforms } from "./wind";

type Happening = "templeBell" | "gust" | "flyover";

/** How often each kind of happening is picked. */
const WEIGHTS: Record<Happening, number> = { templeBell: 3, gust: 3, flyover: 2 };
/** Seconds between happenings: never on a timer you could set a watch by. */
const GAP = { min: 22, max: 60 };

function pick(random: () => number): Happening {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  let roll = random() * total;
  for (const [name, weight] of Object.entries(WEIGHTS) as [Happening, number][]) {
    roll -= weight;
    if (roll <= 0) return name;
  }
  return "gust";
}

/**
 * Runs the evening: the clock that sets the sun, the breeze and its gusts,
 * and the occasional temple bell or flock of birds overhead.
 */
export function AmbientDirector() {
  const state = useMemo(() => {
    const random = mulberry32(2024);
    return { random, nextIn: 15 + random() * 20, gustLeft: 0 };
  }, []);

  useFrame((_, frameDelta) => {
    const dt = Math.min(frameDelta, MAX_DT);
    ambient.time += dt;
    ambient.dayProgress = Math.min(1, ambient.dayProgress + dt / DUSK_SECONDS);

    // The breeze wanders slowly; a gust swells up and dies away.
    ambient.breeze =
      0.16 + 0.08 * Math.sin(ambient.time * 0.05) + 0.04 * Math.sin(ambient.time * 0.17);
    state.gustLeft = Math.max(0, state.gustLeft - dt);
    const gustTarget = state.gustLeft > 0 ? 0.75 : 0;
    ambient.gust += (gustTarget - ambient.gust) * damp(state.gustLeft > 0 ? 0.9 : 0.5, dt);

    windUniforms.uWindTime.value = ambient.time;
    windUniforms.uWindStrength.value = windStrength();

    state.nextIn -= dt;
    if (state.nextIn > 0) return;
    state.nextIn = GAP.min + state.random() * (GAP.max - GAP.min);

    switch (pick(state.random)) {
      case "templeBell": {
        const [x, z] = localToWorld(TEMPLE_BELL.x, TEMPLE_BELL.z, TEMPLE_BELL.rot, 0, 0);
        events.emit("ambient:templeBell", {
          position: [x, heightAt(x, z) + TEMPLE_BELL.height, z],
        });
        break;
      }
      case "gust": {
        const seconds = 6 + state.random() * 6;
        state.gustLeft = seconds;
        events.emit("ambient:gust", { seconds });
        break;
      }
      case "flyover":
        events.emit("ambient:flyover", {});
        break;
    }
  });

  return null;
}
