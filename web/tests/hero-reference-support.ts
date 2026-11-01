import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { generateSheriffHero, levelUpHero, type HeroProgress } from '../src/hero.ts';
import type { Item } from '../src/items.ts';

type RawItem = Record<string, unknown>;
export interface HeroReferenceRecord {
  version: number; type: string; kind: string; rng?: string; clock?: string;
  classId?: number; appearance?: number; seeds?: number[]; snapshots?: number; ok?: boolean;
  scenario?: string; seed?: number; history?: string; step?: number;
  priorInventory?: RawItem[]; inventory?: RawItem[];
  hero?: Record<string, unknown>; progress?: HeroProgress; input?: HeroProgress;
  inputHero?: Record<string, unknown>; inputRngState?: number; inputDrawCount?: number;
  drawCount?: number; rngState?: number;
}
const ITEM_FIELDS: (keyof Item)[] = ['num', 'id', 'graphic', 'type', 'reloadTime', 'reloadTimeMax', 'ammo', 'ammoMax', 'value', 'mod', 'modMax', 'shell', 'manualReload', 'automatic', 'modText', 'lv', 'typeMinor', 'special', 'leech', 'impact', 'shootRate', 'rare', 'autoReload', 'livingWeapon', 'name', 'baseAccuracy', 'accuracyDec', 'attack', 'dmgAir', 'dmgArmor', 'reqTrait', 'reqLv', 'range'];
function rawSlot(item: Item | null): RawItem {
  return Object.fromEntries(ITEM_FIELDS.map(field => [field, item ? item[field] ?? null : field === 'num' || field === 'value' ? 0 : null]));
}
function inputSlot(raw: RawItem): Item | null {
  if (raw.id === null) { assert.deepEqual(raw, rawSlot(null)); return null; }
  return Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== null)) as unknown as Item;
}
function progressOnly(value: HeroProgress): HeroProgress {
  return { level: value.level, exp: value.exp, skillPoints: value.skillPoints, traits: value.traits };
}

export function compareHeroTrace(records: HeroReferenceRecord[], methods = { generate: generateSheriffHero, levelUp: levelUpHero }) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'hero');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-hero-methods');
  assert.equal(ready.classId, 6); assert.equal(ready.appearance, 6); assert.equal(ready.snapshots, 12);
  assert.deepEqual(ready.seeds, [42, 1, 3735928559]);
  assert.equal(complete?.version, 1); assert.equal(complete.type, 'complete'); assert.equal(complete.kind, 'hero');
  assert.equal(complete.ok, true); assert.equal(complete.snapshots, 12); assert.equal(records.length, 14);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.deepEqual(snapshots.map(record => [record.seed, record.history, record.scenario, record.step ?? 0]), [
    ...[42, 1, 3735928559].flatMap(seed => [[seed, 'fresh', 'generation', 0], [seed, 'fresh', 'growth', 1], [seed, 'fresh', 'growth', 2]]),
    ...[42, 1, 3735928559].map(seed => [seed, 'reused', 'generation', 0]),
  ]);
  let rng = 1, draws = 0;
  let generated: ReturnType<typeof generateSheriffHero>;
  let progress: HeroProgress;
  const random = () => {
    let value = rng | 0;
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    rng = value >>> 0; draws++;
    return rng / 4294967296;
  };
  const comparisons = snapshots.map(record => {
    assert.equal(record.version, 1); assert.equal(record.kind, 'hero'); assert.equal(record.appearance, 6);
    assert.equal(record.inventory?.length, 6);
    const actual: Record<string, unknown> = {};
    if (record.scenario === 'generation') {
      assert.equal(record.priorInventory?.length, 6);
      rng = record.seed! >>> 0; draws = 0;
      generated = methods.generate(random, record.priorInventory!.map(inputSlot));
      progress = progressOnly(generated);
    } else {
      // Продолжаем результат production-helper, не подставляя ожидаемые базовые навыки из эталона.
      progress = { ...progress!, exp: record.step === 1 ? 1250 : 2500 };
      const { provenance: _provenance, ...identity } = generated!.hero;
      Object.assign(actual, { input: progress, inputHero: identity, inputRngState: rng, inputDrawCount: draws });
      progress = progressOnly(methods.levelUp(progress, generated!.hero, random));
    }
    const { provenance: _provenance, ...identity } = generated!.hero;
    Object.assign(actual, { hero: identity, progress: progress!, inventory: generated!.inventory.map(rawSlot), drawCount: draws, rngState: rng });
    const differences: { field: string; expected: unknown; actual: unknown }[] = [];
    for (const [field, value] of Object.entries(actual)) {
      const expected = record[field as keyof HeroReferenceRecord];
      if (!isDeepStrictEqual(value, expected)) differences.push({ field, expected, actual: value });
    }
    return { seed: record.seed, history: record.history, scenario: record.scenario, step: record.step ?? 0, matched: differences.length === 0, originalDrawCount: record.drawCount, portDrawCount: draws, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
