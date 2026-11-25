/**
 * Every gameplay action and the keys that trigger it.
 * Systems ask for actions ("brake"), never for raw keys ("Space").
 */
export type Action =
  | "forward"
  | "back"
  | "left"
  | "right"
  | "brake"
  | "bell"
  | "phone"
  | "shutter"
  | "exit"
  | "gallery";

export const KEY_BINDINGS: Record<Action, readonly string[]> = {
  forward: ["KeyW", "ArrowUp"],
  back: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  brake: ["Space"],
  bell: ["KeyB"],
  phone: ["KeyC"],
  // Space brakes while riding and fires the shutter in photo mode; the two never overlap.
  shutter: ["Space", "Enter"],
  exit: ["Escape"],
  gallery: ["KeyG"],
};
