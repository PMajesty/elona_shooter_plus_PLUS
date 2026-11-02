import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { compareLavaTrace, type LavaReferenceRecord } from './lava-reference-support.ts';
import { ordinaryEnemyHit, type CollisionGeometry } from '../src/collision.ts';
import type { EnemyState } from '../src/simulation.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-lava-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as LavaReferenceRecord[];
const sample = (scenario: string, step: number) => records.find(row => row.scenario === scenario && row.step === step)!;

test('Lava movement, alert, suicide, ordinary death and all contours match the independent original trace', () => {
  assert.equal(fixture.format, 'elona-original-lava-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, 'e8fb578050efd97d0192b7f1d2b2c4c96ac74c4730b532df0b1809066fb56711');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const result = compareLavaTrace(records);
  assert.equal(result.status, 'passed');
  assert.equal(result.matchedSnapshots, 659); assert.equal(result.comparedSnapshots, 659);
  assert.equal(result.matchedGeometryGrids, 12); assert.equal(result.comparedGeometryPoints, 76800);
  assert.equal(result.transientBounds.length, 49); assert.deepEqual(result.sourceErrors, []);
});

test('source Lava commits while moving, ignores new knockback, explodes once and retains distinct death histories', () => {
  const enter = sample('attack_timeline', 1), blast = sample('attack_timeline', 12), removed = sample('attack_timeline', 28);
  assert.equal(enter.enemy!.frame, 24); assert.equal(enter.enemy!.shadowHit, false); assert.equal(enter.enemy!.x, 459.8);
  assert.equal(sample('knockback_after_attack', 2).enemy!.knockBack, 0);
  assert.equal(sample('knockback_after_attack', 2).enemy!.x, 465.6);
  assert.equal(blast.enemy!.frame, 35); assert.equal(blast.enemy!.hp, -1); assert.equal(blast.castleHp, 28);
  assert.equal(blast.drawCount, 8); assert.equal(removed.enemy!.frame, 223); assert.equal(removed.enemy!.deathTicks, 201);
  assert.equal(removed.enemy!.removed, true); assert.equal(removed.castleHp, 28);
  assert.equal(sample('lethal_walking', 30).enemy!.frame, 128);
  assert.equal(sample('lethal_walking', 30).enemy!.shadowHit, true);
  assert.equal(sample('lethal_before_explosion', 11).enemy!.shadowHit, false);
  assert.equal(sample('lethal_before_explosion', 210).castleHp, 40);
  assert.equal(sample('lethal_before_explosion', 210).enemy!.removed, true);
  assert.equal(sample('alert_crossing', 4).alertCalls, 1);
  assert.equal(sample('alert_crossing', 4).nextAlertIsTarget, false);
  assert.equal(sample('alert_fallback', 1).nextAlertIsTarget, true);
});

test('original corpse-edge samples reject the previous local inverse/truncation shortcut', () => {
  const geometry = JSON.parse(readFileSync(new URL('../public/assets/collision-geometry.json', import.meta.url), 'utf8')) as CollisionGeometry;
  const grid = records.find(row => row.type === 'geometry' && row.frame === 50)!;
  const actor = { kind: 'lava' as const, x: grid.x!, y: grid.y!, frame: 50, shadowHit: false };
  const placement = geometry.enemies.lava.frames['50'].find(row => row.shape === '868')!;
  const shape = geometry.shapes[placement.shape];
  const points = [[231, 193], [229, 208], [169, 227], [174, 230], [226, 231], [225, 236]];
  for (const [x, y] of points) {
    const index = (y - grid.gridY!) * grid.width! + x - grid.gridX!;
    assert.equal(grid.bits![index], '0');
    assert.equal(ordinaryEnemyHit(actor, x, y, geometry), false);
    // Отрицательный контроль сохраняет старую арифметику, а не ожидаемую геометрию.
    const [a, b, c, d, tx, ty] = placement.matrix;
    const dx = Math.trunc(x * 20) - Math.trunc(actor.x * 20) - tx;
    const dy = Math.trunc(y * 20) - Math.trunc(actor.y * 20) - ty;
    const localX = Math.trunc((d * dx - c * dy) / (a * d - b * c));
    const localY = Math.trunc((a * dy - b * dx) / (a * d - b * c));
    const previousHit = shape.fills.some(edges => edges.filter(([x0, y0, x1, y1]) =>
      (y0 > localY) !== (y1 > localY) && localX <= x0 + (localY - y0) * (x1 - x0) / (y1 - y0)).length % 2 !== 0);
    assert.equal(previousHit, true);
  }
});

test('the independent Lava trace detects allowing knockback to interrupt a committed attack', () => {
  const result = compareLavaTrace(records, { step: (simulation, enemy) => {
    if (enemy.attacking && enemy.knockBack > 0) enemy.attacking = false;
    (simulation as unknown as { tickEnemy(value: EnemyState): void }).tickEnemy(enemy);
  } });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.scenario === 'knockback_after_attack' && !row.matched));
});
