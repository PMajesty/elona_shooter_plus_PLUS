/**
 * Исходная надпись критического убийства (critKill, символ 2367): если смертельное попадание было критическим,
 * на сцене в точке врага (x, y − 12) появляется строка.
 * - Попадание в уязвимое место: critMsg[critArray[номер врага]] (HEAD/LIMB/CORE/ABDOMEN/TORSO SHOT!);
 * - случайный крит навыка Sense: CRITICAL KILL!; One hit kill: ONE HIT KILL!.
 * Анимация (onEnterFrame_critKill): 20 кадров, текст поднимается на 0.5 за кадр, начальная прозрачность 0.8,
 * в последние 8 кадров она уменьшается на 0.1 за кадр.
 */
export const CRIT_MESSAGES = ['HEAD  SHOT!', 'LIMB  SHOT!', 'CORE  SHOT!', 'ABDOMEN SHOT!', 'TORSO  SHOT!', 'NULL'] as const;
/** Исходный critArray: выбор CRIT_MESSAGES по номеру врага (id в content.ts). */
export const CRIT_ARRAY = [0, 1, 0, 0, 0, 2, 0, 0, 4, 3, 0, 2, 2, 1, 0, 1, 0, 0, 0, 4] as const;
export const CRIT_KILL_FRAMES = 20;

/** Текст для типа крита смертельного попадания (0 нет, 1 уязвимое место, 2 Sense, 3 One hit kill); номер босса вне таблицы — пустая строка, как в оригинале. */
export function critKillMessage(criticalType: number, enemyId: number): string {
  if (criticalType === 3) return 'ONE HIT KILL!';
  if (criticalType === 2) return 'CRITICAL KILL!';
  if (criticalType === 1) {
    const index = CRIT_ARRAY[enemyId];
    return index === undefined ? '' : CRIT_MESSAGES[index];
  }
  return '';
}

/** Смещение и прозрачность на кадре age (1–20); после 20-го кадра надпись удаляется. */
export function critKillFrame(age: number): { offsetY: number; alpha: number } {
  return { offsetY: -0.5 * age, alpha: Math.max(0, 0.8 - 0.1 * Math.max(0, age - 12)) };
}
