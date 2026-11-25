import { BoxGeometry, MeshStandardMaterial, type Group } from "three";

/** Held sideways, so the long side runs along X. The screen faces -Z (towards the rider). */
const SIZE = { width: 0.155, height: 0.075, depth: 0.009 } as const;

const BODY = new BoxGeometry(SIZE.width, SIZE.height, SIZE.depth);
const SCREEN = new BoxGeometry(SIZE.width * 0.92, SIZE.height * 0.86, 0.001);
const LENS = new BoxGeometry(0.014, 0.014, 0.003);

const MATERIALS = {
  body: new MeshStandardMaterial({ color: "#1d2430", metalness: 0.4, roughness: 0.35 }),
  screen: new MeshStandardMaterial({
    color: "#0b0f14",
    emissive: "#ffd9a8",
    emissiveIntensity: 0.7,
    roughness: 0.2,
  }),
  lens: new MeshStandardMaterial({ color: "#050505", metalness: 0.8, roughness: 0.1 }),
} as const;

/** A plain smartphone with its camera app glowing on the screen. */
export function PhoneModel({ ref }: { ref: React.Ref<Group> }) {
  return (
    <group ref={ref} visible={false}>
      <mesh geometry={BODY} material={MATERIALS.body} castShadow />
      <mesh geometry={SCREEN} material={MATERIALS.screen} position-z={-SIZE.depth / 2 - 0.0005} />
      <mesh
        geometry={LENS}
        material={MATERIALS.lens}
        position={[SIZE.width / 2 - 0.02, SIZE.height / 2 - 0.016, SIZE.depth / 2 + 0.0015]}
      />
    </group>
  );
}
