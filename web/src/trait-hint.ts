import { ALL_TRAITS } from './party-progression.ts';
import { describeTrait, type TraitLevels } from './progression.ts';

export interface OriginalHintInfo { name: string; description: string; effect: string; maximum?: string; kind?: string }

/** REF в setTrait: текущий уровень, без имени следующего улучшения из окна выбора. */
export function traitHintValues(id: number, traits: Readonly<TraitLevels>): OriginalHintInfo {
  const info = describeTrait(id, traits, ALL_TRAITS), definition = ALL_TRAITS[id], level = traits[id] ?? 0;
  return { name: definition.name + (definition.maxLevel > 1 && level > 1 ? ` ${level}` : ''),
    description: info.description, effect: info.currentEffect,
    maximum: definition.maxLevel === 999 ? '' : String(definition.maxLevel),
    kind: id < 100 || id >= 900 ? 'Base Skill' : definition.party ? 'Party Skill' : '' };
}
