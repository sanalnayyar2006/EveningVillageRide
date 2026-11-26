import { Vector3 } from "three";
import { angleDelta, damp, mulberry32, smoothstep } from "@/utils/math";
import { events } from "@/game/core/events";
import { localToWorld } from "@/game/world/data/geometry";
import type { Point } from "@/game/world/data/mapSource";
import { CRICKET_PITCH } from "@/game/world/data/structures";
import { heightAt } from "@/game/world/terrain";
import { createAgent } from "./brain";
import type { HumanActivity, Look, Villager } from "./human";

/** A spot on the ground, in the pitch's local space (Z runs along the pitch, + is the bowler's end). */
const onPitch = (lx: number, lz: number): Point =>
  localToWorld(CRICKET_PITCH.x, CRICKET_PITCH.z, CRICKET_PITCH.rot, lx, lz);

const HALF = CRICKET_PITCH.length / 2;
const BATSMAN = onPitch(0, -HALF - 0.4);
const KEEPER = onPitch(0, -HALF - 3);
const CREASE = onPitch(0, HALF + 0.3);
const RUN_UP = onPitch(0.5, HALF + 9);
const FIELDERS: Point[] = [onPitch(-9, 1), onPitch(10, -5), onPitch(4, 15)];
const TOWARDS_BOWLER = CRICKET_PITCH.rot;
const TOWARDS_BATSMAN = CRICKET_PITCH.rot + Math.PI;

const kid = (
  shirt: string,
  pants: string,
  skin: string,
  scale: number,
  extra: Partial<Look> = {},
): Look => ({
  scale,
  skin,
  hair: "#1c1410",
  shirt,
  pants,
  ...extra,
});

function player(look: Look, at: Point, heading: number, activity: HumanActivity): Villager {
  return { ...createAgent<HumanActivity>(at, heading, [], activity), look, headYaw: 0 };
}

type Phase = "runUp" | "delivery" | "hit" | "fetch" | "throwBack";

/**
 * The evening match by the school: the bowler runs in, the batsman swings,
 * the ball flies off to a fielder who chases it down and throws it back.
 */
export class CricketMatch {
  readonly players: Villager[];
  /** World position of the ball, or null while it's in the bowler's hand. */
  readonly ball = new Vector3();
  ballVisible = false;

  private batsman: Villager;
  private bowler: Villager;
  private keeper: Villager;
  private fielders: Villager[];
  private phase: Phase = "runUp";
  private phaseTime = 0;
  private random = mulberry32(11);
  private from = new Vector3();
  private to = new Vector3();
  private chaser: Villager | null = null;

  constructor() {
    this.batsman = player(
      kid("#f7f4ee", "#f7f4ee", "#8d5a3b", 0.72, { accessory: "bat" }),
      BATSMAN,
      TOWARDS_BOWLER,
      "bat",
    );
    this.bowler = player(
      kid("#2a6f97", "#3a3a3a", "#a0694a", 0.7),
      RUN_UP,
      TOWARDS_BATSMAN,
      "walk",
    );
    this.keeper = player(
      kid("#e76f51", "#3a3a3a", "#7a4a30", 0.66),
      KEEPER,
      TOWARDS_BOWLER,
      "crouch",
    );
    this.fielders = FIELDERS.map((spot, i) =>
      player(
        kid(
          ["#f2c230", "#8ab17d", "#d62f6a"][i]!,
          "#3a3a3a",
          ["#b07a55", "#8d5a3b", "#a0694a"][i]!,
          0.64 + i * 0.03,
        ),
        spot,
        TOWARDS_BATSMAN,
        "stand",
      ),
    );
    this.players = [this.batsman, this.bowler, this.keeper, ...this.fielders];
  }

  private setPhase(phase: Phase) {
    this.phase = phase;
    this.phaseTime = 0;
  }

  private static setActivity(p: Villager, activity: HumanActivity) {
    if (p.activity !== activity) {
      p.activity = activity;
      p.activityTime = 0;
    }
  }

