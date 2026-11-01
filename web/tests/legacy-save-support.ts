import assert from 'node:assert/strict';
import type { SimulationState } from '../src/simulation.ts';

export function asLegacyV6Save(state: SimulationState): Record<string, any> {
  const value: Record<string, any> = structuredClone(state);
  // Старый формат умел стрелять только дробовиком из слота 0 и бросать гранаты из слота 1.
  assert.equal(value.player.selectedSlot, 0);
  assert.equal(value.inventory[0]?.id, 3);
  assert.equal(value.inventory[1]?.id, 11);
  assert.deepEqual(value.player.weaponExp.filter((_amount: number, index: number) => index !== 3), [0, 0, 0, 0]);
  value.player.weaponExp = value.player.weaponExp[3];
  Object.assign(value.player, {
    ammo: value.inventory[0].ammo, reloadTicks: value.inventory[0].reloadTime,
    grenades: value.inventory[1].ammo, grenadeCooldown: value.itemCooldowns[1],
  });
  delete value.player.selectedSlot;
  for (const field of ['itemCooldowns', 'protection', 'previousTown', 'activeMission', 'resultBefore', 'earnedMedals', 'perfectDays', 'bossesSpawned']) delete value[field];
  for (const enemy of value.enemies) delete enemy.appearance;
  // Эти поля полёта впервые появились вместе с произвольным снаряжением в v7.
  for (const grenade of value.grenades) { delete grenade.damage; delete grenade.weaponSlot; }
  value.version = 6;
  return value;
}
