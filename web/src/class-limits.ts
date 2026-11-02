/** Исходные calcSniperMaxDamage и calcDuelistMaxDamage; общие для боя и подсказок. */
export const sniperDamageLimit = (level: number): number => Math.trunc(160 + Math.sqrt(level) * 2 + level);
export const duelistDamageLimit = (level: number): number => Math.trunc(40 + Math.sqrt(level) * 1.6 + level);
