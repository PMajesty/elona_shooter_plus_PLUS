export const ITEM_TYPE = { gun: 1, sell: 3, use: 4, mod: 5, token: 6 } as const;
export const ITEM_TRAIT = { smallGun: 103, rifle: 104, shotgun: 105, bigGun: 106 } as const;
export const PLAYER_INVENTORY_START = 20;
export const PLAYER_INVENTORY_SLOTS = 6;

export interface Item {
  num: number; id: number; graphic: number; type: number; reloadTime: number;
  reloadTimeMax: number; ammo: number; ammoMax: number; value: number; mod: number;
  modMax: number; shell: number; manualReload: boolean; automatic: boolean;
  modText: string; lv: number; typeMinor: number; special: number; leech: number;
  impact: number; shootRate: number; rare: number; autoReload: number; livingWeapon: number;
  name: string; baseAccuracy?: number; accuracyDec?: number; attack?: number;
  dmgAir?: number; dmgArmor?: number; reqTrait?: number; reqLv?: number; range?: number;
}
export interface ItemContext {
  day: number; looter: number; engineer: number; recycleMedal: boolean;
  weaponLevelMode: boolean; weaponSkillLevels: Readonly<Record<number, number>>;
}

export function isOccupiedItem(item: Item | null | undefined): item is Item {
  return item !== null && item !== undefined && item.num > 0;
}

