import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { comparePartyAITrace, type PartyAIRecord } from './party-ai-reference-support.ts';
import { alertParty, searchNextPartyAlert, selectPartyTarget, stepPartyAIFrame, type PartyAICallbacks } from '../src/party-ai.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/original-party-ai-trace.json', import.meta.url), 'utf8'));
const records = fixture.records as PartyAIRecord[];
const sample = (name: string, step: number) => records.find(row => row.scenario === name && row.step === step)!;

test('party AI and all nine initial weapons match 74 Flash snapshots and the corrected No Armor selection', () => {
  assert.equal(fixture.format, 'elona-original-party-ai-trace');
  assert.equal(fixture.originalSha256, '4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663');
  assert.equal(createHash('sha256').update(JSON.stringify(records)).digest('hex'), fixture.traceSha256);
  const result = comparePartyAITrace(records);
  assert.equal(result.status, 'passed'); assert.equal(result.matchedSnapshots, 74); assert.equal(result.correctedSnapshots, 1);
  // Проверяется реально достигнутая ветвь, а не название сценария.
  assert.equal(sample('order_2', 1).events[0].uid, 101);
  assert.equal(sample('order_3', 1).events[0].uid, null);
  const acquired = sample('acquire_skips_common', 1);
  assert.equal(acquired.actor.member.shootTimer, 100); assert.equal(acquired.actor.member.rampageTicks, 9);
  assert.equal(acquired.actor.member.aiState!.cursorX, 482);
  assert.equal(sample('boss_stale_range', 1).actor.member.aiState!.aimCount, 15);
  assert.deepEqual(sample('auto_reload_same_timer', 1).events.map(event => event.type), ['reload', 'reloading']);
  assert.equal(sample('militia_throw', 1).events[0].damage, 27);
  const draw = sample('actual_shoot_class_9', 1), release = sample('actual_shoot_class_9', 2);
  assert.equal(draw.drawCount, 1); assert.equal(draw.actor.member.aiState!.chainMode, 1); assert.equal(draw.events.length, 1);
  assert.equal(release.drawCount, 6); assert.equal(release.actor.member.aiState!.chainMode, 0);
  assert.ok(release.events[1].launched!.targetX > release.events[1].targetX!);
});

test('original AI trace rejects changing acquisition to advance cooldown in the same frame', () => {
  const result = comparePartyAITrace(records, { frame: (actor, context, callbacks) => {
    const outcome = stepPartyAIFrame(actor, context, callbacks);
    if (outcome === 'acquired') actor.member!.shootTimer -= actor.weapon!.shootRate;
    return outcome;
  } });
  assert.equal(result.status, 'failed');
  assert.ok(result.comparisons.some(row => row.scenario === 'acquire_skips_common' && row.step === 1 && !row.matched));
});

test('original AI trace detects both a missing shared RNG draw and a regression in No Armor selection', () => {
  const missingDraw = comparePartyAITrace(records, { frame: (actor, context, callbacks) =>
    stepPartyAIFrame(actor, { ...context, random: () => 0 }, callbacks) });
  assert.equal(missingDraw.status, 'failed');
  assert.ok(missingDraw.comparisons.some(row => row.differences.some(difference => difference.field === 'drawCount')));
  const changedOrder = comparePartyAITrace(records, { selector: (actor, range, context, order) =>
    order === 2 ? selectPartyTarget({ ...actor, member: { ...actor.member!, ai: 0 } }, range, context) : selectPartyTarget(actor, range, context, order) });
  assert.equal(changedOrder.status, 'failed');
  assert.ok(changedOrder.comparisons.some(row => row.scenario === 'order_2' && row.step === 1 && !row.matched));
});

test('No Armor releases a retained target and respects boss priority, Defend and automatic grenade selection', () => {
  const { actor, world } = structuredClone(sample('order_2', 0));
  const context = { shared: world.shared, getTarget: (uid: number) => world.targets.find(t => t.uid === uid),
    random: () => 0, heroSlot: 0, fireAtWill: false };
  const armor = world.targets.find(t => t.type === 2)!, ai = actor.member.aiState!;
  actor.member.optBoss = actor.member.optWall = true;
  Object.assign(ai, { targetUid: armor.uid, onMark: true, shooting: true, burst: 2, workRate: 1 });
  world.shared.targetBossUid = armor.uid;
  const unexpected = () => assert.fail('unexpected shot or reload');
  const callbacks: PartyAICallbacks = { shoot: unexpected, reload: unexpected, reloading: unexpected, throwMilitiaGrenade: unexpected };
  assert.equal(stepPartyAIFrame(actor, context, callbacks), 'acquired');
  assert.equal(ai.targetUid, 103); assert.equal(world.shared.targetBossUid, armor.uid);
  world.shared.nextAlertUid = armor.uid;
  searchNextPartyAlert(actor, context); assert.equal(ai.targetUid, null);
  const ally = structuredClone(actor); ally.slot = 2; ally.member.ai = 0;
  alertParty(armor, [actor, ally], context);
  assert.equal(ai.targetUid, null); assert.equal(ally.member.aiState!.targetUid, armor.uid);
  assert.equal(selectPartyTarget(actor, 2, context, 6)?.uid, 102);
  assert.equal(selectPartyTarget(actor, 2, context, 6), null);
  assert.equal(selectPartyTarget(ally, 2, context, 6)?.uid, armor.uid);
});
