"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { saveRide, startNewRide } from "@/game/save/rideSave";
import { usePlayerStore } from "@/store/playerStore";
import { MenuButton } from "./MenuButton";
import { SettingsPanel } from "./SettingsPanel";

const pause = () => {
  saveRide();
  usePlayerStore.getState().transition("paused");
};
const resume = () => usePlayerStore.getState().transition("cycling");

/**
 * Escape pauses the ride (the world stops; see Game.tsx) and opens this menu.
 * Switching to another tab pauses too, so the sun doesn't set while you're away.
 */
export function PauseMenu() {
  const paused = usePlayerStore((s) => s.state === "paused");
  const [view, setView] = useState<"main" | "settings">("main");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The album and photo mode use Escape themselves.
      if (e.code !== "Escape" || e.defaultPrevented) return;
      const { state } = usePlayerStore.getState();
      if (state === "cycling") {
        setView("main");
        pause();
      } else if (state === "paused") {
        if (view === "settings") setView("main");
        else resume();
      }
    };
    const onHidden = () => {
      if (document.hidden && usePlayerStore.getState().state === "cycling") pause();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [view]);

  const restart = () => {
    startNewRide();
    resume();
  };

  return (
    <AnimatePresence>
      {paused && (
        <motion.div
          key="pause"
          className="absolute inset-0 z-40 flex items-center justify-center bg-dusk-900/70 text-dusk-50 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.25 } }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        >
          {view === "settings" ? (
            <SettingsPanel onBack={() => setView("main")} />
          ) : (
            <div className="w-full max-w-xs space-y-3">
              <h2 className="mb-6 font-display text-3xl">Paused</h2>
              <MenuButton primary onClick={resume}>
                Keep riding
              </MenuButton>
              <MenuButton onClick={() => setView("settings")}>Settings</MenuButton>
              <MenuButton onClick={restart} hint="Back to the highway at golden hour">
                Start a new ride
              </MenuButton>
              <p className="pt-4 text-xs text-dusk-100/60">Your ride is saved as you go.</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
