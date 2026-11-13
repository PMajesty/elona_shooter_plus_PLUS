import { ALL_TRAITS, PARTY_TRAITS, calculateAnyTrait, type PartySkillState } from './party-progression.ts';
import { validPartyState, validPartyPendingAction } from './party.ts';
import { partyActorPosition } from './party-ai.ts';
import { ITEM_TYPE, type Item } from './items.ts';
import { ENEMIES } from './content.ts';
import { weaponBehavior } from './combat-stats.ts';
import type { SimulationState } from './simulation.ts';

const record = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) < 1e12;
const integer = (v: unknown, low: number, high: number) => Number.isInteger(v) && Number(v) >= low && Number(v) <= high;

// Кэш может быть старше роста навыков: загрузка проверяет форму, но не пересчитывает его.
function validSkills(value: unknown): value is PartySkillState {
  if (!record(value) || !record(value.effects) || !record(value.levels)) return false;
  for (const part of [value.effects, value.levels]) if (Object.keys(part).length !== PARTY_TRAITS.length || Object.keys(part).some(id => !(PARTY_TRAITS as readonly number[]).includes(Number(id)))) return false;
  for (const id of PARTY_TRAITS) {
    const effect = value.effects[id], level = value.levels[id];
    if (!integer(level, 0, ALL_TRAITS[id].maxLevel) || effect !== Math.trunc(calculateAnyTrait(id, Number(level)))) return false;
  }
  return integer(value.guardian, 0, 2500) && Array.isArray(value.guardianSlots) && value.guardianSlots[0] === 0
    && value.guardianSlots.length <= 5 && value.guardianSlots.every((slot, i, slots) => integer(slot, 0, 4) && (i === 0 || slot > slots[i - 1]));
}

/** Первые v15 ошибочно записывали воздух в тип/ряд 2. В доступных днях бронетехники ещё нет. */
export function repairEarlyV15AirTargets(state: SimulationState): void {
  const retained = Array.isArray(state.retainedAITargets) ? state.retainedAITargets : [];
  const oldLive = state.enemies.filter(enemy => ENEMIES[enemy.kind].airborne && enemy.type === 2);
  const oldRetained = retained.filter(target => record(target) && target.type === 2);
  if (!oldLive.length && !oldRetained.length) return;
  const shared = state.partyAI;
  // Смешанный снимок не позволяет объединить два ряда без потери истории: отклоняем его.
  if (state.enemies.some(enemy => enemy.type === 1 || enemy.type === 2 && !ENEMIES[enemy.kind].airborne)
    || retained.some(target => record(target) && target.type === 1)
    || !record(shared) || !Array.isArray(shared.targets) || shared.targets.length !== 3
    || shared.targets.some(row => !Array.isArray(row) || row.length !== 3 || row.some(cell => !record(cell) || !finite(cell.x)))
    || shared.targets[1].some(cell => cell.uid !== null || cell.x !== 1000)) throw new Error('Ambiguous early v15 airborne target state.');
  const moved = new Set([...oldLive, ...oldRetained].map(target => target.uid));
  for (const [rowIndex, row] of shared.targets.entries()) for (const cell of row) {
    if (cell.uid !== null && (moved.has(cell.uid) ? rowIndex !== 2 : rowIndex === 2)) throw new Error('Ambiguous early v15 airborne target cache.');
  }
  // Переносим целые ячейки; x, uid, теги, выбранные цели, счётчики и RNG не пересчитываются.
  for (const target of [...oldLive, ...oldRetained]) target.type = 1;
  shared.targets[1] = shared.targets[2];
  shared.targets[2] = Array.from({ length: 3 }, () => ({ uid: null, x: 1000 }));
}

