a# Evening Village Ride: Phase 0 + Phase 1 Deep Dive

This document explains everything built through Phase 1: what each piece does, why it is built that way, and how to answer questions about it. It describes the current working tree, about 2,000 lines of TypeScript in `src/`.

---

## 0. The 60-second explanation

> It's a browser game built with **Next.js + React + Three.js**. React (through **React Three Fiber**) describes _what exists_ in the 3D scene. Per-frame motion happens outside React, in `useFrame` callbacks that change Three.js objects directly, so React never re-renders 60 times a second. A **pure TypeScript bicycle simulation** works out speed, steering, lean and wheel spin. **Rapier** (a Rust physics engine compiled to WebAssembly) handles collisions through a kinematic character controller. The result goes into a **Zustand** store that the 3D model, the rider's IK animation and the follow camera all read. Input goes through one **InputManager**, and systems talk to each other through a **typed event bus**, so for example the bike never imports the audio code.

If you can explain that paragraph and the diagram in §3, you can handle most questions.

---

## 1. What happens when the page loads (boot sequence)

```
Browser requests /
  └─ src/app/page.tsx              (Server Component, renders on the server)
       └─ <GameLoader/>            (src/components/GameLoader.tsx, "use client")
            └─ dynamic(() => import("@/game/Game"), { ssr: false })
                 └─ <Game/>        (src/game/Game.tsx, runs in the browser only)
                      ├─ input.attach(surfaceDiv)        keyboard + mouse listeners
                      ├─ installDebugHandle()            window.__evr (dev only)
                      ├─ <Canvas>                        creates the WebGL renderer
                      │    └─ <Suspense>
                      │         ├─ <Scene/>              <Physics> suspends while Rapier WASM downloads
                      │         └─ <Ready/>              mounts only after Suspense resolves
                      │                                    → gameStore.phase = "playing"
                      ├─ <PlayerSystem/>                 sees "playing" → player: idle → cycling
                      ├─ <AudioSystem/>                  unlocks audio on first key/click
                      ├─ <ControlsHint/>                 shown once playing
                      └─ <LoadingScreen/>                fades out when phase leaves "loading"
```

**Why each step exists**

