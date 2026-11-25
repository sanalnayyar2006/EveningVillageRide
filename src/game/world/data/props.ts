import { BRIDGE } from "./layout";

/** Street lamps: [x, z, side]. side is which way the arm reaches (towards the road). */
export const STREET_LAMPS: [number, number, 1 | -1][] = [
  [-4.3, 88, 1],
  [4.3, 76, -1],
  [-4.3, 62, 1],
  [4.3, 48, -1],
  [-4.3, 34, 1],
  [4.3, 18, -1],
  [-4.3, -14, 1],
  [4.3, -30, -1],
  [-4.3, -44, 1],
];

/** Lamps along the cross road reach north–south rather than east–west. */
export const CROSS_ROAD_LAMPS: [number, number][] = [
  [-28, -3.6],
  [-56, -3.6],
  [-84, -3.6],
  [50, 3.6],
  [66, -3.6],
  [92, 3.6],
];

/** Electricity poles march up the east side of the main road, skipping the bridge. */
export const POWER_POLES: [number, number][] = (() => {
  const poles: [number, number][] = [];
  for (let z = 118; z >= -112; z -= 28) {
    if (Math.abs(z - BRIDGE.z) < BRIDGE.halfLength + 2) continue;
    poles.push([6.4, z]);
  }
  return poles;
})();

export const POLE_HEIGHT = 7;
/** Sideways offsets of the three wires on each pole's crossbar. */
export const WIRE_OFFSETS = [-0.55, 0, 0.55];
