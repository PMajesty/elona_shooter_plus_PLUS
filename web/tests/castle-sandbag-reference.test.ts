import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareCastleSandbagTrace } from './castle-sandbag-reference-support.ts';
import { castleDamageMultiplier } from '../src/castle-upgrades.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-castle-sandbag-trace.json', import.meta.url), 'utf8'));
const rows = fixture.records.filter((row: Record<string, any>) => row.type === 'snapshot') as Record<string, any>[];

test('Sandbag purchase and damage behavior matches25 actual original observations', () => {
  assert.equal(fixture.format, 'elona-original-castle-sandbag-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, 'e66246721657a2c54ef5fc7b56247073b1ce5e04f7ca961bf4c05e3730574046');
  assert.equal(fixture.traceSha256, 'd8f6da8a183f51bc97e10cfb3a5edcce676e0f4e96b1f7c0b42fd5d6d8782027');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareCastleSandbagTrace(fixture.records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 25);
  assert.deepEqual([result.damageCases, result.townStartingStates, result.townTransactions], [12, 6, 7]);
  const damage = rows.filter(row => row.boundary === 'damage');
  assert.deepEqual(damage.map(row => [row.scenario, row.before.castleHp - row.after.castleHp, row.drawCount]), [
    ['unupgraded', 7, 2], ['first-level', 6, 2], ['first-level-medal', 94, 2], ['maximum-medal', 48, 2],
    ['minimum-one', 1, 2], ['typed-input', 6, 2], ['maximum-no-medal', 1, 2],
    ['insurance-before-defender', 0, 1], ['guardian-before-defender', 0, 2],
    ['guardian-then-last-hope', 1, 6], ['last-hope-low', 1, 3], ['protection-before-all', 0, 0],
  ]);
  const defended = damage.find(row => row.scenario === 'guardian-before-defender')!;
  assert.deepEqual(defended.order, [{ event: 'guardian-hit', actorSlot: 1, drawCount: 1 },
    { event: 'insurance', drawCount: 1 }, { event: 'defend', drawCount: 2 }]);
  assert.deepEqual([defended.after.enemy.hp, defended.after.castleHp, defended.after.gold, defended.after.totalMoney], [996, 40, 103, 503]);
  const hope = damage.find(row => row.scenario === 'guardian-then-last-hope')!;
  assert.equal(hope.damageEvents[0].actorSlot, 0); assert.equal(hope.after.actors[0].rampageTicks, 339);
  const protectedRow = damage.find(row => row.scenario === 'protection-before-all')!;
  assert.deepEqual(protectedRow.order, [{ event: 'defend', drawCount: 0 }]);
  assert.equal(protectedRow.after.enemy.hp, 1000); assert.equal(protectedRow.after.gold, 100);
  const town = rows.filter(row => row.boundary === 'town');
  for (const row of town) {
    assert.equal(row.ap, 0); assert.equal(row.totalMoney, 1234); assert.equal(row.hp, 30);
    assert.equal(row.drawCount, 0); assert.equal(row.rngState, 42);
    assert.equal(row.dialog, false); assert.equal(row.eventDialog, false);
    assert.equal(row.tile.hint[0], 'Stronger sandbags will absorb more damage done to the wall.');
    assert.equal(row.tile.hint[1], row.sandbagLevel ? `(Currently, sandbag will absorb ${Math.trunc(100 - row.multiplier * 100)}% damage)`
      : "[ You haven't acquired this upgrade yet ]");
  }
  assert.deepEqual(town.filter(row => row.scenario === 'sandbag-sequence').map(row => [row.sandbagLevel, row.gold, row.tile.cost, row.upkeep]),
    [[0, 2240, 1000, 40], [1, 1240, 1240, 80], [2, 0, 1960, 120]]);
  const final = town.filter(row => row.scenario === 'sandbag-final');
  assert.deepEqual(final.map(row => [row.sandbagLevel, row.gold, row.tile.cost, row.tile.possible, row.upkeep]),
    [[9, 20440, 20440, true, 400], [10, 0, 0, false, 440]]);
  const cap = town.filter(row => row.scenario === 'sandbag-cap');
  for (const field of ['sandbagLevel', 'gold', 'hp', 'upkeep', 'tile']) assert.deepEqual(cap[1][field], cap[0][field]);
});

test('Sandbag reference distinguishes additive mission absorption from a separate multiplier', () => {
  const result = compareCastleSandbagTrace(fixture.records, { damage(simulation, _amount, _attacker, original) {
    const absorb = simulation.state.activeMission.absorbFix;
    simulation.state.activeMission.absorbFix = absorb * castleDamageMultiplier(simulation.state);
    try { original(); } finally { simulation.state.activeMission.absorbFix = absorb; }
  } });
  assert.equal(result.status, 'failed');
  const failures = result.comparisons.filter(row => !row.matched);
  assert.equal(failures.length, 1); assert.equal(failures[0].scenario, 'maximum-medal');
  assert.deepEqual(failures[0].differences.map(value => value.field), ['after']);
});

test('Sandbag reference rejects rounding absorbed damage instead of truncating it', () => {
  const result = compareCastleSandbagTrace(fixture.records, { damage(simulation, amount, _attacker, original) {
    const hp = simulation.state.castleHp;
    const product = Math.trunc(amount) * (castleDamageMultiplier(simulation.state) - simulation.state.activeMission.absorbFix);
    original();
    if (simulation.state.castleHp !== hp) simulation.state.castleHp += Math.max(1, Math.trunc(product)) - Math.max(1, Math.round(product));
  } });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.comparisons.filter(row => !row.matched).map(row => row.scenario),
    ['first-level', 'typed-input', 'maximum-no-medal', 'guardian-then-last-hope', 'last-hope-low']);
});
