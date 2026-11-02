import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFlashSharedObject } from '../src/flash-shared-object.ts';
import { readFlashAdventure } from '../src/flash-adventure.ts';
import { Simulation } from '../src/simulation.ts';
import type { Item } from '../src/items.ts';

const fixture = (name: string) => new Uint8Array(readFileSync(new URL(`./fixtures/flash-native/${name}.sol`, import.meta.url)));
const profile = { version: 1 as const, medals: [40], bestDay: 0 };
type Columns = Record<string, unknown[]>;

function sameItem(item: Item | null, columns: Columns, index: number): void {
  if (!item) { assert.notEqual(columns.num[index], 1); return; }
  for (const [key, amount] of Object.entries(item)) {
    // Неиспользованное ammo у исходного MOD/сокровища может отсутствовать.
    const expected = columns[key]?.[index];
    assert.deepEqual(amount, key === 'ammo' && expected === undefined ? 0 : expected, `slot${index}.${key}`);
  }
}

test('a save written by the preserved game in Ruffle retains native hero, equipment, party and mission values', () => {
  const bytes = fixture('before-search'), raw = readFlashSharedObject(bytes);
  assert.equal(raw.name, 'elonas0');
  const game = raw.data.game as Record<string, number>, player = raw.data.player as Columns;
  const inventory = raw.data.inventory as Columns, mission = raw.data.mission as Record<string, unknown>;
  const imported = readFlashAdventure(bytes, profile), s = imported.save.simulation;
  assert.equal(game.version, 1304); assert.equal(s.mode, 'casual'); assert.equal(s.player.classId, 'hunter');
  assert.equal(s.day, 1); assert.equal(s.player.level, 2); assert.equal(s.gold, 806); assert.equal(s.castleHp, 5);
  assert.equal(s.gold, player.money[0]); assert.equal(s.totalMoney, game.totalMoney);
  assert.equal(s.killHistory!.completed, game.totalKill); assert.equal(game.totalKill, 29);
  for (const [key, source] of [['level', 'lv'], ['exp', 'exp'], ['skillPoints', 'sp'], ['weaponExp', 'wexp']] as const) assert.deepEqual(s.player[key], player[source][0]);
  const sourceTraits = player.trait[0] as number[];
  assert.deepEqual(s.player.traits, Object.fromEntries(Object.entries(sourceTraits).filter(([, value]) => value)));
  for (const [i, value] of s.inventory.entries()) sameItem(value, inventory, 20 + i);
  assert.equal(s.town!.preparation, 'ready');
  if (s.town?.preparation !== 'ready') throw Error('Missing town');
  s.town.shop.forEach((value, i) => sameItem(value, inventory, i));
  for (const [key, value] of Object.entries(s.town.mission)) assert.deepEqual(value, mission[key], key);
  assert.equal(s.town.ap, game.ap); assert.equal(s.town.searched, game.searched);
  assert.deepEqual(s.town.cards, game.card);
  for (const slot of s.party.slots) {
    assert.equal(slot.exists, player.exist[slot.slot] ?? false);
    sameItem(slot.weapon, inventory, 40 + slot.slot);
    if (!slot.member) continue;
    assert.equal(slot.member.name, player.name[slot.slot]); assert.equal(slot.member.level, player.lv[slot.slot]);
    assert.deepEqual(slot.member.weaponExp, player.wexp[slot.slot]);
  }
  assert.deepEqual(Simulation.fromSave(JSON.parse(JSON.stringify(s))).toSave(), s);
});

test('imported native search cursor reproduces the original Rejoice event and independently saved state changes', () => {
  const before = fixture('before-search'), after = readFlashSharedObject(fixture('after-search')).data;
  const a = after.game as Record<string, number>, p = after.player as Columns;
  const imported = readFlashAdventure(before, profile), sim = Simulation.fromSave(imported.save.simulation);
  const result = sim.performTownActivity('search'); assert.equal(result.outcome, 'done');
  if (result.outcome !== 'done') throw Error('Search refused');
  assert.equal(result.notice.title, 'Rejoice!');
  assert.equal(result.notice.text, 'A group of soldiers celebrate you and buy you a drink at the bar. It made you even more determined to win the battle tomorrow. You gain 2 action points.');
  assert.equal(sim.state.town!.ap, 5); assert.equal(sim.state.town!.ap, a.ap);
  assert.equal(sim.state.town!.preparation === 'ready' && sim.state.town.searched, a.searched);
  assert.equal(a.searched, 455); assert.equal(sim.state.gold, p.money[0]);
  assert.equal(sim.state.totalMoney, a.totalMoney); assert.equal(sim.state.castleHp, a.castleHP);
  assert.equal(sim.state.castleMaxHp, a.castleMHP); assert.equal(sim.state.economy.fame, a.fame);
  const copy = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
  assert.ok(sim.startNextDay()); assert.ok(copy.startNextDay());
  for (let i = 0; i < 100; i++) { sim.tick(); copy.tick(); }
  assert.deepEqual(sim.toSave(), copy.toSave());
});
