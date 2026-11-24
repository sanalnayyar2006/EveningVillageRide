import { useEffect, useRef } from "react";
import { events, type GameEvents } from "@/game/core/events";

/** Subscribe to a game event for the lifetime of the component. */
export function useGameEvent<K extends keyof GameEvents>(
  type: K,
  handler: (payload: GameEvents[K]) => void,
): void {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => events.on(type, (payload) => ref.current(payload)), [type]);
}
