/**
 * Every gameplay action and the keys that trigger it.
 * Systems ask for actions ("brake"), never for raw keys ("Space").
 */
export type Action = "forward" | "back" | "left" | "right" | "brake" | "bell";

export const KEY_BINDINGS: Record<Action, readonly string[]> = {
  forward: ["KeyW", "ArrowUp"],
  back: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  brake: ["Space"],
  bell: ["KeyB"],
};