// Статические присваивания generateStuff; исходные числовые ID и названия сохранены.
export const BASE_ITEM_FIELDS: Readonly<Record<number, Readonly<Partial<Item>>>> = {
  1: {"name": "Pistol", "reloadTimeMax": 20, "ammoMax": 10, "shootRate": 100, "automatic": false, "baseAccuracy": 150, "accuracyDec": 0.1, "attack": 20, "dmgAir": 75, "dmgArmor": 35, "reqTrait": 103, "reqLv": 1, "range": 1, "value": 300},
  2: {"name": "Sub Machine Gun", "reloadTimeMax": 60, "ammoMax": 275, "shootRate": 700, "automatic": true, "baseAccuracy": 140, "accuracyDec": 0.05, "attack": 8, "dmgAir": 35, "dmgArmor": 25, "reqTrait": 103, "reqLv": 3, "range": 0, "value": 450},
  3: {"name": "Shotgun", "reloadTimeMax": 6, "ammoMax": 5, "shootRate": 40, "automatic": false, "baseAccuracy": 65, "accuracyDec": 0.24, "attack": 16, "dmgAir": 80, "dmgArmor": 30, "reqTrait": 105, "reqLv": 1, "range": 0, "shell": 6, "manualReload": true, "value": 500, "typeMinor": 2},
  4: {"name": "Hunter's Rifle", "reloadTimeMax": 6, "ammoMax": 10, "shootRate": 30, "automatic": false, "baseAccuracy": 180, "accuracyDec": 0.2, "attack": 55, "dmgAir": 115, "dmgArmor": 55, "reqTrait": 104, "reqLv": 1, "range": 2, "manualReload": true, "value": 400},
  5: {"name": "Assault Rifle", "reloadTimeMax": 55, "ammoMax": 30, "shootRate": 200, "automatic": true, "baseAccuracy": 110, "accuracyDec": 0.08, "attack": 21, "dmgAir": 55, "dmgArmor": 50, "reqTrait": 104, "reqLv": 5, "range": 1, "value": 850},
  6: {"name": "Fur", "type": 3, "value": 80},
  7: {"name": "Armor", "type": 3, "value": 290},
  8: {},
  9: {},
  10: {},
  11: {"type": 4},
  12: {"type": 4, "ammoMax": 5},
  13: {"name": "Sniper Rifle", "reloadTimeMax": 65, "ammoMax": 8, "shootRate": 20, "automatic": false, "baseAccuracy": 225, "accuracyDec": 0.18, "attack": 100, "dmgAir": 100, "dmgArmor": 90, "reqTrait": 104, "reqLv": 6, "range": 2, "value": 1100, "typeMinor": 1},
  14: {"name": "Revolver -Sniper-", "reloadTimeMax": 7, "ammoMax": 6, "shootRate": 60, "automatic": false, "baseAccuracy": 160, "accuracyDec": 0.15, "attack": 42, "dmgAir": 70, "dmgArmor": 44, "reqTrait": 103, "reqLv": 6, "range": 2, "value": 900, "typeMinor": 1, "manualReload": true},
  15: {"name": "Revolver", "reloadTimeMax": 5, "ammoMax": 7, "shootRate": 90, "automatic": false, "baseAccuracy": 80, "accuracyDec": 0.15, "attack": 52, "dmgAir": 20, "dmgArmor": 50, "reqTrait": 103, "reqLv": 4, "range": 1, "value": 750, "manualReload": true},
  16: {"name": "Chain Gun", "reloadTimeMax": 130, "ammoMax": 220, "shootRate": 1000, "automatic": true, "baseAccuracy": 80, "accuracyDec": 0.032, "attack": 12, "dmgAir": 45, "dmgArmor": 50, "reqTrait": 106, "reqLv": 8, "range": 1, "value": 1400},
  17: {"name": "Machine Gun", "reloadTimeMax": 110, "ammoMax": 125, "shootRate": 400, "automatic": true, "baseAccuracy": 60, "accuracyDec": 0.05, "attack": 18, "dmgAir": 40, "dmgArmor": 35, "reqTrait": 104, "reqLv": 7, "range": 2, "value": 980},
  18: {"name": "Laser Pistol", "reloadTimeMax": 55, "ammoMax": 32, "shootRate": 220, "automatic": true, "baseAccuracy": 50, "accuracyDec": 0.08, "attack": 35, "dmgAir": 40, "dmgArmor": 80, "reqTrait": 103, "reqLv": 7, "range": 1, "value": 1300},
  19: {"name": "Combat Shotgun", "reloadTimeMax": 50, "ammoMax": 16, "shootRate": 120, "automatic": false, "baseAccuracy": 65, "accuracyDec": 0.16, "attack": 14, "dmgAir": 70, "dmgArmor": 35, "reqTrait": 105, "reqLv": 6, "range": 0, "shell": 4, "manualReload": false, "value": 1100, "typeMinor": 2},
  20: {"name": "Auto Shotgun", "reloadTimeMax": 60, "ammoMax": 24, "shootRate": 150, "automatic": true, "baseAccuracy": 25, "accuracyDec": 0.22, "attack": 13, "dmgAir": 80, "dmgArmor": 30, "reqTrait": 105, "reqLv": 4, "range": 1, "shell": 10, "manualReload": false, "value": 1400, "typeMinor": 2},
  21: {"name": "Grenade Launcher", "reloadTimeMax": 14, "ammoMax": 6, "shootRate": 30, "automatic": false, "baseAccuracy": 40, "accuracyDec": 0.4, "attack": 50, "dmgAir": 90, "dmgArmor": 100, "reqTrait": 106, "reqLv": 3, "range": 1, "shell": 1, "manualReload": true, "value": 1600, "special": 1},
  22: {"name": "Rocket Launcher", "reloadTimeMax": 20, "ammoMax": 3, "shootRate": 18, "automatic": false, "baseAccuracy": 40, "accuracyDec": 0.5, "attack": 110, "dmgAir": 70, "dmgArmor": 150, "reqTrait": 106, "reqLv": 7, "range": 2, "shell": 1, "manualReload": true, "value": 1700, "special": 2},
  23: {"name": "Crossbow", "reloadTimeMax": 0, "ammoMax": 1, "shootRate": 28, "automatic": false, "baseAccuracy": 120, "accuracyDec": 0.35, "attack": 36, "dmgAir": 90, "dmgArmor": 50, "reqTrait": 104, "reqLv": 3, "range": 2, "value": 650, "special": 3},
  24: {"name": "Long Bow", "reloadTimeMax": 0, "ammoMax": 1, "shootRate": 55, "automatic": false, "baseAccuracy": 220, "accuracyDec": 0.4, "attack": 32, "dmgAir": 100, "dmgArmor": 35, "reqTrait": 103, "reqLv": 1, "range": 2, "value": 400, "special": 4},
  25: {"name": "Wind Bow", "reloadTimeMax": 0, "ammoMax": 1, "shootRate": 35, "automatic": false, "baseAccuracy": 130, "accuracyDec": 0.3, "attack": 18, "dmgAir": 110, "dmgArmor": 30, "reqTrait": 103, "reqLv": 5, "range": 2, "value": 1800, "special": 4, "shell": 3},
  26: {"name": "Repeating Crossbow", "reloadTimeMax": 0, "ammoMax": 1, "shootRate": 85, "automatic": true, "baseAccuracy": 90, "accuracyDec": 0.25, "attack": 14, "dmgAir": 90, "dmgArmor": 30, "reqTrait": 104, "reqLv": 6, "range": 2, "value": 1550, "special": 3},
  27: {"name": "Gravity Gun", "reloadTimeMax": 180, "ammoMax": 1, "shootRate": 100, "automatic": false, "baseAccuracy": 120, "accuracyDec": 0.55, "attack": 105, "dmgAir": 100, "dmgArmor": 100, "reqTrait": 106, "reqLv": 11, "range": 2, "value": 2000, "special": 3},
  28: {"name": "Rat Roast", "type": 3, "value": 50},
  29: {"name": "Helmet", "type": 3, "value": 80},
  30: {"name": "Feather", "type": 3, "value": 120},
  31: {"name": "Meat", "type": 3, "value": 150},
  32: {"name": "Scrap Metal", "type": 3, "value": 220},
  33: {"name": "Insect Blood", "type": 3, "value": 95},
  34: {"name": "Dragon Head", "type": 3, "value": 300},
  35: {"name": "Shop Token", "type": 6, "value": 100, "rare": 0},
  36: {"name": "Cheap Worn HMG", "reloadTimeMax": 90, "ammoMax": 80, "shootRate": 250, "automatic": true, "baseAccuracy": 45, "accuracyDec": 0.058, "attack": 25, "dmgAir": 35, "dmgArmor": 90, "reqTrait": 106, "reqLv": 1, "range": 1, "value": 480},
  37: {"name": "Holy Grail of Jure", "type": 4, "attack": 250, "ammoMax": 0, "value": 1500, "rare": 0},
  38: {"name": "Ragnarok", "type": 4, "attack": 200, "ammoMax": 0, "value": 1000, "rare": 0},
  39: {"name": "HMG", "reloadTimeMax": 90, "ammoMax": 80, "shootRate": 250, "automatic": true, "baseAccuracy": 50, "accuracyDec": 0.06, "attack": 29, "dmgAir": 35, "dmgArmor": 90, "reqTrait": 106, "reqLv": 4, "range": 1, "value": 1000},
  40: {"name": "Flame Thrower", "reloadTimeMax": 60, "ammoMax": 4, "shootRate": 25, "automatic": true, "baseAccuracy": 40, "accuracyDec": 0.3, "attack": 12, "dmgAir": 55, "dmgArmor": 80, "reqTrait": 106, "reqLv": 5, "range": 0, "value": 900, "special": 3},
  101: {"name": "Statue of Ogre", "type": 3, "value": 400},
  102: {"name": "Statue of Archer", "type": 3, "value": 200},
  103: {"name": "Statue of Sheep", "type": 3, "value": 150},
  104: {"name": "Statue of Exploder", "type": 3, "value": 250},
  105: {"name": "Statue of Ballista", "type": 3, "value": 300},
  106: {"name": "Statue of Crow", "type": 3, "value": 200},
  107: {"name": "Statue of Barbarian", "type": 3, "value": 250},
  108: {"name": "Statue of Crusader", "type": 3, "value": 350},
  109: {"name": "Statue of Spiders", "type": 3, "value": 200},
  110: {"name": "Statue of Dragonfly", "type": 3, "value": 150},
  112: {"name": "Statue of Tank", "type": 3, "value": 450},
  113: {"name": "Statue of Dragon", "type": 3, "value": 500},
  114: {"name": "Statue of Ghost", "type": 3, "value": 300},
  115: {"name": "Statue of Dragon", "type": 3, "value": 600},
  116: {"name": "Statue of Peter", "type": 3, "value": 400},
  117: {"name": "Statue of Rat", "type": 3, "value": 150},
  120: {"name": "HMG", "reloadTimeMax": 90, "ammoMax": 80, "shootRate": 250, "automatic": true, "baseAccuracy": 50, "accuracyDec": 0.06, "attack": 17, "dmgAir": 25, "dmgArmor": 60, "reqTrait": 106, "reqLv": 4, "range": 1, "value": 1000},
  121: {},
};

