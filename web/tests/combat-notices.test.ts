import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CombatNotices, CRITICAL_STREAK_MESSAGES } from '../src/combat-notices.ts';
import { Simulation } from '../src/simulation.ts';

test('seven hero critical kills emit the six original countdown lines and start saved rampage without repeating the countdown', () => {
  const sim = new Simulation(42); sim.state.spawnTimer = 100000;
  const lines: string[] = [];
  for (let count = 1; count <= 7; count++) {
    sim.events = []; sim['spawnEnemy']('rat'); const enemy = sim.state.enemies.at(-1)!;
    sim['damageEnemy'](enemy, 1000, true, null, enemy.x, enemy.y);
    lines.push(...sim.events.filter(e => e.type === 'combat-notice').map(e => e.message!));
    if (count < 7) assert.equal(sim.state.player.rampageTicks, -count);
    else assert.ok(sim.state.player.rampageTicks >= 300);
    const saved = sim.toSave(); assert.deepEqual(Simulation.fromSave(saved).toSave(), saved);
  }
  assert.deepEqual(lines, [...CRITICAL_STREAK_MESSAGES.slice(1)]);
  assert.equal(sim.events.filter(e => e.type === 'rampage').length, 1);
  sim.events = []; sim['spawnEnemy']('rat'); const enemy = sim.state.enemies.at(-1)!;
  sim['damageEnemy'](enemy, 1000, true, null, enemy.x, enemy.y);
  assert.equal(sim.events.some(e => e.type === 'combat-notice' || e.type === 'rampage'), false);
  sim.state.player.rampageTicks = 1; sim.tick(); assert.equal(sim.state.player.rampageTicks, 0);
});

test('only the original boss wave emits Incoming Boss, while ordinary waves retain their existing state changes', () => {
  for (const boss of [false, true]) {
    const sim = new Simulation(42); sim.state.spawnTimer = 100000; sim.state.newWave = true;
    sim.state.waveIndex = sim.state.bossWave + (boss ? 1 : 2);
    let event;
    for (let frame = 0; frame < 3 && !event; frame++) { sim.tick(); event = sim.events.find(e => e.type === 'wave'); }
    assert.ok(event); assert.equal(event.message, boss ? 'Incoming Boss!!' : undefined);
    assert.equal(sim.state.waveIndex, sim.state.bossWave + (boss ? 0 : 1));
  }
});

test('original textEffect queues at frame62, retries its waiting loop and removes at92 using presentation time', () => {
  const notices = new CombatNotices(), first = notices.add('Rampage!!'), second = notices.add('Incoming Boss!!');
  assert.equal(first.frame, 11); assert.equal(second.frame, 2);
  notices.advance(50 * 1000 / 30); assert.equal(first.frame, 61); assert.equal(second.frame, 4);
  notices.advance(1000 / 30); assert.equal(first.frame, 62); assert.equal(second.frame, 5);
  notices.advance(5 * 1000 / 30); assert.equal(first.frame, 67); assert.equal(second.frame, 11);
  notices.advance(25 * 1000 / 30); assert.equal(notices.active.includes(first), false); assert.equal(second.frame, 36);
  const third = notices.add('Boss Day!'); assert.equal(third.frame, 2);
  notices.advance(0); assert.equal(third.frame, 2);
  notices.reset(); assert.deepEqual(notices.active, []); assert.equal(notices.add('New battle').frame, 11);
});

test('combat feedback uses original textEffect placements/font and separate aura and level-up assets', () => {
  const assets = JSON.parse(readFileSync(new URL('../public/assets/manifest.json', import.meta.url), 'utf8'));
  const layout = JSON.parse(readFileSync(new URL('../public/assets/town-layout.json', import.meta.url), 'utf8')).combatNotices;
  assert.equal(assets.clips.allyRampage.characterId, 2386);
  assert.equal(assets.clips.levelUp.characterId, 1411); assert.equal(assets.clips.levelUp.sourceFrameStart, 20);
  assert.equal(assets.clips.levelUp.count, 31);
  assert.equal(layout.frames.length, 92); assert.equal(layout.field.text.fontId, 682);
  assert.equal(layout.field.text.fontSize, 30); assert.equal(layout.frames[60].x, 200);
  assert.equal(layout.frames[60].y, 18.5); assert.ok(layout.frames[79].alpha < 0.1);
});
