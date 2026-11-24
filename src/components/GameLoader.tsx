"use client";

import dynamic from "next/dynamic";

/** WebGL and Rapier's WASM only exist in the browser, so the game never renders on the server. */
const Game = dynamic(() => import("@/game/Game").then((m) => m.Game), { ssr: false });

export function GameLoader() {
  return <Game />;
}
