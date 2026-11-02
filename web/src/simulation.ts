import { generateEarlyTownRecruit } from './recruits.ts';
import { createTownEconomy, validTownEconomy, museumIncome, TOWN_ACTIVITIES, type TownEconomy, type TownActivity } from './town-economy.ts';
import { ENEMY_TIMELINES, type EnemyTimeline } from './enemy-timelines.ts';
import { SAVE_VERSION, supportedSaveVersion } from './save-version.ts';
import { HERO_CLASSES, isHeroClass, applyHeroChoice, availableHeroTraits, rollHeroChoices, type HeroClass } from './hero-classes.ts';
import { ENEMIES, FIRST_DAY, GRENADE, SHOTGUN, SIMULATION_HZ, STARTING_CLASS, TIMER_HZ, WORLD, type EnemyKind, type Rect } from './content.ts';
import { generateLowLevelMission, generateLowLevelWaves, validCampaignDay, MAX_CAMPAIGN_DAY, type LowLevelMission } from './missions.ts';
import { generateHero, isKnownHeroInitialization, levelUpHero, reconstructSheriffHero, type KnownHeroInitialization } from './hero.ts';
import { advanceReload, autoReloadReady, COMBAT_TRAIT, combatTrait, criticalType, hitscanHit, hitscanShotModifiers, criticalKillCooldown, duelistHitFrenzy, livingWeaponKill, rampageDuration, recoverAccuracy, reloadTimer, shotDamage, shotSpread, weaponBehavior, weaponHitDamage, weaponHitEffects, weaponStats } from './combat-stats.ts';
import { BASE_ITEM_FIELDS, ITEM_TYPE, ItemFactory, collectLoot as collectLootItem, createStartingInventory, isOccupiedItem, itemPrice, swapInventorySlots, type Item } from './items.ts';
import { prepareEarlyTown, generateTownShop, type FirstTownPreparation } from './town-preparation.ts';
import { validTownPreparation } from './town-save.ts';
import { TRAIT, createSheriffTraits, type TraitLevels } from './progression.ts';
import { shadowHitAtFrame } from './collision.ts';
import { advanceProtection, explosionContains, explosionStats, planConsumableUse } from './consumables.ts';
import { advanceProjectile, createProjectile, type ExplosionKind, type ProjectileState } from './projectiles.ts';
import { createUpgradePreview, modMountFailure, upgradeCost, type TownEquipmentAction, type TownEquipmentOutcome, type LootItemAddress, type LootEquipmentAction } from './equipment.ts';
import { advanceEnemyArrow, createEnemyArrow, type EnemyArrowState } from './enemy-arrows.ts';
import { ARCHER_DISPLAY_WIDTHS, FLY_DISPLAY_WIDTHS, barbarianParentWidth, lavaParentWidth } from './enemy-display-bounds.ts';
import { createPartyState, addStartingLittleGirl, installCandidate, partySlot, hireFailure, hireCandidate, dismissCompanion, movePartyEquipment, resolvePartyMod, type CombatActorState, type PartyState, type PartyPendingAction, type PartyEquipmentAddress } from './party.ts';
import { ALL_TRAITS, CLASS_CHOICE_ORDER, availableCompanionTraits, partySkills, gainCompanionTrait, levelUpCompanion, companionWage, type PartySkillState } from './party-progression.ts';
import { createPartyAIShared, createPartyAIState, selectPartyTarget, refreshPartyAI, partyActorPosition, registerPartyTarget, alertParty, clearPartyTargetCache, clearPartyAITarget, stepPartyAIFrame, stepPartyAITimer, type PartyAIShared, type PartyAITarget, type PartyAIContext, type PartyAICallbacks } from './party-ai.ts';
import { repairEarlyV15AirTargets, validatePartySave } from './party-save.ts';
import { CASTLE_UPGRADES, castleUpgradeCost, castleUpkeep, castleRepairAmount, castleDamageMultiplier, castleTrainerMultiplier, type CastleUpgradeKind, type CastleUpgradeOutcome } from './castle-upgrades.ts';

export interface EnemyState {
  bomb?: { startX: number; startY: number; targetX: number; targetY: number; curve: number; counter: number; rotation: number };
  uid: number; kind: EnemyKind; x: number; y: number; hp: number; maxHp: number;
  speed: number; speedOrg: number; attack: number; gold: number; exp: number;
  knockBack: number; disarmed: number; attacking: boolean; attacked: boolean; frame: number; shadowHit: boolean;
  deathTicks: number; drop: number; removed: boolean;
  bossAction: number; bossCount: number; bossIdle: number; bossFireNum: number; bossWeapon: number; bossDamage: number; appearance: number;
  behaviorCounter?: number; direction?: number; fallTargetY?: number;
  rangedCounter?: number;
  flyCounter?: number;
  alerted?: boolean;
  rampage?: 0 | 100;
  rageEffectFrame?: number;
  hitEffects?: { frame: number; x: number; y: number }[];
  bossFacing?: 1 | -1; bossSpecial?: 'grenade' | 'rocket';
  type?: 0 | 1 | 2; tag?: number; onMark?: boolean;
}
export interface WaveState { enemies: EnemyKind[]; delays: number[]; initialCount: number }
export type ActiveMission = Pick<LowLevelMission, 'level' | 'fixedLv' | 'strength' | 'powerOrg' | 'reward' | 'spawnRate' | 'hpFix' | 'dmgFix' | 'expFix' | 'absorbFix' | 'bossDay'>;
export type ReadyTown = FirstTownPreparation & { ap: number; preparation: 'ready' };
export interface SimulationState {
  version: typeof SAVE_VERSION; phase: 'battle' | 'victory' | 'defeat' | 'town'; day: number; tick: number; timerRemainder: number; rng: number; nextUid: number;
  activeMission: ActiveMission; resultBefore: number; earnedMedals: number[]; perfectDays: number; bossesSpawned: number;
  economy: TownEconomy;
  hero: KnownHeroInitialization; title: 0 | 1;
  castleHp: number; castleMaxHp: number; wallLevel: number; wallFixCount: number; repairmanLevel: number; sandbagLevel: number; looterLevel: number; trainerLevel: number; gold: number; totalMoney: number; kills: number; criticalKills: number;
  aimX: number; aimY: number; fireHeld: boolean; pendingShot: boolean;
  player: { classId: HeroClass; grenadeCount: number; level: number; exp: number; skillPoints: number; traits: TraitLevels; weaponExp: number[]; selectedSlot: number; shootTimer: number; accuracyFix: number; rampageTicks: number; bowDrawing: boolean };
  waveIndex: number; waves: WaveState[]; bossWave: number; newWave: boolean; spawnTimer: number; noDamage: boolean;
  enemies: EnemyState[]; projectiles: ProjectileState[]; enemyArrows: EnemyArrowState[]; loot: number[];
  itemCooldowns: number[];
  protection: { counter: number; blueMultiplierAdd: number };
  inventory: (Item | null)[]; lootOffers: (Item | null)[]; postbattle: 'none' | 'loot' | 'boss-loot' | 'skill' | 'result';
  inventoryProvenance: 'original-generation' | 'legacy-v1-reconstructed'; legacyReconstructionSeed?: number;
  bossKilled: number; skillChoices: number[]; traitsProvenance: 'known-starting-traits' | 'legacy-reconstructed'; bossKilledProvenance: 'observed' | 'legacy-inferred';
  result: { museum?: number; reward: number; perfectBonus: number; upkeep: number; tax: number; salary: number; wages: number; netReward: number };
  town: null | { ap: number; preparation: 'pending' } | ReadyTown;
  previousTown: ReadyTown | null;
  upgradeReference: Item | null;
  pendingTownAction: TownEquipmentAction | null;
  pendingLootAction: LootEquipmentAction | null;
  party: PartyState; partySkills: PartySkillState; partyAI: PartyAIShared; retainedAITargets: PartyAITarget[];
  pendingPartyAction: PartyPendingAction | null;
}
export interface Input { aimX?: number; aimY?: number; firePressed?: boolean; fireHeld?: boolean; fireReleased?: boolean; reload?: boolean; slot?: number }
export interface SimulationEvent { actorSlot?: number; type: 'lava-explode' | 'boss-special' | 'enemy-rage' | 'boss-shot' | 'enemy-arrow' | 'shot' | 'bow-draw' | 'hit' | 'kill' | 'castle-hit' | 'reload' | 'reloaded' | 'grenade' | 'explosion' | 'pulse' | 'wave' | 'victory' | 'defeat' | 'rampage' | 'level-up' | 'gold' | 'select' | 'beep' | 'repair' | 'protection' | 'defend'; x?: number; y?: number; amount?: number; weaponId?: number; automaticReload?: boolean; message?: string; critical?: boolean; criticalType?: number; enemyUid?: number; goodShotIndex?: number; bossGuard?: boolean; pellets?: { x: number; y: number }[]; explosionKind?: ExplosionKind; scale?: number }
export interface SimulationOptions { hitTest?: (enemy: Readonly<EnemyState>, x: number, y: number) => boolean; deferOpeningWaves?: boolean; heroClass?: HeroClass }
export type LootArea = LootItemAddress['area'];
export type RepairOutcome = 'repaired' | 'not-damaged' | 'not-enough-ap' | 'unavailable';
export type PurchaseOutcome = 'purchased' | 'occupied' | 'not-enough-gold' | 'unavailable';

function inside(rect: Rect, x: number, y: number): boolean { return x > rect[0] && x < rect[1] && y > rect[2] && y < rect[3]; }
function int(value: number): number { return Math.trunc(value); }
function twipCoordinate(value: number): number {
  const coordinate = Math.trunc(value * 20) / 20;
  // Flash хранит целое число твипов: отрицательный ноль не переживает запись координаты.
  return coordinate === 0 ? 0 : coordinate;
}
const WEAPON_SKILLS = [103, 106, 104, 105] as const;
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) < 1e12; }
function validItem(value: unknown): value is Item {
  if (!record(value) || !Number.isInteger(value.id) || !Object.hasOwn(BASE_ITEM_FIELDS, Number(value.id))) return false;
  const numbers = ['num', 'id', 'graphic', 'type', 'reloadTime', 'reloadTimeMax', 'ammo', 'ammoMax', 'value', 'mod', 'modMax', 'shell', 'lv', 'typeMinor', 'special', 'leech', 'impact', 'shootRate', 'rare', 'autoReload', 'livingWeapon'];
  const optional = ['baseAccuracy', 'accuracyDec', 'attack', 'dmgAir', 'dmgArmor', 'reqTrait', 'reqLv', 'range'];
  const spentArtifact = value.num === 0 && (value.id === 37 || value.id === 38) && value.ammo === -1 && value.ammoMax === 0;
  if (numbers.some(key => !finite(value[key]) || (Number(value[key]) < 0 && !(key === 'ammo' && spentArtifact))) || optional.some(key => value[key] !== undefined && (!finite(value[key]) || Number(value[key]) < 0))) return false;
  if (numbers.filter(key => key !== 'value').some(key => !Number.isInteger(value[key]))) return false;
  const id = Number(value.id);
  const expectedType = [8, 9, 10, 121].includes(id) ? ITEM_TYPE.mod : BASE_ITEM_FIELDS[id].type ?? ITEM_TYPE.gun;
  if ((value.num !== 0 && value.num !== 1) || value.graphic !== id + 10 || value.type !== expectedType || Number(value.lv) < 1 || Number(value.modMax) < 1 || typeof value.manualReload !== 'boolean' || typeof value.automatic !== 'boolean') return false;
  if (typeof value.name !== 'string' || value.name.length === 0 || value.name.length > 256 || typeof value.modText !== 'string' || value.modText.length > 4096) return false;
  if (expectedType === ITEM_TYPE.gun && (optional.some(key => !finite(value[key])) || Number(value.ammoMax) < 1 || Number(value.ammo) > Number(value.ammoMax) || Number(value.mod) > Number(value.modMax))) return false;
  if (expectedType === ITEM_TYPE.mod && (Number(value.mod) > 13 || Number(value.modMax) > 3)) return false;
  if (expectedType === ITEM_TYPE.token && !finite(value.attack)) return false;
  if (value.type !== ITEM_TYPE.gun && Number(value.reloadTime) > Number(value.reloadTimeMax) + 1) return false;
  return true;
}

export class Simulation {
  state: SimulationState;
  events: SimulationEvent[] = [];
  private options: SimulationOptions;
  private pendingOpeningMission?: LowLevelMission;

  constructor(seed = Date.now(), options: SimulationOptions = {}) {
    this.options = options;
    let initialRng = seed >>> 0 || 1;
    const random = () => {
      initialRng ^= initialRng << 13; initialRng ^= initialRng >>> 17; initialRng ^= initialRng << 5;
      initialRng >>>= 0;
      return initialRng / 4294967296;
    };
    // New Game готовит миссию до первого updateGene; волны появляются после Proceed.
    this.pendingOpeningMission = generateLowLevelMission(0, 1, random);
    const classId = options.heroClass ?? 'sheriff';
    const generated = generateHero(random, classId);
    this.state = {
      version: SAVE_VERSION, economy: createTownEconomy(), phase: 'battle', day: 1, tick: 0, timerRemainder: 0, rng: initialRng, nextUid: 1, hero: generated.hero, title: 0,
      activeMission: this.missionParameters(this.pendingOpeningMission), resultBefore: STARTING_CLASS.money, earnedMedals: [40], perfectDays: 0, bossesSpawned: 0,
      castleHp: FIRST_DAY.castleHp, castleMaxHp: FIRST_DAY.castleHp, wallLevel: 1, wallFixCount: 0, repairmanLevel: 0, sandbagLevel: 0, looterLevel: 0, trainerLevel: 0, gold: STARTING_CLASS.money, totalMoney: 0, kills: 0, criticalKills: 0,
      aimX: 300, aimY: 240, fireHeld: false, pendingShot: false,
      player: { classId, grenadeCount: 325 - (generated.traits[4] ?? 0) * 4, level: 1, exp: 0, skillPoints: 0, traits: generated.traits, weaponExp: [0, 0, 0, 0, 0], selectedSlot: 0, shootTimer: 0, accuracyFix: 0, rampageTicks: 0, bowDrawing: false },
      waveIndex: FIRST_DAY.waves, waves: [], bossWave: 2, newWave: true, spawnTimer: 30, noDamage: true,
      enemies: [], projectiles: [], enemyArrows: [], loot: [], result: { reward: 0, perfectBonus: 0, upkeep: 0, tax: 0, salary: 0, wages: 0, netReward: 0 },
      itemCooldowns: Array(5).fill(0), protection: { counter: 0, blueMultiplierAdd: 0 }, inventory: generated.inventory, lootOffers: Array(8).fill(null), postbattle: 'none', inventoryProvenance: 'original-generation',
      bossKilled: 0, skillChoices: [], traitsProvenance: 'known-starting-traits', bossKilledProvenance: 'observed',
      town: null, previousTown: null, upgradeReference: null, pendingTownAction: null, pendingLootAction: null,
      party: createPartyState(), partySkills: partySkills([{ traits: generated.traits }]), partyAI: createPartyAIShared(), retainedAITargets: [], pendingPartyAction: null,
    };
    if (!options.deferOpeningWaves) this.startOpeningBattle();
  }

  get selectedItem(): Item | null {
    const item = this.state.inventory[this.state.player.selectedSlot];
    return isOccupiedItem(item) ? item : null;
  }

  get weapon(): Item | null {
    const item = this.selectedItem;
    return item?.type === ITEM_TYPE.gun ? item : null;
  }

  actorWeapon(slot: number): Item | null {
    const item = slot === 0 ? this.weapon : partySlot(this.state.party, slot)?.weapon;
    return isOccupiedItem(item) && item.type === ITEM_TYPE.gun ? item : null;
  }

  private actor(slot: number): CombatActorState | undefined {
    if (slot === 0) return this.state.player;
    const entry = partySlot(this.state.party, slot);
    return entry?.exists ? entry.member ?? undefined : undefined;
  }

  private refreshPartySkills(): void {
    this.state.partySkills = partySkills([this.state.player, ...this.state.party.slots.slice(0, 4).map(slot => slot.member ? { exist: slot.exists, traits: slot.member.traits } : null)]);
  }

  private partyAIContext(): PartyAIContext {
    return { shared: this.state.partyAI, random: () => this.random(), heroSlot: 0, fireAtWill: false,
      getTarget: uid => this.state.enemies.find(enemy => enemy.uid === uid) as PartyAITarget | undefined
        ?? this.state.retainedAITargets.find(enemy => enemy.uid === uid) };
  }

  private partyAICallbacks(): PartyAICallbacks {
    return {
      shoot: actor => {
        const uid = actor.member?.aiState?.targetUid;
        const target = uid ? this.partyAIContext().getTarget(uid) : undefined;
        if (target && target.hp > 0 && target.x >= -10) this.fireActorAt(actor.slot, int(target.x), int(target.y));
        else clearPartyAITarget(actor);
      },
      reload: actor => { this.requestActorReload(actor.slot); },
      reloading: actor => { this.advanceActorReload(actor.slot); },
      throwMilitiaGrenade: (actor, launch) => {
        const position = partyActorPosition(actor.slot);
        const uid = actor.member?.aiState?.targetUid;
        const targetSpeed = uid ? this.partyAIContext().getTarget(uid)?.speed : undefined;
        this.state.projectiles.push(createProjectile({ uid: this.state.nextUid++, kind: 'hand-grenade', weaponSlot: null, actorSlot: actor.slot,
          startX: position.x, startY: position.y, targetX: launch.x, targetY: launch.y, speedBase: launch.speedBase, damage: launch.damage, targetSpeed }));
        this.events.push({ type: 'grenade', actorSlot: actor.slot, x: position.x, y: position.y });
      },
    };
  }

  private initializePartyBattle(): void {
    const e = this.state.economy;
    e.sisterWaves = e.sisters ? Array(this.state.waves.length + 1).fill(0) : [];
    for (let i = 0; i < e.sisters; i++) e.sisterWaves[1 + int(this.random() * this.state.waves.length)]++;
    this.state.player.grenadeCount = Math.max(100, 325 - (this.state.player.traits[4] ?? 0) * 4);
    this.refreshPartySkills(); this.state.partyAI = createPartyAIShared(); this.state.retainedAITargets = [];
    for (const slot of this.state.party.slots.slice(0, 4)) if (slot.member) {
      slot.member.aiState = createPartyAIState(slot.slot);
      slot.member.rampageTicks = 0;
      refreshPartyAI(slot, this.state.partySkills.effects[116]);
      if (slot.exists) {
        Object.assign(slot.member, { shootTimer: 0, accuracyFix: 0, bowDrawing: false });
        if (slot.weapon) { slot.weapon.ammo = slot.weapon.ammoMax; slot.weapon.reloadTime = 0; }
      }
    }
  }

