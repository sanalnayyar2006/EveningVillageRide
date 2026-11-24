/**
 * Owns the Web Audio context and the volume buses. Browsers only allow audio
 * after a user gesture, so the context is created lazily and resumed on the
 * first key or pointer press.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private volumes = { master: 1, sfx: 1, muted: false };

  /** Install the one-time unlock listeners. Returns a cleanup function. */
  installUnlock(): () => void {
    const unlock = () => {
      const ctx = this.ensureContext();
      if (ctx && ctx.state === "suspended") void ctx.resume();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
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
      // Audio is atmosphere, never a requirement: keep the game running silently.
      console.warn("[audio] Web Audio unavailable", error);
      this.ctx = null;
    }
    return this.ctx;
  }

  setVolumes(master: number, sfx: number, muted: boolean): void {
    this.volumes = { master, sfx, muted };
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.master || !this.sfx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.volumes.muted ? 0 : this.volumes.master, t, 0.05);
    this.sfx.gain.setTargetAtTime(this.volumes.sfx, t, 0.05);
  }

  /** The context and sfx bus, only if audio is unlocked and running. */
  sfxOutput(): { ctx: AudioContext; out: AudioNode } | null {
    if (!this.ctx || !this.sfx || this.ctx.state !== "running") return null;
    return { ctx: this.ctx, out: this.sfx };
  }
}

export const audioEngine = new AudioEngine();
