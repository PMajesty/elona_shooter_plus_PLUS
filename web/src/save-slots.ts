import { HERO_CLASSES, isHeroClass } from './hero-classes.ts';
import { validCampaignDay } from './missions.ts';
import { supportedSaveVersion } from './save-version.ts';
import type { SaveRead } from './storage.ts';
import { readRuleset, RULESETS } from './rulesets.ts';

export function saveSlotLabel(saved: SaveRead): string {
  if (saved.kind === 'empty') return 'Empty Save';
  if (saved.kind === 'error') return 'Unreadable Save';
  const data = saved.data as { format?: unknown; version?: unknown; simulation?: { ruleset?: unknown; day?: unknown; mode?: unknown; player?: { classId?: unknown; level?: unknown } } } | null;
  const state = data?.simulation, hero = state?.player;
  if (data?.format !== 'elona-shooter-browser' || !supportedSaveVersion(data.version) || !isHeroClass(hero?.classId)
    || !Number.isSafeInteger(hero?.level) || Number(hero?.level) < 1 || !validCampaignDay(state?.day)) return 'Unreadable Save';
  try {
    const edition = readRuleset(state!.ruleset, data.version);
    return `${RULESETS[edition.id].name} · ${HERO_CLASSES[hero.classId].name}(${hero.level}) Day.${state!.day}${state!.mode === 'hardcore' ? ' HC' : ''}`;
  } catch { return 'Unsupported Edition'; }
}
