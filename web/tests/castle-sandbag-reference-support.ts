import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation, type EnemyState, type SimulationEvent } from '../src/simulation.ts';
import { castleUpgradeCost, castleUpkeep, castleDamageMultiplier, type CastleUpgradeOutcome } from '../src/castle-upgrades.ts';
import { partySkills } from '../src/party-progression.ts';
import { createPartyAIState } from '../src/party-ai.ts';
import type { PartyMember } from '../src/party.ts';

type Row = Record<string, any>;
type Boundary = { random(): number; spawnEnemy(kind: 'sheep'): void; damageCastle(amount: number, attacker?: EnemyState): void; finishDay(): void };
export interface SandbagReferenceActions {
  damage?: (simulation: Simulation, amount: number, attacker: EnemyState | undefined, original: () => void) => void;
  purchase?: (simulation: Simulation) => CastleUpgradeOutcome;
}
const damageScenarios = ['unupgraded', 'first-level', 'first-level-medal', 'maximum-medal', 'minimum-one', 'typed-input',
  'maximum-no-medal', 'insurance-before-defender', 'guardian-before-defender', 'guardian-then-last-hope', 'last-hope-low', 'protection-before-all'];
const townScenarios = ['sandbag-insufficient', 'sandbag-first', 'sandbag-second', 'sandbag-sequence', 'sandbag-final', 'sandbag-cap'];
const enemyFields = ['x', 'y', 'hp', 'attack', 'speed', 'speedOrg', 'knockBack', 'attacking', 'attacked', 'drop', 'deathTicks', 'frame', 'shadowHit'];
const pick = (row: Row, keys: string[]) => Object.fromEntries(keys.map(key => [key, row[key]]));
const differences = (actual: Row, expected: Row) => Object.entries(actual).filter(([key, value]) => !isDeepStrictEqual(value, expected[key]))
  .map(([field, value]) => ({ field, actual: value, expected: expected[field] }));

function compareDamage(row: Row, action: SandbagReferenceActions['damage']) {
  const before = row.before, config = row.config, simulation = new Simulation(42), state = simulation.state;
  const boundary = simulation as unknown as Boundary;
  boundary.spawnEnemy('sheep'); const enemy = state.enemies[0];
  Object.assign(enemy, pick(before.enemy, enemyFields), { removed: before.enemy.free });
  const hero = before.actors[0], source = before.actors[1];
  Object.assign(state.player, { traits: { ...hero.traits }, rampageTicks: hero.rampageTicks, level: hero.level,
    exp: hero.exp, skillPoints: hero.skillPoints, weaponExp: [...hero.weaponExp] });
  const member: PartyMember = { ...structuredClone(source), sex: 0, name: 'Captured Guard', trained: 0,
    optBoss: true, optWall: true, cost: 0, ai: 0, bowDrawing: false, aiState: createPartyAIState(1) };
  Object.assign(state.party.slots[0], { exists: source.exists, member });
  state.partySkills = partySkills([state.player, ...(source.exists ? [member] : [])]);
  Object.assign(state, { castleHp: before.castleHp, castleMaxHp: before.castleMaxHp, gold: before.gold,
    totalMoney: before.totalMoney, sandbagLevel: before.sandbagLevel, rng: 3735928559 });
  state.activeMission.absorbFix = before.absorbFix; state.protection.counter = before.protection;
  const draws: Row[] = [], damageEvents: Row[] = [];
  let prefixIndex = 0;
  boundary.random = () => {
    let value = state.rng | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    state.rng = value >>> 0;
    const result = prefixIndex < (config.prefix?.length ?? 0) ? config.prefix[prefixIndex++] : state.rng / 4294967296;
    draws.push({ index: draws.length + 1, state: state.rng, value: result }); return result;
  };
  simulation.events = [];
  const push = simulation.events.push.bind(simulation.events); let hpBefore = enemy.hp;
  simulation.events.push = (...events: SimulationEvent[]) => {
    for (const event of events) if (event.type === 'hit') {
      damageEvents.push({ enemyId: 3, damage: event.amount, critType: event.criticalType ?? Number(event.critical), hpBefore,
        x: event.x, y: event.y, actorSlot: event.actorSlot ?? 0, drawCount: draws.length });
      hpBefore -= event.amount!;
    }
    return push(...events);
  };
  const project = () => ({
    actors: [state.player, member].map((actor, index) => ({ exists: index === 0 || state.party.slots[0].exists,
      traits: actor.traits, rampageTicks: actor.rampageTicks })),
    party: state.partySkills, enemy: pick(enemy, enemyFields), castleHp: state.castleHp, castleMaxHp: state.castleMaxHp,
    gold: state.gold, totalMoney: state.totalMoney, sandbagLevel: state.sandbagLevel,
    multiplier: castleDamageMultiplier(state), absorbFix: state.activeMission.absorbFix, protection: state.protection.counter,
  });
  const expectedState = (value: Row) => ({ ...pick(value, ['party', 'castleHp', 'castleMaxHp', 'gold', 'totalMoney', 'sandbagLevel', 'multiplier', 'absorbFix', 'protection']),
    actors: value.actors.map((actor: Row) => pick(actor, ['exists', 'traits', 'rampageTicks'])), enemy: pick(value.enemy, enemyFields) });
  const actualBefore = project();
  (action ?? ((_simulation, _amount, _attacker, original) => original()))(simulation, config.damage, config.guardian ? enemy : undefined,
    () => boundary.damageCastle(config.damage, config.guardian ? enemy : undefined));
  return differences({ before: actualBefore, after: project(), damageEvents, draws, drawCount: draws.length, rngState: state.rng,
    defendEvents: simulation.events.filter(event => event.type === 'defend').length },
  { before: expectedState(row.before), after: expectedState(row.after), damageEvents: row.damageEvents,
    draws: row.draws, drawCount: row.drawCount, rngState: row.rngState, defendEvents: row.order.filter((event: Row) => event.event === 'defend').length });
}

