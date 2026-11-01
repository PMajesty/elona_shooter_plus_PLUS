import { ENEMIES, FIRST_DAY, GRENADE, SHOTGUN, SIMULATION_HZ, STARTING_CLASS, TIMER_HZ, WORLD, type EnemyKind, type Rect } from './content.ts';
import { generateLowLevelMission, generateLowLevelWaves, type LowLevelMission } from './missions.ts';
import { generateSheriffHero, isKnownHeroInitialization, levelUpHero, reconstructSheriffHero, type KnownHeroInitialization } from './hero.ts';
import { advanceReload, combatTrait, criticalType, hitscanHit, livingWeaponKill, rampageDuration, recoverAccuracy, reloadTimer, shotDamage, shotSpread, weaponHitDamage, weaponHitEffects, weaponStats } from './combat-stats.ts';
import { BASE_ITEM_FIELDS, ITEM_TYPE, ItemFactory, collectLoot as collectLootItem, createStartingInventory, isOccupiedItem, itemPrice, swapInventorySlots, type Item } from './items.ts';
import { prepareFirstTown, type FirstTownPreparation } from './town-preparation.ts';
import { validTownPreparation } from './town-save.ts';
import { TRAIT, SHERIFF_TRAITS, SHERIFF_CHOICE_ORDER, applySheriffChoice, availableSheriffTraits, createSheriffTraits, rollSheriffChoices, type TraitLevels } from './progression.ts';
import { shadowHitAtFrame } from './collision.ts';

export interface EnemyState {
  uid: number; kind: EnemyKind; x: number; y: number; hp: number; maxHp: number;
  speed: number; speedOrg: number; attack: number; gold: number; exp: number;
  knockBack: number; disarmed: number; attacking: boolean; attacked: boolean; frame: number; shadowHit: boolean;
  deathTicks: number; drop: number; removed: boolean;
  bossAction: number; bossCount: number; bossIdle: number; bossFireNum: number; bossWeapon: number; bossDamage: number;
}
export interface GrenadeState { uid: number; x: number; y: number; startX: number; startY: number; targetX: number; targetY: number; speed: number; remaining: number }
export interface WaveState { enemies: EnemyKind[]; delays: number[]; initialCount: number }
export interface SimulationState {
  version: 6; phase: 'battle' | 'victory' | 'defeat' | 'town'; day: 1; tick: number; timerRemainder: number; rng: number; nextUid: number;
  hero: KnownHeroInitialization;
  castleHp: number; castleMaxHp: number; gold: number; totalMoney: number; kills: number; criticalKills: number;
  aimX: number; aimY: number; fireHeld: boolean; pendingShot: boolean;
  player: { classId: 'sheriff'; level: number; exp: number; skillPoints: number; traits: TraitLevels; weaponExp: number; ammo: number; reloadTicks: number; shootTimer: number; accuracyFix: number; rampageTicks: number; grenades: number; grenadeCooldown: number };
  waveIndex: number; waves: WaveState[]; bossWave: number; newWave: boolean; spawnTimer: number; noDamage: boolean;
  enemies: EnemyState[]; grenades: GrenadeState[]; loot: number[];
  inventory: (Item | null)[]; lootOffers: (Item | null)[]; postbattle: 'none' | 'loot' | 'boss-loot' | 'skill' | 'result';
  inventoryProvenance: 'original-generation' | 'legacy-v1-reconstructed'; legacyReconstructionSeed?: number;
  bossKilled: number; skillChoices: number[]; traitsProvenance: 'known-starting-traits' | 'legacy-reconstructed'; bossKilledProvenance: 'observed' | 'legacy-inferred';
  result: { reward: number; perfectBonus: number; upkeep: number; netReward: number };
  town: null | { ap: number; preparation: 'pending' } | ({ ap: number; preparation: 'ready' } & FirstTownPreparation);
}
export interface Input { aimX?: number; aimY?: number; firePressed?: boolean; fireHeld?: boolean; reload?: boolean; grenade?: boolean }
export interface SimulationEvent { type: 'shot' | 'hit' | 'kill' | 'castle-hit' | 'reload' | 'reloaded' | 'grenade' | 'explosion' | 'wave' | 'victory' | 'defeat' | 'rampage' | 'level-up' | 'gold'; x?: number; y?: number; amount?: number; critical?: boolean; criticalType?: number; enemyUid?: number; goodShotIndex?: number; pellets?: { x: number; y: number }[] }
export interface SimulationOptions { hitTest?: (enemy: Readonly<EnemyState>, x: number, y: number) => boolean; deferOpeningWaves?: boolean }
export type LootArea = 'offers' | 'inventory';
export type RepairOutcome = 'repaired' | 'not-damaged' | 'not-enough-ap' | 'unavailable';
export type PurchaseOutcome = 'purchased' | 'occupied' | 'not-enough-gold' | 'unavailable';

