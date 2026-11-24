"use client";

import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef } from "react";
import { Euler, Quaternion } from "three";
import { events } from "@/game/core/events";
import { FRAME_ORDER, MAX_DT } from "@/game/core/frameOrder";
import { input } from "@/game/core/input/InputManager";
import { groundHeight, RIDE_RADIUS } from "@/game/world/groundQueries";
import { useBikeStore, BIKE_SPAWN } from "@/store/bikeStore";
import { usePlayerStore } from "@/store/playerStore";
import { BIKE_BODY_TAG, BIKE_CONFIG } from "./bikeConfig";
import {
  NO_INPUT,
  speedAfterBump,
  stepBike,
  type BikeInput,
  type BikeSimState,
} from "./bikePhysics";

type CharacterController = ReturnType<
  ReturnType<typeof useRapier>["world"]["createCharacterController"]
>;

/** Body collider: a capsule lying along the bike, clear of the ground. */
const COLLIDER = { halfLength: 0.5, radius: 0.32, height: 0.55 } as const;
/** Bike is considered moving above this speed (m/s). */
const MOVING_THRESHOLD = 0.3;

const readInput = (): BikeInput => ({
  throttle: input.isDown("forward") ? 1 : 0,
  brake: input.isDown("brake") ? 1 : 0,
  back: input.isDown("back") ? 1 : 0,
  steer: input.axis("right", "left"),
});

/**
 * Bridges the pure bike simulation with Rapier. Rapier's character controller
 * resolves collisions; the result is written to the bike telemetry store.
 */
export function BikeController() {
  const body = useRef<RapierRigidBody>(null);
  const { world } = useRapier();
  const controller = useRef<CharacterController | null>(null);
  const sim = useRef<BikeSimState>({
    speed: 0,
    heading: BIKE_SPAWN.heading,
    steer: 0,
    lean: 0,
    wheelAngle: 0,
    crankAngle: 0,
    pedaling: false,
  });
  const scratch = useMemo(() => ({ q: new Quaternion(), e: new Euler() }), []);

  useEffect(() => {
    const c = world.createCharacterController(0.02);
    c.setSlideEnabled(true);
    c.setApplyImpulsesToDynamicBodies(false);
    controller.current = c;
    return () => {
      world.removeCharacterController(c);
      controller.current = null;
    };
  }, [world]);

  useFrame((_, rawDt) => {
    const rb = body.current;
    const cc = controller.current;
    if (!rb || !cc) return;
    const dt = Math.min(rawDt, MAX_DT);
    const s = sim.current;
    const t = useBikeStore.getState().telemetry;
    const riding = usePlayerStore.getState().state === "cycling";

    const control = riding ? readInput() : NO_INPUT;
    if (riding && input.wasPressed("bell")) {
      events.emit("bike:bell", { position: [t.x, t.y, t.z] });
    }

    stepBike(s, control, dt, BIKE_CONFIG);

    // Resolve the intended move against the world.
    const dx = Math.sin(s.heading) * s.speed * dt;
    const dz = Math.cos(s.heading) * s.speed * dt;
    const collider = rb.collider(0);
    cc.computeColliderMovement(collider, { x: dx, y: 0, z: dz });
    const moved = cc.computedMovement();
    const desired = Math.hypot(dx, dz);
    if (desired > 1e-5) {
      const along = (moved.x * dx + moved.z * dz) / (desired * desired);
      s.speed = speedAfterBump(s.speed, along, BIKE_CONFIG);
    }

    // Soft world boundary: slide along the rim instead of stopping dead.
    let x = t.x + moved.x;
    let z = t.z + moved.z;
    const r = Math.hypot(x, z);
    if (r > RIDE_RADIUS) {
      x *= RIDE_RADIUS / r;
      z *= RIDE_RADIUS / r;
    }
    const y = groundHeight(x, z);

    rb.setNextKinematicTranslation({ x, y: y + COLLIDER.height, z });
    scratch.q.setFromEuler(scratch.e.set(Math.PI / 2, s.heading, 0, "YXZ"));
    rb.setNextKinematicRotation(scratch.q);

    Object.assign(t, {
      x,
      y,
      z,
      heading: s.heading,
      speed: s.speed,
      lean: s.lean,
      steer: s.steer,
      wheelAngle: s.wheelAngle,
      crankAngle: s.crankAngle,
      pedaling: s.pedaling,
    });
    useBikeStore.getState().setMoving(Math.abs(s.speed) > MOVING_THRESHOLD);
  }, FRAME_ORDER.bike);

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[BIKE_SPAWN.x, COLLIDER.height, BIKE_SPAWN.z]}
      userData={{ tag: BIKE_BODY_TAG }}
    >
      <CapsuleCollider args={[COLLIDER.halfLength, COLLIDER.radius]} />
    </RigidBody>
  );
}
