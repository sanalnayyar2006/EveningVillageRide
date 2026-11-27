import { ambient } from "@/game/ambient/ambientState";
import { SPAWN } from "@/game/world/data/layout";
import { useBikeStore } from "@/store/bikeStore";

/**
 * The ride in progress, kept in localStorage so closing the tab doesn't lose
 * your place: where the bike is, how far the sun has set, and which places
 * you've already found. Photos are saved separately (photoDb).
 */
export interface RideSave {
  x: number;
  z: number;
  heading: number;
  dayProgress: number;
  discovered: string[];
  savedAt: string;
}

const KEY = "evr:ride";
const VERSION = 1;

/** Places found on this ride; shared with the place cards. */
export const discovered = new Set<string>();

function isRideSave(value: unknown): value is RideSave {
  const v = value as Partial<RideSave> | null;
  return (
    typeof v?.x === "number" &&
    typeof v.z === "number" &&
    typeof v.heading === "number" &&
    typeof v.dayProgress === "number" &&
    Array.isArray(v.discovered) &&
    typeof v.savedAt === "string"
  );
}

export function loadRide(): RideSave | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: number; ride?: unknown };
    return parsed.version === VERSION && isRideSave(parsed.ride) ? parsed.ride : null;
  } catch {
    return null;
  }
}

export function saveRide(): void {
  const bike = useBikeStore.getState().telemetry;
  const ride: RideSave = {
    x: bike.x,
    z: bike.z,
    heading: bike.heading,
    dayProgress: ambient.dayProgress,
    discovered: [...discovered],
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, ride }));
  } catch (error) {
    // Private browsing or a full quota: the ride simply won't resume next time.
    console.warn("[save] could not save the ride", error);
  }
}

/** Put the world back where a saved ride left off. */
export function resumeRide(ride: RideSave): void {
  ambient.dayProgress = ride.dayProgress;
  discovered.clear();
  for (const id of ride.discovered) discovered.add(id);
  useBikeStore.getState().teleportTo(ride.x, ride.z, ride.heading);
}

/** Start again from the highway at golden hour. */
export function startNewRide(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing saved, or storage unavailable: either way there's nothing to clear.
  }
  ambient.dayProgress = 0;
  discovered.clear();
  useBikeStore.getState().teleportTo(SPAWN.x, SPAWN.z, SPAWN.heading);
}
