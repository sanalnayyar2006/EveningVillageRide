"use client";

import { Physics } from "@react-three/rapier";
import { AmbientDirector } from "./ambient/AmbientDirector";
import { Birds } from "./ambient/Birds";
import { Butterflies } from "./ambient/Butterflies";
import { Fireflies } from "./ambient/Fireflies";
import { Kites } from "./ambient/Kites";
import { Leaves } from "./ambient/Leaves";
import { Train } from "./ambient/Train";
import { AudioListener } from "./audio/AudioListener";
import { BikeController } from "./bike/BikeController";
import { BikeModel } from "./bike/BikeModel";
import { PhotoCamera } from "./camera/PhotoCamera";
import { RideCamera } from "./camera/RideCamera";
import { InputFrameEnd } from "./core/input/InputFrameEnd";
import { Animals } from "./life/Animals";
import { Villagers } from "./life/Villagers";
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
        <Villagers />
        <Animals />
        <BikeController />
        <RideCamera />
        <PhotoCamera />
      </Physics>
      <BikeModel />
      <AmbientDirector />
      <Birds />
      <Butterflies />
      <Fireflies />
      <Kites />
      <Leaves />
      <Train />
      <AudioListener />
      <PhotoMode />
      <InputFrameEnd />
    </>
  );
}
