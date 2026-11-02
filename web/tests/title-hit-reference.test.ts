import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { titlePointerHit, titleStateBounds, titleStateHit, type TitleButtonKey, type TitleButtonState } from '../src/title-hit.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-title-hit-trace.json', import.meta.url), 'utf8'));
const digest = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
const key = (name: string) => `button_${name}` as TitleButtonKey;
interface Point { localX: number; localY: number; hit: boolean }
interface Snapshot { type: string; button: string; state: TitleButtonState; bounds: { x: number; y: number; width: number; height: number }; points: Point[] }
const snapshots = (fixture.records as Snapshot[]).filter(row => row.type === 'snapshot');

test('production title hit regions match all 204 original state and edge observations', () => {
  assert.equal(fixture.format, 'elona-original-title-hit-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(fixture.instrumentedSwfSha256, 'e529c49d7d901dc1354f2f27d09f6a00b5a0d8b10b8f8f4063886b44761958f5');
  assert.equal(digest(JSON.stringify(fixture.records)), fixture.traceSha256);
  assert.equal(snapshots.length, 12);
  let points = 0;
  for (const row of snapshots) {
    const bounds = titleStateBounds(key(row.button), row.state);
    assert.deepEqual({ x: 200 + bounds.xMin, y: 200 + bounds.yMin, width: bounds.xMax - bounds.xMin, height: bounds.yMax - bounds.yMin }, row.bounds);
    for (const point of row.points) {
      assert.equal(titleStateHit(key(row.button), row.state, point.localX, point.localY), point.hit, `${row.button}/${row.state} at ${point.localX},${point.localY}`);
      ++points;
    }
  }
  assert.equal(points, 204);
});

test('the prior PNG alpha threshold rejects verified transparent points that the original accepts', () => {
  assert.equal(fixture.rasterNegativeControl.samples.length, 6);
  for (const sample of fixture.rasterNegativeControl.samples) {
    const asset = readFileSync(new URL(`../public/assets/${sample.file}`, import.meta.url));
    assert.equal(digest(asset), sample.sha256, 'Measured PNG must remain byte-identical');
    const original = snapshots.find(row => row.button === sample.button && row.state === sample.state)!.points.find(point => point.localX === sample.localX && point.localY === sample.localY)!;
    assert.equal(original.hit, true);
    assert.equal(sample.alpha, 0);
    assert.equal(sample.alpha >= 100, false);
    assert.equal(titleStateHit(key(sample.button), sample.state, sample.localX, sample.localY), true);
  }
});

test('title pointer picking and current-state click geometry retain the original distinct borders', () => {
  for (const button of ['button_newGame', 'button_continue', 'button_help'] as const) {
    assert.equal(titlePointerHit(button, 'up', 51, 0), true);
    assert.equal(titlePointerHit(button, 'over', 51, 0), false);
    assert.equal(titleStateHit(button, 'down', 51, 0), false);
    assert.equal(titlePointerHit(button, 'up', 80, 18), true);
    assert.equal(titleStateHit(button, 'up', 80, 18), false);
    assert.equal(titleStateHit(button, 'down', 80, 18), true);
    assert.equal(titlePointerHit(button, 'up', 50, 0), false);
    assert.equal(titlePointerHit(button, 'over', 80, 18.85), false);
  }
});
