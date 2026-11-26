/** Tags set as `userData.tag` on rigid bodies, so physics queries can tell them apart. */
export const BODY_TAGS = {
  bike: "player-bike",
  /** Walls the rider can't pass but the camera should see through (river banks, pond edge). */
  invisibleBlocker: "invisible-blocker",
  /** Villagers and animals: solid to the bike, but the camera looks past them. */
  creature: "creature",
} as const;

/** The camera's line-of-sight ray ignores these bodies. */
export const CAMERA_IGNORED_TAGS: ReadonlySet<string> = new Set([
  BODY_TAGS.bike,
  BODY_TAGS.invisibleBlocker,
  BODY_TAGS.creature,
]);
