"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { useGameStore } from "@/store/gameStore";
import { GOLDEN_HOUR } from "./lighting/lightingConfig";
import { Scene } from "./Scene";
import { LoadingScreen } from "./ui/LoadingScreen";

/** Flips the game out of "loading" once everything inside Suspense has resolved. */
function Ready() {
  const setPhase = useGameStore((s) => s.setPhase);
  useEffect(() => setPhase("playing"), [setPhase]);
  return null;
}

export function Game() {
  const phase = useGameStore((s) => s.phase);

  return (
    <main className="fixed inset-0 select-none overflow-hidden">
      <div className="absolute inset-0">
        <Canvas
          shadows="percentage"
          dpr={[1, 2]}
          camera={{ position: [6, 4, 9], fov: 55, near: 0.1, far: 5000 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = GOLDEN_HOUR.exposure;
            gl.outputColorSpace = SRGBColorSpace;
          }}
        >
          <Suspense fallback={null}>
            <Scene />
            <Ready />
          </Suspense>
        </Canvas>
      </div>

      {phase === "playing" && (
        <p className="pointer-events-none absolute bottom-5 left-6 text-sm text-dusk-50/80 drop-shadow">
          Drag to orbit · Scroll to zoom
        </p>
      )}
      <LoadingScreen visible={phase === "loading"} />
    </main>
  );
}
