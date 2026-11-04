import assert from 'node:assert/strict';
import test from 'node:test';
import { SAVE_KEY, SAVE_SLOTS, readSelectedSlot, selectSaveSlot, readSave, storeSave, clearSave, deleteSaveSlot, readProfile, storeProfile, readMute, storeMute } from '../src/storage.ts';
import { saveSlotLabel } from '../src/save-slots.ts';
import { Simulation } from '../src/simulation.ts';
import { SAVE_VERSION } from '../src/save-version.ts';

function memory(run: (values: Map<string, string>, failWrites: (fail: boolean) => void) => void): void {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage'), values = new Map<string, string>(); let failing = false;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { if (failing) throw new Error('Storage unavailable.'); values.set(key, value); },
    removeItem: (key: string) => { if (failing) throw new Error('Storage unavailable.'); values.delete(key); },
  } });
  try { run(values, fail => { failing = fail; }); }
  finally { if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor); else delete (globalThis as { localStorage?: unknown }).localStorage; }
}
function adventure(seed: number) {
  return { format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0, simulation: new Simulation(seed).toSave() };
}

test('the original single-save key remains slot0 without migration, writes or changes to its full envelope', () => memory(values => {
  const original = adventure(42), raw = JSON.stringify(original); values.set(SAVE_KEY, raw);
  assert.equal(readSelectedSlot(), 0); assert.equal(SAVE_SLOTS, 8);
  assert.deepEqual(readSave(), { kind: 'saved', data: original });
  assert.equal(values.size, 1); assert.equal(values.get(SAVE_KEY), raw);
  for (let slot = 1; slot < SAVE_SLOTS; slot++) assert.deepEqual(readSave(slot), { kind: 'empty' });
}));

test('eight adventures remain isolated through selected-slot saves, reload and mute/profile updates', () => memory(() => {
  const games = Array.from({ length: SAVE_SLOTS }, (_, slot) => adventure(slot + 1));
  const profile = { version: 1 as const, medals: [40, 83], bestDay: 18 };
  assert.ok(storeProfile(profile)); storeMute(true);
  games.forEach((game, slot) => { assert.ok(selectSaveSlot(slot)); assert.ok(storeSave(game)); });
  games.forEach((game, slot) => { assert.deepEqual(readSave(slot), { kind: 'saved', data: game }); });
  assert.equal(readSelectedSlot(), 7); assert.deepEqual(readSave(), { kind: 'saved', data: games[7] });
  storeMute(false); assert.equal(readSelectedSlot(), 7); assert.equal(readMute(), false);
  assert.deepEqual(readProfile().profile, profile);
  assert.ok(selectSaveSlot(0)); assert.deepEqual(readSave(), { kind: 'saved', data: games[0] });
}));

test('deletion marks only the requested slot empty, retaining source-style tombstone data and independent medals', () => memory(values => {
  const first = adventure(1), removed = adventure(2);
  storeSave(first, 0); storeSave(removed, 6); selectSaveSlot(6);
  const profile = { version: 1 as const, medals: [40, 65], bestDay: 10 }; storeProfile(profile); storeMute(true);
  const before = new Map(values); assert.ok(deleteSaveSlot(6));
  assert.deepEqual(readSave(), { kind: 'empty' }); assert.deepEqual(readSave(0), { kind: 'saved', data: first });
  assert.equal(readSelectedSlot(), 6); assert.deepEqual(readProfile().profile, profile); assert.equal(readMute(), true);
  const changed = [...values.keys()].filter(key => before.get(key) !== values.get(key)); assert.equal(changed.length, 1);
  const tombstone = values.get(changed[0])!; assert.deepEqual(JSON.parse(JSON.parse(tombstone).raw), removed);
  assert.ok(deleteSaveSlot(6)); assert.equal(values.get(changed[0]), tombstone);
  assert.ok(storeSave(first, 6)); assert.deepEqual(readSave(6), { kind: 'saved', data: first });
}));

test('Hardcore deletion uses the active adventure slot, independent of the currently selected title slot', () => memory(() => {
  for (let slot = 0; slot < SAVE_SLOTS; slot++) storeSave(adventure(slot + 1), slot);
  selectSaveSlot(2); const selected = readSave(2);
  assert.ok(clearSave(5)); assert.deepEqual(readSave(5), { kind: 'empty' }); assert.deepEqual(readSave(), selected);
  assert.equal(readSelectedSlot(), 2);
  for (let slot = 0; slot < SAVE_SLOTS; slot++) if (slot !== 5) assert.equal(readSave(slot).kind, 'saved');
}));

test('corrupt slots and failed/invalid writes cannot damage another adventure or the current selection', () => memory((values, failWrites) => {
  storeSave(adventure(1), 0); storeSave(adventure(2), 7); selectSaveSlot(7);
  values.set(`${SAVE_KEY}.slot.3`, '{invalid'); assert.equal(readSave(3).kind, 'error'); assert.equal(readSave(0).kind, 'saved');
  const before = new Map(values);
  for (const slot of [-1, 8, 0.5, NaN]) {
    assert.equal(selectSaveSlot(slot), false); assert.equal(storeSave({}, slot), false); assert.equal(deleteSaveSlot(slot), false);
  }
  assert.deepEqual(values, before);
  failWrites(true); assert.equal(selectSaveSlot(4), false); assert.equal(deleteSaveSlot(7), false); assert.equal(clearSave(7), false); assert.equal(storeSave({}, 7), false);
  assert.deepEqual(values, before); assert.equal(readSelectedSlot(), 7);
  failWrites(false); assert.ok(deleteSaveSlot(3)); assert.deepEqual(readSave(3), { kind: 'empty' });
  assert.equal(readSave(7).kind, 'saved');
}));

test('title labels follow original class/level/day and HC text, exposing empty and unreadable slots', () => {
  const game = adventure(42);
  assert.equal(saveSlotLabel({ kind: 'saved', data: game }), 'Classic · Sheriff(1) Day.1');
  assert.equal(saveSlotLabel({ kind: 'saved', data: { ...game, simulation: { ...game.simulation, mode: 'hardcore' } } }), 'Classic · Sheriff(1) Day.1 HC');
  assert.equal(saveSlotLabel({ kind: 'empty' }), 'Empty Save');
  assert.equal(saveSlotLabel({ kind: 'error', message: 'broken' }), 'Unreadable Save');
  for (const data of [null, {}, { ...game, simulation: { day: 1, player: { classId: 'unknown', level: 1 } } }]) assert.equal(saveSlotLabel({ kind: 'saved', data }), 'Unreadable Save');
});
