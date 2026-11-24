/**
 * Procedural sound effects. Synthesising them keeps the download at zero
 * bytes; each function schedules nodes that clean themselves up when done.
 */

/** Ratios of a small struck steel dome (inharmonic, so it sounds like metal). */
const BELL_PARTIALS = [
  { ratio: 1, gain: 1, decay: 0.9 },
  { ratio: 2.32, gain: 0.55, decay: 0.55 },
  { ratio: 4.25, gain: 0.3, decay: 0.3 },
  { ratio: 6.63, gain: 0.15, decay: 0.18 },
];

function strike(ctx: AudioContext, out: AudioNode, when: number, base: number, level: number) {
  for (const p of BELL_PARTIALS) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = base * p.ratio;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(level * p.gain, when + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + p.decay);
    osc.connect(gain).connect(out);
    osc.start(when);
    osc.stop(when + p.decay + 0.05);
  }
}

/** The classic two-strike "tring-tring" of a thumb-lever bicycle bell. */
export function playBicycleBell(ctx: AudioContext, out: AudioNode) {
  const t = ctx.currentTime + 0.01;
  const base = 2050 + Math.random() * 60;
  strike(ctx, out, t, base, 0.16);
  strike(ctx, out, t + 0.13, base * 1.005, 0.13);
}
