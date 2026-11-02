import { readFlashSharedObject, type FlashSharedObject } from './flash-shared-object.ts';
import { Simulation, type SimulationState } from './simulation.ts';
import { HERO_CLASSES, type HeroClass } from './hero-classes.ts';
import { ALL_TRAITS, partySkills } from './party-progression.ts';
import { createPartyState, type PartyMember } from './party.ts';
import { createPartyAIShared } from './party-ai.ts';
import { type Item } from './items.ts';
import { generateLowLevelMission, generateLowLevelWaves, MAX_CAMPAIGN_DAY } from './missions.ts';
import { prepareEarlyTown } from './town-preparation.ts';
import { createTownEconomy } from './town-economy.ts';
import { type FirstTownRecruit, type RecruitClass } from './recruits.ts';
import { type GlobalProfile } from './profile.ts';
import { DEFAULT_GAME_OPTIONS, savedGameOptions } from './game-options.ts';
import { type GameMods } from './game-mods.ts';
import { SAVE_VERSION } from './save-version.ts';
import { TITLES, type Title } from './titles.ts';

type RecordValue = Record<string, unknown>;
const record = (v: unknown): v is RecordValue => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const failure = (field: string): never => { throw new Error(`The Flash adventure contains invalid or unsupported ${field}.`); };
const number = (v: unknown, field: string, fallback?: number): number => {
  if (v === undefined && fallback !== undefined) return fallback;
  if (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) >= 1e12) return failure(field);
  return v;
};
const bool = (v: unknown, field: string, fallback = false): boolean => {
  if (v === undefined) return fallback;
  if (typeof v !== 'boolean') return failure(field);
  return v;
};
const text = (v: unknown, field: string): string => typeof v === 'string' ? v : failure(field);

export interface FlashAdventure {
  save: { format: 'elona-shooter-browser'; version: number; appearance: number; simulation: SimulationState; profile: GlobalProfile; options?: ReturnType<typeof savedGameOptions> };
  originalSlot: number; originalVersion: number; className: string; day: number;
}

