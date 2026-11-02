import geometryData from './castle-sister-geometry.json' with { type: 'json' };
import { placedShapeHit, type OriginalShape, type OriginalPlacement } from './collision.ts';

export interface CastleSister { frame: number; free: boolean; dead: boolean }
export const STANDING_SISTER: Readonly<CastleSister> = { frame: 4, free: true, dead: false };
const geometry = geometryData as unknown as { shapes: Record<string, OriginalShape>; frames: Record<string, OriginalPlacement[]> };

/** Исходные sister_37: damage7→17/stand4, kill20→36/stand4, dead45→72/stop. */
export function advanceCastleSister(sister: CastleSister): void {
  if (sister.frame === 4 || sister.frame === 72) return;
  sister.frame++;
  if (sister.frame === 17 || sister.frame === 36) { sister.frame = 4; sister.free = true; }
}

export function validCastleSister(value: unknown): value is CastleSister {
  if (!value || typeof value !== 'object') return false;
  const sister = value as CastleSister;
  return typeof sister.free === 'boolean' && typeof sister.dead === 'boolean' && Number.isInteger(sister.frame)
    && (sister.dead ? sister.frame >= 45 && sister.frame <= 72
      : sister.frame === 4 || sister.frame >= 7 && sister.frame <= 16 || sister.frame >= 20 && sister.frame <= 35);
}

/** Те же исходные заполненные контуры и матрицы используются без renderer и в браузере. */
export function castleSisterHit(frame: number, x: number, y: number): boolean {
  return (geometry.frames[String(frame)] ?? []).some(placement =>
    placedShapeHit(geometry.shapes[placement.shape], placement, Math.trunc(x * 20), Math.trunc(y * 20)));
}
