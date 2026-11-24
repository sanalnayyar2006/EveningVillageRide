import { create } from "zustand";

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
  wheelAngle: number;
  crankAngle: number;
}

interface BikeStore {
  telemetry: BikeTelemetry;
  /** The one reactive field: only changes when the bike starts or stops. */
  moving: boolean;
  setMoving: (moving: boolean) => void;
}

export const BIKE_SPAWN = { x: 0, z: 0, heading: Math.PI } as const;

export const useBikeStore = create<BikeStore>()((set, get) => ({
  telemetry: {
    x: BIKE_SPAWN.x,
    y: 0,
    z: BIKE_SPAWN.z,
    heading: BIKE_SPAWN.heading,
    speed: 0,
    lean: 0,
    steer: 0,
    wheelAngle: 0,
    crankAngle: 0,
  },
  moving: false,
  setMoving: (moving) => {
    if (get().moving !== moving) set({ moving });
  },
}));
