export const GAME_MODS = {
  bossMods: { name: 'Bosses drop Mod', label: 'Bosses always drop MODs instead of weapons.' },
  intense: { name: 'Intense Start', label: "More intense enemies at the beginning. It's hard but more coins!" },
  weaponLevel: { name: 'Limit high level weapons', label: "Don't generate too high level weapons." },
  skipHard: { name: 'Skip hard waves', label: 'Skip hard waves(no more 10+ suicide bombers).' },
  tight: { name: 'Tighter crosshair', label: 'Tighter accuracy&cross-hair. Slightly less exp gains.' },
  laptop: { name: 'Laptop difficulty', label: 'Laptop difficulty. Enemies move 30% slower.' },
  community: { name: 'Community Compilation', label: 'Community Compilation Mod.' },
  aimAssist: { name: 'Aim Assist', label: 'Aim Assist: a small nudge toward nearby targets.' },
} as const;
export type GameMod = keyof typeof GAME_MODS;
// Текст исходного окна detailwin_287 относится именно к Community Compilation.
export const COMMUNITY_MOD_DETAILS = "-In mod sales day, the blacksmith will still sell mods after refreshing his inventory. \n\n"
  + "-You will get 1/2 AP from your Active Skill. But you always get full AP.";
export type GameMods = Partial<Record<GameMod, true>>;
export function validGameMods(value: unknown): value is GameMods {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    && Object.entries(value!).every(([key, enabled]) => Object.hasOwn(GAME_MODS, key) && enabled === true);
}
