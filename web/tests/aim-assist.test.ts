import test from 'node:test';
import assert from 'node:assert/strict';
import { assistedAim, AIM_ASSIST_MAX_NUDGE, type AimHitTest } from '../src/aim-assist.ts';
import { readFileSync } from 'node:fs';
import { ordinaryEnemyHit, type CollisionGeometry } from '../src/collision.ts';
import { Simulation } from '../src/simulation.ts';
import { castleSisterHit } from '../src/castle-sister.ts';
import { pauseStatistics } from '../src/game-options.ts';
import { translateText } from '../src/i18n.ts';
import { GAME_MODS } from '../src/game-mods.ts';

const circle = (x: number, y: number, radius = 10): AimHitTest => (px, py) => Math.hypot(px - x, py - y) <= radius;
function battle(enabled = true): Simulation {
  const sim = new Simulation(42, { mods: enabled ? { aimAssist: true } : undefined });
  sim['spawnEnemy']('sheep');
  Object.assign(sim.state.enemies[0], { x: 300, y: 240, speed: 0, speedOrg: 0, shadowHit: false });
  return sim;
}

test('a small near miss receives help; correction is capped and fades before distant targets', () => {
  const targets = circle(300, 240);
  const helped = assistedAim({ x: 287, y: 240 }, targets);
  assert.ok(targets(helped.x, helped.y));
  assert.ok(helped.x - 287 <= AIM_ASSIST_MAX_NUDGE);
  const nearer = assistedAim({ x: 282, y: 240 }, targets).x - 282;
  const farther = assistedAim({ x: 279, y: 240 }, targets).x - 279;
  assert.ok(farther > 0 && farther < nearer);
  assert.deepEqual(assistedAim({ x: 260, y: 240 }, targets), { x: 260, y: 240 });
});

test('valid aim stays untouched; the nearest silhouette wins without snapping to its centre', () => {
  const raw = { x: 300, y: 240 };
  assert.deepEqual(assistedAim(raw, circle(300, 240)), raw);
  const near = circle(314, 240), far = circle(283, 240);
  const forward = assistedAim(raw, (x, y) => far(x, y) || near(x, y));
  assert.deepEqual(forward, assistedAim(raw, (x, y) => near(x, y) || far(x, y)));
  assert.ok(forward.x > raw.x && forward.x <= raw.x + AIM_ASSIST_MAX_NUDGE);
  assert.equal(forward.y, raw.y);
  assert.deepEqual(assistedAim(raw, () => false), raw);
});

test('original animated sheep silhouettes receive help from above as well as the sides', () => {
  const geometry: CollisionGeometry = JSON.parse(readFileSync(new URL('../public/assets/collision-geometry.json', import.meta.url), 'utf8'));
  const sim = new Simulation(42, { mods: { aimAssist: true }, hitTest: (enemy, x, y) => ordinaryEnemyHit({ ...enemy, kind: 'sheep' }, x, y, geometry) });
  sim['spawnEnemy']('sheep');
  Object.assign(sim.state.enemies[0], { x: 300, y: 240, frame: 5, shadowHit: false });
  for (const raw of [{ x: 300, y: 236 }, { x: 285, y: 245 }]) {
    assert.equal(sim['hitEnemy'](sim.state.enemies[0], raw.x, raw.y), false);
    const aim = sim.manualAim(raw.x, raw.y);
    assert.ok(sim['hitEnemy'](sim.state.enemies[0], aim.x, aim.y));
    assert.ok(Math.hypot(aim.x - raw.x, aim.y - raw.y) <= AIM_ASSIST_MAX_NUDGE);
  }
});

