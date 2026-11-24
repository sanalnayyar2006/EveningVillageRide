# Implementation Plan

# Evening Village Ride

**Version:** 1.0  
**Development Approach:** Vertical Slice → Polish → Expand

---

# 1. Philosophy

This project will **not** be developed feature-by-feature.

Instead, it will be built as a series of **vertical slices**, where each milestone results in a playable experience.

Each phase should end with:

- Working gameplay
- Clean code
- No broken systems
- Refactoring complete
- Git commit
- Documentation updated

**Rule: Never continue building on unstable foundations.**

---

# 2. Development Roadmap

```text
Phase 0
↓

Project Foundation

↓

Phase 1

Core Gameplay

↓

Phase 2

Village World

↓

Phase 3

Photography

↓

Phase 4

Living World

↓

Phase 5

Polish

↓

Phase 6

Optimization

↓

Release v1.0
```

---

# Phase 0 — Foundation

## Goal

Build the technical foundation.

---

### Setup

- Create Next.js project
- Configure TypeScript
- Configure ESLint
- Configure Prettier
- Install Three.js
- Install React Three Fiber
- Install Drei
- Install Rapier
- Install Zustand
- Install Tailwind
- Setup project aliases
- Configure Git
- Configure Husky
- Configure lint-staged

---

### Folder Structure

Create complete architecture.

```
src/

game/
store/
hooks/
types/
lib/
components/
assets/
```

---

### Initial Scene

Create

- Canvas
- Camera
- Lights
- Ground
- Sky
- Player placeholder

Deliverable

A working empty scene.

---

# Phase 1 — Core Gameplay

## Goal

Player can ride a bicycle.

---

### Player

Implement

- Spawn
- Movement
- Input
- Rotation

---

### Bike

Implement

- Acceleration
- Braking
- Steering
- Lean
- Camera follow

---

### Camera

Implement

- Smooth follow
- Rotation
- Zoom
- Collision
- Camera lag

---

### Controls

Desktop

- WASD
- Mouse
- Bell

Deliverable

Ride around freely.

---

# Phase 2 — Village

## Goal

Create one beautiful village.

---

### Terrain

Build

- Roads
- Grass
- River
- Pond
- Hills

---

### Landmarks

Build

- Temple
- Tea Stall
- Banyan Tree
- School
- Market
- Bridge
- Railway Crossing
- Fields
- Bus Stop

---

### Vegetation

Add

- Trees
- Bushes
- Flowers
- Crops

---

### Props

- Benches
- Lamps
- Signs
- Wells
- Fences
- Water pumps

Deliverable

A complete village to explore.

---

# Phase 3 — Photography System

## Goal

Build the hero mechanic.

---

### Phone

Implement

Phone animation

↓

Raise phone

↓

Camera app opens

↓

Switch camera

---

### Camera Mode

Implement

- First-person mode
- Camera controls
- Focus
- Shutter
- Exit

---

### Photo Capture

Build

- Render target
- Image generation
- Save image
- Metadata

---

### Gallery

Implement

- Album
- Thumbnail grid
- Viewer
- Delete
- Download

Deliverable

Players can build a personal photo album.

---

# Phase 4 — Living World

## Goal

Make the world feel alive.

---

### NPCs

Create

- Farmers
- Children
- Tea seller
- Villagers

---

### Animals

Create

- Cows
- Dogs
- Goats
- Birds
- Butterflies

---

### Ambient Events

Implement

- Birds flying
- Temple bells
- Leaves moving
- Wind
- Passing train
- Cricket match
- Evening lighting

Deliverable

The village feels active even without the player.

---

# Phase 5 — Polish

## Goal

Increase immersion.

---

### Visual Polish

Improve

- Lighting
- Shadows
- Bloom
- Fog
- Particles
- Water
- Reflections

---

### Animation

Improve

- Bike
- Player
- Phone
- Camera transitions

---

### Audio

Add

- Ambient loops
- Positional audio
- Bell
- Water
- Wind
- Birds
- Temple bells

---

### UI

Refine

- Menus
- Gallery
- Settings
- HUD
- Transitions

Deliverable

A polished vertical slice suitable for portfolio presentation.

---

# Phase 6 — Optimization

## Goal

Production quality performance.

---

### Rendering

Optimize

- Draw calls
- Instancing
- LOD
- Frustum culling

---

### Assets

Optimize

- Textures
- Meshes
- Materials
- Animations

---

### Performance

Target

Desktop

- 60 FPS

Mobile

- 30+ FPS

---

### Code

- Remove dead code
- Refactor
- Add comments
- Improve architecture
- Improve typings

Deliverable

Release candidate.

---

# 3. MVP Checklist

## Core Gameplay

- [ ] Ride bicycle
- [ ] Smooth camera
- [ ] Village environment
- [ ] Phone animation
- [ ] Camera mode
- [ ] Photo capture
- [ ] Save photos
- [ ] Gallery
- [ ] Ambient audio

---

## Polish

- [ ] Lighting
- [ ] Particle effects
- [ ] NPCs
- [ ] Wildlife
- [ ] Water
- [ ] UI transitions

---

# 4. Git Strategy

Every completed task should end with:

- Code review
- Refactor
- Test
- Documentation update
- Commit

Suggested commit style:

```
feat(bike): implement bicycle controller

feat(camera): add smooth follow camera

feat(photo): implement phone camera mode

feat(world): build temple landmark

fix(camera): resolve clipping issue

refactor(store): split global store
```

---

# 5. Milestones

## Milestone 1

Ride a bicycle.

---

## Milestone 2

Explore a complete village.

---

## Milestone 3

Capture photographs.

---

## Milestone 4

Experience a living world.

---

## Milestone 5

Portfolio-ready release.

---

# 6. Definition of Done

A task is complete only if:

- Feature works correctly.
- TypeScript has no errors.
- ESLint passes.
- Performance is acceptable.
- Documentation is updated.
- Code follows architecture.
- No duplicated logic.
- Feature integrates cleanly with existing systems.

---

# 7. Risks

## Scope Creep

Risk:
Adding too many landmarks, mechanics, or side activities.

Mitigation:
Keep the MVP centered on **cycling + photography**.

---

## Performance

Risk:
Large scenes reduce browser performance.

Mitigation:

- Instancing
- LOD
- Lazy loading
- Optimized assets

---

## Asset Quality

Risk:
Mixed visual styles.

Mitigation:
Use a single stylized art direction throughout.

---

# 8. Post-v1 Roadmap

Potential updates after release:

- Dynamic weather
- Seasons
- Festivals
- Wildlife photography challenges
- More villages
- Cloud gallery
- Daily photo prompts
- Accessibility improvements
- Mobile gesture controls

These are enhancements, not MVP requirements.

---

# 9. Guiding Principle

The project should always prioritize **quality over quantity**.

If faced with a choice between:
- adding another feature, or
- making an existing interaction feel better,

always choose the second.

A memorable five-minute experience is more valuable than a large but unfinished game.