| Step                                           | Reason                                                                                                                                                                                                                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page.tsx` stays a Server Component            | Next's App Router defaults to server rendering. The page shell (HTML, metadata, CSS) arrives instantly.                                                                                                                                                                    |
| `GameLoader` is a separate `"use client"` file | Next only allows `dynamic(..., { ssr: false })` inside a Client Component. This small wrapper is the boundary.                                                                                                                                                             |
| `ssr: false`                                   | WebGL, `window`, `document` and Rapier's WASM don't exist on the server. Rendering the game on the server would crash, and it would gain nothing anyway because a canvas has no SEO value.                                                                                 |
| `<Suspense>` + `<Ready/>`                      | `@react-three/rapier`'s `<Physics>` _suspends_ (throws a promise) while it loads the WASM binary. `<Ready/>` is a sibling inside the same Suspense boundary, so its `useEffect` only runs once everything has loaded. That is an accurate "loaded" signal without polling. |
| `phase` in `gameStore`                         | One source of truth for "loading vs playing". The loading screen, the controls hint and the player system all react to it.                                                                                                                                                 |

---

## 2. The tech stack: what, why, and how to defend it

### 2.1 Next.js 16 (App Router, Turbopack)

- **Where:** `src/app/`, `next.config.ts`
- **What it gives us:** routing (a gallery page or a share page later), a production build pipeline, code splitting (the game bundle loads only on the client, through `dynamic`), metadata/SEO for the landing shell, and zero-config deployment to Vercel (TechStack.md §13).
- **`next.config.ts` explained:**
  - `reactStrictMode: true`: in development React mounts, unmounts and remounts every component once, which catches missing cleanups. **This is why every effect in the codebase returns a cleanup** (`input.attach` returns `detach`, the character controller gets removed, audio listeners get removed).
  - `transpilePackages: ["three"]`: makes Next's bundler process Three.js, including the `three/examples/jsm/...` ESM addons we import (`mergeGeometries`), so we don't hit ESM/CJS interop problems.
  - `turbopack.root`: a stray lockfile in a parent folder confused Next's workspace-root detection, so the root is pinned to the project.
- **If someone says "Next is overkill for a game, use Vite":**

  > "Fair. The 3D part is a client-only SPA either way. We chose Next for what's _around_ the game: future routes (gallery, shared photos), metadata, Vercel deploys, and a possible Supabase backend (TechStack.md §12) through route handlers. The game itself is isolated behind one `dynamic()` import, so Next's server rendering never touches it, and moving to Vite later would only mean changing `src/app/` and `GameLoader`. Nothing in `src/game/` depends on Next."

  That last point is true and worth remembering: `src/game/` has **zero Next imports**.

### 2.2 React 19

- The component model gives us composition (`<Scene>` contains `<Ground>`, `<BikeController>` and so on), lifecycle (mount/unmount = add/remove from the world) and Suspense for asset loading.
- **Key point:** React is used for **structure, not for per-frame animation.** Nothing calls `setState` 60 times a second. See §4.1.
- React 19 is required by R3F 9.

### 2.3 TypeScript (strict), pinned to 5.9

- **`tsconfig.json` flags worth knowing:**
  - `strict`: no implicit `any`, strict null checks.
  - `noUncheckedIndexedAccess`: `array[i]` has type `T | undefined`. That's why `Rider.tsx` checks `if (!upper || !lower ...)` after destructuring `limb.children`.
  - `noImplicitOverride`, `noFallthroughCasesInSwitch`: catch subtle bugs.
  - `moduleResolution: "bundler"`, `isolatedModules`: match how Turbopack compiles files one at a time.
  - `paths: { "@/*": ["./src/*"] }`: lets imports read `@/store/bikeStore` instead of `../../../store/bikeStore`.
- **Why pinned to 5.9:** TypeScript 7 (the Go-native compiler) was too new for Next's tooling and `typescript-eslint`. We pinned to what the ecosystem supports. Same reason ESLint is on 9, not 10.
- **Rule from TechStack.md:** no `.js` files. The only exceptions are `eslint.config.mjs` and `postcss.config.mjs`, because those tools only load JS config files, and both files carry a comment saying so.

### 2.4 Three.js 0.187

- The actual WebGL rendering engine: scene graph, meshes, materials (`MeshStandardMaterial` = PBR), lights, shadows, cameras.
- **Why not Babylon.js / PlayCanvas / Unity WebGL?**
  - Babylon: a full engine, heavier, and its own world rather than React-native.
  - PlayCanvas: editor-centric and cloud-tied.
  - Unity/Godot web exports: large downloads (tens of MB), slow startup, poor integration with web UI, and the HTML gallery/phone UI would be awkward.
  - Three.js is the most widely used web 3D library, has the largest ecosystem, and is what R3F wraps.

### 2.5 React Three Fiber 9 (R3F)

- **What it is:** a React _renderer_ for Three.js. `<mesh>` in JSX becomes `new THREE.Mesh()`. It is not a wrapper library with a fixed component set: every Three class is available as a JSX element.
- **What it gives us:**
  - **Declarative scene + automatic cleanup:** unmount `<TestCourse/>` and its meshes and geometries are disposed.
  - **`useFrame(callback, priority)`:** the game loop hook. Every system registers its per-frame logic here.
  - **`useThree()`:** access to the camera, renderer and scene.
  - **Suspense integration** for async assets.
- **Why not plain Three.js?** The game will have dozens of systems (NPCs, phone UI, gallery, interactions). With React components, each system owns its objects and cleans up after itself, and the 3D scene and the HTML UI share state through the same stores. Plain Three.js means writing your own add/remove/dispose bookkeeping.
- **Performance argument:** R3F adds no overhead per frame because `useFrame` callbacks change Three objects directly, the same as plain Three. React only does work when the _structure_ changes.

### 2.6 Drei 10

- A helper library from pmndrs, the same group that maintains R3F, Zustand and react-three-rapier.
- **Currently used for exactly one thing:** `<Sky/>` in `Lighting.tsx`, a physically based atmospheric scattering shader (Rayleigh and Mie parameters) that gives the golden-hour sky without a skybox texture.
- TechStack.md says: _"Only use components that reduce boilerplate without hiding important rendering logic."_ That's why the camera is custom and not Drei's `OrbitControls` or `CameraControls`, which can't do bike-relative lag, collision with Rapier geometry or auto-recentering.

### 2.7 React Three Rapier 2 (Rapier 0.19)

- **Rapier** is a physics engine written in Rust and compiled to **WebAssembly**. `@react-three/rapier` puts it into R3F as components (`<Physics>`, `<RigidBody>`, `<CuboidCollider>`, `<CapsuleCollider>`).
- **Why Rapier and not cannon-es or ammo.js?**
  - cannon-es: pure JS, slower, maintenance has stalled.
  - ammo.js: an Emscripten port of Bullet, huge, with an awkward API and manual memory management.
  - Rapier: fast (WASM, SIMD), actively maintained, deterministic, and it has a **built-in kinematic character controller**, which is exactly what we use for the bike.
- **How we use it (important design decision):** the bike is **not** a dynamic rigid body pushed by forces. See §5.3 for the full reasoning.
- **API note:** in Rapier 0.19 the ray hit distance is `hit.timeOfImpact` (older versions called it `toi`). `RideCamera.tsx` uses the new name.

### 2.8 Zustand 5

- **Where:** `src/store/` (four focused stores: game, player, bike, settings)
- **Why Zustand:**
  - **You can read it outside React:** `useBikeStore.getState()` works inside `useFrame`, an event handler or a plain class. A game loop needs this; React Context can't do it.
  - **Selective subscriptions:** `useBikeStore(s => s.moving)` re-renders `ControlsHint` only when `moving` changes, not when the bike's position changes.
  - Tiny (about 1 KB), no providers, no boilerplate.
  - Same ecosystem as R3F, designed with this use case in mind.
- **Why not Redux Toolkit?** Too much ceremony (slices, actions, a provider), and its immutable-update model is a poor fit for per-frame data.
- **Why not React Context?** Every consumer re-renders on every change, and it isn't readable outside components.
- **Why several stores, not one?** Specified in TechStack.md §5. Each system owns its slice, so stores don't depend on each other, and subscribing to `settings` doesn't wake up on bike changes.
- **`persist` middleware** (settings only): saves to `localStorage` under the key `evr:settings` with `version: 1`, so a future schema change can add a `migrate` function instead of breaking saved settings.

### 2.9 Tailwind CSS 4

- **Where:** `src/app/globals.css`, HTML overlays (`ControlsHint`, `LoadingScreen`, `Kbd`)
- **v4 specifics:** there's no `tailwind.config.js`. Configuration is CSS-first through `@theme { ... }` in `globals.css`. The custom `dusk-*` colour palette defined there becomes classes like `bg-dusk-900` and `text-dusk-50/90`. It's wired in through PostCSS (`@tailwindcss/postcss`).
- **Why:** HTML UI (menus, gallery, phone) is a big part of later phases. Utility classes keep styling next to markup and leave no dead CSS behind. TechStack.md §6 requires all overlays to use Tailwind.
- Tailwind never touches the 3D scene.

### 2.10 Framer Motion

- **Where:** `LoadingScreen` (fade-out on exit through `AnimatePresence`, animated progress line), `ControlsHint` (fades to 25% opacity while riding).
- **Why:** `AnimatePresence` animates components _as they unmount_, which plain CSS can't do. TechStack.md limits it to **DOM UI only, never 3D objects**. 3D animation happens in `useFrame`.

### 2.11 Tooling: pnpm, ESLint, Prettier, Husky, lint-staged

| Tool                                       | Why                                                                                                                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **pnpm 10** (pinned with `packageManager`) | Content-addressed store (fast installs, little disk use) and a _strict_ `node_modules`: you can only import packages you declared, which prevents "works on my machine" phantom dependencies. |
| **ESLint 9 flat config**                   | `next/core-web-vitals` + `next/typescript` presets. Three deliberate overrides, below.                                                                                                        |
| **Prettier**                               | Consistent formatting, so diffs show logic changes only.                                                                                                                                      |
| **Husky + lint-staged**                    | The pre-commit hook runs ESLint/Prettier on _staged files only_ (fast), then a full `tsc --noEmit`. Broken types can't be committed.                                                          |

**The ESLint overrides, and why each one is justified:**

- `react-hooks/immutability: off`: R3F code _must_ change Three.js objects inside `useFrame` (`root.current.position.set(...)`). That is the documented R3F pattern, and this rule flags it as a bug.
- `react/no-unknown-property: off`: R3F JSX props like `rotation-x`, `castShadow` and `shadow-mapSize` aren't DOM attributes, so the rule would flag every 3D component.
- `no-unused-vars` ignores names starting with `_`: lets us write `groundHeight(_x, _z)` as a stub with the final signature.

---

## 3. The per-frame data flow (the most important diagram)

R3F runs every `useFrame` callback each animation frame, **ordered by priority** (lower runs first). Our priorities are set in `src/game/core/frameOrder.ts`:

```
             DOM events (any time)
        keydown / pointermove / wheel
                    │
                    ▼
        ┌───────────────────────┐
        │  InputManager (singleton)  │  stores: down keys, pressed-this-frame,
        └───────────────────────┘          accumulated look dx/dy, wheel
                    │ polled
