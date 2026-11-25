"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import { useMemo } from "react";
import { Matrix4, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { FRAME_ORDER } from "@/game/core/frameOrder";
import { input } from "@/game/core/input/InputManager";
import { firstPersonBlend, PHOTO_CONFIG as CFG } from "@/game/photography/photoConfig";
import { groundHeight } from "@/game/world/groundQueries";
import { useBikeStore } from "@/store/bikeStore";
import { usePhotoStore, type PhotoRig } from "@/store/photoStore";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { clamp } from "@/utils/math";
import { castCameraRay } from "./cameraRay";

const UP = new Vector3(0, 1, 0);
/** Step (m) used to find where the view ray meets the ground. */
const GROUND_STEP = 0.75;

function applyLookInput(rig: PhotoRig) {
  const { dx, dy } = input.consumeLook();
  const wheel = input.consumeWheel();
  const { lookSensitivity, invertY } = useSettingsStore.getState();
  const radiansPerPixel = CFG.lookSensitivity * lookSensitivity;

  // Drag right to look right, drag up to look up.
  rig.yaw = clamp(rig.yaw - dx * radiansPerPixel, -CFG.yawLimit, CFG.yawLimit);
  rig.pitch = clamp(
    rig.pitch - dy * radiansPerPixel * (invertY ? -1 : 1),
    -CFG.pitchLimit,
    CFG.pitchLimit,
  );
  // Scroll up (negative wheel) zooms in.
  rig.fov = clamp(rig.fov + wheel * CFG.fov.wheelStep, CFG.fov.min, CFG.fov.max);
}

/** First distance at which the ray dips below the terrain, or null. */
function groundHitDistance(from: Vector3, direction: Vector3, maxDistance: number): number | null {
  for (let d = GROUND_STEP; d <= maxDistance; d += GROUND_STEP) {
    const x = from.x + direction.x * d;
    const z = from.z + direction.z * d;
    if (from.y + direction.y * d < groundHeight(x, z)) return d;
  }
  return null;
}

/**
 * The phone camera. Blends from wherever the ride camera put the view into
 * the rider's eyes as the phone comes up, then looks, zooms and measures focus.
 */
export function PhotoCamera() {
  const camera = useThree((state) => state.camera);
  const { world, rapier } = useRapier();
  const ray = useMemo(() => new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }), [rapier]);
  const tmp = useMemo(
    () => ({
      eye: new Vector3(),
      direction: new Vector3(),
      target: new Vector3(),
      look: new Matrix4(),
      firstPerson: new Quaternion(),
    }),
    [],
  );

  useFrame(() => {
    const state = usePlayerStore.getState().state;
    const { rig, hud, setHud } = usePhotoStore.getState();
    if (state === "cycling") return;

    if (state === "takingPhoto" && hud.ready) applyLookInput(rig);
    else {
      // Nobody is steering the view (album open, phone moving): drop stray input.
      input.consumeLook();
      input.consumeWheel();
    }

    const blend = firstPersonBlend(rig.raise);
    if (blend === 0) return;

    const bike = useBikeStore.getState().telemetry;
    const yaw = bike.heading + rig.yaw;
    tmp.eye.set(
      bike.x + Math.sin(bike.heading) * CFG.eye.forward,
      bike.y + CFG.eye.height,
      bike.z + Math.cos(bike.heading) * CFG.eye.forward,
    );
    tmp.direction.set(
      Math.sin(yaw) * Math.cos(rig.pitch),
      Math.sin(rig.pitch),
      Math.cos(yaw) * Math.cos(rig.pitch),
    );
    tmp.target.copy(tmp.eye).add(tmp.direction);
    tmp.firstPerson.setFromRotationMatrix(tmp.look.lookAt(tmp.eye, tmp.target, UP));

    // The ride camera has already placed `camera` this frame; ease from there.
    camera.position.lerp(tmp.eye, blend);
    camera.quaternion.slerp(tmp.firstPerson, blend);
    if (camera instanceof PerspectiveCamera) {
      camera.fov += (rig.fov - camera.fov) * blend;
      camera.updateProjectionMatrix();
    }

    if (!hud.ready) return;
    const hit = castCameraRay(world, ray, tmp.eye, tmp.direction, CFG.focusRange);
    const ground = groundHitDistance(tmp.eye, tmp.direction, hit ?? CFG.focusRange);
    const focus = ground ?? hit;
    setHud({
      zoom: Math.round((CFG.fov.default / rig.fov) * 10) / 10,
      // Rounded so the HUD only re-renders when the number shown changes.
      focus: focus === null ? null : focus < 10 ? Math.round(focus * 2) / 2 : Math.round(focus),
    });
  }, FRAME_ORDER.photoCamera);

  return null;
}
