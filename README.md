# Evening Village Ride

A cozy 3D web experience: ride a bicycle through an Indian village at golden hour and collect memories with an in-game phone camera. Desktop (PC) only for now.

Specs live in [`RULES/`](RULES/).

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

| Script           | What it does            |
| ---------------- | ----------------------- |
| `pnpm dev`       | Development server      |
| `pnpm build`     | Production build        |
| `pnpm typecheck` | Strict TypeScript check |
| `pnpm lint`      | ESLint                  |
| `pnpm format`    | Prettier                |

A Husky pre-commit hook runs lint-staged and the type check.

## Stack

Next.js 16 · React 19 · TypeScript (strict) · Three.js · React Three Fiber · Drei · React Three Rapier · Zustand · Tailwind CSS 4 · Framer Motion · pnpm

## Phase status

- [x] **Phase 0 — Foundation**: tooling, folder architecture, input manager, event bus, stores, golden-hour scene with physics ground and player placeholder
- [x] **Phase 1 — Core gameplay**: bicycle physics (pedal, coast, brake, reverse, steer, lean), Rapier collisions, procedural roadster + IK rider, third-person ride camera (lag, drag-orbit, zoom, recenter, collision), bell, placeholder test course
- [x] **Phase 2 — Village**: terrain with river, pond and hills; roads; 25 houses; gate, bus stop, banyan, tea stall, market, temple, pond ghat, school, water tank, railway crossing, bridge and fields; instanced trees, grass, flowers and crops; lamps, power lines and props; data-driven colliders
- [x] **Phase 3 — Photography**: phone camera (C), first-person look/zoom/focus, shutter with flash, IndexedDB photo storage, album (G) with viewer, download and delete
- [x] **Real village map**: layout traced from a satellite screenshot of a Kangra village (`RULES/map/`): NH154 highway, lanes, ~100 houses, terraced fields, orchards, stream, substation and hospital; trees placed from the satellite canopy; hillside terrain with a snowy Dhauladhar horizon
- [x] **Phase 4 — Living world**: 26 villagers on daily routines (farmers, tea seller and customers, bazaar keepers and shoppers, strollers, elder at the banyan, water carrier, kite-flying kids, goatherd) and a children's cricket match; cows (one crossing the highway), goats and dogs that chase a passing bike; birds on the wires and temple, butterflies, fireflies, kites, wind sway and gust-blown leaves; temple bells, bird flyovers and the evening train on random timers; the sun sets over 15 minutes into dusk; synthesised spatial sound for all of it
- [ ] Phase 5 — Polish
- [ ] Phase 6 — Optimization

## Controls (desktop)

| Key           | Action                           |
| ------------- | -------------------------------- |
| W             | Pedal                            |
| A / D         | Steer                            |
| S             | Slow down · reverse when stopped |
| Space         | Brake                            |
| B             | Bell                             |
| C             | Phone camera (stops the bike)    |
| Click / Space | Take a photo (photo mode)        |
| Scroll        | Zoom (photo mode)                |
| Esc / C       | Put the phone away               |
| G             | Open / close the album           |
| Mouse drag    | Look around                      |
| Scroll        | Camera distance                  |

In development, `window.__evr` exposes the stores for debugging, e.g.
`__evr.bike.getState().teleportTo(0, -40, Math.PI)` or `__evr.renderStats()`.

## Updating the map

The village is traced from `RULES/map/` (satellite screenshot + OpenStreetMap export).
All map data is written in screenshot pixels and converted with `MAP.metresPerPixel`
in `src/game/world/data/mapSource.ts`, so a bigger area later means a new screenshot,
new traces in `data/layout.ts` and `data/structures.ts`, and updated `rideBounds`.

After changing the screenshot, regenerate tree positions from its canopy:

```
python3 scripts/map/extract_canopy.py
```
