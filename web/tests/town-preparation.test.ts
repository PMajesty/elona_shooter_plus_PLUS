import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemFactory } from '../src/items.ts';
import { prepareFirstTown } from '../src/town-preparation.ts';

function randomStream(seed: number) {
  let state = seed, draws = 0;
  return { random: () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; draws++; return (state >>> 0) / 4294967296; }, draws: () => draws, state: () => state >>> 0 };
}

test('first shop preserves inactive unused-slot metadata without mutating postbattle items', () => {
  const itemFactory = new ItemFactory(() => 0.1);
  const previous = Array.from({ length: 8 }, () => itemFactory.generate(3));
  previous[1].num = 0;
  const before = structuredClone(previous);
  const stream = randomStream(42);
  const prepared = prepareFirstTown(stream.random, { priorOffers: previous });
  assert.deepEqual(previous, before);
  assert.equal(prepared.shop.filter(item => item && item.num > 0).length, 2);
  assert.equal(prepared.shop[0]?.type, 1);
  assert.deepEqual(prepared.shop.slice(2), before.slice(2).map(item => ({ ...item, num: 0 })));
  prepared.shop[2]!.value = 999;
  assert.equal(previous[2].value, before[2].value);
});

test('an existing searched value skips only its initialization draw after complete town preparation', () => {
  const freshStream = randomStream(42), existingStream = randomStream(42);
  const fresh = prepareFirstTown(freshStream.random);
  const existing = prepareFirstTown(existingStream.random, { searched: 321 });
  assert.equal(existing.searched, 321);
  assert.deepEqual({ ...fresh, searched: 321 }, existing);
  assert.equal(freshStream.draws(), existingStream.draws() + 1);
  assert.equal(Math.trunc(existingStream.random() * 1000), fresh.searched);
  assert.equal(existingStream.state(), freshStream.state());
});