════════════════════╪══════════════ ONE FRAME ═══════════════════════════════
                    ▼
 priority -40  BikeController ──── reads input, player state
               │  stepBike()            pure physics: speed, steer, heading, lean, spin
               │  Rapier character controller: "how far can I actually move?"
               │  setNextKinematicTranslation / Rotation on the capsule body
               │  writes ──► bikeStore.telemetry  (mutated in place, no re-render)
               │  emits  ──► events "bike:bell"  ──► AudioSystem ──► Web Audio
               ▼
 priority -30  RideCamera ──────── reads telemetry + look/wheel input
               │  orbit math, Rapier raycast to avoid clipping, FOV kick
               │  moves the Three camera
               ▼
 priority -1   InputFrameEnd ───── input.endFrame(): clears "pressed this frame"
               │                    (runs after every system that reads input)
               ▼
 priority  0   BikeModel / Rider ── read telemetry, pose the meshes (+ IK)
               (default priority)   Rapier's <Physics> also steps here (its updatePriority
                                     defaults to 0), applying the kinematic moves set above
               ▼
            R3F renders the scene (because no priority is > 0, R3F keeps auto-rendering)
```

**Why priorities and not JSX order?** `Scene.tsx` says it directly: _"Frame-update order is set by FRAME_ORDER priorities, not by the order components appear here."_ JSX order is fragile, because moving a component in the tree would silently change game logic. Priorities make the order explicit and live in one file.

**Why negative numbers?** In R3F, **any `useFrame` with priority > 0 takes over rendering**: R3F stops auto-rendering and you have to call `gl.render()` yourself. Negative priorities give us ordering without that side effect.

**Why `InputFrameEnd` exists:** `wasPressed("bell")` must be true for exactly one frame. If the "pressed" set were cleared on keyup or in the bike system, other systems might miss it. Clearing it last, after every reader, is a standard game-input pattern (edge detection).

---

## 4. Core architecture patterns (the "why this structure" section)

### 4.1 React for structure, `useFrame` for motion

- **Rule:** nothing that changes every frame lives in React state.
- **Why:** `setState` at 60 fps re-renders the component tree 60 times a second, which is slow, triggers garbage collection and causes jank. Changing `mesh.position` directly costs nothing.
- **Example:** `BikeModel` renders its JSX **once**. Every frame its `useFrame` sets `root.current.position`, `leanGroup.current.rotation.z` and so on through refs.

### 4.2 Transient store data: `bikeStore.telemetry`

```ts
telemetry: {
  (x, y, z, heading, speed, lean, steer, wheelAngle, crankAngle);
} // mutated in place
moving: boolean; // reactive
```

- `telemetry` is **one object that is changed in place** (`Object.assign(telemetry, {...})`). No `set()` call, so no subscriber is notified and nothing re-renders. Readers pull it with `getState().telemetry` inside `useFrame`.
- `moving` is the **only reactive field**, and `setMoving` returns early if the value hasn't changed, so the UI re-renders only when the bike starts or stops (to fade the controls hint).
- **Why not keep it in a `useRef` in BikeController?** The camera, the model, the rider, and later the photo system and NPCs all need it. A store is the shared place to put it, and the debug handle (`window.__evr.bike`) can inspect it.
- **Pattern name if asked:** "transient updates", recommended by the Zustand and R3F docs for high-frequency data.

### 4.3 Singleton InputManager (polling, not events)

- `src/game/core/input/InputManager.ts` is the **only** code that reads DOM input events (Architecture.md §12).
- Systems **poll** it (`input.isDown("forward")`). They don't subscribe to keydown.
- **Why polling for games:** game logic runs on the frame clock. Event-driven input fires at random times between frames, which leads to race conditions and logic running at different points in the frame. Polling means "every system sees the same input snapshot, at a known time".
- **Action mapping** (`bindings.ts`): systems ask for `"brake"`, never `"Space"`. Rebinding keys or adding a gamepad later means changing one file.
- **Details worth knowing:**
  - Uses `e.code` (physical key position), not `e.key`, so WASD stays in the same place on any keyboard layout.
  - `window` `blur` clears every held key. Without this, alt-tabbing while holding W leaves the bike pedalling forever (the "stuck key" bug).
  - Ignores keys typed into inputs/textareas (`isTypingTarget`), which will matter for future UI.
  - `preventDefault` on Space and the arrow keys stops the page from scrolling.
  - **Pointer capture** (`setPointerCapture`): dragging keeps working even if the cursor leaves the canvas.
  - **Drag threshold (4px):** a click isn't a drag, so future click interactions won't jerk the camera.
  - The wheel listener uses `{ passive: false }` because a passive listener can't call `preventDefault` and the page would zoom or scroll. Deltas are normalised to about ±1 per notch because trackpads send many small values.
  - `consumeLook()` / `consumeWheel()` **read and reset** accumulated deltas, so mouse movement between frames is never lost or counted twice.

### 4.4 Typed event bus

- `src/game/core/events.ts`. Systems _publish facts_ ("the bell rang at position X") and other systems subscribe.
- **Why:** decoupling. `BikeController` does not import audio. Later the NPC system can subscribe to `"bike:bell"` to make villagers look up, with **no change to bike code**.
- **Typed:** `GameEvents` maps event name to payload type. `events.emit("bike:bell", { position: 5 })` is a compile error.
- **Robustness details:**
  - `emit` iterates a **copy** (`[...set]`) so a handler that unsubscribes during emit doesn't break the loop.
  - Each handler is wrapped in `try/catch`, so one broken subscriber doesn't stop the others hearing the event (Architecture.md §18).
  - `on()` returns an unsubscribe function, which fits directly into a `useEffect` cleanup.
- **`useGameEvent` hook** (`src/hooks/useGameEvent.ts`): uses the **"latest ref" pattern**. It stores the handler in a ref updated every render and subscribes once per event type, so you can pass an inline arrow function without resubscribing on every render.
- **Store vs event, when to use which:** stores hold **state** ("what is true now": speed, phase). Events carry **moments** ("something just happened": bell rang, photo taken). That's a clean answer if someone asks why there are two mechanisms.

### 4.5 Player state machine

- `src/game/player/playerStateMachine.ts` defines a **transition table**: for each state, which states are allowed next.
- `playerStore.transition(to)` refuses illegal moves (and logs a warning). For example you can't go from `idle` straight to `takingPhoto`.
- **Why now, in Phase 1, when only `idle → cycling` is used?** GameplaySystem.md §1 says _exactly one_ player state is active at a time. Later phases add photo mode, gallery and interactions. A table-driven state machine prevents impossible combinations (taking a photo while in the gallery) by construction, and adding a state means editing one table.
- `BikeController` and `RideCamera` both check `state === "cycling"` before reading controls. Leaving that state means the bike coasts to a stop and the camera ignores the mouse, so later phases get that behaviour for free.

### 4.6 Data-driven configuration

- All tuning numbers live in `*Config.ts` files: `bikeConfig.ts`, `cameraConfig.ts`, `lightingConfig.ts`.
- **Why:** Architecture.md §2 "Data Driven". Game feel is tuned by changing numbers, not code. Each value has a unit and a comment (`/** m/s (~25 km/h). */`). `as const` makes them read-only literal types.

### 4.7 Pure simulation, separate from the engine

- `src/game/bike/bikePhysics.ts` → `stepBike(state, input, dt, config)`.
- It **imports nothing from React, Three.js, Rapier or the input system**. It's plain math on plain objects.
- **Why:**
  1. **Testable:** you can unit-test "brake from 7 m/s takes about 1.1 s" without a browser. (No tests exist yet; that is an honest gap, see §8.)
  2. **Swappable:** the controller (`BikeController.tsx`) is the _adapter_ that connects input, simulation, Rapier and the store. Change physics engine and the bike's feel stays the same.
  3. **Readable:** all the "feel" logic is in roughly 80 lines in one place.
- Pattern names: "functional core, imperative shell" or "ports and adapters".

### 4.8 Folder structure

```
src/
├─ app/            Next.js routes only (layout, page, global CSS). Thin.
├─ components/     Next/React glue that isn't game logic (GameLoader, Kbd)
├─ game/           The whole game. No Next.js imports in here.
│  ├─ core/        Engine-level plumbing: input, events, frame order, debug
│  ├─ bike/        Simulation, controller, model, rider, config
│  ├─ camera/      Ride camera + config
│  ├─ lighting/    Sun, sky, fog + config
│  ├─ audio/       Web Audio engine, synth, event→sound bridge
│  ├─ player/      State machine + system
│  ├─ world/       Ground, test course, ground queries
│  ├─ ui/          HTML overlays shown over the canvas
│  └─ (npc/ gallery/ interaction/ events/: empty folders kept for later phases)
├─ store/          Zustand stores, one per concern
├─ hooks/          Reusable React hooks
├─ utils/          Pure helpers (math, IK), no game knowledge
└─ types/          Shared TS types
```

- **Organised by feature ("bike", "camera"), not by type ("components", "hooks").** Everything about the bike is in one folder. This scales better for games and follows Architecture.md §4.
- Each feature folder follows the same shape: **`*Config.ts` (data) + pure logic `.ts` + React component `.tsx`.**
- `utils/` doesn't import from `game/`, so the dependencies point one way.

---

## 5. Subsystem deep dives

### 5.1 Bike physics (`bikePhysics.ts`): the maths

All smoothing uses `damp(rate, dt) = 1 − e^(−rate·dt)` from `utils/math.ts`.

> **Why `damp` and not `x += (target − x) * 0.1`?** A fixed factor like 0.1 per frame gives _different behaviour at 30, 60 and 144 fps_: on a 144 Hz monitor the bike would steer more than twice as fast. Exponential decay with `dt` reaches the same place in the same real time at any frame rate. This is **frame-rate independence**, and it's a good point to bring up.

**Speed (per frame):**

| Situation                          | Formula                                    | Feel                                                                                           |
| ---------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Pedalling (W)                      | `speed += accel · (1 − (v/vmax)²) · dt`    | Strong pull from a standstill that fades out near 7 m/s (about 25 km/h). No hard ceiling bump. |
| Coasting                           | `speed → 0` by `(rollingResistance + drag· | v                                                                                              | ) · dt` | Constant rolling friction plus air drag proportional to speed: glides a long way, like a real bike. |
| Braking (Space, or S while moving) | `speed → 0` by `6.5 m/s² · dt`             | Firm but not instant.                                                                          |
| S while stopped (`v ≤ 0.25`)       | `speed → −1.5`                             | Slow reverse, walking the bike backwards.                                                      |

`approach(value, target, maxDelta)` moves toward a target **without overshooting**, so braking never flips the bike into reverse.

**Steering: speed-sensitive range**
`maxSteer = lerp(0.55 rad, 0.16 rad, speed/maxSpeed)`
At walking pace the bars turn about 31°; at top speed about 9°. The code comment explains why: _"twitchy handlebars at speed feel stressful"_. That matters for a cozy game.

**Turning: the kinematic bicycle model**
`yawRate = v · tan(steer) / wheelbase`
This is the standard formula used for real vehicle path planning. Consequence: **zero speed means zero turning**, so the bike can't spin on the spot, which keeps it believable.

**Lean: physically motivated**
`lean = atan(v · yawRate / g)`
A real bike in a steady turn leans so gravity balances the centripetal force: `tan θ = v²/(g·r)`, and `v·ω = v²/r`. So the lean is _derived_ from physics, not faked, then clamped to about 20° (`maxLean 0.36`) and smoothed.

**Wheel and crank spin**

- `wheelAngle += (v / wheelRadius) · dt`: rolling without slipping.
- The crank turns only **while pedalling** (`crankAngle += wheelDelta / gearRatio`). When coasting the pedals stop because **the rear hub freewheels**, just like a real bicycle. A small detail that people notice.

**Collision response: `speedAfterBump`**
If Rapier lets only part of the intended move through (you hit a crate), speed drops in proportion. You keep at least 35% (`bumpSpeedRetention`), or more if you were sliding along a wall. Glancing a wall feels like a scrape; hitting it head-on nearly stops you.

### 5.2 `MAX_DT = 1/20`

`dt` is capped at 50 ms. If the tab was in the background for 3 seconds, the next frame's `dt` would be 3 s and the bike would teleport 21 m through walls. Capping it means the game simply runs slower during a hitch instead of breaking.

### 5.3 BikeController + Rapier: why a kinematic body

**The bike is a `kinematicPosition` rigid body with a capsule collider, moved by Rapier's character controller.** It is _not_ a dynamic body pushed by forces.

**Why not a dynamic (fully simulated) bike?**

- A real two-wheeled dynamic body **falls over**. Balancing it needs active control (PID loops, gyroscopic hacks), and the result feels wobbly and unpredictable.
- Physics-driven vehicles jitter, bounce off curbs and flip, which is the opposite of a "relaxed evening ride" (bikeConfig.ts: _"not a simulation, not an arcade racer"_).
- With a kinematic body **we decide exactly how the bike moves** (§5.1) and Rapier only answers "what's in the way?".

**How one frame works:**

1. `stepBike()` produces the desired speed and heading.
2. Desired displacement: `(sin h · v · dt, 0, cos h · v · dt)`.
3. `characterController.computeColliderMovement(collider, desired)` → Rapier sweeps the capsule through the world and returns the **largest collision-free movement**, **sliding along walls** (`setSlideEnabled(true)`).
4. Compare moved vs wanted (a dot product gives the fraction moved) → `speedAfterBump`.
5. `clampToRideArea`: hard circle of radius 150 m so you can't ride off the world. It slides you along the edge instead of stopping you.
6. `y = groundHeight(x, z)`: the bike sticks to the ground through a query function.
7. `setNextKinematicTranslation/Rotation`: tells Rapier where the body will be on the next physics step.
8. Write to the store.

**Collider design details:**

- A capsule lying along the bike (rotated π/2 on X, then yawed by the heading). Capsules slide smoothly along edges; boxes catch on corners.
- **Raised so it never touches the ground** (`centerHeight 0.55`, `radius 0.32`, bottom at 0.23 m). The controller only deals with _walls_. Height comes from `groundHeight()`, which avoids ground-friction jitter and makes slopes in Phase 2 a matter of changing one function.
- `offset 0.02`: Rapier keeps a 2 cm skin gap, which prevents getting stuck inside geometry.
- `setApplyImpulsesToDynamicBodies(false)`: the bike doesn't shove things around. (Phase 4 might turn this on for pushable objects.)
- `userData.tag = "player-bike"` (`BIKE_BODY_TAG`): lets the camera ray ignore the bike's own collider.

**Cleanup:** the character controller is a WASM object, so the effect calls `world.removeCharacterController()` on unmount to free WASM memory. Strict Mode's double mount is what proves this works.

### 5.4 BikeModel (`BikeModel.tsx`, `bikeGeometry.ts`, `bikeMaterials.ts`)

A **procedural** classic Indian roadster (double top tube, rear carrier, chain guard, mudguards, bell, headlamp). It's built from primitives in code, with **no GLTF file**.

- **Why procedural in Phase 1?** No art dependency, nothing to download, and an exact match with the physics geometry (wheel radius, wheelbase and crank length come from the same config). A GLTF model can replace it in Phase 5 without touching physics, because the model only _reads_ telemetry.
- **Transform hierarchy (this is what makes it animate correctly):**
  ```
  root            position (x,y,z), rotation.y = heading
   └─ leanGroup   rotation.z = −lean          (whole bike + rider lean together)
       ├─ frame tubes, saddle, carrier, chain guard
       ├─ rear wheel group      rotation.x = wheelAngle
       ├─ crank group           rotation.x = crankAngle
       │   └─ pedals            rotation.x = −crankAngle (counter-rotate → stay level)
       ├─ head-tube tilt group  rotation.x = −HEAD_ANGLE (0.29 rad ≈ 17°)
       │   └─ steerGroup        rotation.y = steer  (turns around the tilted axis, like a real fork)
       │       ├─ fork, stem, handlebars, bell, lamp
       │       └─ un-tilt group rotation.x = +HEAD_ANGLE → front wheel stands upright
       │           └─ front wheel  rotation.x = wheelAngle
       └─ Rider
  ```
  Steering around a _tilted_ axis is how a real fork works. It's why the handlebars move in a slight arc.
- **Performance decisions:**
  - **One shared `UNIT_TUBE` cylinder geometry** (height 1, radius 1). Every frame tube is that geometry scaled and rotated through the `Tube` component. That's one geometry upload instead of about 20.
  - **Spokes merged** with `mergeGeometries`: 14 spokes become one geometry, giving 1 draw call per wheel instead of 14.
  - **Shared materials** (`bikeMaterials.ts`): one instance per material type, created once at module load. Fewer shader programs and state switches.
  - `castShadow` is set once in `useLayoutEffect` by walking the tree, instead of repeating the prop on every mesh.
- `bikeGeometry.ts` defines key points in **bike-local space** (origin under the pedals, +Z forward, +X to the rider's left). `gripPosition()` and `pedalPosition()` are pure functions shared by the model _and_ the rider IK, so hands and feet always land exactly on the bars and pedals.

### 5.5 Rider (`Rider.tsx`, `utils/limbs.ts`): two-bone IK

The rider wears a kurta, pajama, scarf and sandals, and is posed **procedurally every frame**. There are no animation clips.

- **Two-bone inverse kinematics** (`solveTwoBone`): given hip → pedal target and thigh/shin lengths, find the knee position. It uses the **law of cosines**:
  - `along = (a² − b² + d²) / 2d` (distance along the root→target line)
  - `height = √(a² − along²)` (perpendicular offset of the knee)
  - The **pole vector** says _which way_ the knee bends (forward and up for knees, outward and down for elbows). It's orthogonalised against the limb direction.
  - The distance is clamped to the reachable range so the leg never over-stretches or produces NaN.
- `placeBetween(mesh, a, b)`: stretches a unit cylinder between two joints (position = midpoint, rotation from the up vector to the direction, scale.y = length).
- Each frame: feet follow `pedalPosition(crankAngle)` and hands follow `gripPosition(steer)`, so pedalling and steering animate the body automatically, in sync with the physics.
- Small details: the head turns into the steer (`steer · 0.7`), and there's a slow breathing bob (`sin(t · 1.6) · 4mm`).
- **Why IK and not a rigged GLTF with clips?** A pedalling clip would drift out of sync with the crank as speed changes. IK is **exactly** in sync at any speed, costs only microseconds, and needs no assets.
- Scratch vectors (`joint`, `end`, `target`, `tmpDir`) are allocated once at module level and reused, so **there are no allocations in the frame loop**, which means no garbage-collection stutter.

### 5.6 RideCamera (`RideCamera.tsx`, `cameraConfig.ts`)

A custom third-person follow camera. Features and how each works:

| Feature                                | How                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orbit position**                     | Spherical coordinates around a pivot 1.35 m above the bike (shoulder height): `dir = (−sin yaw·cos pitch, sin pitch, −cos yaw·cos pitch)`.                                                                                                                                                                                                                     |
| **Lag in turns**                       | `yaw` chases `heading + yawOffset` at `yawFollow = 3.2`. The camera swings _after_ the bike turns, which is what makes turns look smooth and cinematic.                                                                                                                                                                                                        |
| **Mouse drag orbit**                   | Drag changes `yawOffset` and `pitch` (pitch clamped between −0.05 and 1.1 rad). Follow rate jumps to 20 while dragging so it feels direct. Uses the `lookSensitivity` and `invertY` settings.                                                                                                                                                                  |
| **Scroll zoom**                        | `preferredDistance` clamped to 2.6–10 m.                                                                                                                                                                                                                                                                                                                       |
| **Auto-recenter**                      | After 1.6 s without dragging, _and only while moving faster than 0.8 m/s_, the offset eases back behind the rider. When stopped it stays where you left it, so you can look around.                                                                                                                                                                            |
| **Collision (never clips into walls)** | A **Rapier raycast** from the pivot outward. The filter skips sensors and the bike's own body (by tag). On a hit, distance = `timeOfImpact − padding`. **It moves in instantly when blocked and eases back out slowly** (`distanceRecover 2.5`). Moving in slowly would let the camera see through the wall, and jumping back out suddenly would look jarring. |
| **Ground clearance**                   | Camera y ≥ `groundHeight + 0.35`, so it never goes under the ground at low pitch.                                                                                                                                                                                                                                                                              |
| **Look-ahead**                         | It looks at a point `speed · 0.22 s` ahead of the bike, so faster riding shows more of the road ahead.                                                                                                                                                                                                                                                         |
| **Speed FOV**                          | FOV widens 55° → 61° at top speed for a gentle sense of speed. `updateProjectionMatrix()` is only called when the FOV actually changes (it's not free).                                                                                                                                                                                                        |
| **First frame snap**                   | On the first frame the camera jumps into place instead of sweeping in from (0, 3, 6).                                                                                                                                                                                                                                                                          |

- **Why reuse Rapier for the camera ray?** The physics world already knows every collider. No second collision system is needed.
- **Why runs after the bike (priority −30 > −40):** the camera must follow _this frame's_ bike position, or it lags a frame behind and jitters.

### 5.7 Lighting (`Lighting.tsx`, `lightingConfig.ts`) and the renderer

- **Static golden hour:** sun low in the west-northwest (y = 0.065, about 4° elevation), warm `#ffb36b`. Dynamic time of day is out of scope (GameplaySystem.md §14).
- **Three-part light setup:**
  - Drei `<Sky/>`: physically based scattering sky (turbidity and Rayleigh tuned for haze).
  - `hemisphereLight`: warm sky above and brown ground bounce below, a cheap global-illumination approximation.
  - `directionalLight`: the sun, with 2048² shadow maps. `shadow-bias` and `normalBias` remove "shadow acne" stripes. A ±40 m orthographic shadow frustum.
  - `fog` from 45 to 280 m in a dusty peach colour: atmosphere, and it hides the edge of the world.
