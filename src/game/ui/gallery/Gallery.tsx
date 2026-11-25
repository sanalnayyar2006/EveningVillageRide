"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Kbd } from "@/components/Kbd";
import { useGalleryStore } from "@/store/galleryStore";
import { usePlayerStore } from "@/store/playerStore";
import { formatTaken } from "./photoFormat";
import { PhotoViewer } from "./PhotoViewer";

/** The photo album. The ride is paused while it is open. */
export function Gallery() {
  const open = usePlayerStore((s) => s.state === "viewingGallery");
  const photos = useGalleryStore((s) => s.photos);
  const remove = useGalleryStore((s) => s.remove);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const index = photos.findIndex((p) => p.id === selectedId);
  const selected = index >= 0 ? photos[index] : null;
  const step = (by: number) => {
    if (photos.length === 0) return;
    setSelectedId(photos[(index + by + photos.length) % photos.length]!.id);
  };
  const close = () => usePlayerStore.getState().transition("cycling");

  const deleteSelected = () => {
    if (!selected) return;
    // Move on to the next photo, or back to the grid after the last one.
    const next = photos[index + 1] ?? photos[index - 1] ?? null;
    void remove(selected.id);
    setSelectedId(next?.id ?? null);
  };

  useEffect(() => {
    if (!open) setSelectedId(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        if (selected) setSelectedId(null);
        else close();
      } else if (selected && e.code === "ArrowLeft") step(-1);
      else if (selected && e.code === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          aria-label="Photo album"
          className="absolute inset-0 overflow-hidden bg-dusk-900/85 text-dusk-50 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex h-full flex-col p-8">
            <header className="mb-6 flex items-baseline justify-between">
              <div>
                <h2 className="font-display text-3xl">Album</h2>
                <p className="text-sm text-dusk-100/70">
                  {photos.length === 1 ? "1 photo" : `${photos.length} photos`}
                </p>
              </div>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-dusk-50/25 px-4 py-1.5 text-sm hover:bg-dusk-50/10"
                onClick={close}
              >
                Back to the ride <Kbd>G</Kbd>
              </button>
            </header>

            {photos.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-dusk-100/80">
                <p className="font-display text-xl">No photos yet</p>
                <p className="flex items-center gap-1.5 text-sm">
                  Press <Kbd>C</Kbd> while riding to stop and take out your phone.
                </p>
              </div>
            ) : (
              <ul className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 overflow-y-auto pb-4">
                {photos.map((photo) => (
                  <li key={photo.id}>
                    <button
                      type="button"
                      className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-dusk-200"
                      onClick={() => setSelectedId(photo.id)}
                    >
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.place}
                        className="aspect-video w-full rounded-md object-cover shadow-lg transition-transform group-hover:scale-[1.02]"
                      />
                      <span className="mt-1.5 block text-sm">{photo.place}</span>
                      <span className="block text-xs text-dusk-100/60">
                        {formatTaken(photo.takenAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <AnimatePresence>
            {selected && (
              <PhotoViewer
                photo={selected}
                position={`${index + 1} / ${photos.length}`}
                onPrevious={() => step(-1)}
                onNext={() => step(1)}
                onDelete={deleteSelected}
                onClose={() => setSelectedId(null)}
              />
            )}
          </AnimatePresence>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
