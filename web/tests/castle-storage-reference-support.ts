import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation } from '../src/simulation.ts';
import { castleStorageLevel, castleUpgradeCost, castleUpkeep } from '../src/castle-upgrades.ts';
import { inputSlot, rawSlot } from './town-preparation-reference-support.ts';

type Row = Record<string, any>;
type Boundary = { random(): number; finishDay(): void; prepareOrdinaryLoot(random: () => number): void };
export interface StorageReferenceActions {
  purchase?: (simulation: Simulation) => unknown;
  transaction?: (simulation: Simulation, scenario: string, op: string, original: () => void) => void;
  ammo?: (simulation: Simulation, op: string, original: () => void) => void;
}
const purchases = ['storage-insufficient', 'storage-first', 'storage-row-two', 'storage-final', 'storage-cap', 'storage-sequence'];
const transactions = ['shop-buy', 'loot-collect', 'owned-move', 'mod-confirm', 'mod-cancel', 'upgrade', 'sale', 'token'];
const pick = (row: Row, keys: string[]) => Object.fromEntries(keys.map(key => [key, row[key]]));
const differences = (actual: Row, expected: Row) => Object.entries(actual).filter(([key, value]) => !isDeepStrictEqual(value, expected[key]))
  .map(([field, value]) => ({ field, actual: value, expected: expected[field] }));

function town(): Simulation {
  const simulation = new Simulation(42);
  (simulation as unknown as Boundary).finishDay();
  while (simulation.state.postbattle !== 'result') {
    if (simulation.state.postbattle === 'skill') simulation.chooseSkill(simulation.state.skillChoices[0]);
    else simulation.finishLoot();
  }
  assert.equal(simulation.enterTown(), true);
  return simulation;
}

function install(simulation: Simulation, before: Row): void {
  const state = simulation.state;
  Object.assign(state, { inventory: before.inventory.map(inputSlot), gold: before.gold, totalMoney: before.totalMoney,
    castleHp: before.hp, castleMaxHp: before.maxHp, rng: before.rngState, upgradeReference: inputSlot(before.reference) });
  state.player.selectedSlot = before.selectedSlot;
  state.party.slots[0].weapon = inputSlot(before.ally);
  if (state.town) { state.town.ap = before.ap; state.town.shop = before.shop.map(inputSlot); }
}

function inventoryProjection(simulation: Simulation) {
  const state = simulation.state;
  return { capacity: state.inventory.length, storageLevel: castleStorageLevel(state), inventory: state.inventory.map(rawSlot),
    ally: rawSlot(state.party.slots[0].weapon), selectedSlot: state.player.selectedSlot };
}