- **Renderer setup** (`Game.tsx` `onCreated`):
  - `ACESFilmicToneMapping`: filmic highlight roll-off, the industry-standard tone mapping, so the bright sun doesn't clip to white.
  - `toneMappingExposure 0.55`: the Sky shader is very bright, so exposure is lowered and the light intensities are raised to compensate (noted in the config).
  - `SRGBColorSpace` output: correct colour display.
  - `shadows="percentage"`: PCF soft shadows. `dpr={[1, 2]}`: sharp on Retina screens but capped at 2× for performance. `powerPreference: "high-performance"` asks for the discrete GPU on laptops.
- The `shadows` setting toggles `castShadow` from `settingsStore`, ready for a graphics menu.

### 5.8 Audio (`AudioEngine.ts`, `synth.ts`, `AudioSystem.tsx`)

- **Web Audio API**, no library and **no audio files**. The bell is **synthesised**.
- **Autoplay policy:** browsers block audio until the user interacts with the page. `installUnlock()` creates or resumes the `AudioContext` on the first `pointerdown` or `keydown`. Before that, `sfxOutput()` returns `null` and sounds are skipped silently.
- **Bus graph:** `sound → sfx gain → master gain → speakers`. Volume changes use `setTargetAtTime` (a 50 ms glide) because setting gain instantly causes audible clicks.
- **The bell sound:** four sine oscillators at **inharmonic** frequency ratios (1, 2.32, 4.25, 6.63). Inharmonic partials are what make a struck metal dome sound metallic rather than like a musical note. Each one has a 4 ms attack and an exponential decay, with higher partials dying faster. Two strikes 130 ms apart give the classic "tring-tring", and a slight random pitch variation stops repeated rings sounding robotic.
- **Graceful failure:** if Web Audio is missing, it logs a warning and the game stays silent (Architecture.md §18). Sound is never required.
- **Architecture:** `AudioSystem` is the _only_ place that turns events into sound (`useGameEvent("bike:bell", ...)`). The bike emits an event and knows nothing about audio.

