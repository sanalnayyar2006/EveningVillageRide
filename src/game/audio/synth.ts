/** Sound effects synthesised in code, so there are no audio files to download. */

/** Partials of a small struck steel dome. The ratios are inharmonic, which is what makes it sound metallic. */
const BELL_PARTIALS = [
  { ratio: 1, gain: 1, decay: 0.9 },
  { ratio: 2.32, gain: 0.55, decay: 0.55 },
  { ratio: 4.25, gain: 0.3, decay: 0.3 },
  { ratio: 6.63, gain: 0.15, decay: 0.18 },
];

function strikeBell(
  ctx: AudioContext,
  out: AudioNode,
  startTime: number,
  baseFrequency: number,
  volume: number,
) {
  for (const partial of BELL_PARTIALS) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = baseFrequency * partial.ratio;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * partial.gain, startTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + partial.decay);
    osc.connect(gain).connect(out);
    osc.start(startTime);
    osc.stop(startTime + partial.decay + 0.05);
  }
}

/** The two-strike "tring-tring" of a thumb-lever bicycle bell. */
export function playBicycleBell(ctx: AudioContext, out: AudioNode) {
  const start = ctx.currentTime + 0.01;
  const pitch = 2050 + Math.random() * 60;
  strikeBell(ctx, out, start, pitch, 0.16);
  strikeBell(ctx, out, start + 0.13, pitch * 1.005, 0.13);
}

/** A short burst of filtered noise: one blade of a camera shutter. */
function shutterClick(ctx: AudioContext, out: AudioNode, startTime: number, volume: number) {
  const length = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3200;
  filter.Q.value = 0.8;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  noise.connect(filter).connect(gain).connect(out);
  noise.start(startTime);
}

/** The "click-clack" a phone plays when it takes a picture. */
export function playShutter(ctx: AudioContext, out: AudioNode) {
  const start = ctx.currentTime + 0.005;
  shutterClick(ctx, out, start, 0.5);
  shutterClick(ctx, out, start + 0.075, 0.35);
}

/** A burst of filtered noise with a simple envelope; the base of most animal sounds. */
function noiseBurst(
  ctx: AudioContext,
  out: AudioNode,
  start: number,
  seconds: number,
  filter: { type: BiquadFilterType; frequency: number; q: number },
  volume: number,
) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const shaping = ctx.createBiquadFilter();
  shaping.type = filter.type;
  shaping.frequency.value = filter.frequency;
  shaping.Q.value = filter.q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + seconds * 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  source.connect(shaping).connect(gain).connect(out);
  source.start(start);
}

