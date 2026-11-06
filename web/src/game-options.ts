import type { SimulationState } from './simulation.ts';
import { lifetimeKills } from './kill-history.ts';
import type { RulesetId } from './rulesets.ts';

export interface GameOptions {
  showDamage: boolean; showAllyDamage: boolean; lowQuality: boolean;
  disableFireworks: boolean; colorBlind: boolean; disableFlash: boolean;
}
export const DEFAULT_GAME_OPTIONS: Readonly<GameOptions> = Object.freeze({
  showDamage: true, showAllyDamage: false, lowQuality: false,
  disableFireworks: false, colorBlind: false, disableFlash: false,
});
export const GAME_OPTIONS_VERSION = 1;
export function defaultGameOptions(edition: RulesetId = 'classic'): GameOptions {
  return { ...DEFAULT_GAME_OPTIONS, showAllyDamage: edition === 'expanded' };
}
export function validGameOptions(value: unknown): value is GameOptions {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value!).length === Object.keys(DEFAULT_GAME_OPTIONS).length
    && Object.keys(DEFAULT_GAME_OPTIONS).every(key => typeof (value as Record<string, unknown>)[key] === 'boolean');
}
export function savedGameOptions(options: GameOptions, edition: RulesetId = 'classic'): GameOptions | undefined {
  return Object.entries(defaultGameOptions(edition)).some(([key, value]) => options[key as keyof GameOptions] !== value) ? { ...options } : undefined;
}
export function showDamageNumber(options: GameOptions, actorSlot: number, criticalType?: number): boolean {
  return criticalType !== 3 && (actorSlot === 0 ? options.showDamage : options.showAllyDamage);
}
export function pauseStatistics(state: SimulationState): string {
  const kills = lifetimeKills(state);
  const lines = [`Elona Shooter Stactics  Day ${state.day}`];
  if (state.mode === 'casual') lines.push('You are playing Casual Mode.');
  if (state.mode === 'hardcore') lines.push('You are playing Hardcore Mode.');
  for (const [key, name] of [['bossMods', 'Bosses drop Mod'], ['intense', 'Intense Start'], ['tight', 'Tighter crosshair'],
    ['weaponLevel', 'Limit high level weapons'], ['laptop', 'Laptop difficulty'], ['community', 'Community Compilation'], ['skipHard', 'Skip hard waves'], ['aimAssist', 'Aim Assist']] as const) {
    if (state.mods?.[key]) lines.push(`Mod(${name}) is on.`);
  }
  if (state.carryOver) lines.push("You've used Carry Over Option.");
  lines.push(`${state.perfectDays} Perfect Games scored.`, `${state.economy.eggsCollected} eggs collected.`,
    `Exploded ${state.economy.sistersExploded} sisters.`, `Robbed ${state.economy.visitorsRobbed} children.`,
    `Total of ${kills.complete ? '' : 'at least '}${kills.count} enemies killed.`, `Total of ${state.totalMoney} GP earned.`, 'This game modded by Alfred.', '');
  return lines.join('\n');
}
