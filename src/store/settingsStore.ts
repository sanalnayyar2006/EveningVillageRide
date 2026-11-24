import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Settings {
  lookSensitivity: number;
  invertY: boolean;
  masterVolume: number;
  ambientVolume: number;
  sfxVolume: number;
  showGrid: boolean;
  showHints: boolean;
  shadows: boolean;
}

interface SettingsStore extends Settings {
  update: (patch: Partial<Settings>) => void;
  restoreDefaults: () => void;
}

export const DEFAULT_SETTINGS: Settings = {
  lookSensitivity: 1,
  invertY: false,
  masterVolume: 0.8,
  ambientVolume: 0.8,
  sfxVolume: 0.9,
  showGrid: false,
  showHints: true,
  shadows: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
      restoreDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "evr:settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
