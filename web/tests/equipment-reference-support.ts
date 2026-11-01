import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { Simulation, type Input } from '../src/simulation.ts';
import type { Item } from '../src/items.ts';
import { createSheriffTraits } from '../src/progression.ts';
import { weaponPresentation } from '../src/combat-stats.ts';

interface EquipmentInput extends Input { frames: number }
interface OriginalState {
  selectedSlot: number; inventory: Record<string, unknown>[]; itemCooldowns: number[];
  shootTimer: number; shooting: boolean; accuracyFix: number; rampage: number;
  castleHp: number; timerRemainder: number; held: boolean;
  anime1: number; anime2: number; anime3: number;
  frame: number; burst: number; chain: number; chainMode: number; chainPos: number; grenadeCount: number;
}
export interface EquipmentRecord {
  type: string; version: number; kind: string; seed?: number; scenarios?: number; snapshots?: number;
  clock?: string; inputSeam?: string; world?: string; ok?: boolean;
  scenario?: string; step?: number; input?: EquipmentInput | null;
  config?: { name: string; ops: EquipmentInput[] };
  state?: OriginalState; drawCount?: number; rngState?: number;
}
const SCENARIOS = ['switch_preserves_cooldown', 'same_slot_cancels', 'empty_and_sixth_ignored', 'unmet_skill_selected', 'non_gun_selected', 'space_cooldown_guard', 'full_space_ignored', 'manual_cancel', 'magazine_queues', 'automatic_hold_release', 'semi_hold_does_not_repeat', 'switch_while_held', 'auto_reload_while_firing', 'auto_reload_idle_threshold', 'empty_trigger_reload', 'consumable_preserves_selection'];
const ITEM_FIELDS: (keyof Item)[] = ['num', 'id', 'graphic', 'type', 'reloadTime', 'reloadTimeMax', 'ammo', 'ammoMax', 'value', 'mod', 'modMax', 'shell', 'manualReload', 'automatic', 'modText', 'lv', 'typeMinor', 'special', 'leech', 'impact', 'shootRate', 'rare', 'autoReload', 'livingWeapon', 'name', 'baseAccuracy', 'accuracyDec', 'attack', 'dmgAir', 'dmgArmor', 'reqTrait', 'reqLv', 'range'];

export function compareEquipmentTrace(records: EquipmentRecord[]) {
  const ready = records[0], complete = records.at(-1);
  assert.equal(ready.type, 'ready'); assert.equal(ready.kind, 'equipment'); assert.equal(ready.version, 1);
  assert.equal(ready.seed, 42); assert.equal(ready.scenarios, SCENARIOS.length);
  assert.equal(ready.clock, 'manual-original-handlers-frame-then-20-over-30-timer');
  assert.equal(ready.inputSeam, 'mouse-coordinate-reads-only'); assert.equal(ready.world, 'empty-no-hits');
  assert.equal(complete?.type, 'complete'); assert.equal(complete?.kind, 'equipment'); assert.equal(complete?.ok, true);
  const snapshots = records.filter(record => record.type === 'snapshot');
  assert.equal(snapshots.length, complete.snapshots);
  assert.deepEqual(snapshots.filter(row => row.step === 0).map(row => row.scenario), SCENARIOS);
  let simulation: Simulation | undefined;
  let drawCount = 0;
  const comparisons = snapshots.map(record => {
    assert.ok(record.state && record.config && record.scenario);
    const expected = record.state;
    if (record.step === 0) {
      simulation = new Simulation(42);
      const state = simulation.state;
      // Независимо снятое исходное состояние — вход; последующие кадры выполняет обычный Simulation.tick.
      state.inventory = expected.inventory.map(item => Object.fromEntries(Object.entries(item).filter(([, value]) => value !== null)) as unknown as Item);
      state.player.traits = { ...createSheriffTraits(), 105: 8, 900: 1, 901: 1 };
      Object.assign(state.player, { selectedSlot: expected.selectedSlot, shootTimer: expected.shootTimer, accuracyFix: expected.accuracyFix, rampageTicks: expected.rampage });
      state.itemCooldowns = [...expected.itemCooldowns]; state.castleHp = expected.castleHp;
      state.fireHeld = expected.held; state.pendingShot = expected.shooting; state.timerRemainder = expected.timerRemainder;
      state.enemies = []; state.projectiles = []; state.waveIndex = 4; state.newWave = false; state.spawnTimer = 100000;
      state.aimX = 500; state.aimY = 180; state.rng = 42;
      drawCount = 0;
      const boundary = simulation as unknown as { random(): number };
      const random = boundary.random.bind(simulation);
      boundary.random = () => { drawCount++; return random(); };
    } else {
      assert.ok(simulation && record.input);
      const { frames, ...input } = record.input;
      if (frames === 0) {
        if (input.slot !== undefined) simulation.useSlot(input.slot);
        if (input.reload) simulation.requestReload();
        assert.ok(!input.firePressed, 'Zero-frame samples only use slot/Space handlers.');
        // В исходнике физическая кнопка и отложенное действие различаются; отпускание очищает только действие.
        if (!input.fireHeld && simulation.state.fireHeld) simulation.state.pendingShot = false;
        simulation.state.fireHeld = Boolean(input.fireHeld);
      } else {
        for (let frame = 0; frame < frames; frame++) simulation.tick(frame === 0 ? input : { fireHeld: input.fireHeld });
      }
    }
    assert.ok(simulation);
    const state = simulation.state, selected = state.inventory[state.player.selectedSlot];
    const presentation = weaponPresentation(selected!.id);
    const actual = {
      selectedSlot: state.player.selectedSlot,
      inventory: state.inventory.map(item => Object.fromEntries(ITEM_FIELDS.map(field => [field, item?.[field] ?? null]))),
      itemCooldowns: state.itemCooldowns, shootTimer: state.player.shootTimer, shooting: state.pendingShot,
      accuracyFix: state.player.accuracyFix, rampage: state.player.rampageTicks, castleHp: state.castleHp,
      timerRemainder: state.timerRemainder, held: state.fireHeld,
      anime1: presentation.shootFrame, anime2: presentation.idleFrame, anime3: presentation.endFrame,
    };
    const differences: { field: string; expected: unknown; actual: unknown }[] = [];
    const check = (field: string, a: unknown, e: unknown) => { if (!isDeepStrictEqual(a, e)) differences.push({ field, expected: e, actual: a }); };
    for (const field of Object.keys(actual) as (keyof typeof actual)[]) check(field, actual[field], expected[field]);
    check('drawCount', drawCount, record.drawCount); check('rngState', state.rng, record.rngState);
    return { scenario: record.scenario, step: record.step!, matched: differences.length === 0, originalDrawCount: record.drawCount!, portDrawCount: drawCount, differences };
  });
  return { status: comparisons.every(row => row.matched) ? 'passed' as const : 'failed' as const, matchedSnapshots: comparisons.filter(row => row.matched).length, comparisons };
}
