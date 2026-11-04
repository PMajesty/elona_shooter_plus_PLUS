import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { ItemFactory } from '../src/items.ts';
import { generateHenchman } from '../src/party.ts';
import { partySkills } from '../src/party-progression.ts';
import { createPartyAIState, refreshPartyAI } from '../src/party-ai.ts';
import type { EnemyKind } from '../src/content.ts';

type Encounter = 'ranged distractions' | 'approaching rush' | 'shield boss + alternatives';
const seeds = [42, 137, 2026, 8675309];

// Открытая постановка столкновений, не прогноз победы кампании: обычные HP, движение, RNG и оружие.
function encounter(seed: number, order: 6 | 7, scenario: Encounter) {
  const sim = new Simulation(seed, { ruleset: 'expanded' });
  const random = () => (sim as any).random();
  Object.assign(sim.state, { day: 12, castleHp: 100, castleMaxHp: 100, newWave: false, spawnTimer: 1000000 });
  generateHenchman(sim.state.party, 12, random);
  const source = sim.state.party.slots[3];
  const slot = sim.state.party.slots[0];
  Object.assign(slot, { exists: true, member: source.member });
  Object.assign(source, { exists: false, member: null, weapon: null });
  // Один одинаковый Hunter уровня12 без бонусных медалей/модов, с обычными базовыми навыками12.
  Object.assign(slot.member!, { devType: 1, level: 12, traits: { 1: 12, 900: 12, 901: 12, 103: 12, 104: 12 },
    ai: order, optBoss: true, optWall: true, aiState: createPartyAIState(1), shootTimer: 0 });
  const weaponId = scenario === 'approaching rush' ? 2 : scenario === 'ranged distractions' ? 13 : 4;
  slot.weapon = new ItemFactory(random, { day: 12 }).generate(weaponId);
  sim.state.partySkills = partySkills([sim.state.player, slot.member!]);
  refreshPartyAI(slot, sim.state.partySkills.effects[116]);
  const spawn = (kind: EnemyKind, x: number, y: number) => {
    (sim as any).spawnEnemy(kind);
    const e = sim.state.enemies.at(-1)!; e.x = x; e.y = y; return e;
  };
  if (scenario === 'ranged distractions') {
    spawn('archer', 285, 210); spawn('archer', 315, 285); spawn('cata', 245, 250);
    for (let i = 0; i < 5; i++) spawn('sheep', 40 + i * 27, 190 + i * 23);
  } else if (scenario === 'approaching rush') {
    for (let i = 0; i < 6; i++) spawn('rat', 180 + i * 29, 190 + i * 20);
    spawn('barbarian', 260, 215); spawn('barbarian', 340, 285);
  } else {
    const boss = spawn('boss', 220, 240);
    Object.assign(boss, { bossAction: 6, bossCount: 130, speed: 0, frame: 221 });
    spawn('archer', 280, 200); spawn('archer', 310, 290);
    for (let i = 0; i < 3; i++) spawn('sheep', 100 + i * 95, 205 + i * 35);
  }
  let shots = 0, reloads = 0, guardedAimShots = 0;
  const initialRng = sim.state.rng;
  for (let frame = 0; frame < 900 && sim.state.phase === 'battle'; frame++) {
    const target = sim.state.enemies.find(e => e.uid === slot.member!.aiState!.targetUid);
    const guarded = target?.kind === 'boss' && target.bossAction === 6;
    sim.tick();
    for (const event of sim.events) {
      if (event.actorSlot === 1 && event.type === 'shot') { shots++; if (guarded) guardedAimShots++; }
      if (event.actorSlot === 1 && event.type === 'reload') reloads++;
    }
  }
  return { scenario, seed, order, castleHp: sim.state.castleHp, kills: sim.state.kills, shots, reloads,
    guardedAimShots, living: sim.state.enemies.filter(e => e.hp > 0).length, frames: sim.state.tick, initialRng };
}

test('seeded actual Simulation evidence: order6 versus Careful Consideration at equal stats', () => {
  for (const scenario of ['ranged distractions', 'approaching rush', 'shield boss + alternatives'] as Encounter[]) {
    const rows = seeds.flatMap(seed => [encounter(seed, 6, scenario), encounter(seed, 7, scenario)]);
    for (let i = 0; i < rows.length; i += 2) assert.equal(rows[i].initialRng, rows[i + 1].initialRng);
    for (const row of rows) {
      assert.ok(Number.isFinite(row.castleHp)); assert.ok(row.shots > 0);
      console.log(JSON.stringify(row));
    }
    for (const order of [6, 7]) {
      const selected = rows.filter(row => row.order === order);
      const mean = (key: 'castleHp' | 'kills' | 'shots' | 'reloads') => selected.reduce((sum, row) => sum + row[key], 0) / selected.length;
      console.log(JSON.stringify({ summary: scenario, order, meanHp: mean('castleHp'), meanKills: mean('kills'),
        meanShots: mean('shots'), meanReloads: mean('reloads') }));
    }
  }
});
