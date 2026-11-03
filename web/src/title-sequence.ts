import type Phaser from 'phaser';
import { ScreenShake } from './screen-shake.ts';

const runners = [
  [500, 220, 4, 4.4], [480, 225, 5, 4.6], [485, 260, 2, 4], [440, 290, 3, 2.3],
  [405, 175, 0, 1.2], [410, 190, 1, 1.1], [490, 330, 6, 3.2], [400, 320, 7, 2.3],
] as const;

function runnerPosition(start: number, speed: number, frame: number): number {
  const approach = Math.min(45, Math.max(0, frame - 49));
  return start + approach * (0.25 + speed / 8) - Math.max(0, frame - 129) * speed;
}

// Урон проходит справа налево. После попадания бегун остаётся в месте падения.
const hits = runners.map(([start, , , speed]) => {
  for (let f = 151; f <= 400; f++) if (runnerPosition(start, speed, f) > 480 - (f - 150) * 5) return f;
  return Infinity;
});

export function titleRunner(frame: number, index: number) {
  const [start, y, pic, speed] = runners[index];
  const hit = hits[index], notice = 98 + index;
  let pose = Math.min(45, frame + 1);
  if (frame >= 50) pose = 75 + (frame - 50) % 6;
  if (frame >= notice) pose = Math.min(67, 59 + frame - notice);
  if (frame >= 130) pose = 75 + (frame - 130) % 6;
  if (frame >= hit) pose = Math.min(120, 88 + frame - hit);
  return { x: runnerPosition(start, speed, Math.min(frame, hit)), y, frame: pic * 120 + pose };
}

export function titleButtonOffset(frame: number, index: number): number {
  return 25 * Math.min(0, Math.max(-11 - index * 4, frame - (30 + index * 9)));
}

type Image = Phaser.GameObjects.Image;
type Clip = (key: string, frame: number, x: number, y: number) => Image;

export function createTitleSequence(clip: Clip, actorsLayer: Phaser.GameObjects.Container, cloud: Image, buttons: Image[], start: number,
  shakeView: (x: number, y: number) => void, impactSound: () => void) {
  const actors = ([
    ['titleBoy', 253, 190.4, 50], ['titleGirl', 304.9, 253, 58], ['titleCat', 302.9, 305, 71],
    ['titleLady', 261, 305, 70], ['titleSister', 596, 99, 307],
  ] as const).map(([key, x, y, stop]) => {
    const image = clip(key, 1, x, y);
    actorsLayer.add(image);
    return { image, stop };
  });
  const crowd = runners.map(([, y], i) => {
    const pose = titleRunner(start, i);
    const image = clip('titleRunners', pose.frame, pose.x, y);
    return { image, originX: pose.x - image.x };
  });
  const settled = buttons.map(image => image.y);
  const bursts: { image: Image; age: number; limit: number }[] = [];
  const burst = (key: string, x: number, y: number, count: number) => bursts.push({ image: clip(key, 1, x, y), age: 0, limit: count });
  const shake = new ScreenShake();
  let frame = start, clock = 0;
  function paint() {
    cloud.x = frame <= 2910 ? 175 - frame * 0.5 : -((frame - 2911) % 2561) * 0.5;
    if (frame > 400 && frame !== start) return;
    actors.forEach(({ image, stop }) => image.setFrame(String(Math.min(stop, frame + 1))));
    for (const [i, { image, originX }] of crowd.entries()) {
      const p = titleRunner(frame, i); image.x = p.x - originX; image.setFrame(String(p.frame));
    }
    buttons.forEach((image, i) => { image.y = settled[i] + titleButtonOffset(frame, i); });
  }
  paint();
  return {
    get frame() { return frame; },
    advance(delta: number) {
      clock += Math.min(delta, 250);
      while (clock >= 1000 / 30) {
        clock -= 1000 / 30; frame++;
        paint();
        if (frame > 400) continue;
        for (let i = bursts.length - 1; i >= 0; i--) {
          const b = bursts[i];
          if (++b.age >= b.limit) { b.image.destroy(); bursts.splice(i, 1); }
          else b.image.setFrame(String(b.age + 1)).setAlpha(Math.min(1, (b.limit - b.age) / 5));
        }
        for (const [i, impact] of [29, 38, 47].entries()) {
          if (frame === impact) { shake.start(i === 2 ? 30 : 20, 5, 0.9); impactSound(); }
          if (frame >= impact && frame <= impact + 10) burst('groundImpact', 250 + Math.random() * (i === 2 ? 80 : 100), 245 + 50 * i + Math.random() * 10, 17);
        }
        if (frame >= 150 && frame < 230 && frame % 2 === 0) burst('groundImpact', 480 - (frame - 150) * 5 + Math.random() * 15, 160 + Math.random() * 200, 17);
        hits.forEach((hit, i) => { if (frame === hit) { const p = titleRunner(frame, i); burst('bloodHit', p.x, p.y - 5, 13); } });
        shake.advance(1000 / 30); shakeView(shake.x, shake.y);
      }
    },
  };
}

// Отсутствие необязательной заставки не должно блокировать главное меню.
export function playOpening(container: HTMLElement, url: string, done: () => void): () => void {
  const skip = document.createElement('button'), art = new window.Image();
  skip.className = 'opening-movie'; skip.type = 'button'; skip.ariaLabel = 'Skip intro';
  skip.append(art); art.alt = ''; container.append(skip);
  let timer: number, active = true;
  const cleanup = () => { active = false; clearTimeout(timer); skip.remove(); };
  const finish = () => { if (active) { cleanup(); done(); } };
  skip.onclick = finish;
  skip.onkeydown = e => { if (e.key === 'Escape') { e.preventDefault(); finish(); } };
  art.onerror = finish;
  art.onload = () => { if (active) { clearTimeout(timer); timer = window.setTimeout(finish, 171 * 1000 / 30); } };
  timer = window.setTimeout(finish, 7000);
  art.src = url;
  return cleanup;
}
