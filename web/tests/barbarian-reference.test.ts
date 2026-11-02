import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareBarbarianTrace, type BarbarianReferenceRecord } from './barbarian-reference-support.ts';
import { barbarianDisplayWidth, barbarianParentWidth } from '../src/enemy-display-bounds.ts';
import { shadowHitAtFrame } from '../src/collision.ts';
import type { EnemyState } from '../src/simulation.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-barbarian-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as BarbarianReferenceRecord[];
const sample = (scenario: string, step: number) => records.find(row => row.scenario === scenario && row.step === step)!;

test('Barbarian AI, damage, transient bounds and contours match 671 captured original states and 12 grids', () => {
  assert.equal(fixture.format, 'elona-original-barbarian-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, '175b8a99384557ff5181de3052f0cdecb635e38cae83a068fd39a05198e55469');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const result = compareBarbarianTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 671); assert.equal(result.comparedSnapshots, 671);
  assert.equal(result.matchedGeometryGrids, 12); assert.equal(result.comparedGeometryPoints, 76800);
  assert.equal(result.transientBounds.length, 108); assert.deepEqual(result.sourceErrors, []);
});

test('source rage keeps its unequal speeds, strict activation threshold and accelerated attack loop', () => {
  const walking = sample('rage_walk', 0).enemy!;
  assert.equal(walking.speed, 4.292374372854829); assert.equal(walking.speedOrg, 7.418294215258452);
  const interrupted = sample('rage_attack_knockback', 1).enemy!;
  assert.equal(interrupted.speed, walking.speedOrg); assert.equal(interrupted.frame, 4);
  const threshold = sample('rage_threshold_and_repeat', 0), activated = sample('rage_threshold_and_repeat', 1), repeated = sample('rage_threshold_and_repeat', 2);
  assert.equal(threshold.enemy!.rampage, 0); assert.equal(activated.enemy!.rampage, 100);
  assert.equal(activated.drawCount, threshold.drawCount! + 1); assert.equal(repeated.drawCount, activated.drawCount);
  assert.equal(sample('rage_walk', 80).enemy!.rampage, 100);
  const strikeSteps = (name: string) => {
    let hp = 40;
    return records.filter(row => row.scenario === name).flatMap(row => {
      const changed = row.castleHp !== hp; hp = row.castleHp!; return changed ? [row.step!] : [];
    });
  };
  assert.deepEqual(strikeSteps('normal_attack'), [19, 65, 111]);
  assert.deepEqual(strikeSteps('rage_attack'), [1, 17, 33, 49]);
});

test('source parent hit particles change the real left clamp and expire independently of rage', () => {
  for (const [scenario, width, nextX] of [['rage_contact_left_clamp', 26.05, -26.05], ['critical_contact_left_clamp', 29.05, -26.5]] as const) {
    const initial = sample(scenario, 0).enemy!, next = sample(scenario, 1).enemy!;
    const hits = initial.effects.filter(effect => effect.kind === 'hit');
    assert.equal(barbarianParentWidth(initial.frame, initial.rageEffectFrame, hits), width);
    assert.equal(initial.parentWidth, width); assert.equal(next.x, nextX);
    assert.equal(barbarianDisplayWidth(initial.frame, initial.rageEffectFrame), 21.8);
    assert.notEqual(barbarianParentWidth(initial.frame, initial.rageEffectFrame, []), initial.parentWidth);
  }
  const critical = sample('critical_contact_left_clamp', 0).enemy!;
  assert.equal(critical.hp, 83); assert.deepEqual(critical.effects.map(effect => effect.frame), [50, 70, 1]);
  assert.deepEqual(sample('critical_contact_left_clamp', 6).enemy!.effects.map(effect => effect.frame), [56, 7]);
  assert.deepEqual(sample('critical_contact_left_clamp', 12).enemy!.effects.map(effect => effect.frame), [62]);
  assert.deepEqual(sample('critical_contact_left_clamp', 13).enemy!.effects, []);
  assert.equal(sample('offset_hit_parent_bounds', 0).config!.syntheticWidthDiagnostic, true);
});

test('source lethal hits skip rage and detach the corpse after its stopped death pose', () => {
  const killed = sample('lethal_bypasses_rage', 0).enemy!;
  assert.equal(killed.rampage, 0); assert.equal(killed.frame, 84);
  assert.equal(sample('lethal_bypasses_rage', 35).enemy!.frame, 119);
  assert.equal(sample('lethal_bypasses_rage', 199).enemy!.removed, false);
  const removed = sample('lethal_bypasses_rage', 200).enemy!;
  assert.equal(removed.frame, 252); assert.equal(removed.hp, -1); assert.equal(removed.deathTicks, 201);
  assert.equal(removed.width, 18.5); assert.equal(removed.parentWidth, 0); assert.equal(removed.removed, true);
  assert.equal(shadowHitAtFrame('barbarian', 1, false), true);
});

test('the independent Barbarian trace rejects replacing source speedOrg with current rage speed', () => {
  const result = compareBarbarianTrace(records, { step: (simulation, enemy) => {
    (simulation as unknown as { tickEnemy(value: EnemyState): void }).tickEnemy(enemy);
    if (enemy.rampage && enemy.speed !== 0) enemy.speedOrg = enemy.speed;
  } });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.scenario === 'rage_walk' && row.differences.some(difference => difference.field === 'enemy.speedOrg')));
});