  private retainAITargets(): void {
    const references = new Set<number>();
    for (const slot of this.state.party.slots.slice(0, 4)) if (slot.exists && slot.member?.aiState?.targetUid) references.add(slot.member.aiState.targetUid);
    for (const row of this.state.partyAI.targets) for (const cell of row) if (cell.uid !== null) references.add(cell.uid);
    if (this.state.partyAI.targetBossUid !== null) references.add(this.state.partyAI.targetBossUid);
    if (this.state.partyAI.nextAlertUid !== null) references.add(this.state.partyAI.nextAlertUid);
    for (const enemy of this.state.enemies) if (enemy.removed && references.has(enemy.uid)) {
      this.state.retainedAITargets.push({ uid: enemy.uid, x: enemy.x, y: enemy.y, speed: enemy.speed, hp: -1,
        removed: true, type: enemy.type ?? 0, tag: enemy.tag ?? 0, onMark: enemy.onMark ?? false });
    }
    this.state.retainedAITargets = this.state.retainedAITargets.filter(target => references.has(target.uid));
  }

  private partyMutationAvailable(): boolean {
    return this.state.phase === 'town' && this.state.town?.preparation === 'ready' && !this.state.pendingTownAction && !this.state.pendingPartyAction;
  }

  requestRecruit(): string {
    if (!this.partyMutationAvailable()) return 'unavailable';
    const failure = hireFailure(this.state.party, this.state.gold);
    if (failure) return failure;
    this.state.pendingPartyAction = { kind: 'hire' };
    return 'previewed';
  }

  requestDismiss(slot: number): boolean {
    if (!this.partyMutationAvailable() || slot < 1 || slot > 3 || !partySlot(this.state.party, slot)?.exists) return false;
    this.state.pendingPartyAction = { kind: 'dismiss', slot }; return true;
  }

  resolvePartyAction(confirm: boolean): string {
    const pending = this.state.pendingPartyAction;
    if (this.state.phase !== 'town' || !pending) return 'unavailable';
    this.state.pendingPartyAction = null;
    if (!confirm) return 'cancelled';
    let outcome: string = 'unavailable';
    if (pending.kind === 'hire') {
      const result = hireCandidate(this.state.party, this.state.gold);
      this.state.gold = result.gold; outcome = result.outcome;
    } else if (pending.kind === 'dismiss') outcome = dismissCompanion(this.state.party, pending.slot) ? 'dismissed' : 'unavailable';
    else outcome = resolvePartyMod(this.state.party, this.state.inventory, pending.inventorySlot, pending.partySlot, true, this.equipmentFactory());
    this.refreshPartySkills();
    return outcome;
  }

  movePartyEquipment(from: PartyEquipmentAddress, to: PartyEquipmentAddress): 'moved' | 'previewed' | 'unavailable' {
    if (!this.partyMutationAvailable()) return 'unavailable';
    const outcome = movePartyEquipment(this.state.party, this.state.inventory, from, to);
    if (outcome === 'mod-confirmation') {
      const owned = from.area === 'inventory' ? from : to, companion = from.area === 'party' ? from : to;
      this.state.pendingPartyAction = { kind: 'party-mod', inventorySlot: owned.slot, partySlot: companion.slot };
      return 'previewed';
    }
    return outcome;
  }

  setCompanionOrder(slot: number, order: number): boolean {
    const member = partySlot(this.state.party, slot)?.member;
    if (!this.partyMutationAvailable() || slot > 3 || !partySlot(this.state.party, slot)?.exists || !member || !Number.isInteger(order) || order < 0 || order > 6) return false;
    member.ai = order; return true;
  }

  setCompanionPriorities(slot: number, value: { boss?: boolean; wall?: boolean }): boolean {
    const member = partySlot(this.state.party, slot)?.member;
    if (!this.partyMutationAvailable() || slot > 3 || !partySlot(this.state.party, slot)?.exists || !member) return false;
    if (typeof value.boss === 'boolean') member.optBoss = value.boss;
    if (typeof value.wall === 'boolean') member.optWall = value.wall;
    return true;
  }

  setCompanionFocus(slot: number, id: number): boolean {
    const member = partySlot(this.state.party, slot)?.member;
    if (!this.partyMutationAvailable() || slot > 3 || !partySlot(this.state.party, slot)?.exists || !member || (id !== -1 && (!(member.traits[id] > 0) || id < 100 || id >= 900))) return false;
    member.focus = id; return true;
  }

  useSlot(slot: number): boolean {
    if (this.state.phase !== 'battle' || this.pendingOpeningMission || !Number.isInteger(slot) || slot < 0 || slot >= 5) return false;
    const item = this.state.inventory[slot];
    if (!isOccupiedItem(item)) { this.events.push({ type: 'beep' }); return false; }
    if (item.type === ITEM_TYPE.use) {
      if (item.id === 11) return this.throwGrenade(this.state.aimX, this.state.aimY, slot);
      const plan = planConsumableUse(item, { castleHp: this.state.castleHp, castleMaxHp: this.state.castleMaxHp, slotCooling: this.state.itemCooldowns[slot] > 0, supplierEffect: this.state.partySkills.effects[139] });
      if (plan.status !== 'ready') { this.events.push({ type: 'beep' }); return false; }
      if (plan.effect.kind === 'repair') {
        this.state.castleHp = plan.effect.castleHp;
        this.events.push({ type: 'repair', amount: plan.effect.restoredHp });
      } else if (plan.effect.kind === 'protection') {
        this.state.protection.counter = plan.effect.frames;
        this.events.push({ type: 'protection', x: plan.effect.effectX, y: plan.effect.effectY });
      } else {
        this.events.push({ type: 'beep', message: 'Ragnarok is still being ported.' });
        return false;
      }
      Object.assign(item, plan.itemAfter);
      this.state.itemCooldowns[slot] = plan.blocksForUpdates;
      return true;
    }
    const previous = this.state.inventory[this.state.player.selectedSlot];
    if (previous) previous.reloadTime = 0;
    this.state.player.bowDrawing = false;
    this.state.player.selectedSlot = slot;
    this.events.push({ type: 'select', weaponId: item.id });
    return true;
  }

  rerollOpeningHero(classId: HeroClass = this.state.player.classId): boolean {
    if (!this.pendingOpeningMission) return false;
    const generated = generateHero(() => this.random(), classId, this.state.inventory);
    this.state.hero = generated.hero;
    Object.assign(this.state.player, { classId, grenadeCount: 325 - (generated.traits[4] ?? 0) * 4, level: generated.level, exp: generated.exp, skillPoints: generated.skillPoints, traits: generated.traits });
    this.state.inventory = generated.inventory;
    return true;
  }

  startOpeningBattle(): boolean {
    if (!this.pendingOpeningMission) return false;
    if (this.state.player.classId === 'hunter' || this.state.player.classId === 'rogue') addStartingLittleGirl(this.state.party, () => this.random());
    this.applyOpeningMission(this.pendingOpeningMission);
    this.initializePartyBattle();
    this.pendingOpeningMission = undefined;
    return true;
  }

  private generateOpeningMission(): void {
    this.applyOpeningMission(generateLowLevelMission(0, 1, () => this.random()));
  }

  private applyOpeningMission(mission: LowLevelMission): void {
    this.state.activeMission = this.missionParameters(mission);
    this.state.loot = [...mission.loot];
    this.state.waveIndex = mission.wave;
    this.state.newWave = mission.newWave;
    this.state.spawnTimer = mission.time;
    this.state.bossWave = mission.bossWave;
    this.state.waves = generateLowLevelWaves(mission, 1, () => this.random()).waves;
  }

  private missionParameters(mission: Readonly<LowLevelMission>): ActiveMission {
    const { level, fixedLv, strength, powerOrg, reward, spawnRate, hpFix, dmgFix, expFix, absorbFix, bossDay } = mission;
    return { level, fixedLv, strength, powerOrg, reward, spawnRate, hpFix, dmgFix, expFix, absorbFix, bossDay };
  }

  private awardMedal(id: number): void {
    if (!this.state.earnedMedals.includes(id)) this.state.earnedMedals.push(id);
  }

  private medalAbsorption(): number { return [60, 61, 62, 63].filter(id => this.state.earnedMedals.includes(id)).length / 100; }

  startNextDay(): boolean {
    const town = this.state.town;
    if (this.state.phase !== 'town' || (this.state.pendingTownAction || this.state.pendingPartyAction) || this.state.day >= MAX_CAMPAIGN_DAY || town?.preparation !== 'ready' || town.mission.level !== this.state.day) return false;
    const state = this.state;
    state.day = state.day + 1;
    state.previousTown = town;
    state.town = null;
    state.activeMission = this.missionParameters(town.mission);
    const generated = generateLowLevelWaves(town.mission, state.day, () => this.random());
    state.waves = generated.waves;
    state.waveIndex = town.mission.wave; state.bossWave = town.mission.bossWave;
    state.newWave = true; state.spawnTimer = town.mission.time; state.loot = [...town.mission.loot];
    state.phase = 'battle'; state.postbattle = 'none'; state.skillChoices = []; state.lootOffers = Array(8).fill(null);
    state.noDamage = true; state.criticalKills = 0; state.kills = 0; state.bossKilled = 0;
    state.enemies = []; state.projectiles = []; state.enemyArrows = []; state.itemCooldowns.fill(0);
    state.protection = { counter: 0, blueMultiplierAdd: 0 };
    state.pendingShot = state.fireHeld = false;
    Object.assign(state.player, { selectedSlot: 0, shootTimer: 0, accuracyFix: 0, rampageTicks: 0, bowDrawing: false });
    for (const item of state.inventory) if (item) {
      item.reloadTime = 0;
      if (item.type !== ITEM_TYPE.use) item.ammo = item.ammoMax;
    }
    state.resultBefore = state.gold;
    this.initializePartyBattle();
    state.result = { reward: 0, perfectBonus: 0, upkeep: 0, tax: 0, salary: 0, wages: 0, netReward: 0 };
    this.events = [];
    return true;
  }

  private random(): number {
    let value = this.state.rng | 0;
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    this.state.rng = value >>> 0;
    return this.state.rng / 4294967296;
  }

  tick(input: Input = {}): void {
    this.events = [];
    if (this.state.phase !== 'battle' || this.pendingOpeningMission) return;
    if (finite(input.aimX)) this.state.aimX = input.aimX;
    if (finite(input.aimY)) this.state.aimY = input.aimY;
    const firePressed = input.firePressed || (input.fireHeld && !this.state.fireHeld);
    const fireReleased = input.fireReleased ?? (this.state.fireHeld && !input.fireHeld);
    this.state.fireHeld = Boolean(input.fireHeld);
    const player = this.state.player;
    this.state.tick++;
    // Новые MovieClip получают первый ENTER_FRAME только на следующем кадре.
    const projectileUidLimit = this.state.nextUid;
    if (input.slot !== undefined) this.useSlot(input.slot);
    if (input.reload) this.requestReload();
    const weapon = this.weapon;
    const bow = weapon?.id === 24 || weapon?.id === 25;
    if (fireReleased && bow) {
      if (player.bowDrawing) this.fireAt(this.state.aimX, this.state.aimY);
      this.state.pendingShot = false;
    } else if (firePressed && !(bow && player.bowDrawing)) {
      if (weapon?.reloadTime && weapon.manualReload && !weapon.autoReload) {
        weapon.reloadTime = 0; this.events.push({ type: 'reloaded', weaponId: weapon.id });
        this.state.pendingShot = false;
      } else this.state.pendingShot = true;
    } else if (!input.fireHeld) this.state.pendingShot = false;
    if (player.shootTimer > -10000) player.shootTimer -= this.state.inventory[player.selectedSlot]?.shootRate ?? 0;
    const protection = advanceProtection(this.state.protection.counter, this.state.protection.blueMultiplierAdd);
    this.state.protection = { counter: protection.counter, blueMultiplierAdd: protection.blueMultiplierAdd };
    if (player.rampageTicks > 0) player.rampageTicks--;
    this.state.itemCooldowns = this.state.itemCooldowns.map(time => Math.max(0, time - 1));
    if (this.state.pendingShot && !(weapon?.reloadTime && !weapon.autoReload) && this.fireAt(this.state.aimX, this.state.aimY) && !weapon?.automatic) this.state.pendingShot = false;
    this.state.partyAI.sharedWeaponRange = weapon?.range ?? null;
    const partyContext = this.partyAIContext(), partyCallbacks = this.partyAICallbacks();
    for (const slot of this.state.party.slots.slice(0, 4)) stepPartyAIFrame(slot, partyContext, partyCallbacks);
    for (const enemy of this.state.enemies) this.tickEnemy(enemy);
    this.tickProjectiles(projectileUidLimit);
    for (const arrow of this.state.enemyArrows) if (arrow.uid < projectileUidLimit) advanceEnemyArrow(arrow);
    this.state.enemyArrows = this.state.enemyArrows.filter(arrow => !arrow.removed);
    this.retainAITargets();
    this.state.enemies = this.state.enemies.filter(enemy => !enemy.removed);
    // Целочисленный аккумулятор сохраняет исходный Timer(50) рядом с 30-герцовыми кадрами.
    this.state.timerRemainder += TIMER_HZ;
    while (this.state.timerRemainder >= SIMULATION_HZ && this.state.phase === 'battle') {
      this.state.timerRemainder -= SIMULATION_HZ;
      this.timerTick();
    }
  }

  fireAt(x: number, y: number): boolean {
    if (!finite(x) || !finite(y) || this.state.phase !== 'battle' || this.pendingOpeningMission) return false;
    this.state.aimX = x; this.state.aimY = y;
    return this.fireActorAt(0, x, y);
  }

  private fireActorAt(actorSlot: number, x: number, y: number): boolean {
    const player = this.actor(actorSlot);
    if (!player) return false;
    const manual = actorSlot === 0;
    const member = actorSlot ? partySlot(this.state.party, actorSlot)!.member! : null;
    const ai = member?.aiState;
    const position = partyActorPosition(actorSlot);
    const weaponSlot = manual ? this.state.player.selectedSlot : 0;
    if (player.shootTimer > 0) return false;
    const item = this.actorWeapon(actorSlot);
    if (!item) {
      if (manual) this.state.pendingShot = false;
      if (manual) this.events.push({ ...(actorSlot ? { actorSlot } : {}), type: 'beep', message: 'You need a gun to shoot!' });
      return false;
    }
    const stats = weaponStats(item, player.traits, { manualControl: manual, partyLeadership: this.state.partySkills.effects[116] });
    if (!stats.canFire) {
      if (manual) this.state.pendingShot = false;
      if (manual) this.events.push({ ...(actorSlot ? { actorSlot } : {}), type: 'beep', message: "You don't have the required weapon skill!" });
      return false;
    }
    if (item.reloadTime > 0 && !item.autoReload) {
      if (manual && item.manualReload) { item.reloadTime = 0; this.events.push({ ...(actorSlot ? { actorSlot } : {}), type: 'reloaded', weaponId: item.id }); }
      return false;
    }
    if (item.ammo <= 0) {
      if (manual) this.state.pendingShot = false;
      else if (ai) { ai.shooting = false; ai.burst = 0; }
      this.requestActorReload(actorSlot); return false;
    }
    const spread = shotSpread(item, player.traits, player.accuracyFix, { manualControl: manual, fireAtWill: member?.ai === 6 });
    player.shootTimer = stats.shootTimer;
    if (!manual && !item.automatic) player.shootTimer += int(this.random() * (item.shootRate / 1.5 / ai!.workRate));
    const behavior = weaponBehavior(item);
    if (ai && item.id === 16) {
      if (ai.chainMode !== 3) {
        ai.chainMode = 2;
        if (ai.chainPos > 82) ai.chainMode = 3;
        ai.chainPos += 2; return true;
      }
      ai.chainPos = 82;
    }
    if (behavior.bowDraw) {
      if (manual) this.state.pendingShot = false;
      if (!player.bowDrawing) {
        if (manual) player.shootTimer = 0; player.bowDrawing = true; player.accuracyFix += stats.recoil;
        if (ai) ai.chainMode = 1;
        this.events.push({ ...(actorSlot ? { actorSlot } : {}), type: 'bow-draw', weaponId: item.id });
        return true;
      }
      player.bowDrawing = false;
      if (ai) ai.chainMode = 0;
    } else player.accuracyFix += stats.recoil;
    if (stats.consumesAmmo) item.ammo--;
    let damage = shotDamage(item, player.traits, { missionDamage: this.state.activeMission.dmgFix, rampage: player.rampageTicks > 0, frenzy: ai?.frenzy, idleCount: ai?.idleCount });
    if (behavior.projectile) {
      let hitX = int(x + this.random() * spread - this.random() * spread);
      const hitY = int(y + this.random() * spread - this.random() * spread);
      if (ai && [23, 24, 25, 26].includes(item.id)) ai.idleCount *= 0.5;
      if (!manual && item.id === 27) hitX -= 200;
      const target = ai?.targetUid ? this.partyAIContext().getTarget(ai.targetUid) : undefined;
      const launch = (startOffset = 0, targetOffset = 0) => this.state.projectiles.push(createProjectile({
        uid: this.state.nextUid++, kind: behavior.projectile!, weaponSlot, damage, actorSlot, targetSpeed: target?.speed,
        startX: position.x + startOffset, startY: position.y, targetX: hitX + targetOffset, targetY: hitY,
        speedBase: behavior.speedBase, penetrations: (player.traits[COMBAT_TRAIT.BOW_MASTER] ?? 0) + behavior.extraPenetrations,
        scale: ['gravity', 'flame'].includes(behavior.projectile!) ? (100 + combatTrait(COMBAT_TRAIT.DA_BOMB, player.traits)) / 100 : 1,
      }));
      if (item.id === 25) { launch(5, 20); launch(); launch(-5, -20); } else launch();
      this.events.push({ ...(actorSlot ? { actorSlot } : {}), type: 'shot', weaponId: item.id, x: position.x, y: position.y });
      if (behavior.immediateReload) {
        item.reloadTime = stats.reloadTime;
        this.events.push({ ...(actorSlot ? { actorSlot } : {}), type: 'reload', weaponId: item.id, automaticReload: item.autoReload > 0 });
      }
      return true;
    }
    if (ai) {
      const modified = hitscanShotModifiers(item, player.traits, damage, { burst: ai.burst, ammoAfterShot: item.ammo,
        accuracyFix: player.accuracyFix, powerShotRoll: !item.automatic && player.traits[COMBAT_TRAIT.POWER_SHOT] ? this.random() : undefined });
      damage = modified.damage; ai.burst = modified.burst; player.accuracyFix = modified.accuracyFix;
      if (modified.specialHitType === 2) { this.random(); this.random(); }
    }
    let hasHitAnything = false, hasHitAnyEnemy = false, hasKillAnyEnemy = false, hasCritHit = false;
    const pellets: { x: number; y: number }[] = [];
    for (let i = 0; i < stats.shells; i++) {
      let hitX = int(x + this.random() * spread - this.random() * spread);
      const hitY = int(y + this.random() * spread - this.random() * spread);
      pellets.push({ x: hitX, y: hitY });
      for (const enemy of this.state.enemies) {
        if (enemy.removed || !this.hitEnemy(enemy, hitX, hitY)) continue;
        // Обычный shoot и projectile procHit имеют разные правила RNG и отбрасывания.
        const hit = hitscanHit(item, player.traits, damage, {
          senseRoll: this.random(), oneHitRoll: this.random(), shells: stats.shells,
          weakPoint: inside(ENEMIES[enemy.kind].critical, hitX - enemy.x, hitY - enemy.y),
          alive: enemy.hp > 0, boss: enemy.kind === 'boss',
        });
        damage = hit.damage;
        if (enemy.hp > 0) hasHitAnyEnemy = true;
        if (hit.critical) hasCritHit = true;
        if (ai) ai.frenzy = duelistHitFrenzy(item, player.traits, ai.frenzy, 'hitscan');
        hasHitAnything = true;
        this.damageEnemy(enemy, damage, hit.critical, weaponSlot, hitX, hitY, actorSlot);
        if (hasHitAnyEnemy && enemy.hp <= 0) hasKillAnyEnemy = true;
      }
      if (ai && !hasHitAnything) ai.idleCount = 0;
    }
    if (ai) {
      if (!hasHitAnything) ai.idleCount = 0;
      if (hasCritHit && hasKillAnyEnemy) player.shootTimer = criticalKillCooldown(player.shootTimer, player.traits);
      ai.idleCount *= 0.8;
    }
    this.events.push({ ...(actorSlot ? { actorSlot } : {}), type: 'shot', weaponId: item.id, x: position.x, y: position.y, pellets });
    return true;
  }

