import { readFlashSharedObject } from './flash-shared-object.ts';
import { MEDALS } from './medals.ts';
import { validProfile, type GlobalProfile } from './profile.ts';

export interface FlashCollection { profile: GlobalProfile; ignoredMedals: number[] }

/** saveIndex10961/loadIndex7052: idx и разреженный medal хранятся в elonas_idx. */
export function readFlashCollection(bytes: Uint8Array): FlashCollection {
  const { name, data } = readFlashSharedObject(bytes);
  if (/^elonas\d+$/.test(name)) throw new Error('Flash adventure conversion is not ready. Select elonas_idx.sol for medals.');
  const idx = data.idx;
  if (name !== 'elonas_idx' || !idx || typeof idx !== 'object' || Array.isArray(idx) || !Array.isArray(data.medal)) {
    throw new Error('This is not an Elona Shooter collection. Select elonas_idx.sol.');
  }
  const index = idx as Record<string, unknown>;
  const day = (key: string): number => {
    const value = index[key] ?? 0;
    if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > 1000000) throw new Error('The Flash collection contains an invalid survival record.');
    return Number(value);
  };
  const medals: number[] = [], ignoredMedals: number[] = [];
  if (data.medal.length > 200) throw new Error('The Flash collection contains invalid medal flags.');
  for (const [key, earned] of Object.entries(data.medal)) {
    const id = Number(key);
    if (!/^(0|[1-9]\d*)$/.test(key) || id >= 200 || ![undefined, null, false, true].includes(earned)) throw new Error('The Flash collection contains invalid medal flags.');
    if (earned === true) (Object.hasOwn(MEDALS, id) ? medals : ignoredMedals).push(id);
  }
  const profile: GlobalProfile = { version: 1, medals: medals.sort((a, b) => a - b), bestDay: day('day') };
  if (index.dayHC !== undefined || index.daysHC !== undefined) profile.bestHardcoreDay = Math.max(day('dayHC'), day('daysHC'));
  if (index.dayCasual !== undefined) profile.bestCasualDay = day('dayCasual');
  if (!validProfile(profile)) throw new Error('The Flash medal collection could not be converted.');
  return { profile, ignoredMedals };
}
