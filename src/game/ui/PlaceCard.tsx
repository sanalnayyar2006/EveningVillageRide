"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { discovered } from "@/game/save/rideSave";
import { landmarkAt, type Landmark } from "@/game/world/data/landmarks";
import { useBikeStore } from "@/store/bikeStore";
import { usePlayerStore } from "@/store/playerStore";

const CHECK_MS = 400;
/** How long the card stays up; a first visit gets longer, to read the line about the place. */
const SHOW_MS = { known: 2800, firstVisit: 5500 };

interface Card {
  landmark: Landmark;
  firstVisit: boolean;
}

/** The name of a place, eased in at the top of the screen as you ride into it. */
export function PlaceCard() {
  const [card, setCard] = useState<Card | null>(null);

  useEffect(() => {
    let current: string | null = null;
    let hideTimer = 0;
    const check = window.setInterval(() => {
      if (usePlayerStore.getState().state !== "cycling") return;
      const { x, z } = useBikeStore.getState().telemetry;
      const landmark = landmarkAt(x, z);
      if (landmark?.id === current) return;
      current = landmark?.id ?? null;
      if (!landmark) return;

      const firstVisit = !discovered.has(landmark.id);
      discovered.add(landmark.id);
      setCard({ landmark, firstVisit });
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(
        () => setCard(null),
        firstVisit ? SHOW_MS.firstVisit : SHOW_MS.known,
      );
    }, CHECK_MS);
    return () => {
      window.clearInterval(check);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          key={card.landmark.id}
          // A soft dark band behind the text: the top of the screen is usually bright sky.
          className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center bg-gradient-to-b from-dusk-900/60 via-dusk-900/25 to-transparent px-4 pt-8 pb-16 text-center text-dusk-50"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 1.2, ease: "easeOut" } }}
          exit={{ opacity: 0, transition: { duration: 1.4 } }}
        >
          <span className="h-px w-16 bg-dusk-200/70" />
          <p className="mt-3 font-display text-3xl">{card.landmark.name}</p>
          {card.firstVisit && (
            <p className="mt-1 max-w-md text-sm text-dusk-100/90">{card.landmark.blurb}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
