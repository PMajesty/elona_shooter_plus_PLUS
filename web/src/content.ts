export const SIMULATION_HZ = 30;
export const TIMER_HZ = 20;
export const WORLD = { width: 620, height: 380, defenseLine: 455, groundLine: 170, groundWidth: 155, playerX: 510, playerY: 245 } as const;

export const STARTING_CLASS = {
  id: 'sheriff', originalId: 6, name: 'Sheriff', level: 1, money: 200,
  description: 'Enemies shot by a sheriff will be knocked back and slowed down, making them easy targets.',
  traits: { SHERIFF: 1, SHOTGUN: 2, FURY: 1 },
} as const;

export const SHOTGUN = {
  id: 3, name: 'Shotgun', damage: 16, pellets: 6, magazine: 5,
  shootRate: 40, shotTimer: 1000, reloadTimer: 7, baseAccuracy: 65,
  accuracyDecay: 0.24, airDamagePercent: 80, armorDamagePercent: 30,
  automatic: false, manualReload: true, range: 0,
} as const;

export const GRENADE = { id: 11, name: "Soldier's Grenade", damage: 45, quantity: 5, cooldownFrames: 100, radiusX: 60, radiusY: 50, speed: 12 } as const;

export type EnemyKind = 'sheep' | 'rat' | 'chicken' | 'crow' | 'archer' | 'fly' | 'barbarian' | 'lava' | 'boss';
export type Rect = readonly [left: number, right: number, top: number, bottom: number];
export interface EnemyDefinition {
  kind: EnemyKind; id: number; name: string; level: number; power: number;
  hp: number; attack: number; speedBase: number; speedRandom: number;
  critical: Rect; body: Rect; knockResistance: number; flags: readonly string[];
  airborne?: boolean; loot: number;
}

// Числа перенесены из enemy.init и MainTimeline.setEnemy. Границы body — временная замена силуэтов Flash.
export const ENEMIES: Readonly<Record<EnemyKind, EnemyDefinition>> = {
  sheep: { kind: 'sheep', id: 3, name: 'Sheep', level: 0, power: 70, hp: 42, attack: 1, speedBase: 0.7, speedRandom: 0.4, critical: [4, 19, -1, 9], body: [-20, 20, -17, 12], knockResistance: 0.9, flags: ['BATCH'], loot: 6 },
  rat: { kind: 'rat', id: 17, name: 'Rat', level: 1, power: 50, hp: 16, attack: 2, speedBase: 2.7, speedRandom: 1.3, critical: [-6, 9, -11, 1], body: [-19, 17, -14, 8], knockResistance: 1.1, flags: ['BATCH', 'MASS'], loot: 28 },
  archer: { kind: 'archer', id: 2, name: 'Archer', level: 4, power: 100, hp: 38, attack: 3, speedBase: 0.8, speedRandom: 0.7, critical: [-7, 9, -20, -8], body: [-18, 18, -27, 12], knockResistance: 0.8, flags: ['RANGED'], loot: 29 },
  chicken: { kind: 'chicken', id: 19, name: 'Chicken', level: 2, power: 90, hp: 54, attack: 1, speedBase: 1.3, speedRandom: 1.3, critical: [-4, 4, -12, -4], body: [-15, 14, -18, 10], knockResistance: 1, flags: ['BATCH', 'MASS'], loot: 6 },
  crow: { kind: 'crow', id: 6, name: 'Crow', level: 3, power: 110, hp: 34, attack: 5, speedBase: 1.6, speedRandom: 1.5, critical: [5, 18, -1, 16], body: [-23, 21, -14, 20], knockResistance: 1, flags: ['AIR', 'MASS'], airborne: true, loot: 30 },
  fly: { kind: 'fly', id: 10, name: 'Fly', level: 6, power: 30, hp: 2, attack: 2, speedBase: 1.8, speedRandom: 1, critical: [-100, -100, -100, -100], body: [-8.6, 6.35, -7, 6.95], knockResistance: 1, flags: ['AIR'], airborne: true, loot: 33 },
  barbarian: { kind: 'barbarian', id: 7, name: 'Barbarian', level: 7, power: 95, hp: 85, attack: 5, speedBase: 1.2, speedRandom: 0.8, critical: [-9, 7, -19, -8], body: [-9.25, 11.7, -16, 14.95], knockResistance: 0.8, flags: ['BATCH', 'MASS'], loot: 7 },
  lava: { kind: 'lava', id: 4, name: 'Lava', level: 9, power: 300, hp: 72, attack: 12, speedBase: 4.5, speedRandom: 2, critical: [-9, 9, -19, -7], body: [-15.5, 15.45, -17.5, 17.15], knockResistance: 1, flags: ['KAMIKAZE', 'MASS'], loot: 31 },
  boss: { kind: 'boss', id: 999, name: 'Boss', level: 9999, power: 500, hp: 150, attack: 1, speedBase: 1.1, speedRandom: 0.8, critical: [-100, -100, -100, -100], body: [-13, 13, -22, 17], knockResistance: 0, flags: [], loot: 6 },
};

// Порядок важен: исходный selectEnemy перебирает записи именно так.
export const ENEMY_SELECTION_ORDER: readonly EnemyKind[] = ['boss', 'sheep', 'rat', 'archer', 'crow', 'fly', 'barbarian', 'lava', 'chicken'];
// New Game вызывает generateMission(0), хотя на экране уже указан первый день.
export const FIRST_DAY = { day: 1, missionLevel: 0, waves: 5, power: 800, reward: 600, upkeep: 40, castleHp: 40, spawnRate: 15 } as const;
