import { ENEMIES, FIRST_DAY, GRENADE, SHOTGUN, SIMULATION_HZ, STARTING_CLASS, TIMER_HZ, WORLD, type EnemyKind, type Rect } from './content.ts';
import { generateLowLevelMission, generateLowLevelWaves, type LowLevelMission } from './missions.ts';
import { generateSheriffHero, isKnownHeroInitialization, levelUpHero, reconstructSheriffHero, type KnownHeroInitialization } from './hero.ts';
import { advanceReload, autoReloadReady, COMBAT_TRAIT, combatTrait, criticalType, hitscanHit, livingWeaponKill, rampageDuration, recoverAccuracy, reloadTimer, shotDamage, shotSpread, weaponBehavior, weaponHitDamage, weaponHitEffects, weaponStats } from './combat-stats.ts';
import { BASE_ITEM_FIELDS, ITEM_TYPE, ItemFactory, collectLoot as collectLootItem, createStartingInventory, isOccupiedItem, itemPrice, swapInventorySlots, type Item } from './items.ts';
import { prepareEarlyTown, type FirstTownPreparation } from './town-preparation.ts';
import { validTownPreparation } from './town-save.ts';
import { TRAIT, SHERIFF_TRAITS, SHERIFF_CHOICE_ORDER, applySheriffChoice, availableSheriffTraits, createSheriffTraits, rollSheriffChoices, type TraitLevels } from './progression.ts';
import { shadowHitAtFrame } from './collision.ts';
import { advanceProtection, explosionContains, explosionStats, planConsumableUse } from './consumables.ts';
import { advanceProjectile, createProjectile, type ExplosionKind, type ProjectileState } from './projectiles.ts';
import { createUpgradePreview, modMountFailure, upgradeCost, type TownEquipmentAction, type TownEquipmentOutcome } from './equipment.ts';
import { advanceEnemyArrow, createEnemyArrow, type EnemyArrowState } from './enemy-arrows.ts';
import { ARCHER_DISPLAY_WIDTHS } from './enemy-display-bounds.ts';

export interface EnemyState {
  uid: number; kind: EnemyKind; x: number; y: number; hp: number; maxHp: number;
  speed: number; speedOrg: number; attack: number; gold: number; exp: number;
  knockBack: number; disarmed: number; attacking: boolean; attacked: boolean; frame: number; shadowHit: boolean;
  deathTicks: number; drop: number; removed: boolean;
  bossAction: number; bossCount: number; bossIdle: number; bossFireNum: number; bossWeapon: number; bossDamage: number; appearance: number;
  rangedCounter?: number;
}
export interface WaveState { enemies: EnemyKind[]; delays: number[]; initialCount: number }
export type ActiveMission = Pick<LowLevelMission, 'level' | 'fixedLv' | 'strength' | 'powerOrg' | 'reward' | 'spawnRate' | 'hpFix' | 'dmgFix' | 'expFix' | 'absorbFix' | 'bossDay'>;
export type ReadyTown = FirstTownPreparation & { ap: number; preparation: 'ready' };
export interface SimulationState {
  version: 10; phase: 'battle' | 'victory' | 'defeat' | 'town'; day: 1 | 2 | 3; tick: number; timerRemainder: number; rng: number; nextUid: number;
  activeMission: ActiveMission; resultBefore: number; earnedMedals: number[]; perfectDays: number; bossesSpawned: number;
  hero: KnownHeroInitialization;
  castleHp: number; castleMaxHp: number; gold: number; totalMoney: number; kills: number; criticalKills: number;
  aimX: number; aimY: number; fireHeld: boolean; pendingShot: boolean;
  player: { classId: 'sheriff'; level: number; exp: number; skillPoints: number; traits: TraitLevels; weaponExp: number[]; selectedSlot: number; shootTimer: number; accuracyFix: number; rampageTicks: number; bowDrawing: boolean };
  waveIndex: number; waves: WaveState[]; bossWave: number; newWave: boolean; spawnTimer: number; noDamage: boolean;
  enemies: EnemyState[]; projectiles: ProjectileState[]; enemyArrows: EnemyArrowState[]; loot: number[];
  itemCooldowns: number[];
  protection: { counter: number; blueMultiplierAdd: number };
  inventory: (Item | null)[]; lootOffers: (Item | null)[]; postbattle: 'none' | 'loot' | 'boss-loot' | 'skill' | 'result';
  inventoryProvenance: 'original-generation' | 'legacy-v1-reconstructed'; legacyReconstructionSeed?: number;
  bossKilled: number; skillChoices: number[]; traitsProvenance: 'known-starting-traits' | 'legacy-reconstructed'; bossKilledProvenance: 'observed' | 'legacy-inferred';
  result: { reward: number; perfectBonus: number; upkeep: number; netReward: number };
  town: null | { ap: number; preparation: 'pending' } | ReadyTown;
  previousTown: ReadyTown | null;
  upgradeReference: Item | null;
  pendingTownAction: TownEquipmentAction | null;
}
export interface Input { aimX?: number; aimY?: number; firePressed?: boolean; fireHeld?: boolean; fireReleased?: boolean; reload?: boolean; slot?: number }
export interface SimulationEvent { type: 'enemy-arrow' | 'shot' | 'bow-draw' | 'hit' | 'kill' | 'castle-hit' | 'reload' | 'reloaded' | 'grenade' | 'explosion' | 'pulse' | 'wave' | 'victory' | 'defeat' | 'rampage' | 'level-up' | 'gold' | 'select' | 'beep' | 'repair' | 'protection' | 'defend'; x?: number; y?: number; amount?: number; weaponId?: number; automaticReload?: boolean; message?: string; critical?: boolean; criticalType?: number; enemyUid?: number; goodShotIndex?: number; pellets?: { x: number; y: number }[]; explosionKind?: ExplosionKind; scale?: number }
export interface SimulationOptions { hitTest?: (enemy: Readonly<EnemyState>, x: number, y: number) => boolean; deferOpeningWaves?: boolean }
export type LootArea = 'offers' | 'inventory';
export type RepairOutcome = 'repaired' | 'not-damaged' | 'not-enough-ap' | 'unavailable';
export type PurchaseOutcome = 'purchased' | 'occupied' | 'not-enough-gold' | 'unavailable';

