import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { createPartyAIState, refreshPartyAI, selectPartyTarget, stepPartyAIFrame, stepPartyAITimer,
  partyActorPosition, type PartyAIActor, type PartyAIContext, type PartyAIShared, type PartyAITarget, type PartyAICallbacks } from '../src/party-ai.ts';
import { advanceReload, reloadTimer, weaponStats } from '../src/combat-stats.ts';
import { ITEM_TYPE } from '../src/items.ts';
import { Simulation } from '../src/simulation.ts';
import type { PartyMember } from '../src/party.ts';

interface Operation { frames?: number; timers?: number; shoot?: boolean; select?: boolean }
interface Config { name: string; boundary: string; dev?: number; order?: number; prefix?: number[] }
interface AIEvent { type: string; slot?: number; uid?: number | null; weapon?: number; x?: number; y?: number;
  targetX?: number; targetY?: number; speed?: number; damage?: number; kind?: number;
  launched?: { startX: number; startY: number; targetX: number; targetY: number; speed: number; damage: number; actorSlot: number; weapon: number } }
type ReferenceActor = PartyAIActor & { member: NonNullable<PartyAIActor['member']> & { accuracyFix?: number } };
export interface PartyAIRecord {
  type: string; kind: string; clock?: string; controllerShoot?: string; shootBoundary?: string; ok?: boolean; snapshots?: number;
  scenario: string; boundary: string; config: Config; step: number; op: Operation | null;
  actor: ReferenceActor; world: { shared: PartyAIShared; targets: PartyAITarget[] };
  events: AIEvent[]; drawCount: number; rngState: number;
  display: { frame: number; x: number; y: number; accuracyDiv: number; shells: number };
}
interface Boundary { random(): number; fireActorAt(slot: number, x: number, y: number): boolean }

const SCENARIOS = [
  ...Array.from({ length: 9 }, (_, i) => `initial_class_${i + 1}`),
  ...Array.from({ length: 7 }, (_, i) => `order_${i}`),
  'work_roll_fails', 'acquire_skips_common', 'aim_then_shoot', 'dead_skips_common', 'boss_stale_range',
  'idle_manual_topup', 'auto_reload_same_timer', 'marked_dead_next_alert', 'militia_throw', 'militia_no_target',
  ...Array.from({ length: 9 }, (_, i) => `actual_shoot_class_${i + 1}`),
];

export interface PartyAIImplementations {
  frame?: typeof stepPartyAIFrame; timer?: typeof stepPartyAITimer; selector?: typeof selectPartyTarget;
}

