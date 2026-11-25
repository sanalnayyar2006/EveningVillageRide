"use client";

import { Physics } from "@react-three/rapier";
import { BikeController } from "./bike/BikeController";
import { BikeModel } from "./bike/BikeModel";
import { PhotoCamera } from "./camera/PhotoCamera";
import { RideCamera } from "./camera/RideCamera";
import { InputFrameEnd } from "./core/input/InputFrameEnd";
import { Lighting } from "./lighting/Lighting";
import { PhotoMode } from "./photography/PhotoMode";
import { World } from "./world/World";

/**
 * Scene graph root (Architecture.md §10). Frame-update order is set by
 * FRAME_ORDER priorities, not by the order components appear here.
 */
export function Scene() {
  return (
    <>
      <Lighting />
      <Physics>
        <World />
        <BikeController />
        <RideCamera />
        <PhotoCamera />
      </Physics>
      <BikeModel />
      <PhotoMode />
      <InputFrameEnd />
    </>
  );
}