function inside(rect: Rect, x: number, y: number): boolean { return x > rect[0] && x < rect[1] && y > rect[2] && y < rect[3]; }
function int(value: number): number { return Math.trunc(value); }
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
    const generated = generateSheriffHero(random);
    this.state = {
      version: 10, phase: 'battle', day: 1, tick: 0, timerRemainder: 0, rng: initialRng, nextUid: 1, hero: generated.hero,
      activeMission: this.missionParameters(this.pendingOpeningMission), resultBefore: STARTING_CLASS.money, earnedMedals: [40], perfectDays: 0, bossesSpawned: 0,
      castleHp: FIRST_DAY.castleHp, castleMaxHp: FIRST_DAY.castleHp, gold: STARTING_CLASS.money, totalMoney: 0, kills: 0, criticalKills: 0,
      aimX: 300, aimY: 240, fireHeld: false, pendingShot: false,
      player: { classId: 'sheriff', level: 1, exp: 0, skillPoints: 0, traits: generated.traits, weaponExp: [0, 0, 0, 0, 0], selectedSlot: 0, shootTimer: 0, accuracyFix: 0, rampageTicks: 0, bowDrawing: false },
      waveIndex: FIRST_DAY.waves, waves: [], bossWave: 2, newWave: true, spawnTimer: 30, noDamage: true,
      enemies: [], projectiles: [], enemyArrows: [], loot: [], result: { reward: 0, perfectBonus: 0, upkeep: 0, netReward: 0 },
      itemCooldowns: Array(5).fill(0), protection: { counter: 0, blueMultiplierAdd: 0 }, inventory: generated.inventory, lootOffers: Array(8).fill(null), postbattle: 'none', inventoryProvenance: 'original-generation',
      bossKilled: 0, skillChoices: [], traitsProvenance: 'known-starting-traits', bossKilledProvenance: 'observed',
      town: null, previousTown: null, upgradeReference: null, pendingTownAction: null,
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

  useSlot(slot: number): boolean {
    if (this.state.phase !== 'battle' || this.pendingOpeningMission || !Number.isInteger(slot) || slot < 0 || slot >= 5) return false;
    const item = this.state.inventory[slot];
    if (!isOccupiedItem(item)) { this.events.push({ type: 'beep' }); return false; }
    if (item.type === ITEM_TYPE.use) {
      if (item.id === 11) return this.throwGrenade(this.state.aimX, this.state.aimY, slot);
      const plan = planConsumableUse(item, { castleHp: this.state.castleHp, castleMaxHp: this.state.castleMaxHp, slotCooling: this.state.itemCooldowns[slot] > 0 });
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

  rerollOpeningHero(): boolean {
    if (!this.pendingOpeningMission) return false;
    const generated = generateSheriffHero(() => this.random(), this.state.inventory);
    this.state.hero = generated.hero;
    Object.assign(this.state.player, { level: generated.level, exp: generated.exp, skillPoints: generated.skillPoints, traits: generated.traits });
    this.state.inventory = generated.inventory;
    return true;
  }

  startOpeningBattle(): boolean {
    if (!this.pendingOpeningMission) return false;
    this.applyOpeningMission(this.pendingOpeningMission);
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
    if (this.state.phase !== 'town' || this.state.pendingTownAction || this.state.day >= 3 || town?.preparation !== 'ready' || town.mission.level !== this.state.day) return false;
    const state = this.state;
    state.day = (state.day + 1) as 2 | 3;
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
    state.result = { reward: 0, perfectBonus: 0, upkeep: 0, netReward: 0 };
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
    for (const enemy of this.state.enemies) this.tickEnemy(enemy);
    this.tickProjectiles(projectileUidLimit);
    for (const arrow of this.state.enemyArrows) if (arrow.uid < projectileUidLimit) advanceEnemyArrow(arrow);
    this.state.enemyArrows = this.state.enemyArrows.filter(arrow => !arrow.removed);
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
    const player = this.state.player;
    if (player.shootTimer > 0) return false;
    const item = this.weapon;
    if (!item) {
      this.state.pendingShot = false;
      this.events.push({ type: 'beep', message: 'You need a gun to shoot!' });
      return false;
    }
    const stats = weaponStats(item, player.traits);
    if (!stats.canFire) {
      this.state.pendingShot = false;
      this.events.push({ type: 'beep', message: "You don't have the required weapon skill!" });
      return false;
    }
    if (item.reloadTime > 0 && !item.autoReload) {
      if (item.manualReload) { item.reloadTime = 0; this.events.push({ type: 'reloaded', weaponId: item.id }); }
      return false;
    }
    if (item.ammo <= 0) { this.state.pendingShot = false; this.requestReload(false); return false; }
    const spread = shotSpread(item, player.traits, player.accuracyFix);
    player.shootTimer = stats.shootTimer;
    const behavior = weaponBehavior(item);
    if (behavior.bowDraw) {
      this.state.pendingShot = false;
      if (!player.bowDrawing) {
        player.shootTimer = 0; player.bowDrawing = true; player.accuracyFix += stats.recoil;
        this.events.push({ type: 'bow-draw', weaponId: item.id });
        return true;
      }
      player.bowDrawing = false;
    } else player.accuracyFix += stats.recoil;
    if (stats.consumesAmmo) item.ammo--;
    let damage = shotDamage(item, player.traits, { missionDamage: this.state.activeMission.dmgFix, rampage: player.rampageTicks > 0 });
    if (behavior.projectile) {
      const hitX = int(x + this.random() * spread - this.random() * spread);
      const hitY = int(y + this.random() * spread - this.random() * spread);
      const launch = (startOffset = 0, targetOffset = 0) => this.state.projectiles.push(createProjectile({
        uid: this.state.nextUid++, kind: behavior.projectile!, weaponSlot: player.selectedSlot, damage,
        startX: WORLD.playerX + startOffset, startY: WORLD.playerY, targetX: hitX + targetOffset, targetY: hitY,
        speedBase: behavior.speedBase, penetrations: (player.traits[COMBAT_TRAIT.BOW_MASTER] ?? 0) + behavior.extraPenetrations,
        scale: ['gravity', 'flame'].includes(behavior.projectile!) ? (100 + combatTrait(COMBAT_TRAIT.DA_BOMB, player.traits)) / 100 : 1,
      }));
      if (item.id === 25) { launch(5, 20); launch(); launch(-5, -20); } else launch();
      this.events.push({ type: 'shot', weaponId: item.id, x: WORLD.playerX, y: WORLD.playerY });
      if (behavior.immediateReload) {
        item.reloadTime = stats.reloadTime;
        this.events.push({ type: 'reload', weaponId: item.id, automaticReload: item.autoReload > 0 });
      }
      return true;
    }
    const pellets: { x: number; y: number }[] = [];
    for (let i = 0; i < stats.shells; i++) {
      const hitX = int(x + this.random() * spread - this.random() * spread);
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
        this.damageEnemy(enemy, damage, hit.critical, this.state.player.selectedSlot, hitX, hitY);
      }
    }
    this.events.push({ type: 'shot', weaponId: item.id, x: WORLD.playerX, y: WORLD.playerY, pellets });
    return true;
  }

  private processPellet(x: number, y: number, damage: number, weaponSlot = this.state.player.selectedSlot): boolean {
    let hitLivingEnemy = false;
    for (const enemy of this.state.enemies) {
      if (enemy.removed) continue;
      const hit = this.hitEnemy(enemy, x, y);
      if (!hit) continue;
      // Исходный procHit проверяет SENSE даже у начального шерифа с нулевым навыком.
      const critical = criticalType(this.state.player.traits, this.random(), inside(ENEMIES[enemy.kind].critical, x - enemy.x, y - enemy.y), enemy.hp > 0);
      if (enemy.hp > 0) hitLivingEnemy = true;
      enemy.knockBack = combatTrait(TRAIT.SHERIFF, this.state.player.traits);
      this.damageEnemy(enemy, damage, critical, weaponSlot, int(x), int(y));
    }
    return hitLivingEnemy;
  }

  private hitEnemy(enemy: EnemyState, x: number, y: number): boolean {
    return this.options.hitTest?.(enemy, x, y) ?? inside(ENEMIES[enemy.kind].body, x - enemy.x, y - enemy.y);
  }

  requestReload(manual = true): boolean {
    const item = this.weapon;
    if (this.state.phase !== 'battle' || !item || this.state.player.shootTimer > 0 || item.reloadTime > 0 || item.ammo >= item.ammoMax || (manual && item.autoReload > 0)) return false;
    item.reloadTime = reloadTimer(item, this.state.player.traits);
    this.events.push({ type: 'reload', weaponId: item.id, automaticReload: item.autoReload > 0 });
    return true;
  }

  throwGrenade(x: number, y: number, slot = 1): boolean {
    const item = this.state.inventory[slot];
    if (!finite(x) || !finite(y) || this.state.phase !== 'battle' || !Number.isInteger(slot) || slot < 0 || slot >= 5 || !isOccupiedItem(item) || item.id !== 11) return false;
    const plan = planConsumableUse(item, { castleHp: this.state.castleHp, castleMaxHp: this.state.castleMaxHp, slotCooling: this.state.itemCooldowns[slot] > 0 });
    if (plan.status !== 'ready' || plan.effect.kind !== 'grenade') { this.events.push({ type: 'beep' }); return false; }
    this.state.projectiles.push(createProjectile({ uid: this.state.nextUid++, kind: 'hand-grenade', weaponSlot: null, startX: WORLD.playerX, startY: WORLD.playerY, targetX: x, targetY: y, speedBase: GRENADE.speed, damage: plan.effect.damage }));
    Object.assign(item, plan.itemAfter);
    this.state.itemCooldowns[slot] = plan.blocksForUpdates;
    this.events.push({ type: 'grenade', x, y });
    return true;
  }

  private tickProjectiles(uidLimit = Infinity): void {
    for (const projectile of this.state.projectiles) if (projectile.uid < uidLimit) advanceProjectile(projectile, {
      hit: (x, y, damage, slot) => this.processPellet(x, y, damage, slot),
      explode: (x, y, damage, slot, kind) => this.explodeProjectile(x, y, damage, slot, kind),
    });
    this.state.projectiles = this.state.projectiles.filter(projectile => !projectile.removed);
  }

  private explodeProjectile(x: number, y: number, damage: number, slot: number | null, kind: ExplosionKind): void {
    const explosion = explosionStats(damage, combatTrait(COMBAT_TRAIT.DA_BOMB, this.state.player.traits), kind === 'rocket');
    if (kind === 'flame') { explosion.radiusX *= 0.9; explosion.radiusY *= 0.9; }
    if (kind === 'grenade' || kind === 'rocket') {
      this.events.push({ type: 'explosion', x, y, explosionKind: kind, scale: explosion.visualScale });
      // shake() всегда расходует два броска до обхода целей, даже если взрыв никого не задел.
      this.random(); this.random();
    } else if (kind === 'gravity') this.events.push({ type: 'pulse', x, y });
    for (const enemy of this.state.enemies) {
      if (!enemy.removed && explosionContains(explosion, x, y, enemy.x, enemy.y, enemy.hp >= 1)) this.damageEnemy(enemy, explosion.damage, false, slot, enemy.x, enemy.y);
    }
  }

  private timerTick(): void {
    const state = this.state;
    const player = state.player;
    if (state.castleHp <= 0) { state.phase = 'defeat'; player.bowDrawing = false; this.events.push({ type: 'defeat' }); return; }
    const item = this.weapon;
    if (item && autoReloadReady(item, player.shootTimer)) this.requestReload(false);
    if (item?.reloadTime) {
      const loaded = advanceReload(item, player.traits, player.rampageTicks > 0);
      item.ammo = loaded.ammo; item.reloadTime = loaded.reloadTime;
      if (loaded.restarted || loaded.completion) this.events.push({ type: loaded.restarted ? 'reload' : 'reloaded', weaponId: item.id, automaticReload: item.autoReload > 0 });
    }
    if (state.newWave) {
      state.newWave = false;
      if (state.castleHp < state.castleMaxHp) state.noDamage = false;
      if (state.waveIndex <= 0) { this.finishDay(); return; }
      state.waveIndex--;
      this.events.push({ type: 'wave', amount: FIRST_DAY.waves - state.waveIndex });
    } else {
      state.spawnTimer--;
      if (state.spawnTimer < 0) {
        const wave = state.waves[state.waveIndex];
        if (!wave.enemies.length) state.newWave = true;
        else {
          const kind = wave.enemies.pop()!;
          this.spawnEnemy(kind);
          state.spawnTimer = wave.delays.pop()!;
          // На первом дне проверка уровня всегда прерывает цикл после одного врага.
          this.random();
        }
      }
    }
    const selected = state.inventory[player.selectedSlot];
    if (selected?.baseAccuracy !== undefined && selected.range !== undefined) player.accuracyFix = recoverAccuracy(selected, player.traits, player.accuracyFix, state.aimX);
  }

  private spawnEnemy(kind: EnemyKind): void {
    if (this.state.enemies.length >= 200) return;
    const definition = ENEMIES[kind];
    const gold = 1 + int(this.random() * definition.power / 10 + 5);
    const bossWeapon = kind === 'boss' ? 1 + int(this.random() * 2) : 0;
    const bossCount = kind === 'boss' ? 100 + int(this.random() * 60) : 0;
    // Даже при нулевых strength/THREAT исходное умножение и деление влияют на последний бит Number.
    const speed = (definition.speedBase + this.random() * definition.speedRandom) * 100 / 100;
    const y = int(this.random() * (kind === 'boss' ? 105 : definition.airborne ? 70 : WORLD.groundWidth) + (kind === 'boss' ? 195 : definition.airborne ? 40 : WORLD.groundLine));
    const hp = kind === 'boss' ? 150 + this.state.activeMission.level * 25 : definition.hp;
    const ranged = kind === 'archer' ? { rangedCounter: 120 } : {};
    const appearance = kind === 'boss' ? 51 + this.state.bossesSpawned++ % 15 : 0;
    this.state.enemies.push({ uid: this.state.nextUid++, kind, x: -20, y, hp, maxHp: hp, speed, speedOrg: speed, attack: definition.attack, gold, exp: 1 + int(definition.power * 0.4), knockBack: 0, disarmed: 0, attacking: false, attacked: false, frame: kind === 'rat' ? 14 : 1, shadowHit: shadowHitAtFrame(kind, kind === 'rat' ? 14 : 1), deathTicks: 0, drop: 0, removed: false, bossAction: kind === 'boss' ? 3 : 0, bossCount, bossIdle: 0, bossFireNum: 0, bossWeapon, bossDamage: 0, appearance, ...ranged });
  }

  private damageEnemy(enemy: EnemyState, raw: number, criticalValue: number | boolean, weaponSlot: number | null, x: number, y: number): void {
    if (enemy.hp <= 0) return;
    const critical = Boolean(criticalValue);
    const definition = ENEMIES[enemy.kind];
    const item = weaponSlot === null ? null : this.state.inventory[weaponSlot];
    const hit = weaponHitDamage(item, this.state.player.traits, raw, { critical, target: definition.airborne ? 'air' : 'normal', bossGuard: enemy.kind === 'boss' && enemy.bossAction === 6 });
    const damage = hit.damage;
    if (item) {
      const effects = weaponHitEffects(item, this.state.player.traits, { ...enemy, resKnock: definition.knockResistance }, {
        damageBeforeGuard: hit.beforeGuard, castleHp: this.state.castleHp, castleMaxHp: this.state.castleMaxHp,
        leechRoll: item.leech && this.state.castleHp > 0 ? this.random() : undefined,
      });
      Object.assign(enemy, { speed: effects.speed, speedOrg: effects.speedOrg, attack: effects.attack, disarmed: effects.disarmed, knockBack: effects.knockBack });
      this.state.castleHp = effects.castleHp;
    }
    enemy.hp -= damage;
    this.events.push({ type: 'hit', x, y, amount: damage, critical, criticalType: Number(criticalValue), enemyUid: enemy.uid });
    if (enemy.hp > 0) {
      if (enemy.kind === 'boss') {
        enemy.bossDamage += damage * (enemy.bossAction === 5 ? 2 : 1);
        // Проверка уровня стоит после случайных условий даже у босса миссии 0.
        if (enemy.bossAction !== 6) {
          const accumulated = enemy.bossDamage >= this.random() * enemy.maxHp * 2;
          if (!accumulated) this.random();
        }
      }
      return;
    }
    const player = this.state.player;
    this.state.kills++;
    const skillIndex = WEAPON_SKILLS.indexOf(this.state.inventory[player.selectedSlot]?.reqTrait as typeof WEAPON_SKILLS[number]);
    player.weaponExp[skillIndex < 0 ? 4 : skillIndex]++;
    const dropThreshold = player.rampageTicks > 0 ? 100 : 150;
    if (item && item.livingWeapon > 0) {
      Object.assign(item, livingWeaponKill(item, () => this.random(), { day: this.state.day }));
    }
    let experience = enemy.exp;
    const enemyLevel = enemy.kind === 'boss' ? this.state.activeMission.level : definition.level;
    if (enemyLevel + 3 < player.level) experience *= 100 / (100 + (player.level - enemyLevel) * 75);
    enemy.exp = int(experience);
    if (critical && player.rampageTicks <= 0 && --player.rampageTicks === -7) this.startRampage();
    // В исходнике опыт приводится к int через trainerFix() для текущего героя.
    player.exp += int(experience);
    if (player.exp >= 1000) this.levelUp();
    let goodShotIndex: number | undefined;
    if (critical) {
      this.state.criticalKills++;
      [10, 30, 50].forEach((count, index) => { if (this.state.criticalKills >= count) this.awardMedal(70 + index); });
      // Здесь пока действует начальное условие sister.dead == false; повреждение сестры не реализовано.
      goodShotIndex = int(this.random() * 5);
    }
    if (int(this.random() * dropThreshold) <= 10) enemy.drop = 1;
    const groupSize = this.state.waves[Math.max(0, this.state.waveIndex)].initialCount;
    if (int(this.random() * groupSize * 5) === 0) { enemy.drop = 2; this.state.loot.push(definition.loot); }
    else this.random();
    if (enemy.kind === 'boss') { enemy.drop = 1; this.state.bossKilled++; }
    enemy.frame = enemy.kind === 'sheep' ? 107 : enemy.kind === 'rat' ? 93 : enemy.kind === 'chicken' ? 208 : enemy.kind === 'crow' ? 58 : enemy.kind === 'archer' ? 94 : enemy.kind === 'boss' ? 281 : 1;
    enemy.shadowHit = shadowHitAtFrame(enemy.kind, enemy.frame, enemy.shadowHit);
    this.events.push({ type: 'kill', x: enemy.x, y: enemy.y, critical, enemyUid: enemy.uid, goodShotIndex });
  }

  private levelUp(): void {
    const growth = levelUpHero(this.state.player, this.state.hero, () => this.random());
    Object.assign(this.state.player, { level: growth.level, exp: growth.exp, skillPoints: growth.skillPoints, traits: growth.traits });
    this.events.push({ type: 'level-up', amount: growth.level });
  }

  private damageCastle(amount: number): void {
    if (this.state.protection.counter > 0) { this.events.push({ type: 'defend' }); return; }
    const traits = this.state.player.traits;
    const insurance = combatTrait(TRAIT.INSURANCE, traits);
    this.state.gold += insurance; this.state.totalMoney += insurance;
    if (this.random() * 100 < combatTrait(TRAIT.DEFENDER, traits)) { this.events.push({ type: 'defend' }); return; }
    const damage = Math.max(1, int(int(amount) * (1 - this.state.activeMission.absorbFix)));
    this.state.castleHp -= damage;
    this.events.push({ type: 'castle-hit', amount: damage, x: 575, y: 220 });
    // Исходник выбирает союзника даже без Last Hope и проверяет порог в этом направлении.
    if (this.random() > 0.6) {
      const ally = int(this.random() * 5), threshold = combatTrait(TRAIT.LAST_HOPE, traits);
      if (ally === 0 && this.state.player.rampageTicks <= 0 && threshold !== 0 && threshold < this.state.castleHp / this.state.castleMaxHp * 100) {
        this.startRampage();
      }
    }
  }

  private startRampage(): void {
    // shake() исходного героя потребляет два броска до включения ярости.
    this.random(); this.random();
    this.state.player.rampageTicks = rampageDuration(this.state.player.traits);
    this.events.push({ type: 'rampage' });
  }

  private tickEnemy(enemy: EnemyState): void {
    if (enemy.hp <= 0) {
      enemy.deathTicks++;
      const deathEnds: Record<EnemyKind, number> = { sheep: 129, rat: 128, chicken: 239, crow: 87, archer: 125, boss: 403 };
      enemy.frame = Math.min(enemy.frame + 1, deathEnds[enemy.kind]);
      enemy.shadowHit = shadowHitAtFrame(enemy.kind, enemy.frame, enemy.shadowHit);
      if (enemy.deathTicks === 50 && enemy.drop === 1) { this.state.gold += enemy.gold; this.state.totalMoney += enemy.gold; this.events.push({ type: 'gold', amount: enemy.gold, x: enemy.x, y: enemy.y }); }
      if (enemy.deathTicks >= 200) enemy.removed = true;
      return;
    }
    if (enemy.knockBack > 0) {
      if (enemy.attacking) {
        enemy.attacking = false; enemy.speed = enemy.speedOrg; enemy.frame = enemy.kind === 'rat' ? 14 : 5;
        enemy.shadowHit = shadowHitAtFrame(enemy.kind, enemy.frame, enemy.shadowHit);
      }
      enemy.knockBack--;
      enemy.x -= enemy.knockBack ** 2 / 40 + ENEMIES[enemy.kind].knockResistance / 2 + 0.2;
      if (enemy.kind === 'archer') enemy.x = Math.trunc(enemy.x * 20) / 20;
      enemy.x = Math.max(enemy.kind === 'archer' ? -ARCHER_DISPLAY_WIDTHS[enemy.frame] : -60, enemy.x);
      this.advanceEnemyAnimation(enemy);
      return;
    }
    if (enemy.kind === 'boss') { this.tickBoss(enemy); return; }
    if (enemy.kind === 'archer') {
      if (enemy.attacking) {
        if (enemy.x < 290 && enemy.attacked) {
          enemy.attacked = false; enemy.attacking = false;
          // В исходном клипе отсутствует stand; наблюдаемый переход Ruffle возвращает кадр 1.
          enemy.frame = 1; enemy.speed = enemy.speedOrg;
        }
      } else {
        enemy.x = Math.trunc((enemy.x + enemy.speed) * 20) / 20;
        if (enemy.x >= 290) {
          if (this.random() * (400 - enemy.x) <= 3.5) { enemy.attacking = true; enemy.speed = 0; enemy.frame = 28; }
        } else if (--enemy.rangedCounter! < 0) {
          enemy.rangedCounter = 80; enemy.attacking = true; enemy.speed = 0; enemy.frame = 28;
        }
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

  private advanceEnemyAnimation(enemy: EnemyState): void {
    enemy.frame++;
    if (enemy.kind === 'sheep') {
      if (enemy.frame === 29) enemy.frame = 5;
      if (enemy.frame === 44) this.damageCastle(enemy.attack);
      if (enemy.frame === 95) enemy.frame = 32;
    } else if (enemy.kind === 'rat') {
      if (enemy.frame === 38) enemy.frame = 14;
      if (enemy.frame === 60) this.damageCastle(enemy.attack);
      if (enemy.frame === 81) enemy.frame = 41;
    } else if (enemy.kind === 'archer') {
      if (enemy.frame === 25) enemy.frame = 5;
      if (enemy.frame === 59) {
        this.state.enemyArrows.push(createEnemyArrow(this.state.nextUid++, enemy.x, enemy.y));
        enemy.attacked = true;
        this.events.push({ type: 'enemy-arrow', x: enemy.x, y: enemy.y });
        this.damageCastle(enemy.attack);
      }
      if (enemy.frame === 82) enemy.frame = 28;
    } else if (enemy.kind === 'chicken') {
      if ([29, 32, 34].includes(enemy.frame)) enemy.speed *= 0.75;
      if (enemy.frame === 37) enemy.speed = 0;
      if (enemy.frame === 47) enemy.attacking = true;
      if (enemy.frame === 58 && this.random() > 0.5) enemy.frame = 50 + int(this.random() * 5);
      if (enemy.frame === 78) enemy.attacking = false;
      if (enemy.frame === 102) enemy.frame = 37;
      if (enemy.frame === 136) this.damageCastle(enemy.attack);
      if (enemy.frame === 153) enemy.attacked = true;
      if (enemy.frame === 196) enemy.frame = 105;
    }
    enemy.shadowHit = shadowHitAtFrame(enemy.kind, enemy.frame, enemy.shadowHit);
  }

  private tickBoss(enemy: EnemyState): void {
    if (enemy.bossIdle > 0) { enemy.bossIdle--; return; }
    if (enemy.bossAction === 1) {
      enemy.bossIdle = enemy.bossWeapon === 1 ? 90 : 5;
      this.damageCastle(enemy.attack * (enemy.bossWeapon === 1 ? 4 : 1));
      enemy.bossFireNum--;
      enemy.frame = 10;
      if (enemy.bossFireNum <= 0) {
        if (int(this.random() * 2) === 0) enemy.bossAction = -1;
        enemy.bossIdle = 100 + int(this.random() * 100);
      }
    } else if (enemy.bossAction === 2) {
      enemy.x += enemy.speed;
      enemy.bossCount--;
      enemy.frame = enemy.frame < 200 || enemy.frame >= 219 ? 200 : enemy.frame + 1;
      if (enemy.bossCount <= 0) {
        this.random(); this.random();
        enemy.bossAction = 1; enemy.speed = 0;
        const rounds = enemy.bossWeapon === 1 ? 1 : 5;
        enemy.bossFireNum = rounds / 2 + int(this.random() * rounds);
        enemy.bossIdle = 50 + int(this.random() * 100);
        enemy.frame = 24;
      }
    } else if (enemy.bossAction === 3 || enemy.bossAction === 4) {
      enemy.speed = enemy.speedOrg * (enemy.bossAction === 3 ? 1 : -1);
      enemy.bossAction = 2; enemy.frame = 200;
    } else {
      enemy.bossAction = 3; enemy.bossCount = 40 + this.random() * 40;
      if (enemy.x > 380 || (enemy.x >= 100 && int(this.random() * 3) === 0)) { enemy.bossAction = 4; enemy.bossCount = 20 + this.random() * 40; }
    }
  }

  private finishDay(): void {
    if (this.state.phase !== 'battle') return;
    const player = this.state.player;
    for (const item of this.state.inventory) if (item) {
      item.reloadTime = 0;
      if (item.type !== ITEM_TYPE.use) item.ammo = item.ammoMax;
    }
    player.rampageTicks = 0;
    player.bowDrawing = false;
    this.state.itemCooldowns.fill(0);
    player.exp += 250;
    if (player.exp >= 1000) this.levelUp();
    // wexpUp повышает навык один раз, затем обнуляет весь накопленный опыт оружия.
    for (const [index, skill] of WEAPON_SKILLS.entries()) {
      if (player.weaponExp[index] > (player.traits[skill] ?? 0) * 12 + 20) {
        player.traits[skill] = (player.traits[skill] ?? 0) + 1; player.weaponExp[index] = 0;
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
    this.state.result = { reward, perfectBonus, upkeep: FIRST_DAY.upkeep, netReward: reward + perfectBonus - FIRST_DAY.upkeep };
    this.state.phase = 'victory';
    this.prepareOrdinaryLoot(() => this.random());
    this.events.push({ type: 'victory' });
  }

  private prepareOrdinaryLoot(random: () => number): void {
    if (this.state.phase !== 'victory' || this.state.postbattle !== 'none') return;
    const generated = new ItemFactory(random, { day: this.state.day }).ordinaryLoot(this.state.loot, this.state.previousTown?.shop ?? this.state.lootOffers);
    this.state.lootOffers = generated.offers;
    this.state.loot = generated.queue;
    this.state.postbattle = 'loot';
  }

  moveLootItem(fromArea: LootArea, from: number, toArea: LootArea, to: number): boolean {
    if (this.state.phase !== 'victory' || !['loot', 'boss-loot'].includes(this.state.postbattle)) return false;
    if (!['offers', 'inventory'].includes(fromArea) || !['offers', 'inventory'].includes(toArea)) return false;
    const source = fromArea === 'offers' ? this.state.lootOffers : this.state.inventory;
    const destination = toArea === 'offers' ? this.state.lootOffers : this.state.inventory;
    return source === destination ? swapInventorySlots(source, from, to) : collectLootItem(source, destination, from, to);
  }

  collectLoot(offer: number, slot = this.state.inventory.findIndex(item => !isOccupiedItem(item))): boolean {
    return this.moveLootItem('offers', offer, 'inventory', slot);
  }

  dropLootItem(slot: number, offer = this.state.lootOffers.findIndex(item => !isOccupiedItem(item))): boolean {
    return this.moveLootItem('inventory', slot, 'offers', offer);
  }

  finishLoot(): boolean {
    if (this.state.phase !== 'victory' || !['loot', 'boss-loot'].includes(this.state.postbattle)) return false;
    if (this.state.postbattle === 'loot' && this.state.bossKilled > 0) {
      this.state.lootOffers = new ItemFactory(() => this.random(), { day: this.state.day }).bossLoot(this.state.bossKilled, false, this.state.lootOffers);
      this.state.postbattle = 'boss-loot';
      return true;
    }
    this.prepareSkillChoices();
    for (const item of this.state.lootOffers) if (item) item.num = 0;
    return true;
  }

  private prepareSkillChoices(): void {
    this.state.skillChoices = this.state.player.skillPoints > 0 ? rollSheriffChoices(this.state.player.level, this.state.player.traits, () => this.random()) : [];
    this.state.postbattle = this.state.skillChoices.length > 0 ? 'skill' : 'result';
    if (this.state.postbattle === 'result') this.prepareResult();
  }

  private prepareResult(): void {
    if (this.state.phase !== 'victory' || this.state.postbattle !== 'result' || this.state.town !== null) return;
    // renewResult тратит бросок fame даже при fame=0; затем townEvent делает два броска ACTIVE=0.
    this.random();
    const extraAp = int(this.random() * this.random());
    this.state.gold += this.state.result.netReward;
    this.state.totalMoney += this.state.result.reward + this.state.result.perfectBonus;
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
    const prepared = prepareEarlyTown(() => this.random(), this.state.day, { priorOffers: this.state.lootOffers, recruitSlots: previous?.recruit.items, searched: previous?.searched, absorbFix: this.medalAbsorption() });
    this.state.town = { ap: this.state.town.ap, preparation: 'ready', ...prepared };
    // Общие слоты 0–7 теперь принадлежат лавке; отдельной копии истории трофеев не остаётся.
    this.state.lootOffers = Array(8).fill(null);
  }

  buyStock(stock: number, slot: number): PurchaseOutcome {
    const town = this.state.town;
    if (this.state.pendingTownAction || this.state.phase !== 'town' || town?.preparation !== 'ready' || !Number.isInteger(stock) || stock < 0 || stock >= 8 || !Number.isInteger(slot) || slot < 0 || slot >= 6 || !isOccupiedItem(town.shop[stock])) return 'unavailable';
    if (isOccupiedItem(this.state.inventory[slot])) return 'occupied';
    const price = Math.trunc(town.shop[stock]!.value);
    if (this.state.gold < price) return 'not-enough-gold';
    this.state.gold -= price;
    [town.shop[stock], this.state.inventory[slot]] = [this.state.inventory[slot], town.shop[stock]];
    return 'purchased';
  }

  moveTownItem(from: number, to: number): boolean {
    return !this.state.pendingTownAction && this.state.phase === 'town' && this.state.town?.preparation === 'ready' && swapInventorySlots(this.state.inventory, from, to);
  }

  sellTownItem(slot: number): number | null {
    if (this.state.pendingTownAction || this.state.phase !== 'town' || this.state.town?.preparation !== 'ready' || !Number.isInteger(slot) || slot < 0 || slot >= 6) return null;
    const item = this.state.inventory[slot];
    if (!isOccupiedItem(item)) return null;
    const price = itemPrice(item);
    this.state.gold += price; this.state.totalMoney += price;
    item.num = 0;
    return price;
  }

  applyShopToken(slot: number, stock: number): boolean {
    const town = this.state.town;
    if (this.state.pendingTownAction || this.state.phase !== 'town' || town?.preparation !== 'ready' || !Number.isInteger(slot) || slot < 0 || slot >= 6 || !Number.isInteger(stock) || stock < 0 || stock >= 8) return false;
    const token = this.state.inventory[slot], item = town.shop[stock];
    if (!isOccupiedItem(token) || token.id !== 35 || !finite(token.attack) || token.attack < 0 || !isOccupiedItem(item)) return false;
    item.value = Math.min(999999999, Math.max(0, item.value - token.attack!));
    token.num = 0;
    return true;
  }

  freeRepair(): RepairOutcome {
    if (this.state.pendingTownAction || this.state.phase !== 'town' || this.state.town === null) return 'unavailable';
    if (this.state.castleHp === this.state.castleMaxHp) return 'not-damaged';
    if (this.state.town.ap < 2) return 'not-enough-ap';
    this.state.town.ap -= 2;
    this.state.castleHp = this.state.castleMaxHp;
    return 'repaired';
  }

  private equipmentFactory(): ItemFactory {
    // У одиночного шерифа пока нет инженера в отряде или медали переработки.
    return new ItemFactory(() => this.random(), { day: this.state.day });
  }

  beginWeaponUpgrade(slot: number): TownEquipmentOutcome {
    const state = this.state, town = state.town;
    if (state.phase !== 'town' || town?.preparation !== 'ready' || state.pendingTownAction || !Number.isInteger(slot) || slot < 0 || slot >= 6) return 'unavailable';
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
    if (state.phase !== 'town' || state.town?.preparation !== 'ready' || state.pendingTownAction || modSlot === gunSlot || [modSlot, gunSlot].some(slot => !Number.isInteger(slot) || slot < 0 || slot >= 6)) return 'unavailable';
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
    if (!applySheriffChoice(this.state.player.traits, this.state.skillChoices, id)) return false;
    this.state.player.skillPoints--;
    this.prepareSkillChoices();
    return true;
  }

  toSave(): SimulationState {
    if (this.pendingOpeningMission) throw new Error('Character creation is not a resumable battle.');
    return structuredClone(this.state);
  }

  static fromSave(value: unknown, options: SimulationOptions = {}): Simulation {
    if (!record(value) || ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(Number(value.version)) || typeof value.version !== 'number' || (![1, 2, 3].includes(Number(value.day)) || typeof value.day !== 'number' || (value.version < 7 && value.day !== 1) || (value.version < 10 && value.day === 3)) || typeof value.phase !== 'string' || !['battle', 'victory', 'defeat', 'town'].includes(value.phase) || (value.version < 4 && value.phase === 'town')) throw new Error('Unsupported or invalid save.');
    const numeric = ['tick', 'timerRemainder', 'rng', 'nextUid', 'castleHp', 'castleMaxHp', 'gold', 'kills', 'criticalKills', 'waveIndex', 'bossWave', 'spawnTimer', 'aimX', 'aimY'];
    if (numeric.some(key => !finite(value[key]))) throw new Error('Invalid save numbers.');
    if (['tick', 'timerRemainder', 'nextUid', 'kills', 'criticalKills'].some(key => !Number.isInteger(value[key]) || Number(value[key]) < 0) || ![2, ...(Number(value.day) >= 2 ? [3] : [])].includes(Number(value.bossWave)) || (value.waveIndex === 5 && value.newWave !== true)) throw new Error('Invalid counters.');
    if (value.castleMaxHp !== FIRST_DAY.castleHp || Number(value.castleHp) > FIRST_DAY.castleHp || Number(value.waveIndex) < 0 || Number(value.waveIndex) > 5 || !Number.isInteger(value.waveIndex) || Number(value.timerRemainder) < 0 || Number(value.timerRemainder) >= 30 || typeof value.fireHeld !== 'boolean' || typeof value.pendingShot !== 'boolean' || typeof value.newWave !== 'boolean' || typeof value.noDamage !== 'boolean' || !Number.isInteger(value.rng) || Number(value.rng) < 1 || Number(value.rng) > 4294967295) throw new Error('Invalid mission state.');
    const player = value.player;
    const legacyEquipment = value.version < 7;
    const legacyProjectiles = value.version < 8;
    const playerNumbers = ['level', 'exp', 'skillPoints', 'shootTimer', 'accuracyFix', 'rampageTicks'];
    if (!record(player) || player.classId !== 'sheriff' || playerNumbers.some(key => !finite(player[key])) || Number(player.level) < 1) throw new Error('Invalid player state.');
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
      if (!record(mission) || Object.entries({ level, fixedLv: level, strength: 0, powerOrg: 800 + level * 120, reward: 600 + level * 20, spawnRate: 15 - level / 5, hpFix: 1, dmgFix: 1, expFix: 1, bossDay: false }).some(([key, expected]) => mission[key] !== expected) || (mission.absorbFix !== 0 && mission.absorbFix !== 0.01) || (value.day === 1 && mission.absorbFix !== 0)) throw new Error('Invalid active mission.');
      if (!finite(value.resultBefore) || value.resultBefore < 0 || !Number.isInteger(value.perfectDays) || Number(value.perfectDays) < 0 || Number(value.perfectDays) > Number(value.day) || !Number.isInteger(value.bossesSpawned) || Number(value.bossesSpawned) < 0 || Number(value.bossesSpawned) > Number(value.day)) throw new Error('Invalid campaign counters.');
      if (!Array.isArray(value.earnedMedals) || new Set(value.earnedMedals).size !== value.earnedMedals.length || !value.earnedMedals.includes(40) || value.earnedMedals.some(id => ![40, 60, 67, 70, 71, 72, 92, 93].includes(id))) throw new Error('Invalid earned medals.');
    }
    if (!Array.isArray(value.waves) || value.waves.length !== 5 || value.waves.some(wave => !record(wave) || !Array.isArray(wave.enemies) || wave.enemies.length > 200 || wave.enemies.some(kind => typeof kind !== 'string' || !Object.hasOwn(ENEMIES, kind)) || !Array.isArray(wave.delays) || wave.delays.length !== wave.enemies.length || wave.delays.some(delay => !finite(delay) || delay < 0 || delay > 1000) || !finite(wave.initialCount) || wave.initialCount < wave.enemies.length)) throw new Error('Invalid wave state.');
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
      if (['uid', 'damage', 'penetrations', 'frame', 'pulseFrame'].some(key => !Number.isInteger(actor[key]) || Number(actor[key]) < (key === 'uid' || key === 'pulseFrame' ? 1 : 0)) || !Number.isInteger(actor.count) || actor.pulseFrame > actor.frame + 1 || actor.damage > 1e9) throw new Error('Invalid projectile counters.');
      if (actor.verticalProgress === null ? Math.abs(actor.targetX - actor.startX) < 0.001 : !finite(actor.verticalProgress) || actor.verticalProgress < 0 || actor.targetX !== actor.startX || actor.x !== actor.startX) throw new Error('Invalid vertical projectile path.');
      if (actor.speed === 0 || actor.direction !== (actor.targetX > actor.startX ? -1 : 1) || actor.scale <= 0 || actor.scale > 10 || actor.alpha < -0.125 || actor.alpha > 1 || actor.shadowAlpha < -0.1 || actor.shadowAlpha > 1 || actor.acceleration < 0) throw new Error('Invalid projectile geometry.');
      if (actor.kind === 'hand-grenade' ? actor.weaponSlot !== null : !Number.isInteger(actor.weaponSlot) || Number(actor.weaponSlot) < 0 || Number(actor.weaponSlot) >= 5) throw new Error('Invalid projectile weapon slot.');
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
      enemy.shadowHit ??= shadowHitAtFrame(enemy.kind, enemy.frame);
      if (value.version < 6) { enemy.bossDamage = 0; enemy.disarmed = 0; }
      if (legacyEquipment) enemy.appearance = enemy.kind === 'boss' ? 51 : 0;
      if (!Number.isInteger(enemy.appearance) || (enemy.kind === 'boss' ? enemy.appearance < 51 || enemy.appearance > 50 + Number(value.day) : enemy.appearance !== 0)) throw new Error('Invalid enemy appearance.');
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
      simulation.state.version = 10;
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
    if (!Array.isArray(state.inventory) || state.inventory.length !== 6 || Array.from(state.inventory).some(item => item !== null && !validItem(item)) || !Array.isArray(state.lootOffers) || state.lootOffers.length !== 8 || Array.from(state.lootOffers).some(item => item !== null && !validItem(item))) throw new Error('Invalid inventory items.');
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
      if (!record(state.previousTown) || state.previousTown.preparation !== 'ready' || !Number.isInteger(state.previousTown.ap) || state.previousTown.ap < 0 || state.previousTown.ap > 4 || !validTownPreparation(state.previousTown, validItem, (state.day - 1) as 1 | 2, state.activeMission.absorbFix)) throw new Error('Invalid previous town.');
    } else if (state.previousTown !== null) throw new Error('Unexpected previous town.');
    if (Number(value.version) < 3) {
      state.version = 10;
      if (state.phase === 'victory' && state.postbattle === 'result') {
        // Старый результат пропускал награды босса и навыки; новые награды расходуют основной поток.
        state.postbattle = 'loot';
        simulation.finishLoot();
      }
    }
    if (!Number.isInteger(state.bossKilled) || state.bossKilled < 0 || state.bossKilled > 1 || !['observed', 'legacy-inferred'].includes(state.bossKilledProvenance) || !['known-starting-traits', 'legacy-reconstructed'].includes(state.traitsProvenance)) throw new Error('Invalid progression provenance.');
    if (value.version < 6) {
      // Утраченные потенциалы нельзя восстановить; отдельный поток сохраняет боевой RNG и вещи.
      const reconstructed = reconstructSheriffHero(state.player.level, state.rng);
      state.hero = reconstructed.hero;
      state.player.traits[TRAIT.BASE_AIMING] ??= reconstructed.baseAiming;
      state.player.traits[TRAIT.BASE_TEAMWORK] ??= reconstructed.baseTeamwork;
    }
    if (!isKnownHeroInitialization(state.hero) || ![TRAIT.BASE_AIMING, TRAIT.BASE_TEAMWORK].every(id => Number.isInteger(state.player.traits[id]) && state.player.traits[id] >= 1)) throw new Error('Invalid hero initialization.');
    if (!record(state.player.traits) || Object.entries(state.player.traits).some(([id, level]) => !Object.hasOwn(SHERIFF_TRAITS, id) || !Number.isInteger(level) || level < 0 || level > SHERIFF_TRAITS[Number(id)].maxLevel) || state.player.traits[TRAIT.SHERIFF] !== state.player.level || (state.player.traits[TRAIT.SHOTGUN] ?? 0) < 2 || (state.player.traits[TRAIT.FURY] ?? 0) < 1) throw new Error('Invalid Sheriff traits.');
    // Пустой список не даёт исходному listTrait2 ни одного допустимого навыка даже до fallback.
    if (state.phase === 'victory' && state.player.skillPoints > 0 && availableSheriffTraits(state.player.level, state.player.traits).length === 0) throw new Error('Pending skill points have no available Sheriff skill.');
    if (!Array.isArray(state.skillChoices) || state.skillChoices.length > 5 || state.skillChoices.some(id => !Number.isInteger(id) || !SHERIFF_CHOICE_ORDER.includes(id)) || new Set(state.skillChoices).size !== state.skillChoices.length) throw new Error('Invalid skill choices.');
    if (state.postbattle === 'skill') {
      const available = availableSheriffTraits(state.player.level, state.player.traits);
      if (state.player.skillPoints < 1 || state.skillChoices.length !== 3 + (state.player.traits[TRAIT.CAPABLE] ?? 0) || state.skillChoices.some(id => !available.includes(id)) || state.lootOffers.some(isOccupiedItem)) throw new Error('Invalid pending skill selection.');
    } else if (state.skillChoices.length !== 0) throw new Error('Unexpected pending skill choices.');
    if ((state.postbattle === 'boss-loot' && state.bossKilled === 0) || (state.postbattle === 'result' && state.player.skillPoints !== 0)) throw new Error('Invalid completed rewards.');
    if (value.version < 4) {
      if (state.phase === 'victory' && state.postbattle === 'result') simulation.prepareResult();
    }
    if (state.phase === 'town' || (state.phase === 'victory' && state.postbattle === 'result')) {
      const town = state.town as unknown;
      if (!record(town) || !Number.isInteger(town.ap) || Number(town.ap) < 0 || Number(town.ap) > 4 || (state.phase === 'victory' && (town.ap !== 4 || town.preparation !== 'pending')) || state.castleHp <= 0) throw new Error('Invalid first-town state.');
      if (town.preparation === 'ready') {
        if (value.version < 5 || state.phase !== 'town' || !validTownPreparation(town, validItem, state.day, simulation.medalAbsorption()) || state.lootOffers.some(item => item !== null)) throw new Error('Invalid prepared town.');
      } else if (town.preparation !== 'pending' || (value.version >= 5 && state.phase === 'town')) throw new Error('Missing town preparation.');
    } else if (state.town !== null) throw new Error('Town preparation precedes completed rewards.');
    // После боя исходные слоты могут быть переставлены; замороженные снаряды не возобновляются.
    if (state.phase === 'battle' && state.projectiles.some(actor => actor.weaponSlot !== null && state.inventory[actor.weaponSlot]?.type !== ITEM_TYPE.gun)) throw new Error('Projectile launch slot is not a gun.');
    // enchant сохраняет старый таймер при заполнении патронов и уменьшении максимума; Rest обнуляет его.
    if (state.phase === 'battle' && state.inventory.some(item => isOccupiedItem(item) && item.type === ITEM_TYPE.gun && (item.reloadTime > item.reloadTimeMax + 1 || item.ammo === item.ammoMax && item.reloadTime !== 0))) throw new Error('Invalid battle weapon reload state.');
    const drawnBow = state.inventory[state.player.selectedSlot];
    if (state.player.bowDrawing && (state.phase !== 'battle' || !isOccupiedItem(drawnBow) || ![24, 25].includes(drawnBow.id))) throw new Error('Invalid bow draw selection.');
    if (state.upgradeReference !== null && (!validItem(state.upgradeReference) || !isOccupiedItem(state.upgradeReference) || state.upgradeReference.type !== ITEM_TYPE.gun)) throw new Error('Invalid upgrade reference.');
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
    state.version = 10;
    // Уже оплаченный результат v4 не пересчитывается; недостающая первая лавка создаётся один раз.
    if (state.phase === 'town' && state.town?.preparation === 'pending') simulation.prepareTown();
    return simulation;
  }
}
