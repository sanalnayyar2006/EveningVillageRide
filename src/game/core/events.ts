import type { GamePhase } from "@/types/game";

/**
 * Typed event bus. Systems publish facts; other systems subscribe.
 * This keeps e.g. the bike from knowing that the audio system exists.
 */
export interface GameEvents {
  "game:phase": { phase: GamePhase };
  // Gameplay events (bell, photo, discovery…) are added by their owning phase.
}

type Handler<T> = (payload: T) => void;

class EventBus<Events extends object> {
  private handlers = new Map<keyof Events, Set<Handler<unknown>>>();

  on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as Handler<unknown>);
    return () => set.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof Events>(
    type: K,
    ...payload: Events[K] extends undefined ? [] : [Events[K]]
  ): void {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const handler of [...set]) {
      try {
        handler(payload[0]);
      } catch (error) {
        // One failing subscriber must never take down the others.
        console.error(`[events] handler for "${String(type)}" failed`, error);
      }
    }
  }
}

export const events = new EventBus<GameEvents>();
