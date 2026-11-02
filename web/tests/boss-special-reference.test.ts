import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareBossSpecialTrace, type BossSpecialRecord } from './boss-special-reference-support.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-boss-special-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as BossSpecialRecord[];
const sample = (scenario: string, step: number) => records.find(row => row.scenario === scenario && row.step === step)!;

test('boss grenade special matches 337 independently captured original states exactly', () => {
  assert.equal(fixture.format, 'elona-original-boss-special-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, 'ff498f9d152972b59cbf27b6ef666a9188fd7941c5d42da1827bd74a9c0107f3');
  assert.equal(fixture.repeatedIdenticalRuns, 2);
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const result = compareBossSpecialTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 337);
  assert.equal(result.maximumRotationError, 0); assert.deepEqual(result.sourceErrors, []);
});

test('source branch boundaries, stopped windup and release-before-visual-flight remain distinct', () => {
  assert.equal(sample('shield_priority', 1).enemy!.action, 6);
  assert.equal(sample('special_upper_boundary', 1).enemy!.action, 1);
  assert.equal(sample('below_special_level', 1).enemy!.action, 1);
  const entry = sample('special_windup_release', 1), waiting = sample('special_windup_release', 76);
  assert.equal(entry.enemy!.action, 5); assert.equal(entry.enemy!.idle, 75); assert.equal(entry.enemy!.frame, 184);
  assert.equal(waiting.enemy!.idle, 0); assert.equal(waiting.castleHp, 40); assert.equal(waiting.projectiles!.length, 0);
  const release = sample('special_windup_release', 77);
  assert.equal(release.enemy!.action, -1); assert.equal(release.enemy!.frame, 171); assert.equal(release.castleHp, 37);
  assert.equal(release.projectiles![0].x, 250); assert.equal(release.projectiles![0].y, -79.85);
  assert.equal(release.projectiles![0].shadowY, -21.7); assert.equal(release.projectiles![0].damage, -1);
  assert.equal(sample('special_windup_release', 78).projectiles![0].x, 261.25);
  const landing = sample('special_windup_release', 102).explosions![0];
  assert.equal(landing.castleBefore, 37); assert.equal(landing.castleAfter, 37);
  assert.equal(landing.drawAfter - landing.drawBefore, 2);
});

test('surviving hits double only the accumulator; death cancels only an unreleased special', () => {
  const hit = sample('windup_surviving_hits', 2);
  assert.equal(hit.enemy!.hp, 283); assert.equal(hit.enemy!.damage, 34); assert.equal(hit.enemy!.action, 5);
  const weaponHit = sample('windup_weapon_hit', 1);
  assert.equal(weaponHit.enemy!.hp, 290); assert.equal(weaponHit.enemy!.damage, 20); assert.equal(weaponHit.enemy!.knockBack, 0);
  const before = sample('lethal_before_release', 40), after = sample('death_after_release', 40);
  assert.equal(before.enemy!.hp, -1); assert.equal(before.enemy!.damage, 0);
  assert.equal(before.projectiles!.length, 0); assert.equal(before.castleHp, 40);
  assert.equal(after.enemy!.hp, -1); assert.equal(after.castleHp, 37); assert.equal(after.explosions!.length, 1);
  const repeated = sample('two_releases', 40);
  assert.equal(repeated.castleEvents!.length, 2); assert.equal(repeated.explosions!.length, 2); assert.equal(repeated.castleHp, 34);
});

test('the original trace rejects a windup implementation that keeps ordinary damage accounting', () => {
  const result = compareBossSpecialTrace(records, { afterStep: (_simulation, enemy) => {
    if (enemy.bossAction === 5 && enemy.hp > 0) enemy.bossDamage = enemy.maxHp - enemy.hp;
  } });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.scenario === 'windup_surviving_hits'
    && row.differences.some(difference => difference.field === 'enemy.damage')));
});