export function compareCastleStorageTrace(records: Row[], actions: StorageReferenceActions = {}) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'castle-storage');
  assert.equal(ready.clock, 'synchronous-original-castle-inventory-and-ammo'); assert.equal(ready.rng, 'xorshift32');
  assert.deepEqual(pick(ready, ['ownedStart', 'ownedMax', 'stockSlots', 'battleSlots', 'continuedTownEntry']),
    { ownedStart: 20, ownedMax: 35, stockSlots: 8, battleSlots: 5, continuedTownEntry: true });
  assert.deepEqual(pick(complete!, ['type', 'kind', 'ok', 'snapshots', 'purchaseCases', 'transactionCases', 'ammoCases']),
    { type: 'complete', kind: 'castle-storage', ok: true, snapshots: 37, purchaseCases: 6, transactionCases: 8, ammoCases: 1 });
  const snapshots = records.filter(row => row.type === 'snapshot'); assert.equal(snapshots.length, 37);
  assert.deepEqual([...new Set(snapshots.map(row => row.scenario))], ['backpack-ammo-and-keys', ...purchases, ...transactions]);
  const comparisons: { scenario: string; boundary: string; op: string; matched: boolean; differences: Row[] }[] = [];
  const add = (row: Row, actual: Row, expected: Row = row, extra: Row[] = []) => {
    const mismatch = [...differences(actual, expected), ...extra];
    comparisons.push({ scenario: row.scenario, boundary: row.boundary, op: row.op, matched: mismatch.length === 0, differences: mismatch });
  };

  const ammoRows = snapshots.filter(row => row.boundary === 'ammo');
  assert.deepEqual(ammoRows.map(row => row.op), ['before', 'key6', 'fillAmmo', 'updateAlly']);
  const ammoSimulation = new Simulation(42); install(ammoSimulation, ammoRows[0]);
  const ammoBoundary = ammoSimulation as unknown as Boundary;
  let ammoDraws = 0; const ammoRandom = ammoBoundary.random.bind(ammoSimulation);
  ammoBoundary.random = () => { ammoDraws++; return ammoRandom(); };
  ammoSimulation.state.noDamage = false; ammoSimulation.state.player.exp = 0;
  // Останавливаем более позднюю генерацию наград: сравнивается только исходный fillAmmo.
  ammoBoundary.prepareOrdinaryLoot = () => {};
  for (const row of ammoRows) {
    if (row.op !== 'before') {
      const original = () => {
        if (row.op === 'key6') ammoSimulation.useSlot(5);
        else if (row.op === 'fillAmmo') ammoBoundary.finishDay();
        else {
          const prepared = town();
          ammoSimulation.state.town = prepared.state.town;
          ammoSimulation.state.phase = 'town';
          assert.equal(ammoSimulation.startNextDay(), true);
        }
      };
      (actions.ammo ?? ((_simulation, _op, run) => run()))(ammoSimulation, row.op, original);
    }
    // Неинициализированные num=0 ячейки получают reloadTime=0 в AS3; активных предметов это не меняет.
    const occupiedIndices = ammoRows[0].inventory.flatMap((item: Row, index: number) => item.num ? [index] : []);
    const actual = inventoryProjection(ammoSimulation);
    add(row, { ...actual, inventory: occupiedIndices.map((index: number) => actual.inventory[index]),
      ...(row.op === 'updateAlly' ? {} : { drawCount: ammoDraws, rngState: ammoSimulation.state.rng }) },
      { ...row, inventory: occupiedIndices.map((index: number) => row.inventory[index]) });
  }

  for (const scenario of [...purchases, ...transactions]) {
    const rows = snapshots.filter(row => row.scenario === scenario), before = rows[0], simulation = town(), state = simulation.state;
    assert.equal(before.op, 'before'); assert.equal(before.rngState, 42); assert.equal(before.drawCount, 0);
    install(simulation, before);
    if (scenario === 'loot-collect') { state.phase = 'victory'; state.postbattle = 'loot'; state.lootOffers = before.shop.map(inputSlot); }
    const invariant = structuredClone({ result: state.result, party: state.party, cache: state.partySkills, mission: state.activeMission,
      cards: state.town!.cards, preparedMission: state.town!.mission, recruit: state.town!.recruit, searched: state.town!.searched });
    const methods = simulation as unknown as Boundary;
    let draws = 0; const random = methods.random.bind(simulation); methods.random = () => { draws++; return random(); };
    for (const [index, row] of rows.entries()) {
      if (index > 0) {
        if (row.boundary === 'purchase') (actions.purchase ?? (value => value.buyCastleUpgrade('storage')))(simulation);
        else {
          const original = () => {
            if (scenario === 'shop-buy') assert.equal(simulation.buyStock(0, 15), 'purchased');
            else if (scenario === 'loot-collect') assert.equal(simulation.moveLootItem('offers', 0, 'inventory', 15), true);
            else if (scenario === 'owned-move') assert.equal(simulation.moveTownItem(15, 8), true);
            else if (scenario === 'token') assert.equal(simulation.applyShopToken(15, 0), true);
            else if (scenario === 'sale') { if (row.op === 'confirm') assert.notEqual(simulation.sellTownItem(15), null); }
            else if (row.op === 'preview') assert.equal(scenario === 'upgrade' ? simulation.beginWeaponUpgrade(15) : simulation.beginModMount(14, 15), 'previewed');
            else assert.equal(simulation.resolveTownEquipment(row.op === 'confirm'), scenario === 'upgrade' ? 'upgraded' : row.op === 'cancel' ? 'swapped' : 'mounted');
          };
          (actions.transaction ?? ((_simulation, _scenario, _op, run) => run()))(simulation, scenario, row.op, original);
        }
      }
      const cost = castleUpgradeCost('storage', state);
      const actual = { ...inventoryProjection(simulation), shop: (scenario === 'loot-collect' ? state.lootOffers : state.town!.shop).map(rawSlot),
        reference: rawSlot(state.upgradeReference), gold: state.gold, ap: state.town!.ap, totalMoney: state.totalMoney,
        upkeep: castleUpkeep(state), hp: state.castleHp, maxHp: state.castleMaxHp, drawCount: draws, rngState: state.rng,
        tile: row.boundary === 'purchase' ? { cost, possible: cost > 0 && cost <= state.gold, name: `Storage Lv ${castleStorageLevel(state)}` } : null,
        dialog: state.pendingTownAction?.kind ?? (scenario === 'sale' && row.op === 'preview' ? 'sell' : null) };
      const expected = { ...row, tile: row.tile ? pick(row.tile, ['cost', 'possible', 'name']) : null };
      const invariantAfter = { result: state.result, party: state.party, cache: state.partySkills, mission: state.activeMission,
        cards: state.town!.cards, preparedMission: state.town!.mission, recruit: state.town!.recruit, searched: state.town!.searched };
      add(row, actual, expected, isDeepStrictEqual(invariant, invariantAfter) ? [] : [{ field: 'unrelatedState', actual: invariantAfter, expected: invariant }]);
    }
  }
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const,
    observedSnapshots: 37, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