### 5.9 World: Ground, TestCourse, groundQueries

- **Ground:** a 1200 m plane with a **procedurally drawn canvas texture** (seeded random speckles plus a faint tile border every 8 m). The tile grid is deliberate: on flat ground with no landmarks, you couldn't see that you're moving without it. The collider is a 1 m-thick box whose top surface is at y = 0 (thick colliders are more robust than thin ones).
- **`mulberry32(seed)`:** a seeded PRNG, so the texture (and the village scatter later) looks _the same on every visit_. `Math.random()` would change it on each reload.
- **TestCourse:** throwaway obstacles for Phase 1: crates (box colliders), pillars (convex hull colliders), two walls with a gap (camera collision test), and a dirt ring to ride around. All `fixed` bodies. Phase 2 replaces it.
- **`groundQueries.ts`:** `groundHeight(x, z)` returns 0 for now, and `RIDE_RADIUS = 150`. This is a **seam**: the bike, the camera and future NPCs all call this function, so when Phase 2 adds terrain, only this file changes.

### 5.10 UI overlays

- `LoadingScreen`: a full-screen title with an animated line, which **fades out over 1.2 s** when loading finishes (`AnimatePresence` exit animation).
- `ControlsHint`: bottom-left key list. `pointer-events-none` so it never blocks mouse drag. It fades to 25% while riding (it subscribes only to `bikeStore.moving`). It respects `settings.showHints`.
- `Kbd`: a small reusable key-cap component.

