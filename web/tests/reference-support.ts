import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation.ts';

export interface ReferenceRecord {
  type: string; version: number; scenario?: string; op?: string; step?: number;
  ammo?: number; reloadTicks?: number; rampage?: number; paused?: boolean;
  frame?: number; sounds?: string[]; animations?: { method: string; target: string | number }[];
  ammoMax?: number; reloadTimeMax?: number; reloadSkill?: number; weaponId?: number;
  manualReload?: boolean; autoReload?: number; ok?: boolean; snapshots?: number;
}

export function compareReloadTrace(records: ReferenceRecord[], omitIntermediateFeedback = false) {
  const ready = records.find(record => record.type === 'ready');
  assert.ok(ready, 'The original did not identify its fixture.');
  assert.equal(ready.weaponId, 3); assert.equal(ready.ammoMax, 5);
  assert.equal(ready.reloadTimeMax, 6); assert.equal(ready.reloadSkill, 0);
  assert.equal(ready.manualReload, true); assert.equal(ready.autoReload, 0);
  const completed = records.at(-1);
  assert.equal(completed?.type, 'complete'); assert.equal(completed.ok, true);
  const observed = records.filter(record => record.type === 'snapshot');
  assert.equal(observed.length, completed.snapshots);
  const cases = new Set<string>();
  let simulation: Simulation | undefined;
  let paused = false;
  const comparison: { scenario: string; op: string; step: number; matched: boolean }[] = [];
  for (const record of observed) {
    assert.equal(record.version, 1);
    assert.equal(typeof record.scenario, 'string');
    const label = `${record.scenario}/${record.op}/${record.step}`;
    if (record.op === 'initial') {
      assert.ok(!cases.has(record.scenario!), `Duplicate fixture: ${label}`);
      cases.add(record.scenario!);
      simulation = new Simulation(42);
      // Одинаковые входные условия; последующие результаты берутся только из оригинального SWF.
      simulation.state.player.ammo = record.ammo!;
      simulation.state.player.rampageTicks = record.rampage!;
      simulation.state.newWave = false;
      simulation.state.spawnTimer = 100000;
      paused = false;
    }
    assert.ok(simulation, `Operation without initial fixture: ${label}`);
    simulation.events = [];
    switch (record.op) {
      case 'initial': break;
      case 'reload': assert.equal(simulation.requestReload(), true, label); break;
      case 'cancel': simulation.fireAt(300, 240); break;
      case 'pause': paused = true; break;
      case 'resume': paused = false; break;
      case 'timer':
      case 'paused_timer':
      case 'resumed_timer':
        // Только тестовый адаптер: та же граница Timer(50), без добавления кадров между вызовами.
        if (!paused) (simulation as unknown as { timerTick(): void }).timerTick();
        break;
      default: throw new Error(`Unknown original operation: ${label}`);
    }
    const expected = { ammo: record.ammo, reloadTicks: record.reloadTicks, rampage: record.rampage, paused: record.paused };
    const actual = { ammo: simulation.state.player.ammo, reloadTicks: simulation.state.player.reloadTicks, rampage: simulation.state.player.rampageTicks, paused };
    assert.deepEqual(actual, expected, `${label}: state differs from original`);
    let intents = simulation.events.filter(event => event.type === 'reload' || event.type === 'reloaded');
    if (omitIntermediateFeedback && record.op === 'timer') intents = intents.filter(event => event.type !== 'reload');
    const sounds = intents.map(event => event.type === 'reload' ? 'sound_reloading2' : 'sound_reloaded2');
    const animations = intents.map(event => event.type === 'reload' ? { method: 'gotoAndPlay', target: 'reload' } : { method: 'gotoAndStop', target: 109 });
    // Сравниваются намерения отображения; реальные кадры и аудиовывод проверяются отдельно в браузере.
    assert.deepEqual(sounds, record.sounds, `${label}: sound intents differ from original`);
    assert.deepEqual(animations, record.animations, `${label}: animation intents differ from original`);
    comparison.push({ scenario: record.scenario!, op: record.op!, step: record.step!, matched: true });
  }
  assert.deepEqual([...cases], ['empty_reload', 'cancel_before_shell', 'cancel_after_shell', 'pause_gate', 'rampage_reload']);
  return { scenarios: cases.size, matchedSnapshots: comparison.length, comparison };
}
