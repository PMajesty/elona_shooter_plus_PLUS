import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation } from '../src/simulation.ts';
import { ItemFactory, type Item } from '../src/items.ts';
import { upgradeCost } from '../src/equipment.ts';

type OriginalItem = Record<string, string | number | boolean | null>;
interface Config {
  name: string; seed: number; id: number; policy: 'original' | 'retain-final-mod';
  mods?: [number, number][]; retainFinal?: boolean; cancelReopen?: boolean; stock?: boolean;
}
interface Draw { index: number; state: number; value: number }
interface OriginalDialog { action: number; question: string; previewVisible: boolean }
export interface ModificationRecord {
  type: string; kind: string; version: number; rng?: string; clock?: string; frame71?: boolean; intervention?: string;
  scenario?: string; config?: Config; seed?: number; step?: number; op?: string;
  context?: { engineer: number; recycleMedal: boolean };
  inventory?: OriginalItem[]; shop?: OriginalItem[]; reference?: OriginalItem;
  gold?: number; totalMoney?: number; ap?: number; equipMode?: number; drag?: boolean;
  dialog?: OriginalDialog | null; slots?: { id: number; op: number; alpha: number; item: number }[];
  messages?: string[]; cost?: number; draws?: Draw[]; drawCount?: number; rngState?: number;
  ok?: boolean; snapshots?: number; upgradeCases?: number; mountCases?: number;
}
interface Boundary { finishDay(): void; random(): number; equipmentFactory(): ItemFactory }
const ITEM_FIELDS: (keyof Item)[] = ['num', 'id', 'graphic', 'type', 'reloadTime', 'reloadTimeMax', 'ammo', 'ammoMax', 'value', 'mod', 'modMax', 'shell', 'manualReload', 'automatic', 'modText', 'lv', 'typeMinor', 'special', 'leech', 'impact', 'shootRate', 'rare', 'autoReload', 'livingWeapon', 'name', 'baseAccuracy', 'accuracyDec', 'attack', 'dmgAir', 'dmgArmor', 'reqTrait', 'reqLv', 'range'];

function itemInput(item: OriginalItem): Item | null {
  if (item.id === null) return null;
  return Object.fromEntries(Object.entries(item).filter(([, value]) => value !== null)) as unknown as Item;
}
function itemOutput(item: Item | null): OriginalItem {
  return Object.fromEntries(ITEM_FIELDS.map(field => [field, item?.[field] ?? (field === 'num' || field === 'value' ? 0 : null)]));
}
function originalOutcome(row: ModificationRecord): string | undefined {
  if (row.op === 'enterUpgrade' && row.equipMode === 0) return 'not-enough-ap';
  if (row.op === 'previewOriginal' || row.op === 'drop' && row.dialog) return 'previewed';
  if (row.op === 'drop' && row.config!.stock) return 'occupied';
  if (row.op === 'cancel') return row.scenario!.startsWith('upgrade') ? 'cancelled' : 'swapped';
  if (row.op !== 'confirm') return undefined;
  if (row.messages!.includes("You don't have enough money!")) return 'not-enough-gold';
  if (row.messages!.includes("There's no available mod slot on this weapon!")) return 'no-mod-slot';
  if (row.messages!.includes("This weapon can't use ammo/reloading mods.")) return 'incompatible-ammo-mod';
  if (row.messages!.includes("This weapon can't use Auto Reload mod.")) return 'incompatible-auto-reload';
  if (row.messages!.includes('This weapon is already alive.')) return 'already-living';
  return row.scenario!.startsWith('upgrade') ? 'upgraded' : 'mounted';
}