### 5.11 Debug handle (`core/debug.ts`)

`window.__evr = { bike, player, game }` in development only (checked with `NODE_ENV`, and removed from production builds). In the browser console: `__evr.bike.getState().telemetry`, or `__evr.player.getState().transition("paused")`. This makes it fast to test physics and the state machine without adding UI.

---

## 6. Phase 0 vs Phase 1: what was delivered

**Phase 0: Foundation** (commit `72730e2`)
Tooling (TS strict, ESLint, Prettier, Husky), folder structure, InputManager + bindings, typed event bus, Zustand stores (game, player, settings), player state machine, golden-hour lighting, physics ground, a placeholder player, a dev camera.

**Phase 1: Core gameplay** (commit `c3bb145` plus the current uncommitted refinements)
Bicycle simulation (pedal, coast, brake, reverse, speed-sensitive steering, physical lean, freewheel), Rapier character-controller collisions with slide and bump, procedural roadster model, IK rider, third-person ride camera (lag, drag orbit, zoom, recenter, collision, FOV kick), frame-order system, synthesised bell + audio engine, test course, controls hint, loading screen, debug handle.

**Scope decisions:** desktop/PC only (no touch or mobile). Built strictly phase by phase, with no Phase 2+ code written early. The empty `npc/`, `gallery/`, `interaction/` and `events/` folders are placeholders from the architecture spec.

