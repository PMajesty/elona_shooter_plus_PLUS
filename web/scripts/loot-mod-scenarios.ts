import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Simulation, type Input, type SimulationOptions } from '../src/simulation.ts';
import { ordinaryEnemyHit, type CollisionGeometry } from '../src/collision.ts';
import { ENEMIES } from '../src/content.ts';
import { ITEM_TYPE, isOccupiedItem } from '../src/items.ts';
import type { LootItemAddress } from '../src/equipment.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = resolve(root, '.build/loot-mod-scenarios'), fixtures = resolve(root, '.build/browser-qa');
mkdirSync(output, { recursive: true }); mkdirSync(fixtures, { recursive: true });
const hash = (text: string | Buffer) => createHash('sha256').update(text).digest('hex');
const geometryPath = resolve(root, 'web/public/assets/collision-geometry.json');
const geometry = JSON.parse(readFileSync(geometryPath, 'utf8')) as CollisionGeometry;
const options: SimulationOptions = { hitTest: (enemy, x, y) => {
  if (enemy.kind !== 'boss') return ordinaryEnemyHit(enemy, x, y, geometry);
  // Та же явно отмеченная геометрическая замена, что в headless campaign soak.
  const [l, r, t, b] = ENEMIES.boss.body;
  return x - enemy.x > l && x - enemy.x < r && y - enemy.y > t && y - enemy.y < b;
} };
type Save = ReturnType<Simulation['toSave']>;
type Operation = { action: string; args: unknown[] };
const seed = 1013904226;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const sourceHashes = Object.fromEntries(['simulation.ts', 'items.ts', 'equipment.ts', 'collision.ts', 'party-ai.ts']
  .map(name => [name, hash(readFileSync(resolve(root, 'web/src', name)))]));
const snapshots: object[] = [], outcomes: object[] = [];
let frames = 0, checkpoints = 0;

function finite(value: unknown): void {
  if (typeof value === 'number') assert.ok(Number.isFinite(value));
  else if (Array.isArray(value)) value.forEach(finite);
  else if (value && typeof value === 'object') Object.values(value).forEach(finite);
}

function pair(id: string, initial?: Save) {
  const sim = initial ? Simulation.fromSave(initial, options) : new Simulation(seed, options);
  let restored = Simulation.fromSave(clone(sim.toSave()), options);
  const operations: Operation[] = [];
  const initialState = sim.toSave();
  const checkpoint = () => {
    restored = Simulation.fromSave(clone(sim.toSave()), options);
    assert.deepEqual(restored.toSave(), sim.toSave()); checkpoints++;
  };
  const act = (action: keyof Simulation, args: unknown[] = []) => {
    const beforeA = sim.events, countA = beforeA.length, beforeB = restored.events, countB = beforeB.length;
    const invoke = (target: Simulation) => (target[action] as (...values: unknown[]) => unknown).apply(target, args);
    const result = invoke(sim); assert.deepEqual(invoke(restored), result);
    assert.deepEqual(restored.state, sim.state, `${id}: ${action} save/replay mismatch`);
    assert.deepEqual(restored.events === beforeB ? restored.events.slice(countB) : restored.events,
      sim.events === beforeA ? sim.events.slice(countA) : sim.events);
    finite(sim.state); operations.push({ action, args }); return result;
  };
  const snapshot = (label: string) => {
    const state = sim.toSave(), file = `loot-mod-${id}-${label}-v${state.version}.json`;
    const text = JSON.stringify({ format: 'elona-shooter-browser', version: state.version, appearance: 0, simulation: state }, null, 2) + '\n';
    writeFileSync(resolve(fixtures, file), text);
    snapshots.push({ scenario: id, label, file, sha256: hash(text), operation: operations.length, day: state.day, tick: state.tick });
  };
  const combat = (limit = 6000) => {
    for (let i = 0; i < limit && sim.state.phase === 'battle'; i++) {
      const state = sim.state, weapon = sim.weapon;
      const target = state.enemies.filter(e => e.hp > 0 && e.x > 20).sort((a, b) => b.x - a.x)[0];
      const grenade = state.inventory[1];
      const input: Input = { aimX: target?.x ?? 450, aimY: target?.y ?? 240,
        firePressed: Boolean(target && weapon && weapon.reloadTime === 0 && weapon.ammo > 0), fireReleased: false,
        reload: Boolean(weapon && (weapon.ammo === 0 || !target && weapon.ammo < 3)),
        slot: target?.kind === 'boss' && isOccupiedItem(grenade) && grenade.id === 11 && grenade.ammo > 0 && state.itemCooldowns[1] === 0 ? 1 : undefined };
      act('tick', [input]); frames++;
      if (i % 137 === 136) checkpoint();
    }
  };
  const town = () => {
    for (let i = 0; sim.state.postbattle !== 'result'; i++) {
      assert.ok(i < 30);
      if (sim.state.postbattle === 'skill') act('chooseSkill', [sim.state.skillChoices[(seed + sim.state.day + i) % sim.state.skillChoices.length]]);
      else {
        const offer = sim.state.lootOffers.findIndex(isOccupiedItem), slot = sim.state.inventory.findIndex(x => !isOccupiedItem(x));
        if (offer >= 0 && slot >= 0) act('collectLoot', [offer, slot]); else act('finishLoot');
      }
    }
    assert.equal(act('enterTown'), true); checkpoint(); snapshot('town');
  };
  const finish = () => writeFileSync(resolve(output, `${id}-replay.json`), JSON.stringify({ seed, initial: initialState, operations }, null, 2) + '\n');
  return { sim, act, checkpoint, snapshot, combat, town, finish };
}

