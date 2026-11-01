import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Simulation } from '../src/simulation.ts';
import { compareWaveTrace } from './wave-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-wave-trace.json', import.meta.url), 'utf8'));

test('first-day generation matches original SWF waves, loot and RNG accounting for three seeds', () => {
  assert.equal(fixture.format, 'elona-original-wave-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  const comparison = compareWaveTrace(fixture.records);
  assert.equal(comparison.status, 'passed');
  assert.equal(comparison.matchedSnapshots, 3);
});

test('original trace detects an extra random draw even when the port remains deterministic', () => {
  const prototype = Simulation.prototype as unknown as { random(): number };
  const original = prototype.random;
  // Повторяемый, но неверный поток должен отклоняться независимым эталоном оригинала.
  prototype.random = function (this: Simulation): number {
    original.call(this);
    return original.call(this);
  };
  try {
    const comparison = compareWaveTrace(fixture.records);
    assert.equal(comparison.status, 'failed');
    assert.equal(comparison.matchedSnapshots, 0);
    assert.ok(comparison.comparisons.every(row => row.differences.some(difference => difference.field === 'rngState')));
  } finally {
    prototype.random = original;
  }
});
