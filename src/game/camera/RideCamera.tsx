"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { BIKE_BODY_TAG, BIKE_CONFIG } from "@/game/bike/bikeConfig";
import { FRAME_ORDER, MAX_DT } from "@/game/core/frameOrder";
import { input } from "@/game/core/input/InputManager";
import { groundHeight } from "@/game/world/groundQueries";
import { useBikeStore } from "@/store/bikeStore";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { angleDelta, clamp, damp } from "@/utils/math";
import { RIDE_CAMERA as C } from "./cameraConfig";

interface OrbitState {
  /** World-space yaw of the camera's orbit (where it sits *behind*). */
  yaw: number;
  /** Player-controlled offset from straight behind. */
  yawOffset: number;
  pitch: number;
  distance: number;
  desiredDistance: number;
  initialised: boolean;
}

/** The camera's view ray must ignore the bike's own collider. */
const isNotBike = (collider: { parent(): { userData?: unknown } | null }) =>
  (collider.parent()?.userData as { tag?: string } | undefined)?.tag !== BIKE_BODY_TAG;

/**
 * Third-person follow camera: lags behind turns, orbits with mouse drag,
 * zooms with the wheel, recenters on its own and avoids clipping into scenery.
 */
export function RideCamera() {
  const camera = useThree((s) => s.camera);
  const { world, rapier } = useRapier();
  const view = useRef<OrbitState>({
    yaw: useBikeStore.getState().telemetry.heading,
    yawOffset: 0,
    pitch: C.pitch.default,
    distance: C.distance.default,
    desiredDistance: C.distance.default,
    initialised: false,
  });
  const v = useMemo(
    () => ({
      target: new Vector3(),
      desired: new Vector3(),
      dir: new Vector3(),
      lookAt: new Vector3(),
    }),
    [],
  );
  const ray = useMemo(() => new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }), [rapier]);

  useEffect(() => {
    const surface = document.querySelector<HTMLElement>("[data-game-surface]");
    if (!surface) return;
    const sync = () => {
      surface.style.cursor = input.isDragging ? "grabbing" : "grab";
    };
    surface.addEventListener("pointerdown", sync);
    surface.addEventListener("pointerup", sync);
    sync();
    return () => {
      surface.removeEventListener("pointerdown", sync);
      surface.removeEventListener("pointerup", sync);
      surface.style.cursor = "";
    };
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, MAX_DT);
    const t = useBikeStore.getState().telemetry;
    const s = view.current;
    const settings = useSettingsStore.getState();
    const active = usePlayerStore.getState().state === "cycling";

    // Player look input.
    const look = input.consumeLook();
    const wheel = input.consumeWheel();
    if (active) {
      const k = C.dragSensitivity * settings.lookSensitivity;
      s.yawOffset -= look.dx * k;
      s.pitch += look.dy * k * (settings.invertY ? -1 : 1);
      s.pitch = clamp(s.pitch, C.pitch.min, C.pitch.max);
      s.desiredDistance = clamp(
        s.desiredDistance + wheel * C.distance.wheelStep,
        C.distance.min,
        C.distance.max,
      );
    }

    // Drift back behind the rider once they stop looking around.
    const moving = Math.abs(t.speed) > 0.8;
    if (moving && !input.isDragging && input.msSinceLook() > C.recenterDelayMs) {
      s.yawOffset += angleDelta(s.yawOffset, 0) * damp(C.recenterRate, dt);
      s.pitch += (C.pitch.default - s.pitch) * damp(C.recenterRate * 0.6, dt);
    }

    // The orbit lags behind the bike's heading, which is what makes turns feel smooth.
    const targetYaw = t.heading + s.yawOffset;
    if (!s.initialised) s.yaw = targetYaw;
    s.yaw += angleDelta(s.yaw, targetYaw) * damp(input.isDragging ? 20 : C.yawFollow, dt);

    v.target.set(t.x, t.y + C.targetHeight, t.z);
    v.dir.set(
      -Math.sin(s.yaw) * Math.cos(s.pitch),
      Math.sin(s.pitch),
      -Math.cos(s.yaw) * Math.cos(s.pitch),
    );

    // Pull in when scenery is between the rider and the camera.
    let allowed = s.desiredDistance;
    ray.origin = { x: v.target.x, y: v.target.y, z: v.target.z };
    ray.dir = { x: v.dir.x, y: v.dir.y, z: v.dir.z };
    const hit = world.castRay(
      ray,
      s.desiredDistance + C.collisionPadding,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      (c) => !c.isSensor() && isNotBike(c),
    );
    if (hit) allowed = Math.max(C.minCollisionDistance, hit.timeOfImpact - C.collisionPadding);
    s.distance =
      allowed < s.distance
        ? allowed
        : s.distance + (allowed - s.distance) * damp(C.distanceRecover, dt);

    v.desired.copy(v.target).addScaledVector(v.dir, s.distance);
    v.desired.y = Math.max(v.desired.y, groundHeight(v.desired.x, v.desired.z) + C.groundClearance);

    if (!s.initialised) {
      camera.position.copy(v.desired);
      s.initialised = true;
    } else {
      camera.position.lerp(v.desired, damp(C.positionFollow, dt));
    }

    const lead = t.speed * C.lookAhead;
    v.lookAt.set(
      t.x + Math.sin(t.heading) * lead,
      t.y + C.targetHeight - 0.1,
      t.z + Math.cos(t.heading) * lead,
    );
    camera.lookAt(v.lookAt);

    if (camera instanceof PerspectiveCamera) {
      const fov = C.baseFov + C.speedFov * clamp(t.speed / BIKE_CONFIG.maxSpeed, 0, 1);
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov += (fov - camera.fov) * damp(3, dt);
        camera.updateProjectionMatrix();
      }
    }
  }, FRAME_ORDER.camera);

  return null;
}
