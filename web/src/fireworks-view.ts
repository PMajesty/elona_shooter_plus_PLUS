import Phaser from 'phaser';
import { fireworkPlan } from './fireworks.ts';

export function createFireworks(scene: Phaser.Scene, manifest: { clips: Record<string, { originX: number; originY: number; frameWidth: number; frameHeight: number; count: number }> }, seed: number, classMedal: boolean) {
  const root = scene.add.container(0, 0).setName('original-fireworks');
  const plan = fireworkPlan(seed, classMedal), live = new Map<number, { launch: Phaser.GameObjects.Image; particles: Phaser.GameObjects.Image[] }>();
  let accumulator = 0, frame = 0;
  const sprite = (key: string, x: number, y: number) => {
    const a = manifest.clips[key], object = scene.add.image(x, y, key, '1').setOrigin(a.originX / a.frameWidth, a.originY / a.frameHeight); root.add(object); return object;
  };
  return { root, get frame() { return frame; }, get finished() { return frame > plan[plan.length - 1].delay + 93; }, destroy() { root.destroy(true); },
    advance(delta: number) {
      accumulator += Math.min(delta, 250);
      while (accumulator >= 1000 / 30) {
        accumulator -= 1000 / 30; frame++;
        plan.forEach((burst, index) => {
          const age = frame - burst.delay;
          if (age < 1 || age > 93) return;
          let objects = live.get(index);
          if (!objects) { objects = { launch: sprite('fireworkLaunch', burst.x, burst.y), particles: [] }; live.set(index, objects); }
          objects.launch.setFrame(String(age));
          if (age === 30) objects.particles = burst.particles.map(p => sprite(p.clip, burst.x, burst.y).setAngle(p.angle).setScale(p.scale).setTint(p.tint));
          objects.particles.forEach((particle, i) => particle.setFrame(String(Math.min(manifest.clips[burst.particles[i].clip].count, age - 29))));
          if (age === 93) { objects.launch.destroy(); objects.particles.forEach(p => p.destroy()); live.delete(index); }
        });
      }
    },
  };
}
