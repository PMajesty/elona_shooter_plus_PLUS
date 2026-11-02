import test from 'node:test';
import assert from 'node:assert/strict';
import { createPartyState, dismissCompanion, hireCandidate, hireFailure, installCandidate, movePartyEquipment,
  resolvePartyMod, validPartyPendingAction, validPartyState } from '../src/party.ts';
import { generateEarlyTownRecruit, type FirstTownRecruit } from '../src/recruits.ts';
import { ItemFactory, type Item } from '../src/items.ts';
import { createPartyAIState } from '../src/party-ai.ts';

function candidate(classId = 6): FirstTownRecruit {
  const prefix = [0.99, 0.5, 0.5, (classId - 0.5) / 9];
  return generateEarlyTownRecruit(() => prefix.shift() ?? 0.5, 7);
}
const validItem = (value: unknown): value is Item => value !== null && typeof value === 'object' && Number.isInteger((value as Item).id);

test('all nine actual generated classes hire once with their full record and only weapon45', () => {
  for (let id = 1; id <= 9; id++) {
    const recruit = candidate(id), original = structuredClone(recruit), party = createPartyState(recruit);
    const record = party.slots[4].member, gun = party.slots[4].weapon;
    assert.equal(validPartyState(party, validItem), true);
    assert.equal(hireFailure(party, recruit.cost - 1), 'not-enough-gold');
    const before = structuredClone(party);
    assert.deepEqual(hireCandidate(party, recruit.cost - 1), { outcome: 'not-enough-gold', gold: recruit.cost - 1 });
    assert.deepEqual(party, before);
    assert.equal(validPartyPendingAction({ kind: 'hire' }, party, [], recruit.cost), true);
    assert.deepEqual(hireCandidate(party, recruit.cost), { outcome: 'hired', gold: 0, slot: 1 });
    assert.equal(party.slots[0].member, record); assert.equal(party.slots[0].weapon, gun);
    assert.equal(party.slots[4].exists, false); assert.equal(party.slots[4].member, null);
    assert.equal(record!.skillPoints, 3); assert.equal(record!.money, 200);
    assert.equal(hireCandidate(party, 1000).outcome, 'no-candidate');
    assert.deepEqual(recruit, original); assert.deepEqual(party.slots[0].weapon, recruit.items[45]);
    assert.equal(validPartyState(JSON.parse(JSON.stringify(party)), validItem), true);
  }
});

test('dismissal retains inactive records and the next hire exchanges the old gun into candidate history', () => {
  const party = createPartyState(candidate()), factory = new ItemFactory(() => 0.5);
  assert.equal(hireCandidate(party, 1000).outcome, 'hired');
  const former = party.slots[0].member;
  party.slots[0].weapon = factory.generate(1); party.slots[0].weapon.name = 'Retained gun';
  const gun = party.slots[0].weapon;
  installCandidate(party, candidate(9));
  assert.equal(hireFailure(party, 1000), 'house-full');
  assert.equal(dismissCompanion(party, 1), true);
  assert.equal(party.slots[0].member, former); assert.equal(party.slots[0].weapon, gun);
  assert.equal(dismissCompanion(party, 1), false);
  assert.equal(hireCandidate(party, 1000).outcome, 'hired');
  assert.equal(party.slots[0].member!.devType, 9);
  assert.equal(party.slots[4].member, former); assert.equal(party.slots[4].weapon, gun);
  assert.equal(party.slots[4].exists, false);
  assert.equal(validPartyState(JSON.parse(JSON.stringify(party)), validItem), true);
  former!.shootTimer = -123.5; former!.accuracyFix = 2.25;
  installCandidate(party, candidate(1));
  assert.equal(party.slots[4].member!.devType, 1);
  assert.equal(party.slots[4].member!.shootTimer, -123.5);
  assert.equal(party.slots[4].member!.accuracyFix, 2.25);
  assert.equal(party.slots[4].member!.exp, 0);
});

test('compaction moves character and weapon together, and original three-companion limit precedes house check', () => {
  const party = createPartyState(); party.capacity = 3;
  for (const id of [1, 2, 3]) { installCandidate(party, candidate(id)); assert.equal(hireCandidate(party, 1000).outcome, 'hired'); }
  installCandidate(party, candidate(4));
  assert.equal(hireFailure(party, 0), 'party-full');
  const dismissed = party.slots[0].member, remaining = party.slots.slice(1, 3).map(slot => [slot.member, slot.weapon]);
  assert.equal(dismissCompanion(party, 1), true);
  assert.deepEqual(party.slots.slice(0, 2).map(slot => [slot.member, slot.weapon]), remaining);
  assert.equal(party.slots[2].exists, false); assert.equal(party.slots[2].member, dismissed);
  assert.equal(validPartyState(party, validItem), true);
});