  private processPellet(x: number, y: number, damage: number, weaponSlot = this.state.player.selectedSlot, actorSlot = 0): boolean {
    const actor = this.actor(actorSlot);
    if (!actor) return false;
    const member = actorSlot ? partySlot(this.state.party, actorSlot)!.member! : null;
    let hitLivingEnemy = false;
    for (const enemy of this.state.enemies) {
      if (enemy.removed) continue;
      const hit = this.hitEnemy(enemy, x, y);
      if (!hit) continue;
      // Исходный procHit проверяет SENSE даже у начального шерифа с нулевым навыком.
      const critical = criticalType(actor.traits, this.random(), inside(ENEMIES[enemy.kind].critical, x - enemy.x, y - enemy.y), enemy.hp > 0);
      if (enemy.hp > 0) hitLivingEnemy = true;
      enemy.knockBack = combatTrait(TRAIT.SHERIFF, actor.traits);
      const item = this.actorWeapon(actorSlot);
      if (member?.aiState && item) member.aiState.frenzy = duelistHitFrenzy(item, actor.traits, member.aiState.frenzy, 'projectile');
      this.damageEnemy(enemy, damage, critical, weaponSlot, int(x), int(y), actorSlot);
    }
    return hitLivingEnemy;
  }

  private hitEnemy(enemy: EnemyState, x: number, y: number): boolean {
    return this.options.hitTest?.(enemy, x, y) ?? inside(ENEMIES[enemy.kind].body, x - enemy.x, y - enemy.y);
  }

  requestReload(manual = true): boolean {
    const item = this.weapon;
    if (this.state.phase !== 'battle' || !item || this.state.player.shootTimer > 0 || item.reloadTime > 0 || item.ammo >= item.ammoMax || (manual && item.autoReload > 0)) return false;
    return this.requestActorReload(0);
  }

  private requestActorReload(actorSlot: number): boolean {
    const actor = this.actor(actorSlot), item = this.actorWeapon(actorSlot);
    if (this.state.phase !== 'battle' || !actor || !item || item.reloadTime > 0) return false;
    item.reloadTime = reloadTimer(item, actor.traits);
    this.events.push({ ...(actorSlot ? { actorSlot } : {}), type: 'reload', weaponId: item.id, automaticReload: item.autoReload > 0 });
    return true;
  }

  private advanceActorReload(actorSlot: number): void {
    const actor = this.actor(actorSlot), item = this.actorWeapon(actorSlot);
    if (!actor || !item || item.reloadTime <= 0) return;
    const loaded = advanceReload(item, actor.traits, actor.rampageTicks > 0);
    item.ammo = loaded.ammo; item.reloadTime = loaded.reloadTime;
    if (loaded.restarted || loaded.completion) this.events.push({ ...(actorSlot ? { actorSlot } : {}), type: loaded.restarted ? 'reload' : 'reloaded', weaponId: item.id, automaticReload: item.autoReload > 0 });
  }

  throwGrenade(x: number, y: number, slot = 1): boolean {
    const item = this.state.inventory[slot];
    if (!finite(x) || !finite(y) || this.state.phase !== 'battle' || !Number.isInteger(slot) || slot < 0 || slot >= 5 || !isOccupiedItem(item) || item.id !== 11) return false;
    const plan = planConsumableUse(item, { castleHp: this.state.castleHp, castleMaxHp: this.state.castleMaxHp, slotCooling: this.state.itemCooldowns[slot] > 0, supplierEffect: this.state.partySkills.effects[139] });
    if (plan.status !== 'ready' || plan.effect.kind !== 'grenade') { this.events.push({ type: 'beep' }); return false; }
    this.state.projectiles.push(createProjectile({ uid: this.state.nextUid++, kind: 'hand-grenade', weaponSlot: null, startX: WORLD.playerX, startY: WORLD.playerY, targetX: x, targetY: y, speedBase: GRENADE.speed, damage: plan.effect.damage }));
    Object.assign(item, plan.itemAfter);
    this.state.itemCooldowns[slot] = plan.blocksForUpdates;
    this.events.push({ type: 'grenade', x, y });
    return true;
  }

  private tickProjectiles(uidLimit = Infinity): void {
    for (const projectile of this.state.projectiles) if (projectile.uid < uidLimit) advanceProjectile(projectile, {
      hit: (x, y, damage, slot) => this.processPellet(x, y, damage, slot, projectile.actorSlot ?? 0),
      explode: (x, y, damage, slot, kind) => this.explodeProjectile(x, y, damage, slot, kind, projectile.actorSlot ?? 0),
    });
    this.state.projectiles = this.state.projectiles.filter(projectile => !projectile.removed);
  }

  private explodeProjectile(x: number, y: number, damage: number, slot: number | null, kind: ExplosionKind, actorSlot = 0): void {
    // У снаряда босса shooterIndex=-1: навык героя не увеличивает его визуальный взрыв.
    const explosion = explosionStats(damage, damage === -1 ? 0 : combatTrait(COMBAT_TRAIT.DA_BOMB, this.actor(actorSlot)?.traits ?? {}), kind === 'rocket');
    if (kind === 'flame') { explosion.radiusX *= 0.9; explosion.radiusY *= 0.9; }
    if (kind === 'grenade' || kind === 'rocket') {
      this.events.push({ type: 'explosion', x, y, explosionKind: kind, scale: explosion.visualScale });
      // shake() всегда расходует два броска до обхода целей, даже если взрыв никого не задел.
      this.random(); this.random();
    } else if (kind === 'gravity') this.events.push({ type: 'pulse', x, y });
    if (explosion.visualOnly) return;
    for (const enemy of this.state.enemies) {
      if (!enemy.removed && explosionContains(explosion, x, y, enemy.x, enemy.y, enemy.hp >= 1)) this.damageEnemy(enemy, explosion.damage, false, slot, enemy.x, enemy.y, actorSlot);
    }
  }

  private timerTick(): void {
    const state = this.state;
    const player = state.player;
    if (state.castleHp <= 0) { state.phase = 'defeat'; player.bowDrawing = false; this.events.push({ type: 'defeat' }); return; }
    const item = this.weapon;
    if (item && autoReloadReady(item, player.shootTimer)) this.requestReload(false);
    if (item?.reloadTime) this.advanceActorReload(0);
    this.state.partyAI.sharedWeaponRange = item?.range ?? null;
    const partyContext = this.partyAIContext(), partyCallbacks = this.partyAICallbacks();
    if (player.traits[4] && --player.grenadeCount < 0) {
      const actor = { slot: 0, exists: true, member: null, weapon: item };
      const target = selectPartyTarget(actor, 2, partyContext, 6);
      if (!target || target.x > WORLD.playerX) player.grenadeCount += 10;
      else {
        partyCallbacks.throwMilitiaGrenade(actor, { targetUid: target.uid,
          x: target.x + target.speed * (15 + this.random() * 20), y: target.y,
          damage: int(combatTrait(COMBAT_TRAIT.MILITIA, player.traits)), speedBase: 12 });
        player.grenadeCount = Math.max(100, 325 - player.traits[4] * 4);
      }
    }
    for (const slot of this.state.party.slots.slice(0, 4)) stepPartyAITimer(slot, partyContext, partyCallbacks);
    if (state.newWave) {
      const sisters = state.economy.sisterWaves[state.waveIndex] ?? 0;
      for (let i = 0; i < Math.min(sisters, 200); i++) this.spawnEnemy('sister-bomb');
      if (state.economy.sisterWaves.length) state.economy.sisterWaves[state.waveIndex] = 0;
      state.newWave = false;
      // Последняя граница завершает бой до Repairman, поэтому остаточный урон уже не исправить.
      if (state.waveIndex <= 0) {
        if (state.castleHp < state.castleMaxHp) state.noDamage = false;
        this.finishDay(); return;
      }
      state.waveIndex--;
      this.events.push({ type: 'wave', amount: state.waves.length - state.waveIndex });
      if (state.repairmanLevel) state.castleHp = Math.min(state.castleMaxHp, state.castleHp + castleRepairAmount(state));
      // Исходный onTick оценивает остаток урона после ремонта, включая первую волну.
      if (state.castleHp < state.castleMaxHp) state.noDamage = false;
    } else {
      state.spawnTimer--;
      if (state.spawnTimer < 0) {
        const wave = state.waves[state.waveIndex];
        if (!wave.enemies.length) state.newWave = true;
        else {
          // Исходник сравнивает индекс с уже убывающей длиной pop, а не исходным размером.
          for (let index = 0; index < wave.enemies.length; index++) {
            const kind = wave.enemies.pop()!;
            this.spawnEnemy(kind);
            state.spawnTimer = wave.delays.pop()! + index * 4;
            if (ENEMIES[kind].level > this.random() * state.activeMission.level - 6 || this.random() > 0.8) break;
          }
        }
      }
    }
    const selected = state.inventory[player.selectedSlot];
    if (selected?.baseAccuracy !== undefined && selected.range !== undefined) player.accuracyFix = recoverAccuracy(selected, player.traits, player.accuracyFix, state.aimX);
  }

  private spawnEnemy(kind: EnemyKind): void {
    if (this.state.enemies.length >= 200) return;
    const definition = ENEMIES[kind];
    if (kind === 'sister-bomb') {
      const targetX = 190 + this.random() * 325, targetY = 200 + this.random() * 100;
      const speed = 12 * Math.atan2(Math.abs(targetX - 650) * 2, Math.abs(targetY - 240)) * 2 / Math.PI + 0.1;
      const bonus = 1 + Number(this.state.earnedMedals.includes(53)) * 0.1 + Number(this.state.earnedMedals.includes(54)) * 0.2 + Number(this.state.earnedMedals.includes(55)) * 0.3;
      this.state.enemies.push({ uid: this.state.nextUid++, kind, x: 650, y: 240, hp: 1, maxHp: 1, speed, speedOrg: speed,
        attack: int((100 + this.state.day * 5) * bonus), gold: 0, exp: 0, knockBack: 0, disarmed: 0,
        attacking: false, attacked: false, frame: 1, shadowHit: false, deathTicks: 0, drop: 0, removed: false,
        bossAction: 0, bossCount: 0, bossIdle: 0, bossFireNum: 0, bossWeapon: 0, bossDamage: 0, appearance: 0, type: 0, tag: 0, onMark: false,
        bomb: { startX: 650, startY: 240, targetX, targetY, curve: 0.003, counter: int(Math.abs(targetX - 650) / speed) + 1, rotation: 0 } });
      return;
    }
    const gold = 1 + int(this.random() * definition.power / 10 + 5);
    const bossWeapon = kind === 'boss' ? 1 + int(this.random() * 2) : 0;
    const bossCount = kind === 'boss' ? 100 + int(this.random() * 60) : 0;
    // Даже при нулевых strength/THREAT исходное умножение и деление влияют на последний бит Number.
    const speed = (definition.speedBase + this.random() * definition.speedRandom) * 100 / (100 + this.state.partySkills.effects[112]);
    const yRoll = this.random();
    const y = int(kind === 'fly' ? yRoll * 70 / 1.5 + 80 : yRoll * (kind === 'boss' ? 105 : definition.airborne ? 70 : WORLD.groundWidth) + (kind === 'boss' ? 195 : definition.airborne ? 40 : WORLD.groundLine));
    const hp = kind === 'boss' ? 150 + this.state.activeMission.level * 25 : int(definition.hp * this.state.activeMission.hpFix);
    const ranged = kind === 'archer' ? { rangedCounter: 120 } : kind === 'fly' ? { flyCounter: 0 } : kind === 'barbarian' ? { rampage: 0 as const, rageEffectFrame: 0, hitEffects: [] } : kind === 'lava' ? { alerted: false, hitEffects: [] } : {};
    const later = ENEMY_TIMELINES[kind];
    const behaviorCounter = kind === 'dino' ? 50 + int(this.random() * 70) : kind === 'dragon' ? 80 + int(this.random() * 50) : 0;
    const direction = kind === 'spider' && this.random() > 0.5 ? -1 : 1;
    const appearance = kind === 'boss' ? 51 + this.state.bossesSpawned++ % 15 : 0;
    const uid = this.state.nextUid++;
    this.state.enemies.push({ uid, kind, type: definition.airborne ? 1 : definition.armor ? 2 : 0, tag: 0, onMark: false, x: -20, y, hp, maxHp: hp, speed, speedOrg: speed, attack: kind === 'boss' ? (this.state.activeMission.bossDay ? int((1 + int(this.state.activeMission.level / 15)) / 2) + 1 : 1 + int(this.state.activeMission.level / 15)) : definition.attack, gold, exp: 1 + int(definition.power * 0.4), knockBack: 0, disarmed: 0, attacking: false, attacked: false, frame: kind === 'rat' ? 14 : 1, shadowHit: shadowHitAtFrame(kind, kind === 'rat' ? 14 : 1), deathTicks: 0, drop: 0, removed: false, bossAction: kind === 'boss' ? 3 : 0, bossCount, bossIdle: 0, bossFireNum: 0, bossWeapon, bossDamage: 0, appearance, ...(kind === 'boss' ? { bossFacing: -1 as const } : {}), ...(later ? { frame: later.labels.init ?? 1, behaviorCounter, direction } : {}), ...ranged });
    if (kind === 'boss') this.state.partyAI.targetBossUid = uid;
  }

  private damageEnemy(enemy: EnemyState, raw: number, criticalValue: number | boolean, weaponSlot: number | null, x: number, y: number, actorSlot = 0): void {
    const player = this.actor(actorSlot);
    if (enemy.hp <= 0 || !player) return;
    if (enemy.kind === 'sister-bomb') {
      enemy.hp = -1; enemy.removed = true;
      const gold = this.state.partySkills.effects[138];
      this.state.gold += gold; this.state.totalMoney += gold; this.state.economy.sistersExploded++;
      this.explodeProjectile(x, y, enemy.attack, null, 'grenade', actorSlot);
      return;
    }
    const member = actorSlot ? partySlot(this.state.party, actorSlot)!.member! : null;
    const critical = Boolean(criticalValue);
    const definition = ENEMIES[enemy.kind];
    const item = weaponSlot === null ? null : actorSlot ? partySlot(this.state.party, actorSlot)!.weapon : this.state.inventory[weaponSlot];
    const hit = weaponHitDamage(item, player.traits, raw, { critical, target: definition.airborne ? 'air' : definition.armor ? 'armor' : 'normal', bossGuard: enemy.kind === 'boss' && enemy.bossAction === 6 });
    const damage = hit.damage;
    if (item) {
      const effects = weaponHitEffects(item, player.traits, { ...enemy, resKnock: definition.knockResistance, dinosaur: enemy.kind === 'dino' }, {
        damageBeforeGuard: hit.beforeGuard, castleHp: this.state.castleHp, castleMaxHp: this.state.castleMaxHp,
        dinosaurRoll: enemy.kind === 'dino' && enemy.attacking ? this.random() : undefined,
        leechRoll: item.leech && this.state.castleHp > 0 ? this.random() : undefined,
      });
      Object.assign(enemy, { speed: effects.speed, speedOrg: effects.speedOrg, attack: effects.attack, disarmed: effects.disarmed, knockBack: effects.knockBack });
      this.state.castleHp = effects.castleHp;
    }
    if (enemy.kind === 'barbarian' || enemy.kind === 'lava') {
      // Кровь и критический эффект — дети enemy, поэтому меняют левый предел отбрасывания.
      const local = { x: twipCoordinate(x - enemy.x), y: twipCoordinate(y - enemy.y) };
      enemy.hitEffects!.push({ frame: 50, ...local });
      if (critical) enemy.hitEffects!.push({ frame: 70, ...local });
    }
    enemy.hp -= damage;
    this.events.push({ ...(actorSlot ? { actorSlot } : {}), type: 'hit', x, y, amount: damage, critical, criticalType: Number(criticalValue), enemyUid: enemy.uid, ...(enemy.kind === 'boss' && enemy.bossAction === 6 ? { bossGuard: true } : {}) });
    if (enemy.hp > 0) {
      if (enemy.kind === 'barbarian' && enemy.rampage === 0 && this.random() > 0.75) {
        enemy.rampage = 100;
        if (enemy.speed !== 0) enemy.speed = enemy.speed * 1.5 + 1.7;
        // Сохраняем наблюдаемое умножение исходника; оно отличается от изменения текущей скорости.
        enemy.speedOrg *= enemy.speedOrg * 1.5 + 1.7;
        enemy.attack = int(enemy.attack * 0.5) + 1;
        enemy.rageEffectFrame = 1;
        this.events.push({ ...(actorSlot ? { actorSlot } : {}), type: 'enemy-rage', x: enemy.x, y: enemy.y, enemyUid: enemy.uid });
      }
      if (enemy.kind === 'boss') {
        if (!enemy.rampage && this.state.activeMission.level >= 15 && enemy.hp < enemy.maxHp / 2) { enemy.rampage = 100; enemy.speed *= 1.5; enemy.speedOrg *= 1.5; }
        enemy.bossDamage += damage * (enemy.bossAction === 5 ? 2 : 1);
        // Проверка уровня стоит после случайных условий даже у босса миссии 0.
        if (enemy.bossAction !== 6) {
          const accumulated = enemy.bossDamage >= this.random() * enemy.maxHp * 2;
          const single = !accumulated && damage * (enemy.bossAction === 5 ? 2 : 1) >= this.random() * enemy.maxHp;
          if ((accumulated || single) && this.state.activeMission.level >= 10) {
            enemy.bossCount = 20 + int(this.random() * 30); enemy.bossAction = 6; enemy.frame = 221; enemy.bossDamage = 0;
          }
        }
      }
      return;
    }
    this.state.kills++;
    if (member) member.kills++;
    clearPartyTargetCache(this.state.partyAI);
    if (enemy.kind === 'boss') this.state.partyAI.targetBossUid = null;
    const skillIndex = WEAPON_SKILLS.indexOf((actorSlot ? this.actorWeapon(actorSlot) : this.state.inventory[this.state.player.selectedSlot])?.reqTrait as typeof WEAPON_SKILLS[number]);
    player.weaponExp[skillIndex < 0 ? 4 : skillIndex]++;
    let dropThreshold = 150 * 100 / (100 + combatTrait(COMBAT_TRAIT.LUCK, player.traits));
    if (player.rampageTicks > 0) dropThreshold /= 1.5;
    if (member?.aiState && member.traits[COMBAT_TRAIT.RANGER]) {
      member.aiState.frenzy += int(enemy.exp * 125 / (100 + member.level * 5));
      if (member.aiState.frenzy >= 1000) {
        member.aiState.frenzy = 0;
        const duration = int(360 * (100 + combatTrait(COMBAT_TRAIT.RANGER, member.traits)) / 100);
        this.startRampage(0, duration);
        for (const slot of this.state.party.slots.slice(0, 4)) if (slot.exists) this.startRampage(slot.slot, duration);
      }
    }
    if (item && item.livingWeapon > 0) {
      Object.assign(item, livingWeaponKill(item, () => this.random(), { day: this.state.day, engineer: this.state.partySkills.effects[120] }));
    }
    let experience = int(enemy.exp * this.state.activeMission.expFix);
    if (actorSlot) {
      if (this.state.day / 1.5 > player.level) { player.weaponExp[skillIndex < 0 ? 4 : skillIndex]++; experience = int(experience * 2); }
      experience = int(experience * 1.5);
    }
    const enemyLevel = enemy.kind === 'boss' ? this.state.activeMission.level : definition.level;
    if (enemyLevel + 3 < player.level) experience = int(experience * 100 / (100 + (player.level - enemyLevel) * 75));
    if (player.traits[COMBAT_TRAIT.NOBLE]) experience = int(experience * 1.4);
    enemy.exp = int(experience);
    if (critical) {
      if (player.traits[COMBAT_TRAIT.ROGUE]) dropThreshold = 1;
      if (player.rampageTicks <= 0 && --player.rampageTicks === -7) this.startRampage(actorSlot);
    }
    // enemy проверяет несуществующее root.pc: наблюдаемый trainerFix действует и на героя.
    // Умножаем после всех int-преобразований EXP; опыт оружия и фиксированные +250 не меняются.
    player.exp += int(experience * castleTrainerMultiplier(this.state));
    if (player.exp >= 1000) this.levelUpActor(actorSlot);
    let goodShotIndex: number | undefined;
    if (critical && actorSlot === 0) {
      this.state.criticalKills++;
      [10, 30, 50].forEach((count, index) => { if (this.state.criticalKills >= count) this.awardMedal(70 + index); });
      // Здесь пока действует начальное условие sister.dead == false; повреждение сестры не реализовано.
      goodShotIndex = int(this.random() * 5);
    }
    if (int(this.random() * dropThreshold) <= 10) {
      enemy.drop = 1;
      if (player.traits[COMBAT_TRAIT.ROGUE]) {
        enemy.gold = int(enemy.gold * (100 + combatTrait(COMBAT_TRAIT.ROGUE, player.traits)) / 100);
        if (int(this.random() * 100) < combatTrait(COMBAT_TRAIT.LUCK, player.traits)) enemy.gold *= 2;
      }
      if (member) member.earnedGold += enemy.gold;
    }
    const groupSize = this.state.waves[Math.max(0, this.state.waveIndex)].initialCount;
    if (int(this.random() * groupSize * 5) === 0 || int(this.random() * 400 * groupSize) < this.state.partySkills.effects[109]) { enemy.drop = 2; this.state.loot.push(definition.loot); }
    if (enemy.kind === 'boss') { enemy.drop = 1; this.state.bossKilled++; }
    enemy.frame = ENEMY_TIMELINES[enemy.kind]?.labels.dead ?? (enemy.kind === 'dropped-rat' ? 93 : enemy.kind === 'sheep' ? 107 : enemy.kind === 'rat' ? 93 : enemy.kind === 'chicken' ? 208 : enemy.kind === 'crow' ? 58 : enemy.kind === 'archer' ? 94 : enemy.kind === 'fly' ? 12 : enemy.kind === 'barbarian' ? 84 : enemy.kind === 'lava' ? 98 : enemy.kind === 'boss' ? 281 : 1);
    enemy.shadowHit = shadowHitAtFrame(enemy.kind, enemy.frame, enemy.shadowHit);
    this.events.push({ ...(actorSlot ? { actorSlot } : {}), type: 'kill', x: enemy.x, y: enemy.y, critical, enemyUid: enemy.uid, goodShotIndex });
  }

