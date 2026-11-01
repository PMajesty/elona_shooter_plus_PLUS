import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ItemFactory, type Item } from '../src/items.ts';
import { Simulation } from '../src/simulation.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-item-trace.json', import.meta.url), 'utf8'));
const snapshots = fixture.records.filter((row: { type: string }) => row.type === 'snapshot');
const itemFromOriginal = (item: Record<string, unknown> | null): Item | null => item === null ? null : Object.fromEntries(Object.entries(item).filter(([, value]) => value !== null)) as unknown as Item;
const finishDay = (simulation: Simulation) => (simulation as unknown as { finishDay(): void }).finishDay();
const factory = () => new ItemFactory(() => 0.5);
function victory(): Simulation {
  const simulation = new Simulation(42);
  finishDay(simulation);
  return simulation;
}
function legacySave(simulation: Simulation): Record<string, any> {
  const value: Record<string, any> = simulation.toSave();
  value.version = 1;
  for (const field of ['inventory', 'lootOffers', 'postbattle', 'inventoryProvenance', 'legacyReconstructionSeed']) delete value[field];
  return value;
}

test('New Game generates original starter items before the opening mission consumes RNG', () => {
  const prototype = Simulation.prototype as unknown as { generateOpeningMission(): void };
  const original = prototype.generateOpeningMission;
  const boundaries: number[] = [];
  prototype.generateOpeningMission = function (this: Simulation) { boundaries.push(this.state.rng); original.call(this); };
  try {
    for (const row of snapshots.filter((row: { scenario: string }) => row.scenario === 'starting')) {
      const simulation = new Simulation(row.seed);
      assert.deepEqual(simulation.state.inventory, row.slots.map(itemFromOriginal));
      assert.equal(boundaries.at(-1), row.rngState);
      assert.equal(simulation.state.version, 2);
      assert.equal(simulation.state.inventoryProvenance, 'original-generation');
      assert.equal(simulation.state.postbattle, 'none');
    }
  } finally { prototype.generateOpeningMission = original; }
});

test('battle completion generates captured original ordinary loot once and synchronizes equipment', () => {
  const row = snapshots.find((row: any) => row.scenario === 'ordinary' && row.seed === 42 && row.inputQueue.length === 4);
  assert.ok(row);
  const simulation = new Simulation(12);
  simulation.state.loot = [...row.inputQueue];
  simulation.state.rng = row.seed;
  simulation.state.player.ammo = 1;
  simulation.state.player.grenades = 2;
  finishDay(simulation);
  assert.equal(simulation.state.phase, 'victory');
  assert.equal(simulation.state.postbattle, 'loot');
  assert.deepEqual(simulation.state.lootOffers, row.offers.map(itemFromOriginal));
  assert.deepEqual(simulation.state.loot, row.queue);
  assert.equal(simulation.state.rng, row.rngState);
  assert.equal(simulation.state.inventory[0]!.ammo, 5);
  assert.equal(simulation.state.inventory[0]!.reloadTime, 0);
  assert.equal(simulation.state.inventory[1]!.ammo, 2);
  const saved = simulation.toSave();
  finishDay(simulation);
  simulation.tick({ firePressed: true, reload: true });
  assert.deepEqual(simulation.toSave(), saved);
});

test('battle item quantities follow shooting, reload cancellation and grenade use', () => {
  const simulation = new Simulation(42);
  simulation.fireAt(500, 200);
  assert.equal(simulation.state.inventory[0]!.ammo, 4);
  for (let frame = 0; frame < 25; frame++) simulation.tick();
  simulation.requestReload();
  assert.equal(simulation.state.inventory[0]!.reloadTime, 7);
  simulation.fireAt(500, 200);
  assert.equal(simulation.state.inventory[0]!.reloadTime, 0);
  simulation.throwGrenade(100, 200);
  assert.equal(simulation.state.inventory[1]!.ammo, 4);
  assert.deepEqual(Simulation.fromSave(simulation.toSave()).state, simulation.state);
});

test('loot moves preserve both items, reject unsupported mod mounting and handle a full inventory', () => {
  const simulation = victory();
  const itemFactory = factory();
  simulation.state.lootOffers = Array.from({ length: 8 }, () => itemFactory.generate(117));
  simulation.state.inventory = Array.from({ length: 6 }, () => itemFactory.generate(3));
  const before = simulation.toSave();
  assert.equal(simulation.collectLoot(0), false);
  assert.deepEqual(simulation.toSave(), before);
  const gun = simulation.state.inventory[2], statue = simulation.state.lootOffers[0];
  assert.equal(simulation.collectLoot(0, 2), true);
  assert.equal(simulation.state.inventory[2], statue);
  assert.equal(simulation.state.lootOffers[0], gun);
  assert.equal(simulation.dropLootItem(2, 1), true);
  assert.equal(simulation.state.lootOffers[1], statue);
  assert.equal(simulation.moveLootItem('offers', 1, 'offers', 2), true);
  assert.equal(simulation.state.lootOffers[2], statue);
  simulation.state.lootOffers[3] = itemFactory.generate(8);
  const beforeRejected = simulation.toSave();
  assert.equal(simulation.collectLoot(3, 0), false);
  assert.equal(simulation.moveLootItem('offers', -1, 'inventory', 0), false);
  assert.equal(simulation.moveLootItem('inventory', 1.5, 'offers', 0), false);
  assert.deepEqual(simulation.toSave(), beforeRejected);
  assert.equal(simulation.state.rng, before.rng);
});

