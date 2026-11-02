import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/content.ts';
import { generateLowLevelMission, generateLowLevelWaves } from '../src/missions.ts';

test('the extracted mission generator preserves all three accepted original opening wave traces and RNG states', () => {
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-wave-trace.json', import.meta.url), 'utf8'));
  for (const record of fixture.records.filter((row: { type: string }) => row.type === 'snapshot')) {
    let state = record.seed >>> 0, draws = 0;
    const random = () => { let value = state | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5; state = value >>> 0; draws++; return state / 4294967296; };
    const mission = generateLowLevelMission(0, 1, random);
    const generated = generateLowLevelWaves(mission, 1, random);
    assert.deepEqual(generated.waves.map((wave, index) => ({ ...wave, index, enemies: wave.enemies.map(kind => ENEMIES[kind].id) })), record.waves);
    assert.deepEqual(mission.loot, record.loot);
    assert.equal(mission.bossWave, record.bossWave);
    assert.equal(draws, record.drawCount);
    assert.equal(state, record.rngState);
  }
});

test('prepared second-day waves retain calendar-one mission loot and fractional timing without mutating preparation', () => {
  const mission = generateLowLevelMission(1, 1, () => 0.5);
  const before = structuredClone(mission);
  const generated = generateLowLevelWaves(mission, 2, () => 0.5);
  assert.deepEqual(mission, before);
  assert.deepEqual(mission.loot, [1117]);
  assert.equal(generated.waves.length, 5);
  assert.ok(generated.waves.every(wave => wave.delays.every(delay => !Number.isInteger(delay))));
  assert.equal(generated.waves.flatMap(wave => wave.enemies).filter(kind => kind === 'boss').length, 1);
});

test('second-town preparation retains medal absorption and its calendar loot into the third battle', () => {
  let draws = 0;
  const mission = generateLowLevelMission(2, 2, () => { draws++; return 0.5; }, { absorbFix: 0.01 });
  assert.equal(draws, 2);
  assert.equal(mission.powerOrg, 1040);
  assert.equal(mission.reward, 640);
  assert.equal(mission.spawnRate, 14.6);
  assert.equal(mission.absorbFix, 0.01);
  assert.deepEqual(mission.loot, [1103]);
  const before = structuredClone(mission);
  const generated = generateLowLevelWaves(mission, 3, () => 0.5);
  assert.deepEqual(mission, before);
  assert.equal(generated.waves.length, 5);
  assert.equal(generated.waves.flatMap(wave => wave.enemies).filter(kind => kind === 'boss').length, 1);
});

test('third-town preparation retains its Shop Token through the fourth battle', () => {
  let draws = 0;
  const mission = generateLowLevelMission(3, 3, () => { draws++; return 0.99; }, { absorbFix: 0.02 });
  assert.equal(draws, 2);
  assert.equal(mission.powerOrg, 1160); assert.equal(mission.reward, 660); assert.equal(mission.spawnRate, 14.4);
  assert.equal(mission.absorbFix, 0.02);
  assert.deepEqual(mission.loot, [1038, 1035]);
  const before = structuredClone(mission);
  const generated = generateLowLevelWaves(mission, 4, () => 0.5);
  assert.deepEqual(mission, before);
  assert.equal(generated.waves.length, 5);
  assert.equal(generated.waves.flatMap(wave => wave.enemies).filter(kind => kind === 'boss').length, 1);
});

test('fourth-town preparation retains the Archer statue through fifth-day waves', () => {
  let draws = 0;
  const mission = generateLowLevelMission(4, 4, () => { draws++; return 0.99; }, { absorbFix: 0.02 });
  assert.equal(draws, 2);
  assert.equal(mission.powerOrg, 1280); assert.equal(mission.reward, 680); assert.equal(mission.spawnRate, 14.2);
  assert.equal(mission.absorbFix, 0.02);
  assert.deepEqual(mission.loot, [1038, 1102]);
  const before = structuredClone(mission);
  const generated = generateLowLevelWaves(mission, 5, () => 0.5);
  assert.deepEqual(mission, before);
  assert.equal(generated.waves.length, 5);
  assert.equal(generated.waves.flatMap(wave => wave.enemies).filter(kind => kind === 'boss').length, 1);
});

test('fifth-town preparation retains Holy Grail through sixth-day waves', () => {
  let draws = 0;
  const mission = generateLowLevelMission(5, 5, () => { draws++; return 0.99; }, { absorbFix: 0.02 });
  assert.equal(draws, 2);
  assert.equal(mission.powerOrg, 1400); assert.equal(mission.reward, 700); assert.equal(mission.spawnRate, 14);
  assert.equal(mission.absorbFix, 0.02);
  assert.deepEqual(mission.loot, [1038, 1037]);
  const before = structuredClone(mission);
  const generated = generateLowLevelWaves(mission, 6, () => 0.5);
  assert.deepEqual(mission, before);
  assert.equal(generated.waves.length, 5);
  assert.equal(generated.waves.flatMap(wave => wave.enemies).filter(kind => kind === 'boss').length, 1);
});

test('sixth-town preparation retains Crow Statue through seventh-day waves', () => {
  let draws = 0;
  const mission = generateLowLevelMission(6, 6, () => { draws++; return 0.99; }, { absorbFix: 0.02 });
  assert.equal(draws, 2);
  assert.equal(mission.powerOrg, 1520); assert.equal(mission.reward, 720); assert.equal(mission.spawnRate, 13.8);
  assert.equal(mission.absorbFix, 0.02);
  assert.deepEqual(mission.loot, [1038, 1106]);
  const before = structuredClone(mission);
  const generated = generateLowLevelWaves(mission, 7, () => 0.5);
  assert.deepEqual(mission, before);
  assert.equal(generated.waves.length, 5);
  assert.equal(generated.waves.flatMap(wave => wave.enemies).filter(kind => kind === 'boss').length, 1);
});

test('seventh-town preparation has no guaranteed calendar loot and supports eighth-day waves', () => {
  for (const value of [0.5, 0.99]) {
    let draws = 0;
    const mission = generateLowLevelMission(7, 7, () => { draws++; return value; }, { absorbFix: 0.03 });
    assert.equal(draws, 2);
    assert.equal(mission.powerOrg, 1640); assert.equal(mission.reward, 740); assert.equal(mission.spawnRate, 13.6);
    assert.equal(mission.absorbFix, 0.03);
    assert.deepEqual(mission.loot, value > 0.97 ? [1038] : []);
    const before = structuredClone(mission);
    const generated = generateLowLevelWaves(mission, 8, () => 0.5);
    assert.deepEqual(mission, before);
    assert.equal(generated.waves.length, 5);
    assert.equal(generated.waves.flatMap(wave => wave.enemies).filter(kind => kind === 'boss').length, 1);
  }
});

test('eighth town prepares mission8 while its future battle remains outside the supported wave boundary', () => {
  const mission = generateLowLevelMission(8, 8, () => 0.5);
  assert.equal(mission.powerOrg, 1760); assert.equal(mission.reward, 760);
  assert.deepEqual(mission.loot, []);
  assert.throws(() => generateLowLevelWaves(mission, 8, () => 0.5), /Unsupported low-level wave configuration/);
});
