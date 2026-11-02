import { ITEM_TYPE, ItemFactory, isOccupiedItem, type Item } from './items.ts';
import { modMountFailure, type TownEquipmentOutcome } from './equipment.ts';
import { ALL_TRAITS } from './party-progression.ts';
import { validPartyAIState, type PartyAIState } from './party-ai.ts';
import type { TraitLevels } from './progression.ts';
import type { FirstTownRecruit, RecruitClass } from './recruits.ts';
import { generateNpcRecruit } from './recruits.ts';

export interface CombatActorState {
  level: number; exp: number; skillPoints: number; traits: TraitLevels; weaponExp: number[];
  shootTimer: number; accuracyFix: number; rampageTicks: number; bowDrawing: boolean;
}
export interface PartyMember extends CombatActorState {
  devType: RecruitClass; sex: number; name: string; appearance: number;
  potentialAim: number; potentialTeam: number; nextTrait: number; trained: number;
  optBoss: boolean; optWall: boolean; kills: number; earnedGold: number; money: number;
  cost: number; ai: number; focus: number; aiState: PartyAIState | null;
}
export type PartySlotId = 1 | 2 | 3 | 4 | 5;
export interface PartySlot { slot: PartySlotId; exists: boolean; member: PartyMember | null; weapon: Item | null }
export interface PartyState { capacity: 1 | 2 | 3; slots: PartySlot[] }
export type PartyPendingAction = { kind: 'hire' } | { kind: 'henchman' } | { kind: 'dismiss'; slot: number }
  | { kind: 'party-mod'; inventorySlot: number; partySlot: number };
export type HireOutcome = 'hired' | 'no-candidate' | 'party-full' | 'house-full' | 'not-enough-gold';
export type PartyEquipmentAddress = { area: 'inventory' | 'party'; slot: number };

export function partySlot(party: PartyState, slot: number): PartySlot | undefined {
  return Number.isInteger(slot) && slot >= 1 && slot <= 5 ? party.slots[slot - 1] : undefined;
}

export function createPartyState(candidate?: Readonly<FirstTownRecruit>): PartyState {
  const party: PartyState = { capacity: 1, slots: Array.from({ length: 5 }, (_, index) => ({
    slot: (index + 1) as PartySlotId, exists: false, member: null, weapon: null,
  })) };
  if (candidate) installCandidate(party, candidate);
  return party;
}

/** gameStart выдаёт Hunter/Rogue одного Guardian до подготовки боевой сцены. */
export function addStartingLittleGirl(party: PartyState, random: () => number): void {
  const sex = Math.trunc(random() * 2);
  // Имя, потенциалы, база и портрет генерируются, затем gameStart их заменяет.
  random(); random(); random(); random(); random();
  const nextTrait = Math.trunc(random() * 100);
  random();
  const weapon = new ItemFactory(random, { day: 1 }).generate(24);
  party.slots[0] = { slot: 1, exists: true, weapon, member: {
    devType: 9, sex, name: 'Little Girl', appearance: 50, potentialAim: 0.7, potentialTeam: 0.8,
    nextTrait, trained: 0, optBoss: true, optWall: true, kills: 0, earnedGold: 0,
    money: 200, cost: 400, ai: 6, focus: -1, level: 1, exp: 0, skillPoints: 0,
    traits: { 9: 1, 900: 1, 901: 1, 103: 1, 105: 1, 113: 2 },
    weaponExp: [0, 0, 0, 0, 0], shootTimer: 0, accuracyFix: 0, rampageTicks: 0,
    bowDrawing: false, aiState: null,
  } };
}

