import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { availableCompanionTraits, companionWage, gainCompanionTrait, levelUpCompanion, partySkills, type CompanionProgress } from '../src/party-progression.ts';

interface ReferenceMember extends CompanionProgress { appearance: number }
interface Reference {
  version: number; type: string; kind: string; ok?: boolean; snapshots?: number;
  seed: number; dev: number; scenario: string; hero: ReferenceMember; before: ReferenceMember;
  available: number[]; party: ReturnType<typeof partySkills>; afterTrait: ReferenceMember;
  traitDraws: number; traitState: number; afterLevel: ReferenceMember; wage: number; drawCount: number; rngState: number;
}

export function comparePartyProgressionTrace(records: Reference[], gainTrait = gainCompanionTrait) {
  assert.equal(records[0]?.type, 'ready'); assert.equal(records[0]?.kind, 'party-progression');
  assert.equal(records.at(-1)?.type, 'complete'); assert.equal(records.at(-1)?.ok, true);
  assert.equal(records.at(-1)?.snapshots, 45); assert.equal(records.length, 47);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.deepEqual(snapshots.map(row => [row.dev, row.seed, row.scenario]), Array.from({ length: 9 }, (_, i) => [
    ...[42, 1, 3735928559].map(seed => [i + 1, seed, 'normal']), [i + 1, 42, 'focus'], [i + 1, 42, 'party'],
  ]).flat());
  const comparisons = snapshots.map(row => {
    let rngState = row.seed >>> 0, drawCount = 0;
    const random = () => { let value = rngState | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5; rngState = value >>> 0; drawCount++; return rngState / 4294967296; };
    const member = structuredClone(row.before);
    const party = partySkills([row.hero, member]);
    const available = availableCompanionTraits(member);
    gainTrait(member, party, random);
    const afterTrait = structuredClone(member), traitDraws = drawCount, traitState = rngState;
    member.exp = 1123;
    levelUpCompanion(member, random);
    const actual = { available, party, afterTrait, traitDraws, traitState, afterLevel: member,
      wage: companionWage(member, party.effects[127], row.scenario === 'party'), drawCount, rngState };
    const differences = Object.entries(actual).filter(([key, value]) => !isDeepStrictEqual(value, row[key as keyof Reference]))
      .map(([field, value]) => ({ field, expected: row[field as keyof Reference], actual: value }));
    return { dev: row.dev, seed: row.seed, scenario: row.scenario, matched: differences.length === 0, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' : 'failed', matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
