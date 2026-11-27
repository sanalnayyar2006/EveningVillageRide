"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { NoToneMapping, SRGBColorSpace } from "three";
import { useGalleryStore } from "@/store/galleryStore";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { useSettingsStore } from "@/store/settingsStore";
import { AudioSystem } from "./audio/AudioSystem";
import { AdaptiveResolution } from "./core/AdaptiveResolution";
import { installDebugHandle, registerRenderer } from "./core/debug";
import { qualityFor } from "./core/quality";
import { input } from "./core/input/InputManager";
import { GOLDEN_HOUR } from "./lighting/lightingConfig";
import { PlayerSystem } from "./player/PlayerSystem";
import { RideAutosave } from "./save/RideAutosave";
import { Scene } from "./Scene";
import { ControlsHint } from "./ui/ControlsHint";
import { DevStats } from "./ui/DevStats";
import { Gallery } from "./ui/gallery/Gallery";
import { LoadingScreen } from "./ui/LoadingScreen";
import { PauseMenu } from "./ui/menu/PauseMenu";
import { TitleScreen } from "./ui/menu/TitleScreen";
import { PhotoHud } from "./ui/PhotoHud";
import { PlaceCard } from "./ui/PlaceCard";

/** Mounts only after everything inside Suspense (e.g. Rapier's WASM) has loaded. */
function Ready() {
  const setPhase = useGameStore((s) => s.setPhase);
  useEffect(() => setPhase("title"), [setPhase]);
  return null;
}

export function Game() {
  const phase = useGameStore((s) => s.phase);
  const riding = usePlayerStore((s) => s.state === "cycling");
  const paused = usePlayerStore((s) => s.state === "paused");
  const { maxDpr } = qualityFor(useSettingsStore((s) => s.highQuality));
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => installDebugHandle(), []);
  useEffect(() => void useGalleryStore.getState().load(), []);

  // Keys pressed on the pause menu must not reach the ride when it resumes.
  useEffect(() => input.endFrame(), [paused]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    return input.attach(surface);
  }, []);

  return (
    <main className="fixed inset-0 select-none overflow-hidden">
      <div ref={surfaceRef} className="absolute inset-0 touch-none">
        <Canvas
          // Pausing stops the whole world: nothing updates and the last frame stays on screen.
          frameloop={paused ? "never" : "always"}
          shadows="percentage"
          dpr={[1, maxDpr]}
          camera={{ position: [0, 3, 6], fov: 55, near: 0.1, far: 5000 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl, scene }) => {
            // PostEffects tone-maps the finished frame; the renderer only sets the exposure.
            gl.toneMapping = NoToneMapping;
            gl.toneMappingExposure = GOLDEN_HOUR.exposure;
            gl.outputColorSpace = SRGBColorSpace;
            registerRenderer(gl, scene);
          }}
        >
          <Suspense fallback={null}>
            <Scene />
            <AdaptiveResolution />
            <Ready />
          </Suspense>
        </Canvas>
      </div>

      <PlayerSystem />
      <AudioSystem />
      <RideAutosave />
      {phase === "playing" && riding && <ControlsHint />}
      <PlaceCard />
      <PhotoHud />
      <Gallery />
      <PauseMenu />
      <TitleScreen />
      <LoadingScreen visible={phase === "loading"} />
      {process.env.NODE_ENV !== "production" && <DevStats />}
    </main>
  );
}
