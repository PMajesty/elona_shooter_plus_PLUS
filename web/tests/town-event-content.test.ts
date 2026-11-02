import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Simulation, type ReadyTown } from '../src/simulation.ts';
import { TOWN_NOTICES } from '../src/town-events.ts';
import type { TownActivity } from '../src/town-economy.ts';

const original = readFileSync(new URL('../../src/original/MainTimeline.as', import.meta.url), 'utf8');
const decode = (text: string) => JSON.parse(`"${text.replace(/\\'/g, "'")}"`) as string;
function town(): Simulation {
  const sim = new Simulation(42); sim['finishDay']();
  while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
  while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
  sim.enterTown(); sim.state.town!.ap = 14;
  Object.assign(sim.state.economy, { villa: 2, chickens: 6, specialTrainer: 2 });
  (sim.state.town as ReadyTown).flags.egg = false;
  sim.state.player.traits[125] = 1; sim['refreshPartySkills']();
  return sim;
}

test('fixed town notices retain the preserved original English titles and complete text', () => {
  const literals = new Set([...original.matchAll(/"((?:\\.|[^"\\])*)"/g)].flatMap(match => {
    try { return [decode(match[1])]; } catch { return []; }
  }));
  for (const notice of Object.values(TOWN_NOTICES)) {
    assert.ok(literals.has(notice.title), notice.title);
    assert.ok(literals.has(notice.text), `${notice.title}: exact original content`);
  }
});

test('each activity returns its original card, title and narrative without changing saved-state rules', () => {
  const cases: [TownActivity, string][] = [['pray', '_dialogActPray'], ['dinner', '_dialogActEat'],
    ['party', '_dialogActParty'], ['eggs', '_dialogActEgg'], ['train', '_dialogActTrain'], ['taunt', '_dialogActTaunt']];
  const body = original.slice(original.indexOf('public function showEventDialog'));
  for (const [action, symbol] of cases) {
    const start = body.indexOf(`if(param1 == ${symbol})`), end = body.indexOf('if(param1 == ', start + 10);
    const branch = body.slice(start, end < 0 ? undefined : end), sim = town();
    const result = sim.performTownActivity(action); assert.equal(result.outcome, 'done', action);
    if (result.outcome !== 'done') throw new Error(action);
    assert.equal(result.notice.cardFrame, Number(branch.match(/card.gotoAndStop\((\d+)\)/)![1]));
    assert.equal(result.notice.title, decode(branch.match(/title.text = "((?:\\.|[^"\\])*)"/)![1]));
    const prefix = branch.match(/text.text = "((?:\\.|[^"\\])*)"/) ?? branch.match(/_loc6_ = "((?:\\.|[^"\\])*)"/);
    assert.ok(prefix, `Original text: ${action}`);
    assert.ok(result.notice.text.startsWith(decode(prefix[1])), action);
    assert.deepEqual(Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave()))).toSave(), sim.toSave());
  }
});

test('first and repeated Museum robbery notices describe the exact credited gold', () => {
  const sim = town();
  for (const again of [false, true]) {
    const gold = sim.state.gold, result = sim.robMuseumVisitors(); assert.equal(result.outcome, 'done');
    if (result.outcome !== 'done') throw new Error('Robbery failed.');
    assert.equal(result.notice.cardFrame, 6); assert.equal(result.notice.title, 'Slaughter!');
    assert.ok(result.notice.text.includes(`${sim.state.gold - gold} gold pieces`));
    assert.equal(result.notice.text.includes('AGAIN!'), again);
    assert.ok(original.includes(again ? "There\\'re only few people left in the museum but you manage to collect "
      : 'After you have slaughtered them all, you search the ground for money and collect '));
  }
});
