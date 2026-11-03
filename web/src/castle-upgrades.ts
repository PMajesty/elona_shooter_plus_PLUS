import { lootValueMultiplier } from './items.ts';
import type { TownEconomy } from './town-economy.ts';

export type CastleUpgradeKind = 'house' | 'wall' | 'fix-wall' | 'repairman' | 'sandbag' | 'storage' | 'looter' | 'trainer'
  | 'smith' | 'museum' | 'chicken' | 'sister' | 'villa' | 'special-trainer';
export const CASTLE_UPGRADES: readonly CastleUpgradeKind[] = ['fix-wall', 'wall', 'sandbag', 'storage', 'house', 'looter', 'repairman', 'trainer',
  'smith', 'museum', 'chicken', 'sister', 'villa', 'special-trainer'];
export type CastleUpgradeOutcome = 'purchased' | 'not-enough-gold' | 'capped' | 'unavailable';
export interface CastleUpgradeState {
  party: { capacity: 1 | 2 | 3 };
  castleHp: number;
  castleMaxHp: number;
  repairmanLevel: number;
  sandbagLevel: number;
  looterLevel: number;
  trainerLevel: number;
  inventory: readonly unknown[];
  economy?: TownEconomy;
}

export function castleUpgradeCost(kind: CastleUpgradeKind, state: CastleUpgradeState): number {
  const e = state.economy;
  if (kind === 'smith') return (e?.smith ?? 0) >= 6 ? 0 : (e?.smith ?? 0) ** 2 * 80 + 200;
  if (kind === 'museum') return (e?.museum ?? 0) * 150 + 2000;
  if (kind === 'chicken') { const n = e?.chickens ?? 0; return Math.trunc(Math.trunc(Math.sqrt(n * n * 20)) + 20 + n * 2.5); }
  if (kind === 'sister') return (e?.sisters ?? 0) * 100 + 250;
  if (kind === 'villa') return (e?.villa ?? 0) ** 2 * 180 + 2500;
  if (kind === 'special-trainer') return (e?.specialTrainer ?? 0) >= 9 ? 0 : (e?.specialTrainer ?? 0) ** 2 * 400 + 2500;
  // Main.getUpgradeCost: цена стены зависит от максимального HP, а не от её уровня.
  if (kind === 'house') return state.party.capacity >= 3 ? 0 : state.party.capacity * state.party.capacity * 1000 + 1000;
  if (kind === 'fix-wall') return Math.trunc(8 * (state.castleMaxHp - state.castleHp));
  if (kind === 'repairman') return state.repairmanLevel * state.repairmanLevel * 250 + 700;
  if (kind === 'sandbag') return state.sandbagLevel >= 10 ? 0 : state.sandbagLevel * state.sandbagLevel * 240 + 1000;
  if (kind === 'storage') return state.inventory.length >= 16 ? 0 : (state.inventory.length - 4) ** 2 * 30 + 250;
  if (kind === 'looter') return state.looterLevel * state.looterLevel * 125 + 300;
  if (kind === 'trainer') return state.trainerLevel * state.trainerLevel * 180 + 250;
  return Math.trunc(state.castleMaxHp * state.castleMaxHp / 2.5 - 400);
}

export function castleUpkeep(state: CastleUpgradeState & { earnedMedals: readonly number[] }): number {
  const badgeDiscount = state.earnedMedals.includes(86) ? 40 : 0;
  return Math.max(0, (state.party.capacity - 1) * 50 + state.repairmanLevel * 60 + (state.castleMaxHp - 40) * 2 + state.sandbagLevel * 40 + castleStorageLevel(state) * 40 + state.looterLevel * 5 + (state.economy?.museum ?? 0) * 15 - badgeDiscount);
}

export function castleLootMultiplier(state: Pick<CastleUpgradeState, 'looterLevel'>): number {
  return lootValueMultiplier(state.looterLevel);
}

export function castleTrainerMultiplier(state: Pick<CastleUpgradeState, 'trainerLevel'>): number {
  return state.trainerLevel === 0 ? 1 : 1.03 + state.trainerLevel * 0.04;
}

export function castleStorageLevel(state: Pick<CastleUpgradeState, 'inventory'>): number {
  // В исходнике storage и invSlot увеличиваются вместе; не храним вторую копию вместимости.
  return state.inventory.length - 5;
}

export function castleRepairAmount(state: Pick<CastleUpgradeState, 'repairmanLevel'>): number {
  return state.repairmanLevel * 2;
}

export function castleDamageMultiplier(state: Pick<CastleUpgradeState, 'sandbagLevel'>): number {
  return 1 - state.sandbagLevel * 0.05;
}
