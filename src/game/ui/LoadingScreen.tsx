"use client";

import { AnimatePresence, motion } from "framer-motion";

export function LoadingScreen({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-dusk-900"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.2, ease: "easeOut" } }}
        >
          <p className="font-display text-3xl text-dusk-100">Evening Village Ride</p>
          <motion.span
            className="mt-6 h-px w-40 origin-left bg-dusk-400"
            animate={{ scaleX: [0, 1, 0], originX: [0, 0, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
