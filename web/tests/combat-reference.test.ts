import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Simulation } from '../src/simulation.ts';
import { compareCombatTrace } from './combat-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-combat-trace.json', import.meta.url), 'utf8'));

test('spawn and single-pellet rules match 21 original snapshots with original geometry supplied', () => {
  assert.equal(fixture.format, 'elona-original-combat-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  const comparison = compareCombatTrace(fixture.records);
  assert.equal(comparison.status, 'passed');
  assert.equal(comparison.matchedSnapshots, 21);
  assert.equal(comparison.completePointCoverage, true);
});

test('original trace detects the previous omitted SENSE roll and resulting lethal-hit RNG divergence', () => {
  interface PointBoundary { random(): number; processPellet(x: number, y: number, damage: number): boolean }
  const prototype = Simulation.prototype as unknown as PointBoundary;
  const original = prototype.processPellet;
  prototype.processPellet = function (this: PointBoundary, x, y, damage): boolean {
    const random = this.random;
    let first = true;
    // Убираем только первый бросок SENSE внутри реального пути обработки попадания.
    this.random = () => { if (first) { first = false; return 0; } return random.call(this); };
    try { return original.call(this, x, y, damage); }
    finally { this.random = random; }
  };
  try {
    const comparison = compareCombatTrace(fixture.records);
    assert.equal(comparison.status, 'failed');
    assert.ok(comparison.comparisons.filter(row => row.scenario === 'spawn').every(row => row.matched));
    const lethal = comparison.comparisons.find(row => row.scenario === 'rat_lethal')!;
    assert.ok(lethal.differences.some(difference => difference.field === 'drawCount'));
    assert.ok(lethal.differences.some(difference => difference.field === 'rngState'));
  } finally {
    prototype.processPellet = original;
  }
});
