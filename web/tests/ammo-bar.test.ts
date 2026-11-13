import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ammoBarRatio, reloadTimer } from '../src/combat-stats.ts';
import { ItemFactory } from '../src/items.ts';
import { Simulation } from '../src/simulation.ts';

const idle = { aimX: 300, aimY: 240, firePressed: false, fireReleased: false, fireHeld: false };

/** Пустой магазин, перезарядка, длина полосы на каждом кадре до конца перезарядки. */
function reloadBar(weaponId: number) {
  const sim = new Simulation(5, { heroClass: 'rogue', ruleset: 'classic' });
  const weapon = new ItemFactory(() => 0.5).generate(weaponId);
  weapon.ammo = 0;
  sim.state.inventory[0] = weapon; sim.state.player.selectedSlot = 0; sim.state.enemies = [];
  sim.tick({ ...idle, reload: true });
  const total = reloadTimer(weapon, sim.state.player.traits);
  const bars: number[] = [];
  for (let frame = 0; frame < 2000 && sim.state.inventory[0]!.reloadTime > 0; frame++) {
    bars.push(ammoBarRatio(sim.state.inventory[0], sim.state.player.traits));
    sim.state.enemies = [];
    sim.tick(idle);
  }
  bars.push(ammoBarRatio(sim.state.inventory[0], sim.state.player.traits));
  return { bars, total, item: sim.state.inventory[0]! };
}

test('a magazine reload fills the ammo bar from empty to full, one step per reload tick like the original', () => {
  const { bars, total, item } = reloadBar(1);
  assert.ok(bars[0] < 0.1, `starts nearly empty (${bars[0]})`);
  // Таймер оригинала 20 Гц, кадры порта 30 Гц: два шага на три кадра, но полоса никогда не уменьшается.
  for (let i = 1; i < bars.length; i++) assert.ok(bars[i] >= bars[i - 1], `never shrinks (${bars[i - 1]} → ${bars[i]})`);
  assert.equal(new Set(bars).size, total + 1, 'one bar length for every remaining reload step, plus the full bar');
  assert.equal(bars.at(-1), 1);
  assert.equal(item.ammo, item.ammoMax);
});

test('a single-round reload grows the bar by one round at a time', () => {
  const { bars, item } = reloadBar(3);
  assert.equal(bars[0], 0);
  assert.deepEqual([...new Set(bars)], Array.from({ length: item.ammoMax + 1 }, (_, n) => n / item.ammoMax));
});

test('outside reloading the bar shows the remaining ammo', () => {
  const weapon = new ItemFactory(() => 0.5).generate(1);
  weapon.ammo = 3;
  assert.equal(ammoBarRatio(weapon, {}), 3 / weapon.ammoMax);
  assert.equal(ammoBarRatio(null, {}), 0);
});
