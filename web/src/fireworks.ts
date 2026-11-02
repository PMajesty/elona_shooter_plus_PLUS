export interface FireworkParticle { clip: 'fireworkBit1' | 'fireworkBit2'; angle: number; scale: number; tint: number }
export interface FireworkBurst { delay: number; x: number; y: number; particles: FireworkParticle[] }

/** Декоративный поток отделён от боя: настройки эффектов не меняют добычу и повторы. */
export function fireworkPlan(seed: number, classMedal: boolean): FireworkBurst[] {
  let rng = seed >>> 0 || 1;
  const random = () => { rng ^= rng << 13; rng ^= rng >>> 17; rng ^= rng << 5; return (rng >>> 0) / 4294967296; };
  let delay = 0;
  return Array.from({ length: 48 + Number(classMedal) * 12 }, () => {
    const x = 50 + random() * 550, y = 10 + random() * 40, start = delay * 5;
    delay += Math.trunc(random() * 3) + 2;
    const type = Math.trunc(random() * 3), base = 0.3 + random() / 3, size = random() + 0.7;
    const colors = Array.from({ length: 2 }, () => [random(), random(), random()].reduce((color, value) => color * 256 + Math.min(255, Math.trunc((value / 3 + 0.7) * 255)), 0));
    let color = Math.trunc(random() * 2), scale = base;
    const op = Math.trunc(random() * 3), clip = random() * 4 < 1 ? 'fireworkBit2' : 'fireworkBit1';
    const particles = Array.from({ length: type === 2 ? 49 : 40 }, (_, index): FireworkParticle => {
      if (op === 0) color = Math.trunc(random() * 2);
      let angle = random() * 360;
      if (type === 0) scale = random() * 0.4 + 0.1;
      else if (type === 1 && index % 30 === 19) scale *= 0.3;
      else if (type === 2) { scale = Math.trunc((index + 1) / 10) * 0.1 + 0.1; angle = (index + 1) * 36 + scale * 100; }
      return { clip, angle, scale: scale * size, tint: colors[color] };
    });
    return { delay: start, x, y, particles };
  });
}

export const FIREWORK_MEDAL_FRAMES = 651;
