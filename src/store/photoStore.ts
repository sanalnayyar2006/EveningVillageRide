import { create } from "zustand";
import { PHOTO_CONFIG } from "@/game/photography/photoConfig";

/** Photo mode's per-frame state, mutated in place like the bike telemetry. */
export interface PhotoRig {
  /** 0 = phone in pocket, 1 = held up to frame a shot. */
  raise: number;
  /** True once the player asked to put the phone away. */
  closing: boolean;
  /** Head turn relative to the bike's heading; positive = left. */
  yaw: number;
  /** Positive = looking up. */
  pitch: number;
  fov: number;
}

/** What the photo-mode HUD shows. Only updated when a displayed value changes. */
export interface PhotoHud {
  /** True while the phone is fully raised and the camera app is open. */
  ready: boolean;
  zoom: number;
  /** Metres to whatever is in the centre of the frame, or null for "far away". */
  focus: number | null;
  /** Landmark name the photo will be tagged with. */
  place: string;
}

/** The last shot taken, for the flash and freeze-frame effect. */
export interface LastShot {
  id: string;
  url: string;
}

interface PhotoStore {
  rig: PhotoRig;
  hud: PhotoHud;
  lastShot: LastShot | null;
  /** Put the head back to straight ahead with the default lens. */
  resetRig: () => void;
  setHud: (patch: Partial<PhotoHud>) => void;
  setLastShot: (shot: LastShot | null) => void;
}

export const usePhotoStore = create<PhotoStore>()((set, get) => ({
  rig: { raise: 0, closing: false, yaw: 0, pitch: 0, fov: PHOTO_CONFIG.fov.default },
  hud: { ready: false, zoom: 1, focus: null, place: "" },
  lastShot: null,
  resetRig: () =>
    Object.assign(get().rig, {
      closing: false,
      yaw: 0,
      pitch: 0,
      fov: PHOTO_CONFIG.fov.default,
    }),
  setHud: (patch) => {
    const hud = get().hud;
    const changed = (Object.keys(patch) as (keyof PhotoHud)[]).some((k) => hud[k] !== patch[k]);
    if (changed) set({ hud: { ...hud, ...patch } });
  },
  setLastShot: (lastShot) => {
    const previous = get().lastShot;
    if (previous) URL.revokeObjectURL(previous.url);
    set({ lastShot });
  },
}));
