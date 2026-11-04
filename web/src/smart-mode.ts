import type { PartyAIActor, PartyAIContext, PartyAITarget } from './party-ai.ts';

export const SMART_ORDER = 7;
export const SMART_DAMAGE_MULTIPLIER = 0.85;
// Цена перевода текущего прицела, а не дальности врага от стены.
export const SMART_AIM_PIXELS_PER_FRAME = 25;
export const SMART_AIM_DELAY_MAX_FRAMES = 12;
export function smartAimDelay(actor: PartyAIActor, enemy: PartyAITarget): number {
  const s = actor.member!.aiState!;
  return Math.min(SMART_AIM_DELAY_MAX_FRAMES, Math.round(Math.hypot(enemy.x - s.cursorX,
    enemy.y + (enemy.dropping ? enemy.dropY ?? 0 : 0) - s.cursorY) / SMART_AIM_PIXELS_PER_FRAME));
}
export const SMART_COST_HINT = 'Time to shift aim; 15% less damage.';
export const SMART_HINT = `Choose dangerous foes with care.\n${SMART_COST_HINT}`;

export function usesSmartMode(actor: PartyAIActor, context: PartyAIContext): boolean {
  return context.smartMode === true && actor.slot >= 1 && actor.slot <= 4
    && actor.slot !== context.heroSlot && actor.member?.ai === SMART_ORDER;
}

export function smartTargetViable(enemy: PartyAITarget | undefined, context: PartyAIContext): enemy is PartyAITarget {
  return !!enemy && !enemy.removed && enemy.hp > 0 && !enemy.bomb && !context.isShielded?.(enemy);
}

// Оценивается только наблюдаемое движение, без знания будущих атак и волн.
export function smartUrgency(enemy: PartyAITarget, defend: boolean): number {
  if (enemy.x >= 435) return 2;
  const frames = enemy.speed > 0 ? Math.max(0, 455 - enemy.x) / enemy.speed : Infinity;
  return enemy.x >= (defend ? 380 : 400) || frames <= (defend ? 120 : 90) ? 1 : 0;
}

// Пока стене ничего не угрожает вблизи, любое оружие выбирает дальнего атакующего.
export function smartPriority(enemy: PartyAITarget, context: PartyAIContext, defend: boolean): number {
  const urgency = smartUrgency(enemy, defend);
  return urgency > 0 ? urgency + 1 : context.isRanged?.(enemy) ? 1 : 0;
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
  return (long ? (context.isRanged?.(enemy) ? 120 : 0) : enemy.x * 0.3)
    + enemy.x * 0.05 + rangeBonus + bossBonus;
}

// Только действующие прицелы, не сохраняющийся после смены цели tag60.
function claimants(enemy: PartyAITarget, actor: PartyAIActor, context: PartyAIContext): PartyAIActor[] {
  const bySlot = new Map<number, PartyAIActor>();
  for (const other of context.listActors?.() ?? []) {
    if (other.slot === actor.slot || !other.exists || !other.weapon || other.weapon.num <= 0
      || !usesSmartMode(other, context) || other.member?.aiState?.targetUid !== enemy.uid) continue;
    if (smartTargetViable(context.getTarget(enemy.uid), context)) bySlot.set(other.slot, other);
  }
  return [...bySlot.values()];
}

export function smartClaimCount(enemy: PartyAITarget, actor: PartyAIActor, context: PartyAIContext): number {
  return (context.isBoss?.(enemy) ?? enemy.uid === context.shared.targetBossUid) ? 0 : claimants(enemy, actor, context).length;
}

export function shouldYieldSmartTarget(actor: PartyAIActor, retained: PartyAITarget,
  chosen: PartyAITarget, context: PartyAIContext): boolean {
  return !(context.isBoss?.(retained) ?? retained.uid === context.shared.targetBossUid) && chosen.uid !== retained.uid
    && smartClaimCount(chosen, actor, context) === 0
    && claimants(retained, actor, context).some(other => other.slot < actor.slot);
}

export function chooseSmartTarget(actor: PartyAIActor, range: number, context: PartyAIContext): PartyAITarget | null {
  const member = actor.member!;
  let best: PartyAITarget | null = null;
  // Свободные цели сначала; при полной занятости — наименее занятая, без простоя.
  const rank = (enemy: PartyAITarget): readonly number[] => [-smartClaimCount(enemy, actor, context),
    smartPriority(enemy, context, member.optWall), score(actor, enemy, range, context), -enemy.uid];
  const better = (a: PartyAITarget, b: PartyAITarget) => {
    const ar = rank(a), br = rank(b);
    for (let i = 0; i < ar.length; i++) if (ar[i] !== br[i]) return ar[i] > br[i];
    return false;
  };
  for (const enemy of candidates(context)) {
    if (!smartTargetViable(enemy, context)) continue;
    if (!best || better(enemy, best)) best = enemy;
  }
  return best;
}

// Обычные приказы сохраняют общий кэш/tag60; Smart использует живые прицелы.
export function claimSmartTarget(enemy: PartyAITarget, context: PartyAIContext): PartyAITarget {
  for (const cells of context.shared.targets) for (const cell of cells) {
    if (cell.uid === enemy.uid) { cell.uid = null; cell.x = 1000; }
  }
  enemy.tag = 60;
  return enemy;
}
