import type { PartyAIActor, PartyAIContext, PartyAITarget } from './party-ai.ts';

export const CAREFUL_ORDER = 7;
export const CAREFUL_DAMAGE_MULTIPLIER = 0.85;
export const CAREFUL_HINT = '-15% auto damage. Skip shields; urgent foes first.\nRifles prefer ranged foes; close guns defend.';

export function usesCarefulConsideration(actor: PartyAIActor, context: PartyAIContext): boolean {
  return context.carefulConsideration === true && actor.slot >= 1 && actor.slot <= 4
    && actor.slot !== context.heroSlot && actor.member?.ai === CAREFUL_ORDER;
}

export function carefulTargetViable(enemy: PartyAITarget | undefined, context: PartyAIContext): enemy is PartyAITarget {
  return !!enemy && !enemy.removed && enemy.hp > 0 && !enemy.bomb && !context.isShielded?.(enemy);
}

// Оценивается только наблюдаемое движение, без знания будущих атак и волн.
export function carefulUrgency(enemy: PartyAITarget, defend: boolean): number {
  if (enemy.x >= 435) return 2;
  const frames = enemy.speed > 0 ? Math.max(0, 455 - enemy.x) / enemy.speed : Infinity;
  return enemy.x >= (defend ? 380 : 400) || frames <= (defend ? 120 : 90) ? 1 : 0;
}

function candidates(context: PartyAIContext): readonly PartyAITarget[] {
  if (context.listTargets) return context.listTargets();
  const found = new Map<number, PartyAITarget>();
  for (const cells of context.shared.targets) for (const cell of cells) {
    const enemy = cell.uid === null ? undefined : context.getTarget(cell.uid);
    if (enemy) found.set(enemy.uid, enemy);
  }
  return [...found.values()];
}

// Роль оружия важнее мягкого бонуса дистанции; дальняя цель никогда не запрещена.
function score(actor: PartyAIActor, enemy: PartyAITarget, range: number, context: PartyAIContext): number {
  const long = range === 2 || actor.weapon?.reqTrait === 104;
  const band = enemy.x < 150 ? 2 : enemy.x < 300 ? 1 : 0;
  const rangeBonus = band === range ? 15 : 0;
  const bossBonus = actor.member!.optBoss && enemy.uid === context.shared.targetBossUid ? 20 : 0;
  const taggedPenalty = enemy.tag > 0 && enemy.uid !== actor.member!.aiState?.targetUid ? 30 : 0;
  return (long ? (context.isRanged?.(enemy) ? 120 : 0) : enemy.x * 0.3)
    + enemy.x * 0.05 + rangeBonus + bossBonus - taggedPenalty;
}

export function chooseCarefulTarget(actor: PartyAIActor, range: number, context: PartyAIContext): PartyAITarget | null {
  const member = actor.member!;
  let best: PartyAITarget | null = null;
  const rank = (enemy: PartyAITarget): readonly number[] => [carefulUrgency(enemy, member.optWall),
    score(actor, enemy, range, context), -enemy.uid];
  const better = (a: PartyAITarget, b: PartyAITarget) => {
    const ar = rank(a), br = rank(b);
    for (let i = 0; i < ar.length; i++) if (ar[i] !== br[i]) return ar[i] > br[i];
    return false;
  };
  for (const enemy of candidates(context)) {
    if (!carefulTargetViable(enemy, context)) continue;
    if (!best || better(enemy, best)) best = enemy;
  }
  return best;
}

// Общий кэш и tag60 продолжают распределять новые цели между союзниками.
export function claimCarefulTarget(enemy: PartyAITarget, context: PartyAIContext): PartyAITarget {
  for (const cells of context.shared.targets) for (const cell of cells) {
    if (cell.uid === enemy.uid) { cell.uid = null; cell.x = 1000; }
  }
  enemy.tag = 60;
  return enemy;
}
