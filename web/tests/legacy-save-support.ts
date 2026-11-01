import assert from 'node:assert/strict';
import type { SimulationState } from '../src/simulation.ts';

export function asLegacyV9Save(state: SimulationState): Record<string, any> {
  const value: Record<string, any> = structuredClone(state);
  assert.ok(value.day <= 2);
  assert.equal(value.enemyArrows.length, 0);
  assert.ok(value.enemies.every((enemy: {kind: string}) => enemy.kind !== 'archer'));
  delete value.enemyArrows;
  value.version = 9;
  return value;
}

export function asLegacyV8Save(state: SimulationState): Record<string, any> {
  const value = asLegacyV9Save(state);
  assert.equal(value.pendingTownAction, null);
  delete value.upgradeReference;
  delete value.pendingTownAction;
  value.version = 8;
  return value;
}

export function asLegacyV7Save(state: SimulationState): Record<string, any> {
  const value = asLegacyV8Save(state);
  assert.equal(value.player.bowDrawing, false);
  assert.ok(value.projectiles.every((actor: { kind: string; weaponSlot: number | null }) => actor.kind === 'hand-grenade' && actor.weaponSlot === null));
  value.grenades = value.projectiles.map((actor: Record<string, number>) => ({
    uid: actor.uid, x: actor.x, y: actor.y, startX: actor.startX, startY: actor.startY,
    targetX: actor.targetX, targetY: actor.targetY, speed: -actor.speed, remaining: actor.count, damage: actor.damage,
  }));
  delete value.projectiles;
  delete value.player.bowDrawing;
  value.version = 7;
  return value;
}

export function asLegacyV6Save(state: SimulationState): Record<string, any> {
  const value = asLegacyV7Save(state);
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
