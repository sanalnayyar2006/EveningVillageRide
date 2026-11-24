"use client";

import { Physics } from "@react-three/rapier";
import { BikeController } from "./bike/BikeController";
import { BikeModel } from "./bike/BikeModel";
import { RideCamera } from "./camera/RideCamera";
import { InputFrameEnd } from "./core/input/InputFrameEnd";
import { Lighting } from "./lighting/Lighting";
import { Ground } from "./world/Ground";
import { TestCourse } from "./world/TestCourse";

/**
 * Scene graph root (Architecture.md §10). Frame-update order is set by
 * FRAME_ORDER priorities, not by the order components appear here.
 */
export function Scene() {
  return (
    <>
      <Lighting />
      <Physics>
        <Ground />
        <TestCourse />
        <BikeController />
        <RideCamera />
      </Physics>
      <BikeModel />
      <InputFrameEnd />
    </>
  );
}
