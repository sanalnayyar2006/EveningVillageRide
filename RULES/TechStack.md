# Technology Stack

# Evening Village Ride

**Version:** 1.0

---

# 1. Philosophy

Technology choices should prioritize:

- Performance
- Maintainability
- Developer Experience
- Scalability
- Modern Web Standards
- Long-term support

Every dependency must have a clear purpose. Avoid adding libraries that duplicate existing functionality.

---

# 2. Frontend

## Framework

### Next.js

**Purpose**

- Application framework
- Routing
- Asset handling
- Production optimization
- Static generation
- Deployment

**Reason**

Provides an excellent foundation for modern web applications and integrates well with React Three Fiber.

---

## UI Library

### React

**Purpose**

- User Interface
- Component Architecture
- State-driven rendering

---

## Language

### TypeScript

Strict mode enabled.

Purpose

- Type safety
- Better tooling
- Maintainability
- Refactoring support

No JavaScript files should exist in the project unless absolutely necessary.

---

# 3. 3D Rendering

## Three.js

Purpose

- Rendering engine
- Materials
- Cameras
- Lighting
- Geometry
- Render targets
- Post-processing foundation

---

## React Three Fiber

Purpose

- Declarative Three.js
- React integration
- Component architecture

This should be the primary way of building scenes.

---

## Drei

Purpose

Utilities such as:

- Environment
- Controls
- Helpers
- Loaders
- Performance utilities
- Gizmos

Only use components that reduce boilerplate without hiding important rendering logic.

---

# 4. Physics

## React Three Rapier

Purpose

- Physics world
- Rigid bodies
- Collision detection
- Character interactions

Initial use should be lightweight. Avoid simulating unnecessary objects.

---

# 5. State Management

## Zustand

Purpose

- Global game state
- Player
- Camera
- Gallery
- Settings
- Audio
- World state

Use multiple focused stores instead of a single monolithic store.

---

# 6. Styling

## Tailwind CSS

Purpose

- UI styling
- Layout
- Responsive design

All menus, overlays, and gallery interfaces should use Tailwind.

---

# 7. Animation

## Framer Motion

Purpose

- Menus
- Gallery transitions
- UI animations

Not intended for 3D object animation.

---

## React Spring (Optional)

Purpose

Smooth interpolation for selected 3D interactions if React state-driven animation becomes cumbersome.

Use only where it simplifies implementation.

---

# 8. Asset Loading

## GLTF

Primary 3D asset format.

Advantages

- Compression
- Materials
- Animations
- Industry standard

---

## DRACO Compression

Compress geometry before shipping assets.

---

## KTX2 / Basis Textures

Use compressed GPU textures where possible.

Benefits

- Faster loading
- Lower memory usage
- Better mobile performance

---

# 9. Audio

Use positional audio for immersive environmental sound.

Examples

- Temple bells
- Birds
- Water
- Wind
- Train
- Bicycle bell

Audio files should be compressed appropriately for the web.

---

# 10. Image Capture

Photography system should use:

Three.js Render Target

↓

Canvas Extraction

↓

Image Encoding

↓

Metadata

↓

Gallery

Avoid relying on browser screenshots.

The captured image should come directly from the rendering pipeline.

---

# 11. Storage

## MVP

Local Storage

Store

- Settings
- Gallery metadata
- Preferences

---

## IndexedDB

Store

- Captured photos
- Larger binary assets

This is more suitable than Local Storage for image data.

---

## Future

Supabase Storage

Cloud synchronization

---

# 12. Backend (Future)

## Supabase

Potential responsibilities

- Authentication
- Cloud save
- User profiles
- Shared galleries
- Analytics

Backend is **not required** for the MVP.

---

# 13. Deployment

## Vercel

Purpose

- Hosting
- CI/CD
- Preview deployments

---

# 14. Package Manager

pnpm

Reasons

- Faster installs
- Efficient disk usage
- Workspace support
- Deterministic dependency management

---

# 15. Code Quality

## ESLint

Maintain consistent code quality.

---

## Prettier

Automatic formatting.

---

## Husky

Git hooks.

Run:

- lint
- type check
- tests (future)

before commits.

---

# 16. Git Strategy

Main Branch

↓

Feature Branches

↓

Pull Requests

↓

Merge

Branch naming examples:

```text
feature/bike-controller

feature/photo-mode

feature/gallery

feature/village-world

feature/audio-system

fix/camera-jitter

refactor/state-management
```

---

# 17. Performance Strategy

Rendering goals

Desktop

- 60 FPS

Mobile

- 30 FPS minimum

Optimization techniques

- Instanced Meshes
- LOD
- Frustum Culling
- Texture Compression
- Lazy Asset Loading
- Suspense
- Efficient React rendering
- Minimize re-renders

Performance should be considered during development rather than postponed until the end.

---

# 18. Recommended Folder Layout

```text
src/

app/
components/

game/
│
├── bike/
├── camera/
├── player/
├── phone/
├── photography/
├── gallery/
├── world/
├── npc/
├── audio/
├── weather/
├── interactions/
└── lighting/

hooks/
store/
types/
utils/
lib/
assets/
```

---

# 19. Development Tools

Recommended tools

- VS Code
- Blender
- Figma
- GitHub
- Vercel
- Claude Code
- Cursor (optional)
- React DevTools
- Three.js Inspector
- Browser Performance Profiler

---

# 20. Future Integrations

Potential additions after MVP

- Supabase Auth
- Cloud Gallery
- Daily Challenges
- Analytics
- Progressive Web App (PWA)
- Offline Mode
- Multiplayer Ride Sessions

These should remain optional and must not influence the MVP architecture.

---

# 21. Dependency Guidelines

Before introducing a new package, ask:

1. Can this be solved with the current stack?
2. Does it significantly reduce complexity?
3. Is it actively maintained?
4. Does it increase bundle size unnecessarily?
5. Is there a simpler alternative?

If the answer to these questions is unclear, avoid adding the dependency.

---

# 22. Technology Philosophy

The technology should remain largely invisible to the player.

Every technical decision should improve one or more of the following:

- Performance
- User experience
- Maintainability
- Developer productivity
- Long-term scalability

The objective is to demonstrate that modern web technologies can deliver a polished, high-quality interactive 3D experience comparable to lightweight native games.