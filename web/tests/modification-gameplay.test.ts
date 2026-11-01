import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation, type SimulationOptions } from '../src/simulation.ts';
import { ItemFactory } from '../src/items.ts';
import { TRAIT } from '../src/progression.ts';

function finishIntoTown(simulation: Simulation): void {
  (simulation as unknown as { finishDay(): void }).finishDay();
  for (let step = 0; simulation.state.postbattle !== 'result' && step < 10; step++) {
    if (simulation.state.postbattle === 'skill') simulation.chooseSkill(simulation.state.skillChoices[0]);
    else simulation.finishLoot();
  }
  assert.equal(simulation.state.postbattle, 'result');
  assert.equal(simulation.enterTown(), true);
}

function configuredPistolTown(options: SimulationOptions = {}): Simulation {
  const simulation = new Simulation(42, options);
  // Контролируемое снаряжение и навык проверяют связь меню с боем, а не обычное получение вещей.
  simulation.state.inventory[0] = new ItemFactory(() => 0.2).generate(1);
  simulation.state.player.traits[103] = 1;
  finishIntoTown(simulation);
  return simulation;
}

function mount(simulation: Simulation, modId: 4 | 12): void {
  const mod = new ItemFactory(() => modId === 4 ? 0 : 0.99).generate(8);
  assert.equal(mod.mod, modId, 'generated original MOD matches this configured fixture');
  simulation.state.inventory[2] = mod;
  assert.equal(simulation.beginModMount(2, 0), 'previewed');
  assert.equal(simulation.resolveTownEquipment(true), 'mounted');
  assert.equal(simulation.state.inventory[2]!.num, 0);
}

function restore(simulation: Simulation, options: SimulationOptions = {}): Simulation {
  const saved = JSON.parse(JSON.stringify(simulation.toSave()));
  const resumed = Simulation.fromSave(saved, options);
  assert.deepEqual(resumed.state, saved);
  return resumed;
}

test('a mounted Damage MOD survives Rest and increases damage from an actual battle shot', () => {
  // Геометрия здесь задана явно: проверяем предмет→Rest→shoot→damage, а не повторяем контурный тест.
  const options = { hitTest: () => true };
  const plain = configuredPistolTown(options);
  let modified = restore(plain, options);
  mount(modified, 4);
  modified = restore(modified, options);
  const damage: number[] = [];
  for (const simulation of [plain, modified]) {
    assert.equal(simulation.startNextDay(), true);
    (simulation as unknown as { spawnEnemy(kind: 'sheep'): void }).spawnEnemy('sheep');
    const target = simulation.state.enemies[0];
    target.x = 300; target.y = 240; target.frame = 5;
    const hp = target.hp, ammo = simulation.weapon!.ammo;
    simulation.tick({ aimX: 450, aimY: 230, firePressed: true });
    assert.equal(simulation.events.filter(event => event.type === 'shot').length, 1);
    const hit = simulation.events.find(event => event.type === 'hit' && event.enemyUid === target.uid);
    assert.ok(hit && hit.amount! > 0);
    assert.equal(hit.critical, false);
    assert.equal(hp - target.hp, hit.amount);
    assert.equal(simulation.weapon!.ammo, ammo - 1);
    damage.push(hit.amount!);
  }
  assert.ok(damage[1] > damage[0], 'mounted damage reaches the enemy through normal battle firing');
});

test('a mounted Auto Fire MOD makes held battle input repeat after Rest while the unmodified pistol fires once', () => {
  const plain = configuredPistolTown();
  let modified = restore(plain);
  mount(modified, 12);
  modified = restore(modified);
  const shots: number[] = [];
  for (const simulation of [plain, modified]) {
    assert.equal(simulation.startNextDay(), true);
    const initialAmmo = simulation.weapon!.ammo;
    let fired = 0;
    for (let frame = 0; frame < 60; frame++) {
      simulation.tick({ aimX: 610, aimY: 330, fireHeld: true });
      fired += simulation.events.filter(event => event.type === 'shot').length;
    }
    assert.equal(simulation.state.phase, 'battle');
    assert.equal(initialAmmo - simulation.weapon!.ammo, fired);
    shots.push(fired);
  }
  assert.equal(shots[0], 1);
  assert.ok(shots[1] > 1, 'the MOD reaches the held-input cadence, not only the item description');
});

test('an upgraded starter shotgun retains its increased requirement and cannot grant itself the missing weapon skill', () => {
  let simulation = new Simulation(42);
  finishIntoTown(simulation);
  simulation.state.gold = 10000;
  const traits = structuredClone(simulation.state.player.traits);
  const requiredBefore = simulation.weapon!.reqLv!;
  assert.equal(simulation.beginWeaponUpgrade(0), 'previewed');
  assert.equal(simulation.resolveTownEquipment(true), 'upgraded');
  simulation = restore(simulation);
  assert.equal(simulation.weapon!.reqLv, requiredBefore + 5);
  assert.deepEqual(simulation.state.player.traits, traits);
  assert.ok(simulation.weapon!.reqLv! > simulation.state.player.traits[TRAIT.SHOTGUN]);
  assert.equal(simulation.startNextDay(), true);
  const ammo = simulation.weapon!.ammo, rng = simulation.state.rng;
  simulation.tick({ aimX: 400, aimY: 230, firePressed: true });
  assert.equal(simulation.events.filter(event => event.type === 'shot').length, 0);
  assert.ok(simulation.events.some(event => event.type === 'beep' && event.message?.includes('required weapon skill')));
  assert.equal(simulation.weapon!.ammo, ammo);
  assert.equal(simulation.state.rng, rng);
  assert.deepEqual(simulation.state.player.traits, traits);
});

test('ordinary battle completion clears a partial reload before town mounting fills ammo and round-trips', () => {
  let simulation = new Simulation(42);
  assert.equal(simulation.fireAt(450, 230), true);
  for (let frame = 0; frame < 25; frame++) simulation.tick();
  assert.equal(simulation.requestReload(), true);
  assert.ok(simulation.weapon!.reloadTime > 0 && simulation.weapon!.ammo < simulation.weapon!.ammoMax);
  finishIntoTown(simulation);
  assert.equal(simulation.weapon!.reloadTime, 0);
  assert.equal(simulation.weapon!.ammo, simulation.weapon!.ammoMax);
  mount(simulation, 4);
  simulation = restore(simulation);
  assert.equal(simulation.weapon!.reloadTime, 0);
  assert.equal(simulation.weapon!.ammo, simulation.weapon!.ammoMax);
});
