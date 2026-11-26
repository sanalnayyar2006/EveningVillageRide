import type { PhotoRecord } from "@/game/photography/photoDb";

const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

/** "24 Nov · 6:42 pm" */
export function formatTaken(takenAt: string): string {
  const date = new Date(takenAt);
  return `${dateFormat.format(date)} · ${timeFormat.format(date)}`;
}

/** e.g. "evening-ride-2026-11-24-1842-lotus-pond.jpg" */
export function downloadName(photo: PhotoRecord): string {
  const stamp = photo.takenAt.slice(0, 16).replace("T", "-").replace(":", "");
  const place = photo.place
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `evening-ride-${stamp}-${place}.jpg`;
}