export const MODS = [
  { name: 'NullEnc', cost: 100 }, { name: 'Accuracy', cost: 100 }, { name: 'Reloading', cost: 120 },
  { name: 'Fire Rate', cost: 130 }, { name: 'Damage', cost: 140 }, { name: 'Anti Air', cost: 80 },
  { name: 'Anti Armor', cost: 80 }, { name: 'Ammo', cost: 140 }, { name: 'Impact', cost: 160 },
  { name: 'Leech', cost: 200 }, { name: 'Auto Reload', cost: 100 }, { name: 'Living Weapon', cost: 300 },
  { name: 'Auto Fire', cost: 110 }, { name: 'Muzzle Brake', cost: 130 },
] as const;
const MOD_POOL = [4, 1, 13, 7, 7, 7, 7, 2, 3, 5, 6, 8, 9, 10, 12] as const;
const int = Math.trunc;
const limit = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

export class ItemFactory {
  readonly context: ItemContext;
  private random: () => number;

  constructor(random: () => number, context: Partial<ItemContext> = {}) {
    this.random = random;
    this.context = { day: 1, looter: 0, engineer: 0, recycleMedal: false, weaponLevelMode: false, weaponSkillLevels: {}, ...context };
  }

  generate(id: number, previous?: Readonly<Item>): Item {
    if (!Object.hasOwn(BASE_ITEM_FIELDS, id)) throw new Error(`Unknown original item ID: ${id}`);
    let modMax = 1 + int(limit(this.random() * this.random() * 6, 0, 5));
    if (modMax >= 3 && this.random() > 0.35) modMax -= 2;
    // Исходник сохраняет не перезаписанные поля предыдущего предмета в этом слоте.
    const item = {
      ...previous, num: 1, id, graphic: 10 + id, type: ITEM_TYPE.gun,
      reloadTime: 0, reloadTimeMax: 0, ammoMax: 0, value: 100, mod: 0, modMax,
      shell: 1, manualReload: false, automatic: true, modText: '', lv: 1,
      typeMinor: 0, special: 0, leech: 0, impact: 0, shootRate: 100, rare: 100,
      autoReload: 0, livingWeapon: 0, ...BASE_ITEM_FIELDS[id],
    } as Item;
    if (id === 8 || id === 9 || id === 10) this.setMod(item, MOD_POOL[int(this.random() * MOD_POOL.length)]);
    if (id === 11) {
      item.lv = 1 + int(limit(this.random() * this.context.day / 2, 0, 99));
      item.name = `Grenade Lv.${item.lv}`;
      item.attack = 30 + item.lv * 15;
      item.ammo = 3 + int(this.random() * 6);
      item.ammoMax = 3 + int(this.random() * 6);
      item.value = 75 + 60 * item.lv + (20 + item.lv * 3) * item.ammoMax;
    }
    if (id === 12) {
      item.lv = 1 + int(limit(this.random() * this.context.day / 5, 0, 19));
      item.name = `Repair Hammer Lv.${item.lv}`;
      item.attack = 4 + item.lv * 3;
      item.ammo = 2 + int(this.random() * 4);
      item.value = 50 + 120 * item.lv + (25 + item.lv * 10) * item.ammoMax;
    }
    if (id === 35) item.attack = limit(this.context.day, 0, 30) * 75 + 250;
    if (id === 121) this.setMod(item, 11);
    if (item.type !== ITEM_TYPE.use || item.ammoMax === 0) item.ammo = item.ammoMax;
    if (item.type === ITEM_TYPE.gun) item.value = int(item.value * (100 + item.modMax * item.modMax * 4) / 100);
    return item;
  }