test('opt-in manual aim uses collision silhouettes and excludes dead/removed targets', () => {
  const sim = battle(), raw = { x: 277, y: 237.5 }, before = sim.toSave();
  const aim = sim.manualAim(raw.x, raw.y);
  assert.ok(aim.x > raw.x && aim.x - raw.x <= AIM_ASSIST_MAX_NUDGE);
  assert.deepEqual(sim.toSave(), before);
  assert.deepEqual(sim.manualAim(310, 240), { x: 310, y: 240 });
  assert.deepEqual(battle(false).manualAim(raw.x, raw.y), raw);
  sim.state.enemies[0].hp = 0;
  assert.deepEqual(sim.manualAim(raw.x, raw.y), raw);
  sim.state.enemies[0].hp = 42; sim.state.enemies[0].removed = true;
  assert.deepEqual(sim.manualAim(raw.x, raw.y), raw);
  const silhouettes = new Simulation(42, { mods: { aimAssist: true }, hitTest: () => false });
  silhouettes.state.enemies = before.enemies;
  assert.deepEqual(silhouettes.manualAim(raw.x, raw.y), raw);
  const automatic = battle();
  automatic.state.heroSettings = { ...automatic.heroSettings, order: 0 };
  assert.deepEqual(automatic.manualAim(raw.x, raw.y), raw);
});

test('both flying Sisters and the living castle Sister can receive the same small correction', () => {
  const sim = new Simulation(42, { mods: { aimAssist: true } });
  sim['spawnEnemy']('sister-bomb');
  Object.assign(sim.state.enemies[0], { x: 300, y: 200 });
  assert.ok(sim.manualAim(287, 200).x > 287);
  const near = Array.from({ length: 20 }, (_, i) => 576 + i).find(x => {
    const aim = sim.manualAim(x, 97);
    return !castleSisterHit(4, x, 97) && castleSisterHit(4, aim.x, aim.y);
  });
  assert.notEqual(near, undefined);
  sim.state.castleSister = { frame: 72, free: true, dead: true };
  assert.deepEqual(sim.manualAim(near!, 97), { x: near, y: 97 });
});

test('tick fires at the displayed correction once, with no cumulative drift or extra random draws', () => {
  const sim = battle(), expected = sim.manualAim(277, 237.5), control = Simulation.fromSave(sim.toSave());
  delete control.state.mods;
  sim.tick({ aimX: 277, aimY: 237.5, firePressed: true });
  control.tick({ aimX: expected.x, aimY: expected.y, firePressed: true });
  assert.deepEqual(sim.events, control.events);
  const { mods: _mods, ...assisted } = sim.toSave();
  assert.deepEqual(assisted, control.toSave());
  for (let i = 0; i < 5; i++) sim.tick();
  assert.deepEqual({ x: sim.state.aimX, y: sim.state.aimY }, expected);
  sim.tick({ aimX: 277, aimY: 237.5 });
  assert.deepEqual({ x: sim.state.aimX, y: sim.state.aimY }, sim.manualAim(277, 237.5));
});

test('save/load retains the MOD and seeded continuation, while old saves stay unassisted', () => {
  const sim = battle(); sim.tick({ aimX: 277, aimY: 237.5 });
  const loaded = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
  assert.equal(loaded.state.mods?.aimAssist, true);
  for (let i = 0; i < 120; i++) {
    const input = { aimX: 277 + i / 30, aimY: 237.5, fireHeld: i % 30 < 15 };
    sim.tick(input); loaded.tick(input); assert.deepEqual(loaded.events, sim.events);
  }
  assert.deepEqual(loaded.toSave(), sim.toSave());
  assert.equal(Simulation.fromSave(battle(false).toSave()).state.mods, undefined);
  assert.match(pauseStatistics(sim.state), /Mod\(Aim Assist\) is on\./);
  assert.equal(translateText(GAME_MODS.aimAssist.name, 'ru'), 'Помощь в прицеливании');
  assert.doesNotMatch(translateText(GAME_MODS.aimAssist.label, 'ru'), /Aim Assist/);
});

test('companions keep their unmodified firing behaviour', () => {
  const sim = new Simulation(42, { heroClass: 'rogue', mods: { aimAssist: true } });
  const control = Simulation.fromSave(sim.toSave()); delete control.state.mods;
  sim['fireActorAt'](1, 300, 240); control['fireActorAt'](1, 300, 240);
  assert.deepEqual(sim.events, control.events);
  const { mods: _mods, ...assisted } = sim.toSave();
  assert.deepEqual(assisted, control.toSave());
});
