import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ItemFactory } from '../src/items.ts';
import { RECRUIT_NAMES, generateFirstTownRecruit, type RecruitClass } from '../src/recruits.ts';

function controlledRecruit(devType: RecruitClass) {
  const values = [0.999, 0.75, 7.25 / 132, (devType - 0.5) / 9, 0.25, 0.5, 0.99, 0, 0.123, 0.999];
  let draws = 0;
  const recruit = generateFirstTownRecruit(() => values[draws++] ?? 0.5);
  return { recruit, draws };
}

test('the complete recruit name table preserves the original ordering, duplicates and accents', () => {
  const source = readFileSync(new URL('../../src/original/MainTimeline.as', import.meta.url), 'utf8');
  const match = /nameBoy = (\[.*?\]);/s.exec(source);
  assert.ok(match);
  assert.equal(RECRUIT_NAMES.length, 132);
  assert.deepEqual(RECRUIT_NAMES, JSON.parse(match[1]));
});

test('first-town recruit draws preserve original character field order and all nine class loadouts', () => {
  const expected: Record<number, { weapon: number; skills: Record<number, number>; draws: number }> = {
    1: { weapon: 23, skills: { 103: 1, 104: 1, 105: 1, 109: 1 }, draws: 14 },
    2: { weapon: 4, skills: { 104: 2, 119: 1 }, draws: 14 },
    3: { weapon: 1, skills: { 103: 2, 104: 1, 108: 1 }, draws: 14 },
    4: { weapon: 4, skills: { 104: 2, 106: 1 }, draws: 18 },
    5: { weapon: 36, skills: { 103: 1, 106: 2 }, draws: 14 },
    6: { weapon: 3, skills: { 105: 2, 121: 1 }, draws: 14 },
    7: { weapon: 1, skills: { 103: 3 }, draws: 14 },
    8: { weapon: 2, skills: { 103: 1, 104: 1, 105: 1, 106: 1 }, draws: 14 },
    9: { weapon: 24, skills: { 103: 1, 105: 1, 113: 2 }, draws: 12 },
  };
  for (const id of Object.keys(expected).map(Number)) {
    const { recruit, draws } = controlledRecruit(id as RecruitClass);
    const { items, trait, ...fields } = recruit;
    assert.deepEqual(fields, {
      exist: true, sex: 1, name: 'García', devType: id, potentialAim: 0.30000000000000004,
      potentialTeam: 0.5, lv: 1, sp: 0, trained: 0, optBoss: true, optWall: true,
      kill: 0, earn: 0, money: 200, nextTrait: 12, ai: 0, forcus: -1,
      cost: 400, exp: 0, wexp: [0, 0, 0, 0, 0], pic: 21,
    });
    assert.deepEqual(trait, { [id]: 1, 900: 10, 901: 1, ...expected[id].skills });
    assert.equal(items[45].id, expected[id].weapon);
    assert.deepEqual(Object.keys(items), id === 4 ? ['45', '47', '48'] : ['45']);
    assert.equal(draws, expected[id].draws);
  }
});

test('Hunter overrides and Militia extra inventory writes preserve original item adjustments', () => {
  const hunter = controlledRecruit(1).recruit.items[45];
  assert.equal(hunter.name, "Hunter's Crossbow");
  assert.equal(hunter.shootRate, 32); assert.equal(hunter.baseAccuracy, 160);
  assert.equal(hunter.attack, 30); assert.equal(hunter.reqLv, 1);
  const militia = controlledRecruit(4).recruit.items;
  assert.equal(militia[47].id, 40); assert.equal(militia[47].name, 'Simple Flame Thrower');
  assert.equal(militia[47].attack, 10); assert.equal(militia[47].reqLv, 1);
  assert.equal(militia[47].modMax, 1); assert.equal(militia[47].mod, 1);
  assert.equal(militia[47].livingWeapon, 50); assert.equal(militia[47].modText, 'Living Weapon(Lv.1) ');
  assert.equal(militia[47].value, 1144);
  assert.equal(militia[48].id, 16); assert.equal(militia[48].name, 'Simple Chain Gun');
  assert.equal(militia[48].reqLv, 1);
});

test('Noble and Duelist apply their original fixed enchants without extra random draws', () => {
  const noble = controlledRecruit(8).recruit.items[45];
  assert.equal(noble.name, 'PDW'); assert.equal(noble.modMax, 2); assert.equal(noble.reqLv, 1);
  assert.equal(noble.baseAccuracy, 166); assert.equal(noble.mod, 1);
  assert.equal(noble.modText, 'Accuracy(Lv.3) '); assert.equal(noble.value, 822);
  const duelist = controlledRecruit(7).recruit.items[45];
  assert.equal(duelist.modMax, 4); assert.equal(duelist.mod, 1);
  assert.equal(duelist.ammoMax, 16); assert.equal(duelist.ammo, 16);
  assert.equal(duelist.modText, 'Ammo(Lv.3) '); assert.equal(duelist.value, 768);
});

test('generation never mutates prior slot metadata and returns only the original writes', () => {
  const factory = new ItemFactory(() => 0.5);
  const previousSlots = { 45: factory.generate(11), 47: factory.generate(7), 48: factory.generate(30), 20: factory.generate(3) };
  previousSlots[45].num = 0;
  const untouched = structuredClone(previousSlots);
  const values = [0, 0, 0, 0.95, 0, 0, 0, 0, 0, 0];
  let draws = 0;
  const recruit = generateFirstTownRecruit(() => values[draws++] ?? 0.5, { previousSlots });
  assert.equal(recruit.devType, 9);
  assert.deepEqual(Object.keys(recruit.items), ['45']);
  assert.notEqual(recruit.items[45], previousSlots[45]);
  assert.equal(recruit.items[45].num, 1);
  assert.deepEqual(previousSlots, untouched);
});
