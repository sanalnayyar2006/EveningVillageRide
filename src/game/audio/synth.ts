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