/** A voiced tone (saw wave through a formant filter), gliding between pitches. */
function voice(
  ctx: AudioContext,
  out: AudioNode,
  start: number,
  seconds: number,
  pitch: [number, number],
  formant: number,
  volume: number,
) {
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(pitch[0], start);
  osc.frequency.linearRampToValueAtTime(pitch[1], start + seconds);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = formant;
  filter.Q.value = 2.5;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + Math.min(0.15, seconds * 0.3));
  gain.gain.setValueAtTime(volume, start + seconds * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(filter).connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

/** A long, low "mooo" that rises and falls. */
export function playMoo(ctx: AudioContext, out: AudioNode) {
  const start = ctx.currentTime + 0.01;
  const base = 95 + Math.random() * 20;
  voice(ctx, out, start, 1.4, [base, base * 1.25], 420, 0.5);
  voice(ctx, out, start + 0.9, 0.7, [base * 1.25, base * 0.9], 380, 0.35);
}

/** A short, sharp "woof". */
export function playBark(ctx: AudioContext, out: AudioNode) {
  const start = ctx.currentTime + 0.01;
  const base = 330 + Math.random() * 80;
  voice(ctx, out, start, 0.16, [base * 1.4, base], 900, 0.55);
  noiseBurst(ctx, out, start, 0.12, { type: "bandpass", frequency: 1100, q: 1.5 }, 0.25);
}

/** A wavering "meh-eh-eh". */
export function playBleat(ctx: AudioContext, out: AudioNode) {
  const start = ctx.currentTime + 0.01;
  const base = 420 + Math.random() * 80;
  for (let i = 0; i < 4; i++) {
    voice(ctx, out, start + i * 0.09, 0.12, [base, base * 0.92], 1300, 0.25);
  }
}

/** A flurry of wing beats as a flock takes off. */
export function playWings(ctx: AudioContext, out: AudioNode) {
  const start = ctx.currentTime + 0.01;
  for (let i = 0; i < 10; i++) {
    noiseBurst(
      ctx,
      out,
      start + i * 0.07 + Math.random() * 0.03,
      0.08,
      { type: "bandpass", frequency: 700, q: 0.8 },
      0.18,
    );
  }
}

/** Children cheering a big hit: a swell of breathy voices. */
export function playCheer(ctx: AudioContext, out: AudioNode) {
  const start = ctx.currentTime + 0.01;
  noiseBurst(ctx, out, start, 1.6, { type: "bandpass", frequency: 1500, q: 0.7 }, 0.3);
  for (let i = 0; i < 4; i++) {
    const pitch = 380 + Math.random() * 180;
    voice(ctx, out, start + i * 0.12, 0.9, [pitch, pitch * 1.2], 1600, 0.12);
  }
}

/** The big temple bell: a deep strike that hums on for seconds. */
export function playTempleBell(ctx: AudioContext, out: AudioNode) {
  const start = ctx.currentTime + 0.01;
  const pitch = 520 + Math.random() * 30;
  for (const [ratio, gain, decay] of [
    [0.5, 0.5, 5],
    [1, 0.6, 4],
    [2.4, 0.3, 2.5],
    [3.9, 0.15, 1.5],
  ] as const) {
    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();
    osc.frequency.value = pitch * ratio;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(gain * 0.4, start + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + decay);
    osc.connect(envelope).connect(out);
    osc.start(start);
    osc.stop(start + decay + 0.1);
  }
}

/** A narrow-gauge diesel's two-tone horn. */
export function playTrainHorn(ctx: AudioContext, out: AudioNode) {
  const start = ctx.currentTime + 0.01;
  for (const [pitch, delay, length] of [
    [311, 0, 1.6],
    [370, 0, 1.6],
    [311, 1.9, 0.6],
    [370, 1.9, 0.6],
  ] as const) {
    voice(ctx, out, start + delay, length, [pitch, pitch * 0.99], 900, 0.35);
  }
}

/** One "tweet": a quick downward whistle. */
export function playChirp(ctx: AudioContext, out: AudioNode) {
  const start = ctx.currentTime + 0.01;
  const notes = 1 + Math.floor(Math.random() * 3);
  const base = 2800 + Math.random() * 1600;
  for (let i = 0; i < notes; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = start + i * 0.11;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 0.7, t + 0.08);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(gain).connect(out);
    osc.start(t);
    osc.stop(t + 0.1);
  }
}

/**
 * A looping bed of noise for wind or insects. Returns its gain so the caller
 * can fade it with the weather and the time of day.
 */
export function startLoop(ctx: AudioContext, out: AudioNode, kind: "wind" | "insects"): GainNode {
  const seconds = 4;
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const noise = Math.random() * 2 - 1;
    // Insects: noise chopped into fast, regular pulses, like crickets in the grass.
    data[i] =
      kind === "insects"
        ? noise * (Math.sin((i / ctx.sampleRate) * Math.PI * 2 * 38) > 0.6 ? 1 : 0)
        : noise;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = kind === "wind" ? "lowpass" : "bandpass";
  filter.frequency.value = kind === "wind" ? 420 : 4800;
  filter.Q.value = kind === "wind" ? 0.7 : 6;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  source.connect(filter).connect(gain).connect(out);
  source.start();
  return gain;
}
