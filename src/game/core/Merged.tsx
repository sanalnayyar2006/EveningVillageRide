"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { BufferGeometry, Group, Matrix4, Mesh, type Material } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Static parts written as separate meshes (easy to read and tweak) but drawn
 * as one mesh per material. Once mounted, everything inside is merged and the
 * originals are hidden. Only for parts that never move relative to each other:
 * anything animated must sit outside, in its own group.
 */
export function Merged({ children }: { children: ReactNode }) {
  const root = useRef<Group>(null);

  useLayoutEffect(() => {
    const group = root.current;
    if (!group) return;
    group.updateMatrixWorld(true);
    const toGroup = group.matrixWorld.clone().invert();

    const byMaterial = new Map<Material, BufferGeometry[]>();
    const originals: Mesh[] = [];
    group.traverse((object) => {
      if (!(object instanceof Mesh) || Array.isArray(object.material)) return;
      const geometry = (object.geometry as BufferGeometry)
        .clone()
        .applyMatrix4(new Matrix4().multiplyMatrices(toGroup, object.matrixWorld));
      const list = byMaterial.get(object.material) ?? [];
      list.push(geometry);
      byMaterial.set(object.material, list);
      originals.push(object);
    });

    const merged: Mesh[] = [];
    for (const [material, geometries] of byMaterial) {
      const geometry = mergeGeometries(geometries);
      geometries.forEach((g) => g.dispose());
      if (!geometry) continue;
      merged.push(new Mesh(geometry, material));
    }
    // Only hide the originals if every material merged, so nothing can go missing.
    if (merged.length !== byMaterial.size) {
      merged.forEach((mesh) => mesh.geometry.dispose());
      return;
    }
    for (const mesh of originals) mesh.visible = false;
    group.add(...merged);

    return () => {
      group.remove(...merged);
      merged.forEach((mesh) => mesh.geometry.dispose());
      for (const mesh of originals) mesh.visible = true;
    };
  }, []);

  return <group ref={root}>{children}</group>;
}
