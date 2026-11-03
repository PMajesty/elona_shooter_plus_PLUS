import test from 'node:test';
import assert from 'node:assert/strict';
import { ScreenShake } from '../src/screen-shake.ts';

test('source explosion shake follows its first step, decaying bounds and exact ending', () => {
  const shake = new ScreenShake(); shake.start(10, 5, 0.9, () => 0);
  shake.advance(1000 / 30);
  assert.equal(shake.x, 3.625); assert.equal(shake.y, 3.625);
  assert.equal(shake.remaining, 9);
  for (let frame = 2; frame <= 10; frame++) {
    shake.advance(1000 / 30);
    assert.ok(Math.abs(shake.x) <= 5 * 0.9 ** frame + 1e-9);
  }
  assert.deepEqual([shake.remaining, shake.x, shake.y], [0, 0, 0]);
});

test('source int strength and replacement discard the previous shake without stale offsets', () => {
  const shake = new ScreenShake(); shake.start(150, 1.5, 1, () => 0);
  shake.advance(1000 / 30); assert.equal(shake.x, 0.75);
  shake.start(5, 1.5, 1, () => 1);
  assert.deepEqual([shake.x, shake.y, shake.remaining], [0, 0, 5]);
  shake.advance(0); assert.equal(shake.remaining, 5);
  shake.reset(); shake.advance(1000);
  assert.deepEqual([shake.remaining, shake.x, shake.y], [0, 0, 0]);
});
