"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color, MathUtils, type PerspectiveCamera } from "three";
import { MAX_DT } from "@/game/core/frameOrder";
import { localToWorld } from "@/game/world/data/geometry";
import { HOUSES, nearestRoad } from "@/game/world/data/layout";
import { TEA_STALL } from "@/game/world/data/structures";
import { wallTop } from "@/game/world/scenery/houses";
import { heightAt } from "@/game/world/terrain";
import { useBikeStore } from "@/store/bikeStore";
import { mulberry32, smoothstep } from "@/utils/math";
import { ambient, windStrength } from "./ambientState";
import { PuffPool, type PuffStyle } from "./particles";

const DUST: PuffStyle = {
  color: new Color("#c9a47c"),
  life: [1.1, 1.8],
  size: [0.3, 1.4],
  opacity: 0.45,
  lift: -0.15,
  drag: 0.25,
};

const STEAM: PuffStyle = {
  color: new Color("#f4f1ec"),
  life: [1.8, 2.8],
  size: [0.08, 0.45],
  opacity: 0.35,
  lift: 0.25,
  drag: 0.5,
};

const SMOKE: PuffStyle = {
  color: new Color("#a39c94"),
  life: [6, 9],
  size: [0.5, 3.2],
  opacity: 0.22,
  lift: 0.12,
  drag: 0.6,
};

/** Dust only rises off dirt and grass, above this speed (m/s). */
const DUST_SPEED = 2.5;
/** Rear wheel contact, behind the bike's origin (m). */
const REAR_WHEEL = 0.55;
/** One house in this many has its chulha lit for the evening meal. */
const COOKING_EVERY = 6;
/** Chimney smoke is only spawned this close to the rider (m); further away it isn't noticed. */
const SMOKE_RANGE = 140;
/** Wind blows roughly towards the east-south-east, as the vegetation sways. */
const WIND_DIRECTION = { x: 0.86, z: 0.51 };
const WIND_SPEED = 1.6;

/** The kettle on the tea stall's stove, in world space. */
function kettleSpout(): [number, number, number] {
  const [x, z] = localToWorld(
    TEA_STALL.x,
    TEA_STALL.z,
    TEA_STALL.rot,
    -0.9,
    TEA_STALL.d / 2 - 0.25,
  );
  return [x, heightAt(TEA_STALL.x, TEA_STALL.z) + 1.55, z];
}

/** A smoke hole near the back of the roof of every few houses. */
function chimneys(): [number, number, number][] {
  return HOUSES.filter((_, i) => i % COOKING_EVERY === 3).map((house) => {
    const [x, z] = localToWorld(house.x, house.z, house.rot, house.w * 0.25, -house.d * 0.25);
    return [x, heightAt(house.x, house.z) + wallTop(house) + 0.6, z];
  });
}

/**
 * Dust off the back wheel, steam from the chai kettle, and smoke from
 * kitchen fires that thickens as the evening meal gets going.
 */
export function Puffs() {
  const camera = useThree((state) => state.camera as PerspectiveCamera);
  const viewportHeight = useThree((state) => state.size.height * state.viewport.dpr);
  const pool = useMemo(() => new PuffPool(500), []);
  const sources = useMemo(
    () => ({
      kettle: kettleSpout(),
      chimneys: chimneys(),
      random: mulberry32(5),
      /** Fractional puffs carried between frames, per emitter. */
      owed: { dust: 0, steam: 0, smoke: 0 },
    }),
    [],
  );

  useEffect(() => () => pool.dispose(), [pool]);

  useFrame((_, frameDelta) => {
    const dt = Math.min(frameDelta, MAX_DT);
    const { random, owed } = sources;
    const spread = (amount: number) => (random() - 0.5) * 2 * amount;
    const wind = windStrength() * WIND_SPEED;

    // Dust, more the faster the bike goes.
    const bike = useBikeStore.getState().telemetry;
    const speed = Math.abs(bike.speed);
    const road = nearestRoad(bike.x, bike.z);
    const onTarmac = road.edge < 0 && road.surface === "asphalt";
    if (speed > DUST_SPEED && !onTarmac) {
      owed.dust += dt * (speed - DUST_SPEED) * 6;
      const backX = bike.x - Math.sin(bike.heading) * REAR_WHEEL;
      const backZ = bike.z - Math.cos(bike.heading) * REAR_WHEEL;
      for (; owed.dust >= 1; owed.dust--) {
        pool.emit(
          DUST,
          backX + spread(0.1),
          bike.y + 0.08,
          backZ + spread(0.1),
          -Math.sin(bike.heading) * speed * 0.15 + spread(0.4),
          0.3 + random() * 0.4,
          -Math.cos(bike.heading) * speed * 0.15 + spread(0.4),
          random,
        );
      }
    }

    // The kettle never stops.
    owed.steam += dt * 4;
    for (; owed.steam >= 1; owed.steam--) {
      const [x, y, z] = sources.kettle;
      pool.emit(
        STEAM,
        x + spread(0.03),
        y,
        z + spread(0.03),
        spread(0.05),
        0.35,
        spread(0.05),
        random,
      );
    }

    // Kitchen smoke, thin at first and thicker once cooking starts at dusk.
    owed.smoke += dt * (0.5 + smoothstep(0.2, 0.8, ambient.dayProgress) * 1.2);
    for (; owed.smoke >= 1; owed.smoke--) {
      for (const [x, y, z] of sources.chimneys) {
        if (Math.hypot(x - bike.x, z - bike.z) > SMOKE_RANGE) continue;
        pool.emit(
          SMOKE,
          x + spread(0.15),
          y,
          z + spread(0.15),
          spread(0.1),
          0.4,
          spread(0.1),
          random,
        );
      }
    }

    pool.update(dt, WIND_DIRECTION.x * wind, WIND_DIRECTION.z * wind);
    const uniforms = pool.material.uniforms;
    uniforms.uPixelsPerMetre!.value =
      viewportHeight / (2 * Math.tan(MathUtils.degToRad(camera.fov) / 2));
    uniforms.uLight!.value = 1 - 0.65 * smoothstep(0, 1, ambient.dayProgress);
  });

  return <points geometry={pool.geometry} material={pool.material} frustumCulled={false} />;
}
