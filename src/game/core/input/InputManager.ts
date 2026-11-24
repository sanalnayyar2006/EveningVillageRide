import { clamp } from "@/utils/math";
import { KEY_BINDINGS, type Action } from "./bindings";

const SCROLL_KEYS = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
/** Pointer travel (px) before a press counts as a drag rather than a click. */
const DRAG_THRESHOLD = 4;

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

/**
 * The single entry point for keyboard and mouse input.
 * Gameplay systems poll it once per frame; nothing else reads DOM input events.
 */
class InputManager {
  private down = new Set<string>();
  private pressed = new Set<string>();
  private lookX = 0;
  private lookY = 0;
  private wheel = 0;
  private pointerId: number | null = null;
  private dragDistance = 0;
  private lastX = 0;
  private lastY = 0;
  private lastLookAt = 0;

  /** Keyboard is read window-wide; drag-to-look only on `surface`. Returns a detach function. */
  attach(surface: HTMLElement): () => void {
    surface.style.cursor = "grab";
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (SCROLL_KEYS.has(e.code)) e.preventDefault();
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => this.down.delete(e.code);
    const onBlur = () => {
      this.down.clear();
      this.pointerId = null;
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      this.pointerId = e.pointerId;
      this.dragDistance = 0;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      surface.setPointerCapture(e.pointerId);
      surface.style.cursor = "grabbing";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (this.pointerId !== e.pointerId) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.dragDistance += Math.abs(dx) + Math.abs(dy);
      if (this.dragDistance < DRAG_THRESHOLD) return;
      this.lookX += dx;
      this.lookY += dy;
      this.lastLookAt = performance.now();
    };
    const onPointerUp = (e: PointerEvent) => {
      if (this.pointerId !== e.pointerId) return;
      this.pointerId = null;
      if (surface.hasPointerCapture(e.pointerId)) surface.releasePointerCapture(e.pointerId);
      surface.style.cursor = "grab";
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Normalise to roughly ±1 per notch; trackpads send many small deltas.
      this.wheel += clamp(e.deltaY, -120, 120) / 120;
    };
    const onContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    surface.addEventListener("pointerdown", onPointerDown);
    surface.addEventListener("pointermove", onPointerMove);
    surface.addEventListener("pointerup", onPointerUp);
    surface.addEventListener("pointercancel", onPointerUp);
    surface.addEventListener("wheel", onWheel, { passive: false });
    surface.addEventListener("contextmenu", onContextMenu);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerup", onPointerUp);
      surface.removeEventListener("pointercancel", onPointerUp);
      surface.removeEventListener("wheel", onWheel);
      surface.removeEventListener("contextmenu", onContextMenu);
      surface.style.cursor = "";
    };
  }

  isDown(action: Action): boolean {
    return KEY_BINDINGS[action].some((code) => this.down.has(code));
  }

  /** True only on the frame the key went down. */
  wasPressed(action: Action): boolean {
    return KEY_BINDINGS[action].some((code) => this.pressed.has(code));
  }

  /** -1, 0 or 1 from a pair of opposing actions. */
  axis(negative: Action, positive: Action): number {
    return (this.isDown(positive) ? 1 : 0) - (this.isDown(negative) ? 1 : 0);
  }

  consumeLook(): { dx: number; dy: number } {
    const out = { dx: this.lookX, dy: this.lookY };
    this.lookX = 0;
    this.lookY = 0;
    return out;
  }

  consumeWheel(): number {
    const w = this.wheel;
    this.wheel = 0;
    return w;
  }

  /** Milliseconds since the player last dragged the view. */
  msSinceLook(): number {
    return performance.now() - this.lastLookAt;
  }

  get isDragging(): boolean {
    return this.pointerId !== null && this.dragDistance >= DRAG_THRESHOLD;
  }

  /** Call once at the very end of every frame. */
  endFrame(): void {
    this.pressed.clear();
  }
}

export const input = new InputManager();
