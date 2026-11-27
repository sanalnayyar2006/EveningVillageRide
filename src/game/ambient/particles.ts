import { BufferAttribute, BufferGeometry, Color, ShaderMaterial } from "three";

/** How one kind of puff looks and moves over its life. */
export interface PuffStyle {
  color: Color;
  /** Seconds, picked between these. */
  life: [number, number];
  /** Diameter in metres at birth and at death. */
  size: [number, number];
  /** Opacity at birth; it fades to nothing. */
  opacity: number;
  /** Upward acceleration (m/s²): smoke rises, dust settles. */
  lift: number;
  /** Fraction of velocity kept per second. */
  drag: number;
}

/**
 * A fixed pool of soft round puffs (dust, steam, smoke), drawn in one call.
 * Emitters spawn into it; each frame it moves, grows and fades every live puff.
 */
export class PuffPool {
  readonly geometry = new BufferGeometry();
  readonly material: ShaderMaterial;
  private readonly position: Float32Array;
  private readonly size: Float32Array;
  private readonly alpha: Float32Array;
  private readonly color: Float32Array;
  private readonly velocity: Float32Array;
  private readonly age: Float32Array;
  private readonly life: Float32Array;
  private readonly styles: PuffStyle[];
  private count = 0;

  constructor(private readonly capacity: number) {
    this.position = new Float32Array(capacity * 3);
    this.size = new Float32Array(capacity);
    this.alpha = new Float32Array(capacity);
    this.color = new Float32Array(capacity * 3);
    this.velocity = new Float32Array(capacity * 3);
    this.age = new Float32Array(capacity);
    this.life = new Float32Array(capacity);
    this.styles = new Array<PuffStyle>(capacity);

    this.geometry.setAttribute("position", new BufferAttribute(this.position, 3));
    this.geometry.setAttribute("aSize", new BufferAttribute(this.size, 1));
    this.geometry.setAttribute("aAlpha", new BufferAttribute(this.alpha, 1));
    this.geometry.setAttribute("aColor", new BufferAttribute(this.color, 3));
    this.geometry.setDrawRange(0, 0);

    this.material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        /** Pixels per metre at one metre away: viewport height / (2·tan(fov/2)). */
        uPixelsPerMetre: { value: 600 },
        /** Puffs aren't lit, so they are dimmed by hand as the evening darkens. */
        uLight: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aAlpha;
        attribute vec3 aColor;
        uniform float uPixelsPerMetre;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewPosition;
          gl_PointSize = aSize * uPixelsPerMetre / -viewPosition.z;
          vAlpha = aAlpha;
          vColor = aColor;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uLight;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          float edge = length(gl_PointCoord - 0.5) * 2.0;
          float alpha = vAlpha * (1.0 - smoothstep(0.15, 1.0, edge));
          if (alpha < 0.005) discard;
          gl_FragColor = vec4(vColor * uLight, alpha);
        }`,
    });
  }

  /** Spawn one puff; when the pool is full the newest are dropped. */
  emit(
    style: PuffStyle,
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    random: () => number,
  ): void {
    if (this.count >= this.capacity) return;
    const i = this.count++;
    this.position.set([x, y, z], i * 3);
    this.velocity.set([vx, vy, vz], i * 3);
    this.color.set([style.color.r, style.color.g, style.color.b], i * 3);
    this.age[i] = 0;
    this.life[i] = style.life[0] + random() * (style.life[1] - style.life[0]);
    this.styles[i] = style;
  }

  /** Age, move and fade every puff; `windX`/`windZ` push them all (m/s). */
  update(dt: number, windX: number, windZ: number): void {
    let i = 0;
    while (i < this.count) {
      this.age[i]! += dt;
      if (this.age[i]! >= this.life[i]!) {
        this.moveLast(i);
        continue;
      }
      const style = this.styles[i]!;
      const t = this.age[i]! / this.life[i]!;
      const keep = Math.pow(style.drag, dt);
      const v = i * 3;
      this.velocity[v] = this.velocity[v]! * keep + windX * (1 - keep);
      this.velocity[v + 1] = this.velocity[v + 1]! * keep + style.lift * dt;
      this.velocity[v + 2] = this.velocity[v + 2]! * keep + windZ * (1 - keep);
      this.position[v]! += this.velocity[v]! * dt;
      this.position[v + 1]! += this.velocity[v + 1]! * dt;
      this.position[v + 2]! += this.velocity[v + 2]! * dt;
      this.size[i] = style.size[0] + (style.size[1] - style.size[0]) * Math.sqrt(t);
      // A quick fade in, then a long fade out.
      this.alpha[i] = style.opacity * Math.min(1, t * 8) * (1 - t) * (1 - t);
      i++;
    }
    this.geometry.setDrawRange(0, this.count);
    for (const name of ["position", "aSize", "aAlpha", "aColor"]) {
      this.geometry.getAttribute(name).needsUpdate = true;
    }
  }

  /** Remove puff `i` by moving the last live puff into its slot. */
  private moveLast(i: number): void {
    const last = --this.count;
    if (i === last) return;
    this.position.copyWithin(i * 3, last * 3, last * 3 + 3);
    this.velocity.copyWithin(i * 3, last * 3, last * 3 + 3);
    this.color.copyWithin(i * 3, last * 3, last * 3 + 3);
    this.age[i] = this.age[last]!;
    this.life[i] = this.life[last]!;
    this.styles[i] = this.styles[last]!;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