---

## 7. Likely questions, with answers

**Q: Why build a game in React at all? Isn't React slow for games?**
React is slow if you re-render per frame. We don't. React handles scene _structure_ (mount and unmount), and the per-frame work is direct Three.js mutation in `useFrame`, the same cost as plain Three.js. We get component encapsulation, cleanup and shared state with the HTML UI for free.

**Q: Why not use physics forces for the bike?**
A dynamic two-wheeler tips over and needs active balancing, and physics vehicles jitter and flip. The game's goal is relaxed and predictable. We write the motion model ourselves (kinematic bicycle model + derived lean) and use Rapier only for collision queries through its character controller. We control the feel and still get real collisions.

**Q: How do you keep frame rate from affecting gameplay?**
Every rate uses `dt`. Smoothing uses `1 − e^(−k·dt)` instead of a fixed lerp factor, and `dt` is capped at 50 ms so a hitch can't teleport the bike through a wall.

**Q: How do systems communicate without becoming spaghetti?**
Three channels, each with a clear job: **stores** for shared state, the **event bus** for one-off happenings, and the **InputManager** for player intent. Systems never import each other's internals. The bike doesn't know audio exists.

**Q: Why Zustand over Redux or Context?**
We must read state inside the game loop, outside React, and Zustand's `getState()` does that. Selector subscriptions avoid re-renders. It's about 1 KB with no providers. Redux adds ceremony, and Context re-renders every consumer and can't be read outside components.

