import { RECRUIT_NAMES } from './recruits.ts';
import type { Item } from './items.ts';
import { validTownPreparationEffects, type FirstTownPreparation } from './town-preparation.ts';

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown, low: number, high: number): value is number => Number.isInteger(value) && Number(value) >= low && Number(value) <= high;
const fieldsEqual = (value: Record<string, unknown>, fields: Record<string, unknown>) => Object.entries(fields).every(([key, expected]) => value[key] === expected);

/** Проверяем сохранённые результаты генерации, не повторяя случайные броски при загрузке. */
export function validTownPreparation(value: unknown, validItem: (item: unknown) => item is Item, day: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 = 1, expectedAbsorbFix?: number): value is FirstTownPreparation {
  if (![1, 2, 3, 4, 5, 6, 7, 8].includes(day)) return false;
  if (!record(value) || !Array.isArray(value.shop) || value.shop.length !== 8 || Array.from(value.shop).some(item => item !== null && !validItem(item))) return false;
  if (!Array.isArray(value.cards) || value.cards.length !== 5 || value.cards.some(id => !integer(id, -7, -1))) return false;
  for (let id = -7; id <= -1; id++) if (value.cards.filter(card => card === id).length > (id === -1 ? 3 : 1)) return false;
  if (!integer(value.searched, 0, 999) || !record(value.flags) || !fieldsEqual(value.flags, { specialSale: 0, egg: true, partyHeld: false, prayed: false, robbed: 0, taunted: 0 })) return false;
  // Снимок принадлежит моменту подготовки: найм/увольнение позднее не меняют готовую награду.
  if (value.preparationEffects !== undefined && !validTownPreparationEffects(value.preparationEffects)) return false;
  const negotiator = value.preparationEffects?.missionNegotiator ?? 0;
  const mission = value.mission;
  const power = 800 + day * 50 + day * 70;
  if (!record(mission) || !fieldsEqual(mission, {
    level: day, fixedLv: day, strength: 0, power, powerOrg: power, reward: Math.trunc((600 + day * 20) * (100 + negotiator) / 100),
    hire: false, ragnarok: false, wave: 5, spawnRate: 15 - day / 5, waveType: 0,
    newWave: true, time: 30, bossDay: false, note: '', hpFix: 1, dmgFix: 1,
    expFix: 1, bossKilled: 0, noDamage: true, criticalCount: 0, resultOther: 0,
  }) || !Array.isArray(mission.group) || mission.group.length !== 0 || !integer(mission.bossWave, 2, 3)) return false;
  if (![0, 0.01, 0.02, 0.03, 0.04].includes(Number(mission.absorbFix)) || typeof mission.absorbFix !== 'number' || (expectedAbsorbFix !== undefined && mission.absorbFix !== expectedAbsorbFix)) return false;
  const calendarLoot = day >= 7 ? [] : [day === 1 ? 1117 : day === 2 ? 1103 : day === 3 ? 1035 : day === 4 ? 1102 : day === 5 ? 1037 : 1106];
  if (!Array.isArray(mission.loot) || !(calendarLoot.join() === mission.loot.join() || [1038, ...calendarLoot].join() === mission.loot.join()) || mission.loot.some(id => typeof id !== 'number')) return false;
  const recruit = value.recruit;
  if (!record(recruit) || !integer(recruit.lv, day >= 5 ? 2 : 1, day >= 7 ? 4 : day >= 5 ? 3 : day === 4 ? 2 : 1)) return false;
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
