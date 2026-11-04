import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { readNewGameRuleset, storeNewGameRuleset, storeSave, readSave, readProfile, storeProfile,
  storeMute, readMute } from '../src/storage.ts';
import { createProfile } from '../src/profile.ts';
import type { RulesetId } from '../src/rulesets.ts';

function installStorage(t: TestContext, descriptor: PropertyDescriptor) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, ...descriptor });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });
}
function memoryStorage(t: TestContext) {
  const values = new Map<string, string>();
  installStorage(t, { value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  } });
  return values;
}

test('edition preference defaults to Classic and remembers both explicit choices across reads', t => {
  const values = memoryStorage(t);
  assert.equal(readNewGameRuleset(), 'classic'); assert.equal(values.size, 0);
  for (const edition of ['expanded', 'classic', 'expanded'] as const) {
    assert.equal(storeNewGameRuleset(edition), true);
    assert.equal(readNewGameRuleset(), edition);
    assert.equal(readNewGameRuleset(), edition);
    assert.equal(values.size, 1);
  }
});

test('invalid stored edition defaults to Classic without modifying storage', t => {
  const values = memoryStorage(t);
  storeNewGameRuleset('expanded'); const key = [...values.keys()][0];
  for (const invalid of ['', 'Expanded', 'CLASSIC', 'unknown', 'null', '"expanded"', '{"id":"expanded"}']) {
    values.set(key, invalid);
    assert.equal(readNewGameRuleset(), 'classic');
    assert.equal(values.get(key), invalid);
  }
  values.set(key, 'expanded');
  assert.equal(storeNewGameRuleset('unknown' as RulesetId), false);
  assert.equal(readNewGameRuleset(), 'expanded');
});

test('unavailable storage getter or read/write methods never block edition selection', t => {
  installStorage(t, { get() { throw new Error('storage denied'); } });
  assert.equal(readNewGameRuleset(), 'classic');
  assert.equal(storeNewGameRuleset('expanded'), false);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem() { throw new Error('read denied'); },
    setItem() { throw new Error('quota exceeded'); },
  } });
  assert.equal(readNewGameRuleset(), 'classic');
  assert.equal(storeNewGameRuleset('classic'), false);
});

test('edition preference is independent from adventure saves, medal profiles and mute options', t => {
  const values = memoryStorage(t);
  assert.equal(storeNewGameRuleset('expanded'), true);
  const profile = createProfile('classic'); profile.medals = [40];
  assert.equal(storeProfile(profile), true);
  assert.equal(storeSave({ simulation: { ruleset: { id: 'classic', revision: 1 } } }, 0), true);
  storeMute(false);
  assert.equal(readNewGameRuleset(), 'expanded');
  const unrelated = new Map([...values].filter(([, value]) => value !== 'expanded'));
  assert.equal(storeNewGameRuleset('classic'), true);
  for (const [key, value] of unrelated) assert.equal(values.get(key), value);
  assert.deepEqual(readProfile('classic').profile, profile);
  assert.deepEqual(readSave(0), { kind: 'saved', data: { simulation: { ruleset: { id: 'classic', revision: 1 } } } });
  assert.equal(readMute(), false);
});
