"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Mesh } from "three";
import { useGameEvent } from "@/hooks/useGameEvent";
import { events } from "@/game/core/events";
import { FRAME_ORDER, MAX_DT } from "@/game/core/frameOrder";
import { ambient } from "@/game/ambient/ambientState";
import { useBikeStore } from "@/store/bikeStore";
import { damp, mulberry32 } from "@/utils/math";
import { faceTowards, glanceYaw, updateAgent } from "./brain";
import { CreatureBodies } from "./CreatureBodies";
import { CricketMatch } from "./cricket";
import { createVillagers } from "./data/villagers";
import { createHumanParts, drawVillager, type HumanActivity, type Villager } from "./human";

/** A walker stops and steps aside when the bike comes this close (m)… */
const YIELD_DISTANCE = 2.8;
/** …and carries on once it's this far away. */
const RESUME_DISTANCE = 4.5;
/** Ringing the bell makes people within this distance wave. */
const BELL_HEARING = 14;
const WAVE_SECONDS = 1.6;
/** A child on a bicycle rings their bell once when the rider comes this close (m)… */
const KID_BELL_DISTANCE = 12;
/** …and again only after the rider has been this far away. */
const KID_BELL_REARM = 30;

/** Busy with something they won't stop for a wave: sitting down, working, serving tea. */
const BUSY: ReadonlySet<HumanActivity> = new Set(["sit", "sip", "work", "pour", "kite"]);

const isMoving = (v: Villager) => v.script[v.step]?.kind !== "stay";

/** Everyone in the village: their routines, how they react to the bike, and the cricket match. */
export function Villagers() {
  const villagers = useMemo(() => createVillagers(), []);
  const match = useMemo(() => new CricketMatch(), []);
  const everyone = useMemo(() => [...villagers, ...match.players], [villagers, match]);
  const parts = useMemo(() => createHumanParts(everyone.length), [everyone]);
  const random = useMemo(() => mulberry32(5), []);
  const waving = useRef(new Map<Villager, number>());
  const rangBell = useRef(new Set<Villager>());
  const ball = useRef<Mesh>(null);

  useEffect(() => () => parts.dispose(), [parts]);

  useGameEvent("bike:bell", ({ position: [bx, , bz] }) => {
    for (const v of villagers) {
      if (BUSY.has(v.activity) || Math.hypot(v.x - bx, v.z - bz) > BELL_HEARING) continue;
      waving.current.set(v, WAVE_SECONDS);
    }
  });

  useFrame((_, frameDelta) => {
    const dt = Math.min(frameDelta, MAX_DT);
    const bike = useBikeStore.getState().telemetry;
    const bikeMoving = Math.abs(bike.speed) > 0.3;

    for (const v of villagers) {
      const distance = Math.hypot(v.x - bike.x, v.z - bike.z);
      const wave = waving.current.get(v) ?? 0;

      if (wave > 0) {
        waving.current.set(v, wave - dt);
        v.held = "wave";
        faceTowards(v, bike.x, bike.z, dt);
      } else if (isMoving(v) && bikeMoving && distance < YIELD_DISTANCE) {
        v.held = "stand";
      } else if (v.held && (v.held === "wave" || distance > RESUME_DISTANCE)) {
        v.held = null;
      }
      updateAgent(v, dt, random);

      if (v.look.bicycle) {
        if (distance > KID_BELL_REARM) rangBell.current.delete(v);
        else if (
          distance < KID_BELL_DISTANCE &&
          v.activity === "cycle" &&
          !rangBell.current.has(v)
        ) {
          rangBell.current.add(v);
          events.emit("life:bicycleBell", { position: [v.x, bike.y + 1, v.z] });
        }
      }

      // A quick look the first time the bike comes really close; otherwise eyes on their own business.
      let look = glanceYaw(v, bike.x, bike.z, dt, 1.2);
      if (look === 0 && (v.activity === "stand" || v.activity === "sit")) {
        look = Math.sin(ambient.time * 0.3 + v.x) * 0.5;
      }
      v.headYaw += (look - v.headYaw) * damp(4, dt);
    }

    match.update(dt);

    parts.begin();
    for (const v of everyone) drawVillager(parts, v, ambient.time);
    parts.end();

    if (ball.current) {
      ball.current.visible = match.ballVisible;
      ball.current.position.copy(match.ball);
    }
  }, FRAME_ORDER.life);

  return (
    <>
      {parts.meshes.map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
      <mesh ref={ball} visible={false} castShadow>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="#c23b2a" roughness={0.5} />
      </mesh>
      <CreatureBodies creatures={everyone} radius={0.28} halfHeight={0.8} />
    </>
  );
}
