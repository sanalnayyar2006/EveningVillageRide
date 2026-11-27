/**
 * Endless sound sources, synthesised in code. Each builder plays forever into
 * `out`; the caller fades it in and out with a gain node (see Soundscape).
 */

export type LoopBuilder = (ctx: AudioContext, out: AudioNode) => void;

/** A looping buffer filled sample by sample; `t` is seconds into the loop. */
function bufferLoop(
  ctx: AudioContext,
  seconds: number,
  sample: (t: number) => number,
): AudioBufferSourceNode {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = sample(i / ctx.sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.start();
  return source;
}

function filter(ctx: AudioContext, type: BiquadFilterType, frequency: number, q = 0.7) {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = q;
  return node;
}

const noise = () => Math.random() * 2 - 1;

/** A smooth random wobble between 0 and 1, `rate` changes per second, looping cleanly over `seconds`. */
function wobble(seconds: number, rate: number): (t: number) => number {
  const steps = Math.max(1, Math.round(seconds * rate));
  const points = Array.from({ length: steps }, () => Math.random());
  return (t) => {
    const position = (t / seconds) * steps;
    const i = Math.floor(position) % steps;
    const f = position - Math.floor(position);
    const eased = f * f * (3 - 2 * f);
    return points[i]! + (points[(i + 1) % steps]! - points[i]!) * eased;
  };
}

/** Tyres on the road: a soft roar whose brightness the caller opens up with speed. */
export function startTyres(ctx: AudioContext, out: AudioNode): BiquadFilterNode {
  const tone = filter(ctx, "lowpass", 300);
  bufferLoop(ctx, 3, noise).connect(tone).connect(out);
  return tone;
}

/** Gravel crunching under the tyres; mixed in on dirt lanes. */
export const startGravel: LoopBuilder = (ctx, out) => {
  const grains = wobble(2, 60);
  bufferLoop(ctx, 2, (t) => noise() * (grains(t) > 0.7 ? 1 : 0.15))
    .connect(filter(ctx, "bandpass", 2200, 0.8))
    .connect(out);
};

/**
 * The tick of a freewheeling hub: one click per loop. The caller sets
 * playbackRate so it ticks faster as the wheel spins faster.
 */
export function startFreewheel(ctx: AudioContext, out: AudioNode): AudioBufferSourceNode {
  const click = bufferLoop(ctx, 0.05, (t) => (t < 0.0025 ? noise() * (1 - t / 0.0025) : 0));
  click.connect(filter(ctx, "highpass", 3000)).connect(out);
  return click;
}

/** Evening aarti at the temple: a harmonium drone on Sa and Pa, breathing slowly. */
export const startTempleDrone: LoopBuilder = (ctx, out) => {
  const bellows = ctx.createGain();
  bellows.gain.value = 0.6;
  const breathe = ctx.createOscillator();
  breathe.frequency.value = 0.18;
  const depth = ctx.createGain();
  depth.gain.value = 0.25;
  breathe.connect(depth).connect(bellows.gain);
  breathe.start();

  const tone = filter(ctx, "lowpass", 1100);
  tone.connect(bellows).connect(out);
  for (const [frequency, level] of [
    [146.8, 0.35],
    [147.6, 0.3],
    [220.2, 0.22],
    [293.6, 0.12],
  ] as const) {
    const reed = ctx.createOscillator();
    reed.type = "sawtooth";
    reed.frequency.value = frequency;
    const gain = ctx.createGain();
    gain.gain.value = level * 0.3;
    reed.connect(gain).connect(tone);
    reed.start();
  }
};

/** The bazaar: many voices talking at once, rising and falling. */
export const startMurmur: LoopBuilder = (ctx, out) => {
  const seconds = 6;
  const voices = Array.from({ length: 5 }, () => wobble(seconds, 5 + Math.random() * 3));
  const crowd = wobble(seconds, 0.6);
  bufferLoop(ctx, seconds, (t) => {
    let talk = 0;
    for (const syllables of voices) talk += Math.max(0, syllables(t) - 0.45);
    return noise() * talk * (0.5 + crowd(t) * 0.5);
  })
    .connect(filter(ctx, "bandpass", 850, 1.1))
    .connect(out);
};

/** Water running over stones: bright noise that bubbles. */
export const startWater: LoopBuilder = (ctx, out) => {
  const seconds = 4;
  const bubbles = wobble(seconds, 18);
  bufferLoop(ctx, seconds, (t) => noise() * (0.35 + bubbles(t) * 0.65))
    .connect(filter(ctx, "bandpass", 1800, 0.6))
    .connect(out);
};

/** The substation transformers' mains hum (50 Hz and its harmonics). */
export const startHum: LoopBuilder = (ctx, out) => {
  for (const [frequency, level] of [
    [100, 0.5],
    [200, 0.25],
    [300, 0.12],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.frequency.value = frequency;
    const gain = ctx.createGain();
    gain.gain.value = level * 0.4;
    osc.connect(gain).connect(out);
    osc.start();
  }
};

/** Trucks and buses on the highway: a low rumble that swells as each one passes. */
export const startTraffic: LoopBuilder = (ctx, out) => {
  const seconds = 12;
  const passing = wobble(seconds, 0.5);
  bufferLoop(ctx, seconds, (t) => noise() * (0.25 + passing(t) ** 2))
    .connect(filter(ctx, "lowpass", 220))
    .connect(out);
};
