export interface EnemyArrowState {
  uid: number; x: number; dx: number; dy: number; sy: number;
  y: number; rotation: number; shadowY: number; age: number; removed: boolean;
}

const position = (value: number) => Math.trunc(value * 20) / 20;

/** Стрела лучника — только графика: замок повреждается в кадре выпуска, а не при её прилёте. */
export function createEnemyArrow(uid: number, x: number, y: number): EnemyArrowState {
  const dx = (700 - x) / 30 * -1;
  return { uid, x: position(x), dx, dy: y - dx * dx / 3, sy: y + 11,
    y: -38, rotation: 0, shadowY: -18.1, age: 0, removed: false };
}

export function advanceEnemyArrow(arrow: EnemyArrowState): void {
  arrow.x = position(arrow.x + 15);
  arrow.dx++;
  arrow.y = position(arrow.dy + arrow.dx * arrow.dx / 3);
  const angle = arrow.dx * 2.5 + 90;
  arrow.rotation = angle >= -180 && angle <= 180 ? angle : ((angle + 180) % 360 + 360) % 360 - 180;
  arrow.shadowY = position(arrow.sy);
  arrow.age++;
  arrow.removed = arrow.x > 650;
}
