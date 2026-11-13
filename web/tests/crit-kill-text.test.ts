import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CRIT_KILL_FRAMES, critKillFrame, critKillMessage } from '../src/crit-kill-text.ts';
import { ENEMIES } from '../src/content.ts';
import { Simulation } from '../src/simulation.ts';
import { translateText } from '../src/i18n.ts';

test('critical kill messages follow the original critMsg/critArray tables', () => {
  const byKind = (kind: keyof typeof ENEMIES) => critKillMessage(1, ENEMIES[kind].id);
  assert.equal(byKind('archer'), 'HEAD  SHOT!');
  assert.equal(byKind('sheep'), 'HEAD  SHOT!');
  assert.equal(byKind('ogre'), 'LIMB  SHOT!');
  assert.equal(byKind('cata'), 'CORE  SHOT!');
  assert.equal(byKind('tank'), 'CORE  SHOT!');
  assert.equal(byKind('spider'), 'ABDOMEN SHOT!');
  assert.equal(byKind('knight'), 'TORSO  SHOT!');
  assert.equal(byKind('chicken'), 'TORSO  SHOT!');
  assert.equal(critKillMessage(1, ENEMIES.boss.id), '', 'the boss id is outside critArray, so the original shows nothing');
  assert.equal(critKillMessage(2, ENEMIES.boss.id), 'CRITICAL KILL!');
  assert.equal(critKillMessage(3, ENEMIES.rat.id), 'ONE HIT KILL!');
  assert.equal(critKillMessage(0, ENEMIES.rat.id), '');
  for (const message of ['HEAD  SHOT!', 'CRITICAL KILL!', 'ONE HIT KILL!']) assert.notEqual(translateText(message, 'ru'), message);
});

test('the text rises 0.5 per frame and fades out over the last frames, like onEnterFrame_critKill', () => {
  assert.equal(CRIT_KILL_FRAMES, 20);
  assert.deepEqual(critKillFrame(1), { offsetY: -0.5, alpha: 0.8 });
  assert.deepEqual(critKillFrame(12), { offsetY: -6, alpha: 0.8 });
  assert.ok(Math.abs(critKillFrame(13).alpha - 0.7) < 1e-9);
  assert.ok(Math.abs(critKillFrame(19).alpha - 0.1) < 1e-9);
  assert.equal(critKillFrame(20).alpha, 0);
});

test('a kill by a critical hit reports its critical type; an ordinary kill does not', () => {
  const sim = new Simulation(4, { heroClass: 'rogue', ruleset: 'classic' });
  const kill = (critical: number) => {
    sim['spawnEnemy']('archer');
    const enemy = sim.state.enemies.at(-1)!;
    enemy.x = 200; enemy.y = 250;
    sim['events'] = [];
    sim['damageEnemy'](enemy, 99999, critical, sim.state.player.selectedSlot, 200, 236);
    return sim['events'].find((event: { type: string }) => event.type === 'kill') as { criticalType?: number } | undefined;
  };
  assert.equal(kill(1)?.criticalType, 1);
  assert.equal(kill(2)?.criticalType, 2);
  assert.equal(kill(0)?.criticalType, 0);
});