  private levelUp(): void {
    const growth = levelUpHero(this.state.player, this.state.hero, () => this.random(), this.state.player.classId);
    Object.assign(this.state.player, { level: growth.level, exp: growth.exp, skillPoints: growth.skillPoints, traits: growth.traits });
    this.events.push({ type: 'level-up', amount: growth.level });
  }

  private levelUpActor(actorSlot: number): void {
    if (actorSlot === 0) { this.levelUp(); return; }
    const member = partySlot(this.state.party, actorSlot)?.member;
    if (!member) return;
    levelUpCompanion(member, () => this.random());
    this.events.push({ type: 'level-up', actorSlot, amount: member.level });
  }

  private damageCastle(amount: number, attacker?: EnemyState): void {
    if (this.state.protection.counter > 0) { this.events.push({ type: 'defend' }); return; }
    const party = this.state.partySkills;
    if (attacker && party.guardian) {
      const slot = party.guardianSlots[int(this.random() * party.guardianSlots.length)];
      this.damageEnemy(attacker, party.guardian, false, null, attacker.x, attacker.y, slot);
    }
    const insurance = party.effects[TRAIT.INSURANCE];
    this.state.gold += insurance; this.state.totalMoney += insurance;
    if (this.random() * 100 < party.effects[TRAIT.DEFENDER]) { this.events.push({ type: 'defend' }); return; }
    // AS3 сначала приводит аргумент к int, затем ещё раз усекает результат после умножения.
    const damage = Math.max(1, int(int(amount) * (castleDamageMultiplier(this.state) - this.state.activeMission.absorbFix)));
    this.state.castleHp -= damage;
    this.events.push({ type: 'castle-hit', amount: damage, x: 575, y: 220 });
    // Исходник выбирает союзника даже без Last Hope и проверяет порог в этом направлении.
    if (this.random() > 0.6) {
      const ally = int(this.random() * 5), actor = this.actor(ally);
      const threshold = actor ? combatTrait(TRAIT.LAST_HOPE, actor.traits) : 0;
      if (actor && actor.rampageTicks <= 0 && threshold !== 0 && threshold < this.state.castleHp / this.state.castleMaxHp * 100) {
        this.startRampage(ally);
      }
    }
  }

  private startRampage(actorSlot = 0, baseFrames = 300): void {
    // shake() исходного героя потребляет два броска до включения ярости.
    if (actorSlot === 0) { this.random(); this.random(); }
    const actor = this.actor(actorSlot);
    if (!actor) return;
    actor.rampageTicks = rampageDuration(actor.traits, baseFrames);
    this.events.push({ ...(actorSlot ? { actorSlot } : {}), type: 'rampage' });
  }

  private tickEnemy(enemy: EnemyState): void {
    this.tickEnemyBehavior(enemy);
    // Эффект — дочерний клип mc; AI проверяет его текущую ширину до продвижения кадра.
    if (enemy.kind === 'barbarian' && enemy.rageEffectFrame) {
      enemy.rageEffectFrame = enemy.rageEffectFrame === 12 ? 0 : enemy.rageEffectFrame + 1;
    }
    if (enemy.kind === 'barbarian' || enemy.kind === 'lava') {
      enemy.hitEffects = enemy.hitEffects!.filter(effect => effect.frame !== 62 && effect.frame !== 75);
      for (const effect of enemy.hitEffects) effect.frame++;
    }
  }

  private tickEnemyBehavior(enemy: EnemyState): void {
    if (enemy.removed) return;
    if (enemy.kind === 'sister-bomb') {
      const b = enemy.bomb!;
      b.counter--; enemy.x -= enemy.speed;
      const slope = (b.targetY - b.startY - b.curve * b.targetX ** 2 + b.curve * b.startX ** 2) / (b.targetX - b.startX);
      enemy.y = b.curve * enemy.x ** 2 + slope * enemy.x + b.targetY - b.curve * b.targetX ** 2 - slope * b.targetX;
      if (b.counter === 0) { b.startX -= 50; b.curve = 0; enemy.speed /= 2; }
      if (b.counter < 0) {
        if (enemy.speed <= 0) { enemy.speed = 0; return; }
        if (enemy.speed < 0.5) { const rotation = Math.abs(b.rotation) % 360; if (rotation > 180 || rotation < 90) enemy.speed -= 0.2; }
        else enemy.speed = enemy.speed / 1.05 - 0.01;
        b.rotation -= enemy.speed * 6.7;
      } else b.rotation -= 4;
      return;
    }
    if (enemy.hp <= 0) {
      enemy.deathTicks++;
      const deathEnds: Partial<Record<EnemyKind, number>> = { sheep: 129, rat: 128, chicken: 239, crow: 87, archer: 125, fly: 41, barbarian: 119, lava: 128, boss: 403 };
      if (ENEMY_TIMELINES[enemy.kind]) this.advanceLaterEnemy(enemy, ENEMY_TIMELINES[enemy.kind]);
      else enemy.frame = Math.min(enemy.frame + 1, deathEnds[enemy.kind] ?? ENEMY_TIMELINES[enemy.kind]?.labels.null ?? (enemy.kind === 'dropped-rat' ? 128 : 200));
      if (enemy.kind === 'lava' && enemy.frame === 51) {
        enemy.removed = true; enemy.hp = -1; enemy.frame = 223; enemy.deathTicks = 201;
        return;
      }
      enemy.shadowHit = shadowHitAtFrame(enemy.kind, enemy.frame, enemy.shadowHit);
      if (enemy.deathTicks === 50 && enemy.drop === 1) { this.state.gold += enemy.gold; this.state.totalMoney += enemy.gold; this.events.push({ type: 'gold', amount: enemy.gold, x: enemy.x, y: enemy.y }); }
      if (enemy.deathTicks >= 200) {
        enemy.removed = true;
        if (enemy.kind === 'fly') { enemy.hp = -1; enemy.frame = 126; enemy.deathTicks = 201; }
        if (enemy.kind === 'barbarian') { enemy.hp = -1; enemy.frame = 252; enemy.deathTicks = 201; }
        if (enemy.kind === 'lava') { enemy.hp = -1; enemy.frame = 223; enemy.deathTicks = 201; }
      }
      return;
    }
    if (enemy.kind === 'dropped-rat' && enemy.fallTargetY !== undefined) {
      enemy.y = Math.min(enemy.fallTargetY, enemy.y + 4);
      if (enemy.y >= enemy.fallTargetY) delete enemy.fallTargetY;
      return;
    }
    registerPartyTarget(enemy as PartyAITarget, this.state.partyAI);
    // После начала прыжка Lava отменяет отбрасывание, но продолжает обычное движение AI.
    if (enemy.kind === 'lava' && enemy.attacking && enemy.knockBack > 0) enemy.knockBack = 0;
    if (enemy.knockBack > 0) {
      if (enemy.attacking) {
        enemy.attacking = false; enemy.speed = enemy.speedOrg; enemy.frame = enemy.kind === 'rat' || enemy.kind === 'dropped-rat' ? 14 : ENEMY_TIMELINES[enemy.kind]?.labels.alive ?? (enemy.kind === 'barbarian' ? 3 : 5);
        enemy.shadowHit = shadowHitAtFrame(enemy.kind, enemy.frame, enemy.shadowHit);
      }
      enemy.knockBack--;
      enemy.x -= enemy.knockBack ** 2 / 40 + ENEMIES[enemy.kind].knockResistance / 2 + 0.2;
      if (enemy.kind === 'archer' || enemy.kind === 'fly' || enemy.kind === 'barbarian' || enemy.kind === 'lava') enemy.x = twipCoordinate(enemy.x);
      const width = enemy.kind === 'archer' ? ARCHER_DISPLAY_WIDTHS[enemy.frame] : enemy.kind === 'fly' ? FLY_DISPLAY_WIDTHS[enemy.frame] : enemy.kind === 'barbarian' ? barbarianParentWidth(enemy.frame, enemy.rageEffectFrame, enemy.hitEffects) : enemy.kind === 'lava' ? lavaParentWidth(enemy.frame, enemy.hitEffects) : 60;
      enemy.x = Math.max(-width, enemy.x);
      this.advanceEnemyAnimation(enemy);
      return;
    }
    if (ENEMY_TIMELINES[enemy.kind]) { this.tickLaterEnemy(enemy, ENEMY_TIMELINES[enemy.kind]); return; }
    if (enemy.kind === 'boss') { this.tickBoss(enemy); this.advanceBossAnimation(enemy); return; }
    if (enemy.kind === 'lava') {
      enemy.x = twipCoordinate(enemy.x + enemy.speed);
      if (enemy.x >= WORLD.defenseLine - 300 && !enemy.alerted) {
        alertParty(enemy as PartyAITarget, this.state.party.slots.slice(0, 4), this.partyAIContext());
        enemy.alerted = true;
      }
      if (enemy.x >= WORLD.defenseLine && !enemy.attacking) {
        enemy.attacking = true; enemy.frame = 23;
        enemy.shadowHit = false;
      }
      this.advanceEnemyAnimation(enemy);
      return;
    }
    if (enemy.kind === 'barbarian') {
      if (!enemy.attacking) {
        enemy.x = twipCoordinate(enemy.x + enemy.speed);
        if (enemy.x >= WORLD.defenseLine) { enemy.speed = 0; enemy.attacking = true; enemy.frame = 26; }
      }
      this.advanceEnemyAnimation(enemy);
      return;
    }
    if (enemy.kind === 'archer') {
      if (enemy.attacking) {
        if (enemy.x < 290 && enemy.attacked) {
          enemy.attacked = false; enemy.attacking = false;
          // В исходном клипе отсутствует stand; наблюдаемый переход Ruffle возвращает кадр 1.
          enemy.frame = 1; enemy.speed = enemy.speedOrg;
        }
      } else {
        enemy.x = twipCoordinate(enemy.x + enemy.speed);
        if (enemy.x >= 290) {
          if (this.random() * (400 - enemy.x) <= 3.5) { enemy.attacking = true; enemy.speed = 0; enemy.frame = 28; }
        } else if (--enemy.rangedCounter! < 0) {
          enemy.rangedCounter = 80; enemy.attacking = true; enemy.speed = 0; enemy.frame = 28;
        }
      }
      this.advanceEnemyAnimation(enemy);
      return;
    }
    if (enemy.kind === 'fly') {
      enemy.flyCounter!++;
      if (enemy.flyCounter! < 40) enemy.x = twipCoordinate(enemy.x + enemy.speed);
      else {
        if (enemy.flyCounter === 40) enemy.speed = 0;
        if (this.random() < 0.02) { enemy.speed = enemy.speedOrg; enemy.flyCounter = 0; }
      }
      if (enemy.x > 640) {
        this.damageCastle(enemy.attack); enemy.removed = true; enemy.hp = -1; enemy.frame = 126; enemy.deathTicks = 201;
        return;
      }
      this.advanceEnemyAnimation(enemy);
      return;
    }
    if (enemy.kind === 'crow') {
      if (enemy.attacking) {
        enemy.speed += 0.5; enemy.y++;
        if (enemy.x > 640) { this.damageCastle(enemy.attack); enemy.removed = true; return; }
      }
      enemy.x += enemy.speed;
      if (enemy.x >= 360 && this.random() * (460 - enemy.x) <= 3 && !enemy.attacking) { enemy.attacking = true; enemy.frame = 30; }
      enemy.frame++;
      if (enemy.frame === 27) enemy.frame = 3;
      if (enemy.frame === 46) enemy.frame = 30;
      enemy.shadowHit = shadowHitAtFrame(enemy.kind, enemy.frame, enemy.shadowHit);
      return;
    }
    if (enemy.kind === 'chicken') {
      if (enemy.attacking) {
        if (enemy.attacked) { enemy.attacked = false; enemy.attacking = false; enemy.frame = 37; }
      } else {
        enemy.x += enemy.speed;
        if (enemy.speed === 0) {
          if (enemy.x > 40 && this.random() * (350 - enemy.x) <= 2) { enemy.attacking = true; enemy.frame = 105; }
          else if (enemy.x <= 350 && this.random() > 0.98) { enemy.speed = enemy.speedOrg; enemy.frame = 5; }
        }
      }
    } else if (!enemy.attacking) {
      enemy.x += enemy.speed;
      if (enemy.x >= WORLD.defenseLine) {
        enemy.speed = 0; enemy.attacking = true; enemy.frame = enemy.kind === 'sheep' ? 32 : 41;
        enemy.shadowHit = shadowHitAtFrame(enemy.kind, enemy.frame, enemy.shadowHit);
      }
    }
    this.advanceEnemyAnimation(enemy);
  }

  private tickLaterEnemy(enemy: EnemyState, timeline: EnemyTimeline): void {
    const attack = () => { enemy.attacking = true; enemy.speed = 0; enemy.frame = timeline.labels.attack; this.runLaterFrame(enemy, timeline); };
    const resume = () => { enemy.attacking = false; enemy.attacked = false; enemy.speed = enemy.speedOrg; enemy.frame = timeline.labels.alive; };
    if (enemy.kind === 'bird') {
      enemy.x += enemy.speed;
      if (enemy.x < 350 && this.random() > 0.988 && this.state.enemies.length < 200) {
        this.spawnEnemy('dropped-rat');
        const rat = this.state.enemies[this.state.enemies.length - 1];
        rat.x = enemy.x; rat.fallTargetY = rat.y; rat.y = enemy.y + 30; rat.frame = 14;
      }
      if (enemy.x > 640) enemy.removed = true;
    } else if (enemy.kind === 'spider' || enemy.kind === 'ghost') {
      if (!enemy.attacking) {
        enemy.behaviorCounter = (enemy.behaviorCounter ?? 0) + 1;
        const movingFrames = enemy.kind === 'spider' ? 10 : 100;
        if (enemy.behaviorCounter < movingFrames) {
          enemy.x += enemy.speed;
          if (enemy.kind === 'spider') {
            enemy.y += enemy.speed / 2 * (enemy.direction ?? 1);
            if (enemy.y < WORLD.groundLine || enemy.y > WORLD.groundLine + WORLD.groundWidth) enemy.behaviorCounter = 20;
          }
        } else {
          if (enemy.behaviorCounter === movingFrames) { enemy.speed = 0; enemy.frame = timeline.labels.stop; }
          if (this.random() < 0.02) {
            resume(); enemy.behaviorCounter = 0; enemy.direction = -(enemy.direction ?? 1);
            if (enemy.y < WORLD.groundLine + 40) enemy.direction = 1;
            if (enemy.y > WORLD.groundLine + WORLD.groundWidth - 40) enemy.direction = -1;
          }
        }
        if (enemy.x >= WORLD.defenseLine) attack();
      }
    } else if (enemy.kind === 'cata' || enemy.kind === 'tank' || enemy.kind === 'dino' || enemy.kind === 'dragon') {
      const near = enemy.kind === 'dino' ? 190 : enemy.kind === 'dragon' ? 200 : 150;
      const far = enemy.kind === 'dino' || enemy.kind === 'dragon' ? 400 : 350;
      if (enemy.attacking) { if (enemy.x < near && enemy.attacked) resume(); }
      else {
        enemy.x += enemy.speed;
        if (enemy.x >= near) {
          if (this.random() * (far - enemy.x) <= (enemy.kind === 'dino' ? 5 : enemy.kind === 'dragon' ? 4 : 3)) attack();
        } else if (enemy.kind === 'dino' || enemy.kind === 'dragon') {
          enemy.behaviorCounter = (enemy.behaviorCounter ?? 0) - 1;
          if (enemy.behaviorCounter < 0) { enemy.behaviorCounter = 80; attack(); }
        }
      }
    } else if (!enemy.attacking) {
      enemy.x += enemy.speed;
      if (enemy.x >= WORLD.defenseLine) attack();
    }
    this.advanceLaterEnemy(enemy, timeline);
  }

