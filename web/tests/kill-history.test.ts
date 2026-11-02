import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';
import { lifetimeKills } from '../src/kill-history.ts';
import { pauseStatistics } from '../src/game-options.ts';

function kill(sim: Simulation, actor = 0): void {
  sim['spawnEnemy']('sheep');
  const enemy = sim.state.enemies.at(-1)!;
  sim['damageEnemy'](enemy, 999999, false, null, enemy.x, enemy.y, actor);
  sim['damageEnemy'](enemy, 999999, false, null, enemy.x, enemy.y, actor);
}
function town(sim: Simulation): void {
  sim.state.noDamage = false; sim['finishDay']();
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
  assert.ok(sim.enterTown());
}
function restored(sim: Simulation): Simulation { return Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave()))); }

test('hero and companion kills accumulate across Rest and JSON replay without double-counting corpses', () => {
  const sim = new Simulation(42, { heroClass: 'hunter' });
  kill(sim); kill(sim, 1);
  assert.deepEqual(lifetimeKills(sim.state), { count: 2, complete: true });
  sim['spawnEnemy']('sister-bomb');
  const bomb = sim.state.enemies.at(-1)!;
  sim['damageEnemy'](bomb, 1, false, null, bomb.x, bomb.y);
  assert.equal(sim.state.economy.sistersExploded, 1);
  assert.equal(lifetimeKills(sim.state).count, 2);
  town(sim); const copy = restored(sim);
  for (const run of [sim, copy]) {
    assert.ok(run.startNextDay()); assert.equal(run.state.kills, 0);
    assert.deepEqual(run.state.killHistory, { completed: 2 });
    kill(run, 1); assert.equal(lifetimeKills(run.state).count, 3);
    town(run); assert.ok(run.startNextDay());
    assert.equal(run.state.kills, 0); assert.equal(lifetimeKills(run.state).count, 3);
    assert.ok(pauseStatistics(run.state).includes('Total of 3 enemies killed.'));
  }
  assert.deepEqual(restored(sim).toSave(), copy.toSave());
});

test('Carry Over restores the town kill history and retries do not retain discarded battle kills', () => {
  const sim = new Simulation(42); kill(sim); town(sim);
  let checkpoint = sim.toSave();
  for (let attempt = 0; attempt < 2; attempt++) {
    assert.ok(sim.startNextDay()); kill(sim); kill(sim);
    assert.equal(lifetimeKills(sim.state).count, 3);
    sim.state.castleHp = 0;
    for (let i = 0; i < 3 && sim.state.phase === 'battle'; i++) sim.tick();
    assert.ok(sim.carryOver(checkpoint));
    assert.deepEqual(lifetimeKills(sim.state), { count: 1, complete: true });
    checkpoint = sim.toSave();
  }
  assert.deepEqual(restored(sim).toSave(), sim.toSave());
});

test('older saves retain their exact envelope and expose missing earlier kills as a lower bound', () => {
  const sim = new Simulation(42); kill(sim);
  const oldDay1 = sim.toSave(); assert.equal('killHistory' in oldDay1, false);
  assert.deepEqual(restored(sim).toSave(), oldDay1);
  town(sim); assert.ok(sim.startNextDay()); kill(sim);
  delete sim.state.killHistory;
  const oldDay2 = sim.toSave(), copy = restored(sim);
  assert.deepEqual(copy.toSave(), oldDay2);
  assert.deepEqual(lifetimeKills(copy.state), { count: 1, complete: false });
  assert.ok(pauseStatistics(copy.state).includes('Total of at least 1 enemies killed.'));
  town(copy); assert.ok(copy.startNextDay());
  assert.deepEqual(copy.state.killHistory, { completed: 1, incomplete: true });
  assert.deepEqual(lifetimeKills(restored(copy).state), { count: 1, complete: false });
});

test('kill history cannot influence combat RNG and malformed counts or provenance are rejected', () => {
  const sim = new Simulation(42); town(sim); sim.startNextDay();
  const copy = restored(sim); copy.state.killHistory = { completed: 900, incomplete: true };
  for (let i = 0; i < 90; i++) { sim.tick(); copy.tick(); }
  const left = sim.toSave(), right = copy.toSave();
  delete left.killHistory; delete right.killHistory;
  assert.deepEqual(left, right);
  for (const history of [null, -1, {}, { completed: -1 }, { completed: 0.5 }, { completed: Infinity },
    { completed: Number.MAX_SAFE_INTEGER + 1 }, { completed: 1, incomplete: false }]) {
    assert.throws(() => Simulation.fromSave({ ...sim.toSave(), killHistory: history }), /kill history/);
  }
  const withKill = { ...sim.toSave(), kills: 1, killHistory: { completed: Number.MAX_SAFE_INTEGER } };
  assert.throws(() => Simulation.fromSave(withKill), /kill history/);
});
