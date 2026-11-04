import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_ITEM_FIELDS, type Item } from '../src/items.ts';
import { COMBAT_TRAIT } from '../src/combat-stats.ts';
import { SMART_AIM_DELAY_MAX_FRAMES, SMART_DAMAGE_MULTIPLIER, smartAimDelay, smartUrgency } from '../src/smart-mode.ts';
import { alertParty, createPartyAIShared, createPartyAIState, registerPartyTarget, searchNextPartyAlert,
  selectPartyTarget, startingPartyAim, stepPartyAIFrame, stepPartyAITimer, validPartyAIState,
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
    smartMode: true, listTargets: () => enemies, getTarget: uid => enemies.find(e => e.uid === uid),
    isRanged: e => ranged.has(e.uid), isShielded: e => shields.has(e.uid), random: () => { draws++; return 0; } };
  const callbacks: PartyAICallbacks = { shoot: () => { shots++; }, reload: () => {}, reloading: () => {},
    throwMilitiaGrenade: () => { grenades++; } };
  return { actor, ai, enemies, context, callbacks, shields, ranged, counts: () => ({ draws, shots, grenades }) };
}

test('Smart pays cursor-distance cost to engage a new target, without slowing retained fire', () => {
  const firstShots: number[] = [];
  for (const order of [0, 7]) {
    const s = setup(4, [enemy(1, 100)]); s.actor.member!.ai = order;
    registerPartyTarget(s.enemies[0], s.context.shared);
    assert.equal(stepPartyAIFrame(s.actor, s.context, s.callbacks), 'acquired');
    const ordinaryAim = startingPartyAim(s.actor, s.enemies[0], s.actor.weapon!.range!);
    assert.equal(s.ai.aimCount, ordinaryAim + (order === 7 ? smartAimDelay(s.actor, s.enemies[0]) : 0));
    let frames = 0;
    while (s.counts().shots === 0 && frames < 40) { stepPartyAIFrame(s.actor, s.context, s.callbacks); frames++; }
    assert.equal(s.counts().shots, 1);
    firstShots.push(frames);
    for (let i = 0; i < 4; i++) stepPartyAIFrame(s.actor, s.context, s.callbacks);
    assert.equal(s.counts().shots, 5);
    assert.equal(s.counts().draws, 1);
  }
  assert.equal(SMART_AIM_DELAY_MAX_FRAMES, 12);
  assert.equal(firstShots[1] - firstShots[0], 12);
});

test('replacing a dead or shielded target pays the same aim cost and cannot fire immediately', () => {
  for (const reason of ['dead', 'shielded']) {
    const s = setup(4, [enemy(1, 100), enemy(2, 110)]);
    Object.assign(s.ai, { targetUid: 1, shooting: true, aimCount: 0, cursorX: 135, cursorY: 245 });
    if (reason === 'dead') s.enemies[0].hp = 0; else s.shields.add(1);
    assert.equal(stepPartyAIFrame(s.actor, s.context, s.callbacks), 'acquired');
    assert.equal(s.ai.targetUid, 2); assert.equal(s.counts().shots, 0);
    assert.equal(s.ai.aimCount, startingPartyAim(s.actor, s.enemies[1], s.actor.weapon!.range!) + smartAimDelay(s.actor, s.enemies[1]));
  }
});

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
  threat.x = 440; s.ai.cursorX = 415; s.ai.cursorY = threat.y;
  assert.equal(stepPartyAIFrame(s.actor, s.context, s.callbacks), 'acquired');
  assert.equal(s.ai.targetUid, 2); assert.equal(s.counts().draws, 1);
  assert.equal(s.ai.aimCount, startingPartyAim(s.actor, threat, s.actor.weapon!.range!) + smartAimDelay(s.actor, threat));
  for (let i = 0; i < 20; i++) stepPartyAIFrame(s.actor, s.context, s.callbacks);
  assert.ok(s.counts().shots > 0); assert.equal(s.ai.targetUid, 2);
});

test('present speed contributes urgency; Defend widens urgency but never outranks critical', () => {
  assert.equal(smartUrgency(enemy(1, 100, { speed: 4 }), false), 1);
  assert.equal(smartUrgency(enemy(1, 385, { speed: 0 }), false), 0);
  assert.equal(smartUrgency(enemy(1, 385, { speed: 0 }), true), 1);
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
    assert.equal(selectPartyTarget(s.actor, 2, s.context)?.uid, 3); // tag60 не является живой заявкой.
  }
});

