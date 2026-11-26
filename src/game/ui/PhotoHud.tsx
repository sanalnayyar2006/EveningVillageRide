"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Kbd } from "@/components/Kbd";
import { usePhotoStore } from "@/store/photoStore";
import { useSettingsStore } from "@/store/settingsStore";

/** Matches the 16:9 crop in capture.ts, so what is inside the frame is what gets saved. */
const VIEWFINDER = "aspect-video w-[min(100vw,calc(100vh*16/9))]";

const CORNERS = [
  "left-4 top-4 border-l-2 border-t-2",
  "right-4 top-4 border-r-2 border-t-2",
  "bottom-4 left-4 border-b-2 border-l-2",
  "bottom-4 right-4 border-b-2 border-r-2",
];

const formatFocus = (focus: number | null) => (focus === null ? "∞" : `${focus} m`);

/** White flash, then the photo you just took shrinks away into the corner. */
function ShutterFeedback() {
  const shot = usePhotoStore((s) => s.lastShot);
  return (
    <AnimatePresence>
      {shot && (
        <motion.div key={shot.id} className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
          <motion.img
            src={shot.url}
            alt=""
            className="absolute inset-0 h-full w-full rounded-sm object-cover shadow-2xl ring-4 ring-white"
            initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
            animate={{ scale: 0.18, x: "40%", y: "38%", opacity: [1, 1, 0] }}
            transition={{ delay: 0.25, duration: 1.1, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The phone's camera app, drawn over the 3D view while photo mode is active. */
export function PhotoHud() {
  const { ready, zoom, focus, place } = usePhotoStore((s) => s.hud);
  const showHints = useSettingsStore((s) => s.showHints);

  return (
    <AnimatePresence>
      {ready && (
        <motion.div
          key="photo-hud"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className={`relative ${VIEWFINDER} text-dusk-50 shadow-[0_0_0_100vmax_rgba(20,12,9,0.55)]`}
          >
            {CORNERS.map((corner) => (
              <span key={corner} className={`absolute size-8 border-dusk-50/80 ${corner}`} />
            ))}

            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
              <span className="size-14 rounded-full border border-dusk-50/70" />
              <span className="rounded-full bg-dusk-900/50 px-2 py-0.5 text-[11px] tabular-nums">
                {formatFocus(focus)}
              </span>
            </div>

            <div className="absolute left-8 top-7 font-display text-lg drop-shadow">{place}</div>
            <div className="absolute right-8 top-7 rounded-full bg-dusk-900/50 px-2.5 py-0.5 text-sm tabular-nums">
              {zoom.toFixed(1)}×
            </div>

            {showHints && (
              <div className="absolute inset-x-0 bottom-7 flex justify-center gap-4 text-xs drop-shadow">
                <span className="flex items-center gap-1.5">
                  <Kbd>Click</Kbd> Take photo
                </span>
                <span className="flex items-center gap-1.5">
                  <Kbd>Drag</Kbd> Look
                </span>
                <span className="flex items-center gap-1.5">
                  <Kbd>Scroll</Kbd> Zoom
                </span>
                <span className="flex items-center gap-1.5">
                  <Kbd>Esc</Kbd> Put phone away
                </span>
              </div>
            )}

            <ShutterFeedback />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
