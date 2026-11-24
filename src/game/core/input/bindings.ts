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
  | "gallery"
  | "back:ui"
  | "interact"
  | "zoomIn"
  | "zoomOut"
  | "toggleGrid"
  | "mute"
  | "prev"
  | "next";

export const KEY_BINDINGS: Record<Action, readonly string[]> = {
  forward: ["KeyW", "ArrowUp"],
  back: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  brake: ["Space"],
  bell: ["KeyB"],
  phone: ["KeyC"],
  shutter: ["Space", "Enter"],
  gallery: ["KeyG"],
  "back:ui": ["Escape"],
  interact: ["KeyE"],
  zoomIn: ["Equal", "NumpadAdd", "KeyQ"],
  zoomOut: ["Minus", "NumpadSubtract", "KeyZ"],
  toggleGrid: ["KeyT"],
  mute: ["KeyM"],
  prev: ["ArrowLeft", "KeyA"],
  next: ["ArrowRight", "KeyD"],
};

/** Human-readable labels for the controls sheet. */
export const CONTROLS_SHEET: { keys: string[]; label: string }[] = [
  { keys: ["W", "S"], label: "Pedal · slow down / reverse" },
  { keys: ["A", "D"], label: "Steer" },
  { keys: ["Space"], label: "Brake" },
  { keys: ["B"], label: "Ring the bell" },
  { keys: ["Drag"], label: "Look around" },
  { keys: ["Scroll"], label: "Camera distance / zoom" },
  { keys: ["C"], label: "Phone camera" },
  { keys: ["Space"], label: "Take photo (in camera)" },
  { keys: ["T"], label: "Grid lines (in camera)" },
  { keys: ["E"], label: "Interact" },
  { keys: ["G"], label: "Gallery" },
  { keys: ["M"], label: "Mute" },
  { keys: ["Esc"], label: "Back · pause" },
];
