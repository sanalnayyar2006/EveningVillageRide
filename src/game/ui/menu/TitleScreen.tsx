"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { loadRide, resumeRide, startNewRide, type RideSave } from "@/game/save/rideSave";
import { DEFAULT_PLACE, landmarkAt } from "@/game/world/data/landmarks";
import { useGameStore } from "@/store/gameStore";
import { MenuButton } from "./MenuButton";
import { SettingsPanel } from "./SettingsPanel";

/** "the Temple, at sunset": where and when a saved ride left off. */
function describeRide(ride: RideSave): string {
  const place = landmarkAt(ride.x, ride.z)?.name ?? DEFAULT_PLACE;
  const light =
    ride.dayProgress < 0.35 ? "golden hour" : ride.dayProgress < 0.75 ? "sunset" : "dusk";
  return `${place}, at ${light}`;
}

/** The first thing you see once the village has loaded, with the scene softly behind it. */
export function TitleScreen() {
  const visible = useGameStore((s) => s.phase === "title");
  const setPhase = useGameStore((s) => s.setPhase);
  const [view, setView] = useState<"main" | "settings">("main");
  // Read once on mount: the save only changes while riding, after this screen has gone.
  const [saved] = useState(loadRide);

  const begin = (resume: boolean) => {
    if (resume && saved) resumeRide(saved);
    else startNewRide();
    setPhase("playing");
  };

  useEffect(() => {
    if (!visible || view !== "main") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Enter") begin(saved !== null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="title"
          className="absolute inset-0 z-40 flex items-center bg-gradient-to-r from-dusk-900/90 via-dusk-900/55 to-transparent px-16 text-dusk-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 1.2 } }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
        >
          {view === "settings" ? (
            <SettingsPanel onBack={() => setView("main")} />
          ) : (
            <div className="w-full max-w-sm">
              <h1 className="font-display text-5xl leading-tight">Evening Village Ride</h1>
              <p className="mt-3 text-dusk-100/80">
                A slow bicycle ride through a Kangra village as the sun goes down. Take your time,
                and take a few photos.
              </p>
              <div className="mt-10 space-y-3">
                {saved && (
                  <MenuButton primary onClick={() => begin(true)} hint={describeRide(saved)}>
                    Continue the ride
                  </MenuButton>
                )}
                <MenuButton primary={!saved} onClick={() => begin(false)}>
                  {saved ? "Start a new ride" : "Start riding"}
                </MenuButton>
                <MenuButton onClick={() => setView("settings")}>Settings</MenuButton>
              </div>
              <p className="mt-8 text-xs text-dusk-100/60">Press Enter to start</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
