import test from 'node:test';
import assert from 'node:assert/strict';
import { readFlashSharedObject } from '../src/flash-shared-object.ts';
import { readFlashCollection } from '../src/flash-profile.ts';
import { createProfile, mergeProfiles } from '../src/profile.ts';
import { Simulation } from '../src/simulation.ts';
import { heroClassUnlocked } from '../src/hero-classes.ts';

// Малые бинарные входы AMF3; не моделируют исполнение Flash или игровой цикл.
export function flashFixture(name: string, data: Record<string, unknown>): Uint8Array {
  const bytes: number[] = [], strings: string[] = [], objects: unknown[] = [];
  let dynamicTrait = false;
  const uint = (number: number) => {
    if (number < 128) bytes.push(number);
    else if (number < 16384) bytes.push((number >>> 7) | 128, number & 127);
    else if (number < 2097152) bytes.push((number >>> 14) | 128, ((number >>> 7) & 127) | 128, number & 127);
    else bytes.push((number >>> 22) | 128, ((number >>> 15) & 127) | 128, ((number >>> 8) & 127) | 128, number & 255);
  };
  const string = (text: string) => {
    const previous = strings.indexOf(text);
    if (text && previous >= 0) { uint(previous * 2); return; }
    const utf = Buffer.from(text); uint(utf.length * 2 + 1); bytes.push(...utf); if (text) strings.push(text);
  };
  const value = (input: unknown): void => {
    if (input === undefined) { bytes.push(0); return; }
    if (input === null) { bytes.push(1); return; }
    if (typeof input === 'boolean') { bytes.push(input ? 3 : 2); return; }
    if (typeof input === 'string') { bytes.push(6); string(input); return; }
    if (typeof input === 'number') {
      if (Number.isInteger(input) && input >= -0x10000000 && input < 0x10000000) { bytes.push(4); uint(input & 0x1fffffff); }
      else { bytes.push(5); const buffer = Buffer.alloc(8); buffer.writeDoubleBE(input); bytes.push(...buffer); }
      return;
    }
    const array = Array.isArray(input), previous = objects.indexOf(input);
    bytes.push(array ? 9 : 10);
    if (previous >= 0) { uint(previous * 2); return; }
    objects.push(input);
    if (array) {
      const dense = Object.keys(input).length === input.length;
      uint(dense ? input.length * 2 + 1 : 1);
      if (!dense) for (const [key, item] of Object.entries(input)) { string(key); value(item); }
      string(''); if (dense) for (const item of input) value(item);
    } else {
      if (dynamicTrait) uint(1); else { uint(11); string(''); dynamicTrait = true; }
      for (const [key, item] of Object.entries(input as object)) { string(key); value(item); }
      string('');
    }
  };
  for (const [key, item] of Object.entries(data)) { string(key); value(item); bytes.push(0); }
  const title = Buffer.from(name), header = Buffer.alloc(22 + title.length);
  header.writeUInt16BE(0xbf); header.writeUInt32BE(header.length + bytes.length - 6, 2);
  header.write('TCSO', 6); header.writeUInt16BE(4, 10); header.writeUInt16BE(title.length, 16);
  title.copy(header, 18); header.writeUInt32BE(3, 18 + title.length);
  return Buffer.concat([header, Buffer.from(bytes)]);
}

export function collectionFixture(): Uint8Array {
  const medal = Array(200);
  for (const id of [40, 41, 42, 65, 66, 67, 68, 87, 90]) medal[id] = true;
  return flashFixture('elonas_idx', { idx: { day: 150, dayHC: 100, dayCasual: 40,
    saveName: ['You', 'You', 'Empty Save'], unlocked: [true, true, true, true, true, true, true, true], mute: false, version: '1.3.0.4' }, medal });
}

test('reader accepts independent Ruffle SOL integer/array golden files', () => {
  // https://github.com/ruffle-rs/rust-flash-lso/tree/master/flash-lso/tests/sol
  const integer = readFlashSharedObject(Buffer.from('00bf000000295443534f00040000000000104153332d496e74656765722d44656d6f000000030b6d79496e74040700', 'hex'));
  const array = readFlashSharedObject(Buffer.from('00bf000000335443534f000400000000000e4153332d41727261792d44656d6f00000003156d79496e74417272617909070104010402040300', 'hex'));
  assert.equal(integer.data.myInt, 7); assert.deepEqual(array.data.myIntArray, [1, 2, 3]);
});

