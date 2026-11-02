import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareCastleRepairTrace } from './castle-repair-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-castle-repair-trace.json', import.meta.url), 'utf8'));
const rows = fixture.records.filter((row: Record<string, any>) => row.type === 'snapshot') as Record<string, any>[];

test('paid repairs and wave healing match37 original observations with zero scoped RNG draws', () => {
  assert.equal(fixture.format, 'elona-original-castle-repair-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, '705174478b6dd117b143bcb9344f555930b83673ba15abaf03012e9e111e7e82');
  assert.equal(fixture.traceSha256, '5c8791dec9d2e543bb6f92cbf4aa246b1a738cefedd3162640a125043c223a8e');
  assert.equal(createHash('sha256').update(JSON.stringify(fixture.records)).digest('hex'), fixture.traceSha256);
  const result = compareCastleRepairTrace(fixture.records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 37);
  assert.deepEqual([result.inputSnapshots, result.timerOutcomes, result.transactionOutcomes], [17, 9, 11]);
  for (const row of rows) { assert.equal(row.drawCount, 0); assert.equal(row.rngState, 42); }
  const timers = rows.filter(row => row.op === 'timer');
  assert.deepEqual(timers.map(row => [row.scenario, row.hp, row.wave, row.newWave, row.noDamage, row.exitReached, row.gameOver]), [
    ['opening-restore', 40, 4, false, true, false, false],
    ['ordinary-partial', 37, 1, false, false, false, false],
    ['ordinary-clamp', 40, 1, false, true, false, false],
    ['no-repairman', 39, 1, false, false, false, false],
    ['already-failed', 40, 1, false, false, false, false],
    ['between-transitions', 35, 2, false, true, false, false],
    ['terminal-damaged', 39, 0, false, false, true, false],
    ['terminal-full', 40, 0, false, true, true, false],
    ['lethal-gate', 0, 5, true, true, false, true],
  ]);
  for (const row of timers.filter(row => row.exitReached)) { assert.equal(row.paused, true); assert.equal(row.immune, true); }
  const town = rows.filter(row => row.boundary === 'town');
  for (const row of town) {
    assert.equal(row.ap, 0); assert.equal(row.totalMoney, 1234); assert.equal(row.noDamage, false);
    assert.equal(row.dialog, false); assert.equal(row.eventDialog, false);
    assert.equal(row.fixWall.name, 'Fix Wall');
    assert.deepEqual(row.fixWall.hint, ['This will completely fix the castle wall.', '']);
    assert.deepEqual(row.repairman.hint, ['Repairers will slowly fix the castle wall during a battle between waves.',
      row.repairmanLevel ? `(Currently, they can fix ${row.repairmanLevel * 2} HP per wave)` : "[ You haven't acquired this upgrade yet ]"]);
  }
  assert.deepEqual(town.filter(row => row.scenario === 'repairman-sequence')
    .map(row => [row.repairmanLevel, row.repairman.cost, row.gold, row.hp, row.upkeep]),
    [[0, 700, 3350, 30, 40], [1, 950, 2650, 30, 100], [2, 1700, 1700, 30, 160], [3, 2950, 0, 30, 220]]);
  assert.deepEqual(town.filter(row => row.scenario === 'fix-repeat-full')
    .map(row => [row.wallFixCount, row.hp, row.gold, row.fixWall.cost, row.fixWall.possible]),
    [[0, 30, 160, 80, true], [1, 40, 80, 0, false], [1, 40, 80, 0, false]]);
  const upgraded = town.find(row => row.scenario === 'fix-upgraded-counter' && row.op === 'click')!;
  assert.deepEqual([upgraded.wallFixCount, upgraded.hp, upgraded.maxHp, upgraded.upkeep], [4, 45, 45, 50]);
});

test('repair reference rejects checking perfect status before ordinary/opening wave healing', () => {
  const result = compareCastleRepairTrace(fixture.records, { timer(simulation, step) {
    const state = simulation.state;
    if (state.newWave && state.waveIndex > 0 && state.castleHp > 0 && state.castleHp < state.castleMaxHp) state.noDamage = false;
    step();
  } });
  assert.equal(result.status, 'failed');
  assert.deepEqual(result.comparisons.filter(row => !row.matched).map(row => [row.scenario, row.differences.map(value => value.field)]),
    [['opening-restore', ['noDamage']], ['ordinary-clamp', ['noDamage']]]);
});

test('repair reference rejects an extra terminal heal before the result boundary', () => {
  const result = compareCastleRepairTrace(fixture.records, { timer(simulation, step) {
    const state = simulation.state;
    if (state.newWave && state.waveIndex === 0) state.castleHp = Math.min(state.castleMaxHp, state.castleHp + state.repairmanLevel * 2);
    step();
  } });
  assert.equal(result.status, 'failed');
  const failures = result.comparisons.filter(row => !row.matched);
  assert.equal(failures.length, 1); assert.equal(failures[0].scenario, 'terminal-damaged');
  assert.deepEqual(failures[0].differences.map(value => value.field), ['hp', 'noDamage']);
});

test('repair reference detects losing the independent paid Fix Wall purchase counter', () => {
  const result = compareCastleRepairTrace(fixture.records, { purchase(simulation, kind) {
    const outcome = simulation.buyCastleUpgrade(kind);
    if (outcome === 'purchased' && kind === 'fix-wall') simulation.state.wallFixCount--;
    return outcome;
  } });
  assert.equal(result.status, 'failed');
  const failures = result.comparisons.filter(row => !row.matched);
  assert.equal(failures.length, 4);
  for (const failure of failures) assert.deepEqual(failure.differences.map(value => value.field), ['wallFixCount']);
});
