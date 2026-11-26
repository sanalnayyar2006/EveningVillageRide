"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import { useMemo, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { BIKE_CONFIG } from "@/game/bike/bikeConfig";
import { FRAME_ORDER, MAX_DT } from "@/game/core/frameOrder";
import { input } from "@/game/core/input/InputManager";
import { groundHeight } from "@/game/world/groundQueries";
import { useBikeStore, type BikeTelemetry } from "@/store/bikeStore";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { angleDelta, clamp, damp } from "@/utils/math";
import { RIDE_CAMERA as CAM } from "./cameraConfig";
import { castCameraRay, type RapierRay, type RapierWorld } from "./cameraRay";

interface Orbit {
  /** Where the camera currently sits around the bike (lags behind `heading + yawOffset`). */
  yaw: number;
  /** How far the player has dragged the view away from straight behind. */
  yawOffset: number;
  pitch: number;
  /** Distance the player chose with the scroll wheel. */
  preferredDistance: number;
  /** Actual distance this frame, shortened when scenery is in the way. */
  distance: number;
}

function applyLookInput(orbit: Orbit) {
  const { dx, dy } = input.consumeLook();
  const wheel = input.consumeWheel();
  const { lookSensitivity, invertY } = useSettingsStore.getState();
  const radiansPerPixel = CAM.dragSensitivity * lookSensitivity;

  orbit.yawOffset -= dx * radiansPerPixel;
  orbit.pitch = clamp(
    orbit.pitch + dy * radiansPerPixel * (invertY ? -1 : 1),
    CAM.pitch.min,
    CAM.pitch.max,
  );
  orbit.preferredDistance = clamp(
    orbit.preferredDistance + wheel * CAM.distance.wheelStep,
    CAM.distance.min,
    CAM.distance.max,
  );
}

/** Drift back behind the rider once they stop looking around. */
function recenter(orbit: Orbit, bike: BikeTelemetry, dt: number) {
  const idle = !input.isDragging && input.msSinceLook() > CAM.recenterDelayMs;
  if (!idle || Math.abs(bike.speed) < CAM.recenterMinSpeed) return;
  orbit.yawOffset += angleDelta(orbit.yawOffset, 0) * damp(CAM.recenterRate, dt);
  orbit.pitch += (CAM.pitch.default - orbit.pitch) * damp(CAM.recenterRate * 0.6, dt);
}

/** How far the camera can sit along `direction` before scenery blocks the view. */
function unobstructedDistance(
  world: RapierWorld,
  ray: RapierRay,
  from: Vector3,
  direction: Vector3,
  wanted: number,
): number {
  const hit = castCameraRay(world, ray, from, direction, wanted + CAM.collisionPadding);
  if (hit === null) return wanted;
  return Math.max(CAM.minCollisionDistance, hit - CAM.collisionPadding);
}

/**
 * Third-person follow camera. It lags behind turns, orbits on mouse drag,
 * zooms with the wheel, recenters by itself and never clips into scenery.
 */
export function RideCamera() {
  const camera = useThree((state) => state.camera);
  const { world, rapier } = useRapier();
  const orbit = useRef<Orbit | null>(null);
  const seenTeleports = useRef(0);
  // The camera's own smoothed pose. Kept separate from `camera` because the
  // photo camera may blend over it later in the frame.
  const smoothed = useMemo(() => ({ position: new Vector3(), fov: CAM.baseFov }), []);
  const ray = useMemo(() => new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }), [rapier]);
  const vec = useMemo(
    () => ({
      pivot: new Vector3(),
      direction: new Vector3(),
      position: new Vector3(),
      lookAt: new Vector3(),
    }),
    [],
  );

  useFrame((_, frameDelta) => {
    const dt = Math.min(frameDelta, MAX_DT);
    const { telemetry: bike, teleportCount } = useBikeStore.getState();
    // After a teleport, start over behind the bike instead of gliding across the map.
    if (teleportCount !== seenTeleports.current) {
      seenTeleports.current = teleportCount;
      orbit.current = null;
    }
    const firstFrame = orbit.current === null;
    orbit.current ??= {
      yaw: bike.heading,
      yawOffset: 0,
      pitch: CAM.pitch.default,
      preferredDistance: CAM.distance.default,
      distance: CAM.distance.default,
    };
    const view = orbit.current;

    // Off the bike (phone out, album open) the look input belongs to someone else.
    if (usePlayerStore.getState().state === "cycling") applyLookInput(view);
    recenter(view, bike, dt);

    // The orbit trails the bike's heading; this lag is what makes turns feel smooth.
    const targetYaw = bike.heading + view.yawOffset;
    const follow = input.isDragging ? CAM.dragYawFollow : CAM.yawFollow;
    view.yaw += angleDelta(view.yaw, targetYaw) * damp(follow, dt);

    vec.pivot.set(bike.x, bike.y + CAM.targetHeight, bike.z);
    vec.direction.set(
      -Math.sin(view.yaw) * Math.cos(view.pitch),
      Math.sin(view.pitch),
      -Math.cos(view.yaw) * Math.cos(view.pitch),
    );

    // Snap in immediately when blocked, ease back out afterwards.
    const allowed = unobstructedDistance(
      world,
      ray,
      vec.pivot,
      vec.direction,
      view.preferredDistance,
    );
    view.distance =
      allowed < view.distance
        ? allowed
        : view.distance + (allowed - view.distance) * damp(CAM.distanceRecover, dt);

    vec.position.copy(vec.pivot).addScaledVector(vec.direction, view.distance);
    vec.position.y = Math.max(
      vec.position.y,
      groundHeight(vec.position.x, vec.position.z) + CAM.groundClearance,
    );
    if (firstFrame) smoothed.position.copy(vec.position);
    else smoothed.position.lerp(vec.position, damp(CAM.positionFollow, dt));
    camera.position.copy(smoothed.position);

    const lead = bike.speed * CAM.lookAhead;
    vec.lookAt.set(
      bike.x + Math.sin(bike.heading) * lead,
      bike.y + CAM.lookHeight,
      bike.z + Math.cos(bike.heading) * lead,
    );
    camera.lookAt(vec.lookAt);

    const speedRatio = clamp(bike.speed / BIKE_CONFIG.maxSpeed, 0, 1);
    const fov = CAM.baseFov + CAM.speedFov * speedRatio;
    smoothed.fov += (fov - smoothed.fov) * damp(CAM.fovResponse, dt);
    if (camera instanceof PerspectiveCamera && Math.abs(camera.fov - smoothed.fov) > 0.001) {
      camera.fov = smoothed.fov;
      camera.updateProjectionMatrix();
    }
  }, FRAME_ORDER.camera);

  return null;
}
