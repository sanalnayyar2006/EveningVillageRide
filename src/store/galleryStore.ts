import { create } from "zustand";
import { photoDb, type PhotoRecord } from "@/game/photography/photoDb";

export interface GalleryPhoto extends PhotoRecord {
  /** Object URL for the thumbnail, alive for as long as the photo is in the album. */
  thumbnailUrl: string;
}

interface GalleryStore {
  photos: GalleryPhoto[];
  loaded: boolean;
  /** Read the album from IndexedDB. Safe to call more than once. */
  load: () => Promise<void>;
  add: (photo: PhotoRecord) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const withUrl = (photo: PhotoRecord): GalleryPhoto => ({
  ...photo,
  thumbnailUrl: URL.createObjectURL(photo.thumbnail),
});

const newestFirst = (a: PhotoRecord, b: PhotoRecord) => b.takenAt.localeCompare(a.takenAt);

export const useGalleryStore = create<GalleryStore>()((set, get) => ({
  photos: [],
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    try {
      const records = await photoDb.all();
      set({ photos: records.sort(newestFirst).map(withUrl), loaded: true });
    } catch (error) {
      // Private browsing can block IndexedDB; the album then lives for this session only.
      console.warn("[gallery] could not load saved photos", error);
      set({ loaded: true });
    }
  },
  add: async (photo) => {
    set((s) => ({ photos: [withUrl(photo), ...s.photos] }));
    try {
      await photoDb.put(photo);
    } catch (error) {
      console.warn("[gallery] photo kept for this session only, saving failed", error);
    }
  },
  remove: async (id) => {
    const photo = get().photos.find((p) => p.id === id);
    if (!photo) return;
    set((s) => ({ photos: s.photos.filter((p) => p.id !== id) }));
    URL.revokeObjectURL(photo.thumbnailUrl);
    await photoDb.delete(id).catch((error: unknown) => {
      console.warn("[gallery] could not delete saved photo", error);
    });
  },
}));