  private runLaterFrame(enemy: EnemyState, timeline: EnemyTimeline): void {
    const action = timeline.frames[enemy.frame];
    if (!action) return;
    if (action.shadow !== undefined) enemy.shadowHit = action.shadow;
    if (action.attacked) enemy.attacked = true;
    if (action.alert && enemy.hp > 0) alertParty(enemy as PartyAITarget, this.state.party.slots.slice(0, 4), this.partyAIContext());
    if (action.damage && enemy.hp > 0) this.damageCastle(enemy.attack, enemy);
    if (action.jump && action.jump !== enemy.frame) { enemy.frame = action.jump; this.runLaterFrame(enemy, timeline); }
  }

  private advanceLaterEnemy(enemy: EnemyState, timeline: EnemyTimeline): void {
    if ((enemy.kind === 'spider' || enemy.kind === 'ghost') && !enemy.attacking && enemy.speed === 0 && enemy.frame === timeline.labels.stop) return;
    if (timeline.frames[enemy.frame]?.stop) return;
    enemy.frame = Math.min(enemy.frame + 1, timeline.count);
    this.runLaterFrame(enemy, timeline);
  }

  private advanceEnemyAnimation(enemy: EnemyState): void {
    if (ENEMY_TIMELINES[enemy.kind]) { this.advanceLaterEnemy(enemy, ENEMY_TIMELINES[enemy.kind]); return; }
    enemy.frame++;
    if (enemy.kind === 'lava') {
      if (enemy.frame === 20) enemy.frame = 4;
      if (enemy.frame === 23 || enemy.frame === 86) { enemy.frame = 23; enemy.shadowHit = false; }
      if (enemy.frame === 35) {
        // У исходного взрыва нет атакующего аргумента: Guardian не отвечает ему ударом.
        this.damageCastle(enemy.attack);
        this.random(); this.random();
        this.events.push({ type: 'lava-explode', x: enemy.x, y: enemy.y, enemyUid: enemy.uid });
        enemy.hp = -1;
      }
    } else if (enemy.kind === 'sheep') {
      if (enemy.frame === 29) enemy.frame = 5;
      if (enemy.frame === 44) this.damageCastle(enemy.attack, enemy);
      if (enemy.frame === 95) enemy.frame = 32;
    } else if (enemy.kind === 'rat' || enemy.kind === 'dropped-rat') {
      if (enemy.frame === 38) enemy.frame = 14;
      if (enemy.frame === 60) this.damageCastle(enemy.attack, enemy);
      if (enemy.frame === 81) enemy.frame = 41;
    } else if (enemy.kind === 'archer') {
      if (enemy.frame === 25) enemy.frame = 5;
      if (enemy.frame === 59) {
        this.state.enemyArrows.push(createEnemyArrow(this.state.nextUid++, enemy.x, enemy.y));
        enemy.attacked = true;
        this.events.push({ type: 'enemy-arrow', x: enemy.x, y: enemy.y });
        this.damageCastle(enemy.attack, enemy);
      }
      if (enemy.frame === 82) enemy.frame = 28;
    } else if (enemy.kind === 'fly') {
      if (enemy.frame === 9) enemy.frame = 3;
    } else if (enemy.kind === 'barbarian') {
      if (enemy.frame === 23) enemy.frame = 3;
      if (enemy.frame === 27 && enemy.rampage === 100) enemy.frame = 38;
      if (enemy.frame === 45) this.damageCastle(enemy.attack, enemy);
      if (enemy.frame === 72 || (enemy.frame === 53 && enemy.rampage === 100)) enemy.frame = 26;
    } else if (enemy.kind === 'chicken') {
      if ([29, 32, 34].includes(enemy.frame)) enemy.speed *= 0.75;
      if (enemy.frame === 37) enemy.speed = 0;
      if (enemy.frame === 47) enemy.attacking = true;
      if (enemy.frame === 58 && this.random() > 0.5) enemy.frame = 50 + int(this.random() * 5);
      if (enemy.frame === 78) enemy.attacking = false;
      if (enemy.frame === 102) enemy.frame = 37;
      if (enemy.frame === 136) this.damageCastle(enemy.attack, enemy);
      if (enemy.frame === 153) enemy.attacked = true;
      if (enemy.frame === 196) enemy.frame = 105;
    }
    enemy.shadowHit = shadowHitAtFrame(enemy.kind, enemy.frame, enemy.shadowHit);
  }

  private tickBoss(enemy: EnemyState): void {
    for (let i = 0; i < (enemy.rampage ? 2 : 1); i++) this.tickBossAction(enemy);
  }

  private tickBossAction(enemy: EnemyState): void {
    if (enemy.bossIdle > 0) { enemy.bossIdle--; return; }
    if (enemy.bossAction === 1) {
      enemy.bossIdle = enemy.bossWeapon === 1 ? 90 : 5;
      this.damageCastle(enemy.attack * (enemy.bossWeapon === 1 ? 4 : 1), enemy);
      enemy.bossFireNum--;
      enemy.frame = 10;
      this.events.push({ type: 'boss-shot', weaponId: enemy.bossWeapon, x: enemy.x, y: enemy.y });
      if (enemy.bossFireNum <= 0) {
        if (int(this.random() * 2) === 0) enemy.bossAction = -1;
        enemy.bossIdle = 100 + int(this.random() * 100);
      }
    } else if (enemy.bossAction === 2) {
      enemy.x = twipCoordinate(enemy.x + enemy.speed);
      enemy.bossCount--;
      if (enemy.bossCount <= 0) {
        if (this.random() < 0.15 && this.state.activeMission.level >= 3) {
          enemy.bossCount = 100 + int(this.random() * 100);
          enemy.bossAction = 6; enemy.frame = 221;
        } else if (this.random() < 0.2 && this.state.activeMission.level >= 6) {
          enemy.bossFacing = -1; enemy.speed = 0; enemy.bossAction = 5;
          // Проверка ракеты расходует бросок и до её исходного порога уровня 20.
          enemy.bossSpecial = this.random() < 0.5 && this.state.activeMission.level >= 20 ? 'rocket' : 'grenade';
          const windup = enemy.bossSpecial === 'rocket' ? 100 : 60;
          enemy.bossIdle = windup + int(this.random() * windup / 2);
          enemy.frame = 184;
        } else {
          enemy.bossFacing = -1; enemy.bossAction = 1; enemy.speed = 0;
          const rounds = enemy.bossWeapon === 1 ? 1 : 5;
          enemy.bossFireNum = rounds / 2 + int(this.random() * rounds);
          enemy.bossIdle = 50 + int(this.random() * 100);
          enemy.frame = 24;
        }
      }
    } else if (enemy.bossAction === 3 || enemy.bossAction === 4) {
      enemy.bossFacing = enemy.bossAction === 3 ? -1 : 1;
      enemy.speed = enemy.speedOrg * (enemy.bossAction === 3 ? 1 : -1);
      enemy.bossAction = 2; enemy.frame = 200;
    } else if (enemy.bossAction === 5) {
      enemy.bossAction = -1;
      enemy.bossIdle = 25 + int(this.random() * 25);
      enemy.frame = 170;
      this.state.projectiles.push(createProjectile({ uid: this.state.nextUid++, kind: enemy.bossSpecial === 'rocket' ? 'rocket' : 'grenade', weaponSlot: null,
        startX: enemy.x, startY: enemy.y, targetX: WORLD.playerX + this.random() * 120 - 20,
        targetY: WORLD.playerY + this.random() * 100 - 50, speedBase: enemy.bossSpecial === 'rocket' ? 10 : 12, damage: -1 }));
      // Урон замку наносится при броске. Взрыв с damage=-1 позднее только рисуется и трясёт экран.
      this.damageCastle(enemy.attack * (enemy.bossSpecial === 'rocket' ? 5 : 3), enemy);
      this.events.push({ type: 'boss-special', weaponId: enemy.bossSpecial === 'rocket' ? 36 : 11, x: enemy.x, y: enemy.y, enemyUid: enemy.uid });
    } else if (enemy.bossAction === 6) {
      enemy.bossCount--; enemy.bossFacing = -1; enemy.speed = 0;
      if (enemy.bossCount <= 0) enemy.bossAction = 2;
    } else {
      enemy.bossAction = 3; enemy.bossCount = 40 + this.random() * 40;
      if (enemy.x > 380 || (enemy.x >= 100 && int(this.random() * 3) === 0)) { enemy.bossAction = 4; enemy.bossCount = 20 + this.random() * 40; }
    }
  }

  private advanceBossAnimation(enemy: EnemyState): void {
    // Дочерний клип продолжает анимацию при ожидании AI и останавливается на исходных кадрах.
    if ([24, 84, 92, 109, 134, 159, 184, 236].includes(enemy.frame)) return;
    enemy.frame++;
    if (enemy.frame === 212) enemy.frame = 200;
  }

  private finishDay(): void {
    if (this.state.phase !== 'battle') return;
    const player = this.state.player;
    // fillAmmo сохраняет оба поля расходника; updateAlly при Rest отдельно сбрасывает таймер.
    for (const item of this.state.inventory) if (item && item.type !== ITEM_TYPE.use) {
      item.reloadTime = 0;
      item.ammo = item.ammoMax;
    }
    player.rampageTicks = 0;
    player.bowDrawing = false;
    // fillAmmo пополняет также неактивные слоты; endRampage удаляет лишь визуальный эффект.
    for (const slot of this.state.party.slots.slice(0, 4)) {
      if (slot.weapon && slot.weapon.type !== ITEM_TYPE.use) { slot.weapon.reloadTime = 0; slot.weapon.ammo = slot.weapon.ammoMax; }
    }
    this.state.itemCooldowns.fill(0);
    for (let slot = 0; slot < 5; slot++) {
      const actor = this.actor(slot);
      if (!actor) continue;
      actor.exp += 250;
      if (actor.exp >= 1000) this.levelUpActor(slot);
    }
    // wexpUp повышает навык один раз, затем обнуляет весь накопленный опыт оружия.
    for (let slot = 0; slot < 5; slot++) {
      const actor = this.actor(slot);
      if (!actor) continue;
      for (const [index, skill] of WEAPON_SKILLS.entries()) {
        if (actor.weaponExp[index] > int(((actor.traits[skill] ?? 0) * 12 + 20) * (slot === 0 ? 1 : 0.5))) {
          actor.traits[skill] = (actor.traits[skill] ?? 0) + 1; actor.weaponExp[index] = 0;
        }
      }
      if (slot) {
        const member = partySlot(this.state.party, slot)!.member!;
        while (member.skillPoints > 0) {
          gainCompanionTrait(member, this.state.partySkills, () => this.random(), slot);
          member.skillPoints--;
        }
      }
    }
    this.state.pendingShot = false;
    if (this.state.noDamage) {
      this.state.perfectDays++;
      [1, 4, 7, 10].forEach((count, index) => { if (this.state.perfectDays >= count) this.awardMedal(60 + index); });
    }
    if (player.level >= 10) this.awardMedal(67);
    const reward = this.state.activeMission.reward;
    const perfectBonus = this.state.noDamage ? Math.trunc(reward * 1.3) - reward : 0;
    const tax = Math.max(0, this.state.day * 35 - 200);
    const salary = this.state.title === 1 ? 100 : 0;
    const wages = this.state.party.slots.slice(0, 4).reduce((total, slot) => total + (slot.exists && slot.member ? companionWage(slot.member, this.state.partySkills.effects[127], this.state.earnedMedals.includes(92)) : 0), 0);
    const upkeep = castleUpkeep(this.state);
    const museum = museumIncome(this.state.economy.museum, this.state.earnedMedals);
    this.state.result = { reward, perfectBonus, upkeep, tax, salary, wages, ...(museum ? { museum } : {}), netReward: reward + perfectBonus + salary + museum - upkeep - tax - wages };
    this.state.phase = 'victory';
    this.prepareOrdinaryLoot(() => this.random());
    this.events.push({ type: 'victory' });
  }

  private prepareOrdinaryLoot(random: () => number): void {
    if (this.state.phase !== 'victory' || this.state.postbattle !== 'none') return;
    const generated = new ItemFactory(random, { day: this.state.day, engineer: this.state.partySkills.effects[120], looter: this.state.looterLevel }).ordinaryLoot(this.state.loot, this.state.previousTown?.shop ?? this.state.lootOffers);
    this.state.lootOffers = generated.offers;
    this.state.loot = generated.queue;
    this.state.postbattle = 'loot';
  }

  moveLootItem(fromArea: LootArea, from: number, toArea: LootArea, to: number): boolean {
    if (this.state.phase !== 'victory' || !['loot', 'boss-loot'].includes(this.state.postbattle) || this.state.pendingLootAction) return false;
    if (!['offers', 'inventory'].includes(fromArea) || !['offers', 'inventory'].includes(toArea)) return false;
    const source = fromArea === 'offers' ? this.state.lootOffers : this.state.inventory;
    const destination = toArea === 'offers' ? this.state.lootOffers : this.state.inventory;
    if (isOccupiedItem(source[from]) && source[from]!.type === ITEM_TYPE.mod && isOccupiedItem(destination[to]) && destination[to]!.type === ITEM_TYPE.gun) {
      return this.beginLootModMount({ area: fromArea, index: from }, { area: toArea, index: to }) === 'previewed';
    }
    return source === destination ? swapInventorySlots(source, from, to) : collectLootItem(source, destination, from, to);
  }

  private validLootAddress(address: unknown): address is LootItemAddress {
    if (!record(address) || !['offers', 'inventory'].includes(String(address.area)) || typeof address.area !== 'string' || !Number.isInteger(address.index)) return false;
    const slots = address.area === 'offers' ? this.state.lootOffers : this.state.inventory;
    return typeof address.index === 'number' && address.index >= 0 && address.index < slots.length;
  }

  beginLootModMount(mod: LootItemAddress, gun: LootItemAddress): TownEquipmentOutcome {
    const state = this.state;
    if (state.phase !== 'victory' || !['loot', 'boss-loot'].includes(state.postbattle) || state.pendingLootAction || state.pendingTownAction || state.pendingPartyAction
      || !this.validLootAddress(mod) || !this.validLootAddress(gun) || (mod.area === gun.area && mod.index === gun.index)) return 'unavailable';
    const source = (mod.area === 'offers' ? state.lootOffers : state.inventory)[mod.index];
    const target = (gun.area === 'offers' ? state.lootOffers : state.inventory)[gun.index];
    if (!isOccupiedItem(source) || source.type !== ITEM_TYPE.mod || !isOccupiedItem(target) || target.type !== ITEM_TYPE.gun) return 'unavailable';
    // В loot оба ряда имеют op=1; диалог не переносит предметы и не расходует RNG.
    state.pendingLootAction = { kind: 'mod', mod: { ...mod }, gun: { ...gun } };
    return 'previewed';
  }

  resolveLootModMount(confirm: boolean): TownEquipmentOutcome {
    const state = this.state, action = state.pendingLootAction;
    if (state.phase !== 'victory' || !['loot', 'boss-loot'].includes(state.postbattle) || !action || typeof confirm !== 'boolean') return 'unavailable';
    state.pendingLootAction = null;
    // No/щелчок снаружи меняет полные записи местами, как исходный endDialog.
    if (!confirm) return this.moveLootItem(action.gun.area, action.gun.index, action.mod.area, action.mod.index) ? 'swapped' : 'unavailable';
    const source = (action.mod.area === 'offers' ? state.lootOffers : state.inventory)[action.mod.index];
    const target = (action.gun.area === 'offers' ? state.lootOffers : state.inventory)[action.gun.index];
    const failure = modMountFailure(source, target);
    if (failure) return failure;
    this.equipmentFactory().enchant(target!, source!.mod, source!.modMax);
    source!.num = 0;
    return 'mounted';
  }

  collectLoot(offer: number, slot = this.state.inventory.findIndex(item => !isOccupiedItem(item))): boolean {
    return this.moveLootItem('offers', offer, 'inventory', slot);
  }

  dropLootItem(slot: number, offer = this.state.lootOffers.findIndex(item => !isOccupiedItem(item))): boolean {
    return this.moveLootItem('inventory', slot, 'offers', offer);
  }

  finishLoot(): boolean {
    if (this.state.phase !== 'victory' || !['loot', 'boss-loot'].includes(this.state.postbattle) || this.state.pendingLootAction) return false;
    if (this.state.postbattle === 'loot' && this.state.bossKilled > 0) {
      this.state.lootOffers = this.equipmentFactory().bossLoot(this.state.bossKilled, false, this.state.lootOffers);
      this.state.postbattle = 'boss-loot';
      return true;
    }
    this.prepareSkillChoices();
    for (const item of this.state.lootOffers) if (item) item.num = 0;
    return true;
  }

  private prepareSkillChoices(): void {
    this.state.skillChoices = this.state.player.skillPoints > 0 ? rollHeroChoices(this.state.player.classId, this.state.player.level, this.state.player.traits, () => this.random()) : [];
    this.state.postbattle = this.state.skillChoices.length > 0 ? 'skill' : 'result';
    if (this.state.postbattle === 'result') this.prepareResult();
  }

  private prepareResult(): void {
    if (this.state.phase !== 'victory' || this.state.postbattle !== 'result' || this.state.town !== null) return;
    // renewResult тратит бросок fame даже при fame=0; townEvent использует прежний кэш ACTIVE.
    this.random();
    const extraAp = int(this.random() * this.random() * (this.state.partySkills.effects[123] + 1));
    this.state.gold += this.state.result.netReward;
    this.state.totalMoney += this.state.result.reward + this.state.result.perfectBonus + this.state.result.salary + (this.state.result.museum ?? 0);
    this.state.town = { ap: 4 + extraAp, preparation: 'pending' };
  }

  enterTown(): boolean {
    if (this.state.phase !== 'victory' || this.state.postbattle !== 'result' || this.state.town === null) return false;
    this.prepareTown();
    this.state.phase = 'town';
    return true;
  }

