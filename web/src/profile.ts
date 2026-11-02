import { MEDALS } from './medals.ts';

export interface GlobalProfile { version: 1; medals: number[]; bestDay: number }
export function createProfile(): GlobalProfile { return { version: 1, medals: [], bestDay: 0 }; }
export function validProfile(value: unknown): value is GlobalProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const p = value as GlobalProfile;
  return p.version === 1 && Array.isArray(p.medals) && new Set(p.medals).size === p.medals.length
    && p.medals.every(id => Number.isInteger(id) && Object.hasOwn(MEDALS, id))
    && Number.isSafeInteger(p.bestDay) && p.bestDay >= 0 && p.bestDay <= 1000000;
}
// Коллекция принадлежит браузеру, а не единственному текущему приключению.
export function mergeProfile(profile: Readonly<GlobalProfile>, progress: { earnedMedals: readonly number[]; day: number }): GlobalProfile {
  return { version: 1, medals: [...new Set([...profile.medals, ...progress.earnedMedals])].sort((a, b) => a - b), bestDay: Math.max(profile.bestDay, progress.day) };
}
