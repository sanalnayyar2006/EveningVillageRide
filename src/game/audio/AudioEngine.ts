/**
 * Owns the Web Audio context and volume buses. Browsers block audio until the
 * user interacts, so the context is created on the first key or pointer press.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private volumes = { master: 1, sfx: 1 };
  /** Where the listener (the camera) is and which way it faces, for placing sounds. */
  private listener = { x: 0, y: 0, z: 0, heading: 0 };

  /** Returns a cleanup function. */
  installUnlock(): () => void {
    const unlock = () => {
      const ctx = this.ensureContext();
      if (ctx?.state === "suspended") void ctx.resume();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }

  setVolumes(master: number, sfx: number): void {
    this.volumes = { master, sfx };
    this.applyVolumes();
  }

  /** The sfx bus to connect sounds to, or null while audio is still locked. */
  sfxOutput(): { ctx: AudioContext; out: AudioNode } | null {
    if (!this.ctx || !this.sfx || this.ctx.state !== "running") return null;
    return { ctx: this.ctx, out: this.sfx };
  }

  setListener(x: number, y: number, z: number, heading: number): void {
    Object.assign(this.listener, { x, y, z, heading });
  }

  /**
   * An output for a sound at a point in the world: quieter with distance
   * (silent beyond `range` metres) and panned to the side it comes from.
   * Returns null when audio is locked or the sound is out of earshot.
   */
  spatialOutput(
    [x, y, z]: [number, number, number],
    range: number,
  ): { ctx: AudioContext; out: AudioNode } | null {
    const bus = this.sfxOutput();
    if (!bus) return null;
    const { ctx } = bus;
    const dx = x - this.listener.x;
    const dz = z - this.listener.z;
    const distance = Math.hypot(dx, y - this.listener.y, dz);
    if (distance > range) return null;

    const gain = ctx.createGain();
    // Falls off smoothly to nothing at the edge of earshot, but never jumps in loudly.
    gain.gain.value = Math.min(1, 4 / Math.max(distance, 4)) * (1 - distance / range);
    const panner = ctx.createStereoPanner();
    // Facing (sin h, cos h), the listener's right-hand side is (-cos h, sin h); right is positive pan.
    const right = dz * Math.sin(this.listener.heading) - dx * Math.cos(this.listener.heading);
    panner.pan.value = Math.max(-1, Math.min(1, right / Math.max(distance, 1)));
    gain.connect(panner).connect(bus.out);
    // Let the nodes be collected once the sound has finished.
    setTimeout(() => gain.disconnect(), 8000);
    return { ctx, out: gain };
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.sfx.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.applyVolumes();
    } catch (error) {
      // Sound is optional; the game keeps running silently.
      console.warn("[audio] Web Audio unavailable", error);
      this.ctx = null;
    }
    return this.ctx;
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.master || !this.sfx) return;
    const now = this.ctx.currentTime;
    // setTargetAtTime avoids clicks when a slider moves.
    this.master.gain.setTargetAtTime(this.volumes.master, now, 0.05);
    this.sfx.gain.setTargetAtTime(this.volumes.sfx, now, 0.05);
  }
}

export const audioEngine = new AudioEngine();