/** saveGame6311: четыре объекта исходного городского checkpoint; AMF не исполняется. */
export function readFlashAdventure(bytes: Uint8Array, profile: GlobalProfile, decoded?: FlashSharedObject): FlashAdventure {
  const { name, data } = decoded ?? readFlashSharedObject(bytes);
  if (!/^elonas[0-7]$/.test(name) || data.deleted === true || !record(data.game) || !record(data.player)
    || !record(data.inventory) || !record(data.mission)) return failure('town checkpoint');
  const game = data.game, player = data.player, inventory = data.inventory, mission = data.mission;
  const version = number(game.version, 'version');
  if (!Number.isInteger(version) || version < 1301 || version > 1304) throw new Error('This importer supports Flash adventures from Elona Shooter 1.3.0.1–1.3.0.4.');
  const day = number(game.day, 'day');
  if (!Number.isInteger(day) || day < 1 || day > MAX_CAMPAIGN_DAY) return failure(`day (supported range: 1–${MAX_CAMPAIGN_DAY})`);
  const cell = (object: RecordValue, key: string, index: number): unknown => {
    const values = object[key];
    if (values === undefined) return undefined;
    if (!Array.isArray(values) || values.length > 2000) return failure(key);
    return values[index];
  };
  const pn = (key: string, i: number, fallback?: number) => number(cell(player, key, i), `player.${key}[${i}]`, fallback);
  const gn = (key: string, fallback?: number) => number(game[key], key, fallback);
  const traits = (i: number): Record<number, number> => {
    const values = cell(player, 'trait', i);
    if (!Array.isArray(values) || values.length > 1000) return failure('traits');
    const result: Record<number, number> = {};
    for (const [key, amount] of Object.entries(values)) {
      if (amount === undefined || amount === null || amount === 0) continue;
      if (!/^\d+$/.test(key) || !Object.hasOwn(ALL_TRAITS, key)) return failure('traits');
      result[Number(key)] = number(amount, 'trait level');
    }
    return result;
  };
  const weaponExp = (i: number): number[] => {
    const values = cell(player, 'wexp', i);
    if (!Array.isArray(values) || values.length !== 5) return failure('weapon experience');
    return values.map(v => number(v, 'weapon experience'));
  };
  const itemNumbers = ['num', 'id', 'graphic', 'type', 'reloadTime', 'reloadTimeMax', 'ammo', 'ammoMax', 'value', 'mod',
    'modMax', 'shell', 'lv', 'typeMinor', 'special', 'leech', 'impact', 'shootRate', 'rare', 'autoReload', 'livingWeapon'] as const;
  const optionalNumbers = ['baseAccuracy', 'accuracyDec', 'attack', 'dmgAir', 'dmgArmor', 'reqTrait', 'reqLv', 'range'] as const;
  const item = (i: number): Item | null => {
    const num = cell(inventory, 'num', i), id = cell(inventory, 'id', i);
    if ((num === undefined || num === 0) && id === undefined) return null;
    const result: RecordValue = {};
    for (const key of itemNumbers) result[key] = number(cell(inventory, key, i), `inventory.${key}[${i}]`, key === 'ammo' ? 0 : undefined);
    for (const key of optionalNumbers) if (cell(inventory, key, i) !== undefined) result[key] = number(cell(inventory, key, i), key);
    result.name = text(cell(inventory, 'name', i), 'item name');
    result.modText = text(cell(inventory, 'modText', i), 'item MOD description');
    result.automatic = bool(cell(inventory, 'automatic', i), 'automatic fire');
    result.manualReload = bool(cell(inventory, 'manualReload', i), 'manual reload');
    return result as unknown as Item;
  };
  const member = (i: number): PartyMember | null => {
    if (cell(player, 'devType', i) === undefined) return null;
    return { devType: pn('devType', i) as RecruitClass, sex: pn('sex', i), name: text(cell(player, 'name', i), 'character name'),
      appearance: pn('pic', i), potentialAim: pn('potentialAim', i), potentialTeam: pn('potentialTeam', i),
      nextTrait: pn('nextTrait', i), trained: pn('trained', i), optBoss: bool(cell(player, 'optBoss', i), 'boss priority'),
      optWall: bool(cell(player, 'optWall', i), 'wall priority'), kills: pn('kill', i), earnedGold: pn('earn', i),
      money: pn('money', i), cost: pn('cost', i), ai: pn('ai', i), focus: pn('forcus', i),
      level: pn('lv', i), exp: pn('exp', i), skillPoints: pn('sp', i), traits: traits(i), weaponExp: weaponExp(i),
      shootTimer: 0, accuracyFix: 0, rampageTicks: 0, bowDrawing: false, aiState: null };
  };
  const classId = (Object.keys(HERO_CLASSES) as HeroClass[]).find(id => HERO_CLASSES[id].id === pn('devType', 0));
  if (!classId) return failure('hero class');
  const hardcore = bool(game.HC, 'Hardcore mode'), casual = bool(game.casual, 'Casual mode');
  if (hardcore && casual) return failure('difficulty mode');
  const mode = hardcore ? 'hardcore' : casual ? 'casual' : 'normal';
  const mods: GameMods = {};
  for (const [field, key] of Object.entries({ optionBossDropMod: 'bossMods', MORE: 'intense', optWeaponLevel: 'weaponLevel', skipHard: 'skipHard', tight: 'tight', laptop: 'laptop', comp: 'community' } as const)) {
    if (bool(game[field], field)) mods[key] = true;
  }
  // Flash не сохраняет Math.random: новый поток зависит только от файла, а не даты импорта.
  let seed = 2166136261;
  for (const byte of bytes) seed = Math.imul(seed ^ byte, 16777619) >>> 0;
  seed ||= 1;
  let contextSeed = seed;
  const contextRandom = () => { contextSeed ^= contextSeed << 13; contextSeed ^= contextSeed >>> 17; contextSeed ^= contextSeed << 5; return (contextSeed >>> 0) / 4294967296; };
  const sim = new Simulation(seed, { heroClass: classId, mode, mods, medals: profile.medals });
  const state = sim.state;
  const medals = state.earnedMedals, absorbFix = [60, 61, 62, 63].filter(id => medals.includes(id)).length / 100;
  const past = generateLowLevelMission(day - 1, Math.max(1, day - 1), contextRandom, { absorbFix, casual, intense: mods.intense });
  const waves = generateLowLevelWaves(past, day, contextRandom, mods).waves;
  for (const wave of waves) { wave.enemies = []; wave.delays = []; }
  Object.assign(state, { phase: 'town', day, tick: 0, timerRemainder: 0, rng: seed, nextUid: 1,
    activeMission: Object.fromEntries(Object.keys(state.activeMission).map(key => [key, past[key as keyof typeof past]])),
    resultBefore: gn('totalMoney'), perfectDays: gn('noDamage'), bossesSpawned: gn('boss'), title: gn('title') as Title,
    castleHp: gn('castleHP'), castleMaxHp: gn('castleMHP'), wallLevel: gn('wallUpgrade'), wallFixCount: gn('wallFix'),
    repairmanLevel: gn('repair'), sandbagLevel: gn('sandbag'), looterLevel: gn('looter'), trainerLevel: gn('trainer'),
    gold: pn('money', 0), totalMoney: gn('totalMoney'), kills: 0, killHistory: { completed: gn('totalKill') }, criticalKills: 0,
    waves, waveIndex: waves.length, bossWave: past.bossWave, newWave: true, spawnTimer: 0, noDamage: false,
    enemies: [], projectiles: [], enemyArrows: [], loot: [], lootOffers: Array(8).fill(null), postbattle: 'result',
    previousTown: day === 1 ? null : { ...prepareEarlyTown(contextRandom, day - 1, { absorbFix, casual, intense: mods.intense, community: mods.community }), mission: past, ap: 0, preparation: 'ready' },
    result: { reward: 0, perfectBonus: 0, upkeep: 0, tax: 0, salary: 0, wages: 0, netReward: 0 },
    hero: { provenance: 'original-generation', name: 'You', sex: pn('sex', 0), potentialAim: pn('potentialAim', 0), potentialTeam: pn('potentialTeam', 0), nextTrait: pn('nextTrait', 0) },
    party: createPartyState(), partyAI: createPartyAIShared(), retainedAITargets: [],
  });
  if (!TITLES[state.title] || gn('titleMoney') !== TITLES[state.title].salary) return failure('title salary');
  if (bool(game.carryOver, 'Carry Over')) state.carryOver = true;
  if (gn('recycleCount')) state.recycleCount = gn('recycleCount');
  const size = gn('invSlot');
  if (!Number.isInteger(size) || size < 6 || size > 16) return failure('inventory capacity');
  state.inventory = Array.from({ length: size }, (_, i) => item(20 + i));
  Object.assign(state.player, { level: pn('lv', 0), exp: pn('exp', 0), skillPoints: pn('sp', 0), traits: traits(0), weaponExp: weaponExp(0), selectedSlot: 0 });
  state.heroSettings = { order: pn('ai', 0), focus: pn('forcus', 0), boss: bool(cell(player, 'optBoss', 0), 'hero boss priority'), wall: bool(cell(player, 'optWall', 0), 'hero wall priority') };
  state.party.capacity = gn('house') as 1 | 2 | 3;
  for (const slot of state.party.slots) {
    slot.exists = bool(cell(player, 'exist', slot.slot), 'character existence'); slot.member = member(slot.slot); slot.weapon = item(40 + slot.slot);
  }
  state.partySkills = partySkills([state.player, ...state.party.slots.slice(0, 4).map(slot => slot.member ? { exist: slot.exists, traits: slot.member.traits } : null)]);
  state.economy = createTownEconomy();
  for (const [key, field] of Object.entries({ smith: 'smith', museum: 'museum', chickens: 'chicken', sisters: 'sister', villa: 'party', specialTrainer: 'spTrainer', eggsCollected: 'eggsCollected', sistersExploded: 'sistersExploded', searchTraining: 'train', fame: 'fame', robberies: 'robCount', visitorsRobbed: 'childrenRobbed', prayers: 'prayerCount', parties: 'partyCount', taunts: 'tauntCount' } as const)) {
    (state.economy as unknown as Record<string, unknown>)[key] = gn(field);
  }
  state.economy.heroTraining = pn('trained', 0);
  const candidate = state.party.slots[4].member;
  if (!candidate) return failure('recruit');
  const recruitItems: Record<number, Item> = {};
  for (const i of [45, 47, 48]) { const value = item(i); if (value) recruitItems[i] = value; }
  const recruit: FirstTownRecruit = { exist: true, sex: candidate.sex, name: candidate.name, devType: candidate.devType,
    potentialAim: candidate.potentialAim, potentialTeam: candidate.potentialTeam, trait: candidate.traits,
    lv: candidate.level, sp: candidate.skillPoints, trained: 0, optBoss: true, optWall: true, kill: 0, earn: 0, money: 200,
    nextTrait: candidate.nextTrait, ai: 0, forcus: -1, cost: candidate.cost, exp: 0, wexp: [0, 0, 0, 0, 0], pic: candidate.appearance, items: recruitItems };
  const flags = { specialSale: gn('specialSale', 0), egg: bool(game.egg, 'egg collection'), partyHeld: bool(game.partyHeld, 'party'),
    prayed: bool(game.prayed, 'prayer'), robbed: gn('robbed'), taunted: gn('taunted') };
  const effects = [0, ...Array.from({ length: 10 }, (_, i) => 9 + i * 4)];
  const negotiator = effects.find(effect => Math.trunc((600 + day * 20) * (100 + effect) / 100) === mission.reward) ?? 0;
  const next = generateLowLevelMission(day, day, contextRandom, { absorbFix, casual, intense: mods.intense, negotiator });
  for (const key of Object.keys(next)) if (mission[key] !== undefined) (next as unknown as RecordValue)[key] = structuredClone(mission[key]);
  // Старые поля расчёта результата не относятся к новой миссии и не возобновляют бой.
  if (!Array.isArray(game.card)) return failure('town cards');
  const cards = game.card.map(value => number(value, 'town card'));
  state.town = { ap: gn('ap'), preparation: 'ready', shop: Array.from({ length: 8 }, (_, i) => item(i)),
    cards, mission: next, recruit, flags, searched: gn('searched', Math.trunc(contextRandom() * 1000)),
    preparationEffects: { shopEngineer: 0, missionNegotiator: negotiator, recruitEngineer: 0 },
    ...(flags.prayed ? { baseAbsorbFix: absorbFix } : {}) };
  const options = { ...DEFAULT_GAME_OPTIONS, showDamage: bool(game.optionShowDamage, 'damage display', true), showAllyDamage: bool(game.optionShowAllyDamage, 'NPC damage display'),
    lowQuality: bool(game.optionLowQuality, 'quality'), disableFireworks: bool(game.optionFirework, 'fireworks'), colorBlind: bool(game.optionColor, 'crosshair'), disableFlash: bool(game.optionFlashShot, 'screen flash') };
  let simulation: SimulationState;
  try { simulation = Simulation.fromSave(sim.toSave()).toSave(); }
  catch (error) { throw new Error(`The Flash checkpoint could not be converted: ${error instanceof Error ? error.message : 'unsupported state'} Import its elonas_idx.sol collection first if medal defense differs.`); }
  return { originalSlot: Number(name.at(-1)), originalVersion: version, className: HERO_CLASSES[classId].name, day,
    save: { format: 'elona-shooter-browser', version: SAVE_VERSION, appearance: pn('pic', 0), simulation, profile: structuredClone(profile), ...(savedGameOptions(options) ? { options } : {}) } };
}
