export type CastleUpgradeKind = 'house' | 'wall' | 'fix-wall' | 'repairman';
export type CastleUpgradeOutcome = 'purchased' | 'not-enough-gold' | 'capped' | 'unavailable';
export interface CastleUpgradeState {
  party: { capacity: 1 | 2 | 3 };
  castleHp: number;
  castleMaxHp: number;
  repairmanLevel: number;
}

export function castleUpgradeCost(kind: CastleUpgradeKind, state: CastleUpgradeState): number {
  // Main.getUpgradeCost: цена стены зависит от максимального HP, а не от её уровня.
  if (kind === 'house') return state.party.capacity >= 3 ? 0 : state.party.capacity * state.party.capacity * 1000 + 1000;
  if (kind === 'fix-wall') return Math.trunc(8 * (state.castleMaxHp - state.castleHp));
  if (kind === 'repairman') return state.repairmanLevel * state.repairmanLevel * 250 + 700;
  return Math.trunc(state.castleMaxHp * state.castleMaxHp / 2.5 - 400);
}

export function castleUpkeep(state: CastleUpgradeState): number {
  // Main.calcUnkeep: остальные улучшения пока исходные, Storage=1, Hard Badge отсутствует.
  return Math.max(0, (state.party.capacity - 1) * 50 + state.repairmanLevel * 60 + (state.castleMaxHp - 40) * 2 + 40);
}

export function castleRepairAmount(state: Pick<CastleUpgradeState, 'repairmanLevel'>): number {
  return state.repairmanLevel * 2;
}
