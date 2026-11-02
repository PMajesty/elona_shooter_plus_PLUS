import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareCastleTrainerTrace } from './castle-trainer-reference-support.ts';
import { castleTrainerMultiplier } from '../src/castle-upgrades.ts';
import { partySkills } from '../src/party-progression.ts';

type Row = Record<string, any>;
const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-castle-trainer-trace.json', import.meta.url), 'utf8'));
const rows: Row[] = fixture.records.filter((row: Row) => row.type === 'snapshot');
const sample = (name: string) => rows.find(row => row.scenario === name)!;

test('Trainer purchases and XP boundaries match 27 independently captured original observations', () => {
  assert.equal(fixture.format, 'elona-original-castle-trainer-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, 'd7484a046ff5f5e3af913bed3354dcb9186ccc9fb95da43a0667a5223b8ee976');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareCastleTrainerTrace(fixture.records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 27);
  for (const row of rows.filter(value => value.config?.boundary === 'hit')) {
    assert.equal(row.xpEvents[0].pcType, 'undefined'); assert.equal(row.xpEvents[0].declaredHero, 0);
    assert.equal(row.xpEvents[0].drawCount, 1);
    assert.deepEqual(row.before.party, row.after.party);
    assert.deepEqual(row.before.reserves, row.after.reserves);
  }
  assert.deepEqual(['hero-normal-0', 'hero-normal-1'].map(name => sample(name).after.actors[0].exp), [29, 31]);
  for (const [prefix, actor, remainder] of [['hero-growth', 0, 1], ['companion-growth', 1, 2]] as const) {
    const before = sample(`${prefix}-0`), after = sample(`${prefix}-1`);
    assert.deepEqual([before.after.actors[actor].level, before.after.actors[actor].exp], [1, 999]);
    assert.deepEqual([after.after.actors[actor].level, after.after.actors[actor].exp], [2, remainder]);
    assert.equal(after.drawCount, before.drawCount + 2);
    assert.deepEqual(after.after.actors[actor].weaponExp, before.after.actors[actor].weaponExp);
  }
  const noble0 = sample('noble-gap-0'), noble10 = sample('noble-gap-10');
  assert.equal(noble0.after.enemy.exp, 29); assert.equal(noble10.after.enemy.exp, 29);
  assert.deepEqual([noble0.after.actors[1].exp, noble10.after.actors[1].exp], [29, 41]);
  assert.deepEqual(noble0.after.actors[1].weaponExp, [2, 0, 0, 0, 0]);
  assert.deepEqual(noble10.after.actors[1].weaponExp, noble0.after.actors[1].weaponExp);
  assert.deepEqual([sample('mission-fraction-3').after.enemy.exp, sample('mission-fraction-3').after.actors[0].exp], [33, 37]);
  const settled0 = sample('settlement-reserves-0'), settled10 = sample('settlement-reserves-10');
  assert.deepEqual(settled10.after, settled0.after); assert.deepEqual(settled10.draws, settled0.draws);
  assert.equal(settled10.drawCount, 102); assert.deepEqual(settled10.after.actors.map((actor: Row) => actor.exp), [150, 150]);
  assert.deepEqual(settled10.before.reserves, settled10.after.reserves);
  assert.deepEqual(settled10.before.party, settled10.after.party);
  assert.notDeepEqual(settled10.before.actors[1].traits, settled10.after.actors[1].traits);
  for (const row of rows.filter(value => value.boundary === 'purchase')) {
    assert.equal(row.ap, 0); assert.equal(row.totalMoney, 1234); assert.equal(row.upkeep, 40);
    assert.equal(row.hp, 30); assert.equal(row.drawCount, 0); assert.equal(row.rngState, 42);
    assert.equal(row.tile.hint[0], 'With more trainers, your troops will gain experience a lot faster.');
    assert.equal(row.tile.hint[1], row.trainerLevel === 0 ? "[ You haven't acquired this upgrade yet ]"
      : `(Currently, your troops get ${Math.trunc(row.multiplier * 100 - 100)}% more EXP)`);
  }
  assert.deepEqual(rows.filter(row => row.scenario === 'trainer-sequence').map(row => [row.trainerLevel, row.gold, row.tile.cost]),
    [[0, 680, 250], [1, 430, 430], [2, 0, 970]]);
  assert.equal(rows.at(-1)!.trainerLevel, 11); assert.equal(rows.at(-1)!.tile.cost, 22030);
});

test('Trainer reference rejects interpreting the source typo as a hero exemption', () => {
  const result = compareCastleTrainerTrace(fixture.records, (simulation, row) => {
    if (row.config.actor === 0) simulation.state.trainerLevel = 0;
  });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.comparisons.filter(row => !row.matched).map(row => row.scenario),
    ['hero-normal-1', 'hero-growth-1', 'mission-fraction-3']);
});

test('Trainer reference rejects applying the multiplier before integer XP stages', () => {
  const result = compareCastleTrainerTrace(fixture.records, (simulation, row) => {
    if (row.config.boundary !== 'hit') return;
    simulation.state.enemies[0].exp = Math.trunc(simulation.state.enemies[0].exp * castleTrainerMultiplier(simulation.state));
    simulation.state.trainerLevel = 0;
  });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.scenario === 'noble-gap-10' && !row.matched));
  assert.ok(result.comparisons.some(row => row.scenario === 'mission-fraction-3' && !row.matched));
});

test('Trainer reference rejects multiplying the flat daily award', () => {
  const result = compareCastleTrainerTrace(fixture.records, (simulation, row) => {
    if (row.config.boundary !== 'settlement') return;
    const extra = Math.trunc(250 * castleTrainerMultiplier(simulation.state)) - 250;
    simulation.state.player.exp += extra;
    for (const slot of simulation.state.party.slots.slice(0, 4)) if (slot.exists && slot.member) slot.member.exp += extra;
  });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.comparisons.filter(row => !row.matched).map(row => row.scenario), ['settlement-reserves-10']);
});

test('Trainer reference rejects awarding additional weapon XP', () => {
  const result = compareCastleTrainerTrace(fixture.records, (simulation, row) => {
    if (row.config.boundary !== 'hit' || !row.config.trainer) return;
    const actor = row.config.actor === 0 ? simulation.state.player : simulation.state.party.slots[0].member!;
    actor.weaponExp[row.before.actors[row.config.actor].wexpRef]++;
  });
  assert.equal(result.status, 'failed');
  assert.equal(result.comparisons.filter(row => !row.matched).length, 7);
});

test('Trainer reference rejects refreshing the party cache immediately after settlement growth', () => {
  const result = compareCastleTrainerTrace(fixture.records, (simulation, row) => {
    if (row.config.boundary !== 'settlement') return;
    const boundary = simulation as unknown as { finishDay(): void }, original = boundary.finishDay.bind(simulation);
    boundary.finishDay = () => {
      original();
      simulation.state.partySkills = partySkills([simulation.state.player, ...simulation.state.party.slots.slice(0, 4)
        .map(slot => slot.member ? { exist: slot.exists, traits: slot.member.traits } : null)]);
    };
  });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.comparisons.filter(row => !row.matched).map(row => row.scenario), ['settlement-reserves-0', 'settlement-reserves-10']);
  assert.ok(result.comparisons.filter(row => !row.matched).every(row => row.differences.some(value => value.field === 'party')));
});