test('AMF3 references, Unicode, dense/sparse arrays, signed integers and doubles retain their values', () => {
  const shared = { name: '勇者', negative: -268435455, exact: 3.25 }, nested = { same: shared };
  const encoded = flashFixture('elonas_idx', { first: shared, again: shared, nested, array: [1, undefined, true, null, '勇者'] });
  const decoded = readFlashSharedObject(encoded).data;
  assert.strictEqual(decoded.first, decoded.again);
  assert.strictEqual((decoded.nested as any).same, decoded.first);
  assert.deepEqual({ ...decoded.first as object }, shared);
  assert.deepEqual(decoded.array, [1, undefined, true, null, '勇者']);
  const dense = Array(200).fill(false); dense[40] = true;
  assert.deepEqual(readFlashCollection(flashFixture('elonas_idx', { idx: { day: 1 }, medal: dense })).profile.medals, [40]);
});

test('original index imports known medals and all mode records, reporting unsupported flags without inventing bonuses', () => {
  const result = readFlashCollection(collectionFixture());
  assert.deepEqual(result, { profile: { version: 1, medals: [40, 41, 42, 65, 66, 67, 68, 87], bestDay: 150, bestHardcoreDay: 100, bestCasualDay: 40 }, ignoredMedals: [90] });
  const alias = readFlashCollection(flashFixture('elonas_idx', { idx: { dayHC: 80, daysHC: 100 }, medal: [] }));
  assert.equal(alias.profile.bestHardcoreDay, 100);
});

test('collection merge preserves medals/records and future class unlocks, bonuses and deterministic JSON replay', () => {
  const existing = { ...createProfile(), medals: [40, 43], bestDay: 200, bestCasualDay: 80 }, original = structuredClone(existing);
  const imported = readFlashCollection(collectionFixture()).profile, profile = mergeProfiles(existing, imported);
  assert.deepEqual(existing, original); assert.equal(profile.bestDay, 200); assert.equal(profile.bestCasualDay, 80);
  assert.ok(profile.medals.includes(43)); assert.equal(profile.bestHardcoreDay, 100);
  assert.deepEqual(mergeProfiles(profile, imported), profile);
  for (const hero of ['sniper', 'ranger', 'duelist', 'noble'] as const) assert.ok(heroClassUnlocked(hero, profile.medals));
  const sim = new Simulation(42, { medals: imported.medals });
  assert.equal(sim.state.gold, 500); assert.equal(sim.state.economy.fame, 20);
  const restored = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
  for (let i = 0; i < 120; i++) { sim.tick(); restored.tick(); }
  assert.deepEqual(restored.toSave(), sim.toSave());
});

test('wrong games/adventures and invalid flags or records are refused before producing a collection', () => {
  assert.throws(() => readFlashCollection(flashFixture('elonas0', { game: {} })), /adventure conversion/);
  assert.throws(() => readFlashCollection(flashFixture('another-game', { idx: {}, medal: [] })), /not an Elona/);
  for (const bad of [-1, 2.5, NaN, 1000001]) assert.throws(() => readFlashCollection(flashFixture('elonas_idx', { idx: { day: bad }, medal: [] })), /invalid survival record/);
  const medal = Array(200); medal[40] = 'true';
  assert.throws(() => readFlashCollection(flashFixture('elonas_idx', { idx: {}, medal })), /invalid medal flags/);
});

test('malformed/truncated/oversize/reference and prototype inputs fail without prototype changes', () => {
  const bytes = collectionFixture();
  assert.throws(() => readFlashSharedObject(bytes.subarray(0, bytes.length - 1)));
  const length = bytes.slice(); length[5] ^= 1; assert.throws(() => readFlashSharedObject(length));
  const marker = bytes.slice(); marker[0] = 1; assert.throws(() => readFlashSharedObject(marker));
  assert.throws(() => readFlashSharedObject(new Uint8Array(1000001)), /too large/);
  const dangerous = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(() => readFlashSharedObject(flashFixture('elonas_idx', { idx: dangerous, medal: [] })));
  assert.equal(({} as any).polluted, undefined);
  const badReference = flashFixture('elonas_idx', { idx: { name: 'x' }, medal: [] });
  badReference[badReference.length - 2] = 0xfe;
  assert.throws(() => readFlashSharedObject(badReference));
});
