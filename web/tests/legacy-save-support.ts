import assert from 'node:assert/strict';
import type { SimulationState } from '../src/simulation.ts';
import { createPartyState } from '../src/party.ts';
import { createPartyAIShared } from '../src/party-ai.ts';
import { partySkills } from '../src/party-progression.ts';
import { createSheriffTraits } from '../src/progression.ts';
import { ENEMIES } from '../src/content.ts';

/** Старые форматы не содержали ни спутников, ни кеша целей; новые поля не берём из пониженной копии v15. */
export function withLegacyPartyDefaults(value: Record<string, any>): Record<string, any> {
  const expected = structuredClone(value);
  const town = expected.town?.preparation === 'ready' ? expected.town : expected.previousTown;
  expected.version = 18;
  expected.wallLevel = 1;
  expected.wallFixCount = 0;
  expected.repairmanLevel = 0;
  expected.sandbagLevel = 0;
  expected.party = createPartyState(town?.recruit);
  expected.partySkills = partySkills([{ traits: expected.player.traits ?? createSheriffTraits() }]);
  expected.partyAI = createPartyAIShared();
  expected.retainedAITargets = [];
  expected.pendingPartyAction = null;
  expected.result.wages = 0;
  for (const enemy of expected.enemies) {
    enemy.type = ENEMIES[enemy.kind as keyof typeof ENEMIES].airborne ? 1 : 0;
    enemy.tag = 0; enemy.onMark = false;
    if (enemy.kind === 'boss' && enemy.hp > 0) expected.partyAI.targetBossUid = enemy.uid;
  }
  return expected;
}

export function asLegacyV17Save(state: SimulationState): Record<string, any> {
  const value: Record<string, any> = structuredClone(state);
  assert.equal(value.sandbagLevel, 0);
  delete value.sandbagLevel;
  value.version = 17;
  return value;
}

export function asLegacyV16Save(state: SimulationState): Record<string, any> {
  const value = asLegacyV17Save(state);
  assert.equal(value.wallFixCount, 0);
  assert.equal(value.repairmanLevel, 0);
  delete value.wallFixCount; delete value.repairmanLevel;
  value.version = 16;
  return value;
}

export function asLegacyV15Save(state: SimulationState): Record<string, any> {
  const value = asLegacyV16Save(state);
  assert.equal(value.wallLevel, 1);
  assert.equal(value.castleMaxHp, 40);
  delete value.wallLevel;
  value.version = 15;
  return value;
}

export function asLegacyV14Save(state: SimulationState): Record<string, any> {
  const value = asLegacyV15Save(state);
  assert.ok(value.party.slots.slice(0, 4).every((slot: {exists: boolean}) => !slot.exists));
  assert.equal(value.pendingPartyAction, null);
  for (const field of ['party', 'partySkills', 'partyAI', 'retainedAITargets', 'pendingPartyAction']) delete value[field];
  delete value.result.wages;
  for (const enemy of value.enemies) { delete enemy.type; delete enemy.tag; delete enemy.onMark; }
  value.version = 14;
  return value;
}

export function asLegacyV9Save(state: SimulationState): Record<string, any> {
  const value = asLegacyV14Save(state);
  assert.ok(value.day <= 2);
  assert.equal(value.enemyArrows.length, 0);
  assert.ok(value.enemies.every((enemy: {kind: string}) => enemy.kind !== 'archer'));
  for (const enemy of value.enemies) delete enemy.bossFacing;
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
