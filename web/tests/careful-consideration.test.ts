import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_ITEM_FIELDS, type Item } from '../src/items.ts';
import { COMBAT_TRAIT } from '../src/combat-stats.ts';
import { CAREFUL_DAMAGE_MULTIPLIER, carefulUrgency } from '../src/careful-consideration.ts';
import { alertParty, createPartyAIShared, createPartyAIState, registerPartyTarget, searchNextPartyAlert,
  selectPartyTarget, stepPartyAIFrame, stepPartyAITimer,
  type PartyAIActor, type PartyAIContext, type PartyAITarget, type PartyAICallbacks } from '../src/party-ai.ts';

function enemy(uid: number, x: number, extra: Partial<PartyAITarget> = {}): PartyAITarget {
  return { uid, x, y: 245, speed: 0.5, hp: 100, removed: false, type: 0, tag: 0, onMark: false, ...extra };
}
function setup(id = 4, enemies: PartyAITarget[] = []) {
  const weapon = { id, num: 1, reloadTime: 0, ammo: 10, ammoMax: 10, autoReload: 0, shootRate: 30,
    ...BASE_ITEM_FIELDS[id] } as Item;
  const ai = createPartyAIState(1); ai.workRate = 0.3; ai.aimTime = 3;
  const actor: PartyAIActor = { slot: 1, exists: true, weapon, member: {
    traits: {}, ai: 7, optBoss: false, optWall: false, shootTimer: 100, rampageTicks: 0, aiState: ai } };
  let draws = 0, shots = 0, grenades = 0;
  const shields = new Set<number>(), ranged = new Set<number>();
  const context: PartyAIContext = { shared: createPartyAIShared(), heroSlot: 0, fireAtWill: false,
    carefulConsideration: true, listTargets: () => enemies, getTarget: uid => enemies.find(e => e.uid === uid),
    isRanged: e => ranged.has(e.uid), isShielded: e => shields.has(e.uid), random: () => { draws++; return 0; } };
  const callbacks: PartyAICallbacks = { shoot: () => { shots++; }, reload: () => {}, reloading: () => {},
    throwMilitiaGrenade: () => { grenades++; } };
  return { actor, ai, enemies, context, callbacks, shields, ranged, counts: () => ({ draws, shots, grenades }) };
}

test('every weapon favors ranged attackers when the wall is safe, including shotgun and SMG', () => {
  for (const id of [4, 5, 13, 2, 3]) {
    const s = setup(id, [enemy(1, 50), enemy(2, 320), enemy(3, 365)]); s.ranged.add(2);
    assert.equal(selectPartyTarget(s.actor, s.actor.weapon!.range!, s.context)?.uid, 2);
    assert.equal(s.counts().draws, 0);
  }
});

test('close weapons switch to ranged threats, then to urgent melee, without same-tier aim churn', () => {
  const sheep = enemy(1, 310), archer = enemy(2, 50);
  const s = setup(3, [sheep]);
  stepPartyAIFrame(s.actor, s.context, s.callbacks); assert.equal(s.ai.targetUid, 1);
  s.enemies.push(archer); s.ranged.add(2);
  assert.equal(stepPartyAIFrame(s.actor, s.context, s.callbacks), 'acquired');
  assert.equal(s.ai.targetUid, 2);
  s.enemies.push(enemy(3, 280)); s.ranged.add(3);
  for (let i = 0; i < 20; i++) stepPartyAIFrame(s.actor, s.context, s.callbacks);
  assert.equal(s.ai.targetUid, 2); assert.ok(s.counts().shots > 0);
  sheep.x = 440;
  assert.equal(stepPartyAIFrame(s.actor, s.context, s.callbacks), 'acquired');
  assert.equal(s.ai.targetUid, 1);
});

test('all-range fallback uses ordinary acquisition, claim tag60 and work-rate gate', () => {
  const s = setup(2, [enemy(1, 25)]);
  s.context.random = () => 0.99;
  assert.equal(stepPartyAIFrame(s.actor, s.context, s.callbacks), 'advanced');
  assert.equal(s.ai.targetUid, null);
  s.context.random = () => 0;
  assert.equal(stepPartyAIFrame(s.actor, s.context, s.callbacks), 'acquired');
  assert.equal(s.ai.targetUid, 1); assert.equal(s.enemies[0].tag, 60);
  assert.equal(s.actor.member!.shootTimer, -600); // Только первый, не acquisition-кадр двигает часы.
});

