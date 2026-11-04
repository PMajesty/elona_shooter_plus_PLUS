import { carefulTargetViable, carefulPriority, chooseCarefulTarget, claimCarefulTarget, usesCarefulConsideration } from './careful-consideration.ts';
import { COMBAT_TRAIT, combatTrait, advanceChainGunClock, idleChainGun, type ChainGunState } from './combat-stats.ts';
import type { Item } from './items.ts';
import type { TraitLevels } from './progression.ts';

export interface PartyAIState extends ChainGunState {
  targetUid: number | null; onMark: boolean; shooting: boolean;
  aimCount: number; aimTime: number; workRate: number; rangeFix: number;
  cursorX: number; cursorY: number; idleCount: number; frenzy: number; burst: number;
  grenadeCount: number;
}

export interface PartyAICombatant {
  traits: TraitLevels; ai: number; optBoss: boolean; optWall: boolean;
  shootTimer: number; rampageTicks: number; aiState: PartyAIState | null;
}

export interface PartyAIActor {
  slot: number; exists: boolean; member: PartyAICombatant | null; weapon: Item | null;
}

export interface PartyAITarget {
  uid: number; x: number; y: number; speed: number; hp: number; removed: boolean;
  type: 0 | 1 | 2; tag: number; onMark: boolean;
  bomb?: boolean; dropping?: boolean; dropY?: number;
}

export interface PartyAITargetCell { uid: number | null; x: number }
export interface PartyAIShared {
  targets: PartyAITargetCell[][];
  targetBossUid: number | null; nextAlertUid: number | null;
  sharedWeaponRange: number | null;
}

export interface PartyAIContext {
  shared: PartyAIShared;
  getTarget(uid: number): PartyAITarget | undefined;
  random(): number;
  heroSlot: number;
  fireAtWill: boolean;
  carefulConsideration?: boolean;
  listTargets?(): readonly PartyAITarget[];
  isRanged?(enemy: PartyAITarget): boolean;
  isShielded?(enemy: PartyAITarget): boolean;
}

export interface PartyAICallbacks {
  shoot(actor: PartyAIActor): void;
  reload(actor: PartyAIActor): void;
  reloading(actor: PartyAIActor): void;
  endRampage?(actor: PartyAIActor): void;
  chainIdle?(actor: PartyAIActor): void;
  throwMilitiaGrenade(actor: PartyAIActor, launch: { targetUid: number; x: number; y: number; damage: number; speedBase: 12 }): void;
}

const PLAYER_Y = [245, 215, 275, 185, 305];
const RANGE_ORDER = [[2, 1, 0], [1, 2, 0], [0, 1, 2]];
const CURSOR_X = [375, 225, 75];
const asInt = (value: number) => Number.isFinite(value) ? Math.trunc(value) : 0;
const twip = (value: number) => Math.trunc(value * 20) / 20 || 0;

export function createPartyAIState(slot: number): PartyAIState {
  if (!Number.isInteger(slot) || slot < 0 || slot > 4) throw new Error('Invalid battle actor slot.');
  return { targetUid: null, onMark: false, shooting: false, aimCount: 100,
    aimTime: 18, workRate: 0.03, rangeFix: 1800, cursorX: 480 + slot * 2, cursorY: PLAYER_Y[slot],
    idleCount: 0, frenzy: 0, burst: 0, grenadeCount: 325, chainMode: 0, chainPos: 0 };
}

export function validPartyAIState(value: unknown): value is PartyAIState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const s = value as Record<string, unknown>;
  if (s.chainTime !== undefined && (typeof s.chainTime !== 'number' || !Number.isFinite(s.chainTime) || s.chainTime < 0 || s.chainTime > 2462)) return false;
  const numbers = ['aimCount', 'aimTime', 'workRate', 'rangeFix', 'cursorX', 'cursorY', 'idleCount', 'frenzy', 'burst', 'grenadeCount', 'chainMode', 'chainPos'];
  if (numbers.some(key => typeof s[key] !== 'number' || !Number.isFinite(s[key]) || Math.abs(Number(s[key])) > 1e12)) return false;
  if (typeof s.onMark !== 'boolean' || typeof s.shooting !== 'boolean') return false;
  if (s.targetUid !== null && (!Number.isInteger(s.targetUid) || Number(s.targetUid) < 1)) return false;
  if (['aimCount', 'burst', 'grenadeCount', 'chainMode'].some(key => !Number.isInteger(s[key]))) return false;
  return Number(s.aimCount) >= 0 && Number(s.aimTime) >= 2 && Number(s.workRate) >= 0 && Number(s.workRate) <= 0.3
    && Number(s.rangeFix) > 0 && Number(s.idleCount) >= 0 && Number(s.frenzy) >= 0 && Number(s.burst) >= 0
    && Number(s.chainMode) >= 0 && Number(s.chainMode) <= 3 && Number(s.chainPos) >= 0;
}

