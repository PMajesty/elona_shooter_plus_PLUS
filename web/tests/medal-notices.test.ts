import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MedalNotices } from '../src/medal-notices.ts';
import { MEDALS } from '../src/medals.ts';
import { Simulation } from '../src/simulation.ts';

test('new awards show original wording once without changing simulation or RNG', () => {
  const notices = new MedalNotices(), sim = new Simulation(42);
  notices.reset(sim.state.earnedMedals);
  sim['awardMedal'](70); sim['awardMedal'](71);
  const before = sim.toSave();
  const added = notices.observe(sim.state.earnedMedals, true);
  assert.deepEqual(added.map(n => [n.id, n.slot, n.battle]), [[70, 0, true], [71, 1, true]]);
  assert.equal(added[0].text, `You've been awarded <${MEDALS[70].name}> Medal!`);
  assert.deepEqual(notices.observe(sim.state.earnedMedals, true), []);
  notices.advance(2000);
  assert.deepEqual(sim.toSave(), before);
  assert.deepEqual(Simulation.fromSave(JSON.parse(JSON.stringify(before))).toSave(), before);
  const original = readFileSync(new URL('../../src/original/MainTimeline.as', import.meta.url), 'utf8');
  assert.ok(original.includes('popInfo("You\\\'ve been awarded <" + _loc2_[0] + "> Medal!")'));
});

test('source ten-slot capacity drops overflow, frees slots at139 and removes clips at150', () => {
  const notices = new MedalNotices(), ids = Object.keys(MEDALS).map(Number);
  assert.equal(notices.observe(ids.slice(0, 11), false).length, 10);
  assert.deepEqual(notices.active.map(n => n.slot), Array.from({ length: 10 }, (_, i) => i));
  notices.advance(137 * 1000 / 30);
  assert.equal(notices.active[0].frame, 138);
  assert.deepEqual(notices.observe([ids[11]], false), []);
  notices.advance(1000 / 30);
  const replacement = notices.observe([ids[12]], false)[0];
  assert.equal(replacement.slot, 0); assert.equal(notices.active.length, 11);
  notices.advance(11 * 1000 / 30);
  assert.deepEqual(notices.active, [replacement]);
  assert.deepEqual(notices.observe(ids.slice(0, 12), false), []);
});

test('Continue and imports suppress saved/shared medals while New Game can announce Newcomer', () => {
  const notices = new MedalNotices();
  notices.reset([40, 70]);
  assert.deepEqual(notices.observe([40, 70], false), []);
  assert.deepEqual(notices.observe([40, 70, 41], false).map(n => n.id), [41]);
  notices.reset([40, 70, 41]);
  assert.equal(notices.active.length, 0);
  assert.deepEqual(notices.observe([40, 70, 41], true), []);
  notices.reset([]);
  assert.deepEqual(notices.observe([40], true).map(n => n.id), [40]);
});

test('notice layout retains source text geometry, artwork and animation lifetime', () => {
  const layout = JSON.parse(readFileSync(new URL('../public/assets/town-layout.json', import.meta.url), 'utf8')).infoPopup;
  const manifest = JSON.parse(readFileSync(new URL('../public/assets/manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.clips.infoPopup.characterId, 2290);
  assert.equal(layout.characterId, 2291); assert.equal(layout.frames.length, 150);
  assert.deepEqual(layout.frames[0], { y: -28, alpha: 51 / 256 });
  assert.deepEqual(layout.frames[138], { y: -2, alpha: 205 / 256 });
  assert.equal(layout.frames[149], null);
  assert.equal(layout.children.infoText.text.fontId, 1608);
  assert.equal(layout.children.infoText.text.fontSize, 15);
});

test('the first empty magazine explains Space once across reloads and Continue', () => {
  const sim = new Simulation(42);
  sim.weapon!.ammo = 1;
  sim.tick({ firePressed: true });
  const hint = sim.events.find(e => e.type === 'info');
  assert.equal(hint?.message, 'Reload your gun by pressing Space Key!');
  const notices = new MedalNotices();
  assert.equal(notices.add(hint!.message!, true)?.slot, 0);
  assert.equal(notices.observe([70], true)[0].slot, 1);
  const restored = Simulation.fromSave(sim.toSave());
  restored.state.player.shootTimer = 0;
  restored.tick({ reload: true });
  while (restored.weapon!.reloadTime > 0) restored.tick({});
  restored.weapon!.ammo = 1;
  restored.tick({ firePressed: true });
  assert.equal(restored.weapon!.ammo, 0);
  assert.ok(!restored.events.some(e => e.type === 'info' && e.message === hint!.message));
});
