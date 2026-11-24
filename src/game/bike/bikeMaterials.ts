import { MeshStandardMaterial } from "three";

// One shared instance per material, reused by every mesh.
export const BIKE_MATERIALS = {
  frame: new MeshStandardMaterial({ color: "#121212", metalness: 0.55, roughness: 0.32 }),
  chrome: new MeshStandardMaterial({ color: "#d9d6cf", metalness: 1, roughness: 0.22 }),
  tire: new MeshStandardMaterial({ color: "#191716", roughness: 0.92 }),
  rubber: new MeshStandardMaterial({ color: "#2a2420", roughness: 0.8 }),
  saddle: new MeshStandardMaterial({ color: "#3b2416", roughness: 0.55 }),
  reflector: new MeshStandardMaterial({ color: "#c0261b", emissive: "#5a0c06", roughness: 0.3 }),
} as const;

export const RIDER_MATERIALS = {
  kurta: new MeshStandardMaterial({ color: "#4f86b0", roughness: 0.85 }),
  pajama: new MeshStandardMaterial({ color: "#ece4d4", roughness: 0.9 }),
  skin: new MeshStandardMaterial({ color: "#8d5a3b", roughness: 0.65 }),
  hair: new MeshStandardMaterial({ color: "#1c1410", roughness: 0.7 }),
  scarf: new MeshStandardMaterial({ color: "#d9472b", roughness: 0.85 }),
  sandal: new MeshStandardMaterial({ color: "#4a2f1f", roughness: 0.8 }),
} as const;