**Q: How do you avoid re-rendering on every bike movement?**
`telemetry` is changed in place without `set()`, so no subscribers fire. Only `moving` is reactive, and only when it flips.

**Q: How is update order guaranteed?**
Explicit `useFrame` priorities in one file (`frameOrder.ts`): input → bike → camera → render, with "pressed" keys cleared after every reader. Priorities are negative so R3F keeps handling rendering.

**Q: How do the rider's legs stay synced to the pedals?**
Two-bone IK every frame, targeting the exact pedal positions computed from the same `crankAngle` the model uses. There are no animation clips, so it can't drift.

**Q: How does the camera avoid going through walls?**
A Rapier raycast from the rider's shoulders toward the desired camera spot, ignoring the bike's own collider. It moves in instantly if blocked and eases back out slowly.

**Q: Why no 3D model files or audio files?**
Phase 1 is about mechanics. Procedural geometry and synthesised sound have no download cost, need no art pipeline, and match the physics dimensions exactly. The model only reads telemetry, so a GLTF can replace it later without touching gameplay.

**Q: How is memory and performance handled?**
Shared geometries and materials, merged spoke geometry (fewer draw calls), scratch vectors allocated once (no garbage collection in the frame loop), DPR capped at 2, WASM objects freed on unmount, and the FOV matrix updated only when the FOV changes.

**Q: Why is the folder structure by feature?**
Everything about one system (config, pure logic, component) lives together. `src/game/` has no Next.js dependency, and `utils/` has no game dependency, so the dependency direction is clean and the framework could be swapped.

**Q: Why TypeScript 5.9 and not the latest?**
TypeScript 7 and ESLint 10 were too new for Next's and typescript-eslint's tooling. We pinned to the newest versions the ecosystem supports instead of fighting broken tooling.

**Q: What's the purpose of the state machine if only one state is used?**
It enforces "one state at a time" (spec requirement) before photo, gallery and interaction modes arrive. Illegal transitions are rejected by a table, and bike and camera already ignore input outside `cycling`.

---

## 8. Known limitations (say these before someone else does)

Being upfront about tradeoffs is the strongest position in a review.

1. **No automated tests yet.** `bikePhysics.ts` was designed to be unit-testable (it's pure), but there's no test runner set up. Easy next step: Vitest + a few `stepBike` tests (stopping distance, no turning at zero speed, no braking past zero).
2. **The shadow frustum is fixed around the world origin** (±40 m). The sun doesn't follow the bike, so shadows disappear when you ride more than about 40 m from spawn (parts of the test course at z = −48…−62 are already at the edge). Fix: move the light and its target with the bike each frame (planned for polish/optimisation).
3. **Flat ground only.** `groundHeight()` returns 0. The bike doesn't pitch on slopes yet. That's intentional for Phase 1, and the seam is ready for Phase 2.
4. **The camera ray only checks one line** (the centre), so a thin pole just off that line can briefly clip. A sphere cast is the usual upgrade.
5. **The ride boundary is an invisible circle** (150 m). Phase 2 should add visual boundaries (fields, walls).
6. **Next.js is barely used yet.** Only one route. The case for it is future routes and deployment (see §2.1), not current needs.
7. **The current Phase 1 refinements are uncommitted** (30 modified files in the working tree as of writing).

---

## 9. Glossary

| Term                        | Meaning                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| **R3F**                     | React Three Fiber, a React renderer for Three.js                                               |
| **`useFrame`**              | R3F hook; the callback runs every animation frame                                              |
| **Priority (useFrame)**     | Run order; > 0 takes over rendering, so we use negatives                                       |
| **Kinematic body**          | A physics body you move yourself; it isn't affected by forces, but it collides                 |
| **Dynamic body**            | A body fully simulated by forces and gravity                                                   |
| **Character controller**    | Rapier utility that sweeps a collider and returns a collision-free, sliding movement           |
| **Raycast / timeOfImpact**  | Shoot a ray and get the distance to the first hit                                              |
| **Two-bone IK**             | Solve the middle joint (knee/elbow) from root, target and two lengths                          |
| **Pole vector**             | The direction the IK middle joint bends toward                                                 |
| **Kinematic bicycle model** | `yawRate = v·tan(δ)/L`, the standard simple vehicle-turning model                              |
| **Frame-rate independence** | Same behaviour at any FPS, using `dt` and exponential damping                                  |
| **Transient update**        | Changing store data in place without notifying subscribers                                     |
| **Edge detection (input)**  | "Pressed this frame" vs "held"                                                                 |
| **Tone mapping (ACES)**     | Compressing HDR lighting into displayable range with filmic roll-off                           |
| **PCF shadows**             | Percentage-closer filtering, which gives soft shadow edges                                     |
| **DPR**                     | Device pixel ratio; 2 on Retina screens                                                        |
| **WASM**                    | WebAssembly; Rapier's Rust code compiled to run in the browser                                 |
| **Inharmonic partials**     | Overtones that aren't integer multiples of the base frequency, which make metal sound metallic |
| **Seeded PRNG**             | A random generator that gives the same sequence for the same seed                              |