/** town.recruit остаётся снимком генерации; изменяемый кандидат принадлежит только слоту 5. */
export function installCandidate(party: PartyState, recruit: Readonly<FirstTownRecruit>): void {
  const candidate = party.slots[4];
  const previous = candidate.member;
  candidate.exists = recruit.exist;
  candidate.member = {
    devType: recruit.devType, sex: recruit.sex, name: recruit.name, appearance: recruit.pic,
    potentialAim: recruit.potentialAim, potentialTeam: recruit.potentialTeam, nextTrait: recruit.nextTrait,
    trained: recruit.trained, optBoss: recruit.optBoss, optWall: recruit.optWall,
    kills: recruit.kill, earnedGold: recruit.earn, money: recruit.money, cost: recruit.cost,
    ai: recruit.ai, focus: recruit.forcus, level: recruit.lv, exp: recruit.exp, skillPoints: recruit.sp,
    traits: { ...recruit.trait }, weaponExp: [...recruit.wexp], shootTimer: previous?.shootTimer ?? 0,
    accuracyFix: previous?.accuracyFix ?? 0, rampageTicks: previous?.rampageTicks ?? 0,
    bowDrawing: previous?.bowDrawing ?? false, aiState: previous?.aiState ? structuredClone(previous.aiState) : null,
  };
  candidate.weapon = recruit.items[45] ? { ...recruit.items[45] } : null;
}

/** generateHenchman: отдельный четвёртый союзник, не занимающий постоянный дом. */
export function generateHenchman(party: PartyState, day: number, random: () => number, engineer = 0): void {
  const recruit = generateNpcRecruit(random, day, 10 + day, 4, {
    previousSlots: { 45: party.slots[3].weapon }, itemContext: { engineer },
  });
  const weapon = new ItemFactory(random, { day, engineer }).generate(21, recruit.items[45]);
  const member: PartyMember = {
    devType: 4, sex: recruit.sex, name: recruit.name, appearance: recruit.pic,
    potentialAim: recruit.potentialAim, potentialTeam: recruit.potentialTeam, nextTrait: recruit.nextTrait,
    trained: 0, optBoss: false, optWall: true, kills: 0, earnedGold: 0, money: 200, cost: recruit.cost,
    ai: 6, focus: -1, level: recruit.lv, exp: 0, skillPoints: recruit.sp,
    traits: { ...recruit.trait, 106: 40 }, weaponExp: [...recruit.wexp], shootTimer: 0,
    accuracyFix: 0, rampageTicks: 0, bowDrawing: false, aiState: null,
  };
  party.slots[3] = { slot: 4, exists: true, member, weapon };
}

export function hireFailure(party: PartyState, gold: number): Exclude<HireOutcome, 'hired'> | null {
  const candidate = party.slots[4];
  if (!candidate.exists || !candidate.member) return 'no-candidate';
  if (party.slots[2].exists) return 'party-full';
  const free = party.slots.slice(0, 4).find(slot => !slot.exists);
  if (!free || free.slot > party.capacity) return 'house-full';
  if (gold < candidate.member.cost) return 'not-enough-gold';
  return null;
}

function swapRecords(first: PartySlot, second: PartySlot): void {
  [first.exists, second.exists] = [second.exists, first.exists];
  [first.member, second.member] = [second.member, first.member];
  [first.weapon, second.weapon] = [second.weapon, first.weapon];
}

/** Исходный sortChara делает один проход, сохраняя записи несуществующих персонажей. */
function compactParty(party: PartyState): void {
  for (let index = 0; index < 3; index++) {
    if (!party.slots[index].exists && party.slots[index + 1].exists) swapRecords(party.slots[index], party.slots[index + 1]);
  }
}

export function hireCandidate(party: PartyState, gold: number): { outcome: HireOutcome; gold: number; slot?: number } {
  const failure = hireFailure(party, gold);
  if (failure) return { outcome: failure, gold };
  const candidate = party.slots[4], destination = party.slots.slice(0, 4).find(slot => !slot.exists)!;
  const cost = candidate.member!.cost;
  swapRecords(candidate, destination);
  candidate.exists = false;
  compactParty(party);
  return { outcome: 'hired', gold: gold - cost, slot: destination.slot };
}

export function dismissCompanion(party: PartyState, slot: number): boolean {
  const selected = partySlot(party, slot);
  if (!selected?.exists || slot > 3) return false;
  selected.exists = false;
  compactParty(party);
  return true;
}