test('ally equipment checks reverse swaps and MOD cancellation preserves the gun and mod', () => {
  const party = createPartyState(candidate()), factory = new ItemFactory(() => 0.5);
  hireCandidate(party, 1000);
  const inventory: (Item | null)[] = [factory.generate(1), null, factory.generate(11), factory.generate(8), null, null];
  factory.setMod(inventory[3]!, 4);
  const ally = { area: 'party', slot: 1 } as const;
  assert.equal(movePartyEquipment(party, inventory, ally, { area: 'inventory', slot: 0 }), 'unavailable');
  assert.equal(movePartyEquipment(party, inventory, ally, { area: 'inventory', slot: 2 }), 'unavailable');
  assert.equal(movePartyEquipment(party, inventory, ally, { area: 'inventory', slot: 1 }), 'moved');
  assert.equal(party.slots[0].weapon, null);
  assert.equal(movePartyEquipment(party, inventory, { area: 'inventory', slot: 3 }, ally), 'unavailable');
  assert.equal(movePartyEquipment(party, inventory, { area: 'inventory', slot: 1 }, ally), 'moved');
  const before = structuredClone({ party, inventory });
  assert.equal(movePartyEquipment(party, inventory, { area: 'inventory', slot: 3 }, ally), 'mod-confirmation');
  assert.equal(validPartyPendingAction({ kind: 'party-mod', inventorySlot: 3, partySlot: 1 }, party, inventory, 0), true);
  assert.equal(resolvePartyMod(party, inventory, 3, 1, false, factory), 'cancelled');
  assert.deepEqual({ party, inventory }, before);
  const attack = party.slots[0].weapon!.attack!;
  assert.equal(resolvePartyMod(party, inventory, 3, 1, true, factory), 'mounted');
  assert.equal(inventory[3]!.num, 0); assert.ok(party.slots[0].weapon!.attack! > attack);
  assert.equal(movePartyEquipment(party, inventory, { area: 'party', slot: 5 }, ally), 'unavailable');
});

test('party import rejects malformed ownership and cannot treat fresh town candidates as initialized battle actors', () => {
  const party = createPartyState(candidate()); hireCandidate(party, 1000);
  assert.equal(validPartyState(party, validItem), true);
  assert.equal(validPartyState(party, validItem, { phase: 'battle' }), false);
  for (const change of [
    (value: any) => { value.slots[0].slot = 2; },
    (value: any) => { value.slots[0].member = null; },
    (value: any) => { value.slots[0].member.devType = 10; },
    (value: any) => { value.slots[0].member.traits[500] = 1; },
    (value: any) => { value.slots[0].member.weaponExp = [0]; },
    (value: any) => { value.slots[3] = { ...value.slots[0], slot: 4 }; },
    (value: any) => { value.slots[1] = { ...value.slots[0], slot: 2 }; },
  ]) {
    const invalid = structuredClone(party); change(invalid); assert.equal(validPartyState(invalid, validItem), false);
  }
  const empty = createPartyState();
  assert.equal(validPartyState(empty, validItem, { phase: 'battle' }), true);
  assert.equal(validPartyPendingAction({ kind: 'dismiss', slot: 5 }, party, [], 0), false);
  assert.equal(validPartyPendingAction({ kind: 'party-mod', inventorySlot: 0, partySlot: 1 }, party, [], 0), false);
});

test('battle imports retain source negative rampage counters and validate active reload and bow equipment', () => {
  const party = createPartyState(candidate()); hireCandidate(party, 1000);
  const actor = party.slots[0].member!, weapon = party.slots[0].weapon!;
  actor.aiState = createPartyAIState(1);
  for (const counter of [-6, -1, 0, 300]) {
    actor.rampageTicks = counter;
    assert.equal(validPartyState(JSON.parse(JSON.stringify(party)), validItem, { phase: 'battle' }), true);
  }
  actor.rampageTicks = -7;
  assert.equal(validPartyState(party, validItem, { phase: 'battle' }), false);
  actor.rampageTicks = -6;
  weapon.reloadTime = 3;
  assert.equal(validPartyState(party, validItem, { phase: 'town' }), true);
  assert.equal(validPartyState(party, validItem, { phase: 'battle' }), false);
  weapon.ammo--;
  assert.equal(validPartyState(party, validItem, { phase: 'battle' }), true);
  weapon.reloadTime = weapon.reloadTimeMax + 2;
  assert.equal(validPartyState(party, validItem, { phase: 'battle' }), false);
  weapon.reloadTime = 0; actor.bowDrawing = true;
  assert.equal(validPartyState(party, validItem, { phase: 'battle' }), false);
  party.slots[0].weapon = new ItemFactory(() => 0.5).generate(24);
  assert.equal(validPartyState(party, validItem, { phase: 'battle' }), true);
  party.slots[0].weapon.num = 0;
  assert.equal(validPartyState(party, validItem, { phase: 'battle' }), false);
});
