import type { EnemyKind } from './content.ts';

export type OrdinaryEnemyKind = Exclude<EnemyKind, 'boss'>;
export interface OrdinaryEnemyGeometry { kind: OrdinaryEnemyKind; x: number; y: number; frame: number; shadowHit: boolean; rageEffectFrame?: number }
export interface RgbaMask { width: number; height: number; data: ArrayLike<number> }
interface OriginalShape { bounds: [number, number, number, number]; fills: number[][][] }
interface OriginalPlacement { shape: string; matrix: [number, number, number, number, number, number]; shadow: boolean }
export interface CollisionGeometry {
  version: 1; units: 'twips'; sourceSha256: string;
  shapes: Record<string, OriginalShape>;
  enemies: Record<OrdinaryEnemyKind, { symbol: number; count: number; frames: Record<string, OriginalPlacement[]> }>;
  effects?: Record<string, { symbol: number; count: number; frames: Record<string, OriginalPlacement[]> }>;
}

/** Флаг задают только скрипты определённых кадров; возврат sheep 32→5 его не восстанавливает. */
export function shadowHitAtFrame(kind: EnemyKind, frame: number, previous?: boolean): boolean {
  if (kind === 'lava') {
    if (frame === 1) return true;
    if (frame === 23) return false;
    return previous ?? frame < 23;
  }
  if (kind === 'barbarian' && frame === 1) return true;
  if (kind === 'sheep') {
    if (frame === 1 || frame === 107) return true;
    if (frame === 32) return false;
    // В старом сохранении истории нет: сохраняем прежнее правило текущего кадра.
    return previous ?? !(frame >= 32 && frame <= 95);
  }
  if (kind === 'crow') {
    if (frame === 1) return false;
    if (frame === 69) return true;
    return previous ?? frame >= 69;
  }
  if (kind === 'fly') {
    if (frame === 1) return false;
    if (frame === 23) return true;
    return previous ?? frame >= 23;
  }
  return previous ?? true;
}

/** Одинаковая проверка альфа-канала для браузерного холста и сравнения с исходным SWF. */
export function alphaMaskHit(mask: RgbaMask, x: number, y: number): boolean {
  const localX = Math.floor(x), localY = Math.floor(y);
  return localX >= 0 && localY >= 0 && localX < mask.width && localY < mask.height && mask.data[(localY * mask.width + localX) * 4 + 3] > 0;
}

function fillHit(edges: number[][], x: number, y: number): boolean {
  let crossings = 0;
  for (const edge of edges) {
    const [x0, y0, x1, y1, x2, y2] = edge;
    if (edge.length === 4) {
      if ((y0 > y) !== (y1 > y) && x <= x0 + (y - y0) * (x1 - x0) / (y1 - y0)) crossings++;
      continue;
    }
    // Квадратичные контуры крови проверяются аналитически, без растрового допуска.
    const a = y0 - 2 * y1 + y2, b = 2 * (y1 - y0), c = y0 - y;
    const discriminant = b * b - 4 * a * c;
    const roots = a === 0 ? (b === 0 ? [] : [-c / b]) : discriminant > 0 ? [(-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a)] : [];
    for (const t of roots) {
      if (t < 0 || t >= 1 || b + 2 * a * t === 0) continue;
      const inverse = 1 - t;
      if (x <= inverse * inverse * x0 + 2 * inverse * t * x1 + t * t * x2) crossings++;
    }
  }
  return crossings % 2 !== 0;
}

/** Матрица Ruffle округляет обе стадии отдельно: ближайший twip, половины к чётному. */
function evenRound(value: number): number {
  const low = Math.floor(value), fraction = value - low;
  return fraction < 0.5 ? low : fraction > 0.5 ? low + 1 : low % 2 === 0 ? low : low + 1;
}
function placedShapeHit(shape: OriginalShape, placement: OriginalPlacement, x: number, y: number, ox = 0, oy = 0): boolean {
  const [a, b, c, d, tx, ty] = placement.matrix;
  // Обратная матрица строится в глобальных координатах с исходной точностью f32.
  const f = Math.fround;
  const determinant = f(f(a * d) - f(b * c));
  if (!determinant) return false;
  const ia = f(d / determinant), ib = f(b / -determinant), ic = f(c / -determinant), id = f(a / determinant);
  const gtx = f(tx + ox), gty = f(ty + oy);
  const itx = evenRound(f(f(f(d * gtx) - f(c * gty)) / -determinant));
  const ity = evenRound(f(f(f(b * gtx) - f(a * gty)) / determinant));
  const localX = evenRound(f(f(ia * f(x)) + f(ic * f(y)))) + itx;
  const localY = evenRound(f(f(ib * f(x)) + f(id * f(y)))) + ity;
  const [left, top, right, bottom] = shape.bounds;
  return localX >= left && localX <= right && localY >= top && localY <= bottom && shape.fills.some(edges => fillHit(edges, localX, localY));
}

/** Flash проверяет заполненные контуры bitmap-fill, включая прозрачные пиксели внутри них. */
export function ordinaryEnemyHit(
  enemy: Readonly<OrdinaryEnemyGeometry>, x: number, y: number, geometry: CollisionGeometry,
): boolean {
  const clip = geometry.enemies[enemy.kind];
  const placements = clip.frames[String(enemy.frame)] ?? clip.frames['1'];
  // Сам объект хранит twip-координаты; обратную матрицу нельзя заменить
  // предварительным вычитанием его позиции: порядок округления меняет края. Не учитываем здесь корневое смещение экрана.
  const localX = Math.trunc(x * 20), ox = Math.trunc(enemy.x * 20);
  const localY = Math.trunc(y * 20), oy = Math.trunc(enemy.y * 20);
  const excludeShadow = !enemy.shadowHit;
  let bodyHit = false;
  for (const placement of placements) {
    if (!placedShapeHit(geometry.shapes[placement.shape], placement, localX, localY, ox, oy)) continue;
    if (excludeShadow && placement.shadow) return false;
    bodyHit = true;
  }
  // Исходная вспышка ярости — дочерний объект mc и участвует в его hitTestPoint.
  if (enemy.kind === 'barbarian' && enemy.rageEffectFrame && enemy.rageEffectFrame < 13) {
    for (const placement of geometry.effects?.enemyRage.frames[String(enemy.rageEffectFrame)] ?? []) {
      if (placedShapeHit(geometry.shapes[placement.shape], placement, localX, localY, ox, oy + 400)) bodyHit = true;
    }
  }
  return bodyHit;
}
