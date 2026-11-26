"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, DoubleSide, type Mesh } from "three";
import { KITE_FLYERS } from "@/game/life/data/villagers";
import { heightAt } from "@/game/world/terrain";
import { ambient, windStrength } from "./ambientState";

const KITES = [
  { colour: "#d62f6a", seed: 0 },
  { colour: "#f2c230", seed: 2.4 },
];

/** A diamond kite with a short tail, flat on its local XY plane. */
function kiteGeometry() {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(
      new Float32Array([0, 0.55, 0, -0.4, 0, 0, 0, -0.75, 0, 0, 0.55, 0, 0, -0.75, 0, 0.4, 0, 0]),
      3,
    ),
  );
  geometry.computeVertexNormals();
  return geometry;
}

/** The two kites over the terraces, tugging on their strings. */
export function Kites() {
  const geometry = useMemo(() => kiteGeometry(), []);
  const strings = useMemo(
    () =>
      KITES.map(() => {
        const g = new BufferGeometry();
        g.setAttribute("position", new BufferAttribute(new Float32Array(6), 3));
        return g;
      }),
    [],
  );
  const kites = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const t = ambient.time;
    const wind = windStrength();
    KITES.forEach((kite, i) => {
      const [hx, hz] = KITE_FLYERS[i]!;
      const hand: [number, number, number] = [hx, heightAt(hx, hz) + 1.1, hz];
      // Downwind (to the south-east here) and high, swooping more in a gust.
      const s = kite.seed;
      const x = hx + 9 + Math.sin(t * 0.5 + s) * (2 + wind * 4);
      const y = hand[1] + 20 + Math.sin(t * 0.8 + s) * 2 + wind * 4;
      const z = hz + 14 + Math.cos(t * 0.4 + s) * 2;
      const mesh = kites.current[i];
      if (mesh) {
        mesh.position.set(x, y, z);
        mesh.lookAt(hand[0], hand[1], hand[2]);
        mesh.rotateZ(Math.sin(t * 1.7 + s) * 0.35);
      }
      const line = strings[i]!.getAttribute("position") as BufferAttribute;
      line.setXYZ(0, ...hand);
      line.setXYZ(1, x, y, z);
      line.needsUpdate = true;
    });
  });

  return (
    <>
      {KITES.map((kite, i) => (
        <group key={i}>
          <mesh
            ref={(m) => {
              kites.current[i] = m;
            }}
            geometry={geometry}
          >
            <meshStandardMaterial color={kite.colour} side={DoubleSide} roughness={0.6} />
          </mesh>
          <lineSegments geometry={strings[i]} frustumCulled={false}>
            <lineBasicMaterial color="#f4efe6" transparent opacity={0.6} />
          </lineSegments>
        </group>
      ))}
    </>
  );
}
