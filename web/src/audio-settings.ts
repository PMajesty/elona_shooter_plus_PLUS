export type AudioChannel = 'master' | 'effects' | 'ambience';
export type AudioSettings = Record<AudioChannel, number>;
export type SoundCategory = 'effects' | 'ambience' | 'silent' | 'unused';
export const AUDIO_SETTINGS_KEY = 'elona-shooter-plus-plus.port.audio.v1';
export const DEFAULT_AUDIO_SETTINGS: Readonly<AudioSettings> = Object.freeze({ master: 1, effects: 1, ambience: 1 });

// Классификация по месту воспроизведения в исходном AS, а не по названию файла.
// Полный перечень и ссылки на исходные вызовы: docs/audio-settings.md.
export const SOUND_CATEGORIES: Readonly<Record<string, SoundCategory>> = Object.freeze({
  soundBgForest: 'ambience', soundBgTown: 'ambience',
  soundMute: 'silent', soundBad: 'unused',
  soundGun1: 'effects', soundGun2: 'effects', soundGun3: 'effects', soundGun4: 'effects', soundGun5: 'effects',
  soundGun6: 'effects', soundGun7: 'effects', soundGun8: 'effects', soundGun9: 'effects', soundGun10: 'effects',
  soundGun11: 'effects', soundGun12: 'effects', soundGun13: 'effects', soundGun14: 'effects', soundGun15: 'effects',
  soundBow1: 'effects', soundBow2: 'effects', soundChain1: 'effects', soundChain2: 'effects', soundChain3: 'effects',
  soundReloading1: 'effects', soundReloading2: 'effects', soundReloading3: 'effects',
  soundReloaded1: 'effects', soundReloaded2: 'effects', soundReloaded3: 'effects',
  soundThrow1: 'effects', soundExp1: 'effects', soundFireball: 'effects', soundLightning: 'effects',
  soundPuls: 'effects', soundLaunch: 'effects', soundDrop: 'effects', soundDefend: 'effects',
  soundDamage1: 'effects', soundLow: 'effects', soundRampage: 'effects', soundRampageEnemy: 'effects',
  soundDead1: 'effects', soundDead2: 'effects', soundDead3: 'effects', soundDead4: 'effects', soundDead5: 'effects',
  soundDead6: 'effects', soundDead7: 'effects', soundDead8: 'effects', soundDead9: 'effects',
  soundDeadChicken: 'effects', soundDeadBoss1: 'effects', soundDeadBoss2: 'effects',
  soundChicken: 'effects', soundChickenAttack: 'effects', soundCrow: 'effects', soundCata: 'effects', soundTank: 'effects', soundTank2: 'effects',
  soundGoodshot0: 'effects', soundGoodshot1: 'effects', soundGoodshot2: 'effects', soundGoodshot3: 'effects', soundGoodshot4: 'effects',
  soundBattleBegin: 'effects', soundBattleEnd: 'effects', soundKilled: 'effects', soundComplete: 'effects',
  soundMedal: 'effects', soundAward: 'effects', soundGold1: 'effects', soundBag1: 'effects', soundPop1: 'effects',
  soundFirework: 'effects', soundImpact1: 'effects', soundClick1: 'effects', soundScroll1: 'effects',
  soundBeep: 'effects', soundCard1: 'effects', soundPay1: 'effects', soundMod: 'effects', soundGood: 'effects',
  soundSearch: 'effects', soundEat1: 'effects', soundParty: 'effects', soundNight: 'effects', soundPray1: 'effects', soundRepair1: 'effects',
});

export function soundCategory(key: string): SoundCategory {
  if (!Object.hasOwn(SOUND_CATEGORIES, key)) throw new Error(`Unclassified sound: ${key}`);
  return SOUND_CATEGORIES[key];
}

export function normalizeAudioSettings(value: unknown): AudioSettings {
  const result = { ...DEFAULT_AUDIO_SETTINGS };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const key of Object.keys(result) as AudioChannel[]) {
    const level = (value as Record<string, unknown>)[key];
    if (typeof level === 'number' && Number.isFinite(level)) result[key] = Math.max(0, Math.min(1, level));
  }
  return result;
}

export function readAudioSettings(): AudioSettings {
  try { return normalizeAudioSettings(JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) ?? 'null')); }
  catch (error) {
    console.warn('Sound settings could not be read; using the default mix for this session.', error);
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

let reportedWriteFailure = false;
export function storeAudioSettings(settings: AudioSettings): boolean {
  try {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(normalizeAudioSettings(settings)));
    reportedWriteFailure = false; return true;
  } catch (error) {
    // Сбой сохранения не мешает регулировать звук; следующий ввод снова пробует запись.
    if (!reportedWriteFailure) console.warn('Sound settings could not be saved; this session keeps the selected mix.', error);
    reportedWriteFailure = true; return false;
  }
}