export function compareModificationTrace(records: ModificationRecord[]) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'modifications'); assert.equal(ready.version, 1);
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-shop-input-and-dialogs');
  assert.equal(ready.frame71, false); assert.equal(ready.intervention, 'separate-original-enchant-retains-omitted-final-mod');
  assert.equal(complete?.type, 'complete'); assert.equal(complete?.ok, true);
  assert.equal(complete.upgradeCases, 12); assert.equal(complete.mountCases, 13);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.equal(snapshots.length, complete.snapshots); assert.equal(snapshots.length, 104);
  const groups = new Map<string, ModificationRecord[]>();
  for (const row of snapshots) {
    assert.ok(row.scenario && row.config && row.inventory && row.shop && row.reference && row.context && row.draws && row.messages);
    const group = groups.get(row.scenario) ?? []; group.push(row); groups.set(row.scenario, group);
  }
  assert.equal(groups.size, 25);
  const rawOriginalBugCases: { scenario: string; beforeModCount: number; previewModCount: number; finalModText: string }[] = [];
  const comparisons: { scenario: string; step: number; op: string; policy: string; referenceCompared: boolean; matched: boolean; originalDrawCount: number; portDrawCount: number; differences: { field: string; expected: unknown; actual: unknown }[] }[] = [];
  for (const [scenario, rows] of groups) {
    const first = rows[0], config = first.config!;
    assert.equal(first.op, 'before'); assert.equal(first.step, 0);
    if (config.policy === 'original' && scenario.startsWith('upgrade') && config.mods!.length > 0) {
      const preview = rows.find(row => row.op === 'previewOriginal')!;
      const final = rows.at(-1)!;
      assert.equal(preview.reference!.mod, Number(first.inventory![0].mod) - 1);
      assert.deepEqual(final.inventory![0], preview.reference);
      assert.deepEqual(final.reference, first.inventory![0]);
      assert.equal(final.drawCount, preview.drawCount);
      assert.equal(final.gold, first.gold! - first.cost!); assert.equal(final.ap, first.ap! - 4);
      rawOriginalBugCases.push({ scenario, beforeModCount: Number(first.inventory![0].mod), previewModCount: Number(preview.reference!.mod), finalModText: String(preview.reference!.modText) });
      continue;
    }
    const simulation = new Simulation(42), boundary = simulation as unknown as Boundary;
    // Подготовка обычного готового города находится до измеряемой границы; исходные предметы служат входом.
    boundary.finishDay();
    while (simulation.state.postbattle !== 'result') {
      if (simulation.state.postbattle === 'skill') simulation.chooseSkill(simulation.state.skillChoices[0]);
      else simulation.finishLoot();
    }
    assert.equal(simulation.enterTown(), true);
    const state = simulation.state, town = state.town;
    assert.ok(town?.preparation === 'ready');
    state.inventory = first.inventory!.map(itemInput); town.shop = first.shop!.map(itemInput);
    state.upgradeReference = itemInput(first.reference!); state.pendingTownAction = null;
    town.ap = first.ap!; state.gold = first.gold!; state.totalMoney = first.totalMoney!; state.rng = first.seed!;
    const draws: Draw[] = [];
    const random = boundary.random.bind(simulation);
    boundary.random = () => { const value = random(); draws.push({ index: draws.length + 1, state: state.rng, value }); return value; };
    if (first.context!.engineer !== 0 || first.context!.recycleMedal) {
      // Отдельная проверка исходного бонуса фабрики; получение инженера/медали в обычной игре не заявляется.
      boundary.equipmentFactory = () => new ItemFactory(() => boundary.random(), { day: 1, engineer: first.context!.engineer, recycleMedal: first.context!.recycleMedal });
    }
    for (const row of rows) {
      let outcome: string | undefined;
      if (row.op === 'enterUpgrade' && row.equipMode === 0) outcome = simulation.beginWeaponUpgrade(0);
      if (row.op === 'previewOriginal') outcome = simulation.beginWeaponUpgrade(0);
      if (row.op === 'drop') outcome = config.stock ? simulation.buyStock(0, 0) : simulation.beginModMount(1, 0);
      if (row.op === 'confirm' || row.op === 'cancel') outcome = simulation.resolveTownEquipment(row.op === 'confirm');
      const differences: { field: string; expected: unknown; actual: unknown }[] = [];
      const check = (field: string, actual: unknown, expected: unknown) => { if (!isDeepStrictEqual(actual, expected)) differences.push({ field, expected, actual }); };
      check('outcome', outcome, originalOutcome(row));
      check('inventory', state.inventory.map(itemOutput), row.inventory); check('shop', town.shop.map(itemOutput), row.shop);
      // Сырой исходный preview оставлен в трассе: исправленный предмет сравнивается с последующим независимым enchant.
      const referenceCompared = !(config.policy === 'retain-final-mod' && row.op === 'previewOriginal');
      if (referenceCompared) check('reference', itemOutput(state.upgradeReference), row.reference);
      check('gold', state.gold, row.gold); check('totalMoney', state.totalMoney, row.totalMoney); check('ap', town.ap, row.ap);
      check('cost', upgradeCost(state.inventory[0]!), row.cost);
      check('draws', draws, row.draws); check('drawCount', draws.length, row.drawCount); check('rngState', state.rng, row.rngState);
      const action = state.pendingTownAction;
      check('dialogAction', action ? action.kind === 'upgrade' ? 8 : 5 : null, row.dialog?.action ?? null);
      if (action?.kind === 'upgrade') check('pendingCost', action.cost, row.cost);
      comparisons.push({ scenario, step: row.step!, op: row.op!, policy: config.policy, referenceCompared, matched: differences.length === 0, originalDrawCount: row.drawCount!, portDrawCount: draws.length, differences });
    }
  }
  assert.equal(rawOriginalBugCases.length, 4);
  return {
    status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const,
    observedSnapshots: snapshots.length, comparedSnapshots: comparisons.length,
    fullyComparedSnapshots: comparisons.filter(row => row.referenceCompared).length,
    matchedSnapshots: comparisons.filter(row => row.matched).length,
    rawOriginalBugCases, interventionCases: 4, comparisons,
  };
}
