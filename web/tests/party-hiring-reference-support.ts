import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { ItemFactory } from '../src/items.ts';
import { createPartyState, dismissCompanion, hireCandidate, hireFailure, movePartyEquipment, resolvePartyMod,
  type PartyMember, type PartyState, type PartyEquipmentAddress } from '../src/party.ts';
import { inputSlot, rawSlot } from './town-preparation-reference-support.ts';

type Row = Record<string, any>;
const differences = (actual: Row, expected: Row) => Object.entries(actual).filter(([key, value]) => !isDeepStrictEqual(value, expected[key]))
  .map(([field, value]) => ({ field, actual: value, expected: expected[field] }));

function member(raw: Row | null): PartyMember | null {
  if (!raw) return null;
  return { devType: raw.devType, sex: raw.sex, name: raw.name, appearance: raw.pic,
    potentialAim: raw.potentialAim, potentialTeam: raw.potentialTeam, level: raw.lv, skillPoints: raw.sp,
    trained: raw.trained, optBoss: raw.optBoss, optWall: raw.optWall, kills: raw.kill, earnedGold: raw.earn,
    money: raw.money, nextTrait: raw.nextTrait, ai: raw.ai, focus: raw.forcus, cost: raw.cost, exp: raw.exp,
    weaponExp: [...raw.wexp], traits: { ...raw.trait }, shootTimer: 0, accuracyFix: 0,
    rampageTicks: 0, bowDrawing: false, aiState: null };
}
function originalMember(value: PartyMember | null): Row | null {
  return value && { sex: value.sex, name: value.name, devType: value.devType,
    potentialAim: value.potentialAim, potentialTeam: value.potentialTeam, lv: value.level, sp: value.skillPoints,
    trained: value.trained, optBoss: value.optBoss, optWall: value.optWall, kill: value.kills,
    earn: value.earnedGold, money: value.money, nextTrait: value.nextTrait, ai: value.ai,
    forcus: value.focus, cost: value.cost, exp: value.exp, wexp: value.weaponExp, pic: value.appearance, trait: value.traits };
}
export function partyFromReference(row: Row): PartyState {
  const party = createPartyState(); party.capacity = row.capacity;
  party.slots = row.slots.map((slot: Row) => ({ slot: slot.slot, exists: slot.exists,
    member: member(slot.member), weapon: inputSlot(slot.weapon) }));
  return party;
}

export function comparePartyHiringTrace(records: Row[], hire = hireCandidate) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'party-hiring');
  assert.equal(ready.clock, 'synchronous-original-town-input-and-dialogs'); assert.equal(ready.rng, 'xorshift32');
  assert.equal(ready.frame71, true); assert.equal(ready.continuedTownEntry, true);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'party-hiring');
  assert.equal(complete.ok, true); assert.equal(complete.snapshots, 79); assert.equal(complete.classes, 9);
  const snapshots = records.filter(row => row.type === 'snapshot'); assert.equal(snapshots.length, 79);
  const scenarios = [...new Set(snapshots.map(row => row.scenario))];
  assert.deepEqual(scenarios, [...Array.from({ length: 9 }, (_, index) => `class-${index + 1}`),
    'insufficient-gold', 'house-full', 'party-full', 'dismiss-rehire', 'ally-mod-cancel', 'ally-mod-confirm',
    'reverse-gun-blocked', 'reverse-consumable-blocked', 'unequip-empty']);
  const comparisons: { scenario: string; op: string; matched: boolean; differences: ReturnType<typeof differences> }[] = [];
  for (const scenario of scenarios) {
    const rows = snapshots.filter(row => row.scenario === scenario), before = rows[0];
    assert.equal(before.op, 'before'); assert.equal(before.drawCount, 0); assert.equal(before.rngState, 42);
    const party = partyFromReference(before), inventory = before.inventory.map(inputSlot);
    let gold = before.gold, rng = 42, drawCount = 0;
    const random = () => { let value = rng | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
      rng = value >>> 0; drawCount++; return rng / 4294967296; };
    const factory = new ItemFactory(random);
    for (const row of rows.slice(1)) {
      assert.equal(row.version, 1); assert.equal(row.kind, 'party-hiring');
      if (row.op === 'hire') { const result = hire(party, gold); assert.equal(result.outcome, 'hired'); gold = result.gold; }
      if (row.op === 'dismiss') assert.equal(dismissCompanion(party, 1), true);
      if (row.op === 'guard') {
        const expected = ({ 'insufficient-gold': 'not-enough-gold', 'house-full': 'house-full', 'party-full': 'party-full' } as Row)[scenario];
        assert.equal(hireFailure(party, gold), expected); assert.equal(row.dialog, null); assert.equal(row.messages.length, 1);
      }
      if (row.op === 'drop' || row.op === 'blocked') {
        const mod = scenario.startsWith('ally-mod');
        const source: PartyEquipmentAddress = mod ? { area: 'inventory', slot: 3 } : { area: 'party', slot: 1 };
        const destination: PartyEquipmentAddress = mod ? { area: 'party', slot: 1 }
          : { area: 'inventory', slot: scenario === 'reverse-gun-blocked' ? 2 : scenario === 'reverse-consumable-blocked' ? 4 : 5 };
        const outcome = movePartyEquipment(party, inventory, source, destination);
        assert.equal(outcome, row.op === 'blocked' ? 'unavailable' : mod ? 'mod-confirmation' : 'moved');
      }
      if (scenario.startsWith('ally-mod') && (row.op === 'cancel' || row.op === 'mount'))
        assert.equal(resolvePartyMod(party, inventory, 3, 1, row.op === 'mount', factory), row.op === 'mount' ? 'mounted' : 'cancelled');
      const actual = { slots: party.slots.map(slot => ({ slot: slot.slot, exists: slot.exists,
        member: originalMember(slot.member), weapon: rawSlot(slot.weapon) })),
        inventory: inventory.map(rawSlot), auxiliary: before.auxiliary, capacity: party.capacity,
        gold, totalMoney: before.totalMoney, ap: before.ap, drawCount, rngState: rng };
      const mismatch = differences(actual, row);
      comparisons.push({ scenario, op: row.op, matched: mismatch.length === 0, differences: mismatch });
    }
  }
  assert.equal(comparisons.length, 61);
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const,
    observedSnapshots: snapshots.length, comparedSnapshots: comparisons.length,
    matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