test('urgent threats preempt a retained ranged boss without RNG and then finish aiming', () => {
  const boss = enemy(1, 80), threat = enemy(2, 200);
  const s = setup(13, [boss, threat]); s.ranged.add(1);
  s.actor.member!.optBoss = s.actor.member!.optWall = true; s.context.shared.targetBossUid = 1;
  stepPartyAIFrame(s.actor, s.context, s.callbacks); assert.equal(s.ai.targetUid, 1);
  threat.x = 440;
  assert.equal(stepPartyAIFrame(s.actor, s.context, s.callbacks), 'acquired');
  assert.equal(s.ai.targetUid, 2); assert.equal(s.counts().draws, 1);
  for (let i = 0; i < 20; i++) stepPartyAIFrame(s.actor, s.context, s.callbacks);
  assert.ok(s.counts().shots > 0); assert.equal(s.ai.targetUid, 2);
});

test('present speed contributes urgency; Defend widens urgency but never outranks critical', () => {
  assert.equal(carefulUrgency(enemy(1, 100, { speed: 4 }), false), 1);
  assert.equal(carefulUrgency(enemy(1, 385, { speed: 0 }), false), 0);
  assert.equal(carefulUrgency(enemy(1, 385, { speed: 0 }), true), 1);
  const s = setup(13, [enemy(1, 390), enemy(2, 436)]); s.ranged.add(1);
  s.actor.member!.optBoss = s.actor.member!.optWall = true; s.context.shared.targetBossUid = 1;
  assert.equal(selectPartyTarget(s.actor, 2, s.context)?.uid, 2);
});

test('retained shielded boss is dropped before shooting, with or without alternatives', () => {
  for (const alternative of [false, true]) {
    const s = setup(4, [enemy(1, 440), ...(alternative ? [enemy(2, 150)] : [])]);
    s.actor.member!.optBoss = s.actor.member!.optWall = true;
    Object.assign(s.ai, { targetUid: 1, onMark: true, shooting: true, aimCount: 0, burst: 4 });
    s.context.shared.targetBossUid = 1; s.shields.add(1);
    stepPartyAIFrame(s.actor, s.context, s.callbacks);
    assert.equal(s.counts().shots, 0); assert.equal(s.ai.targetUid, alternative ? 2 : null);
    assert.equal(s.ai.burst, 0); assert.equal(s.ai.onMark, false);
    assert.equal(s.context.shared.targetBossUid, 1);
  }
});

test('ordinary score changes, Boss and Defend alerts do not restart retained aim', () => {
  const s = setup(24, [enemy(1, 100), enemy(2, 150)]);
  s.actor.member!.optWall = true;
  stepPartyAIFrame(s.actor, s.context, s.callbacks);
  const initialAim = s.ai.aimCount;
  s.actor.member!.optBoss = true; s.context.shared.targetBossUid = 2;
  for (let i = 0; i <= initialAim + 1; i++) {
    s.enemies[1].x = 150 + i % 2;
    alertParty(s.enemies[1], [s.actor], s.context);
    stepPartyAIFrame(s.actor, s.context, s.callbacks);
  }
  assert.equal(s.ai.targetUid, 1); assert.ok(s.counts().shots > 0); assert.equal(s.counts().draws, 1);
  s.context.shared.nextAlertUid = 2; s.shields.add(2);
  searchNextPartyAlert(s.actor, s.context); assert.equal(s.ai.targetUid, null);
});

test('deterministic ties use UID regardless of enumeration; dead/removed/bomb excluded', () => {
  for (const reverse of [false, true]) {
    const enemies = [enemy(8, 100), enemy(3, 100), enemy(1, 440, { hp: 0 }),
      enemy(2, 440, { removed: true }), enemy(4, 440, { bomb: true })];
    const s = setup(4, reverse ? enemies.reverse() : enemies);
    assert.equal(selectPartyTarget(s.actor, 2, s.context)?.uid, 3);
    assert.equal(selectPartyTarget(s.actor, 2, s.context)?.uid, 8);
  }
});

test('tag60 is a soft distribution preference, never an idle or urgency veto', () => {
  const s = setup(4, [enemy(1, 100, { tag: 60 }), enemy(2, 100)]);
  assert.equal(selectPartyTarget(s.actor, 2, s.context)?.uid, 2);
  assert.equal(selectPartyTarget(s.actor, 2, s.context)?.uid, 1);
  s.enemies.length = 1;
  assert.equal(stepPartyAIFrame(s.actor, s.context, s.callbacks), 'acquired');
  assert.equal(s.ai.targetUid, 1);
  s.enemies.push(enemy(3, 440, { tag: 60 }));
  assert.equal(stepPartyAIFrame(s.actor, s.context, s.callbacks), 'acquired');
  assert.equal(s.ai.targetUid, 3);
});