  private prepareTown(): void {
    if (this.state.town?.preparation !== 'pending') return;
    const previous = this.state.previousTown;
    const recruitSlots = { ...previous?.recruit.items, 45: this.state.party.slots[4].weapon };
    const shopEngineer = this.state.partySkills.effects[120];
    this.refreshPartySkills();
    // До generateMission лавка использует старого Engineer; миссия и кандидат — новый кэш.
    const prepared = prepareEarlyTown(() => this.random(), this.state.day, { priorOffers: this.state.lootOffers, recruitSlots, searched: previous?.searched, absorbFix: this.medalAbsorption(),
      smith: this.state.economy.smith, chickens: this.state.economy.chickens, shopEngineer, missionNegotiator: this.state.partySkills.effects[117], recruitEngineer: this.state.partySkills.effects[120] });
    this.state.town = { ap: this.state.town.ap, preparation: 'ready', ...prepared };
    installCandidate(this.state.party, prepared.recruit);
    this.refreshPartySkills();
    // Общие слоты 0–7 теперь принадлежат лавке; отдельной копии истории трофеев не остаётся.
    this.state.lootOffers = Array(8).fill(null);
  }

  buyStock(stock: number, slot: number): PurchaseOutcome {
    const town = this.state.town;
    if ((this.state.pendingTownAction || this.state.pendingPartyAction) || this.state.phase !== 'town' || town?.preparation !== 'ready' || !Number.isInteger(stock) || stock < 0 || stock >= 8 || !Number.isInteger(slot) || slot < 0 || slot >= this.state.inventory.length || !isOccupiedItem(town.shop[stock])) return 'unavailable';
    if (isOccupiedItem(this.state.inventory[slot])) return 'occupied';
    const price = Math.trunc(town.shop[stock]!.value);
    if (this.state.gold < price) return 'not-enough-gold';
    this.state.gold -= price;
    [town.shop[stock], this.state.inventory[slot]] = [this.state.inventory[slot], town.shop[stock]];
    return 'purchased';
  }

  moveTownItem(from: number, to: number): boolean {
    return !this.state.pendingTownAction && !this.state.pendingPartyAction && this.state.phase === 'town' && this.state.town?.preparation === 'ready' && swapInventorySlots(this.state.inventory, from, to);
  }

  sellTownItem(slot: number): number | null {
    if ((this.state.pendingTownAction || this.state.pendingPartyAction) || this.state.phase !== 'town' || this.state.town?.preparation !== 'ready' || !Number.isInteger(slot) || slot < 0 || slot >= this.state.inventory.length) return null;
    const item = this.state.inventory[slot];
    if (!isOccupiedItem(item)) return null;
    const price = itemPrice(item);
    this.state.gold += price; this.state.totalMoney += price;
    item.num = 0;
    return price;
  }

  applyShopToken(slot: number, stock: number): boolean {
    const town = this.state.town;
    if ((this.state.pendingTownAction || this.state.pendingPartyAction) || this.state.phase !== 'town' || town?.preparation !== 'ready' || !Number.isInteger(slot) || slot < 0 || slot >= this.state.inventory.length || !Number.isInteger(stock) || stock < 0 || stock >= 8) return false;
    const token = this.state.inventory[slot], item = town.shop[stock];
    if (!isOccupiedItem(token) || token.id !== 35 || !finite(token.attack) || token.attack < 0 || !isOccupiedItem(item)) return false;
    item.value = Math.min(999999999, Math.max(0, item.value - token.attack!));
    token.num = 0;
    return true;
  }

  buyCastleUpgrade(kind: CastleUpgradeKind): CastleUpgradeOutcome {
    if (!this.partyMutationAvailable() || !CASTLE_UPGRADES.includes(kind)) return 'unavailable';
    const state = this.state, cost = castleUpgradeCost(kind, state);
    if (cost === 0) return 'capped';
    if (state.gold < cost) return 'not-enough-gold';
    state.gold -= cost;
    if (kind === 'house') state.party.capacity = (state.party.capacity + 1) as 2 | 3;
    else if (kind === 'wall') {
      state.wallLevel++;
      state.castleHp += 5;
      state.castleMaxHp += 5;
    }
    else if (kind === 'fix-wall') { state.wallFixCount++; state.castleHp = state.castleMaxHp; }
    else if (kind === 'repairman') state.repairmanLevel++;
    else if (kind === 'sandbag') state.sandbagLevel++;
    else if (kind === 'looter') state.looterLevel++;
    else if (kind === 'trainer') state.trainerLevel++;
    else if (kind === 'storage') state.inventory.push(null);
    else {
      const field = { smith: 'smith', museum: 'museum', chicken: 'chickens', sister: 'sisters', villa: 'villa', 'special-trainer': 'specialTrainer' }[kind] as keyof TownEconomy;
      (state.economy[field] as number)++;
      if (kind === 'smith') this.regenerateShop();
      [30, 60, 120].forEach((count, index) => { if (state.economy.chickens >= count) this.awardMedal(50 + index); });
      [10, 20, 30].forEach((count, index) => { if (state.economy.sisters >= count) this.awardMedal(53 + index); });
    }
    // Исходный одиночный щелчок не тратит AP, не обновляет кеш навыков и уже оплаченный итог.
    return 'purchased';
  }

  private regenerateShop(): void {
    const town = this.state.town;
    if (town?.preparation !== 'ready') return;
    town.shop = generateTownShop(() => this.random(), this.state.day, { priorOffers: town.shop,
      smith: this.state.economy.smith, shopEngineer: this.state.partySkills.effects[120], specialSale: false });
  }

  refreshTownStock(): 'refreshed' | 'not-enough-ap' | 'unavailable' {
    if (!this.partyMutationAvailable()) return 'unavailable';
    if (this.state.town!.ap < 2) return 'not-enough-ap';
    this.state.town!.ap -= 2; this.regenerateShop(); return 'refreshed';
  }

  refreshTownRecruit(): 'refreshed' | 'not-enough-ap' | 'unavailable' {
    if (!this.partyMutationAvailable()) return 'unavailable';
    if (this.state.town!.ap < 2) return 'not-enough-ap';
    const town = this.state.town! as ReadyTown;
    town.ap -= 2;
    town.recruit = generateEarlyTownRecruit(() => this.random(), this.state.day, {
      previousSlots: { ...town.recruit.items, 45: this.state.party.slots[4].weapon }, itemContext: { engineer: this.state.partySkills.effects[120] } });
    installCandidate(this.state.party, town.recruit); return 'refreshed';
  }

  townActivityAvailable(action: TownActivity): boolean {
    if (!this.partyMutationAvailable()) return false;
    const town = this.state.town! as ReadyTown, e = this.state.economy;
    if (action === 'pray') return !town.flags.prayed;
    if (action === 'dinner') return town.mission.expFix === 1;
    if (action === 'party') return e.villa > 0 && !town.flags.partyHeld;
    if (action === 'eggs') return e.chickens > 0 && !town.flags.egg;
    if (action === 'taunt') return this.state.partySkills.effects[125] > 0;
    return e.specialTrainer > 0 && (e.heroTraining < e.specialTrainer
      || this.state.party.slots.slice(0, 3).some(slot => slot.exists && slot.member!.trained < e.specialTrainer));
  }

  performTownActivity(action: TownActivity): { outcome: 'done' | 'not-enough-ap' | 'unavailable'; message: string } {
    if (!Object.hasOwn(TOWN_ACTIVITIES, action) || !this.townActivityAvailable(action)) return { outcome: 'unavailable', message: 'This activity is unavailable.' };
    const state = this.state, town = state.town as ReadyTown, e = state.economy, info = TOWN_ACTIVITIES[action];
    if (town.ap < info.cost) return { outcome: 'not-enough-ap', message: "You don't have enough action points!" };
    let message = '';
    if (action === 'train') {
      const actors = [{ slot: 0, actor: state.player, devType: HERO_CLASSES[state.player.classId].id },
        ...state.party.slots.slice(0, 3).filter(slot => slot.exists).map(slot => ({ slot: slot.slot, actor: slot.member!, devType: slot.member!.devType }))];
      let index = 0;
      for (let i = 0; i < 10; i++) index = int(this.random() * actors.length);
      const trained = (i: number) => i === 0 ? e.heroTraining : state.party.slots[actors[i].slot - 1].member!.trained;
      if (trained(index) >= e.specialTrainer) index = actors.findIndex((_, i) => trained(i) < e.specialTrainer);
      if (index < 0) return { outcome: 'unavailable', message: 'For more training, you need an upgrade.' };
      const selected = actors[index];
      const pool = selected.slot === 0 ? availableHeroTraits(state.player.classId, selected.actor.level, selected.actor.traits)
        : availableCompanionTraits({ ...selected.actor, devType: selected.devType } as Parameters<typeof availableCompanionTraits>[0]);
      if (!pool.length) return { outcome: 'unavailable', message: 'No skills are available for training.' };
      const skill = pool[int(this.random() * pool.length)];
      selected.actor.traits[skill] = (selected.actor.traits[skill] ?? 0) + 1;
      if (selected.slot === 0) e.heroTraining++; else state.party.slots[selected.slot - 1].member!.trained++;
      this.refreshPartySkills();
      message = `${selected.slot === 0 ? 'You gain' : state.party.slots[selected.slot - 1].member!.name + ' gains'} ${ALL_TRAITS[skill].name}!`;
    } else if (action === 'pray') {
      town.baseAbsorbFix ??= town.mission.absorbFix;
      town.mission.absorbFix += int(this.random() * 15 + 5) / 100;
      town.flags.prayed = true; e.prayers++;
      message = `A holy aura surrounds your castle. The wall will absorb ${int(town.mission.absorbFix * 100)}% damage during the next battle.`;
    } else if (action === 'dinner') {
      town.mission.expFix = 1.05 + this.random() / 4 + state.partySkills.effects[126] / 100;
      message = `You and your troops will get ${int(town.mission.expFix * 100 - 100)}% more exp in the next battle.`;
    } else if (action === 'party') {
      town.flags.partyHeld = true; e.parties++;
      town.mission.dmgFix += e.villa / 10;
      message = `Everyone celebrates the victory! You and your troops deal ${e.villa * 10}% more damage tomorrow.`;
    } else if (action === 'eggs') {
      const eggs = 2 + int(e.chickens / 2 + int(this.random() * e.chickens / 2) * (100 + state.partySkills.effects[124]) / 100);
      const bonus = 1 + Number(state.earnedMedals.includes(50)) * 0.05 + Number(state.earnedMedals.includes(51)) * 0.15 + Number(state.earnedMedals.includes(52)) * 0.3;
      const gold = int(eggs * 12 * bonus);
      e.eggsCollected += eggs; town.flags.egg = true; state.gold += gold; state.totalMoney += gold;
      message = `Your chickens produced ${eggs} eggs today! You sold them and received ${gold} gold pieces.`;
    } else {
      town.flags.taunted++; e.taunts++;
      const increase = 0.3 + this.random() / 4;
      town.mission.hpFix += increase;
      town.mission.reward = int(town.mission.reward * (100 + state.partySkills.effects[125] / town.flags.taunted) / 100);
      message = `Enemies will have ${int(increase * 100)}% more HP tomorrow. Your mission reward is now ${town.mission.reward} gold pieces!`;
    }
    town.ap -= info.cost;
    return { outcome: 'done', message };
  }

  freeRepair(): RepairOutcome {
    if ((this.state.pendingTownAction || this.state.pendingPartyAction) || this.state.phase !== 'town' || this.state.town === null) return 'unavailable';
    if (this.state.castleHp === this.state.castleMaxHp) return 'not-damaged';
    if (this.state.town.ap < 2) return 'not-enough-ap';
    this.state.town.ap -= 2;
    this.state.castleHp = this.state.castleMaxHp;
    return 'repaired';
  }

  claimTitle(): 'claimed' | 'not-enough-ap' | 'unavailable' {
    const state = this.state;
    if (state.phase !== 'town' || state.town?.preparation !== 'ready' || state.pendingTownAction || state.pendingPartyAction || state.day < 6 || state.title !== 0) return 'unavailable';
    if (state.town.ap < 4) return 'not-enough-ap';
    // Титул меняется после расчёта дня; первая зарплата входит только в следующий итог.
    state.town.ap -= 4;
    state.title = 1;
    return 'claimed';
  }

  private equipmentFactory(): ItemFactory {
    return new ItemFactory(() => this.random(), { day: this.state.day, engineer: this.state.partySkills.effects[120], looter: this.state.looterLevel });
  }

  beginWeaponUpgrade(slot: number): TownEquipmentOutcome {
    const state = this.state, town = state.town;
    if (state.phase !== 'town' || town?.preparation !== 'ready' || state.pendingTownAction || state.pendingPartyAction || !Number.isInteger(slot) || slot < 0 || slot >= this.state.inventory.length) return 'unavailable';
    if (town.ap < 4) return 'not-enough-ap';
    const source = state.inventory[slot];
    if (!isOccupiedItem(source) || source.type !== ITEM_TYPE.gun) return 'unavailable';
    const preview = createUpgradePreview(this.equipmentFactory(), source, state.upgradeReference ?? undefined);
    if (!validItem(preview)) return 'unavailable';
    state.upgradeReference = preview;
    state.pendingTownAction = { kind: 'upgrade', slot, cost: upgradeCost(source) };
    return 'previewed';
  }

  beginModMount(modSlot: number, gunSlot: number): TownEquipmentOutcome {
    const state = this.state;
    if (state.phase !== 'town' || state.town?.preparation !== 'ready' || state.pendingTownAction || state.pendingPartyAction || modSlot === gunSlot || [modSlot, gunSlot].some(slot => !Number.isInteger(slot) || slot < 0 || slot >= this.state.inventory.length)) return 'unavailable';
    const mod = state.inventory[modSlot], gun = state.inventory[gunSlot];
    if (!isOccupiedItem(mod) || mod.type !== ITEM_TYPE.mod || !isOccupiedItem(gun) || gun.type !== ITEM_TYPE.gun) return 'unavailable';
    state.pendingTownAction = { kind: 'mod', modSlot, gunSlot };
    return 'previewed';
  }

  resolveTownEquipment(confirm: boolean): TownEquipmentOutcome {
    const state = this.state, action = state.pendingTownAction, town = state.town;
    if (state.phase !== 'town' || town?.preparation !== 'ready' || action === null) return 'unavailable';
    state.pendingTownAction = null;
    if (action.kind === 'upgrade') {
      if (!confirm) return 'cancelled';
      const source = state.inventory[action.slot], preview = state.upgradeReference;
      if (!isOccupiedItem(source) || source.type !== ITEM_TYPE.gun || !isOccupiedItem(preview)) return 'unavailable';
      if (state.gold < action.cost) return 'not-enough-gold';
      if (town.ap < 4) return 'not-enough-ap';
      town.ap -= 4; state.gold -= action.cost;
      [state.inventory[action.slot], state.upgradeReference] = [preview, source];
      return 'upgraded';
    }
    // No означает обычную перестановку; направление «оружие → MOD» обходит ветку монтажа.
    if (!confirm) return swapInventorySlots(state.inventory, action.gunSlot, action.modSlot) ? 'swapped' : 'unavailable';
    const mod = state.inventory[action.modSlot], gun = state.inventory[action.gunSlot];
    const failure = modMountFailure(mod, gun);
    if (failure) return failure;
    this.equipmentFactory().enchant(gun!, mod!.mod, mod!.modMax);
    mod!.num = 0;
    return 'mounted';
  }

  chooseSkill(id: number): boolean {
    if (this.state.phase !== 'victory' || this.state.postbattle !== 'skill' || this.state.player.skillPoints < 1) return false;
    if (!applyHeroChoice(this.state.player.classId, this.state.player.traits, this.state.skillChoices, id)) return false;
    this.state.player.skillPoints--;
    this.prepareSkillChoices();
    return true;
  }

  toSave(): SimulationState {
    if (this.pendingOpeningMission) throw new Error('Character creation is not a resumable battle.');
    return structuredClone(this.state);
  }