export function createPartyAIShared(): PartyAIShared {
  return { targets: Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => ({ uid: null, x: 1000 }))),
    targetBossUid: null, nextAlertUid: null, sharedWeaponRange: null };
}

function active(actor: PartyAIActor): actor is PartyAIActor & { member: PartyAICombatant & { aiState: PartyAIState } } {
  return actor.exists && actor.member !== null && actor.member.aiState !== null;
}

function target(context: PartyAIContext, uid: number): PartyAITarget {
  const enemy = context.getTarget(uid);
  if (!enemy) throw new Error(`Missing retained AI target ${uid}.`);
  return enemy;
}

function canAutoTarget(actor: PartyAIActor, enemy: PartyAITarget): boolean {
  return actor.member!.ai !== 2 || enemy.type !== 2;
}

export function partyActorPosition(slot: number): { x: number; y: number } {
  return { x: 510 + slot * 2 - (slot === 3 ? 8 : 0), y: PLAYER_Y[slot] };
}

/** refreshPlayer сбрасывает цепь/гранаты, но не цель, курсор и накопленное прицеливание. */
export function refreshPartyAI(actor: PartyAIActor, leadership = 0): void {
  if (!actor.member) return;
  const member = actor.member;
  const s = member.aiState ?? (member.aiState = createPartyAIState(actor.slot));
  const aiming = member.traits[900], teamwork = member.traits[901];
  if (aiming === undefined || teamwork === undefined) throw new Error('Companion aiming/teamwork must come from original generation.');
  s.rangeFix = 1800 + combatTrait(COMBAT_TRAIT.HUNTER, member.traits) * 20;
  s.aimTime = Math.max(2, (18 - Math.sqrt(aiming) * 1.4 - aiming * 0.05) * 100 / (100 + leadership));
  s.workRate = Math.min(0.3, 0.03 + Math.sqrt(teamwork) * 0.025);
  s.chainMode = 0; s.chainPos = 0; s.burst = 0;
  delete s.chainTime;
  s.grenadeCount = Math.max(100, 325 - (member.traits[COMBAT_TRAIT.MILITIA] ?? 0) * 4);
}

/** enemy.kill очищает весь общий кэш, а не только запись убитого врага. */
export function clearPartyTargetCache(shared: PartyAIShared): void {
  for (const cells of shared.targets) for (const cell of cells) { cell.uid = null; cell.x = 1000; }
}

/** Вызывать в исходной позиции enemy.onEnterFrame: после смерти/паузы, перед движением. */
export function registerPartyTarget(enemy: PartyAITarget, shared: PartyAIShared): void {
  if (enemy.removed || enemy.hp <= 0 || enemy.bomb) return;
  if (enemy.tag > 0) { enemy.tag--; return; }
  const band = enemy.x < 150 ? 0 : enemy.x < 300 ? 1 : 2;
  const cell = shared.targets[enemy.type][band];
  if (cell.x > enemy.x) { cell.uid = enemy.uid; cell.x = enemy.x; }
}

export function clearPartyAITarget(actor: PartyAIActor): void {
  if (!actor.member?.aiState) return;
  Object.assign(actor.member.aiState, { shooting: false, burst: 0, targetUid: null, onMark: false });
}

export function startingPartyAim(actor: PartyAIActor, enemy: PartyAITarget, range: number | null): number {
  const s = actor.member!.aiState!;
  let multiplier = Math.abs(500 - (range ?? NaN) * 200 - enemy.x);
  multiplier = multiplier < 100 ? 1 : multiplier / s.rangeFix + 1;
  if (actor.member!.optWall && enemy.x > 400) multiplier *= 3 - enemy.x / 200;
  return Math.max(asInt(s.aimTime * multiplier), 2);
}

