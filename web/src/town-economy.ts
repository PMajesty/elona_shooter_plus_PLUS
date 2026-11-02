export interface TownEconomy {
  smith: number; museum: number; chickens: number; sisters: number; villa: number; specialTrainer: number;
  eggsCollected: number; sistersExploded: number; heroTraining: number;
  searchTraining: number; fame: number;
  robberies: number; visitorsRobbed: number;
  prayers: number; parties: number; taunts: number; sisterWaves: number[];
}
export function createTownEconomy(): TownEconomy {
  return { smith: 0, museum: 0, chickens: 0, sisters: 0, villa: 0, specialTrainer: 0,
    eggsCollected: 0, sistersExploded: 0, heroTraining: 0, searchTraining: 0, fame: 0, robberies: 0, visitorsRobbed: 0, prayers: 0, parties: 0, taunts: 0, sisterWaves: [] };
}
export function validTownEconomy(value: unknown): value is TownEconomy {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const fields = value as Record<string, unknown>;
  if (Object.keys(createTownEconomy()).some(key => key !== 'sisterWaves' &&
    (typeof fields[key] !== 'number' || !Number.isSafeInteger(fields[key]) || Number(fields[key]) < 0 || Number(fields[key]) > 1000000))) return false;
  return Number(fields.searchTraining) <= 2 && Number(fields.smith) <= 6 && Number(fields.specialTrainer) <= 9 && Number(fields.heroTraining) <= Number(fields.specialTrainer)
    && Array.isArray(fields.sisterWaves) && fields.sisterWaves.length <= 10
    && fields.sisterWaves.every(n => Number.isSafeInteger(n) && n >= 0 && n <= Number(fields.sisters));
}
export type TownActivity = 'pray' | 'dinner' | 'search' | 'party' | 'eggs' | 'train' | 'taunt';
export const TOWN_ACTIVITIES: Record<TownActivity, { index: number; name: string; cost: number; frame: number }> = {
  pray: { index: 0, name: 'Pray', cost: 2, frame: 5 },
  dinner: { index: 1, name: 'Have dinner', cost: 3, frame: 12 },
  search: { index: 2, name: 'Go searching', cost: 1, frame: 13 },
  party: { index: 3, name: 'Party', cost: 3, frame: 15 },
  eggs: { index: 4, name: 'Collect eggs', cost: 1, frame: 6 },
  taunt: { index: 5, name: 'Taunt', cost: 2, frame: 14 },
  train: { index: 6, name: 'Train', cost: 4, frame: 16 },
};
export function museumIncome(level: number, medals: readonly number[]): number {
  return level > 0 ? 50 + Math.trunc(medals.length * 6 * (1 + (level - 1) * 0.3)) : 0;
}
