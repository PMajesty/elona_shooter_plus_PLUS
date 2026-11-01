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