export function validatePartySave(state: SimulationState, validItem: (value: unknown) => value is Item): void {
  const activeHire = Boolean(state.activeMission.hire);
  const henchmanExpected = activeHire && (state.phase === 'battle' || state.phase === 'defeat' || state.phase === 'victory' && state.postbattle !== 'result');
  if (state.activeMission.hire !== undefined && (state.version < 29 || state.activeMission.hire !== true || state.day < 2)) throw new Error('Invalid mission hire contract.');
  const expanded = state.ruleset.id === 'expanded';
  if (!validPartyState(state.party, validItem, { phase: state.phase, allowHenchman: henchmanExpected, allowSmart: expanded }) || !validSkills(state.partySkills)) throw new Error('Invalid party state or skill cache.');
  const henchman = state.party.slots[3];
  if (henchman.exists !== henchmanExpected || henchmanExpected && (!henchman.member || henchman.member.devType !== 4 || henchman.member.level < 9 + state.day || (henchman.member.traits[106] ?? 0) < 40 || !expanded && henchman.member.ai !== 6 || henchman.member.optBoss || !henchman.member.optWall || !henchman.weapon)) throw new Error('Invalid temporary henchman.');
  if (state.pendingPartyAction?.kind === 'henchman' && (state.town?.preparation !== 'ready' || state.town.mission.hire)) throw new Error('Invalid pending henchman contract.');
  if (state.pendingPartyAction !== null && (state.phase !== 'town' || state.town?.preparation !== 'ready' || state.pendingTownAction !== null
    || !validPartyPendingAction(state.pendingPartyAction, state.party, state.inventory, state.gold))) throw new Error('Invalid pending party action.');
  const liveSlots = [0, ...state.party.slots.slice(0, 4).filter(slot => slot.exists).map(slot => slot.slot)];
  const cached = state.partySkills.guardianSlots.join();
  // В итогах найма кэш ещё содержит слот 4. Ранние сохранения уже обновляли его.
  const hiredResult = activeHire && state.phase === 'victory' && state.postbattle === 'result';
  if (cached !== liveSlots.join() && !(hiredResult && cached === [...liveSlots, 4].join())) throw new Error('Invalid Guardian party list.');
  const shared = state.partyAI;
  if (!record(shared) || !Array.isArray(shared.targets) || shared.targets.length !== 3
    || shared.targets.some(row => !Array.isArray(row) || row.length !== 3 || row.some(cell => !record(cell) || !finite(cell.x)))
    || shared.sharedWeaponRange !== null && !integer(shared.sharedWeaponRange, 0, 2)) throw new Error('Invalid party target cache.');
  const targets = state.retainedAITargets;
  if (!Array.isArray(targets) || targets.length > 20 || targets.some(target => !record(target)
    || ['x', 'y', 'speed', 'hp'].some(key => !finite(target[key])) || target.hp !== -1 || target.removed !== true
    || !integer(target.uid, 1, state.nextUid - 1) || !integer(target.type, 0, 2) || !integer(target.tag, 0, 60) || typeof target.onMark !== 'boolean')) throw new Error('Invalid retained party targets.');
  const ids = new Set([...state.enemies, ...targets].map(enemy => enemy.uid));
  if (ids.size !== state.enemies.length + targets.length || targets.some(target => state.projectiles.some(p => p.uid === target.uid) || state.enemyArrows.some(p => p.uid === target.uid))) throw new Error('Duplicate retained target identifier.');
  const reference = (uid: unknown) => uid === null || integer(uid, 1, state.nextUid - 1) && ids.has(Number(uid));
  if (!reference(shared.targetBossUid) || !reference(shared.nextAlertUid) || shared.targets.some(row => row.some(cell => !reference(cell.uid)))) throw new Error('Missing party target.');
  const byId = new Map([...state.enemies, ...targets].map(target => [target.uid, target]));
  for (const [rowIndex, row] of shared.targets.entries()) for (const cell of row) {
    if (cell.uid !== null && byId.get(cell.uid)?.type !== rowIndex) throw new Error('Invalid party target row.');
  }
  for (const slot of state.party.slots.slice(0, 4)) if (slot.exists && slot.member?.aiState && !reference(slot.member.aiState.targetUid)) throw new Error('Missing companion target.');
  if (state.heroAI && !reference(state.heroAI.state.targetUid)) throw new Error('Missing hero target.');
  for (const enemy of state.enemies) if (!integer(enemy.tag, 0, 60) || typeof enemy.onMark !== 'boolean'
    || enemy.type !== (ENEMIES[enemy.kind].airborne ? 1 : ENEMIES[enemy.kind].armor ? 2 : 0)) throw new Error('Invalid enemy targeting state.');
  for (const projectile of state.projectiles) {
    const owner = projectile.actorSlot ?? 0;
    if (!integer(owner, 0, 4) || projectile.damage === -1 && owner !== 0) throw new Error('Invalid projectile owner.');
    if (state.phase !== 'battle') continue;
    if (owner) {
      const slot = state.party.slots[owner - 1], position = partyActorPosition(owner);
      // Залп из трёх (Wind Bow или оружие мода с volley 3) смещает крайние снаряды на ±5.
      const allowedOffsets = slot.weapon && slot.weapon.type === ITEM_TYPE.gun && weaponBehavior(slot.weapon).projectileCount === 3 ? [-5, 0, 5] : [0];
      if (!slot.exists || !slot.member || !allowedOffsets.includes(projectile.startX - position.x) || projectile.startY !== position.y
        || projectile.weaponSlot !== null && slot.weapon?.type !== ITEM_TYPE.gun) throw new Error('Missing companion projectile owner or weapon.');
    } else if (projectile.weaponSlot !== null && state.inventory[projectile.weaponSlot]?.type !== ITEM_TYPE.gun) throw new Error('Projectile launch slot is not a gun.');
  }
}
