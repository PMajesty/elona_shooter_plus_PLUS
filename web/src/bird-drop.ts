import { WORLD } from './content.ts';
import type { EnemyState } from './simulation.ts';

export const RAT_DROP_BODY_X = -3.45;
export const RAT_DROP_SHADOW = { x: -10.1, y: 9, scaleX: 0.8142853, scaleY: 0.634552 };

/** enemy._ratdrop: y остаётся на земле, перемещается вложенный mc.rat. */
export function advanceRatFall(enemy: EnemyState, random: () => number): void {
  if (!enemy.dropping) return;
  if (enemy.hp <= 0) {
    enemy.dropRotation = 0; enemy.dropY! += 8;
    enemy.dropFrame = (enemy.dropFrame ?? 16) >= 18 ? 16 : (enemy.dropFrame ?? 16) + 1;
  } else {
    enemy.dropY! += 1.5; enemy.x += enemy.dropDrift!;
    if (enemy.dropDrift! > 0 && enemy.dropRotation! < 10) enemy.dropRotation! += 0.7;
    else if (enemy.dropDrift! < 0 && enemy.dropRotation! > -10) enemy.dropRotation! -= 0.7;
    if (random() > 0.95) enemy.dropDrift! *= -1;
    enemy.x = Math.min(enemy.x, WORLD.defenseLine);
    enemy.dropFrame = (enemy.dropFrame ?? 1) >= 14 ? 1 : (enemy.dropFrame ?? 1) + 1;
  }
  if (enemy.dropY! >= RAT_DROP_SHADOW.y + 8) {
    for (const key of ['dropping', 'dropY', 'dropDrift', 'dropRotation', 'dropFrame'] as const) delete enemy[key];
    enemy.shadowHit = false; enemy.frame = enemy.hp <= 0 ? 93 : 14;
  }
}

/** Обратное преобразование тела, без неподвижной наземной тени. */
export function ratDropLocalPoint(enemy: Readonly<EnemyState>, x: number, y: number): { x: number; y: number } {
  const angle = -(enemy.dropRotation ?? 0) * Math.PI / 180;
  const dx = x - enemy.x - RAT_DROP_BODY_X, dy = y - enemy.y - (enemy.dropY ?? 0);
  return { x: dx * Math.cos(angle) - dy * Math.sin(angle), y: dx * Math.sin(angle) + dy * Math.cos(angle) };
}
