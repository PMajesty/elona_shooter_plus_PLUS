import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { Simulation, type ReadyTown } from '../src/simulation.ts';
import { fixedSearchRandom } from '../src/town-search.ts';
import { isOccupiedItem, ITEM_TYPE } from '../src/items.ts';
import { SAVE_VERSION } from '../src/save-version.ts';

function settle(sim: Simulation): void {
  sim['finishDay']();
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) assert.ok(sim.finishLoot());
  while (sim.state.postbattle === 'skill') assert.ok(sim.chooseSkill(sim.state.skillChoices[0]));
  assert.ok(sim.enterTown());
}
function town(counter: number): Simulation {
  const sim = new Simulation(42, { heroClass: 'hunter' }); settle(sim);
  Object.assign(sim.state.town!, { ap: 14, searched: counter });
  sim.state.economy.chickens = 10;
  return sim;
}
const restore = (sim: Simulation) => Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
const search = (sim: Simulation) => {
  const result = sim.performTownActivity('search'); assert.equal(result.outcome, 'done'); return result.message;
};

test('search reaches every original event family with a persistent deterministic cursor', () => {
  const original = readFileSync(new URL('../../src/original/MainTimeline.as', import.meta.url), 'utf8');
  const prefixes = new Map([...original.matchAll(/searchProc\(param1,"([^"]+)","((?:\\.|[^"\\])*)"/g)]
    .map(match => [match[1], JSON.parse(`"${match[2].replace(/\\'/g, "'")}"`) as string]));
  const cases: [number, string, number][] = [
    [0, 'Trouble', 3], [2, 'Fruitless', 9], [4, 'Look!', 16], [6, 'Rejoice!', 15],
    [7, 'Training', 16], [9, 'Gift?', 17], [10, 'Sales Time', 17], [11, 'Free Chicken', 17],
    [12, 'Good news', 16], [13, 'Popularity', 16], [15, 'Ouch...', 22], [17, 'Talent', 19],
    [25, 'Nothing Found', 36], [30, 'Disaster', 36], [34, 'Thief!', 41],
    [37, 'Chatterbox', 40], [45, 'Hero', 55], [55, 'Chickens gone', 60],
  ];
  for (const [counter, event, next] of cases) {
    const sim = town(counter), copy = restore(sim);
    const result = sim.performTownActivity('search'); assert.equal(result.outcome, 'done');
    if (result.outcome !== 'done') throw new Error('Search failed.');
    assert.ok(result.message.startsWith(`${event}:`), `counter ${counter}`);
    assert.equal(result.notice.cardFrame, 13); assert.equal(result.notice.title, event);
    assert.ok(result.notice.text.startsWith(prefixes.get(event) ?? 'You pick up something valuable on the ground. '), `Original English: ${event}`);
    assert.equal((sim.state.town as ReadyTown).searched, next);
    search(copy); assert.deepEqual(copy.toSave(), sim.toSave());
    assert.deepEqual(restore(sim).toSave(), sim.toSave());
  }
  assert.equal(fixedSearchRandom(0), 0);
});

test('search applies money, wall and chicken changes, AP gains/losses and nonfatal floors', () => {
  const wallet = town(4), gold = wallet.state.gold, total = wallet.state.totalMoney; search(wallet);
  assert.equal(wallet.state.gold, gold + 102); assert.equal(wallet.state.totalMoney, total + 102);
  const theft = town(34); theft.state.gold = 1; search(theft); assert.equal(theft.state.gold, 0);
  const news = town(12), hp = news.state.castleHp, max = news.state.castleMaxHp; search(news);
  assert.equal(news.state.castleMaxHp, max + 1); assert.equal(news.state.castleHp, hp);
  const disaster = town(30); disaster.state.castleHp = 2; search(disaster); assert.equal(disaster.state.castleHp, 1);
  const chickens = town(55); search(chickens); assert.equal(chickens.state.economy.chickens, 7);
  const free = town(11); search(free); assert.equal(free.state.economy.chickens, 14);
  for (const [counter, expectedAp] of [[6, 15], [45, 16], [37, 11], [15, 12]]) {
    const sim = town(counter); search(sim); assert.equal(sim.state.town!.ap, expectedAp);
    assert.deepEqual(restore(sim).toSave(), sim.toSave());
  }
  const chatter = town(37); chatter.state.town!.ap = 1; search(chatter); assert.equal(chatter.state.town!.ap, 0);
  const trouble = town(0), mission = structuredClone((trouble.state.town as ReadyTown).mission); search(trouble);
  assert.deepEqual((trouble.state.town as ReadyTown).mission, mission, 'source Trouble expression has no assignment');
});

test('search gifts obey inventory capacity, sales refresh stock and preserve owned equipment', () => {
  const gift = town(9), before = gift.state.inventory.filter(isOccupiedItem).length; search(gift);
  assert.equal(gift.state.inventory.filter(isOccupiedItem).length, before + 1);
  assert.ok(gift.state.inventory.some(item => isOccupiedItem(item) && item.type === ITEM_TYPE.mod));
  const full = town(9); full.state.inventory.fill(structuredClone(full.state.inventory[0]));
  const inventory = structuredClone(full.state.inventory); assert.match(search(full), /inventory is full/);
  assert.deepEqual(full.state.inventory, inventory);
  const sale = town(10), stock = structuredClone((sale.state.town as ReadyTown).shop), owned = structuredClone(sale.state.inventory);
  search(sale); assert.notDeepEqual((sale.state.town as ReadyTown).shop, stock); assert.deepEqual(sale.state.inventory, owned);
});

test('search training persists partial progress, earns an available skill, and carries unspent XP through Rest', () => {
  const sim = town(17), before = structuredClone(sim.state.player.traits);
  search(sim); assert.equal(sim.state.economy.searchTraining, 1);
  let copy = restore(sim); (copy.state.town as ReadyTown).searched = 17; search(copy);
  assert.equal(copy.state.economy.searchTraining, 2);
  copy = restore(copy); (copy.state.town as ReadyTown).searched = 17;
  assert.match(search(copy), /^Talent Flowered!/); assert.equal(copy.state.economy.searchTraining, 0);
  assert.equal(Object.values(copy.state.player.traits).reduce((a, b) => a + b, 0), Object.values(before).reduce((a, b) => a + b, 0) + 1);
  const drill = town(7); drill.state.player.exp = drill.state.party.slots[0].member!.exp = 950;
  search(drill); assert.equal(drill.state.player.exp, 1000); assert.equal(drill.state.party.slots[0].member!.exp, 1000);
  const restored = restore(drill), cursor = (restored.state.town as ReadyTown).searched;
  assert.ok(restored.startNextDay()); assert.deepEqual(restore(restored).toSave(), restored.toSave());
  settle(restored); assert.equal((restored.state.town as ReadyTown).searched, cursor);
  assert.ok(restored.state.player.level >= 2);
});

test('search reload cannot reroll outcomes and Quick Eyed improves the bad-event threshold', () => {
  let sim = town(900);
  for (let i = 0; i < 35; i++) {
    const copy = restore(sim); sim.state.town!.ap = copy.state.town!.ap = 14;
    assert.equal(search(sim), search(copy)); assert.deepEqual(sim.toSave(), copy.toSave());
    sim = restore(sim);
  }
  const counter = Array.from({ length: 100 }, (_, i) => i).find(i => fixedSearchRandom(i) < 0.35 && fixedSearchRandom(i) * 200 >= 35)!;
  const ordinary = town(counter), keen = restore(ordinary); keen.state.partySkills.effects[137] = 100;
  const bad = search(ordinary), good = search(keen);
  assert.notEqual(bad, good);
  assert.ok(['Trouble', 'Chatterbox', 'Chickens gone', 'Disaster', 'Thief!', 'Ouch...', 'Fruitless'].some(name => bad.startsWith(name)));
});

test('fame pays next settlement, legacy v27 migrates without rerolls, and invalid searches preserve all state', () => {
  const famous = town(13), ordinary = restore(famous); search(famous); assert.equal(famous.state.economy.fame, 1);
  assert.ok(famous.startNextDay()); assert.ok(ordinary.startNextDay());
  settle(famous); settle(ordinary);
  const income = famous.state.result.fame ?? 0;
  assert.ok(income >= 0 && income <= 14);
  assert.equal(famous.state.gold - ordinary.state.gold, income);
  assert.equal(famous.state.totalMoney - ordinary.state.totalMoney, income);
  const legacy: any = town(999).toSave(); legacy.version = 27;
  delete legacy.economy.searchTraining; delete legacy.economy.fame;
  const migrated = Simulation.fromSave(legacy); assert.equal(migrated.state.rng, legacy.rng);
  assert.equal((migrated.state.town as ReadyTown).searched, 999); assert.equal(migrated.state.economy.fame, 0);
  const empty = town(4); empty.state.town!.ap = 0; const before = empty.toSave();
  assert.equal(empty.performTownActivity('search').outcome, 'not-enough-ap'); assert.deepEqual(empty.toSave(), before);
  const battle = new Simulation(42), start = battle.toSave();
  assert.equal(battle.performTownActivity('search').outcome, 'unavailable'); assert.deepEqual(battle.toSave(), start);
  for (const key of ['searched', 'searchTraining', 'fame']) {
    const bad: any = town(4).toSave();
    if (key === 'searched') bad.town.searched = -1; else bad.economy[key] = key === 'searchTraining' ? 3 : NaN;
    assert.throws(() => Simulation.fromSave(bad));
  }
  mkdirSync('../.build/browser-qa', { recursive: true });
  writeFileSync('../.build/browser-qa/town-search.json', JSON.stringify({ format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: 0, simulation: town(13).toSave() }));
});
