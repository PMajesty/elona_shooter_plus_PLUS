import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateSheriffHero, levelUpHero } from '../src/hero.ts';
import { compareHeroTrace } from './hero-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-hero-trace.json', import.meta.url), 'utf8'));

test('hero generation and consecutive level growth match 12 independent original snapshots', () => {
  assert.equal(fixture.format, 'elona-original-hero-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  const result = compareHeroTrace(fixture.records);
  assert.equal(result.status, 'passed');
  assert.equal(result.matchedSnapshots, 12);
});

test('the original hero trace detects growth that omits its two real RNG draws', () => {
  const result = compareHeroTrace(fixture.records, {
    generate: generateSheriffHero,
    levelUp: (progress, hero, _random) => levelUpHero(progress, hero, () => 0.5),
  });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.scenario === 'growth' && row.differences.some(difference => difference.field === 'drawCount')));
});