function equipmentCell(party: PartyState, inventory: (Item | null)[], address: PartyEquipmentAddress)
  : { item: Item | null; actor: PartyMember | null; set(item: Item | null): void } | null {
  if (!Number.isInteger(address.slot)) return null;
  if (address.area === 'inventory' && address.slot >= 0 && address.slot < inventory.length)
    return { item: inventory[address.slot], actor: null, set: item => { inventory[address.slot] = item; } };
  const slot = address.area === 'party' ? partySlot(party, address.slot) : undefined;
  if (!slot?.exists || !slot.member || slot.slot >= 4) return null;
  return { item: slot.weapon, actor: slot.member, set: item => { slot.weapon = item; } };
}

function accepts(actor: PartyMember | null, item: Item | null): boolean {
  return actor === null || !isOccupiedItem(item) || item.type === ITEM_TYPE.gun && (actor.traits[item.reqTrait!] ?? 0) >= item.reqLv!;
}

/** Проверяем обе стороны обмена: нельзя вернуть неподходящий предмет в освобождаемый слот союзника. */
export function movePartyEquipment(party: PartyState, inventory: (Item | null)[], from: PartyEquipmentAddress, to: PartyEquipmentAddress)
  : 'moved' | 'mod-confirmation' | 'unavailable' {
  if (from.area === to.area && from.slot === to.slot || from.area !== 'party' && to.area !== 'party') return 'unavailable';
  const source = equipmentCell(party, inventory, from), destination = equipmentCell(party, inventory, to);
  if (!source || !destination || !isOccupiedItem(source.item)) return 'unavailable';
  if (source.item.type === ITEM_TYPE.mod && destination.actor && isOccupiedItem(destination.item) && destination.item.type === ITEM_TYPE.gun)
    return 'mod-confirmation';
  if (!accepts(destination.actor, source.item) || !accepts(source.actor, destination.item)) return 'unavailable';
  source.set(destination.item); destination.set(source.item);
  return 'moved';
}

export function resolvePartyMod(party: PartyState, inventory: (Item | null)[], inventorySlot: number, companionSlot: number,
  confirm: boolean, factory: ItemFactory): TownEquipmentOutcome {
  if (!Number.isInteger(inventorySlot) || inventorySlot < 0 || inventorySlot >= inventory.length) return 'unavailable';
  const target = partySlot(party, companionSlot), mod = inventory[inventorySlot];
  if (!target?.exists || target.slot >= 4 || !isOccupiedItem(mod) || mod.type !== ITEM_TYPE.mod
    || !isOccupiedItem(target.weapon) || target.weapon.type !== ITEM_TYPE.gun) return 'unavailable';
  // У союзника No возвращает мод на место; обмен MOD/оружия допустим только в инвентаре героя.
  if (!confirm) return 'cancelled';
  const failure = modMountFailure(mod, target.weapon);
  if (failure) return failure;
  factory.enchant(target.weapon, mod.mod, mod.modMax);
  mod.num = 0;
  return 'mounted';
}

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown, low: number, high = 1e9): value is number => Number.isInteger(value) && Number(value) >= low && Number(value) <= high;
const finite = (value: unknown, low = -1e9, high = 1e9): value is number => typeof value === 'number' && Number.isFinite(value) && value >= low && value <= high;

