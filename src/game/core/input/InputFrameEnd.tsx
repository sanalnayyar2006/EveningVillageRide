"use client";

import { useFrame } from "@react-three/fiber";
import { FRAME_ORDER } from "../frameOrder";
import { input } from "./InputManager";

/** Clears this frame's one-shot key presses after every system has seen them. */
export function InputFrameEnd() {
  useFrame(() => input.endFrame(), FRAME_ORDER.inputEnd);
  return null;
}