// Первый MOD действительно выпадает за босса; в сценариях нет подмены предметов, HP или RNG.
const earned = pair('earned'); earned.combat();
assert.equal(earned.sim.state.phase, 'victory');
assert.equal(earned.act('collectLoot', [0, 2]), true); assert.equal(earned.act('finishLoot'), true);
assert.equal(earned.sim.state.postbattle, 'boss-loot');
assert.equal(earned.sim.state.lootOffers[0]?.type, ITEM_TYPE.mod);
earned.snapshot('boss'); earned.checkpoint();
const boss = earned.sim.toSave();
assert.equal(earned.act('collectLoot', [0, 3]), true); earned.town();
assert.equal(earned.act('buyCastleUpgrade', ['storage']), 'purchased');
assert.equal(earned.act('startNextDay'), true); earned.combat();
assert.equal(earned.sim.state.phase, 'victory'); assert.equal(earned.sim.state.postbattle, 'loot');
earned.snapshot('ordinary'); const ordinary = earned.sim.toSave(); earned.finish();

function exercise(id: string, origin: Save, mod: LootItemAddress, gun: LootItemAddress, confirm: boolean, setup: Operation[] = []) {
  const run = pair(id, origin);
  for (const op of setup) assert.equal(run.act(op.action as keyof Simulation, op.args), true);
  run.snapshot('before'); const before = run.sim.toSave();
  assert.equal(run.act('moveLootItem', [mod.area, mod.index, gun.area, gun.index]), true);
  run.snapshot('pending'); run.checkpoint();
  const pending = run.sim.toSave(); assert.ok(pending.pendingLootAction);
  assert.equal(run.act('finishLoot'), false);
  assert.equal(run.act('moveLootItem', ['inventory', 0, 'offers', 6]), false);
  assert.deepEqual(run.sim.toSave(), pending, 'Pending dialog allowed unrelated mutation');
  assert.equal(run.act('resolveLootModMount', [confirm]), confirm ? 'mounted' : 'swapped');
  assert.equal(run.sim.state.rng, before.rng); assert.equal(run.sim.state.gold, before.gold);
  const gunLocation = confirm ? gun : mod;
  const item = (gunLocation.area === 'offers' ? run.sim.state.lootOffers : run.sim.state.inventory)[gunLocation.index]!;
  assert.equal(item.type, ITEM_TYPE.gun); assert.equal(item.autoReload > 0, confirm);
  run.checkpoint(); run.snapshot('resolved');
  if (gunLocation.area !== 'inventory' || gunLocation.index !== 0) assert.equal(run.act('moveLootItem', [gunLocation.area, gunLocation.index, 'inventory', 0]), true);
  run.town(); assert.equal(run.act('startNextDay'), true); run.checkpoint(); run.snapshot('rest');
  run.combat(300); run.checkpoint(); run.snapshot('combat'); run.finish();
  outcomes.push({ id, originDay: origin.day, originStage: origin.postbattle, confirm, mod, gun, finalDay: run.sim.state.day,
    tick: run.sim.state.tick, hp: run.sim.state.castleHp, autoReload: run.sim.state.inventory[0]?.autoReload });
}

exercise('boss-mount', boss, { area: 'offers', index: 0 }, { area: 'inventory', index: 0 }, true);
exercise('boss-cancel', boss, { area: 'offers', index: 0 }, { area: 'offers', index: 7 }, false,
  [{ action: 'moveLootItem', args: ['inventory', 0, 'offers', 7] }]);
exercise('ordinary-mount', ordinary, { area: 'inventory', index: 3 }, { area: 'inventory', index: 6 }, true,
  [{ action: 'moveLootItem', args: ['inventory', 0, 'inventory', 6] }]);
exercise('ordinary-cancel', ordinary, { area: 'inventory', index: 3 }, { area: 'offers', index: 7 }, false,
  [{ action: 'moveLootItem', args: ['inventory', 0, 'offers', 7] }]);

const report = { status: 'passed', seed, sourceHashes, geometrySha256: hash(readFileSync(geometryPath)), frames, checkpoints,
  provenance: 'Fresh natural seed; actual combat earns first boss MOD, ordinary loot, towns and one paid Storage purchase. Branches use only normal item moves. No item/gold/HP/RNG grants. Ordinary contours with documented boss rectangle fallback.',
  limits: 'Port state/event and persistence integration. Independent original method comparison and native browser input/rendering are separate.', outcomes, snapshots };
writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, snapshots: snapshots.length }, null, 2));
