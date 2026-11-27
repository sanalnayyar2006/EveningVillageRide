import { ambient, windStrength } from "@/game/ambient/ambientState";
import { BIKE_CONFIG } from "@/game/bike/bikeConfig";
import { nearestOnPolyline } from "@/game/world/data/geometry";
import { nearestRoad, ROADS, STREAM } from "@/game/world/data/layout";
import { MARKET_STALLS, SUBSTATION, TEMPLE } from "@/game/world/data/structures";
import type { Point } from "@/game/world/data/mapSource";
import { heightAt } from "@/game/world/terrain";
import type { BikeTelemetry } from "@/store/bikeStore";
import { smoothstep } from "@/utils/math";
import { audioEngine } from "./AudioEngine";
import {
  startFreewheel,
  startGravel,
  startHum,
  startMurmur,
  startTempleDrone,
  startTraffic,
  startTyres,
  startWater,
  type LoopBuilder,
} from "./loops";
import { playChirp, startLoop } from "./synth";

/** A sound that belongs to a place: a spot, or the nearest point along a line (a stream, a road). */
interface PlaceSound {
  start: LoopBuilder;
  where: Point | readonly Point[];
  /** Height above the ground it comes from (m). */
  height: number;
  range: number;
  volume: number;
  /** How loud it is at this point in the evening, 0..1. */
  when?: () => number;
}

const centre = (points: readonly { x: number; z: number }[]): Point => [
  points.reduce((sum, p) => sum + p.x, 0) / points.length,
  points.reduce((sum, p) => sum + p.z, 0) / points.length,
];

const HIGHWAY = ROADS.find((road) => road.name === "highway")!.points;

const PLACES: PlaceSound[] = [
  // The aarti starts as the light goes.
  {
    start: startTempleDrone,
    where: [TEMPLE.x, TEMPLE.z],
    height: 2,
    range: 70,
    volume: 0.5,
    when: () => 0.25 + 0.75 * smoothstep(0.3, 0.7, ambient.dayProgress),
  },
  // The market is busiest before dark and thins out after.
  {
    start: startMurmur,
    where: centre(MARKET_STALLS),
    height: 1.5,
    range: 55,
    volume: 0.9,
    when: () => 1 - 0.6 * smoothstep(0.6, 1, ambient.dayProgress),
  },
  { start: startWater, where: STREAM.points, height: 0, range: 35, volume: 0.35 },
  { start: startHum, where: [SUBSTATION.x, SUBSTATION.z], height: 3, range: 45, volume: 0.25 },
  { start: startTraffic, where: HIGHWAY, height: 0.5, range: 110, volume: 0.8 },
];

/** How often the beds are adjusted (ms); every change glides, so this can be slow. */
export const SOUNDSCAPE_TICK_MS = 200;
/** Chance per tick of a bird calling somewhere, in daylight. */
const CHIRP_CHANCE = 0.1;
/** Freewheel clicks per metre travelled (24 pawl clicks per wheel turn). */
const CLICKS_PER_METRE = 24 / (2 * Math.PI * BIKE_CONFIG.wheelRadius);
/** Seconds of click in one loop of the freewheel buffer (see startFreewheel). */
const CLICK_LOOP_SECONDS = 0.05;

interface Bed {
  gain: GainNode;
  pan: StereoPannerNode;
}

/**
 * Every continuous sound: wind and crickets, the bike's tyres and freewheel,
 * and the places you ride past. Created once audio is unlocked, then nudged
 * a few times a second to follow the bike, the listener and the evening.
 */
export class Soundscape {
  private readonly wind: GainNode;
  private readonly insects: GainNode;
  private readonly tyres: GainNode;
  private readonly tyreTone: BiquadFilterNode;
  private readonly gravel: GainNode;
  private readonly freewheel: GainNode;
  private readonly freewheelClick: AudioBufferSourceNode;
  private readonly places: Bed[];

  constructor(
    private readonly ctx: AudioContext,
    private readonly out: AudioNode,
  ) {
    this.wind = startLoop(ctx, out, "wind");
    this.insects = startLoop(ctx, out, "insects");
    this.tyres = this.silentGain(out);
    this.tyreTone = startTyres(ctx, this.tyres);
    this.gravel = this.silentGain(out);
    startGravel(ctx, this.gravel);
    this.freewheel = this.silentGain(out);
    this.freewheelClick = startFreewheel(ctx, this.freewheel);
    this.places = PLACES.map((place) => {
      const pan = ctx.createStereoPanner();
      pan.connect(out);
      const gain = this.silentGain(pan);
      place.start(ctx, gain);
      return { gain, pan };
    });
  }

  update(bike: BikeTelemetry): void {
    const now = this.ctx.currentTime;
    const glide = (param: AudioParam, value: number, seconds = 0.15) =>
      param.setTargetAtTime(value, now, seconds);

    glide(this.wind.gain, 0.04 + windStrength() * 0.22, 0.5);
    glide(this.insects.gain, smoothstep(0.35, 0.9, ambient.dayProgress) * 0.05, 1);

    // Tyres roar louder and brighter with speed; dirt lanes add a crunch.
    const speed = Math.abs(bike.speed);
    const rolling = smoothstep(0.3, 7, speed);
    const road = nearestRoad(bike.x, bike.z);
    const onTarmac = road.edge < 0 && road.surface === "asphalt";
    glide(this.tyres.gain, rolling * 0.12);
    glide(this.tyreTone.frequency, 250 + rolling * 900);
    glide(this.gravel.gain, onTarmac ? 0 : rolling * 0.06);
    // The hub ticks only while coasting.
    const coasting = !bike.pedaling && speed > 0.6;
    glide(this.freewheel.gain, coasting ? 0.05 : 0, 0.05);
    glide(
      this.freewheelClick.playbackRate,
      Math.max(0.05, speed * CLICKS_PER_METRE * CLICK_LOOP_SECONDS),
    );

    PLACES.forEach((place, i) => {
      const [x, z] = Array.isArray(place.where[0])
        ? nearestPoint(bike.x, bike.z, place.where as readonly Point[])
        : (place.where as Point);
      const heard = audioEngine.placement(x, heightAt(x, z) + place.height, z, place.range);
      const bed = this.places[i]!;
      glide(bed.gain.gain, heard.gain * place.volume * (place.when?.() ?? 1), 0.4);
      glide(bed.pan.pan, heard.pan, 0.3);
    });

    const daylight = 1 - smoothstep(0.5, 0.85, ambient.dayProgress);
    if (Math.random() < CHIRP_CHANCE * daylight) this.chirp();
  }

  private chirp(): void {
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.random() * 2 - 1;
    panner.connect(this.out);
    playChirp(this.ctx, panner);
    window.setTimeout(() => panner.disconnect(), 1000);
  }

  private silentGain(destination: AudioNode): GainNode {
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.connect(destination);
    return gain;
  }
}

/** The point on a line nearest to (x, z): where a stream or road sounds from. */
function nearestPoint(x: number, z: number, line: readonly Point[]): Point {
  const near = nearestOnPolyline(x, z, line);
  return [near.x, near.z];
}
