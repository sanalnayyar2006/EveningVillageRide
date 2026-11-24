import { clamp, damp } from "@/utils/math";
import type { BikeConfig } from "./bikeConfig";

export interface BikeSimState {
  speed: number;
  heading: number;
  steer: number;
  lean: number;
  wheelAngle: number;
  crankAngle: number;
  pedaling: boolean;
}

export interface BikeInput {
  /** 0..1 pedal. */
  throttle: number;
  /** 0..1 explicit brake (Space). */
  brake: number;
  /** 0..1 "back" key: brakes while moving, reverses when stopped. */
  back: number;
  /** -1..1, positive = left. */
  steer: number;
}

export const NO_INPUT: BikeInput = { throttle: 0, brake: 0, back: 0, steer: 0 };

const GRAVITY = 9.81;

/** Move `value` toward `target` by at most `maxDelta`. */
const approach = (value: number, target: number, maxDelta: number) =>
  value < target ? Math.min(value + maxDelta, target) : Math.max(value - maxDelta, target);

/**
 * Advances the bike by `dt` seconds, mutating `s`. It knows nothing about
 * rendering, Rapier or the keyboard, so it can be tested on its own.
 */
export function stepBike(s: BikeSimState, input: BikeInput, dt: number, cfg: BikeConfig): void {
  const braking = input.brake > 0 || (input.back > 0 && s.speed > cfg.reverseThreshold);
  const reversing = input.back > 0 && !braking && s.speed <= cfg.reverseThreshold;

  // Speed.
  if (braking) {
    s.speed = approach(s.speed, 0, cfg.brakeDeceleration * Math.max(input.brake, input.back) * dt);
  } else if (input.throttle > 0 && s.speed >= -0.05) {
    const headroom = 1 - (Math.max(s.speed, 0) / cfg.maxSpeed) ** 2;
    s.speed += cfg.acceleration * input.throttle * headroom * dt;
  } else if (reversing) {
    s.speed = approach(s.speed, -cfg.reverseMaxSpeed, cfg.reverseAcceleration * dt);
  }
  const coasting = !reversing && input.throttle === 0;
  if (coasting) {
    const resistance = (cfg.rollingResistance + cfg.drag * Math.abs(s.speed)) * dt;
    s.speed = approach(s.speed, 0, resistance);
  }
  s.speed = clamp(s.speed, -cfg.reverseMaxSpeed, cfg.maxSpeed);

  // Steering: twitchy handlebars at speed feel stressful, so the range narrows.
  const speedRatio = clamp(Math.abs(s.speed) / cfg.maxSpeed, 0, 1);
  const maxSteer = cfg.maxSteerSlow + (cfg.maxSteerFast - cfg.maxSteerSlow) * speedRatio;
  const targetSteer = input.steer * maxSteer;
  const response = input.steer === 0 ? cfg.steerReturn : cfg.steerResponse;
  s.steer += (targetSteer - s.steer) * damp(response, dt);

  // Kinematic bicycle model: no turning on the spot.
  const yawRate = (s.speed * Math.tan(s.steer)) / cfg.wheelbase;
  s.heading += yawRate * dt;

  // Lean into the turn so the bike balances the centripetal force.
  const targetLean = clamp(Math.atan((s.speed * yawRate) / GRAVITY), -cfg.maxLean, cfg.maxLean);
  s.lean += (targetLean - s.lean) * damp(cfg.leanResponse, dt);

  // Wheel and crank spin. The rear hub freewheels, so the pedals only turn while pedalling.
  const wheelDelta = (s.speed / cfg.wheelRadius) * dt;
  s.wheelAngle += wheelDelta;
  s.pedaling = input.throttle > 0 && s.speed > 0.05;
  if (s.pedaling) s.crankAngle += wheelDelta / cfg.gearRatio;
}

/** New speed when a collision let only `movedRatio` (0–1) of the intended move through. */
export function speedAfterBump(speed: number, movedRatio: number, cfg: BikeConfig): number {
  if (movedRatio >= 0.98) return speed;
  return speed * Math.max(cfg.bumpSpeedRetention, clamp(movedRatio, 0, 1));
}
