import { MEDALS } from './medals.ts';

export interface GlobalProfile { version: 1; medals: number[]; bestDay: number; bestHardcoreDay?: number; bestCasualDay?: number }
export function createProfile(): GlobalProfile { return { version: 1, medals: [], bestDay: 0 }; }
export function validProfile(value: unknown): value is GlobalProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const p = value as GlobalProfile;
  return p.version === 1 && Array.isArray(p.medals) && new Set(p.medals).size === p.medals.length
    && p.medals.every(id => Number.isInteger(id) && Object.hasOwn(MEDALS, id))
    && [p.bestDay, p.bestHardcoreDay === undefined ? 0 : p.bestHardcoreDay, p.bestCasualDay === undefined ? 0 : p.bestCasualDay].every(day => Number.isSafeInteger(day) && day >= 0 && day <= 1000000);
}
// Коллекция принадлежит браузеру, а не единственному текущему приключению.
export function mergeProfile(profile: Readonly<GlobalProfile>, progress: { earnedMedals: readonly number[]; day: number; mode?: string }): GlobalProfile {
  const result = { ...profile, medals: [...new Set([...profile.medals, ...progress.earnedMedals])].sort((a, b) => a - b) };
  const field = progress.mode === 'hardcore' ? 'bestHardcoreDay' : progress.mode === 'casual' ? 'bestCasualDay' : 'bestDay';
  result[field] = Math.max(result[field] ?? 0, progress.day);
  return result;
}
export function mergeProfiles(profile: GlobalProfile, other: GlobalProfile): GlobalProfile {
  let merged = mergeProfile(profile, { earnedMedals: other.medals, day: other.bestDay });
  if (other.bestHardcoreDay !== undefined) merged = mergeProfile(merged, { earnedMedals: [], day: other.bestHardcoreDay, mode: 'hardcore' });
  if (other.bestCasualDay !== undefined) merged = mergeProfile(merged, { earnedMedals: [], day: other.bestCasualDay, mode: 'casual' });
  return merged;
}
