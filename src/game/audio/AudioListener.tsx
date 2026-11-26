"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { Vector3 } from "three";
import { audioEngine } from "./AudioEngine";

/** Tells the audio engine where the camera is each frame, so sounds come from the right place. */
export function AudioListener() {
  const camera = useThree((state) => state.camera);
  const forward = useMemo(() => new Vector3(), []);

  useFrame(() => {
    camera.getWorldDirection(forward);
    const { x, y, z } = camera.position;
    audioEngine.setListener(x, y, z, Math.atan2(forward.x, forward.z));
  });

  return null;
}
