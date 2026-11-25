"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { useGalleryStore } from "@/store/galleryStore";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { AudioSystem } from "./audio/AudioSystem";
import { installDebugHandle, registerRenderer } from "./core/debug";
import { input } from "./core/input/InputManager";
import { GOLDEN_HOUR } from "./lighting/lightingConfig";
import { PlayerSystem } from "./player/PlayerSystem";
import { Scene } from "./Scene";
import { ControlsHint } from "./ui/ControlsHint";
import { Gallery } from "./ui/gallery/Gallery";
import { LoadingScreen } from "./ui/LoadingScreen";
import { PhotoHud } from "./ui/PhotoHud";

/** Mounts only after everything inside Suspense (e.g. Rapier's WASM) has loaded. */
function Ready() {
  const setPhase = useGameStore((s) => s.setPhase);
  useEffect(() => setPhase("playing"), [setPhase]);
  return null;
}

export function Game() {
  const phase = useGameStore((s) => s.phase);
  const riding = usePlayerStore((s) => s.state === "cycling");
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => installDebugHandle(), []);
  useEffect(() => void useGalleryStore.getState().load(), []);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    return input.attach(surface);
  }, []);

  return (
    <main className="fixed inset-0 select-none overflow-hidden">
      <div ref={surfaceRef} className="absolute inset-0 touch-none">
        <Canvas
          shadows="percentage"
          dpr={[1, 2]}
          camera={{ position: [0, 3, 6], fov: 55, near: 0.1, far: 5000 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = GOLDEN_HOUR.exposure;
            gl.outputColorSpace = SRGBColorSpace;
            registerRenderer(gl);
          }}
        >
          <Suspense fallback={null}>
            <Scene />
            <Ready />
          </Suspense>
        </Canvas>
      </div>

      <PlayerSystem />
      <AudioSystem />
      {phase === "playing" && riding && <ControlsHint />}
      <PhotoHud />
      <Gallery />
      <LoadingScreen visible={phase === "loading"} />
    </main>
  );
}
