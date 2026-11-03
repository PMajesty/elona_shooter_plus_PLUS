/** Исходные shake/shakeFrame; отдельные часы показа не меняют RNG симуляции. */
export class ScreenShake {
  remaining = 0;
  x = 0;
  y = 0;
  private clock = 0;
  private range = 0;
  private decay = 1;
  private strengthX = 0;
  private strengthY = 0;
  private directionX = 1;
  private directionY = 1;

  start(frames: number, strength: number, decay: number, random = Math.random): void {
    this.reset(); this.remaining = frames;
    // Параметр силы в AS имеет тип int, включая вызовы с аргументом1.5.
    this.range = Math.trunc(strength); this.decay = decay;
    this.strengthX = this.strengthY = this.range / 2;
    this.directionX = random() > 0.5 ? -1 : 1;
    this.directionY = random() > 0.5 ? -1 : 1;
  }

  advance(delta: number): void {
    this.clock += Math.min(delta, 250);
    while (this.clock >= 1000 / 30 && this.remaining > 0) {
      this.clock -= 1000 / 30; this.remaining--; this.range *= this.decay;
      this.strengthX += this.range / 4 * this.directionX;
      this.strengthY += this.range / 4 * this.directionY;
      this.x += this.strengthX * this.directionX;
      this.y += this.strengthY * this.directionY;
      if (this.x > this.range) { this.x = this.range; this.directionX *= -1; }
      if (this.x < -this.range) { this.x = -this.range; this.directionX *= -1; }
      if (this.y > this.range) { this.y = this.range; this.directionY *= -1; }
      if (this.y < -this.range) { this.y = -this.range; this.directionY *= -1; }
      if (!this.remaining) this.reset();
    }
    if (!this.remaining) this.clock = 0;
  }

  reset(): void { this.remaining = this.x = this.y = this.clock = 0; }
}
