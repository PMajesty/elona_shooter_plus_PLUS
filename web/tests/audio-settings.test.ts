import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { AudioMixer } from '../src/audio-mixer.ts';
import { AUDIO_SETTINGS_KEY, DEFAULT_AUDIO_SETTINGS, SOUND_CATEGORIES, soundCategory, normalizeAudioSettings, readAudioSettings, storeAudioSettings } from '../src/audio-settings.ts';
import { readMute, storeMute } from '../src/storage.ts';

test('every bundled sound is classified and only the original background loops are ambience', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/assets/manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(SOUND_CATEGORIES).sort(), Object.keys(manifest.sounds).sort());
  assert.deepEqual(Object.keys(SOUND_CATEGORIES).filter(key => soundCategory(key) === 'ambience').sort(), ['soundBgForest', 'soundBgTown']);
  for (const key of ['soundChicken', 'soundCrow', 'soundTank', 'soundNight', 'soundFirework', 'soundChain3', 'soundPray1']) assert.equal(soundCategory(key), 'effects');
  assert.equal(soundCategory('soundMute'), 'silent'); assert.equal(soundCategory('soundBad'), 'unused');
  assert.throws(() => soundCategory('soundFuture'), /Unclassified/);
  assert.throws(() => soundCategory('toString'), /Unclassified/);
});

test('all source playback paths use the mixer, including title markers, chain gun and bows', () => {
  const main = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(main, /this\.sound\.(?:add|play)\(/);
});

test('volume defaults preserve the mix and corrupt or out-of-range preferences are bounded', () => {
  assert.deepEqual(DEFAULT_AUDIO_SETTINGS, { master: 1, effects: 1, ambience: 1 });
  for (const bad of [null, [], 'quiet', false]) assert.deepEqual(normalizeAudioSettings(bad), DEFAULT_AUDIO_SETTINGS);
  assert.deepEqual(normalizeAudioSettings({ master: Infinity, effects: -3, ambience: 5 }), { master: 1, effects: 0, ambience: 1 });
  assert.deepEqual(normalizeAudioSettings({ master: '0', effects: 0.4, ambience: NaN }), { master: 1, effects: 0.4, ambience: 1 });
});

class FakeSound extends EventEmitter {
  config: { volume: number; pan?: number; loop?: boolean; seek?: number };
  volume: number;
  markers: Record<string, any> = {};
  played: unknown;
  destroyed = false;
  constructor(config: any) { super(); this.config = config; this.volume = config.volume; }
  addMarker(marker: any) { this.markers[marker.name] = marker; }
  play(marker?: unknown) { this.played = marker ?? true; return true; }
  destroy() { this.destroyed = true; this.emit('destroy'); }
}
function fixture() {
  const created: FakeSound[] = [];
  const backend = { volume: 1, add(_key: string, config: any) { const sound = new FakeSound(config); created.push(sound); return sound; } };
  const mixer = new AudioMixer(backend as any, { ...DEFAULT_AUDIO_SETTINGS });
  return { mixer, created, backend };
}

test('ambience attenuation leaves effects and positional mix intact, updates existing loops without restart', () => {
  const { mixer, created, backend } = fixture();
  mixer.add('soundBgForest', { volume: 0.3, loop: true });
  mixer.add('soundChain3', { volume: 0.2, pan: 0.8, loop: true });
  mixer.add('soundBow2', { volume: 0.65 });
  mixer.setSettings({ master: 0.5, effects: 1, ambience: 0.25 });
  assert.equal(backend.volume, 0.5);
  assert.deepEqual(created.map(s => s.volume), [0.075, 0.2, 0.65]);
  assert.equal(created[1].config.pan, 0.8); assert.ok(created[1].config.loop);
  assert.ok(created.every(s => !s.played && !s.destroyed));
  mixer.setSettings({ master: 1, effects: 0, ambience: 1 });
  assert.deepEqual(created.map(s => s.volume), [0.3, 0, 0]);
  mixer.setSettings({ master: 1, effects: 1, ambience: 1 });
  assert.deepEqual(created.map(s => s.volume), [0.3, 0.2, 0.65]);
});

test('new sounds, title markers and destroyed sounds respect channel settings and original timings', () => {
  const { mixer, created } = fixture();
  mixer.setSettings({ master: 1, effects: 0.5, ambience: 0 });
  const marker = { name: 'title-shot', start: 1633 / 22050, duration: 1607 / 22050 };
  mixer.play('soundGun2', { volume: 0.74, pan: 0.42 }, marker);
  assert.deepEqual(created[0].markers['title-shot'], { ...marker, config: { volume: 0.37, pan: 0.42 } });
  assert.equal(created[0].played, 'title-shot');
  created[0].emit('complete'); assert.ok(created[0].destroyed);
  mixer.setSettings({ master: 1, effects: 1, ambience: 0 });
  assert.equal(created[0].volume, 0.37, 'destroyed sounds are no longer adjusted');
  mixer.add('soundBgTown', { volume: 0.3, loop: true }); assert.equal(created[1].volume, 0);
  mixer.play('soundClick1', { volume: 0.7 }); assert.equal(created[2].volume, 0.7);
  assert.throws(() => mixer.play('soundBad'), /verified playback role/);
});

test('audio preferences survive independently of mute and adventures; unavailable storage is harmless', context => {
  const warnings = context.mock.method(console, 'warn', () => {});
  const before = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>([['elona-shooter-plus-plus.port.save.v1', 'untouched-adventure']]);
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    } });
    assert.deepEqual(readAudioSettings(), DEFAULT_AUDIO_SETTINGS); assert.equal(readMute(), true);
    const levels = { master: 0.8, effects: 1, ambience: 0.15 };
    storeAudioSettings(levels); storeMute(false);
    assert.deepEqual(readAudioSettings(), levels); assert.equal(readMute(), false);
    storeMute(true); assert.deepEqual(readAudioSettings(), levels);
    assert.equal(values.get('elona-shooter-plus-plus.port.save.v1'), 'untouched-adventure');
    values.set(AUDIO_SETTINGS_KEY, '{broken'); assert.deepEqual(readAudioSettings(), DEFAULT_AUDIO_SETTINGS);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('denied'); } });
    assert.deepEqual(readAudioSettings(), DEFAULT_AUDIO_SETTINGS); assert.equal(storeAudioSettings(levels), false);
    assert.equal(storeAudioSettings(levels), false); assert.equal(warnings.mock.callCount(), 3);
    assert.equal((warnings.mock.calls[2].arguments[1] as Error).message, 'denied');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    } });
    assert.equal(storeAudioSettings(levels), true); assert.deepEqual(readAudioSettings(), levels);
  } finally {
    if (before) Object.defineProperty(globalThis, 'localStorage', before);
    else delete (globalThis as any).localStorage;
  }
});
