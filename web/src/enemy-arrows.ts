export type EnemyShotKind = 'bolt' | 'tank-bolt' | 'fireball';

export interface EnemyArrowState {
  kind?: EnemyShotKind;
  uid: number; x: number; dx: number; dy: number; sy: number;
  y: number; rotation: number; shadowY: number; age: number; removed: boolean;
}

const position = (value: number) => Math.trunc(value * 20) / 20;
const rotation = (angle: number) => angle >= -180 && angle <= 180 ? angle : ((angle + 180) % 360 + 360) % 360 - 180;

/** Стрела лучника — только графика: замок повреждается в кадре выпуска, а не при её прилёте. */
export function createEnemyArrow(uid: number, x: number, y: number): EnemyArrowState {
  const dx = (700 - x) / 30 * -1;
  return { uid, x: position(x), dx, dy: y - dx * dx / 3, sy: y + 11,
    y: -38, rotation: 0, shadowY: -18.1, age: 0, removed: false };
}

/** Отдельные снаряды Cata/Tank/Dragon тоже декоративны; формулы перенесены из bolt/bolt_tank/fireball. */
export function createEnemyShot(uid: number, kind: EnemyShotKind, x: number, y: number): EnemyArrowState {
  const dx = kind === 'fireball' ? 0 : (700 - x) / 30 * -1;
  return { kind, uid, x: position(x + (kind === 'tank-bolt' ? 65 : 50)), dx,
    dy: kind === 'fireball' ? y : y - dx * dx / 8 - 25, sy: y + 10,
    y: kind === 'bolt' ? -34.05 : kind === 'tank-bolt' ? -27.55 : -34.5,
    rotation: rotation(dx + 90), shadowY: -12.05, age: 0, removed: false };
}

export function advanceEnemyArrow(arrow: EnemyArrowState): void {
  arrow.x = position(arrow.x + (arrow.kind ? 25 : 15));
  arrow.dx++;
  arrow.y = position(arrow.kind === 'fireball' ? arrow.dy + (240 - arrow.dy) / 20 * arrow.dx : arrow.dy + arrow.dx * arrow.dx / (arrow.kind ? 8 : 3));
  arrow.rotation = rotation(arrow.dx * (arrow.kind === 'fireball' ? 10 : arrow.kind ? 1 : 2.5) + 90);
  arrow.shadowY = position(arrow.sy);
  arrow.age++;
  arrow.removed = arrow.x > 650;
}