/** Сохраняет ранние return остальных приказов исходной aiNormal. */
export function selectPartyTarget(actor: PartyAIActor, range: number, context: PartyAIContext, forcedOrder?: number): PartyAITarget | null {
  if (usesCarefulConsideration(actor, context)) {
    const chosen = chooseCarefulTarget(actor, range, context);
    return chosen ? claimCarefulTarget(chosen, context) : null;
  }
  const order = forcedOrder ?? actor.member!.ai;
  const bands = RANGE_ORDER[range];
  if (!bands) throw new Error('Invalid original weapon range.');
  const take = (type: number, band: number) => {
    const cell = context.shared.targets[type][band];
    if (cell.uid === null) return null;
    const enemy = target(context, cell.uid);
    if (!canAutoTarget(actor, enemy) || (order === 2 && enemy.type === 2)) return null;
    cell.uid = null; cell.x = 1000; enemy.tag = 60;
    return enemy;
  };
  if (order === 4 || order === 5) {
    for (const band of bands) { const enemy = take(order === 4 ? 1 : 2, band); if (enemy) return enemy; }
    return null;
  }
  if (order === 6) {
    for (let type = 0; type < 3; type++) for (const band of bands) { const enemy = take(type, band); if (enemy) return enemy; }
    return null;
  }
  for (const band of bands.slice(0, 2)) {
    let enemy = take(0, band); if (enemy) return enemy;
    if (order === 3) return null;
    enemy = take(2, band); if (enemy) return enemy;
    if (order === 1) return null;
    enemy = take(1, band); if (enemy) return enemy;
  }
  return null;
}

export function searchNextPartyAlert(actor: PartyAIActor, context: PartyAIContext): void {
  // Новый приказ сам выбирает срочность и не наследует жёсткую метку Defend.
  if (usesCarefulConsideration(actor, context)) { clearPartyAITarget(actor); return; }
  const uid = context.shared.nextAlertUid;
  const enemy = uid === null ? null : target(context, uid);
  if (!enemy || enemy.hp <= 0 || !canAutoTarget(actor, enemy)) { clearPartyAITarget(actor); return; }
  const s = actor.member!.aiState!;
  Object.assign(s, { shooting: false, burst: 0, targetUid: enemy.uid, onMark: true });
  enemy.onMark = true;
  s.aimCount = startingPartyAim(actor, enemy, actor.weapon?.range ?? null);
}

export function alertParty(enemy: PartyAITarget, actors: readonly PartyAIActor[], context: PartyAIContext, defenseLine = 455): void {
  if (enemy.onMark) return;
  for (const actor of actors) {
    if (!active(actor) || !actor.member.optWall || actor.member.aiState.onMark || (actor.slot === context.heroSlot && !context.fireAtWill) || !canAutoTarget(actor, enemy)) continue;
    if (usesCarefulConsideration(actor, context)) continue;
    const s = actor.member.aiState;
    Object.assign(s, { shooting: false, burst: 0, targetUid: enemy.uid, onMark: true });
    enemy.onMark = true; s.aimCount = startingPartyAim(actor, enemy, actor.weapon?.range ?? null);
    return;
  }
  if (enemy.x >= defenseLine - 20) context.shared.nextAlertUid = enemy.uid;
}

export type PartyAIFrameOutcome = 'absent' | 'boss-mark' | 'acquired' | 'dead-target' | 'advanced';

