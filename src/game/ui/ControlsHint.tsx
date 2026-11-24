"use client";

import { motion } from "framer-motion";
import { Kbd } from "@/components/Kbd";
import { useBikeStore } from "@/store/bikeStore";
import { useSettingsStore } from "@/store/settingsStore";

const RIDE_CONTROLS: { keys: string[]; label: string }[] = [
  { keys: ["W"], label: "Pedal" },
  { keys: ["A", "D"], label: "Steer" },
  { keys: ["S"], label: "Slow down · reverse" },
  { keys: ["Space"], label: "Brake" },
  { keys: ["B"], label: "Bell" },
  { keys: ["Drag"], label: "Look around" },
  { keys: ["Scroll"], label: "Camera distance" },
];

/** Unobtrusive controls list; fades back while riding so the view stays clear. */
export function ControlsHint() {
  const moving = useBikeStore((s) => s.moving);
  const show = useSettingsStore((s) => s.showHints);
  if (!show) return null;

  return (
    <motion.ul
      className="pointer-events-none absolute bottom-6 left-6 space-y-1.5 text-xs text-dusk-50/90 drop-shadow"
      animate={{ opacity: moving ? 0.25 : 0.95 }}
      transition={{ duration: moving ? 1.6 : 0.6 }}
    >
      {RIDE_CONTROLS.map(({ keys, label }) => (
        <li key={label} className="flex items-center gap-2">
          <span className="flex gap-1">
            {keys.map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
          </span>
          <span>{label}</span>
        </li>
      ))}
    </motion.ul>
  );
}
