# Architecture Document

# Evening Village Ride

**Version:** 1.0  
**Status:** Draft

---

# 1. Purpose

This document defines the technical architecture of **Evening Village Ride**.

Its goals are:

- Keep the project modular.
- Make every system independent and reusable.
- Separate game logic from rendering.
- Make future expansion straightforward.
- Optimize for maintainability and performance.

The architecture should resemble a professional game project rather than a small demo.

---

# 2. Core Principles

## Modular

Every gameplay system should exist independently.

Example:

- Bike system should not know about Gallery.
- Gallery should not know about NPCs.
- NPCs should not know about Weather.

Communication should happen through shared state or events.

---

## Data Driven

Gameplay should rely on configuration instead of hardcoded values.

Example:

```ts
{
    id: "temple",
    position: [20,0,-35],
    photoSpots: [...]
}
```

instead of

```ts
if(player.position.x > ...)
```

---

## Component Based

Every object should be composed from reusable pieces.

Example

Bike

- BikeController
- BikePhysics
- BikeAnimation
- BikeAudio

instead of one giant Bike class.

---

## Performance First

Assume every feature must support:

- Desktop
- Mobile
- Low-end laptops

Avoid unnecessary rendering.

---

# 3. High Level Architecture

```text
User Input

↓

Player Controller

↓

Gameplay Systems

↓

State Management

↓

Rendering Layer

↓

UI Layer

↓

Persistence Layer
```

Each layer has a single responsibility.

---

# 4. Folder Structure

```text
src/

app/
components/

game/

assets/

core/

systems/

store/

hooks/

lib/

types/

utils/
```

---

## Detailed Structure

```text
src/

game/

camera/
bike/
player/
phone/
photography/
gallery/
world/
npc/
weather/
audio/
lighting/
interaction/
events/
save/
ui/
```

Each folder owns one gameplay system.

---

# 5. Core Systems

The project is divided into independent systems.

## Player System

Responsible for

- Player state
- Movement
- Interactions
- Position

Does NOT control camera.

---

## Bike System

Responsible for

- Physics
- Steering
- Speed
- Bell
- Suspension

---

## Camera System

Responsible for

- Third person camera
- Camera smoothing
- Camera collision
- Photo mode
- Transitions

---

## Phone System

Responsible for

- Phone animations
- Camera UI
- Phone opening
- Phone closing

---

## Photography System

Responsible for

- Capturing photos
- Metadata
- Render target
- Saving images

---

## Gallery System

Responsible for

- Viewing photos
- Album
- Metadata
- Delete
- Download

---

## NPC System

Responsible for

- AI
- Walking
- Daily routines
- Animations

---

## Audio System

Responsible for

- Ambient sounds
- Positional audio
- Music
- Volume management

---

## World System

Responsible for

- Loading world
- Spawn points
- Landmarks
- Interactions

---

## Save System

Responsible for

- Local save
- Player progress
- Gallery metadata
- Settings

---

# 6. Rendering Architecture

Rendering should stay separate from gameplay.

Game logic

↓

React State

↓

Three.js Scene

↓

GPU

Never mix gameplay logic inside rendering components.

---

# 7. State Management

Use Zustand.

Multiple stores.

Example

```text
PlayerStore

BikeStore

CameraStore

PhotoStore

GalleryStore

WorldStore

SettingsStore

AudioStore
```

Avoid one giant global store.

---

# 8. Event Flow

Instead of systems directly calling each other.

Example

BAD

Bike

↓

Gallery

GOOD

Bike

↓

Event

↓

Photo System

↓

Gallery

This keeps coupling low.

---

# 9. World Structure

World

↓

Regions

↓

Landmarks

↓

Photo Spots

↓

Interactions

Example

Village

Temple

Temple Bell

Photo Spot

NPC

---

# 10. Scene Graph

```text
Scene

Environment

Terrain

Roads

Buildings

Trees

Props

NPCs

Animals

Player

Bike

Camera

Lights

Particles
```

Every object should remain isolated.

---

# 11. Camera Modes

### Normal

Third Person

---

### Photo Mode

First Person

---

### Future

Drone Camera

Cinematic Camera

Free Camera

The Camera Manager controls transitions.

---

# 12. Input System

Keyboard

Mouse

Touch

Future:

Gamepad

All inputs should pass through one Input Manager.

Never read keyboard input directly inside gameplay systems.

---

# 13. Interaction System

Player

↓

Looks at object

↓

Object becomes interactable

↓

Press Key

↓

Interaction executes

Example

Tea Stall

Bench

Temple Bell

Bridge

Photo Spot

---

# 14. Asset Pipeline

Assets

↓

Optimization

↓

Compression

↓

GLTF

↓

Loading Manager

↓

Scene

Every asset should be optimized before import.

---

# 15. Loading Pipeline

Game Start

↓

Load Config

↓

Load Assets

↓

Load World

↓

Spawn Player

↓

Start Audio

↓

Enable Input

↓

Gameplay Begins

---

# 16. Save Pipeline

Photo Taken

↓

Generate Metadata

↓

Save Image

↓

Save Metadata

↓

Update Gallery

↓

Persist to Storage

---

# 17. Performance Strategy

Use

- Instanced Meshes
- LOD
- Frustum Culling
- Texture Compression
- Lazy Loading
- Suspense
- Asset Streaming

Avoid

- Thousands of draw calls
- Massive textures
- Unnecessary physics bodies
- Heavy post-processing

---

# 18. Error Handling

Every system should fail gracefully.

Example

Photo save fails

↓

Notify player

↓

Keep game running

Never crash gameplay because one system failed.

---

# 19. Coding Standards

- Strict TypeScript
- Functional Components
- Reusable Hooks
- Small Components
- Composition over inheritance
- SOLID Principles
- Clean Architecture
- No duplicated logic

---

# 20. System Dependencies

```text
Input

↓

Player

↓

Bike

↓

Camera

↓

Photography

↓

Gallery

↓

Save
```

Dependencies should always flow downward.

Lower-level systems must never depend on higher-level systems.

---

# 21. Future Scalability

The architecture should support future additions without major refactoring, including:

- Multiplayer
- Dynamic weather
- Seasons
- NPC schedules
- Festivals
- Additional villages
- Cloud save
- Photo sharing
- Achievements
- Accessibility features

These should plug into existing systems rather than require rewriting them.

---

# 22. Architecture Philosophy

Every new feature should answer three questions before implementation:

1. Which system owns this feature?
2. Which existing systems should it communicate with?
3. Can it be reused elsewhere?

If a feature doesn't have a clear owner or introduces tight coupling, redesign it before implementation.

The objective is to build a clean, scalable codebase that demonstrates professional software engineering practices as much as game development.