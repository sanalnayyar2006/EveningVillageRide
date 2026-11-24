/**
 * Owns the Web Audio context and volume buses. Browsers block audio until the
 * user interacts, so the context is created on the first key or pointer press.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private volumes = { master: 1, sfx: 1 };

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
