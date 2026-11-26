import { angleDelta, damp } from "@/utils/math";
import type { Point } from "@/game/world/data/mapSource";

/**
 * A tiny behaviour system shared by people and animals. Each agent loops
 * through a script of tasks (walk a path, stay and do something, wander
 * about a spot), which is enough for "walks to the field, works, walks home".
 */

export type Task<Activity extends string> =
  | { kind: "walk"; path: Point[]; speed: number; activity: Activity }
  | { kind: "stay"; seconds: number; activity: Activity; facing?: number }
  | {
      kind: "wander";
      centre: Point;
      radius: number;
      seconds: number;
      speed: number;
      moving: Activity;
      resting: Activity;
    };

export interface Agent<Activity extends string> {
  x: number;
  z: number;
  heading: number;
  /** What the agent is doing right now; drives its pose. */
  activity: Activity;
  /** Current speed (m/s), for stride length. */
  speed: number;
  /** Seconds since `activity` last changed. */
  activityTime: number;
  /** Advances with distance walked; drives the leg swing. */
  stride: number;
  script: Task<Activity>[];
  step: number;
  taskTime: number;
  pathIndex: number;
  /** Wander: where it's heading and how long it pauses there. */
  target: Point | null;
  pause: number;
  /** Set by reactions (e.g. a bike in the way) to freeze the script for a moment. */
  held: Activity | null;
  /** A one-off look at the bike: seconds left, and whether it can happen again. */
  glance: { left: number; armed: boolean };
}

export function createAgent<Activity extends string>(
  start: Point,
  heading: number,
  script: Task<Activity>[],
  initial: Activity,
): Agent<Activity> {
  return {
    x: start[0],
    z: start[1],
    heading,
    activity: initial,
    speed: 0,
    activityTime: 0,
    stride: 0,
    script,
    step: 0,
    taskTime: 0,
    pathIndex: 0,
    target: null,
    pause: 0,
    held: null,
    glance: { left: 0, armed: true },
  };
}

const TURN_RATE = 6;

function setActivity<A extends string>(agent: Agent<A>, activity: A) {
  if (agent.activity !== activity) {
    agent.activity = activity;
    agent.activityTime = 0;
  }
}

/** Move towards a point at `speed`; returns true on arrival. */
export function moveTowards<A extends string>(
  agent: Agent<A>,
  [tx, tz]: Point,
  speed: number,
  dt: number,
) {
  const dx = tx - agent.x;
  const dz = tz - agent.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 0.15) return true;
  const want = Math.atan2(dx, dz);
  agent.heading += angleDelta(agent.heading, want) * damp(TURN_RATE, dt);
  const stepLength = Math.min(distance, speed * dt);
  agent.x += (dx / distance) * stepLength;
  agent.z += (dz / distance) * stepLength;
  agent.speed = speed;
  agent.stride += stepLength;
  return false;
}

function nextTask<A extends string>(agent: Agent<A>) {
  agent.step = (agent.step + 1) % agent.script.length;
  agent.taskTime = 0;
  agent.pathIndex = 0;
  agent.target = null;
  agent.pause = 0;
}

/** Advance an agent by `dt` seconds. `random` keeps wandering deterministic per agent. */
export function updateAgent<A extends string>(agent: Agent<A>, dt: number, random: () => number) {
  agent.activityTime += dt;
  agent.speed = 0;
  if (agent.held) {
    setActivity(agent, agent.held);
    return;
  }

  const task = agent.script[agent.step];
  if (!task) return;
  agent.taskTime += dt;

  switch (task.kind) {
    case "walk": {
      setActivity(agent, task.activity);
      const point = task.path[agent.pathIndex];
      if (!point || moveTowards(agent, point, task.speed, dt)) {
        agent.pathIndex++;
        if (agent.pathIndex >= task.path.length) nextTask(agent);
      }
      break;
    }
    case "stay": {
      setActivity(agent, task.activity);
      if (task.facing !== undefined) {
        agent.heading += angleDelta(agent.heading, task.facing) * damp(TURN_RATE, dt);
      }
      if (agent.taskTime >= task.seconds) nextTask(agent);
      break;
    }
    case "wander": {
      if (agent.taskTime >= task.seconds) {
        nextTask(agent);
        break;
      }
      if (agent.pause > 0) {
        agent.pause -= dt;
        setActivity(agent, task.resting);
        break;
      }
      if (!agent.target) {
        const angle = random() * Math.PI * 2;
        const distance = Math.sqrt(random()) * task.radius;
        agent.target = [
          task.centre[0] + Math.cos(angle) * distance,
          task.centre[1] + Math.sin(angle) * distance,
        ];
      }
      setActivity(agent, task.moving);
      if (moveTowards(agent, agent.target, task.speed, dt)) {
        agent.target = null;
        agent.pause = 4 + random() * 10;
      }
      break;
    }
  }
}

/** Turn an agent to face a point, e.g. to look at the passing bike. */
export function faceTowards<A extends string>(agent: Agent<A>, x: number, z: number, dt: number) {
  const want = Math.atan2(x - agent.x, z - agent.z);
  agent.heading += angleDelta(agent.heading, want) * damp(TURN_RATE, dt);
}

/** Glance at the bike once when it comes this close (m)… */
const GLANCE_DISTANCE = 3;
/** …for this long… */
const GLANCE_SECONDS = 1.5;
/** …and not again until it has gone this far away. */
const GLANCE_REARM_DISTANCE = 8;

/**
 * How far to turn the head this frame. Creatures look at the bike only
 * briefly, the first time it comes really close; the rest of the time they
 * keep their eyes on what they're doing.
 */
export function glanceYaw<A extends string>(
  agent: Agent<A>,
  bikeX: number,
  bikeZ: number,
  dt: number,
  maxTurn: number,
): number {
  const distance = Math.hypot(bikeX - agent.x, bikeZ - agent.z);
  const { glance } = agent;
  if (glance.armed && distance < GLANCE_DISTANCE) {
    glance.left = GLANCE_SECONDS;
    glance.armed = false;
  } else if (!glance.armed && glance.left <= 0 && distance > GLANCE_REARM_DISTANCE) {
    glance.armed = true;
  }
  if (glance.left <= 0) return 0;
  glance.left -= dt;
  const turn = angleDelta(agent.heading, Math.atan2(bikeX - agent.x, bikeZ - agent.z));
  return Math.max(-maxTurn, Math.min(maxTurn, turn));
}
