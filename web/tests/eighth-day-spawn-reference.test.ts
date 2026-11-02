import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareEighthDaySpawnTrace } from './eighth-day-spawn-reference-support.ts';
import type { EnemyKind } from '../src/content.ts';

type Row = Record<string, any>;
const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-eighth-day-spawn-trace.json', import.meta.url), 'utf8'));
const records = fixture.records;
const rows: Row[] = records.filter((row: Row) => row.type === 'snapshot');
const sample = (name: string) => rows.find(row => row.scenario === name)!;

test('Day8 spawning matches original short-circuit decisions, shrinking queues and enemy initialization', () => {
  assert.equal(fixture.format, 'elona-original-eighth-day-spawn-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, '9bc849483859e3fa2242af3616deecef358edafb854c7c01a6e793793ff52745');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const result = compareEighthDaySpawnTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 10);
  assert.deepEqual(rows.map(row => row.drawCount), [4, 5, 9, 10, 10, 5, 4, 4, 6, 0]);
  assert.deepEqual(rows.map(row => row.spawnEvents.length), [1, 1, 2, 2, 2, 1, 1, 1, 1, 0]);
  assert.deepEqual(sample('sheep-second-at-continue').spawnEvents.map((event: Row) => [event.id, event.drawCount]), [[3, 3], [3, 8]]);
  assert.deepEqual(sample('shrinking-even').steps[0].queue, [3, 3]);
  assert.deepEqual(sample('shrinking-odd').steps[0].queue, [3]);
  assert.equal(sample('shrinking-even').steps[0].time, 19.6);
  assert.equal(sample('shrinking-odd').steps[0].time, 18.6);
  const deferred = sample('final-sheep-deferred-empty');
  assert.equal(deferred.steps.length, 15); assert.equal(deferred.steps[0].time, 13.6);
  assert.ok(deferred.steps.slice(0, 14).every((step: Row) => step.newWave === false));
  assert.equal(deferred.steps.at(-1).newWave, true); assert.equal(deferred.steps.at(-1).time, -0.40000000000000036);
  const lava = sample('lava-first-break').spawnEvents[0].enemy;
  assert.deepEqual([lava.id, lava.level, lava.hp, lava.attack, lava.speed, lava.y], [4, 9, 72, 12, 5.5, 286]);
  const boss = sample('boss-first-break');
  assert.equal(boss.spawnEvents[0].enemy.hp, 325); assert.equal(boss.steps[0].bossCounter, 8);
  assert.equal(boss.spawnEvents[0].drawCount, 5);
});

test('Day8 spawn reference rejects retaining the earlier one-spawn break behavior', () => {
  const result = compareEighthDaySpawnTrace(records, simulation => { simulation.state.activeMission.level = 6; });
  assert.equal(result.status, 'failed');
  for (const scenario of ['sheep-first-at-second-break', 'sheep-second-at-continue', 'shrinking-even', 'shrinking-odd'])
    assert.ok(result.comparisons.some(row => row.scenario === scenario && !row.matched));
});

test('Day8 spawn reference rejects an unconditional second break-condition draw', () => {
  const result = compareEighthDaySpawnTrace(records, simulation => {
    const boundary = simulation as unknown as { spawnEnemy(kind: EnemyKind): void; random(): number };
    const spawn = boundary.spawnEnemy.bind(simulation);
    boundary.spawnEnemy = kind => { spawn(kind); boundary.random(); };
  });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.scenario === 'rat-first-break' && row.differences.some(value => value.field === 'draws')));
});

test('Day8 spawn reference rejects losing the extra delay for later spawns in a callback', () => {
  const result = compareEighthDaySpawnTrace(records, simulation => {
    const boundary = simulation as unknown as { timerTick(): void }, tick = boundary.timerTick.bind(simulation);
    boundary.timerTick = () => {
      const count = simulation.state.enemies.length;
      tick();
      const spawned = simulation.state.enemies.length - count;
      if (spawned > 1) simulation.state.spawnTimer -= (spawned - 1) * 4;
    };
  });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.comparisons.filter(row => !row.matched).map(row => row.scenario),
    ['sheep-second-at-continue', 'shrinking-even', 'shrinking-odd']);
});
