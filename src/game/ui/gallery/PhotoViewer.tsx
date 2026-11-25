"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Kbd } from "@/components/Kbd";
import type { GalleryPhoto } from "@/store/galleryStore";
import { downloadName, formatTaken } from "./photoFormat";

interface PhotoViewerProps {
  photo: GalleryPhoto;
  position: string;
  onPrevious: () => void;
  onNext: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const BUTTON =
  "rounded-full border border-dusk-50/25 px-4 py-1.5 text-sm transition-colors hover:bg-dusk-50/10 focus-visible:outline-2 focus-visible:outline-dusk-200";

/** One photo, full size, with download and delete. */
export function PhotoViewer({
  photo,
  position,
  onPrevious,
  onNext,
  onDelete,
  onClose,
}: PhotoViewerProps) {
  const [confirming, setConfirming] = useState(false);
  const imageUrl = useMemo(() => URL.createObjectURL(photo.image), [photo.image]);
  useEffect(() => () => URL.revokeObjectURL(imageUrl), [imageUrl]);
  // A delete confirmation never carries over to the next photo.
  useEffect(() => setConfirming(false), [photo.id]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col bg-dusk-900/95 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <button type="button" className={BUTTON} onClick={onClose}>
          ← Album
        </button>
        <span className="text-sm text-dusk-100/70 tabular-nums">{position}</span>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center gap-4 py-4">
        <button type="button" className={BUTTON} onClick={onPrevious} aria-label="Previous photo">
          ‹
        </button>
        <img
          src={imageUrl}
          alt={`${photo.place}, ${formatTaken(photo.takenAt)}`}
          className="max-h-full min-w-0 rounded-md object-contain shadow-2xl"
        />
        <button type="button" className={BUTTON} onClick={onNext} aria-label="Next photo">
          ›
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-xl">{photo.place}</p>
          <p className="text-sm text-dusk-100/70">{formatTaken(photo.takenAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <a className={BUTTON} href={imageUrl} download={downloadName(photo)}>
            Download
          </a>
          {confirming ? (
            <>
              <button type="button" className={BUTTON} onClick={() => setConfirming(false)}>
                Keep it
              </button>
              <button
                type="button"
                className={`${BUTTON} border-dusk-400 bg-dusk-600/70 hover:bg-dusk-600`}
                onClick={onDelete}
              >
                Delete photo
              </button>
            </>
          ) : (
            <button type="button" className={BUTTON} onClick={() => setConfirming(true)}>
              Delete
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-dusk-100/50">
        <Kbd>←</Kbd>
        <Kbd>→</Kbd> Browse <Kbd>Esc</Kbd> Back
      </p>
    </motion.div>
  );
}
