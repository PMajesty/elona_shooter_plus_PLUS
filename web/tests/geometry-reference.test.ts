import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ordinaryEnemyHit, shadowHitAtFrame, type CollisionGeometry, type OrdinaryEnemyKind } from '../src/collision.ts';

test('production ordinary-enemy contours match all original sampled hit points', () => {
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-geometry-trace.json', import.meta.url), 'utf8'));
  const geometry = JSON.parse(readFileSync(new URL('../public/assets/collision-geometry.json', import.meta.url), 'utf8')) as CollisionGeometry;
  assert.equal(fixture.format, 'elona-original-geometry-trace');
  assert.equal(geometry.sourceSha256, fixture.originalSha256);
  const kinds: Record<number, OrdinaryEnemyKind> = { 3: 'sheep', 17: 'rat', 19: 'chicken', 6: 'crow' };
  let cases = 0, points = 0;
  for (const snapshot of fixture.records.filter((record: { type: string }) => record.type === 'snapshot')) {
    const kind = kinds[snapshot.enemyId]; assert.ok(kind);
    let shadowHit = shadowHitAtFrame(kind, snapshot.spawnFrame);
    for (const frame of snapshot.poseFrames) shadowHit = shadowHitAtFrame(kind, frame, shadowHit);
    shadowHit = shadowHitAtFrame(kind, snapshot.frame, shadowHit);
    assert.equal(shadowHit, snapshot.shadowHit);
    const enemy = { kind, frame: snapshot.frame, x: snapshot.position.x, y: snapshot.position.y, shadowHit };
    const grid = snapshot.grid;
    assert.equal(grid.step, 1);
    assert.equal(snapshot.combinedBits.length, grid.width * grid.height);
    assert.deepEqual(snapshot.rootPosition, { x: 0, y: 0 });
    for (let i = 0; i < snapshot.combinedBits.length; i++) {
      const x = grid.x + i % grid.width, y = grid.y + Math.floor(i / grid.width);
      // Ожидание получено от исходного SWF, вычисление — от обычного игрового пути.
      assert.equal(ordinaryEnemyHit(enemy, x, y, geometry), snapshot.combinedBits[i] === '1', `${kind} frame ${enemy.frame}, position (${enemy.x},${enemy.y}), point (${x},${y})`);
      points++;
    }
    cases++;
  }
  assert.equal(cases, 19);
  assert.equal(points, 77824);
});