function makeTown(before: Row): Simulation {
  const simulation = new Simulation(42);
  (simulation as unknown as Boundary).finishDay();
  while (simulation.state.postbattle !== 'result') {
    if (simulation.state.postbattle === 'skill') simulation.chooseSkill(simulation.state.skillChoices[0]);
    else simulation.finishLoot();
  }
  assert.equal(simulation.enterTown(), true);
  Object.assign(simulation.state, { castleHp: before.hp, castleMaxHp: before.maxHp, gold: before.gold,
    totalMoney: before.totalMoney, sandbagLevel: before.sandbagLevel, rng: before.rngState });
  simulation.state.town!.ap = before.ap;
  return simulation;
}

export function compareCastleSandbagTrace(records: Row[], actions: SandbagReferenceActions = {}) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.version, 1); assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'castle-sandbag');
  assert.equal(ready.clock, 'synchronous-original-damage-and-town-input'); assert.equal(ready.rng, 'xorshift32-with-declared-prefix');
  assert.equal(ready.seed, 3735928559); assert.equal(ready.continuedTownEntry, true);
  assert.equal(ready.guardianTarget, 'original-nonlethal-sheep'); assert.equal(ready.damageCases, 12);
  assert.equal(complete?.type, 'complete'); assert.equal(complete.kind, 'castle-sandbag'); assert.equal(complete.ok, true);
  assert.equal(complete.snapshots, 25); assert.equal(complete.damageCases, 12); assert.equal(complete.townCases, 6);
  const snapshots = records.filter(row => row.type === 'snapshot'); assert.equal(snapshots.length, 25);
  assert.deepEqual([...new Set(snapshots.map(row => row.scenario))], [...damageScenarios, ...townScenarios]);
  const comparisons = snapshots.filter(row => row.boundary === 'damage').map(row => {
    const mismatch = compareDamage(row, actions.damage);
    return { scenario: row.scenario as string, boundary: 'damage', op: 'damage', matched: mismatch.length === 0, differences: mismatch };
  });
  for (const scenario of townScenarios) {
    const rows = snapshots.filter(row => row.scenario === scenario), before = rows[0];
    assert.equal(before.op, 'before'); assert.equal(before.drawCount, 0); assert.equal(before.rngState, 42);
    const simulation = makeTown(before), state = simulation.state, methods = simulation as unknown as Boundary;
    const invariant = structuredClone({ town: state.town, party: state.party, result: state.result, cache: state.partySkills,
      activeMission: state.activeMission, wallLevel: state.wallLevel, wallFixCount: state.wallFixCount, repairmanLevel: state.repairmanLevel });
    let draws = 0; const random = methods.random.bind(simulation); methods.random = () => { draws++; return random(); };
    for (const [index, row] of rows.entries()) {
      let outcome: CastleUpgradeOutcome | undefined, expectedOutcome: CastleUpgradeOutcome | undefined;
      if (index > 0) {
        assert.equal(row.op, 'click'); const previous = rows[index - 1];
        expectedOutcome = row.gold !== previous.gold ? 'purchased' : previous.tile.cost === 0 ? 'capped' : 'not-enough-gold';
        outcome = (actions.purchase ?? (value => value.buyCastleUpgrade('sandbag')))(simulation);
      }
      const cost = castleUpgradeCost('sandbag', state), possible = cost > 0 && cost <= state.gold;
      const actual = { sandbagLevel: state.sandbagLevel, hp: state.castleHp, maxHp: state.castleMaxHp, gold: state.gold,
        ap: state.town!.ap, totalMoney: state.totalMoney, upkeep: castleUpkeep(state), upkeepText: String(castleUpkeep(state)),
        multiplier: castleDamageMultiplier(state), tile: { cost, possible, name: `Sandbag${state.sandbagLevel ? ` Lv ${state.sandbagLevel}` : ''}`,
          priceText: String(cost), mouseEnabled: possible }, dialog: false, eventDialog: false, drawCount: draws, rngState: state.rng, outcome };
      const { hint: _hint, ...tile } = row.tile;
      const mismatch = differences(actual, { ...row, tile, outcome: expectedOutcome });
      const afterInvariant = { town: state.town, party: state.party, result: state.result, cache: state.partySkills,
        activeMission: state.activeMission, wallLevel: state.wallLevel, wallFixCount: state.wallFixCount, repairmanLevel: state.repairmanLevel };
      if (!isDeepStrictEqual(invariant, afterInvariant)) mismatch.push({ field: 'unrelatedState', actual: afterInvariant, expected: invariant });
      comparisons.push({ scenario, boundary: 'town', op: row.op, matched: mismatch.length === 0, differences: mismatch });
    }
  }
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const,
    observedSnapshots: 25, damageCases: 12, townStartingStates: 6, townTransactions: 7,
    matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