  static fromSave(value: unknown, options: SimulationOptions = {}): Simulation {
    if (!record(value) || !supportedSaveVersion(value.version) || (!validCampaignDay(value.day) || (value.version < 26 && Number(value.day) > 9) || (value.version < 7 && value.day !== 1) || (value.version < 10 && value.day === 3) || (value.version < 11 && value.day === 4) || (value.version < 12 && value.day === 5) || (value.version < 13 && value.day === 6) || (value.version < 14 && value.day === 7) || (value.version < 23 && value.day === 8) || (value.version < 24 && value.day === 9)) || typeof value.phase !== 'string' || !['battle', 'victory', 'defeat', 'town'].includes(value.phase) || (value.version < 4 && value.phase === 'town')) throw new Error('Unsupported or invalid save.');
    const numeric = ['tick', 'timerRemainder', 'rng', 'nextUid', 'castleHp', 'castleMaxHp', 'gold', 'kills', 'criticalKills', 'waveIndex', 'bossWave', 'spawnTimer', 'aimX', 'aimY'];
    if (numeric.some(key => !finite(value[key]))) throw new Error('Invalid save numbers.');
    if (['tick', 'timerRemainder', 'nextUid', 'kills', 'criticalKills'].some(key => !Number.isInteger(value[key]) || Number(value[key]) < 0) || !Number.isInteger(value.bossWave) || Number(value.bossWave) < 2 || Number(value.bossWave) >= (Array.isArray(value.waves) ? value.waves.length : 0) || (Array.isArray(value.waves) && value.waveIndex === value.waves.length && value.newWave !== true)) throw new Error('Invalid counters.');
    // Search может добавить максимум HP отдельно от Wall; уровень задаёт лишь нижнюю границу.
    if (value.version < 16 ? value.castleMaxHp !== FIRST_DAY.castleHp
      : !finite(value.wallLevel) || !Number.isInteger(value.wallLevel) || value.wallLevel < 1 || !Number.isInteger(value.castleMaxHp) || Number(value.castleMaxHp) < FIRST_DAY.castleHp + (value.wallLevel - 1) * 5) throw new Error('Invalid castle upgrades.');
    if (value.version >= 17 && ['wallFixCount', 'repairmanLevel'].some(key => !finite(value[key]) || !Number.isInteger(value[key]) || Number(value[key]) < 0)) throw new Error('Invalid castle repair upgrades.');
    if (value.version >= 22 && (!finite(value.trainerLevel) || !Number.isInteger(value.trainerLevel) || value.trainerLevel < 0)) throw new Error('Invalid Trainer level.');
    if (value.version >= 21 && (!finite(value.looterLevel) || !Number.isInteger(value.looterLevel) || value.looterLevel < 0)) throw new Error('Invalid Looter level.');
    if (value.version >= 18 && (!Number.isInteger(value.sandbagLevel) || typeof value.sandbagLevel !== 'number' || value.sandbagLevel < 0 || value.sandbagLevel > 10)) throw new Error('Invalid Sandbag level.');
    if (Number(value.castleHp) > Number(value.castleMaxHp) || Number(value.waveIndex) < 0 || Number(value.waveIndex) > (Array.isArray(value.waves) ? value.waves.length : 0) || !Number.isInteger(value.waveIndex) || Number(value.timerRemainder) < 0 || Number(value.timerRemainder) >= 30 || typeof value.fireHeld !== 'boolean' || typeof value.pendingShot !== 'boolean' || typeof value.newWave !== 'boolean' || typeof value.noDamage !== 'boolean' || !Number.isInteger(value.rng) || Number(value.rng) < 1 || Number(value.rng) > 4294967295) throw new Error('Invalid mission state.');
    const player = value.player;
    const legacyEquipment = value.version < 7;
    const legacyProjectiles = value.version < 8;
    const playerNumbers = ['level', 'exp', 'skillPoints', 'shootTimer', 'accuracyFix', 'rampageTicks'];
    if (!record(player) || !isHeroClass(player.classId) || value.version < 25 && player.classId !== 'sheriff' || playerNumbers.some(key => !finite(player[key])) || Number(player.level) < 1) throw new Error('Invalid player state.');
    if (['level', 'exp', 'skillPoints'].some(key => !Number.isInteger(player[key]) || Number(player[key]) < 0) || Number(player.exp) >= 1000) throw new Error('Invalid player counters.');
    if (!legacyProjectiles && typeof player.bowDrawing !== 'boolean') throw new Error('Invalid bow draw state.');
    if (legacyEquipment) {
      if (!Number.isInteger(player.weaponExp) || Number(player.weaponExp) < 0) throw new Error('Invalid legacy weapon experience.');
      if (['ammo', 'reloadTicks', 'grenades', 'grenadeCooldown'].some(key => !Number.isInteger(player[key]) || Number(player[key]) < 0) || Number(player.ammo) > 5 || Number(player.grenades) > 5 || Number(player.reloadTicks) > 7 || (player.ammo === 5 && Number(player.reloadTicks) > 0)) throw new Error('Invalid legacy ammunition.');
    } else {
      if (!Array.isArray(player.weaponExp) || player.weaponExp.length !== 5 || player.weaponExp.some(amount => !Number.isInteger(amount) || amount < 0 || amount > 1e9)) throw new Error('Invalid weapon experience.');
      if (!Number.isInteger(player.selectedSlot) || Number(player.selectedSlot) < 0 || Number(player.selectedSlot) >= 5) throw new Error('Invalid selected inventory slot.');
      if (!Array.isArray(value.itemCooldowns) || value.itemCooldowns.length !== 5 || value.itemCooldowns.some(time => !Number.isInteger(time) || time < 0 || time > 2001)) throw new Error('Invalid item cooldowns.');
      if (!record(value.protection) || !Number.isInteger(value.protection.counter) || Number(value.protection.counter) < -99 || Number(value.protection.counter) > 250 || !finite(value.protection.blueMultiplierAdd) || value.protection.blueMultiplierAdd < -0.2 || value.protection.blueMultiplierAdd > 1.4) throw new Error('Invalid protection effect.');
      const mission = value.activeMission, level = Number(value.day) - 1;
      if (!record(mission) || Object.entries({ level, fixedLv: level, strength: 0, powerOrg: 800 + level * 120, ...(value.version < 15 || value.day === 1 ? { reward: 600 + level * 20 } : {}), spawnRate: Math.max(5, 15 - level / 5), ...(Number(value.version) < 27 || value.day === 1 ? { hpFix: 1, dmgFix: 1, expFix: 1 } : {}), bossDay: level % 10 === 9 }).some(([key, expected]) => mission[key] !== expected) || !Number.isInteger(mission.reward) || (Number(value.version) < 27 ? ![0, 0.01, ...(Number(value.day) >= 5 ? [0.02] : []), ...(Number(value.day) >= 8 ? [0.03] : []), ...(Number(value.day) >= 11 ? [0.04] : [])].includes(Number(mission.absorbFix)) : !finite(mission.absorbFix) || mission.absorbFix < 0 || mission.absorbFix > 0.24) || (value.day === 1 && mission.absorbFix !== 0)) throw new Error('Invalid active mission.');
      if (Number(value.version) >= 27 && ['hpFix', 'dmgFix', 'expFix'].some(key => !finite(mission[key]) || Number(mission[key]) < 1 || Number(mission[key]) > 100)) throw new Error('Invalid mission bonuses.');
      if (!finite(value.resultBefore) || !Number.isInteger(value.perfectDays) || Number(value.perfectDays) < 0 || Number(value.perfectDays) > Number(value.day) || !Number.isInteger(value.bossesSpawned) || Number(value.bossesSpawned) < 0 || Number(value.bossesSpawned) > Number(value.day) * 10) throw new Error('Invalid campaign counters.');
      if (!Array.isArray(value.earnedMedals) || new Set(value.earnedMedals).size !== value.earnedMedals.length || !value.earnedMedals.includes(40) || value.earnedMedals.some(id => ![40, 50, 51, 52, 53, 54, 55, 60, 61, 62, 63, 67, 70, 71, 72, 92, 93].includes(id)) || (value.earnedMedals.includes(62) && (value.version < 14 || Number(value.day) < 7 || Number(value.perfectDays) < 7 || (value.day === 7 && !['victory', 'town'].includes(String(value.phase)))))) throw new Error('Invalid earned medals.');
    }
    if (!Array.isArray(value.waves) || value.waves.length !== generateLowLevelMission(Number(value.day) - 1, Number(value.day), () => 0).wave || value.waves.some(wave => !record(wave) || !Array.isArray(wave.enemies) || wave.enemies.length > 1000 || wave.enemies.some(kind => typeof kind !== 'string' || !Object.hasOwn(ENEMIES, kind)) || !Array.isArray(wave.delays) || wave.delays.length !== wave.enemies.length || wave.delays.some(delay => !finite(delay) || delay < 0 || delay > 1000) || !finite(wave.initialCount) || wave.initialCount < wave.enemies.length)) throw new Error('Invalid wave state.');
    if ((Number(value.version) < 23 || Number(value.day) < 8) && (value.waves as unknown as WaveState[]).some(wave => wave.enemies.includes('lava'))) throw new Error('Lava is unavailable in this saved mission.');
    const enemyNumbers = ['uid', 'x', 'y', 'hp', 'maxHp', 'speed', 'speedOrg', 'attack', 'gold', 'exp', 'knockBack', 'frame', 'deathTicks', 'drop', 'bossAction', 'bossCount', 'bossIdle', 'bossFireNum', 'bossWeapon'];
    if (!Array.isArray(value.enemies) || value.enemies.length > 200 || value.enemies.some(enemy => !record(enemy) || typeof enemy.kind !== 'string' || !Object.hasOwn(ENEMIES, enemy.kind) || enemyNumbers.some(key => !finite(enemy[key])) || Number(enemy.maxHp) <= 0 || Number(enemy.hp) > Number(enemy.maxHp) || ['attacking', 'attacked', 'removed'].some(key => typeof enemy[key] !== 'boolean') || (enemy.shadowHit !== undefined && typeof enemy.shadowHit !== 'boolean'))) throw new Error('Invalid enemies.');
    if (!legacyEquipment && value.enemies.some(enemy => typeof (enemy as Record<string, unknown>).shadowHit !== 'boolean')) throw new Error('Missing enemy shadow history.');
    const ids = value.enemies.map(enemy => (enemy as Record<string, unknown>).uid);
    if (new Set(ids).size !== ids.length || ids.some(id => !Number.isInteger(id) || Number(id) < 1)) throw new Error('Invalid enemy identifiers.');
    let restoredProjectiles: SimulationState['projectiles'];
    if (legacyProjectiles) {
      const grenadeNumbers = ['uid', 'x', 'y', 'startX', 'startY', 'targetX', 'targetY', 'speed', 'remaining'];
      if (!Array.isArray(value.grenades) || value.grenades.length > 5 || value.grenades.some(grenade => !record(grenade) || grenadeNumbers.some(key => !finite(grenade[key])) || Math.abs(Number(grenade.targetX) - Number(grenade.startX)) < 0.001 || Number(grenade.speed) === 0 || !Number.isInteger(grenade.remaining) || Number(grenade.remaining) < 1)) throw new Error('Invalid grenades.');
      if (!legacyEquipment && value.grenades.some(grenade => !record(grenade) || !Number.isInteger(grenade.damage) || Number(grenade.damage) < 0)) throw new Error('Invalid grenade damage.');
      restoredProjectiles = value.grenades.map(raw => {
        const grenade = raw as Record<string, number>;
        const totalCount = int(Math.abs(grenade.targetX - grenade.startX) / Math.abs(grenade.speed)) + 1;
        const age = Math.max(0, totalCount - grenade.remaining);
        let shadowY = -30.2;
        if (age > 0) {
          shadowY = (grenade.targetY - grenade.startY) * (grenade.x - grenade.startX) / (grenade.targetX - grenade.startX);
          if (grenade.targetY < 135) shadowY /= 3;
          shadowY += grenade.startY;
        }
        // Сохраняем старые координаты без повторного запуска; утраченную точность не восстановить.
        return {
          uid: grenade.uid, kind: 'hand-grenade', weaponSlot: null, damage: legacyEquipment ? GRENADE.damage : grenade.damage,
          x: grenade.x, y: grenade.y, startX: grenade.startX, startY: grenade.startY, targetX: grenade.targetX, targetY: grenade.targetY,
          speed: -grenade.speed, count: grenade.remaining, curve: 0.003, penetrations: 0,
          rotation: -4 * age, rotationStep: 0, scale: 1, alpha: 1,
          shadowY, shadowAlpha: 1, shadowVisible: true, verticalProgress: null,
          frame: age, pulseFrame: age + 1, acceleration: 0, direction: grenade.targetX > grenade.startX ? -1 : 1, removed: false,
        };
      });
    } else {
      if (Object.hasOwn(value, 'grenades') || !Array.isArray(value.projectiles) || value.projectiles.length > 1000) throw new Error('Invalid projectile collection.');
      restoredProjectiles = structuredClone(value.projectiles) as SimulationState['projectiles'];
    }
    const projectileNumbers = ['uid', 'damage', 'x', 'y', 'startX', 'startY', 'targetX', 'targetY', 'speed', 'count', 'curve', 'penetrations', 'rotation', 'rotationStep', 'scale', 'alpha', 'shadowY', 'shadowAlpha', 'frame', 'pulseFrame', 'acceleration', 'direction'];
    const projectileKinds = ['hand-grenade', 'grenade', 'rocket', 'bolt', 'arrow', 'gravity', 'flame'];
    for (const actor of restoredProjectiles) {
      if (!record(actor) || !projectileKinds.includes(String(actor.kind)) || projectileNumbers.some(key => !finite(actor[key])) || ['shadowVisible', 'removed'].some(key => typeof actor[key] !== 'boolean') || actor.removed) throw new Error('Invalid projectile state.');
      const bossGrenade = actor.damage === -1 && ['grenade', 'rocket'].includes(actor.kind) && actor.weaponSlot === null && value.version >= 14 && Number(value.day) >= 7;
      if (['uid', 'damage', 'penetrations', 'frame', 'pulseFrame'].some(key => !Number.isInteger(actor[key]) || Number(actor[key]) < (key === 'uid' || key === 'pulseFrame' ? 1 : key === 'damage' && bossGrenade ? -1 : 0)) || !Number.isInteger(actor.count) || actor.pulseFrame > actor.frame + 1 || actor.damage > 1e9) throw new Error('Invalid projectile counters.');
      if (actor.verticalProgress === null ? Math.abs(actor.targetX - actor.startX) < 0.001 : !finite(actor.verticalProgress) || actor.verticalProgress < 0 || actor.targetX !== actor.startX || actor.x !== actor.startX) throw new Error('Invalid vertical projectile path.');
      if (actor.speed === 0 || actor.direction !== (actor.targetX > actor.startX ? -1 : 1) || actor.scale <= 0 || actor.scale > 10 || actor.alpha < -0.125 || actor.alpha > 1 || actor.shadowAlpha < -0.1 || actor.shadowAlpha > 1 || actor.acceleration < 0) throw new Error('Invalid projectile geometry.');
      if (actor.kind === 'hand-grenade' || bossGrenade ? actor.weaponSlot !== null : !Number.isInteger(actor.weaponSlot) || Number(actor.weaponSlot) < 0 || Number(actor.weaponSlot) >= 5) throw new Error('Invalid projectile weapon slot.');
      if ((actor.kind === 'rocket' ? actor.speed <= 0 : Math.sign(actor.speed) !== actor.direction)
        || (actor.kind !== 'rocket' && actor.acceleration !== 0)
        || (!['arrow', 'bolt'].includes(actor.kind) && actor.penetrations !== 0)) throw new Error('Invalid projectile motion.');
      const curve = actor.kind === 'arrow' ? (actor.targetY < 150 ? 0.001 : 0.003) : actor.kind === 'bolt' ? 0.00002 : actor.kind === 'flame' ? -0.003 : ['rocket', 'gravity'].includes(actor.kind) ? 0 : 0.003;
      if (actor.curve !== curve
        || (['hand-grenade', 'grenade'].includes(actor.kind) && actor.count < 1)
        || (actor.kind === 'rocket' && actor.count !== 0)
        || (actor.kind === 'bolt' && actor.count < 0)
        || (actor.kind === 'arrow' && actor.count < -40)
        || (actor.kind === 'gravity' && (actor.count < 1 || actor.count > 15))
        || (actor.kind === 'flame' && (actor.count < 1 || actor.count > 2))) throw new Error('Invalid projectile lifecycle.');
    }
    const allIds = [...ids, ...restoredProjectiles.map(actor => actor.uid)];
    if (Number(value.nextUid) < 1 || new Set(allIds).size !== allIds.length || allIds.some(id => !Number.isInteger(id) || Number(id) < 1 || Number(id) >= Number(value.nextUid))) throw new Error('Invalid next entity identifier.');
    if (!Array.isArray(value.loot) || value.loot.length > 200 || value.loot.some(item => !Number.isInteger(item) || !Object.hasOwn(BASE_ITEM_FIELDS, item > 1000 ? item - 1000 : item)) || !record(value.result) || ['reward', 'perfectBonus', 'upkeep', 'netReward'].some(key => !finite((value.result as Record<string, unknown>)[key]))) throw new Error('Invalid results.');
    const simulation = new Simulation(1, { ...options, deferOpeningWaves: false });
    simulation.state = structuredClone(value) as unknown as SimulationState;
    // В v1–v15 покупок стен не было; неизвестное поле старого формата не становится улучшением.
    if (value.version < 16) simulation.state.wallLevel = 1;
    if (value.version < 17) { simulation.state.wallFixCount = 0; simulation.state.repairmanLevel = 0; }
    if (value.version < 18) simulation.state.sandbagLevel = 0;
    if (value.version < 20) simulation.state.pendingLootAction = null;
    if (value.version < 21) simulation.state.looterLevel = 0;
    if (value.version < 27) simulation.state.economy = createTownEconomy();
    else if (!validTownEconomy(value.economy)) throw new Error('Invalid town economy.');
    if (value.version < 22) simulation.state.trainerLevel = 0;
    if (value.version < 25) simulation.state.player.grenadeCount = 325;
    else if (!Number.isInteger(player.grenadeCount) || Number(player.grenadeCount) < 0 || Number(player.grenadeCount) > 325) throw new Error('Invalid Militia grenade counter.');
    if (value.version < 15) {
      const town = simulation.state.town?.preparation === 'ready' ? simulation.state.town : simulation.state.previousTown;
      simulation.state.party = createPartyState(town?.recruit);
      simulation.state.partySkills = partySkills([{ traits: simulation.state.player.traits ?? createSheriffTraits() }]);
      simulation.state.partyAI = createPartyAIShared(); simulation.state.retainedAITargets = [];
      simulation.state.pendingPartyAction = null; simulation.state.result.wages = 0;
      for (const enemy of simulation.state.enemies) {
        enemy.type = ENEMIES[enemy.kind].airborne ? 1 : 0; enemy.tag = 0; enemy.onMark = false;
        if (enemy.kind === 'boss' && enemy.hp > 0) simulation.state.partyAI.targetBossUid = enemy.uid;
      }
    }
    // До v13 титулы и налог ещё недоступны: миграция не меняет уже оплаченные итоги.
    if (value.version < 13) {
      simulation.state.title = 0;
      simulation.state.result.tax = 0;
      simulation.state.result.salary = 0;
    }
    if (![0, 1].includes(simulation.state.title) || (simulation.state.title === 1 && (simulation.state.day < 6 || (simulation.state.day === 6 && simulation.state.phase !== 'town')))) throw new Error('Invalid title.');
    if (['tax', 'salary'].some(key => !finite((simulation.state.result as unknown as Record<string, unknown>)[key]) || Number((simulation.state.result as unknown as Record<string, unknown>)[key]) < 0)) throw new Error('Invalid result income or tax.');
    simulation.state.projectiles = restoredProjectiles;
    if (value.version < 10) simulation.state.enemyArrows = [];
    const arrows = simulation.state.enemyArrows;
    if (!Array.isArray(arrows) || arrows.length > 200 || arrows.some(arrow => !record(arrow)
      || ['uid', 'x', 'dx', 'dy', 'sy', 'y', 'rotation', 'shadowY', 'age'].some(key => !finite(arrow[key]))
      || !Number.isInteger(arrow.uid) || arrow.uid < 1 || arrow.uid >= Number(value.nextUid)
      || !Number.isInteger(arrow.age) || arrow.age < 0 || arrow.age > 100 || arrow.removed !== false
      || arrow.x < -100 || arrow.x > 650 || Math.abs(arrow.y) > 2000 || Math.abs(arrow.dx) > 100 || Math.abs(arrow.dy) > 2000 || Math.abs(arrow.sy) > 1000)) throw new Error('Invalid enemy arrow state.');
    const actorIds = [...simulation.state.enemies, ...restoredProjectiles, ...arrows].map(actor => actor.uid);
    if (new Set(actorIds).size !== actorIds.length) throw new Error('Duplicate actor identity.');
    if (value.version < 9) {
      // Старые версии не открывали эти диалоги: новый пустой слот не расходует RNG.
      simulation.state.upgradeReference = null;
      simulation.state.pendingTownAction = null;
    }
    if (legacyProjectiles) {
      simulation.state.player.bowDrawing = false;
      delete (simulation.state as unknown as Record<string, unknown>).grenades;
    }
    if (value.version < 5) {
      // До v5 продаж не было: только уже завершённый расчёт v4 мог увеличить totalMoney.
      simulation.state.totalMoney = value.version === 4 && (value.phase === 'town' || (value.phase === 'victory' && value.postbattle === 'result')) ? simulation.state.result.reward + simulation.state.result.perfectBonus : 0;
    }
    if (!finite(simulation.state.totalMoney) || simulation.state.totalMoney < 0) throw new Error('Invalid earned money.');
    if (value.version < 4) {
      simulation.state.town = null;
      // v1–v3 начисляли итог сразу после боя. Отменяем аванс до единственного нового расчёта.
      if (simulation.state.phase === 'victory') simulation.state.gold -= simulation.state.result.netReward;
    }
    // Старый формат не сохранял историю тени; восстанавливаем прежнюю геометрию без новых случайных чисел.
    for (const enemy of simulation.state.enemies) {
      if (enemy.kind === 'archer' && (Number(value.version) < 10 || !Number.isInteger(enemy.rangedCounter) || enemy.rangedCounter! < 0 || enemy.rangedCounter! > 120 || !Number.isInteger(enemy.frame) || enemy.frame < 1 || enemy.frame > 125)) throw new Error('Invalid archer state.');
      if (enemy.kind === 'fly' && (Number(value.version) < 12 || !Number.isInteger(enemy.flyCounter) || enemy.flyCounter! < 0 || enemy.flyCounter! > 1e9 || !Number.isInteger(enemy.frame) || enemy.frame < 1 || (enemy.frame > 41 && enemy.frame !== 126))) throw new Error('Invalid Fly state.');
      if (enemy.kind === 'barbarian' && (Number(value.version) < 13 || ![0, 100].includes(enemy.rampage!) || !Number.isInteger(enemy.rageEffectFrame) || enemy.rageEffectFrame! < 0 || enemy.rageEffectFrame! > 12 || (enemy.rampage === 0 && enemy.rageEffectFrame !== 0) || !Number.isInteger(enemy.frame) || enemy.frame < 1 || (enemy.frame > 119 && enemy.frame !== 252))) throw new Error('Invalid Barbarian state.');
      if ((enemy.kind === 'barbarian' || enemy.kind === 'lava') && (!Array.isArray(enemy.hitEffects) || enemy.hitEffects.length > 2000 || enemy.hitEffects.some(effect => !record(effect) || !Number.isInteger(effect.frame) || !((effect.frame >= 50 && effect.frame <= 62) || (effect.frame >= 70 && effect.frame <= 75)) || !finite(effect.x) || !finite(effect.y)))) throw new Error('Invalid enemy hit effects.');
      if (enemy.kind === 'lava' && (Number(value.version) < 23 || Number(value.day) < 8 || typeof enemy.alerted !== 'boolean' || !Number.isInteger(enemy.frame) || enemy.frame < 1 || (enemy.frame > 128 && enemy.frame !== 223))) throw new Error('Invalid Lava state.');
      if (enemy.kind === 'sister-bomb' && (!record(enemy.bomb) || ['startX', 'startY', 'targetX', 'targetY', 'curve', 'counter', 'rotation'].some(key => !finite((enemy.bomb as unknown as Record<string, unknown>)[key])) || !Number.isInteger(enemy.bomb.counter) || enemy.bomb.targetX === enemy.bomb.startX)) throw new Error('Invalid sister bomb.');
      if (ENEMY_TIMELINES[enemy.kind] && (!Number.isInteger(enemy.behaviorCounter) || ![-1, 1].includes(enemy.direction!) || !Number.isInteger(enemy.frame) || enemy.frame < 1 || enemy.frame > ENEMY_TIMELINES[enemy.kind].count)) throw new Error('Invalid campaign enemy behavior.');
      if (enemy.fallTargetY !== undefined && (!finite(enemy.fallTargetY) || enemy.fallTargetY < WORLD.groundLine || enemy.fallTargetY > WORLD.groundLine + WORLD.groundWidth)) throw new Error('Invalid dropped rat.');
      if (enemy.kind === 'boss') {
        if (enemy.rampage !== undefined && ![0, 100].includes(enemy.rampage) || enemy.bossSpecial !== undefined && !['grenade', 'rocket'].includes(enemy.bossSpecial)) throw new Error('Invalid later boss state.');
        if (value.version < 11) {
          enemy.bossFacing = -1;
          // Старый порт ходил по кадрам 200–219; исходный цикл 200–211 не должен перейти в щит.
          if (enemy.bossAction === 2 && enemy.frame >= 212 && enemy.frame <= 219) enemy.frame = 200 + (enemy.frame - 200) % 12;
        }
        if (enemy.bossFacing !== 1 && enemy.bossFacing !== -1) throw new Error('Invalid boss facing.');
        if (![-1, 1, 2, 3, 4, 5, 6].includes(enemy.bossAction) || (enemy.bossAction === 6 && Number(value.day) < 4) || (enemy.bossAction === 5 && Number(value.day) < 7)) throw new Error('Invalid boss action.');
        if (!Number.isInteger(enemy.frame) || enemy.frame < 1 || enemy.frame > 403) throw new Error('Invalid boss frame.');
      }
      enemy.shadowHit ??= shadowHitAtFrame(enemy.kind, enemy.frame);
      if (value.version < 6) { enemy.bossDamage = 0; enemy.disarmed = 0; }
      if (legacyEquipment) enemy.appearance = enemy.kind === 'boss' ? 51 : 0;
      if (!Number.isInteger(enemy.appearance) || (enemy.kind === 'boss' ? enemy.appearance < 51 || enemy.appearance > (Number(value.version) < 26 ? 50 + Number(value.day) : 65) : enemy.appearance !== 0)) throw new Error('Invalid enemy appearance.');
      if (!finite(enemy.bossDamage) || enemy.bossDamage < 0 || !finite(enemy.disarmed) || enemy.disarmed < 0) throw new Error('Invalid boss damage accumulator.');
    }
    if (Number(value.version) < 3) {
      const state = simulation.state;
      state.player.traits = { ...createSheriffTraits(), [TRAIT.SHERIFF]: state.player.level };
      state.skillChoices = [];
      state.traitsProvenance = 'legacy-reconstructed';
      state.bossKilledProvenance = 'legacy-inferred';
      const boss = state.enemies.find(enemy => enemy.kind === 'boss');
      const bossQueued = state.waves[state.bossWave].enemies.includes('boss');
      state.bossKilled = boss ? Number(boss.hp <= 0) : Number(!bossQueued && state.waveIndex <= state.bossWave);
    }
    if (value.version === 1) {
      // Старые сохранения не содержат метаданных предметов; отдельный поток не меняет бой.
      let reconstructionRng = Number(value.rng);
      const reconstructionRandom = () => {
        reconstructionRng ^= reconstructionRng << 13;
        reconstructionRng ^= reconstructionRng >>> 17;
        reconstructionRng ^= reconstructionRng << 5;
        reconstructionRng >>>= 0;
        return reconstructionRng / 4294967296;
      };
      simulation.state.version = SAVE_VERSION;
      simulation.state.inventory = createStartingInventory(reconstructionRandom);
      simulation.state.lootOffers = Array(8).fill(null);
      simulation.state.postbattle = 'none';
      simulation.state.inventoryProvenance = 'legacy-v1-reconstructed';
      simulation.state.legacyReconstructionSeed = Number(value.rng);
      simulation.state.inventory[0]!.ammo = Number(player.ammo);
      simulation.state.inventory[0]!.reloadTime = Number(player.reloadTicks);
      simulation.state.inventory[1]!.ammo = Number(player.grenades);
      simulation.prepareOrdinaryLoot(reconstructionRandom);
    }
    const state = simulation.state;
    if (!Array.isArray(state.inventory) || (state.inventory.length < 6 || state.inventory.length > 16 || value.version < 19 && state.inventory.length !== 6) || Array.from(state.inventory).some(item => item !== null && !validItem(item)) || !Array.isArray(state.lootOffers) || state.lootOffers.length !== 8 || Array.from(state.lootOffers).some(item => item !== null && !validItem(item))) throw new Error('Invalid inventory items.');
    if (!['none', 'loot', 'boss-loot', 'skill', 'result'].includes(state.postbattle) || (state.phase === 'victory' ? state.postbattle === 'none' : state.phase === 'town' ? state.postbattle !== 'result' : state.postbattle !== 'none') || (!['loot', 'boss-loot'].includes(state.postbattle) && state.lootOffers.some(isOccupiedItem))) throw new Error('Invalid postbattle stage.');
    if (value.version === 2 && !['none', 'loot', 'result'].includes(state.postbattle)) throw new Error('Invalid legacy postbattle stage.');
    if (legacyEquipment) {
      if (['battle', 'defeat'].includes(state.phase) && (!isOccupiedItem(state.inventory[0]) || !isOccupiedItem(state.inventory[1]) || state.inventory[0].id !== SHOTGUN.id || state.inventory[0].ammo !== player.ammo || state.inventory[0].reloadTime !== player.reloadTicks || state.inventory[1].id !== GRENADE.id || state.inventory[1].ammo !== player.grenades)) throw new Error('Inventory does not match legacy active equipment.');
      state.player.selectedSlot = 0;
      state.player.weaponExp = [0, 0, 0, Number(player.weaponExp), 0];
      state.itemCooldowns = [0, Number(player.grenadeCooldown), 0, 0, 0];
      state.protection = { counter: 0, blueMultiplierAdd: 0 };
      // Эти счётчики выводятся из единственного доступного в старом формате первого дня.
      state.activeMission = { level: 0, fixedLv: 0, strength: 0, powerOrg: 800, reward: 600, spawnRate: 15, hpFix: 1, dmgFix: 1, expFix: 1, absorbFix: 0, bossDay: false };
      state.previousTown = null; state.resultBefore = STARTING_CLASS.money;
      state.bossesSpawned = Number(state.enemies.some(enemy => enemy.kind === 'boss') || !state.waves[state.bossWave].enemies.includes('boss'));
      state.perfectDays = Number((state.phase === 'victory' || state.phase === 'town') && state.noDamage);
      state.earnedMedals = [40, ...(state.perfectDays > 0 ? [60] : [])];
      [10, 30, 50].forEach((count, index) => { if (state.criticalKills >= count) state.earnedMedals.push(70 + index); });
      if ((state.phase === 'victory' || state.phase === 'town') && state.player.level >= 10) state.earnedMedals.push(67);
      if (state.town?.preparation === 'ready') state.town.mission.absorbFix = simulation.medalAbsorption();
      // Эти копии были единственным источником v1 и дублировали предметы v2–v6.
      for (const field of ['ammo', 'reloadTicks', 'grenades', 'grenadeCooldown']) delete (state.player as unknown as Record<string, unknown>)[field];
      if (['battle', 'defeat'].includes(state.phase) && state.inventory[1]?.ammo === 0) state.inventory[1].num = 0;
    }
    if (state.inventoryProvenance === 'legacy-v1-reconstructed') {
      if (!Number.isInteger(state.legacyReconstructionSeed) || state.legacyReconstructionSeed! < 1 || state.legacyReconstructionSeed! > 0xffffffff) throw new Error('Invalid legacy inventory provenance.');
    } else if (state.inventoryProvenance !== 'original-generation' || state.legacyReconstructionSeed !== undefined) throw new Error('Invalid inventory provenance.');
    if (state.day > 1) {
      if (!record(state.previousTown) || state.previousTown.preparation !== 'ready' || !Number.isInteger(state.previousTown.ap) || state.previousTown.ap < 0 || state.previousTown.ap > (value.version < 15 ? 4 : 14) || !validTownPreparation(state.previousTown, validItem, state.day - 1, state.activeMission.absorbFix) || ['reward', 'hpFix', 'dmgFix', 'expFix', 'absorbFix'].some(key => state.activeMission[key as keyof ActiveMission] !== state.previousTown!.mission[key as keyof LowLevelMission])) throw new Error('Invalid previous town.');
    } else if (state.previousTown !== null) throw new Error('Unexpected previous town.');
    if (Number(value.version) < 3) {
      state.version = SAVE_VERSION;
      if (state.phase === 'victory' && state.postbattle === 'result') {
        // Старый результат пропускал награды босса и навыки; новые награды расходуют основной поток.
        state.postbattle = 'loot';
        simulation.finishLoot();
      }
    }
    if (!Number.isInteger(state.bossKilled) || state.bossKilled < 0 || state.bossKilled > (state.activeMission.bossDay ? 1 + int(Math.sqrt(state.activeMission.level)) : 1) || !['observed', 'legacy-inferred'].includes(state.bossKilledProvenance) || !['known-starting-traits', 'legacy-reconstructed'].includes(state.traitsProvenance)) throw new Error('Invalid progression provenance.');
    if (value.version < 6) {
      // Утраченные потенциалы нельзя восстановить; отдельный поток сохраняет боевой RNG и вещи.
      const reconstructed = reconstructSheriffHero(state.player.level, state.rng);
      state.hero = reconstructed.hero;
      state.player.traits[TRAIT.BASE_AIMING] ??= reconstructed.baseAiming;
      state.player.traits[TRAIT.BASE_TEAMWORK] ??= reconstructed.baseTeamwork;
    }
    if (!isKnownHeroInitialization(state.hero) || ![TRAIT.BASE_AIMING, TRAIT.BASE_TEAMWORK].every(id => Number.isInteger(state.player.traits[id]) && state.player.traits[id] >= 1)) throw new Error('Invalid hero initialization.');
    if (!record(state.player.traits) || Object.entries(state.player.traits).some(([id, level]) => !Object.hasOwn(ALL_TRAITS, id) || !Number.isInteger(level) || level < 0 || level > ALL_TRAITS[Number(id)].maxLevel) || state.player.traits[HERO_CLASSES[state.player.classId].id] !== state.player.level || Object.entries(HERO_CLASSES[state.player.classId].traits).some(([id, level]) => (state.player.traits[Number(id)] ?? 0) < level) || Object.keys(state.player.traits).some(id => Number(id) < 100 && Number(id) !== HERO_CLASSES[state.player.classId].id && state.player.traits[Number(id)] > 0)) throw new Error('Invalid hero traits.');
    // Пустой список не даёт исходному listTrait2 ни одного допустимого навыка даже до fallback.
    if (state.phase === 'victory' && state.player.skillPoints > 0 && availableHeroTraits(state.player.classId, state.player.level, state.player.traits).length === 0) throw new Error('Pending skill points have no available hero skill.');
    if (!Array.isArray(state.skillChoices) || state.skillChoices.length > 5 || state.skillChoices.some(id => !Number.isInteger(id) || !CLASS_CHOICE_ORDER[HERO_CLASSES[state.player.classId].id].includes(id)) || new Set(state.skillChoices).size !== state.skillChoices.length) throw new Error('Invalid skill choices.');
    if (state.postbattle === 'skill') {
      const available = availableHeroTraits(state.player.classId, state.player.level, state.player.traits);
      if (state.player.skillPoints < 1 || state.skillChoices.length !== 3 + (state.player.traits[TRAIT.CAPABLE] ?? 0) || state.skillChoices.some(id => !available.includes(id)) || state.lootOffers.some(isOccupiedItem)) throw new Error('Invalid pending skill selection.');
    } else if (state.skillChoices.length !== 0) throw new Error('Unexpected pending skill choices.');
    if ((state.postbattle === 'boss-loot' && state.bossKilled === 0) || (state.postbattle === 'result' && state.player.skillPoints !== 0)) throw new Error('Invalid completed rewards.');
    if (value.version < 4) {
      if (state.phase === 'victory' && state.postbattle === 'result') simulation.prepareResult();
    }
    if (state.phase === 'town' || (state.phase === 'victory' && state.postbattle === 'result')) {
      const town = state.town as unknown;
      if (!record(town) || !Number.isInteger(town.ap) || Number(town.ap) < 0 || Number(town.ap) > (value.version < 15 ? 4 : 14) || (state.phase === 'victory' && (Number(town.ap) < 4 || town.preparation !== 'pending')) || state.castleHp <= 0) throw new Error('Invalid first-town state.');
      if (town.preparation === 'ready') {
        if (value.version < 5 || state.phase !== 'town' || !validTownPreparation(town, validItem, state.day, simulation.medalAbsorption(), 'base') || state.lootOffers.some(item => item !== null)) throw new Error('Invalid prepared town.');
      } else if (town.preparation !== 'pending' || (value.version >= 5 && state.phase === 'town')) throw new Error('Missing town preparation.');
    } else if (state.town !== null) throw new Error('Town preparation precedes completed rewards.');
    // После боя исходные слоты могут быть переставлены; замороженные снаряды не возобновляются.
    if (value.version === 15) repairEarlyV15AirTargets(state);
    validatePartySave(state, validItem);
    if (!Number.isInteger(state.result.wages) || state.result.wages < 0) throw new Error('Invalid settled wages.');
    // enchant сохраняет старый таймер при заполнении патронов и уменьшении максимума; Rest обнуляет его.
    if (state.phase === 'battle' && state.inventory.some(item => isOccupiedItem(item) && item.type === ITEM_TYPE.gun && (item.reloadTime > item.reloadTimeMax + 1 || item.ammo === item.ammoMax && item.reloadTime !== 0))) throw new Error('Invalid battle weapon reload state.');
    const drawnBow = state.inventory[state.player.selectedSlot];
    if (state.player.bowDrawing && (state.phase !== 'battle' || !isOccupiedItem(drawnBow) || ![24, 25].includes(drawnBow.id))) throw new Error('Invalid bow draw selection.');
    if (state.upgradeReference !== null && (!validItem(state.upgradeReference) || !isOccupiedItem(state.upgradeReference) || state.upgradeReference.type !== ITEM_TYPE.gun)) throw new Error('Invalid upgrade reference.');
    const lootPending = state.pendingLootAction;
    if (lootPending !== null) {
      if (!record(lootPending) || lootPending.kind !== 'mod' || state.phase !== 'victory' || !['loot', 'boss-loot'].includes(state.postbattle)
        || state.pendingTownAction !== null || state.pendingPartyAction !== null || !simulation.validLootAddress(lootPending.mod) || !simulation.validLootAddress(lootPending.gun)
        || (lootPending.mod.area === lootPending.gun.area && lootPending.mod.index === lootPending.gun.index)) throw new Error('Invalid pending loot mod action.');
      const source = (lootPending.mod.area === 'offers' ? state.lootOffers : state.inventory)[lootPending.mod.index];
      const target = (lootPending.gun.area === 'offers' ? state.lootOffers : state.inventory)[lootPending.gun.index];
      // Несовместимость оружия допускается до Yes, но типы и занятость концов должны сохраниться.
      if (!isOccupiedItem(source) || source.type !== ITEM_TYPE.mod || !isOccupiedItem(target) || target.type !== ITEM_TYPE.gun) throw new Error('Invalid pending loot mod items.');
    }
    const pending = state.pendingTownAction;
    if (pending !== null) {
      if (!record(pending) || state.phase !== 'town' || state.town?.preparation !== 'ready') throw new Error('Invalid pending town equipment action.');
      const ownedSlot = (slot: unknown): slot is number => Number.isInteger(slot) && Number(slot) >= 0 && Number(slot) < state.inventory.length;
      if (pending.kind === 'upgrade') {
        if (!ownedSlot(pending.slot) || state.town.ap < 4) throw new Error('Invalid pending weapon upgrade.');
        const source = state.inventory[pending.slot], reference = state.upgradeReference;
        if (!isOccupiedItem(source) || source.type !== ITEM_TYPE.gun || !reference || reference.id !== source.id || reference.lv !== source.lv + 1 || reference.modMax !== source.modMax || !Number.isInteger(pending.cost) || pending.cost !== int(source.value * 1.2) + 500) throw new Error('Invalid pending upgrade preview.');
      } else if (pending.kind === 'mod') {
        if (!ownedSlot(pending.modSlot) || !ownedSlot(pending.gunSlot) || pending.modSlot === pending.gunSlot) throw new Error('Invalid pending mod slots.');
        const mod = state.inventory[pending.modSlot], gun = state.inventory[pending.gunSlot];
        // Совместимость проверяется при подтверждении, поэтому ошибочный монтаж тоже сохраняем.
        if (!isOccupiedItem(mod) || mod.type !== ITEM_TYPE.mod || !isOccupiedItem(gun) || gun.type !== ITEM_TYPE.gun) throw new Error('Invalid pending mod items.');
      } else throw new Error('Unknown pending town equipment action.');
    }
    state.version = SAVE_VERSION;
    // Уже оплаченный результат v4 не пересчитывается; недостающая первая лавка создаётся один раз.
    if (state.phase === 'town' && state.town?.preparation === 'pending') simulation.prepareTown();
    return simulation;
  }
}
