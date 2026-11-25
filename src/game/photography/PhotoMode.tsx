"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { events } from "@/game/core/events";
import { FRAME_ORDER, MAX_DT } from "@/game/core/frameOrder";
import { input } from "@/game/core/input/InputManager";
import { landmarkAt } from "@/game/world/data/landmarks";
import { useBikeStore } from "@/store/bikeStore";
import { useGalleryStore } from "@/store/galleryStore";
import { usePhotoStore } from "@/store/photoStore";
import { usePlayerStore } from "@/store/playerStore";
import { approach } from "@/utils/math";
import { capturePhoto } from "./capture";
import { PHOTO_CONFIG } from "./photoConfig";

const DEFAULT_PLACE = "Village Lanes";

/**
 * The phone flow (GameplaySystem.md §4):
 * C → bike brakes to a stop → phone comes out → photo mode → Esc/C → phone away → ride on.
 * Also opens and closes the album with G while riding.
 */
export function PhotoMode() {
  const busy = useRef(false);

  useFrame((_, frameDelta) => {
    const dt = Math.min(frameDelta, MAX_DT);
    const { state, transition } = usePlayerStore.getState();
    const photo = usePhotoStore.getState();
    const { rig } = photo;
    const bike = useBikeStore.getState().telemetry;

    switch (state) {
      case "cycling":
        if (input.wasPressed("phone")) transition("stopping");
        else if (input.wasPressed("gallery")) transition("viewingGallery");
        break;

      case "stopping":
        if (input.wasPressed("phone") || input.wasPressed("exit")) {
          transition("cycling");
        } else if (Math.abs(bike.speed) < PHOTO_CONFIG.stoppedSpeed) {
          photo.resetRig();
          photo.setHud({ place: landmarkAt(bike.x, bike.z)?.name ?? DEFAULT_PLACE });
          transition("takingPhoto");
        }
        break;

      case "takingPhoto": {
        if (
          !rig.closing &&
          rig.raise === 1 &&
          (input.wasPressed("phone") || input.wasPressed("exit"))
        ) {
          rig.closing = true;
        }
        const seconds = rig.closing ? PHOTO_CONFIG.lowerSeconds : PHOTO_CONFIG.raiseSeconds;
        rig.raise = approach(rig.raise, rig.closing ? 0 : 1, dt / seconds);
        photo.setHud({ ready: rig.raise === 1 && !rig.closing });
        if (rig.closing && rig.raise === 0) transition("cycling");
        break;
      }

      case "viewingGallery":
        if (input.wasPressed("gallery")) transition("cycling");
        break;
    }
  }, FRAME_ORDER.player);

  // The shutter runs after the cameras, so the photo matches what is on screen.
  useFrame(({ gl, scene, camera }) => {
    const { hud } = usePhotoStore.getState();
    const shutter = input.wasClicked() || input.wasPressed("shutter");
    if (!hud.ready || !shutter || busy.current) return;

    busy.current = true;
    const bike = useBikeStore.getState().telemetry;
    const { rig, setLastShot } = usePhotoStore.getState();
    const id = crypto.randomUUID();
    const landmark = landmarkAt(bike.x, bike.z);
    events.emit("photo:taken", { id });

    capturePhoto(gl, scene, camera)
      .then(async (shot) => {
        setLastShot({ id, url: URL.createObjectURL(shot.image) });
        await useGalleryStore.getState().add({
          id,
          takenAt: new Date().toISOString(),
          position: [bike.x, bike.y, bike.z],
          heading: bike.heading + rig.yaw,
          landmarkId: landmark?.id ?? null,
          place: landmark?.name ?? DEFAULT_PLACE,
          ...shot,
        });
      })
      .catch((error: unknown) => console.error("[photo] capture failed", error))
      .finally(() => {
        busy.current = false;
      });
  }, FRAME_ORDER.photoCapture);

  return null;
}