export function comparePartyAITrace(records: PartyAIRecord[], implementation: PartyAIImplementations = {}) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'party-ai');
  assert.equal(ready.clock, 'manual-original-root-handlers'); assert.equal(ready.controllerShoot, 'record-only');
  assert.equal(ready.shootBoundary, 'actual-original-shoot-empty-collision-world');
  assert.equal(complete?.type, 'complete'); assert.equal(complete?.kind, 'party-ai'); assert.equal(complete?.ok, true);
  const snapshots = records.filter(row => row.type === 'snapshot');
  assert.equal(snapshots.length, 75); assert.equal(complete.snapshots, 75);
  assert.deepEqual(snapshots.filter(row => row.step === 0).map(row => row.scenario), SCENARIOS);
  let actor: ReferenceActor, world: PartyAIRecord['world'], context: PartyAIContext, simulation: Simulation;
  let rngState = 42, drawCount = 0, prefixIndex = 0, prefix: number[] = [], events: AIEvent[] = [];
  const random = () => {
    let value = rngState | 0; value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    rngState = value >>> 0; drawCount++;
    if (simulation) simulation.state.rng = rngState;
    return prefixIndex < prefix.length ? prefix[prefixIndex++] : rngState / 4294967296;
  };
  const reload = (current: PartyAIActor) => {
    events.push({ type: 'reload', slot: current.slot });
    if (current.weapon?.type === ITEM_TYPE.gun && !current.weapon.reloadTime)
      current.weapon.reloadTime = reloadTimer(current.weapon, current.member!.traits);
  };
  const callbacks: PartyAICallbacks = {
    shoot: current => { events.push({ type: 'shoot', slot: current.slot }); }, reload,
    reloading: current => {
      events.push({ type: 'reloading', slot: current.slot });
      const advanced = advanceReload(current.weapon!, current.member!.traits, current.member!.rampageTicks > 0);
      current.weapon!.ammo = advanced.ammo; current.weapon!.reloadTime = advanced.reloadTime;
      if (advanced.restarted) events.push({ type: 'reload', slot: current.slot });
    },
    endRampage: current => { events.push({ type: 'endRampage', slot: current.slot }); },
    throwMilitiaGrenade: (current, launch) => {
      const position = partyActorPosition(current.slot);
      events.push({ type: 'projectile', slot: current.slot, weapon: -1, x: position.x, y: position.y,
        targetX: launch.x, targetY: launch.y, speed: launch.speedBase, damage: launch.damage, kind: 0 });
    },
  };
  const comparisons = snapshots.map(row => {
    if (row.step === 0) {
      actor = structuredClone(row.actor); world = structuredClone(row.world);
      rngState = 42; drawCount = 0; prefixIndex = 0; prefix = row.config.prefix ?? [];
      context = { shared: world.shared, getTarget: uid => world.targets.find(target => target.uid === uid), random, heroSlot: 0, fireAtWill: false };
      if (row.boundary === 'initial') { actor.member.aiState = createPartyAIState(actor.slot); refreshPartyAI(actor); }
      if (row.boundary === 'shoot') {
        simulation = new Simulation(42);
        const member = { ...actor.member, accuracyFix: actor.member.accuracyFix ?? 0, bowDrawing: false } as PartyMember;
        const slot = simulation.state.party.slots[0];
        Object.assign(slot, { exists: actor.exists, member, weapon: actor.weapon }); actor.member = member;
        simulation.state.retainedAITargets = world.targets;
        simulation.state.enemies = []; simulation.state.projectiles = []; simulation.state.rng = 42;
        (simulation as unknown as Boundary).random = random;
      }
    }
    events = [];
    const launched: NonNullable<AIEvent['launched']>[] = [];
    if (row.step > 0) {
      if (row.op?.select) {
        const chosen = (implementation.selector ?? selectPartyTarget)(actor, actor.weapon!.range!, context!, row.config.order);
        events.push({ type: 'selected', uid: chosen?.uid ?? null });
      }
      for (let i = 0; i < (row.op?.frames ?? 0); i++) (implementation.frame ?? stepPartyAIFrame)(actor, context!, callbacks);
      for (let i = 0; i < (row.op?.timers ?? 0); i++) (implementation.timer ?? stepPartyAITimer)(actor, context!, callbacks);
      if (row.op?.shoot) {
        actor.member.shootTimer = 0; events.push({ type: 'shoot', slot: actor.slot });
        simulation!.events = [];
        const count = simulation!.state.projectiles.length;
        const target = context!.getTarget(actor.member.aiState!.targetUid!)!;
        (simulation! as unknown as Boundary).fireActorAt(actor.slot, Math.trunc(target.x), Math.trunc(target.y));
        for (const projectile of simulation!.state.projectiles.slice(count)) {
          launched.push({ startX: projectile.startX, startY: projectile.startY, targetX: projectile.targetX, targetY: projectile.targetY,
            speed: projectile.speed, damage: projectile.damage, actorSlot: projectile.actorSlot!, weapon: 40 + actor.slot });
        }
      }
    }
    const differences: { field: string; expected: unknown; actual: unknown }[] = [];
    const check = (field: string, actual: unknown, expected: unknown) => {
      if (!isDeepStrictEqual(actual, expected)) differences.push({ field, expected, actual });
    };
    // Захваченные начальные предметы/traits — вход. Далее состояние меняют только функции продукта.
    const actualMember = Object.fromEntries(Object.keys(row.actor.member).map(key => [key, actor.member[key as keyof typeof actor.member]]));
    check('actor', { ...actor, member: actualMember }, row.actor); check('world', world!, row.world);
    if (row.boundary === 'shoot') {
      check('events', events, row.events.filter(event => event.type !== 'projectile'));
      check('launched', launched, row.events.filter(event => event.type === 'projectile').map(event => event.launched));
    } else check('events', events, row.events);
    check('drawCount', drawCount, row.drawCount); check('rngState', rngState, row.rngState);
    const stats = weaponStats(actor.weapon!, actor.member.traits, { manualControl: false });
    check('derivedDisplay', { ...partyActorPosition(actor.slot), accuracyDiv: stats.accuracyDiv, shells: stats.shells },
      { x: row.display.x, y: row.display.y, accuracyDiv: row.display.accuracyDiv, shells: row.display.shells });
    return { scenario: row.scenario, step: row.step, matched: differences.length === 0, originalDrawCount: row.drawCount, portDrawCount: drawCount, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