/** Полный участок одного актёра root.onEnterFrame; вызывающий сохраняет порядок слотов. */
export function stepPartyAIFrame(actor: PartyAIActor, context: PartyAIContext, callbacks: PartyAICallbacks): PartyAIFrameOutcome {
  if (!active(actor)) return 'absent';
  const member = actor.member, s = member.aiState;
  if (actor.weapon?.id === 16) advanceChainGunClock(s);
  const manual = actor.slot === context.heroSlot && !context.fireAtWill;
  const careful = usesCarefulConsideration(actor, context);
  if (careful && s.targetUid !== null) {
    const retained = context.getTarget(s.targetUid);
    if (!carefulTargetViable(retained, context)) clearPartyAITarget(actor);
    else {
      const urgent = chooseCarefulTarget(actor, actor.weapon?.range ?? 0, context);
      // Смена категории угрозы прерывает прицеливание; колебания оценок внутри неё — нет.
      if (urgent && carefulPriority(urgent, context, member.optWall) > carefulPriority(retained, context, member.optWall)) {
        claimCarefulTarget(urgent, context);
        Object.assign(s, { shooting: false, burst: 0, targetUid: urgent.uid, onMark: false });
        s.aimCount = startingPartyAim(actor, urgent, actor.weapon?.range ?? null);
        return 'acquired';
      }
    }
  }
  if (!manual) {
    if (member.ai === 2 && s.targetUid !== null && !canAutoTarget(actor, target(context, s.targetUid))) clearPartyAITarget(actor);
    if (!careful && member.optBoss && context.shared.targetBossUid !== null && !s.onMark) {
      const boss = target(context, context.shared.targetBossUid);
      if (boss.hp <= 0) { context.shared.targetBossUid = null; clearPartyAITarget(actor); return 'boss-mark'; }
      if (canAutoTarget(actor, boss)) {
        Object.assign(s, { shooting: false, burst: 0, targetUid: boss.uid, onMark: true });
        // Main:2357 использует предыдущее глобальное w, до weapon(index).
        s.aimCount = startingPartyAim(actor, boss, context.shared.sharedWeaponRange);
        return 'boss-mark';
      }
    }
    context.shared.sharedWeaponRange = actor.weapon?.range ?? null;
    if (s.targetUid === null) {
      s.shooting = false; s.burst = 0; s.onMark = false;
      if (context.random() < s.workRate) {
        const chosen = selectPartyTarget(actor, actor.weapon?.range ?? 0, context, actor.slot === context.heroSlot ? 6 : undefined);
        if (chosen) { s.targetUid = chosen.uid; s.aimCount = startingPartyAim(actor, chosen, actor.weapon?.range ?? null); return 'acquired'; }
        const weapon = actor.weapon;
        if (weapon && weapon.ammo < weapon.ammoMax / (weapon.manualReload ? 1.5 : 3)) callbacks.reload(actor);
        s.aimCount = asInt(s.aimTime * 2);
      }
      s.cursorX = twip(s.cursorX + (CURSOR_X[actor.weapon?.range ?? 0] - s.cursorX) / s.aimTime / 3);
      s.cursorY = twip(s.cursorY + (PLAYER_Y[actor.slot] - s.cursorY) / s.aimTime / 3);
    } else {
      const enemy = target(context, s.targetUid);
      if (enemy.hp <= 0) {
        if (s.onMark && member.optWall) searchNextPartyAlert(actor, context); else clearPartyAITarget(actor);
        return 'dead-target';
      }
      if (enemy.dropping) {
        const y = enemy.y + (enemy.dropY ?? 0);
        if (s.cursorX !== enemy.x) s.cursorX = twip(s.cursorX + (enemy.x - s.cursorX) / s.aimTime);
        if (s.cursorY !== y) s.cursorY = twip(s.cursorY + (y - s.cursorY + 1.5) / s.aimTime);
      } else {
        if (s.cursorX !== enemy.x) s.cursorX = twip(s.cursorX + (enemy.x + enemy.speed * s.aimTime - s.cursorX) / s.aimTime);
        if (s.cursorY !== enemy.y) s.cursorY = twip(s.cursorY + (enemy.y - s.cursorY) / s.aimTime);
      }
      if (s.aimCount > 0) s.aimCount--; else s.shooting = true;
    }
  } else context.shared.sharedWeaponRange = actor.weapon?.range ?? null;
  if (member.rampageTicks > 0 && --member.rampageTicks === 0) callbacks.endRampage?.(actor);
  if (s.frenzy > 0) {
    if (combatTrait(COMBAT_TRAIT.DUELIST, member.traits)) s.frenzy -= actor.slot === context.heroSlot ? 0.12 : 0.04;
    if (s.frenzy < 0) s.frenzy = 0;
  }
  member.shootTimer -= actor.weapon?.shootRate ?? 0;
  if (s.shooting) callbacks.shoot(actor);
  else {
    s.idleCount += 0.033;
    if (actor.weapon?.id === 16) {
      if (s.chainMode > 1) callbacks.chainIdle?.(actor);
      idleChainGun(s, manual);
    } else s.chainPos = 0;
  }
  return 'advanced';
}

/** Участок onTick до мира/волн: авторелоад, перезарядка, затем бесплатная граната Militia. */
export function stepPartyAITimer(actor: PartyAIActor, context: PartyAIContext, callbacks: PartyAICallbacks): void {
  if (!active(actor)) return;
  const member = actor.member, s = member.aiState, weapon = actor.weapon;
  context.shared.sharedWeaponRange = weapon?.range ?? null;
  if (weapon?.autoReload && weapon.reloadTime === 0 && weapon.ammo < weapon.ammoMax && member.shootTimer <= weapon.shootRate * -3) callbacks.reload(actor);
  if (weapon?.reloadTime) {
    callbacks.reloading(actor);
    if (!weapon.autoReload) s.idleCount = Math.max(0, s.idleCount - 0.15);
  }
  if (member.traits[COMBAT_TRAIT.MILITIA]) {
    if (--s.grenadeCount < 0) {
      const chosen = selectPartyTarget(actor, 2, context, 6);
      if (!chosen || chosen.x > partyActorPosition(actor.slot).x) s.grenadeCount += 10;
      else {
        callbacks.throwMilitiaGrenade(actor, { targetUid: chosen.uid, x: chosen.x + chosen.speed * (15 + context.random() * 20),
          y: chosen.y, damage: asInt(combatTrait(COMBAT_TRAIT.MILITIA, member.traits)), speedBase: 12 });
        s.grenadeCount = Math.max(100, 325 - member.traits[COMBAT_TRAIT.MILITIA] * 4);
      }
    }
  }
}
