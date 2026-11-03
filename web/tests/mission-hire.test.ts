import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Simulation, type ReadyTown } from '../src/simulation.ts';
import { companionWage } from '../src/party-progression.ts';
import { SAVE_VERSION } from '../src/save-version.ts';

function settle(sim: Simulation): void {
  sim['finishDay']();
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) assert.ok(sim.finishLoot());
  while (sim.state.postbattle === 'skill') assert.ok(sim.chooseSkill(sim.state.skillChoices[0]));
  assert.ok(sim.enterTown());
}
function town(): Simulation { const sim = new Simulation(42); settle(sim); sim.state.gold = 100000; sim.state.town!.ap = 14; return sim; }
const restore = (sim: Simulation) => Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
function contract(sim: Simulation): void { assert.equal(sim.requestMissionHire(), 'previewed'); assert.equal(sim.resolvePartyAction(true), 'contracted'); }

test('settlement uses the battle party for Active until town, including a hired fighter and resumed skill choice', () => {
  for (const hiredActive of [null, 0, 2]) {
    const sim = new Simulation(42, { heroClass: 'rogue' }); settle(sim);
    if (hiredActive !== null) contract(sim);
    assert.ok(sim.startNextDay());
    if (hiredActive !== null) {
      sim.state.party.slots[3].member!.traits[123] = hiredActive;
      sim['refreshPartySkills']();
    }
    const battleActive = sim.state.partySkills.effects[123];
    sim.state.player.skillPoints = 1; sim['finishDay']();
    while (['loot', 'boss-loot'].includes(sim.state.postbattle)) assert.ok(sim.finishLoot());
    if (!sim.state.skillChoices.includes(123)) sim.state.skillChoices[0] = 123;
    const run = restore(sim); run['random'] = () => 0.9;
    assert.ok(run.chooseSkill(123));
    assert.equal(run.state.postbattle, 'result');
    assert.equal(run.state.partySkills.effects[123], battleActive);
    assert.equal(run.state.town!.ap, 4 + Math.trunc(0.9 * 0.9 * (battleActive + 1)));
    const result = restore(run); assert.ok(result.enterTown());
    assert.equal(result.state.partySkills.effects[123], 1);
    assert.ok(!result.state.partySkills.guardianSlots.includes(4));
  }
});

test('temporary hire confirms/cancels without upfront AP, gold, RNG or candidate changes and restores its pending question', () => {
  const sim = town(), before = sim.toSave();
  assert.equal(sim.requestMissionHire(), 'previewed');
  let copy = restore(sim); assert.equal(copy.state.pendingPartyAction?.kind, 'henchman');
  assert.equal(copy.refreshTownStock(), 'unavailable'); assert.equal(copy.startNextDay(), false);
  assert.equal(copy.resolvePartyAction(false), 'cancelled'); assert.deepEqual(copy.toSave(), before);
  contract(copy);
  assert.equal(copy.state.gold, before.gold); assert.equal(copy.state.town!.ap, before.town!.ap);
  assert.equal(copy.state.rng, before.rng); assert.deepEqual(copy.state.party, before.party);
  assert.equal((copy.state.town as ReadyTown).mission.hire, true);
  const saved = copy.toSave(); assert.equal(copy.requestMissionHire(), 'unavailable'); assert.deepEqual(copy.toSave(), saved);
  assert.deepEqual(restore(copy).toSave(), saved);
});

test('Rest generates the source Militia henchman in slot4 even with all permanent houses occupied', () => {
  const sim = town(); sim.state.party.capacity = 3;
  for (let n = 0; n < 3; n++) {
    if (n) assert.equal(sim.refreshTownRecruit(), 'refreshed');
    assert.equal(sim.requestRecruit(), 'previewed'); assert.equal(sim.resolvePartyAction(true), 'hired');
  }
  const party = structuredClone(sim.state.party.slots.slice(0, 3)), candidate = structuredClone(sim.state.party.slots[4]);
  contract(sim); assert.ok(sim.startNextDay());
  const hire = sim.state.party.slots[3], member = hire.member!;
  assert.equal(hire.exists, true); assert.equal(member.devType, 4); assert.equal(member.level, 11);
  assert.equal(member.traits[106], 40); assert.equal(hire.weapon!.id, 21);
  assert.equal(member.ai, 6); assert.equal(member.optBoss, false); assert.equal(member.optWall, true);
  assert.ok(member.aiState); assert.equal(sim.state.activeMission.hire, true);
  assert.equal(sim.state.party.capacity, 3);
  assert.deepEqual(sim.state.party.slots[4], candidate);
  assert.deepEqual(sim.state.party.slots.slice(0, 3).map(s => s.member!.name), party.map(s => s.member!.name));
  assert.deepEqual(restore(sim).toSave(), sim.toSave());
});

