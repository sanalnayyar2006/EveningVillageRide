import { create } from "zustand";
import { SPAWN } from "@/game/world/data/layout";
import { heightAt } from "@/game/world/terrain";

/**
 * The bike's state for the current frame. The object is mutated in place every
 * frame so no React component re-renders at 60 fps; read it with
 * `useBikeStore.getState().telemetry` inside useFrame.
 */
export interface BikeTelemetry {
  x: number;
  y: number;
  z: number;
  /** Radians; forward is (sin heading, 0, cos heading). */
  heading: number;
  /** m/s, negative when reversing. */
  speed: number;
  /** Radians, positive = leaning left. */
  lean: number;
  /** Radians, positive = steering left. */
  steer: number;
  /** Radians, positive = nose up (riding uphill). */
  pitch: number;
  wheelAngle: number;
  crankAngle: number;
}

export interface TeleportRequest {
  x: number;
  z: number;
  heading: number;
}

interface BikeStore {
  telemetry: BikeTelemetry;
  /** The one reactive field: only changes when the bike starts or stops. */
  moving: boolean;
  /** Picked up (and cleared) by the bike controller on its next frame. */
  pendingTeleport: TeleportRequest | null;
  /** Increments after each teleport, so the camera knows to cut rather than glide. */
  teleportCount: number;
  setMoving: (moving: boolean) => void;
  /** Place the bike at rest somewhere else, e.g. when loading a save. */
  teleportTo: (x: number, z: number, heading: number) => void;
}

/** On the highway east of the village, riding towards the village gate. */
export const BIKE_SPAWN = SPAWN;

export const useBikeStore = create<BikeStore>()((set, get) => ({
  telemetry: {
    x: BIKE_SPAWN.x,
    y: heightAt(BIKE_SPAWN.x, BIKE_SPAWN.z),
    z: BIKE_SPAWN.z,
    heading: BIKE_SPAWN.heading,
    speed: 0,
    lean: 0,
    steer: 0,
    pitch: 0,
    wheelAngle: 0,
    crankAngle: 0,
  },
  moving: false,
  pendingTeleport: null,
  teleportCount: 0,
  setMoving: (moving) => {
    if (get().moving !== moving) set({ moving });
  },
  teleportTo: (x, z, heading) => set({ pendingTeleport: { x, z, heading } }),
}));
