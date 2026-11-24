import type { Vec3Tuple } from "@/types/game";

/**
 * Typed event bus. Systems publish facts and others subscribe, so the bike
 * can ring its bell without knowing the audio system exists.
 */
export interface GameEvents {
  "bike:bell": { position: Vec3Tuple };
}

type Handler<T> = (payload: T) => void;

class EventBus<Events extends object> {
  private handlers = new Map<keyof Events, Set<Handler<unknown>>>();

  /** Returns an unsubscribe function. */
  on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as Handler<unknown>);
    return () => set.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    for (const handler of [...(this.handlers.get(type) ?? [])]) {
      try {
        handler(payload);
      } catch (error) {
        // One broken subscriber shouldn't stop the others from hearing the event.
        console.error(`[events] handler for "${String(type)}" failed`, error);
      }
    }
  }
}

export const events = new EventBus<GameEvents>();
