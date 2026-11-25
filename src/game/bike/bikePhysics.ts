import { approach, clamp, damp } from "@/utils/math";
import type { BikeConfig } from "./bikeConfig";

export interface BikeSimState {
  speed: number;
  heading: number;
  steer: number;
  lean: number;
  wheelAngle: number;
  crankAngle: number;
  pedaling: boolean;
  /** Seconds S has been held while stopped; reverse starts once this passes `reverseDelay`. */
  reverseHold: number;
}

export interface BikeInput {
  /** 0..1 pedal. */
  throttle: number;
  /** 0..1 explicit brake (Space). */
  brake: number;
  /** 0..1 "back" key: brakes while rolling forward, reverses once stopped. */
  back: number;
  /** -1..1, positive = left. */
  steer: number;
}

export const NO_INPUT: BikeInput = { throttle: 0, brake: 0, back: 0, steer: 0 };

const GRAVITY = 9.81;

/**
 * Speed rules. Pressing against the direction of travel always brakes first:
 * W while rolling back stops you, then pedals forward; S while rolling forward
 * stops you, then (if still held) eases into reverse.
 */
function updateSpeed(s: BikeSimState, input: BikeInput, dt: number, cfg: BikeConfig): void {
  const forward = input.throttle > 0 && input.back === 0;
  const backward = input.back > 0 && input.throttle === 0;
  const stopped = Math.abs(s.speed) < cfg.stoppedSpeed;
  const brake = (amount: number) => {
    s.speed = approach(s.speed, 0, cfg.brakeDeceleration * amount * dt);
  };

  s.reverseHold = backward && stopped ? s.reverseHold + dt : 0;

  if (input.brake > 0) {
    brake(input.brake);
  } else if (forward) {
    if (s.speed < 0) {
      brake(input.throttle);
    } else {
      const headroom = 1 - (s.speed / cfg.maxSpeed) ** 2;
      s.speed += cfg.acceleration * input.throttle * headroom * dt;
    }
  } else if (backward && s.speed > cfg.stoppedSpeed) {
    brake(input.back);
  } else if (backward && (s.speed < -cfg.stoppedSpeed || s.reverseHold >= cfg.reverseDelay)) {
    s.speed = approach(s.speed, -cfg.reverseMaxSpeed, cfg.reverseAcceleration * dt);
  } else {
    // Coasting (no keys, or W and S together): rolling resistance plus a little air drag.
    s.speed = approach(s.speed, 0, (cfg.rollingResistance + cfg.drag * Math.abs(s.speed)) * dt);
  }

  s.speed = clamp(s.speed, -cfg.reverseMaxSpeed, cfg.maxSpeed);
}

/**
 * Advances the bike by `dt` seconds, mutating `s`. It knows nothing about
 * rendering, Rapier or the keyboard, so it can be tested on its own.
 */
export function stepBike(s: BikeSimState, input: BikeInput, dt: number, cfg: BikeConfig): void {
  updateSpeed(s, input, dt, cfg);

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
