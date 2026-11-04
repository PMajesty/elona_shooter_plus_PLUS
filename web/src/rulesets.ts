import { HERO_CLASSES } from './hero-classes.ts';
import { BASE_ITEM_FIELDS } from './items.ts';
import { ENEMIES } from './content.ts';

export type RulesetId = 'classic' | 'expanded';
export interface RulesetIdentity { id: RulesetId; revision: 1 }
const originalContent = Object.freeze({ classes: HERO_CLASSES, items: BASE_ITEM_FIELDS, enemies: ENEMIES });
export const RULESETS = Object.freeze({
  classic: Object.freeze({ id: 'classic' as const, revision: 1 as const, name: 'Classic', carefulConsideration: false, content: originalContent }),
  expanded: Object.freeze({ id: 'expanded' as const, revision: 1 as const, name: 'Expanded', carefulConsideration: true, content: originalContent }),
});
export function rulesetIdentity(id: RulesetId): RulesetIdentity {
  if (!Object.hasOwn(RULESETS, id)) throw new Error('Unknown game edition.');
  return { id, revision: RULESETS[id].revision };
}
export function readRuleset(value: unknown, saveVersion: number): RulesetIdentity {
  // Только известный старый формат допускает отсутствие метаданных издания.
  if (value === undefined && saveVersion <= 45) return rulesetIdentity('classic');
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Missing game edition.');
  const candidate = value as RulesetIdentity;
  if (!Object.hasOwn(RULESETS, candidate.id) || candidate.revision !== RULESETS[candidate.id].revision
    || saveVersion < 46 && candidate.id !== 'classic') throw new Error('Unsupported game edition or content revision.');
  return rulesetIdentity(candidate.id);
}
