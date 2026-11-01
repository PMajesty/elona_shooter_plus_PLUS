import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { SHERIFF_CHOICE_ORDER, SHERIFF_TRAITS, TRAIT, availableSheriffTraits, calcTrait, createSheriffTraits, describeTrait, rollSheriffChoices, type TraitLevels } from '../src/progression.ts';

interface OriginalTraitDetail {
  id: number; level: number; maxLevel: number; requiredLevel: number;
  current: string[]; next: string[]; currentCalc: number; nextCalc: number;
}

export interface ProgressionReferenceRecord {
  version: number; type: string; kind: string; rng?: string; clock?: string;
  classId?: number; level?: number; focus?: number; seeds?: number[]; capableLevels?: number[];
  seed?: number; capable?: number; inputTraits?: TraitLevels; choiceOrder?: number[];
  eligible?: number[]; choices?: number[]; details?: OriginalTraitDetail[];
  drawCount?: number; rngState?: number; ok?: boolean; snapshots?: number;
}

export function compareProgressionTrace(records: ProgressionReferenceRecord[]) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready?.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'progression');
  assert.equal(ready.rng, 'xorshift32'); assert.equal(ready.clock, 'synchronous-original-trait-methods');
  assert.equal(ready.classId, TRAIT.SHERIFF); assert.equal(ready.level, 2); assert.equal(ready.focus, -1);
  assert.deepEqual(ready.seeds, [42, 1, 3735928559]); assert.deepEqual(ready.capableLevels, [0, 1, 2]);
  assert.equal(complete?.version, 1); assert.equal(complete.type, 'complete'); assert.equal(complete.kind, 'progression');
  assert.equal(complete.ok, true); assert.equal(complete.snapshots, 9); assert.equal(records.length, 11);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.deepEqual(snapshots.map(record => [record.seed, record.capable]), [42, 1, 3735928559].flatMap(seed => [0, 1, 2].map(capable => [seed, capable])));
  const comparisons = snapshots.map(record => {
    assert.equal(record.version, 1); assert.equal(record.kind, 'progression');
    assert.equal(record.level, 2); assert.equal(record.focus, -1);
    const traits = { ...createSheriffTraits(1, 1), [TRAIT.SHERIFF]: 2, [TRAIT.CAPABLE]: record.capable! };
    assert.deepEqual(record.inputTraits, traits);
    assert.equal(record.details?.length, 15);
    let rng = record.seed! >>> 0;
    let draws = 0;
    const random = () => {
      let value = rng | 0;
      value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
      rng = value >>> 0; draws++;
      return rng / 4294967296;
    };
    const eligible = availableSheriffTraits(2, traits);
    const choices = rollSheriffChoices(2, traits, random, -1);
    const actual = {
      choiceOrder: [...SHERIFF_CHOICE_ORDER], eligible, choices,
      details: SHERIFF_CHOICE_ORDER.map(id => {
        const detail = describeTrait(id, traits), level = traits[id] ?? 0;
        return {
          id, level, maxLevel: detail.maxLevel, requiredLevel: SHERIFF_TRAITS[id].requiredLevel,
          name: detail.name, description: detail.description,
          currentEffect: detail.currentEffect, nextEffect: detail.nextEffect, canImprove: detail.canImprove,
          currentCalc: calcTrait(id, level), nextCalc: calcTrait(id, level + 1),
        };
      }),
      drawCount: draws, rngState: rng,
    };
    // Проекция только наблюдаемых полей, которые реально использует новый экран навыков.
    const expected = {
      choiceOrder: record.choiceOrder, eligible: record.eligible, choices: record.choices,
      details: record.details!.map(detail => ({
        id: detail.id, level: detail.level, maxLevel: detail.maxLevel, requiredLevel: detail.requiredLevel,
        name: detail.next[0], description: detail.next[1],
        currentEffect: detail.current[2], nextEffect: detail.next[2], canImprove: detail.level + 1 <= detail.maxLevel,
        currentCalc: detail.currentCalc, nextCalc: detail.nextCalc,
      })),
      drawCount: record.drawCount, rngState: record.rngState,
    };
    const differences: { field: string; expected: unknown; actual: unknown }[] = [];
    for (const field of Object.keys(actual) as (keyof typeof actual)[]) {
      if (!isDeepStrictEqual(actual[field], expected[field])) differences.push({ field, expected: expected[field], actual: actual[field] });
    }
    return { seed: record.seed!, capable: record.capable!, matched: differences.length === 0, originalDrawCount: record.drawCount!, portDrawCount: draws, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