function inside(rect: Rect, x: number, y: number): boolean { return x > rect[0] && x < rect[1] && y > rect[2] && y < rect[3]; }
function int(value: number): number { return Math.trunc(value); }
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) < 1e12; }
function validItem(value: unknown): value is Item {
  if (!record(value) || !Number.isInteger(value.id) || !Object.hasOwn(BASE_ITEM_FIELDS, Number(value.id))) return false;
  const numbers = ['num', 'id', 'graphic', 'type', 'reloadTime', 'reloadTimeMax', 'ammo', 'ammoMax', 'value', 'mod', 'modMax', 'shell', 'lv', 'typeMinor', 'special', 'leech', 'impact', 'shootRate', 'rare', 'autoReload', 'livingWeapon'];
  const optional = ['baseAccuracy', 'accuracyDec', 'attack', 'dmgAir', 'dmgArmor', 'reqTrait', 'reqLv', 'range'];
  if (numbers.some(key => !finite(value[key]) || Number(value[key]) < 0) || optional.some(key => value[key] !== undefined && (!finite(value[key]) || Number(value[key]) < 0))) return false;
  if (numbers.filter(key => key !== 'value').some(key => !Number.isInteger(value[key]))) return false;
  const id = Number(value.id);
  const expectedType = [8, 9, 10, 121].includes(id) ? ITEM_TYPE.mod : BASE_ITEM_FIELDS[id].type ?? ITEM_TYPE.gun;
  if ((value.num !== 0 && value.num !== 1) || value.graphic !== id + 10 || value.type !== expectedType || Number(value.lv) < 1 || Number(value.modMax) < 1 || typeof value.manualReload !== 'boolean' || typeof value.automatic !== 'boolean') return false;
  if (typeof value.name !== 'string' || value.name.length === 0 || value.name.length > 256 || typeof value.modText !== 'string' || value.modText.length > 4096) return false;
  if (expectedType === ITEM_TYPE.gun && (optional.some(key => !finite(value[key])) || Number(value.ammoMax) < 1 || Number(value.ammo) > Number(value.ammoMax) || Number(value.mod) > Number(value.modMax))) return false;
  if (expectedType === ITEM_TYPE.token && !finite(value.attack)) return false;
  if (Number(value.reloadTime) > Number(value.reloadTimeMax) + 1 || (value.type === ITEM_TYPE.gun && value.ammo === value.ammoMax && Number(value.reloadTime) !== 0)) return false;
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
      version: 6, phase: 'battle', day: 1, tick: 0, timerRemainder: 0, rng: initialRng, nextUid: 1, hero: generated.hero,
      castleHp: FIRST_DAY.castleHp, castleMaxHp: FIRST_DAY.castleHp, gold: STARTING_CLASS.money, totalMoney: 0, kills: 0, criticalKills: 0,
      aimX: 300, aimY: 240, fireHeld: false, pendingShot: false,
      player: { classId: 'sheriff', level: 1, exp: 0, skillPoints: 0, traits: generated.traits, weaponExp: 0, ammo: SHOTGUN.magazine, reloadTicks: 0, shootTimer: 0, accuracyFix: 0, rampageTicks: 0, grenades: GRENADE.quantity, grenadeCooldown: 0 },
      waveIndex: FIRST_DAY.waves, waves: [], bossWave: 2, newWave: true, spawnTimer: 30, noDamage: true,
      enemies: [], grenades: [], loot: [], result: { reward: 0, perfectBonus: 0, upkeep: 0, netReward: 0 },
      inventory: generated.inventory, lootOffers: Array(8).fill(null), postbattle: 'none', inventoryProvenance: 'original-generation',
      bossKilled: 0, skillChoices: [], traitsProvenance: 'known-starting-traits', bossKilledProvenance: 'observed',
      town: null,
    };
    if (!options.deferOpeningWaves) this.startOpeningBattle();
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
    this.state.loot = [...mission.loot];
    this.state.waveIndex = mission.wave;
    this.state.newWave = mission.newWave;
    this.state.spawnTimer = mission.time;
    this.state.bossWave = mission.bossWave;
    this.state.waves = generateLowLevelWaves(mission, 1, () => this.random()).waves;
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
    this.state.fireHeld = Boolean(input.fireHeld);
    const player = this.state.player;
    this.state.tick++;
    player.shootTimer = Math.max(-10000, player.shootTimer - this.state.inventory[0]!.shootRate);
    if (player.rampageTicks > 0) player.rampageTicks--;
    if (player.grenadeCooldown > 0) player.grenadeCooldown--;
    if (input.reload) this.requestReload();
    if (firePressed) {
      if (player.reloadTicks > 0) { this.fireAt(this.state.aimX, this.state.aimY); this.state.pendingShot = false; }
      else this.state.pendingShot = true;
    } else if (!input.fireHeld) this.state.pendingShot = false;
    if (this.state.pendingShot && player.reloadTicks === 0 && this.fireAt(this.state.aimX, this.state.aimY)) this.state.pendingShot = false;
    if (input.grenade) this.throwGrenade(this.state.aimX, this.state.aimY);
    for (const enemy of this.state.enemies) this.tickEnemy(enemy);
    this.tickGrenades();
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
    const item = this.state.inventory[0]!;
    const stats = weaponStats(item, player.traits);
    if (!stats.canFire) return false;
    if (player.reloadTicks > 0) { player.reloadTicks = 0; this.syncBattleInventory(); this.events.push({ type: 'reloaded' }); return false; }
    if (player.shootTimer > 0) return false;
    if (player.ammo <= 0) { this.state.pendingShot = false; this.requestReload(); return false; }
    const spread = shotSpread(item, player.traits, player.accuracyFix);
    player.shootTimer = stats.shootTimer;
    player.ammo--;
    this.syncBattleInventory();
    player.accuracyFix += stats.recoil;
    let damage = shotDamage(item, player.traits, { rampage: player.rampageTicks > 0 });
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
        this.damageEnemy(enemy, damage, hit.critical, true, hitX, hitY);
      }
    }
    this.events.push({ type: 'shot', x: WORLD.playerX, y: WORLD.playerY, pellets });
    return true;
  }

  private processPellet(x: number, y: number, damage: number): boolean {
    let hitLivingEnemy = false;
    for (const enemy of this.state.enemies) {
      if (enemy.removed) continue;
      const hit = this.hitEnemy(enemy, x, y);
      if (!hit) continue;
      // Исходный procHit проверяет SENSE даже у начального шерифа с нулевым навыком.
      const critical = criticalType(this.state.player.traits, this.random(), inside(ENEMIES[enemy.kind].critical, x - enemy.x, y - enemy.y), enemy.hp > 0);
      if (enemy.hp > 0) hitLivingEnemy = true;
      enemy.knockBack = combatTrait(TRAIT.SHERIFF, this.state.player.traits);
      this.damageEnemy(enemy, damage, critical, true, x, y);
    }
    return hitLivingEnemy;
  }

  private hitEnemy(enemy: EnemyState, x: number, y: number): boolean {
    return this.options.hitTest?.(enemy, x, y) ?? inside(ENEMIES[enemy.kind].body, x - enemy.x, y - enemy.y);
  }

  requestReload(): boolean {
    const player = this.state.player;
    if (this.state.phase !== 'battle' || player.shootTimer > 0 || player.reloadTicks > 0 || player.ammo >= SHOTGUN.magazine) return false;
    player.reloadTicks = reloadTimer(this.state.inventory[0]!, player.traits);
    this.syncBattleInventory();
    this.events.push({ type: 'reload' });
    return true;
  }

  throwGrenade(x: number, y: number): boolean {
    const player = this.state.player;
    if (!finite(x) || !finite(y) || this.state.phase !== 'battle' || player.grenades <= 0 || player.grenadeCooldown > 0) return false;
    // Вертикальный бросок в Flash делил на ноль; небольшой сдвиг сохраняет конечную траекторию.
    if (Math.abs(x - WORLD.playerX) < 0.01) x = WORLD.playerX - 0.01;
    const speed = GRENADE.speed * Math.atan2(Math.abs(x - WORLD.playerX) * 2, Math.abs(y - WORLD.playerY)) * 2 / Math.PI + 0.1;
    this.state.grenades.push({ uid: this.state.nextUid++, x: WORLD.playerX, y: WORLD.playerY, startX: WORLD.playerX, startY: WORLD.playerY, targetX: x, targetY: y, speed: x > WORLD.playerX ? speed : -speed, remaining: int(Math.abs(x - WORLD.playerX) / speed) + 1 });
    player.grenades--;
    this.syncBattleInventory();
    player.grenadeCooldown = GRENADE.cooldownFrames + 1;
    this.events.push({ type: 'grenade', x, y });
    return true;
  }

  private tickGrenades(): void {
    for (const grenade of this.state.grenades) {
      grenade.remaining--;
      grenade.x += grenade.speed;
      const a = 0.003;
      const b = (grenade.targetY - grenade.startY - a * grenade.targetX ** 2 + a * grenade.startX ** 2) / (grenade.targetX - grenade.startX);
      const c = grenade.targetY - a * grenade.targetX ** 2 - b * grenade.targetX;
      grenade.y = a * grenade.x ** 2 + b * grenade.x + c;
      if (grenade.remaining > 0) continue;
      this.events.push({ type: 'explosion', x: grenade.x, y: grenade.y });
      for (const enemy of this.state.enemies) {
        if (enemy.hp > 0 && Math.abs(enemy.x - grenade.x) < GRENADE.radiusX && Math.abs(enemy.y - grenade.y) < GRENADE.radiusY) this.damageEnemy(enemy, GRENADE.damage, false, false, enemy.x, enemy.y);
      }
    }
    this.state.grenades = this.state.grenades.filter(grenade => grenade.remaining > 0);
  }

  private timerTick(): void {
    const state = this.state;
    const player = state.player;
    if (state.castleHp <= 0) { state.phase = 'defeat'; this.events.push({ type: 'defeat' }); return; }
    if (player.reloadTicks > 0) {
      const loaded = advanceReload({ ...state.inventory[0]!, ammo: player.ammo, reloadTime: player.reloadTicks }, player.traits, player.rampageTicks > 0);
      player.ammo = loaded.ammo;
      player.reloadTicks = loaded.reloadTime;
      if (loaded.restarted || loaded.completion) this.events.push({ type: loaded.restarted ? 'reload' : 'reloaded' });
    }
    this.syncBattleInventory();
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
    player.accuracyFix = recoverAccuracy(state.inventory[0]!, player.traits, player.accuracyFix, state.aimX);
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
    this.state.enemies.push({ uid: this.state.nextUid++, kind, x: -20, y, hp: definition.hp, maxHp: definition.hp, speed, speedOrg: speed, attack: definition.attack, gold, exp: 1 + int(definition.power * 0.4), knockBack: 0, disarmed: 0, attacking: false, attacked: false, frame: kind === 'rat' ? 14 : 1, shadowHit: shadowHitAtFrame(kind, kind === 'rat' ? 14 : 1), deathTicks: 0, drop: 0, removed: false, bossAction: kind === 'boss' ? 3 : 0, bossCount, bossIdle: 0, bossFireNum: 0, bossWeapon, bossDamage: 0 });
  }

  private damageEnemy(enemy: EnemyState, raw: number, criticalValue: number | boolean, weapon: boolean, x: number, y: number): void {
    if (enemy.hp <= 0) return;
    const critical = Boolean(criticalValue);
    const definition = ENEMIES[enemy.kind];
    const item = weapon ? this.state.inventory[0] : null;
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
    this.state.kills++; player.weaponExp++;
    const dropThreshold = player.rampageTicks > 0 ? 100 : 150;
    if (item && item.livingWeapon > 0) {
      Object.assign(item, livingWeaponKill(item, () => this.random(), { day: this.state.day }));
      player.ammo = item.ammo;
    }
    let experience = enemy.exp;
    const enemyLevel = enemy.kind === 'boss' ? FIRST_DAY.missionLevel : definition.level;
    if (enemyLevel + 3 < player.level) experience *= 100 / (100 + (player.level - enemyLevel) * 75);
    enemy.exp = int(experience);
    if (critical && player.rampageTicks <= 0 && --player.rampageTicks === -7) { player.rampageTicks = rampageDuration(player.traits); this.events.push({ type: 'rampage' }); }
    // В исходнике опыт приводится к int через trainerFix() для текущего героя.
    player.exp += int(experience);
    if (player.exp >= 1000) this.levelUp();
    let goodShotIndex: number | undefined;
    if (critical) {
      this.state.criticalKills++;
      // Здесь пока действует начальное условие sister.dead == false; повреждение сестры не реализовано.
      goodShotIndex = int(this.random() * 5);
    }
    if (int(this.random() * dropThreshold) <= 10) enemy.drop = 1;
    const groupSize = this.state.waves[Math.max(0, this.state.waveIndex)].initialCount;
    if (int(this.random() * groupSize * 5) === 0) { enemy.drop = 2; this.state.loot.push(definition.loot); }
    else this.random();
    if (enemy.kind === 'boss') { enemy.drop = 1; this.state.bossKilled++; }
    enemy.frame = enemy.kind === 'sheep' ? 107 : enemy.kind === 'rat' ? 93 : enemy.kind === 'chicken' ? 208 : enemy.kind === 'boss' ? 281 : 1;
    enemy.shadowHit = shadowHitAtFrame(enemy.kind, enemy.frame, enemy.shadowHit);
    this.events.push({ type: 'kill', x: enemy.x, y: enemy.y, critical, enemyUid: enemy.uid, goodShotIndex });
  }

  private levelUp(): void {
    const growth = levelUpHero(this.state.player, this.state.hero, () => this.random());
    Object.assign(this.state.player, { level: growth.level, exp: growth.exp, skillPoints: growth.skillPoints, traits: growth.traits });
    this.events.push({ type: 'level-up', amount: growth.level });
  }

  private damageCastle(amount: number): void {
    this.state.castleHp -= Math.max(1, int(amount));
    this.events.push({ type: 'castle-hit', amount, x: 575, y: 220 });
  }

  private tickEnemy(enemy: EnemyState): void {
    if (enemy.hp <= 0) {
      enemy.deathTicks++;
      const deathEnds: Record<EnemyKind, number> = { sheep: 129, rat: 128, chicken: 239, crow: 87, boss: 403 };
      enemy.frame = Math.min(enemy.frame + 1, deathEnds[enemy.kind]);
      enemy.shadowHit = shadowHitAtFrame(enemy.kind, enemy.frame, enemy.shadowHit);
      if (enemy.deathTicks === 50 && enemy.drop === 1) { this.state.gold += enemy.gold; this.events.push({ type: 'gold', amount: enemy.gold, x: enemy.x, y: enemy.y }); }
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
      enemy.x = Math.max(-60, enemy.x);
      this.advanceEnemyAnimation(enemy);
      return;
    }
    if (enemy.kind === 'boss') { this.tickBoss(enemy); return; }
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
    player.ammo = SHOTGUN.magazine;
    player.reloadTicks = 0;
    player.rampageTicks = 0;
    player.grenadeCooldown = 0;
    player.exp += 250;
    if (player.exp >= 1000) this.levelUp();
    this.state.pendingShot = false;
    const perfectBonus = this.state.noDamage ? FIRST_DAY.reward * 0.3 : 0;
    this.state.result = { reward: FIRST_DAY.reward, perfectBonus, upkeep: FIRST_DAY.upkeep, netReward: FIRST_DAY.reward + perfectBonus - FIRST_DAY.upkeep };
    this.state.phase = 'victory';
    this.syncBattleInventory();
    this.prepareOrdinaryLoot(() => this.random());
    this.events.push({ type: 'victory' });
  }

  private syncBattleInventory(): void {
    const gun = this.state.inventory[0], grenade = this.state.inventory[1];
    if (gun?.id === SHOTGUN.id) {
      gun.ammo = this.state.player.ammo;
      gun.reloadTime = this.state.player.reloadTicks;
    }
    if (grenade?.id === GRENADE.id) grenade.ammo = this.state.player.grenades;
  }

  private prepareOrdinaryLoot(random: () => number): void {
    if (this.state.phase !== 'victory' || this.state.postbattle !== 'none') return;
    const generated = new ItemFactory(random, { day: this.state.day }).ordinaryLoot(this.state.loot, this.state.lootOffers);
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
    const prepared = prepareFirstTown(() => this.random(), { priorOffers: this.state.lootOffers });
    this.state.town = { ap: this.state.town.ap, preparation: 'ready', ...prepared };
    // Общие слоты 0–7 теперь принадлежат лавке; отдельной копии истории трофеев не остаётся.
    this.state.lootOffers = Array(8).fill(null);
  }

  buyStock(stock: number, slot: number): PurchaseOutcome {
    const town = this.state.town;
    if (this.state.phase !== 'town' || town?.preparation !== 'ready' || !Number.isInteger(stock) || stock < 0 || stock >= 8 || !Number.isInteger(slot) || slot < 0 || slot >= 6 || !isOccupiedItem(town.shop[stock])) return 'unavailable';
    if (isOccupiedItem(this.state.inventory[slot])) return 'occupied';
    const price = Math.trunc(town.shop[stock]!.value);
    if (this.state.gold < price) return 'not-enough-gold';
    this.state.gold -= price;
    [town.shop[stock], this.state.inventory[slot]] = [this.state.inventory[slot], town.shop[stock]];
    return 'purchased';
  }

  moveTownItem(from: number, to: number): boolean {
    return this.state.phase === 'town' && this.state.town?.preparation === 'ready' && swapInventorySlots(this.state.inventory, from, to);
  }

  sellTownItem(slot: number): number | null {
    if (this.state.phase !== 'town' || this.state.town?.preparation !== 'ready' || !Number.isInteger(slot) || slot < 0 || slot >= 6) return null;
    const item = this.state.inventory[slot];
    if (!isOccupiedItem(item)) return null;
    const price = itemPrice(item);
    this.state.gold += price; this.state.totalMoney += price;
    item.num = 0;
    return price;
  }

  applyShopToken(slot: number, stock: number): boolean {
    const town = this.state.town;
    if (this.state.phase !== 'town' || town?.preparation !== 'ready' || !Number.isInteger(slot) || slot < 0 || slot >= 6 || !Number.isInteger(stock) || stock < 0 || stock >= 8) return false;
    const token = this.state.inventory[slot], item = town.shop[stock];
    if (!isOccupiedItem(token) || token.id !== 35 || !finite(token.attack) || token.attack < 0 || !isOccupiedItem(item)) return false;
    item.value = Math.min(999999999, Math.max(0, item.value - token.attack!));
    token.num = 0;
    return true;
  }

  freeRepair(): RepairOutcome {
    if (this.state.phase !== 'town' || this.state.town === null) return 'unavailable';
    if (this.state.castleHp === this.state.castleMaxHp) return 'not-damaged';
    if (this.state.town.ap < 2) return 'not-enough-ap';
    this.state.town.ap -= 2;
    this.state.castleHp = this.state.castleMaxHp;
    return 'repaired';
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
    if (!record(value) || ![1, 2, 3, 4, 5, 6].includes(Number(value.version)) || typeof value.version !== 'number' || value.day !== 1 || typeof value.phase !== 'string' || !['battle', 'victory', 'defeat', 'town'].includes(value.phase) || (value.version < 4 && value.phase === 'town')) throw new Error('Unsupported or invalid save.');
    const numeric = ['tick', 'timerRemainder', 'rng', 'nextUid', 'castleHp', 'castleMaxHp', 'gold', 'kills', 'criticalKills', 'waveIndex', 'bossWave', 'spawnTimer', 'aimX', 'aimY'];
    if (numeric.some(key => !finite(value[key]))) throw new Error('Invalid save numbers.');
    if (['tick', 'timerRemainder', 'nextUid', 'kills', 'criticalKills'].some(key => !Number.isInteger(value[key]) || Number(value[key]) < 0) || value.bossWave !== 2 || (value.waveIndex === 5 && value.newWave !== true)) throw new Error('Invalid counters.');
    if (value.castleMaxHp !== FIRST_DAY.castleHp || Number(value.castleHp) > FIRST_DAY.castleHp || Number(value.waveIndex) < 0 || Number(value.waveIndex) > 5 || !Number.isInteger(value.waveIndex) || Number(value.timerRemainder) < 0 || Number(value.timerRemainder) >= 30 || typeof value.fireHeld !== 'boolean' || typeof value.pendingShot !== 'boolean' || typeof value.newWave !== 'boolean' || typeof value.noDamage !== 'boolean' || !Number.isInteger(value.rng) || Number(value.rng) < 1 || Number(value.rng) > 4294967295) throw new Error('Invalid mission state.');
    const player = value.player;
    const playerNumbers = ['level', 'exp', 'skillPoints', 'weaponExp', 'ammo', 'reloadTicks', 'shootTimer', 'accuracyFix', 'rampageTicks', 'grenades', 'grenadeCooldown'];
    if (!record(player) || player.classId !== 'sheriff' || playerNumbers.some(key => !finite(player[key])) || Number(player.ammo) < 0 || Number(player.ammo) > 5 || Number(player.grenades) < 0 || Number(player.grenades) > 5 || Number(player.level) < 1 || Number(player.reloadTicks) < 0 || Number(player.reloadTicks) > 7) throw new Error('Invalid player state.');
    if (['level', 'exp', 'skillPoints', 'weaponExp', 'ammo', 'reloadTicks', 'grenades', 'grenadeCooldown'].some(key => !Number.isInteger(player[key]) || Number(player[key]) < 0) || Number(player.exp) >= 1000) throw new Error('Invalid player counters.');
    if (player.ammo === SHOTGUN.magazine && Number(player.reloadTicks) > 0) throw new Error('A full magazine cannot be reloading.');
    if (!Array.isArray(value.waves) || value.waves.length !== 5 || value.waves.some(wave => !record(wave) || !Array.isArray(wave.enemies) || wave.enemies.length > 200 || wave.enemies.some(kind => typeof kind !== 'string' || !Object.hasOwn(ENEMIES, kind)) || !Array.isArray(wave.delays) || wave.delays.length !== wave.enemies.length || wave.delays.some(delay => !finite(delay) || delay < 0 || delay > 1000) || !finite(wave.initialCount) || wave.initialCount < wave.enemies.length)) throw new Error('Invalid wave state.');
    const enemyNumbers = ['uid', 'x', 'y', 'hp', 'maxHp', 'speed', 'speedOrg', 'attack', 'gold', 'exp', 'knockBack', 'frame', 'deathTicks', 'drop', 'bossAction', 'bossCount', 'bossIdle', 'bossFireNum', 'bossWeapon'];
    if (!Array.isArray(value.enemies) || value.enemies.length > 200 || value.enemies.some(enemy => !record(enemy) || typeof enemy.kind !== 'string' || !Object.hasOwn(ENEMIES, enemy.kind) || enemyNumbers.some(key => !finite(enemy[key])) || Number(enemy.maxHp) <= 0 || Number(enemy.hp) > Number(enemy.maxHp) || ['attacking', 'attacked', 'removed'].some(key => typeof enemy[key] !== 'boolean') || (enemy.shadowHit !== undefined && typeof enemy.shadowHit !== 'boolean'))) throw new Error('Invalid enemies.');
    const ids = value.enemies.map(enemy => (enemy as Record<string, unknown>).uid);
    if (new Set(ids).size !== ids.length || ids.some(id => !Number.isInteger(id) || Number(id) < 1)) throw new Error('Invalid enemy identifiers.');
    const grenadeNumbers = ['uid', 'x', 'y', 'startX', 'startY', 'targetX', 'targetY', 'speed', 'remaining'];
    if (!Array.isArray(value.grenades) || value.grenades.length > 5 || value.grenades.some(grenade => !record(grenade) || grenadeNumbers.some(key => !finite(grenade[key])) || Math.abs(Number(grenade.targetX) - Number(grenade.startX)) < 0.001)) throw new Error('Invalid grenades.');
    const allIds = [...ids, ...value.grenades.map(grenade => (grenade as Record<string, unknown>).uid)];
    if (Number(value.nextUid) < 1 || new Set(allIds).size !== allIds.length || allIds.some(id => !Number.isInteger(id) || Number(id) < 1 || Number(id) >= Number(value.nextUid))) throw new Error('Invalid next entity identifier.');
    if (!Array.isArray(value.loot) || value.loot.length > 200 || value.loot.some(item => !Number.isInteger(item) || !Object.hasOwn(BASE_ITEM_FIELDS, item > 1000 ? item - 1000 : item)) || !record(value.result) || ['reward', 'perfectBonus', 'upkeep', 'netReward'].some(key => !finite((value.result as Record<string, unknown>)[key]))) throw new Error('Invalid results.');
    const simulation = new Simulation(1, { ...options, deferOpeningWaves: false });
    simulation.state = structuredClone(value) as unknown as SimulationState;
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
      enemy.shadowHit ??= shadowHitAtFrame(enemy.kind, enemy.frame);
      if (value.version < 6) { enemy.bossDamage = 0; enemy.disarmed = 0; }
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
      simulation.state.version = 6;
      simulation.state.inventory = createStartingInventory(reconstructionRandom);
      simulation.state.lootOffers = Array(8).fill(null);
      simulation.state.postbattle = 'none';
      simulation.state.inventoryProvenance = 'legacy-v1-reconstructed';
      simulation.state.legacyReconstructionSeed = Number(value.rng);
      simulation.syncBattleInventory();
      simulation.prepareOrdinaryLoot(reconstructionRandom);
    }
    const state = simulation.state;
    if (!Array.isArray(state.inventory) || state.inventory.length !== 6 || Array.from(state.inventory).some(item => item !== null && !validItem(item)) || !Array.isArray(state.lootOffers) || state.lootOffers.length !== 8 || Array.from(state.lootOffers).some(item => item !== null && !validItem(item))) throw new Error('Invalid inventory items.');
    if (!['none', 'loot', 'boss-loot', 'skill', 'result'].includes(state.postbattle) || (state.phase === 'victory' ? state.postbattle === 'none' : state.phase === 'town' ? state.postbattle !== 'result' : state.postbattle !== 'none') || (!['loot', 'boss-loot'].includes(state.postbattle) && state.lootOffers.some(isOccupiedItem))) throw new Error('Invalid postbattle stage.');
    if (value.version === 2 && !['none', 'loot', 'result'].includes(state.postbattle)) throw new Error('Invalid legacy postbattle stage.');
    if (['battle', 'defeat'].includes(state.phase) && (!isOccupiedItem(state.inventory[0]) || !isOccupiedItem(state.inventory[1]) || state.inventory[0].id !== SHOTGUN.id || state.inventory[0].ammo !== state.player.ammo || state.inventory[0].reloadTime !== state.player.reloadTicks || state.inventory[1].id !== GRENADE.id || state.inventory[1].ammo !== state.player.grenades)) throw new Error('Inventory does not match active equipment.');
    if (state.inventoryProvenance === 'legacy-v1-reconstructed') {
      if (!Number.isInteger(state.legacyReconstructionSeed) || state.legacyReconstructionSeed! < 1 || state.legacyReconstructionSeed! > 0xffffffff) throw new Error('Invalid legacy inventory provenance.');
    } else if (state.inventoryProvenance !== 'original-generation' || state.legacyReconstructionSeed !== undefined) throw new Error('Invalid inventory provenance.');
    if (Number(value.version) < 3) {
      state.version = 6;
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
        if (value.version < 5 || state.phase !== 'town' || !validTownPreparation(town, validItem) || state.lootOffers.some(item => item !== null)) throw new Error('Invalid prepared town.');
      } else if (town.preparation !== 'pending' || (value.version >= 5 && state.phase === 'town')) throw new Error('Missing town preparation.');
    } else if (state.town !== null) throw new Error('Town preparation precedes completed rewards.');
    state.version = 6;
    // Уже оплаченный результат v4 не пересчитывается; недостающая первая лавка создаётся один раз.
    if (state.phase === 'town' && state.town?.preparation === 'pending') simulation.prepareTown();
    return simulation;
  }
}
