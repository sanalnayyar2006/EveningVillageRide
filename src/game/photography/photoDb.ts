import type { Vec3Tuple } from "@/types/game";

/** Everything stored about one photo (GameplaySystem.md §5, Metadata). */
export interface PhotoRecord {
  id: string;
  /** ISO timestamp; the date and time are both read from this. */
  takenAt: string;
  position: Vec3Tuple;
  /** Direction the camera faced, in radians. */
  heading: number;
  landmarkId: string | null;
  /** Display name at the time the photo was taken, e.g. "Lotus Pond". */
  place: string;
  width: number;
  height: number;
  image: Blob;
  thumbnail: Blob;
}

const DB_NAME = "evening-village-ride";
const DB_VERSION = 1;
const STORE = "photos";

let opening: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      opening = null;
      reject(request.error ?? new Error("IndexedDB failed to open"));
    };
  });
  return opening;
}

/** Run one request in its own transaction and wait for it to commit. */
async function run<T>(
  mode: IDBTransactionMode,
  makeRequest: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = makeRequest(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error ?? request.error);
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

/** Captured photos, kept in the browser's IndexedDB (TechStack.md §11). */
export const photoDb = {
  all: () => run("readonly", (store) => store.getAll() as IDBRequest<PhotoRecord[]>),
  put: (photo: PhotoRecord) => run("readwrite", (store) => store.put(photo)).then(() => {}),
  delete: (id: string) => run("readwrite", (store) => store.delete(id)).then(() => {}),
};
