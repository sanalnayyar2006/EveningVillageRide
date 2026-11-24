# Product Requirements Document (PRD)

# Evening Village Ride

**Version:** 1.0  
**Status:** Draft  
**Platform:** Web (Desktop + Mobile)  
**Engine:** Three.js + React Three Fiber  
**Genre:** Cozy Exploration Experience

---

# 1. Executive Summary

**Evening Village Ride** is a cozy 3D web experience where players ride a bicycle through a peaceful Indian village during golden hour, discovering beautiful moments and capturing them through an immersive in-game phone camera.

Unlike traditional games, there are no enemies, timers, scores, or failure states. The experience focuses on exploration, atmosphere, photography, and nostalgia.

The core emotion is simple:

> **Slow down. Explore. Capture memories.**

---

# 2. Product Vision

Create a relaxing interactive experience that showcases the beauty of an Indian village through exploration and photography.

The project should feel like taking an evening ride during childhood—hearing birds, seeing the sunset over fields, watching villagers return home, and preserving those moments with a camera.

The experience should leave players feeling calm rather than challenged.

---

# 3. Problem Statement

Most browser-based 3D games focus on action, combat, or competition.

There are very few polished, relaxing web experiences that combine:
- High-quality visuals
- Smooth exploration
- Immersive photography
- Nostalgic environments
- Modern web technologies

This project aims to fill that gap.

---

# 4. Goals

## Primary Goals

- Create a visually beautiful Three.js experience.
- Build a polished bicycle exploration system.
- Make photography the primary interaction.
- Deliver a relaxing gameplay loop.
- Showcase modern web engineering and game development skills.
- Create a portfolio project that stands out.

---

## Secondary Goals

- Mobile compatibility
- High performance
- Shareable screenshots
- Expandable architecture for future updates

---

# 5. Non-Goals

The project intentionally avoids:

- Combat
- Weapons
- Health systems
- Resource grinding
- Survival mechanics
- Complex quests
- Large open worlds
- Multiplayer (initial release)
- Procedural infinite generation

The focus is quality over quantity.

---

# 6. Target Audience

### Primary

- Cozy game players
- Casual gamers
- Photography enthusiasts
- Players who enjoy exploration

### Secondary

- Recruiters
- Game studios
- Software engineering recruiters
- Three.js developers
- Students learning web graphics

---

# 7. Core Experience

The player begins on a bicycle at the entrance of a peaceful village.

There is no tutorial beyond a few subtle prompts.

The player naturally explores roads, fields, temples, ponds, and small streets while listening to ambient sounds.

Whenever something catches their eye, they stop, raise their phone, frame the scene, and capture a memory.

Over time, they build a scrapbook filled with meaningful moments from their ride.

---

# 8. Core Gameplay Loop

```text
Ride

↓

Notice something interesting

↓

Stop bicycle

↓

Open phone camera

↓

Frame the shot

↓

Capture photo

↓

Save memory

↓

Continue exploring
```

This loop should remain enjoyable without requiring combat, missions, or grinding.

---

# 9. Core Pillars

## 1. Exploration

Players should always feel encouraged to take different roads and investigate interesting locations.

Exploration is self-directed.

---

## 2. Atmosphere

The environment should feel alive through:

- Lighting
- Ambient audio
- NPC routines
- Wildlife
- Weather (future)
- Wind
- Environmental storytelling

---

## 3. Photography

Photography is the hero mechanic.

Taking a picture should feel rewarding through smooth animation, camera transitions, and a satisfying gallery experience.

---

## 4. Polish

The project should prioritize polish over content quantity.

Examples:

- Smooth animations
- High-quality transitions
- Responsive controls
- Consistent UI
- Good audio feedback

---

# 10. Core Features

## Bicycle

The player can:

- Ride
- Brake
- Steer
- Ring the bell
- Look around while riding

The bicycle should feel responsive but relaxed rather than arcade-fast.

---

## Camera Phone

Players can open a realistic smartphone camera.

Flow:

1. Stop bicycle
2. Pull phone out
3. Camera app opens
4. Switch into photo mode
5. Frame scene
6. Press shutter
7. Save photo
8. Return to gameplay

This interaction should become the signature feature of the project.

---

## Gallery

Every captured image becomes part of the player's personal album.

Each image stores:

- Thumbnail
- Time
- Location
- Weather (future)
- Date
- Optional caption (future)

---

# 11. Emotional Design Goals

The game should evoke:

- Peace
- Curiosity
- Nostalgia
- Warmth
- Comfort
- Wonder

It should never create stress.

---

# 12. World Overview

The village is intentionally compact.

Rather than creating a huge map, every location should be memorable.

Potential landmarks include:

- Temple
- Village pond
- Tea stall
- Banyan tree
- Railway crossing
- Market
- Fields
- Orchard
- Bridge
- Water tank
- School
- Bus stop

---

# 13. Dynamic World

The world should feel alive.

Examples:

- Birds flying overhead
- Cows crossing roads
- Children playing cricket
- Temple bells
- Leaves blowing in the wind
- Villagers walking home
- Fireflies appearing near sunset
- Trains passing occasionally

Players should discover moments naturally rather than triggering scripted events.

---

# 14. Success Metrics

The project is successful if players:

- Spend time exploring instead of rushing.
- Frequently use the camera.
- Enjoy revisiting their photo gallery.
- Share screenshots from the experience.
- Describe the experience as relaxing or beautiful.

From a portfolio perspective, success also means demonstrating:

- Real-time 3D rendering
- Camera systems
- Animation
- State management
- Asset optimization
- Clean architecture
- Responsive UI
- Performance optimization

---

# 15. Future Expansion

Potential updates include:

- Dynamic weather
- Day/night cycle
- Seasonal themes
- Festivals
- Wildlife photography challenges
- Photo filters
- Cloud galleries
- Daily discoveries
- NPC schedules
- Additional villages

These are intentionally outside the MVP scope.

---

# 16. MVP Scope

The first playable version should include:

- One village
- One bicycle
- Third-person camera
- Phone camera system
- Photo capture
- Gallery
- Ambient audio
- Basic NPCs
- One complete exploration loop

Everything else is optional until this experience feels polished.

---

# 17. Product Philosophy

Every feature should support one central idea:

> **The player isn't collecting points—they're collecting memories.**

Whenever a new feature is proposed, ask:

- Does it encourage exploration?
- Does it improve atmosphere?
- Does it make photography more meaningful?
- Does it keep the experience peaceful?

If the answer is no, it probably doesn't belong in the project.