test('loot save resumes exact modified items without rerolls, and Done discards only unclaimed offers', () => {
  const simulation = victory();
  assert.equal(simulation.collectLoot(0, 2), true);
  simulation.state.inventory[0]!.name = 'Preserved custom metadata';
  simulation.state.inventory[0]!.value = 540 + 1 / 3;
  const saved = simulation.toSave();
  const resumed = Simulation.fromSave(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(resumed.state, saved);
  assert.notEqual(resumed.state.inventory[0], saved.inventory[0]);
  assert.equal(resumed.finishLoot(), true);
  assert.equal(resumed.state.postbattle, 'result');
  assert.deepEqual(resumed.state.inventory, saved.inventory);
  assert.deepEqual(resumed.state.lootOffers, Array(8).fill(null));
  assert.equal(resumed.state.rng, saved.rng);
  assert.equal(resumed.finishLoot(), false);
  assert.equal(resumed.dropLootItem(2, 0), false);
  assert.deepEqual(Simulation.fromSave(resumed.toSave()).state, resumed.state);
  assert.equal(new Simulation(3).moveLootItem('inventory', 0, 'inventory', 3), false);
});

test('v1 battle migration is deterministic, preserves combat state and never mutates its input', () => {
  const simulation = new Simulation(42);
  for (let frame = 0; frame < 150; frame++) simulation.tick();
  simulation.fireAt(450, 240);
  simulation.throwGrenade(100, 230);
  const oldSave = legacySave(simulation);
  const untouched = structuredClone(oldSave);
  const first = Simulation.fromSave(oldSave), second = Simulation.fromSave(oldSave);
  assert.deepEqual(oldSave, untouched);
  assert.deepEqual(first.state, second.state);
  for (const [field, expected] of Object.entries(oldSave)) if (field !== 'version') assert.deepEqual(first.state[field as keyof typeof first.state], expected, field);
  assert.equal(first.state.inventoryProvenance, 'legacy-v1-reconstructed');
  assert.equal(first.state.legacyReconstructionSeed, oldSave.rng);
  assert.equal(first.state.inventory[0]!.ammo, oldSave.player.ammo);
  assert.equal(first.state.inventory[1]!.ammo, oldSave.player.grenades);
  assert.deepEqual(Simulation.fromSave(first.toSave()).state, first.state);
  for (let frame = 0; frame < 200; frame++) {
    const input = { aimX: 450, aimY: 230, firePressed: frame % 32 === 0 };
    first.tick(input); second.tick(input);
  }
  assert.deepEqual(first.state, second.state);
});

test('v1 victory reconstructs only its recorded loot queue once, preserving the saved battle RNG', () => {
  const oldSave = legacySave(victory());
  oldSave.loot = [];
  const empty = Simulation.fromSave(oldSave);
  assert.equal(empty.state.postbattle, 'loot');
  assert.deepEqual(empty.state.lootOffers, Array(8).fill(null));
  assert.equal(empty.state.rng, oldSave.rng);
  oldSave.loot = [1117];
  const originalInput = structuredClone(oldSave);
  const migrated = Simulation.fromSave(oldSave);
  assert.deepEqual(oldSave, originalInput);
  assert.deepEqual(migrated.state.loot, [117]);
  assert.equal(migrated.state.lootOffers[0]!.id, 117);
  assert.equal(migrated.state.lootOffers.filter(Boolean).length, 1);
  assert.equal(migrated.state.rng, oldSave.rng);
  assert.deepEqual(Simulation.fromSave(migrated.toSave()).state, migrated.state);
});

test('v2 save rejects invalid item fields and inconsistent loot stages without editing the input', () => {
  const saved = new Simulation(42).toSave();
  const changes = [
    { inventory: [] }, { inventory: Array(6) }, { lootOffers: Array(7).fill(null) }, { lootOffers: Array(8) }, { postbattle: 'loot' },
    { lootOffers: [saved.inventory[0], ...Array(7).fill(null)] },
    { inventoryProvenance: 'unknown' }, { legacyReconstructionSeed: 42 },
    { inventoryProvenance: 'legacy-v1-reconstructed', legacyReconstructionSeed: 0 },
    { loot: [1001.5] }, { loot: [999] },
    ...[{ id: 999 }, { type: 3 }, { graphic: 999 }, { ammo: -1 }, { ammo: 2 }, { value: Infinity }, { automatic: 'true' }, { attack: undefined }, { name: '' }].map(change => ({ inventory: [{ ...saved.inventory[0], ...change }, ...saved.inventory.slice(1)] })),
  ];
  for (const change of changes) {
    const candidate = { ...saved, ...change };
    const untouched = structuredClone(candidate);
    assert.throws(() => Simulation.fromSave(candidate));
    assert.deepEqual(candidate, untouched);
  }
  const won = victory().toSave();
  assert.throws(() => Simulation.fromSave({ ...won, postbattle: 'none' }));
  assert.throws(() => Simulation.fromSave({ ...won, postbattle: 'result' }));
});

test('save validation accepts original generated item metadata including non-gun inherited fields', () => {
  const saved = victory().toSave();
  for (const row of snapshots) {
    const items = row.item ? [row.item] : row.offers ?? row.slots;
    saved.lootOffers = [...items.map(itemFromOriginal), ...Array(8).fill(null)].slice(0, 8);
    assert.deepEqual(Simulation.fromSave(saved).state.lootOffers, saved.lootOffers);
  }
});
