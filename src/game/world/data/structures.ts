/**
 * Placement of hand-built landmark pieces. Visual components and the physics
 * colliders both read these, so they can never drift apart.
 */

export const GATE = { z: 95, halfSpan: 4.4, pillar: 0.9, height: 5.4 } as const;

export const BUS_STOP = { x: 10.2, z: 84, length: 4.4, depth: 2.2, height: 2.6 } as const;

export const BANYAN = {
  x: -17,
  z: 15,
  platformRadius: 4.3,
  platformHeight: 0.5,
  trunkRadius: 1.3,
  canopyRadius: 13,
} as const;

export const BENCHES = [
  { id: "banyanBench", x: -10.2, z: 11.5, rot: -0.5 },
  { id: "pondBench", x: -27.5, z: 22.5, rot: -Math.PI / 2 + 0.3 },
  { id: "teaBench1", x: 6.6, z: -14.2, rot: 0 },
] as const;

export const HAND_PUMP = { x: -8.8, z: 21 } as const;
export const WELL = { x: -29, z: 5, radius: 1.3 } as const;

export const TEA_STALL = { x: 10.5, z: -11.5, w: 3.6, d: 2.6, h: 2.5 } as const;

export const MARKET_STALLS = [
  { x: 20, z: -6.8, canopy: "#e76f51" },
  { x: 25.5, z: 6.8, canopy: "#f4a261" },
  { x: 31, z: -6.8, canopy: "#2a9d8f" },
  { x: 36.5, z: 6.8, canopy: "#e9c46a" },
  { x: 42, z: -6.8, canopy: "#d62f6a" },
  { x: 20.5, z: 7, canopy: "#8ab17d" },
] as const;
export const STALL_SIZE = { w: 3.4, d: 2.2 } as const;

export const TEMPLE = {
  x: -50,
  z: -42,
  plinth: { w: 11, d: 11, h: 0.7 },
  sanctum: { w: 4.6, d: 4.6, h: 3.6 },
  spireHeight: 7.5,
} as const;
export const TEMPLE_BELL = { x: -50, z: -31.2, height: 3.4 } as const;

export const SCHOOL = { x: 30, z: 47, w: 16, d: 6.5, h: 3.6 } as const;
export const CRICKET_PITCH = { x: 47, z: 40, length: 16 } as const;

export const WATER_TANK = { x: 58, z: -30, legSpread: 2.2, tankHeight: 11, tankRadius: 3 } as const;

export const CROSSING = { boomOffset: 4.2, cabin: { x: 81, z: -6.5 } } as const;

export const HAYSTACKS = [
  { x: -36, z: -116, r: 2.1 },
  { x: -31, z: -118, r: 1.7 },
  { x: 40, z: -114, r: 2 },
  { x: -94, z: -6, r: 1.8 },
  { x: 68, z: -14, r: 1.6 },
] as const;

export const BULLOCK_CART = { x: -17, z: -121, rot: 0.6 } as const;

export const SCARECROWS = [
  { x: -30, z: -100 },
  { x: 32, z: -98 },
] as const;
