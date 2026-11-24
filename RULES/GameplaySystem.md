# Gameplay Systems Specification

# Evening Village Ride

**Version:** 1.0

---

# Purpose

This document defines every gameplay system in the project, how each system behaves, and how systems interact with one another.

Each system should have:

- A single responsibility
- Clear ownership
- Minimal dependencies
- Independent testing capability

---

# Gameplay Loop

```text
Explore

↓

Discover

↓

Observe

↓

Capture

↓

Collect Memories

↓

Continue Exploring
```

Everything in the game should support this loop.

---

# 1. Player System

## Purpose

Represents the player within the world.

---

## Responsibilities

- Movement
- Interaction
- Camera requests
- Bike mounting
- Input handling
- Trigger interactions

---

## Player States

```text
Idle

Walking (future)

Cycling

Stopping

Taking Photo

Viewing Gallery

Paused
```

Only one state may be active at any time.

---

# 2. Bicycle System

## Purpose

Primary movement mechanic.

---

## Features

- Accelerate
- Brake
- Steering
- Lean while turning
- Reverse slowly
- Bicycle bell

---

## Desired Feel

Not realistic simulation.

Not arcade.

Think:

> Relaxed evening ride.

Movement should feel smooth and forgiving.

---

## Future Ideas

- Mud slows movement
- Wet roads
- Gravel paths
- Downhill speed increase

---

# 3. Camera System

The camera is one of the most important systems.

---

## Modes

### Ride Camera

Default camera.

- Third person
- Smooth follow
- Camera lag
- Orbit
- Collision avoidance

---

### Photo Camera

Activated when phone opens.

Player becomes stationary.

Switch to first-person.

Allow:

- Pan
- Tilt
- Zoom (limited)

---

### Gallery Camera

UI only.

Gameplay paused.

---

# Camera Transitions

All transitions should animate.

Never instantly switch cameras.

---

# 4. Phone System

The phone is the primary interaction device.

---

## Open Flow

```text
Press C

↓

Bike slows

↓

Bike stops

↓

Character reaches pocket

↓

Phone appears

↓

Camera app opens

↓

Photo mode begins
```

---

## Close Flow

```text
Exit

↓

Phone lowers

↓

Phone disappears

↓

Ride resumes
```

---

# Future Apps

Potential future apps:

- Gallery
- Settings
- Music
- Map
- Journal

Only Camera is required for MVP.

---

# 5. Photography System

The hero mechanic.

---

## Enter Photo Mode

Requirements

- Bike stationary
- Player not interacting
- Phone available

---

## Camera Controls

- Look around
- Limited zoom
- Frame scene
- Capture

---

## Capture Flow

```text
Shutter

↓

Flash

↓

Freeze Frame

↓

Generate Image

↓

Create Metadata

↓

Save

↓

Gallery Updated
```

---

## Metadata

Each photo stores:

- ID
- Date
- Time
- Position
- Landmark
- Thumbnail
- Full Resolution Image

Future

- Weather
- Season
- Camera Filter

---

# 6. Gallery System

Purpose

View memories.

---

## Features

Grid

↓

Select

↓

View

↓

Download

↓

Delete

---

## Future

Favorite

Albums

Share

Cloud Sync

---

# 7. Discovery System

Purpose

Encourage exploration.

---

Instead of collectibles,

Players discover:

- Places
- Views
- Animals
- Events

---

Examples

Temple

Old Tree

Sunset

Bridge

Train

Bird

Rainbow

---

These discoveries should naturally happen while exploring.

---

# 8. Landmark System

Every landmark should feel unique.

Example

Temple

- Bell audio
- Pigeons
- Incense
- Prayer sounds

Pond

- Water reflections
- Fish
- Ducks

Tea Stall

- Steam
- Chai cups
- People talking

Every location should have its own identity.

---

# 9. NPC System

NPCs make the village feel alive.

---

Examples

Farmer

Walks to field.

Returns home.

---

Children

Play cricket.

Ride bicycles.

Fly kites.

---

Tea Seller

Makes tea.

Talks with villagers.

---

Elder

Walks slowly.

Sits on bench.

Feeds birds.

---

NPCs should never stand still forever.

---

# 10. Animal System

Animals should behave naturally.

Examples

Cow

Walk

Eat

Cross road

---

Dog

Sleep

Run

Bark

Follow player briefly

---

Bird

Fly

Land

Take off

---

Butterflies

Random movement.

Stay near flowers.

---

# 11. Ambient Event System

Creates memorable moments.

Random events include:

- Temple bells
- Passing train
- Wind gust
- Leaves blowing
- Birds flying together
- Kite in sky
- Rain begins
- Fireflies appear

Events should feel organic, not scripted.

---

# 12. Interaction System

Player can interact with select objects.

Examples

Temple Bell

Ring bell.

---

Bench

Sit.

---

Tea Stall

Drink chai.

---

Swing

Swing gently.

---

Bridge

Lean on railing.

Observe scenery.

Interactions should be short and immersive.

---

# 13. Audio System

Audio should respond to player location.

Examples

Near temple

↓

Bell louder

Prayer audible

---

Near river

↓

Water louder

Birds quieter

---

Near market

↓

Crowd ambience

Cycles

Voices

Audio transitions should fade smoothly.

---

# 14. Time System

MVP

Static golden hour.

Future

Dynamic sunset.

Night.

Morning.

Seasonal lighting.

---

# 15. Weather System

Future

Sunny

Rain

Fog

Cloudy

Monsoon

Weather should affect:

Lighting

Audio

Particles

Atmosphere

---

# 16. Achievement System (Future)

Examples

First Photograph

Temple Explorer

Village Photographer

Golden Hour

Bird Watcher

Train Spotter

Completionist

---

# 17. Save System

Automatically saves

Player Position

Gallery

Photos

Discoveries

Settings

No manual save required.

---

# 18. UI System

Minimal.

Primary screens

- Main Menu
- Pause
- Gallery
- Settings

HUD should remain unobtrusive.

---

# 19. Accessibility

Support

- Adjustable camera sensitivity
- Volume controls
- Subtitle support (future)
- Color-safe UI
- Keyboard navigation

---

# 20. System Communication

```text
Input

↓

Player

↓

Bike

↓

Camera

↓

Phone

↓

Photography

↓

Gallery