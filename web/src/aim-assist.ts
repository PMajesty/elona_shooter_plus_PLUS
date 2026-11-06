export interface AimPoint { x: number; y: number }
export type AimHitTest = (x: number, y: number) => boolean;

export const AIM_ASSIST_REACH = 12;
export const AIM_ASSIST_MAX_NUDGE = 4;
const directions = Array.from({ length: 8 }, (_, i) => ({ x: Math.cos(i * Math.PI / 4), y: Math.sin(i * Math.PI / 4) }));

/** Координаты игры, а не CSS: масштаб экрана не меняет силу помощи. */
export function assistedAim(raw: AimPoint, contains: AimHitTest): AimPoint {
  // Не уводим точный выстрел, в том числе прицеливание в уязвимое место.
  if (contains(raw.x, raw.y)) return raw;
  // Ищем ближайший настоящий силуэт, не слабое место и не приблизительный центр спрайта.
  for (let distance = 1; distance < AIM_ASSIST_REACH; distance++) {
    for (const direction of directions) {
      if (!contains(raw.x + direction.x * distance, raw.y + direction.y * distance)) continue;
      const fade = Math.min(1, (AIM_ASSIST_REACH - distance) / 4);
      const nudge = Math.min(AIM_ASSIST_MAX_NUDGE, distance + 0.5) * fade;
      return { x: raw.x + direction.x * nudge, y: raw.y + direction.y * nudge };
    }
  }
  return raw;
}