  setMod(item: Item, modId: number): void {
    item.mod = modId;
    item.lv = item.id === 8 ? 1 : item.id === 9 ? 2 : 3;
    item.modMax = item.lv; item.type = ITEM_TYPE.mod;
    item.name = `${MODS[modId].name} Mod Lv.${item.lv}`;
    item.value = [0, 200, 600, 1200][item.lv] + [0, 2, 4, 8][item.lv] * MODS[modId].cost;
  }

  varyWeapon(item: Item, requestedLevel = -1): void {
    let level = requestedLevel;
    if (requestedLevel !== -1) {
      level = Math.trunc(requestedLevel);
    } else if (this.context.weaponLevelMode) {
      const skill = this.context.weaponSkillLevels[item.reqTrait!] ?? 0;
      level = int(this.random() * int((skill + 3 - item.reqLv!) / 2.5 + 1));
    } else level = int(limit(1 + int(this.random() * (this.context.day / 5 + 2)), 1, 2 + this.context.day / 8));
    if (level <= 1) return;
    item.attack = int(item.attack! * (100 + level * 15) / 100);
    item.shootRate = int(item.shootRate * (100 + level * 5) / 100);
    item.name += ` Mk-${level}`;
    item.value = int(item.value * level / 1.5) + level * 300;
    item.reqLv! += int(level * 2.5);
    item.ammo = item.ammoMax; item.lv = level;
  }

