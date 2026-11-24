import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Settings {
  lookSensitivity: number;
  invertY: boolean;
  masterVolume: number;
  sfxVolume: number;
  showHints: boolean;
  shadows: boolean;
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
