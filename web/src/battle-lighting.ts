export interface BattleLighting { phase: 'dusk' | 'night'; step: number }

/** Исходное движение0.2px/кадр и возврат с-1280 к0; tick сохраняет фазу Continue. */
export function battleCloudX(frame: number): number {
  const distance = frame * 0.2;
  return distance <= 1440 ? 160 - distance : -((distance - 1440) % 1280);
}

/** updateBG вызывается20 раз в секунду; новая граница сразу делает первый шаг. */
export function advanceBattleLighting(current?: BattleLighting, boundary?: BattleLighting['phase']): BattleLighting | undefined {
  if (boundary) return { phase: boundary, step: 1 };
  if (current && current.step < 100) return { ...current, step: current.step + 1 };
  return current;
}

export function battleLightColor(light?: BattleLighting): number {
  if (!light) return 0xffffff;
  const fraction = light.step / 100;
  const rgb = light.phase === 'dusk' ? [1, 1 - fraction * 0.4, 1 - fraction * 0.6]
    : [1 - fraction * 0.9, 0.6 - fraction * 0.2, 0.4 + fraction * 0.6];
  const [r, g, b] = rgb.map(value => Math.round(value * 255));
  return r << 16 | g << 8 | b;
}