  /** Move a player towards a point; returns true on arrival. */
  private static run(
    p: Villager,
    [tx, tz]: Point,
    speed: number,
    dt: number,
    activity: HumanActivity,
  ) {
    const dx = tx - p.x;
    const dz = tz - p.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.2) return true;
    CricketMatch.setActivity(p, activity);
    p.heading += angleDelta(p.heading, Math.atan2(dx, dz)) * damp(8, dt);
    const step = Math.min(distance, speed * dt);
    p.x += (dx / distance) * step;
    p.z += (dz / distance) * step;
    p.stride += step;
    p.speed = speed;
    return false;
  }

  /** The ball on a lob from `from` to `to`, `t` from 0 to 1. */
  private lob(t: number, height: number) {
    this.ball.lerpVectors(this.from, this.to, t);
    this.ball.y += Math.sin(Math.PI * t) * height;
  }

  update(dt: number) {
    this.phaseTime += dt;
    for (const p of this.players) {
      p.activityTime += dt;
      p.speed = 0;
    }
    const { bowler, batsman, keeper } = this;

    switch (this.phase) {
      case "runUp": {
        this.ballVisible = false;
        CricketMatch.setActivity(batsman, "bat");
        batsman.activityTime = 0;
        if (CricketMatch.run(bowler, CREASE, 4, dt, "run")) {
          CricketMatch.setActivity(bowler, "bowl");
          batsman.activityTime = 0;
          this.from.set(CREASE[0], heightAt(...CREASE) + 1.9, CREASE[1]);
          this.to.set(BATSMAN[0], heightAt(...BATSMAN) + 0.5, BATSMAN[1]);
          this.setPhase("delivery");
        }
        break;
      }
      case "delivery": {
        // The ball leaves the hand at the top of the bowling arm's swing.
        const t = smoothstep(0, 1, (this.phaseTime - 0.35) / 0.55);
        this.ballVisible = this.phaseTime > 0.35;
        this.lob(t, 0.6);
        if (t >= 1) {
          const target = FIELDERS[Math.floor(this.random() * FIELDERS.length)]!;
          const [lx, lz] = [
            target[0] + (this.random() - 0.5) * 8,
            target[1] + (this.random() - 0.5) * 8,
          ];
          this.from.copy(this.ball);
          this.to.set(lx, heightAt(lx, lz) + 0.05, lz);
          this.chaser = this.fielders[FIELDERS.indexOf(target)]!;
          if (this.random() < 0.35)
            events.emit("life:cheer", { position: [batsman.x, 1, batsman.z] });
          this.setPhase("hit");
        }
        break;
      }
      case "hit": {
        const t = Math.min(1, this.phaseTime / 1.6);
        this.lob(t, 6);
        CricketMatch.run(bowler, RUN_UP, 1.4, dt, "walk");
        if (t >= 1) this.setPhase("fetch");
        break;
      }
      case "fetch": {
        const chaser = this.chaser!;
        const arrived = CricketMatch.run(chaser, [this.to.x, this.to.z], 3.2, dt, "run");
        CricketMatch.run(bowler, RUN_UP, 1.4, dt, "walk");
        if (arrived) {
          this.from.set(chaser.x, heightAt(chaser.x, chaser.z) + 1.2, chaser.z);
          this.to.set(KEEPER[0], heightAt(...KEEPER) + 0.8, KEEPER[1]);
          CricketMatch.setActivity(chaser, "bowl");
          this.setPhase("throwBack");
        }
        break;
      }
      case "throwBack": {
        const t = Math.min(1, this.phaseTime / 1.1);
        this.lob(t, 4);
        const bowlerBack = CricketMatch.run(bowler, RUN_UP, 1.4, dt, "walk");
        if (t >= 1 && bowlerBack) {
          this.chaser = null;
          bowler.heading = TOWARDS_BATSMAN;
          this.setPhase("runUp");
        }
        break;
      }
    }

    // Fielders drift back to their spots, except one still chasing the ball.
    this.fielders.forEach((f, i) => {
      const chasing = f === this.chaser && this.phase === "fetch";
      const throwing = f === this.chaser && this.phase === "throwBack" && this.phaseTime < 0.6;
      if (!chasing && !throwing) CricketMatch.run(f, FIELDERS[i]!, 1.5, dt, "walk");
    });

    // Everyone not running about watches the ball.
    for (const p of [keeper, ...this.fielders]) {
      if (p.speed > 0) continue;
      if (p !== keeper) CricketMatch.setActivity(p, "stand");
      const want = Math.atan2(this.ball.x - p.x, this.ball.z - p.z);
      p.heading += angleDelta(p.heading, this.ballVisible ? want : p.heading) * damp(3, dt);
    }
  }
}
