import { calendarLoot, validCampaignDay, generateLowLevelMission } from './missions.ts';
import { RECRUIT_NAMES } from './recruits.ts';
import type { Item } from './items.ts';
import { validTownPreparationEffects, type FirstTownPreparation } from './town-preparation.ts';

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown, low: number, high: number): value is number => Number.isInteger(value) && Number(value) >= low && Number(value) <= high;
const fieldsEqual = (value: Record<string, unknown>, fields: Record<string, unknown>) => Object.entries(fields).every(([key, expected]) => value[key] === expected);

/** Проверяем сохранённые результаты генерации, не повторяя случайные броски при загрузке. */
export function validTownPreparation(value: unknown, validItem: (item: unknown) => item is Item, day: number = 1, expectedAbsorbFix?: number, absorbMode: 'base' | 'active' = 'active'): value is FirstTownPreparation {
  if (!validCampaignDay(day)) return false;
  if (!record(value) || !Array.isArray(value.shop) || value.shop.length !== 8 || Array.from(value.shop).some(item => item !== null && !validItem(item))) return false;
  if (!Array.isArray(value.cards) || value.cards.length !== 5 || value.cards.some(id => !integer(id, -7, -1))) return false;
  for (let id = -7; id <= -1; id++) if (value.cards.filter(card => card === id).length > (id === -1 ? 3 : 1)) return false;
  if (!integer(value.searched, 0, Number.MAX_SAFE_INTEGER - 1) || !record(value.flags) || value.flags.specialSale !== 0 || !integer(value.flags.robbed, 0, 1000000) || ['egg', 'partyHeld', 'prayed'].some(key => typeof (value.flags as Record<string, unknown>)[key] !== 'boolean') || !integer(value.flags.taunted, 0, 100)) return false;
  // Снимок принадлежит моменту подготовки: найм/увольнение позднее не меняют готовую награду.
  if (value.preparationEffects !== undefined && !validTownPreparationEffects(value.preparationEffects)) return false;
  const negotiator = value.preparationEffects?.missionNegotiator ?? 0;
  const mission = value.mission;
  const expected = generateLowLevelMission(day, day, () => 0, { negotiator });
  const { loot: _loot, group: _group, bossWave: _bossWave, hire: _hire, absorbFix: _absorb, hpFix: _hp, dmgFix: _dmg, expFix: _exp, reward: _reward, ...fixed } = expected;
  if (!record(mission) || typeof mission.hire !== 'boolean' || !fieldsEqual(mission, fixed) || !Array.isArray(mission.group) || mission.group.length !== 0
    || (expected.bossDay ? mission.bossWave !== expected.wave - 1 : !integer(mission.bossWave, 2, 2 + Math.ceil(expected.wave / 3) - 1))) return false;
  const baseline = value.baseAbsorbFix ?? mission.absorbFix;
  if (typeof baseline !== 'number' || ![0, 0.01, 0.02, 0.03, 0.04].includes(baseline)
    || typeof mission.absorbFix !== 'number' || !Number.isFinite(mission.absorbFix)
    || (value.flags.prayed ? value.baseAbsorbFix === undefined || mission.absorbFix < baseline + 0.05 - 1e-9 || mission.absorbFix > baseline + 0.19 + 1e-9 : mission.absorbFix !== baseline)
    || (expectedAbsorbFix !== undefined && (absorbMode === 'base' ? baseline : mission.absorbFix) !== expectedAbsorbFix)) return false;
  if (typeof mission.hpFix !== 'number' || !Number.isFinite(mission.hpFix) || mission.hpFix < 1 || mission.hpFix > 100
    || typeof mission.dmgFix !== 'number' || !Number.isFinite(mission.dmgFix) || mission.dmgFix < 1 || mission.dmgFix > 100
    || typeof mission.expFix !== 'number' || !Number.isFinite(mission.expFix) || !(mission.expFix === 1 || mission.expFix >= 1.05 && mission.expFix <= 1.63)
    || (!value.flags.taunted && (mission.hpFix !== 1 || mission.reward !== expected.reward))
    || (!value.flags.partyHeld && mission.dmgFix !== 1)
    || (value.flags.partyHeld && mission.dmgFix <= 1)
    || (value.flags.taunted > 0 && (mission.hpFix < 1 + value.flags.taunted * 0.3 - 1e-9 || mission.hpFix > 1 + value.flags.taunted * 0.55 + 1e-9))
    || !integer(mission.reward, expected.reward, 1000000000)) return false;

  // В городе9 две гарантии идут после необязательного Ragnarok; порядок важен для выдачи слотов.
  const guaranteed = calendarLoot(day);
  if (!Array.isArray(mission.loot) || !(guaranteed.join() === mission.loot.join() || [1038, ...guaranteed].join() === mission.loot.join()) || mission.loot.some(id => typeof id !== 'number')) return false;
  const recruit = value.recruit;
  if (!record(recruit) || !integer(recruit.lv, Math.trunc(day / 5) + 1, Math.ceil(day * 0.3) + Math.trunc(day / 5))) return false;
  const recruitLevel = recruit.lv;
  if (!fieldsEqual(recruit, {
    exist: true, sp: recruitLevel - 1, trained: 0, optBoss: true, optWall: true,
    kill: 0, earn: 0, money: 200, ai: 0, forcus: -1, cost: 350 + recruitLevel * 50, exp: 0,
  }) || !integer(recruit.sex, 0, 1) || !integer(recruit.devType, 1, 9) || !integer(recruit.pic, 0, 21) || !integer(recruit.nextTrait, 0, 99) || typeof recruit.name !== 'string' || !RECRUIT_NAMES.includes(recruit.name)) return false;
  for (const key of ['potentialAim', 'potentialTeam']) if (typeof recruit[key] !== 'number' || !Number.isFinite(recruit[key]) || Number(recruit[key]) < 0.1 || Number(recruit[key]) >= 0.9) return false;
  if (!Array.isArray(recruit.wexp) || recruit.wexp.length !== 5 || recruit.wexp.some(value => value !== 0)) return false;
  if (!record(recruit.trait) || recruit.trait[recruit.devType] !== recruitLevel || !integer(recruit.trait[900], 1, 9 + recruitLevel) || !integer(recruit.trait[901], 1, 9 + recruitLevel)) return false;
  const allowedTraits = new Set([recruit.devType, 900, 901, 103, 104, 105, 106, 108, 109, 113, 119, 121]);
  if (Object.entries(recruit.trait).some(([id, level]) => !allowedTraits.has(Number(id)) || !integer(level, 1, Number(id) >= 900 ? 9 + recruitLevel : Number(id) === recruit.devType ? recruitLevel : 3))) return false;
  const items = recruit.items;
  if (!record(items)) return false;
  const requiredSlots = recruit.devType === 4 ? ['45', '47', '48'] : ['45'];
  // После смены кандидата прежние слоты ополченца остаются частью исходного инвентаря.
  if (Object.keys(items).some(slot => !['45', '47', '48'].includes(slot) || !validItem(items[slot]))
    || requiredSlots.some(slot => !validItem(items[slot]) || (items[slot] as Item).num !== 1)) return false;
  return true;
}