test('Boss is a modest bonus, not an override of ranged/close weapon roles', () => {
  const long = setup(13, [enemy(1, 100), enemy(2, 320)]);
  long.actor.member!.optBoss = true; long.context.shared.targetBossUid = 1; long.ranged.add(2);
  assert.equal(selectPartyTarget(long.actor, 2, long.context)?.uid, 2);
  const close = setup(2, [enemy(1, 100), enemy(2, 365)]);
  close.actor.member!.optBoss = true; close.context.shared.targetBossUid = 1;
  assert.equal(selectPartyTarget(close.actor, 0, close.context)?.uid, 2);
  const tie = setup(4, [enemy(1, 100), enemy(2, 100)]);
  tie.actor.member!.optBoss = true; tie.context.shared.targetBossUid = 2;
  assert.equal(selectPartyTarget(tie.actor, 2, tie.context)?.uid, 2);
});

test('Militia forced-order6 uses shield avoidance and ordinary timer, no extra RNG', () => {
  const s = setup(4, [enemy(1, 440), enemy(2, 100)]); s.shields.add(1);
  s.actor.member!.traits[COMBAT_TRAIT.MILITIA] = 2; s.ai.grenadeCount = 0;
  stepPartyAITimer(s.actor, s.context, s.callbacks);
  assert.deepEqual(s.counts(), { draws: 1, shots: 0, grenades: 1 });
  assert.equal(s.enemies[0].tag, 0); assert.equal(s.enemies[1].tag, 60);
  assert.equal(CAREFUL_DAMAGE_MULTIPLIER, 0.85);
});

test('capability absent, normal orders, hero and candidate never call Expanded target callbacks', () => {
  for (const kind of ['classic', 'normal', 'hero', 'candidate']) {
    const s = setup(4, [enemy(1, 100)]);
    if (kind === 'classic') delete s.context.carefulConsideration;
    if (kind === 'normal') s.actor.member!.ai = 0;
    if (kind === 'hero') { s.actor.slot = 0; s.context.fireAtWill = true; }
    if (kind === 'candidate') s.actor.slot = 5;
    const forbidden = () => { throw Error('Expanded callback in original path'); };
    s.context.listTargets = forbidden; s.context.isRanged = forbidden; s.context.isShielded = forbidden;
    registerPartyTarget(s.enemies[0], s.context.shared);
    assert.equal(stepPartyAIFrame(s.actor, s.context, s.callbacks), 'acquired');
    assert.equal(s.ai.targetUid, 1); assert.equal(s.counts().draws, 1);
  }
});

test('normal-order frame/timer state and RNG match with Expanded capability on or absent', () => {
  for (const id of [2, 4, 16, 24]) {
    const make = (enabled: boolean) => {
      const s = setup(id, [enemy(1, 100), enemy(2, 330, { type: 1 }), enemy(3, 240, { type: 2 })]);
      s.actor.member!.ai = 0;
      s.actor.member!.traits[COMBAT_TRAIT.MILITIA] = 1; s.ai.grenadeCount = 2;
      if (!enabled) delete s.context.carefulConsideration;
      for (const target of s.enemies) registerPartyTarget(target, s.context.shared);
      return s;
    };
    const classic = make(false), expanded = make(true);
    for (let tick = 0; tick < 120; tick++) {
      for (const s of [classic, expanded]) {
        stepPartyAIFrame(s.actor, s.context, s.callbacks);
        stepPartyAITimer(s.actor, s.context, s.callbacks);
      }
      assert.deepEqual(expanded.actor, classic.actor);
      assert.deepEqual(expanded.context.shared, classic.context.shared);
      assert.deepEqual(expanded.enemies, classic.enemies);
      assert.deepEqual(expanded.counts(), classic.counts());
    }
  }
});

test('Militia with only a shielded boss waits without grenade launch or RNG draw', () => {
  const s = setup(4, [enemy(1, 440)]); s.shields.add(1);
  s.actor.member!.optBoss = s.actor.member!.optWall = true;
  s.context.shared.targetBossUid = 1;
  s.actor.member!.traits[COMBAT_TRAIT.MILITIA] = 2; s.ai.grenadeCount = 0;
  stepPartyAITimer(s.actor, s.context, s.callbacks);
  assert.deepEqual(s.counts(), { draws: 0, shots: 0, grenades: 0 });
  assert.equal(s.ai.grenadeCount, 9);
});

test('missing live-list callback falls back to cache and a removed retained target is safe', () => {
  const s = setup(4, [enemy(1, 100)]); delete s.context.listTargets;
  registerPartyTarget(s.enemies[0], s.context.shared);
  assert.equal(stepPartyAIFrame(s.actor, s.context, s.callbacks), 'acquired');
  s.enemies.length = 0;
  assert.doesNotThrow(() => stepPartyAIFrame(s.actor, s.context, s.callbacks));
  assert.equal(s.ai.targetUid, null);
});
