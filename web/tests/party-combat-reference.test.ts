import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { comparePartyCombatTrace } from './party-combat-reference-support.ts';
import { partySkills } from '../src/party-progression.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-party-combat-trace.json', import.meta.url), 'utf8'));
const records = fixture.records;
const sample = (name: string) => records.find((row: Record<string, any>) => row.scenario === name);

test('all nine classes and source party reward boundaries match 37 original snapshots', () => {
  assert.equal(fixture.format, 'elona-original-party-combat-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const result = comparePartyCombatTrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 37);
  for (let dev = 1; dev <= 9; dev++) {
    const contact = sample(`contact_class_${dev}`), killed = sample(`kill_growth_class_${dev}`);
    assert.equal(contact.after.enemy.hp, 990); assert.equal(contact.damageEvents[0].actorSlot, 1);
    assert.equal(killed.after.actors[1].level, 2); assert.equal(killed.after.actors[1].kills, 1);
    assert.equal(killed.after.actors[0].kills, 0); assert.equal(killed.after.actors[0].exp, 0);
    assert.equal(sample(`settlement_class_${dev}`).after.actors[1].skillPoints, 0);
  }
  assert.ok(sample('contact_class_7').after.actors[1].frenzy > 0);
  const ranger = sample('ranger_team_threshold');
  assert.deepEqual(ranger.after.actors.map((actor: Record<string, any>) => actor.rampageTicks), [455, 403]);
  assert.equal(ranger.drawCount, 6); assert.equal(ranger.after.actors[1].frenzy, 0);
  assert.equal(sample('living_weapon_kill').after.items[1].livingWeapon, 200);
  assert.equal(sample('guardian_credits_hero').damageEvents[0].actorSlot, 0);
  assert.equal(sample('guardian_credits_companion').damageEvents[0].actorSlot, 1);
  assert.equal(sample('noble_level_gap').after.enemy.exp, 29);
  assert.equal(sample('companion_weapon_threshold_equal').after.actors[1].traits[105], 2);
  assert.equal(sample('companion_weapon_threshold_equal').after.actors[1].weaponExp[3], 22);
  assert.equal(sample('companion_weapon_threshold_above').after.actors[1].traits[105], 3);
  assert.equal(sample('companion_weapon_threshold_above').after.actors[1].weaponExp[3], 0);
  for (const [name, damage] of [['actual_shoot_sniper_idle', 89], ['actual_shoot_duelist_frenzy', 26], ['actual_shoot_noble', 59]] as const) {
    const shot = sample(name);
    assert.equal(shot.pellets[0].damage, damage); assert.equal(shot.damageEvents[0].damage, damage);
    assert.equal(shot.damageEvents[0].actorSlot, 1); assert.equal(shot.drawCount, 7);
  }
  assert.equal(sample('actual_shoot_sniper_idle').after.actors[1].idleCount, 8);
  assert.equal(sample('actual_shoot_duelist_frenzy').after.actors[1].frenzy, 33.55);
});

test('party reference rejects attributing companion projectile contact to the hero', () => {
  const result = comparePartyCombatTrace(records, simulation => {
    const boundary = simulation as unknown as { processPellet(x: number, y: number, damage: number, weapon: number, actor: number): boolean };
    const hit = boundary.processPellet.bind(simulation);
    boundary.processPellet = (x, y, damage, weapon) => hit(x, y, damage, weapon, 0);
  });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.scenario === 'kill_growth_class_6' && !row.matched));
});

test('party reference rejects refreshing cached party skills immediately after settlement growth', () => {
  const result = comparePartyCombatTrace(records, simulation => {
    const boundary = simulation as unknown as { finishDay(): void };
    const finish = boundary.finishDay.bind(simulation);
    boundary.finishDay = () => {
      finish();
      simulation.state.partySkills = partySkills([simulation.state.player, ...simulation.state.party.slots.slice(0, 4)
        .map(slot => slot.member ? { exist: slot.exists, traits: slot.member.traits } : null)]);
    };
  });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.scenario.startsWith('settlement_class_') && row.differences.some(difference => difference.field === 'party')));
});
