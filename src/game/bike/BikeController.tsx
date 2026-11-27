"use client";

import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from "@react-three/rapier";
import { useEffect, useRef } from "react";
import { Euler, Quaternion } from "three";
import { events } from "@/game/core/events";
import { FRAME_ORDER, MAX_DT } from "@/game/core/frameOrder";
import { input } from "@/game/core/input/InputManager";
import { clampToRideArea, groundHeight, groundSlope } from "@/game/world/groundQueries";
import { damp } from "@/utils/math";
import { BIKE_SPAWN, useBikeStore } from "@/store/bikeStore";
import { usePlayerStore } from "@/store/playerStore";
import { BODY_TAGS } from "@/game/core/physicsTags";
import { BIKE_CONFIG } from "./bikeConfig";
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

/** A capsule lying along the bike, raised so it never touches the ground. */
const COLLIDER = { halfLength: 0.5, radius: 0.32, centerHeight: 0.55 } as const;
/** Above this speed (m/s) the bike counts as moving, e.g. for fading the HUD. */
const MOVING_THRESHOLD = 0.3;
/** How quickly the bike tilts to match a slope; smooths out terrain bumps. */
const PITCH_RESPONSE = 10;

/** Holds the brake on while the phone is coming out or in use. */
const BRAKING: BikeInput = { ...NO_INPUT, brake: 1 };

function readControls(): BikeInput {
  return {
    throttle: input.isDown("forward") ? 1 : 0,
    brake: input.isDown("brake") ? 1 : 0,
    back: input.isDown("back") ? 1 : 0,
    steer: input.axis("right", "left"),
  };
}

const rotation = new Quaternion();
const euler = new Euler();

/**
 * Runs the bike simulation each frame and moves the bike's Rapier body.
 * Rapier's character controller handles collisions; the result is written to
 * the bike store for the model and camera to read.
 */
export function BikeController() {
  const body = useRef<RapierRigidBody>(null);
  const controller = useRef<CharacterController | null>(null);
  const { world } = useRapier();
  const sim = useRef<BikeSimState>({
    speed: 0,
    heading: BIKE_SPAWN.heading,
    steer: 0,
    lean: 0,
    wheelAngle: 0,
    crankAngle: 0,
    pedaling: false,
    reverseHold: 0,
  });

  useEffect(() => {
    const characterController = world.createCharacterController(0.02);
    characterController.setSlideEnabled(true);
    characterController.setApplyImpulsesToDynamicBodies(false);
    controller.current = characterController;
    return () => {
      world.removeCharacterController(characterController);
      controller.current = null;
    };
  }, [world]);

  useFrame((_, frameDelta) => {
    if (!body.current || !controller.current) return;
    const dt = Math.min(frameDelta, MAX_DT);
    const bike = sim.current;
    const { telemetry, pendingTeleport } = useBikeStore.getState();
    if (pendingTeleport) {
      Object.assign(bike, {
        speed: 0,
        steer: 0,
        lean: 0,
        reverseHold: 0,
        heading: pendingTeleport.heading,
      });
      Object.assign(telemetry, { x: pendingTeleport.x, z: pendingTeleport.z });
      useBikeStore.setState((s) => ({ pendingTeleport: null, teleportCount: s.teleportCount + 1 }));
    }
    const playerState = usePlayerStore.getState().state;
    // The album pauses the ride: the bike simply stays where it is.
    if (playerState === "viewingGallery") return;
    const riding = playerState === "cycling";
    const usingPhone = playerState === "stopping" || playerState === "takingPhoto";

    if (riding && input.wasPressed("bell")) {
      events.emit("bike:bell", { position: [telemetry.x, telemetry.y, telemetry.z] });
    }
    const controls = riding ? readControls() : usingPhone ? BRAKING : NO_INPUT;
    stepBike(bike, controls, dt, BIKE_CONFIG);

    // Ask Rapier how far the bike can actually move, then lose speed in proportion.
    const wantX = Math.sin(bike.heading) * bike.speed * dt;
    const wantZ = Math.cos(bike.heading) * bike.speed * dt;
    controller.current.computeColliderMovement(body.current.collider(0), {
      x: wantX,
      y: 0,
      z: wantZ,
    });
    const moved = controller.current.computedMovement();
    const wanted = wantX * wantX + wantZ * wantZ;
    if (wanted > 1e-10) {
      const fractionMoved = (moved.x * wantX + moved.z * wantZ) / wanted;
      bike.speed = speedAfterBump(bike.speed, fractionMoved, BIKE_CONFIG);
    }

    const [x, z] = clampToRideArea(telemetry.x + moved.x, telemetry.z + moved.z);
    const y = groundHeight(x, z);
    const pitch =
      telemetry.pitch +
      (groundSlope(x, z, bike.heading) - telemetry.pitch) * damp(PITCH_RESPONSE, dt);

    body.current.setNextKinematicTranslation({ x, y: y + COLLIDER.centerHeight, z });
    // The capsule's long axis is Y, so tip it forward to lie along the bike.
    rotation.setFromEuler(euler.set(Math.PI / 2, bike.heading, 0, "YXZ"));
    body.current.setNextKinematicRotation(rotation);

    Object.assign(telemetry, {
      x,
      y,
      z,
      heading: bike.heading,
      speed: bike.speed,
      lean: bike.lean,
      steer: bike.steer,
      pitch,
      wheelAngle: bike.wheelAngle,
      crankAngle: bike.crankAngle,
      pedaling: bike.pedaling,
    });
    useBikeStore.getState().setMoving(Math.abs(bike.speed) > MOVING_THRESHOLD);
  }, FRAME_ORDER.bike);

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[
        BIKE_SPAWN.x,
        groundHeight(BIKE_SPAWN.x, BIKE_SPAWN.z) + COLLIDER.centerHeight,
        BIKE_SPAWN.z,
      ]}
      userData={{ tag: BODY_TAGS.bike }}
    >
      <CapsuleCollider args={[COLLIDER.halfLength, COLLIDER.radius]} />
    </RigidBody>
  );
}
