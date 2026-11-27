"use client";

import { useId } from "react";
import { useSettingsStore, type Settings } from "@/store/settingsStore";
import { MenuButton } from "./MenuButton";

type NumberSetting = {
  [K in keyof Settings]: Settings[K] extends number ? K : never;
}[keyof Settings];
type ToggleSetting = {
  [K in keyof Settings]: Settings[K] extends boolean ? K : never;
}[keyof Settings];

const SLIDERS: { key: NumberSetting; label: string; min: number; max: number; step: number }[] = [
  { key: "masterVolume", label: "Volume", min: 0, max: 1, step: 0.05 },
  { key: "sfxVolume", label: "Sounds of the village", min: 0, max: 1, step: 0.05 },
  { key: "lookSensitivity", label: "Look speed", min: 0.3, max: 2.5, step: 0.1 },
];

const TOGGLES: { key: ToggleSetting; label: string; hint: string }[] = [
  { key: "invertY", label: "Invert look", hint: "Drag down to look up" },
  { key: "highQuality", label: "High quality", hint: "Sharper image and shadows" },
  { key: "shadows", label: "Shadows", hint: "Turn off on slower computers" },
  { key: "effects", label: "Glow and colour", hint: "Bloom, colour grade and vignette" },
  { key: "showHints", label: "Show controls", hint: "The key list in the corner" },
];

function Slider({ setting }: { setting: (typeof SLIDERS)[number] }) {
  const id = useId();
  const value = useSettingsStore((s) => s[setting.key]);
  const update = useSettingsStore((s) => s.update);
  return (
    <div className="flex items-center justify-between gap-6">
      <label htmlFor={id} className="text-sm">
        {setting.label}
      </label>
      <input
        id={id}
        type="range"
        min={setting.min}
        max={setting.max}
        step={setting.step}
        value={value}
        onChange={(e) => update({ [setting.key]: Number(e.target.value) })}
        className="w-44 accent-dusk-400"
      />
    </div>
  );
}

function Toggle({ setting }: { setting: (typeof TOGGLES)[number] }) {
  const on = useSettingsStore((s) => s[setting.key]);
  const update = useSettingsStore((s) => s.update);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => update({ [setting.key]: !on })}
      className="flex w-full items-center justify-between gap-6 rounded-md py-1 text-left focus-visible:outline-2 focus-visible:outline-dusk-200"
    >
      <span>
        <span className="block text-sm">{setting.label}</span>
        <span className="block text-xs text-dusk-100/60">{setting.hint}</span>
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-dusk-400" : "bg-dusk-50/20"}`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-dusk-50 transition-transform ${on ? "translate-x-4.5" : "translate-x-0.5"}`}
        />
      </span>
    </button>
  );
}

/** Sound, looking and graphics options. Saved as you change them. */
export function SettingsPanel({ onBack }: { onBack: () => void }) {
  return (
    <div className="w-full max-w-sm space-y-6">
      <h2 className="font-display text-3xl">Settings</h2>
      <div className="space-y-4">
        {SLIDERS.map((setting) => (
          <Slider key={setting.key} setting={setting} />
        ))}
      </div>
      <div className="space-y-2 border-t border-dusk-50/15 pt-4">
        {TOGGLES.map((setting) => (
          <Toggle key={setting.key} setting={setting} />
        ))}
      </div>
      <MenuButton onClick={onBack}>Back</MenuButton>
    </div>
  );
}
