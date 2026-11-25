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
- [x] Phase 3 — Photography + gallery (needs in-browser check)
- [ ] Phase 4 — Living world
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