  enchant(item: Item, modId = -1, level = -1): void {
    if (level === -1) level = 1 + int(this.random() * 3);
    if (modId === -1) modId = MOD_POOL[int(this.random() * MOD_POOL.length)];
    let efficiency = 1.1 + this.context.engineer / 100;
    if (this.context.recycleMedal) efficiency += 0.15;
    for (const text of item.modText.split(') ')) if (text.includes(MODS[modId].name)) efficiency *= 0.65;
    if (modId === 12) { item.automatic = true; item.shootRate = level + int(item.shootRate * (100 + level * 10 * efficiency) / 100); }
    if (modId === 4) item.attack = int(level * 1.5) + int(item.attack! * (100 + level * 8 * efficiency) / 100);
    if (modId === 3) item.shootRate = level + int(item.shootRate * (100 + level * 12 * efficiency) / 100);
    if (modId === 1) item.baseAccuracy = level + int(item.baseAccuracy! * (100 + level * 5 * efficiency) / 100);
    if (modId === 7) {
      if (item.ammoMax === 1) return;
      item.ammoMax = level + int(item.ammoMax * (100 + level * 10 * efficiency) / 100);
    }
    if (modId === 2) {
      if (item.reloadTimeMax === 0) return;
      item.reloadTimeMax = Math.max(2, int(item.reloadTimeMax * 100 / (100 + level * 7 * efficiency)));
    }
    if (modId === 9) item.leech += int((level + 1) * efficiency);
    if (modId === 8) item.impact = Math.max(1, item.impact) + level * 2;
    if (modId === 5) item.dmgAir! += int(level * 11 * efficiency);
    if (modId === 6) item.dmgArmor! += int(level * 11 * efficiency);
    if (modId === 10) { if (!item.manualReload) return; item.autoReload = level; }
    if (modId === 11) { if (item.livingWeapon > 0) return; item.livingWeapon = int(25 * 2 ** item.modMax); }
    if (modId === 13) item.accuracyDec = item.accuracyDec! * 100 / (100 + level * 8 * efficiency);
    item.mod++; item.modText += `${MODS[modId].name}(Lv.${level}) `;
    item.value += MODS[modId].cost * level * level / 3;
    item.ammo = item.ammoMax;
  }

  randomItem(targetValue: number, mode: 0 | 1 | 2 | 3 | 4, previous?: Readonly<Item>): Item {
    targetValue = Math.max(500, int(targetValue));
    let item = previous ? { ...previous } : undefined;
    for (let attempt = 1; attempt <= 200; attempt++) {
      if (attempt === 200) return this.generate(8, item);
      item = this.generate(1 + int(this.random() * 40), item);
      if (item.rare === 0) continue;
      if (mode === 0 && ((item.type === ITEM_TYPE.mod && this.random() > 0.025) || (item.type === ITEM_TYPE.gun && this.random() > 0.25))) continue;
      if (mode === 1 && ((item.type === ITEM_TYPE.mod && this.random() > 0.2) || (item.type === ITEM_TYPE.gun && this.random() > 0.1))) continue;
      if (mode === 2) {
        if (item.type === ITEM_TYPE.mod && this.random() > 0.2) continue;
        if (item.type !== ITEM_TYPE.gun && item.type !== ITEM_TYPE.mod) continue;
      }
      if (mode === 3 && item.type !== ITEM_TYPE.mod) continue;
      if (mode === 4 && item.type !== ITEM_TYPE.gun) continue;
      if (item.type === ITEM_TYPE.sell) continue;
      if (item.type === ITEM_TYPE.gun) {
        if (this.context.weaponLevelMode && item.reqLv! > (this.context.weaponSkillLevels[item.reqTrait!] ?? 0) + 2) { mode = 4; continue; }
        this.varyWeapon(item);
        if (mode === 2 || this.random() > 0.85) {
          if (this.random() > 0.95) { item.modMax = 1; this.enchant(item, 11, 1); }
          else for (let slot = 0; slot < item.modMax; slot++) if ((mode === 2 && slot === 0) || this.random() < 0.5 - slot * 0.15) this.enchant(item);
        }
      }
      if (item.value <= 500) return item;
      if (this.random() > 0.96 && item.value <= targetValue * 2 + 500) return item;
      if (item.value <= targetValue * (100 + attempt) / 100) return item;
    }
    throw new Error('Original random item loop did not terminate.');
  }