test('henchman fires automatically through shared AI and projectile state replays after JSON restore', () => {
  const sim = town(); contract(sim); assert.ok(sim.startNextDay());
  sim.state.newWave = false; sim.state.waveIndex = sim.state.waves.length - 1; sim.state.spawnTimer = 900;
  sim['spawnEnemy']('sheep'); Object.assign(sim.state.enemies[0], { x: 350, y: 260, hp: 100000, maxHp: 100000, speed: 0 });
  let fired = false;
  for (let tick = 0; tick < 300 && !fired; tick++) {
    sim.tick(); fired = sim.events.some(event => event.type === 'shot' && event.actorSlot === 4);
  }
  assert.ok(fired, 'temporary fighter must actually shoot');
  assert.ok(sim.state.projectiles.some(projectile => projectile.actorSlot === 4));
  const copy = restore(sim), startHp = sim.state.enemies[0].hp;
  for (let tick = 0; tick < 45; tick++) { sim.tick(); copy.tick(); assert.deepEqual(copy.events, sim.events); }
  assert.deepEqual(copy.toSave(), sim.toSave()); assert.ok(sim.state.enemies[0].hp < startHp);
});

test('temporary contract halves normal/perfect mission reward, includes original wages and leaves at settlement', () => {
  for (const perfect of [false, true]) {
    const sim = town(); contract(sim); assert.ok(sim.startNextDay());
    sim.state.noDamage = perfect;
    const full = sim.state.activeMission.reward, henchman = sim.state.party.slots[3].member!;
    const expectedWage = companionWage(henchman, sim.state.partySkills.effects[127]);
    settle(sim);
    assert.equal(sim.state.result.reward, full / 2);
    assert.equal(sim.state.result.perfectBonus, perfect ? (Math.trunc(full * 1.3) - full) / 2 : 0);
    assert.equal(sim.state.result.wages, expectedWage);
    assert.equal(sim.state.party.slots[3].exists, false);
    assert.equal((sim.state.town as ReadyTown).mission.hire, false);
    assert.deepEqual(restore(sim).toSave(), sim.toSave());
    assert.ok(sim.startNextDay()); assert.equal(sim.state.activeMission.hire, undefined);
    assert.equal(sim.state.party.slots[3].exists, false); assert.deepEqual(restore(sim).toSave(), sim.toSave());
  }
});

test('contract saves reject orphaned or unauthorized henchmen and preserve legacy v28 games', () => {
  const sim = town(); contract(sim); assert.ok(sim.startNextDay());
  for (const mutate of [
    (s: any) => { delete s.activeMission.hire; },
    (s: any) => { s.party.slots[3].exists = false; },
    (s: any) => { s.party.slots[3].member.ai = 0; },
    (s: any) => { s.party.slots[3].member.traits[106] = 1; },
    (s: any) => { s.previousTown.mission.hire = false; },
  ]) { const bad = sim.toSave(); mutate(bad); assert.throws(() => Simulation.fromSave(bad)); }
  const legacy: any = new Simulation(42).toSave(); legacy.version = 28;
  const migrated = Simulation.fromSave(legacy); assert.equal(migrated.state.rng, legacy.rng);
  assert.deepEqual(migrated.toSave(), { ...legacy, version: SAVE_VERSION });
  const battle = new Simulation(42), before = battle.toSave(); assert.equal(battle.requestMissionHire(), 'unavailable'); assert.deepEqual(battle.toSave(), before);
});

test('search AP gains survive the previous-town Rest boundary and generate deterministic browser scenarios', () => {
  const sim = town(); (sim.state.town as ReadyTown).searched = 45;
  assert.equal(sim.performTownActivity('search').outcome, 'done'); assert.equal(sim.state.town!.ap, 16);
  contract(sim); const copy = restore(sim);
  assert.ok(sim.startNextDay()); assert.ok(copy.startNextDay()); assert.deepEqual(copy.toSave(), sim.toSave());
  assert.deepEqual(restore(sim).toSave(), sim.toSave());
  mkdirSync('../.build/browser-qa', { recursive: true });
  const write = (name: string, s: Simulation) => writeFileSync(`../.build/browser-qa/${name}.json`, JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0, simulation: s.toSave() }));
  write('henchman-town', town());
  const battle = town(); contract(battle); battle.startNextDay(); battle.state.newWave = false; battle.state.waveIndex = battle.state.waves.length - 1; battle.state.spawnTimer = 900;
  battle['spawnEnemy']('sheep'); Object.assign(battle.state.enemies[0], { x: 350, y: 260, hp: 100000, maxHp: 100000, speed: 0 });
  write('henchman-battle', battle);
});
