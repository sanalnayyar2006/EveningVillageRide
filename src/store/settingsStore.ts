import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Settings {
  lookSensitivity: number;
  invertY: boolean;
  masterVolume: number;
  sfxVolume: number;
  showHints: boolean;
  shadows: boolean;
  /** Bloom, colour grade and vignette. */
  effects: boolean;
  /** Sharper image and shadows; off for slower computers (see core/quality). */
  highQuality: boolean;
}

interface SettingsStore extends Settings {
  update: (patch: Partial<Settings>) => void;
}

const DEFAULT_SETTINGS: Settings = {
  lookSensitivity: 1,
  invertY: false,
  masterVolume: 0.8,
  sfxVolume: 0.9,
  showHints: true,
  shadows: true,
  effects: true,
  highQuality: true,
};

/** Player preferences, saved to localStorage. */
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
    }),
    { name: "evr:settings", version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);
