import { Simulation } from '../../src/simulation.ts';
import { HERO_CLASSES, type HeroClass } from '../../src/hero-classes.ts';
import { TITLES } from '../../src/titles.ts';
import type { Item } from '../../src/items.ts';
import type { PartyMember } from '../../src/party.ts';
import { createProfile, mergeProfile } from '../../src/profile.ts';
import { flashFixture } from './flash-fixture.ts';

export interface AdventureData { game: Record<string, unknown>; player: Record<string, unknown[]>; inventory: Record<string, unknown[]>; mission: Record<string, unknown>; deleted: boolean }

// Контролируемая схема saveGame: не образец реального файла игрока и не Flash-oracle.
export function sourceAdventure(sim: Simulation): AdventureData {
  const s = sim.state, town = s.town;
  if (town?.preparation !== 'ready') throw new Error('A ready town is required.');
  const game: Record<string, unknown> = { version: 1304, day: s.day, castleHP: s.castleHp, castleMHP: s.castleMaxHp,
    wallUpgrade: s.wallLevel, wallFix: s.wallFixCount, repair: s.repairmanLevel, sandbag: s.sandbagLevel,
    looter: s.looterLevel, trainer: s.trainerLevel, house: s.party.capacity, storage: s.inventory.length - 5,
    invSlot: s.inventory.length, title: s.title, titleMoney: TITLES[s.title].salary, ap: town.ap,
    card: town.cards, noDamage: s.perfectDays, boss: s.bossesSpawned, totalMoney: s.totalMoney,
    totalKill: (s.killHistory?.completed ?? 0) + s.kills, recycleCount: s.recycleCount ?? 0,
    HC: s.mode === 'hardcore', casual: s.mode === 'casual', carryOver: Boolean(s.carryOver),
    optionBossDropMod: Boolean(s.mods?.bossMods), MORE: Boolean(s.mods?.intense), optWeaponLevel: Boolean(s.mods?.weaponLevel),
    skipHard: Boolean(s.mods?.skipHard), tight: Boolean(s.mods?.tight), laptop: Boolean(s.mods?.laptop), comp: Boolean(s.mods?.community),
    specialSale: town.flags.specialSale, egg: town.flags.egg, partyHeld: town.flags.partyHeld, prayed: town.flags.prayed,
    robbed: town.flags.robbed, taunted: town.flags.taunted, searched: town.searched, optionShowDamage: true,
    optionShowAllyDamage: false, optionLowQuality: false, optionFirework: false, optionColor: false, optionFlashShot: false };
  for (const [field, key] of Object.entries({ smith: 'smith', museum: 'museum', chicken: 'chickens', sister: 'sisters', party: 'villa', spTrainer: 'specialTrainer', eggsCollected: 'eggsCollected', sistersExploded: 'sistersExploded', train: 'searchTraining', fame: 'fame', robCount: 'robberies', childrenRobbed: 'visitorsRobbed', prayerCount: 'prayers', partyCount: 'parties', tauntCount: 'taunts' } as const)) game[field] = s.economy[key];
  const player: Record<string, unknown[]> = {}, inventory: Record<string, unknown[]> = { num: Array(50).fill(0), value: Array(50).fill(0) };
  const set = (object: Record<string, unknown[]>, field: string, index: number, value: unknown) => { (object[field] ??= [])[index] = value; };
  const putItem = (index: number, value: Item | null) => { if (value) for (const [key, amount] of Object.entries(value)) set(inventory, key, index, amount); };
  s.inventory.forEach((value, i) => putItem(20 + i, value)); town.shop.forEach((value, i) => putItem(i, value));
  for (const [i, value] of Object.entries(town.recruit.items)) putItem(Number(i), value);
  const putActor = (i: number, actor: PartyMember, exists: boolean) => {
    const trait: number[] = [];
    for (const [id, value] of Object.entries(actor.traits)) trait[Number(id)] = value;
    for (const [key, value] of Object.entries({ exist: exists, devType: actor.devType, sex: actor.sex, name: actor.name, pic: actor.appearance,
      potentialAim: actor.potentialAim, potentialTeam: actor.potentialTeam, nextTrait: actor.nextTrait, trained: actor.trained,
      optBoss: actor.optBoss, optWall: actor.optWall, kill: actor.kills, earn: actor.earnedGold, money: actor.money,
      cost: actor.cost, ai: actor.ai, forcus: actor.focus, lv: actor.level, exp: actor.exp, sp: actor.skillPoints, trait, wexp: actor.weaponExp })) set(player, key, i, value);
  };
  putActor(0, { ...s.player, devType: HERO_CLASSES[s.player.classId].id, sex: s.hero.sex, name: 'You', appearance: 7,
    potentialAim: s.hero.potentialAim, potentialTeam: s.hero.potentialTeam, nextTrait: s.hero.nextTrait, trained: s.economy.heroTraining,
    optBoss: s.heroSettings?.boss ?? true, optWall: s.heroSettings?.wall ?? true, kills: s.kills, earnedGold: 0, money: s.gold,
    cost: 350 + s.player.level * 50, ai: s.heroSettings?.order ?? -1, focus: s.heroSettings?.focus ?? -1, aiState: null }, true);
  for (const slot of s.party.slots) {
    set(player, 'exist', slot.slot, slot.exists);
    if (slot.member) putActor(slot.slot, slot.member, slot.exists);
    putItem(40 + slot.slot, slot.weapon);
  }
  return { game, player, inventory, mission: { ...town.mission, resultBefore: s.resultBefore, resultTaken: 0 }, deleted: false };
}

export function adventureFixture(classId: HeroClass = 'hunter', day = 3, mode: 'normal' | 'casual' | 'hardcore' = 'normal') {
  const sim = new Simulation(42, { heroClass: classId, mode });
  for (let n = 1; n <= day; n++) {
    sim.state.noDamage = false; sim['finishDay']();
    while (['loot', 'boss-loot'].includes(sim.state.postbattle)) sim.finishLoot();
    while (sim.state.postbattle === 'skill') sim.chooseSkill(sim.state.skillChoices[0]);
    sim.enterTown(); if (n < day) sim.startNextDay();
  }
  const profile = mergeProfile(createProfile(), sim.state), data = sourceAdventure(sim);
  return { sim, profile, data, bytes: flashFixture('elonas3', data) };
}