export function validPartyMember(value: unknown): value is PartyMember {
  if (!record(value) || !integer(value.devType, 1, 9) || !integer(value.sex, 0, 1)
    || !integer(value.appearance, 0, 59) || typeof value.name !== 'string' || value.name.length < 1 || value.name.length > 256) return false;
  if (!integer(value.level, 1, 999) || !integer(value.exp, 0, 1000000000) || !integer(value.skillPoints, 0, 999)
    || !integer(value.nextTrait, 0, 99) || !integer(value.trained, 0) || !integer(value.kills, 0)
    || !finite(value.earnedGold, 0) || !finite(value.money, 0) || !finite(value.cost, 0)
    || !finite(value.potentialAim, 0, 1) || !finite(value.potentialTeam, 0, 1) || !integer(value.ai, 0, 6)
    || typeof value.optBoss !== 'boolean' || typeof value.optWall !== 'boolean') return false;
  if (!record(value.traits) || value.traits[value.devType] !== value.level || !integer(value.traits[900], 1, 999)
    || !integer(value.traits[901], 1, 999) || Object.entries(value.traits).some(([key, level]) =>
      !Object.hasOwn(ALL_TRAITS, key) || !integer(level, 0, ALL_TRAITS[Number(key)].maxLevel))) return false;
  if (!integer(value.focus, -1, 899) || value.focus !== -1 && (!Object.hasOwn(ALL_TRAITS, value.focus)
    || value.focus < 100 || !value.traits[value.focus])) return false;
  if (!Array.isArray(value.weaponExp) || value.weaponExp.length !== 5 || value.weaponExp.some(x => !finite(x, 0))
    || !finite(value.shootTimer) || !finite(value.accuracyFix) || !finite(value.rampageTicks, -6)
    || typeof value.bowDrawing !== 'boolean') return false;
  return value.aiState === null || validPartyAIState(value.aiState);
}

export function validPartyState(value: unknown, validItem: (item: unknown) => item is Item,
  options: { phase?: string; allowHenchman?: boolean } = {}): value is PartyState {
  if (!record(value) || !integer(value.capacity, 1, 3) || !Array.isArray(value.slots) || value.slots.length !== 5) return false;
  let gap = false;
  for (let index = 0; index < 5; index++) {
    const slot = value.slots[index];
    if (!record(slot) || slot.slot !== index + 1 || typeof slot.exists !== 'boolean'
      || slot.member !== null && !validPartyMember(slot.member) || slot.weapon !== null && !validItem(slot.weapon)) return false;
    if (slot.exists && slot.member === null || index === 3 && slot.exists && !options.allowHenchman) return false;
    if (index < 3) {
      if (slot.exists && (gap || index >= value.capacity)) return false;
      if (!slot.exists) gap = true;
    }
    if (slot.weapon !== null && isOccupiedItem(slot.weapon as Item) && (slot.weapon as Item).type !== ITEM_TYPE.gun) return false;
    if (index === 4 && slot.exists && !isOccupiedItem(slot.weapon as Item | null)) return false;
    const member = slot.member as PartyMember | null, weapon = slot.weapon as Item | null;
    if (slot.exists && index < 4 && options.phase === 'battle') {
      if (!member?.aiState) return false;
      if (isOccupiedItem(weapon) && (weapon.reloadTime > weapon.reloadTimeMax + 1 || weapon.ammo === weapon.ammoMax && weapon.reloadTime !== 0)) return false;
      if (member.bowDrawing && (!isOccupiedItem(weapon) || weapon.special !== 4)) return false;
    }
  }
  return true;
}

export function validPartyPendingAction(action: unknown, party: PartyState, inventory: (Item | null)[], gold: number): action is PartyPendingAction {
  if (!record(action)) return false;
  if (action.kind === 'henchman') return Object.keys(action).length === 1;
  if (action.kind === 'hire') return hireFailure(party, gold) === null;
  if (action.kind === 'dismiss') return integer(action.slot, 1, 3) && Boolean(partySlot(party, action.slot)?.exists);
  if (action.kind === 'party-mod') {
    if (!integer(action.inventorySlot, 0, inventory.length - 1) || !integer(action.partySlot, 1, 3)) return false;
    const slot = partySlot(party, action.partySlot), mod = inventory[action.inventorySlot];
    return Boolean(slot?.exists && isOccupiedItem(slot.weapon) && slot.weapon.type === ITEM_TYPE.gun
      && isOccupiedItem(mod) && mod.type === ITEM_TYPE.mod);
  }
  return false;
}
