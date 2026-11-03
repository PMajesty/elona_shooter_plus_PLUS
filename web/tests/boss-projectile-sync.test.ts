import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Simulation } from '../src/simulation.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/boss-projectile-sync-v11.json', import.meta.url), 'utf8'));
const contact = JSON.parse(readFileSync(new URL('./fixtures/boss-projectile-contact.json', import.meta.url), 'utf8'));

test('a boss turn updates the geometry seen by an existing projectile, with a stale-pose negative control', () => {
  assert.equal(contact.format, 'elona-boss-projectile-contact');
  assert.equal(contact.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  // Не принимаем старую точку после замены атласов или исходных матриц без повторного извлечения.
  for (const [path, expected] of Object.entries(contact.assetSha256)) {
    const data = readFileSync(new URL(`../public/assets/${path}`, import.meta.url));
    const bytes = path.endsWith('.json') ? data.toString('utf8').replaceAll('\r\n', '\n') : data;
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, path);
  }
  assert.deepEqual(contact.samples.map((sample: {hit: boolean}) => sample.hit), [false, true]);
  assert.equal(contact.stableNeighborSamples, 9);
  const original = structuredClone(fixture.simulation);
  const outcomes = [];
  for (const mode of ['synchronized', 'stale'] as const) {
    const calls: {x: number; y: number; hit: boolean}[] = [];
    const simulation = Simulation.fromSave(fixture.simulation, {
      hitTest(enemy, x, y) {
        assert.equal(enemy.kind, 'boss'); assert.equal(enemy.appearance, contact.appearance);
        assert.deepEqual({x, y}, contact.point);
        // Точка вычислена Python/Pillow по исходным данным, а не по результату симуляции.
        const pose = mode === 'stale' ? contact.samples[0].pose : {x: enemy.x, y: enemy.y, frame: enemy.frame, facing: enemy.bossFacing};
        const sample = contact.samples.find((candidate: {pose: typeof pose}) => candidate.pose.x === pose.x && candidate.pose.y === pose.y && candidate.pose.frame === pose.frame && candidate.pose.facing === pose.facing);
        assert.ok(sample, 'The collision callback must observe a recorded before/after pose.');
        calls.push({x, y, hit: sample.hit});
        return sample.hit;
      },
    });
    assert.equal(simulation.state.enemies[0].hp, 225);
    assert.deepEqual({x: simulation.state.enemies[0].x, y: simulation.state.enemies[0].y, frame: simulation.state.enemies[0].frame, facing: simulation.state.enemies[0].bossFacing}, contact.samples[0].pose);
    simulation.tick();
    assert.equal(calls.length, 1);
    assert.deepEqual({x: simulation.state.enemies[0].x, y: simulation.state.enemies[0].y, frame: simulation.state.enemies[0].frame, facing: simulation.state.enemies[0].bossFacing}, contact.samples[1].pose);
    outcomes.push({mode, hp: simulation.state.enemies[0].hp, projectiles: simulation.state.projectiles.length, hits: simulation.events.filter(event => event.type === 'hit').map(event => event.amount), calls});
  }
  assert.deepEqual(fixture.simulation, original);
  assert.deepEqual(outcomes, [
    {mode: 'synchronized', hp: 185, projectiles: 0, hits: [40], calls: [{x: 191, y: 212, hit: true}]},
    {mode: 'stale', hp: 225, projectiles: 1, hits: [], calls: [{x: 191, y: 212, hit: false}]},
  ]);
});