test('stale tag60 is not a claim or an idle/urgency veto', () => {
  const s = setup(4, [enemy(1, 100, { tag: 60 }), enemy(2, 100)]);
  assert.equal(selectPartyTarget(s.actor, 2, s.context)?.uid, 1);
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
  assert.equal(SMART_DAMAGE_MULTIPLIER, 0.85);
});

test('capability absent, normal orders, hero and candidate never call Expanded target callbacks', () => {
  for (const kind of ['classic', 'normal', 'hero', 'candidate']) {
    const s = setup(4, [enemy(1, 100)]);
    if (kind === 'classic') delete s.context.smartMode;
    if (kind === 'normal') s.actor.member!.ai = 0;
    if (kind === 'hero') { s.actor.slot = 0; s.context.fireAtWill = true; }
    if (kind === 'candidate') s.actor.slot = 5;
    const forbidden = () => { throw Error('Expanded callback in original path'); };
    s.context.listTargets = forbidden; s.context.listActors = forbidden; s.context.isRanged = forbidden; s.context.isShielded = forbidden;
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
      if (!enabled) delete s.context.smartMode;
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

function squad(s: ReturnType<typeof setup>, count: number): PartyAIActor[] {
  const actors = [s.actor];
  for (let slot = 2; slot <= count; slot++) {
    const actor = structuredClone(s.actor); actor.slot = slot;
    actor.member!.aiState = createPartyAIState(slot);
    actor.member!.aiState.workRate = 0.3; actor.member!.aiState.aimTime = 3;
    actors.push(actor);
  }
  s.context.listActors = () => actors;
  return actors;
}

test('distance cost uses current cursor, both axes, dropping point, rounding and cap', () => {
  const s = setup(); Object.assign(s.ai, { cursorX: 100, cursorY: 200 });
  for (const [x, y, frames] of [[100, 200, 0], [112, 200, 0], [113, 200, 1], [125, 200, 1],
    [100, 250, 2], [175, 300, 5], [400, 200, 12], [2000, 2000, 12]]) {
    assert.equal(smartAimDelay(s.actor, enemy(1, x, { y })), frames);
  }
  assert.equal(smartAimDelay(s.actor, enemy(1, 100, { y: 300, dropping: true, dropY: -100 })), 0);
  s.ai.cursorX = 300;
  assert.equal(smartAimDelay(s.actor, enemy(1, 300, { y: 200 })), 0);
});

test('two and three Smart actors spread across live targets, not tags or enumeration order', () => {
  for (const count of [2, 3]) {
    const s = setup(3, [enemy(1, 430), enemy(2, 200), enemy(3, 100)]);
    s.ranged.add(2);
    const actors = squad(s, count); s.context.listActors = () => [...actors].reverse();
    for (const actor of actors) assert.equal(stepPartyAIFrame(actor, s.context, s.callbacks), 'acquired');
    assert.deepEqual(actors.map(a => a.member!.aiState!.targetUid), count === 2 ? [1, 2] : [1, 2, 3]);
    for (let frame = 0; frame < 30; frame++) for (const actor of actors) stepPartyAIFrame(actor, s.context, s.callbacks);
    assert.deepEqual(actors.map(a => a.member!.aiState!.targetUid), count === 2 ? [1, 2] : [1, 2, 3]);
  }
});

test('retained duplicates yield to free alternatives; lowest slot keeps aim without churn', () => {
  for (const reverseStep of [false, true]) {
    const s = setup(4, [enemy(1, 440)]), actors = squad(s, 3);
    for (const actor of actors) Object.assign(actor.member!.aiState!, { targetUid: 1, shooting: true, aimCount: 0 });
    s.enemies.push(enemy(2, 200), enemy(3, 100));
    const originalKeys = Object.keys(s.ai).sort();
    const order = reverseStep ? [...actors].reverse() : actors;
    for (const actor of order) stepPartyAIFrame(actor, s.context, s.callbacks);
    assert.equal(s.ai.targetUid, 1); assert.equal(s.ai.aimCount, 0);
    assert.equal(new Set(actors.map(a => a.member!.aiState!.targetUid)).size, 3);
    const assignments = actors.map(a => a.member!.aiState!.targetUid);
    for (let frame = 0; frame < 35; frame++) for (const actor of order) stepPartyAIFrame(actor, s.context, s.callbacks);
    assert.deepEqual(actors.map(a => a.member!.aiState!.targetUid), assignments);
    assert.deepEqual(Object.keys(s.ai).sort(), originalKeys);
    assert.equal(s.counts().draws, 0);
  }
});

test('coordination switches pay distance from the actual retained cursor', () => {
  const s = setup(4, [enemy(1, 440), enemy(2, 100)]), actors = squad(s, 2);
  for (const actor of actors) Object.assign(actor.member!.aiState!, { targetUid: 1, shooting: true, aimCount: 0, cursorX: 125, cursorY: 245 });
  assert.equal(stepPartyAIFrame(actors[1], s.context, s.callbacks), 'acquired');
  assert.equal(actors[1].member!.aiState!.targetUid, 2);
  assert.equal(actors[1].member!.aiState!.aimCount, startingPartyAim(actors[1], s.enemies[1], 2) + 1);
});

test('boss and sole enemy may be shared; excess allies use least-contested fallback', () => {
  const sole = setup(4, [enemy(1, 100)]), aloneActors = squad(sole, 3);
  for (const actor of aloneActors) stepPartyAIFrame(actor, sole.context, sole.callbacks);
  assert.deepEqual(aloneActors.map(a => a.member!.aiState!.targetUid), [1, 1, 1]);
  const boss = setup(4, [enemy(1, 100), enemy(2, 100)]), bossActors = squad(boss, 3);
  boss.context.shared.targetBossUid = 1;
  for (const actor of bossActors) { actor.member!.optBoss = true; stepPartyAIFrame(actor, boss.context, boss.callbacks); }
  assert.deepEqual(bossActors.map(a => a.member!.aiState!.targetUid), [1, 1, 1]);
  const covered = setup(4, [enemy(1, 440), enemy(2, 100)]), actors = squad(covered, 4);
  for (const actor of actors) stepPartyAIFrame(actor, covered.context, covered.callbacks);
  assert.deepEqual(actors.map(a => a.member!.aiState!.targetUid), [1, 2, 1, 2]);
  const before = actors.map(a => a.member!.aiState!.targetUid);
  for (let i = 0; i < 25; i++) for (const actor of actors) stepPartyAIFrame(actor, covered.context, covered.callbacks);
  assert.deepEqual(actors.map(a => a.member!.aiState!.targetUid), before);
});

test('boss identity allows sharing even when another boss owns the global priority marker', () => {
  const s = setup(4, [enemy(1, 140), enemy(2, 100)]), actors = squad(s, 2);
  s.context.shared.targetBossUid = 2;
  s.context.isBoss = target => target.uid === 1 || target.uid === 2;
  for (const actor of actors) stepPartyAIFrame(actor, s.context, s.callbacks);
  assert.deepEqual(actors.map(actor => actor.member!.aiState!.targetUid), [1, 1]);
  s.enemies.push(enemy(3, 150));
  const remaining = actors[1].member!.aiState!.aimCount;
  stepPartyAIFrame(actors[1], s.context, s.callbacks);
  assert.equal(actors[1].member!.aiState!.targetUid, 1);
  assert.equal(actors[1].member!.aiState!.aimCount, remaining - 1);
});

test('absent, unarmed, ordinary, hero and candidate actors do not make phantom claims', () => {
  for (const reason of ['absent', 'null-member', 'null-state', 'unarmed', 'spent', 'ordinary', 'hero', 'candidate', 'stale-uid']) {
    const s = setup(4, [enemy(1, 100), enemy(2, 100)]), actors = squad(s, 2), other = actors[1];
    other.member!.aiState!.targetUid = 1;
    if (reason === 'absent') other.exists = false;
    if (reason === 'null-member') other.member = null;
    if (reason === 'null-state') other.member!.aiState = null;
    if (reason === 'unarmed') other.weapon = null;
    if (reason === 'spent') other.weapon!.num = 0;
    if (reason === 'ordinary') other.member!.ai = 6;
    if (reason === 'hero') other.slot = 0;
    if (reason === 'candidate') other.slot = 5;
    if (reason === 'stale-uid') other.member!.aiState!.targetUid = 999;
    assert.equal(selectPartyTarget(s.actor, 2, s.context)?.uid, 1, reason);
  }
});

test('saved aim resumes without resetting distance cost or adding mutable state', () => {
  const s = setup(4, [enemy(1, 100)]); stepPartyAIFrame(s.actor, s.context, s.callbacks);
  const saved = structuredClone(s.ai); assert.ok(validPartyAIState(saved));
  const restored = structuredClone(s.actor); restored.member!.aiState = saved;
  const keys = Object.keys(saved).sort();
  stepPartyAIFrame(restored, s.context, s.callbacks);
  assert.equal(saved.aimCount, s.ai.aimCount - 1);
  assert.deepEqual(Object.keys(saved).sort(), keys);
  assert.equal(s.counts().draws, 1);
});