  ordinaryLoot(rawQueue: readonly number[], previousOffers: readonly (Item | null)[] = []): { offers: (Item | null)[]; queue: number[] } {
    const queue = [...rawQueue];
    // clearGameInv очищает только num; неиспользованные поля остаются у самого слота.
    const offers = Array.from({ length: 8 }, (_, index) => previousOffers[index] ? { ...previousOffers[index], num: 0 } : null);
    for (let index = 0; index < Math.min(queue.length, 8); index++) {
      if (this.random() > 0.2 || queue[index] > 1000) {
        if (queue[index] > 1000) queue[index] -= 1000;
        offers[index] = this.generate(queue[index], offers[index] ?? undefined);
      } else {
        const looterFix = this.context.looter === 0 ? 1 : 1.05 + this.context.looter * 0.08;
        offers[index] = this.randomItem(int((this.context.day * 40 + 250) * looterFix), 1, offers[index] ?? undefined);
      }
    }
    return { offers, queue };
  }

  bossLoot(bossKilled: number, modifiersOnly = false, previousOffers: readonly (Item | null)[] = []): (Item | null)[] {
    const offers = Array.from({ length: 8 }, (_, index) => previousOffers[index] ? { ...previousOffers[index], num: 0 } : null);
    const looterFix = this.context.looter === 0 ? 1 : 1.05 + this.context.looter * 0.08;
    const targetValue = int((this.context.day * 60 + 500) * looterFix);
    for (let index = 0; index < Math.min(int(bossKilled / 2) + 1, 8); index++) {
      // clearGameInv обнуляет num, но не остальные поля; опция модов пропускает случайный выбор режима.
      const mode = modifiersOnly || this.random() > 0.8 ? 3 : 2;
      offers[index] = this.randomItem(targetValue, mode, offers[index] ?? undefined);
    }
    return offers;
  }

  startingInventory(): (Item | null)[] {
    const slots: (Item | null)[] = Array(PLAYER_INVENTORY_SLOTS).fill(null);
    // generatePlayer сначала создаёт гранаты, затем временный лук, заменяемый оружием класса.
    slots[1] = { ...this.generate(11), lv: 1, name: "Soldier's Grenade", attack: 45, ammoMax: 5, ammo: 5, value: 100 };
    slots[0] = this.generate(3, this.generate(24));
    return slots;
  }
}

export function itemPrice(item: Readonly<Item>, buying = false): number {
  const value = int(item.value);
  return buying || item.type === ITEM_TYPE.sell ? value : int(value / 5);
}

export function createStartingInventory(random: () => number): (Item | null)[] {
  return new ItemFactory(random).startingInventory();
}

export function swapInventorySlots(slots: (Item | null)[], from: number, to: number): boolean {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= slots.length || to >= slots.length || from === to || !isOccupiedItem(slots[from])) return false;
  // Установка модификации на оружие требует отдельного подтверждения и сюда не входит.
  if (slots[from]!.type === ITEM_TYPE.mod && isOccupiedItem(slots[to]) && slots[to]!.type === ITEM_TYPE.gun) return false;
  [slots[from], slots[to]] = [slots[to], slots[from]];
  return true;
}

export function collectLoot(offers: (Item | null)[], slots: (Item | null)[], offerIndex: number, slotIndex = slots.findIndex(item => !isOccupiedItem(item))): boolean {
  if (!Number.isInteger(offerIndex) || !Number.isInteger(slotIndex) || offerIndex < 0 || offerIndex >= offers.length || slotIndex < 0 || slotIndex >= slots.length || !isOccupiedItem(offers[offerIndex])) return false;
  if (offers[offerIndex]!.type === ITEM_TYPE.mod && isOccupiedItem(slots[slotIndex]) && slots[slotIndex]!.type === ITEM_TYPE.gun) return false;
  [offers[offerIndex], slots[slotIndex]] = [slots[slotIndex], offers[offerIndex]];
  return true;
}

export function sellInventoryItem(slots: (Item | null)[], index: number): number | null {
  if (!Number.isInteger(index) || index < 0 || index >= slots.length || !isOccupiedItem(slots[index])) return null;
  const price = itemPrice(slots[index]!);
  slots[index]!.num = 0;
  return price;
}
