import { lootValueMultiplier } from './items.ts';

export type CastleUpgradeKind = 'house' | 'wall' | 'fix-wall' | 'repairman' | 'sandbag' | 'storage' | 'looter' | 'trainer';
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
}

export function castleUpgradeCost(kind: CastleUpgradeKind, state: CastleUpgradeState): number {
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

export function castleUpkeep(state: CastleUpgradeState): number {
  // Main.calcUnkeep: не перенесённые улучшения исходные; Hard Badge пока отсутствует.
  return Math.max(0, (state.party.capacity - 1) * 50 + state.repairmanLevel * 60 + (state.castleMaxHp - 40) * 2 + state.sandbagLevel * 40 + castleStorageLevel(state) * 40 + state.looterLevel * 5);
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
