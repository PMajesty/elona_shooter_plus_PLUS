import { ITEM_TYPE, isOccupiedItem, type Item } from './items.ts';

export interface ConsumableContext {
  castleHp: number; castleMaxHp: number; slotCooling: boolean;
  /** Уже вычисленное PARTY.SUPPLIER, а не уровень навыка. */
  supplierEffect?: number;
}
export type ConsumableEffect =
  | { kind: 'grenade'; damage: number; baseSpeed: 12; weaponSlot: null }
  | { kind: 'repair'; castleHp: number; restoredHp: number; flashFrames: 15 }
  | { kind: 'protection'; frames: number; effectX: 550; effectY: 270 }
  | { kind: 'ragnarok'; enemyId: 13; spawnAttempts: 30; missionTimeDelta: 200; message: "Let's Ragnarok!"; requires: 'original-dinosaur-runtime' };
export type ConsumablePlan =
  | { status: 'unavailable' | 'cooling' | 'unsupported' | 'invalid' }
  | { status: 'ready'; itemAfter: Item; effect: ConsumableEffect; cooldownFrames: number | null; blocksForUpdates: number };

const finiteNonnegative = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** Расчёт useItem; вызывающий код исполняет эффект до применения itemAfter. */
export function planConsumableUse(item: Readonly<Item> | null | undefined, context: ConsumableContext): ConsumablePlan {
  if (!isOccupiedItem(item) || item.type !== ITEM_TYPE.use) return { status: 'unavailable' };
  // Нулевое значение таймера ещё блокирует слот: исходный MovieClip удаляется только при timer < 0.
  if (context.slotCooling) return { status: 'cooling' };
  if (![11, 12, 37, 38].includes(item.id)) return { status: 'unsupported' };
  if (!Number.isInteger(item.ammo) || item.ammo < 0) return { status: 'invalid' };
  if ((item.id === 11 || item.id === 12) && item.ammo === 0) return { status: 'unavailable' };
  if (item.id !== 38 && !finiteNonnegative(item.attack)) return { status: 'invalid' };
  const supplier = context.supplierEffect ?? 0;
  if (!finiteNonnegative(supplier)) return { status: 'invalid' };
  let baseCooldown = 0;
  let effect: ConsumableEffect;
  if (item.id === 11) {
    baseCooldown = 100;
    effect = { kind: 'grenade', damage: Math.trunc(item.attack!), baseSpeed: 12, weaponSlot: null };
  } else if (item.id === 12) {
    if (!finiteNonnegative(context.castleHp) || !finiteNonnegative(context.castleMaxHp) || context.castleHp > context.castleMaxHp) return { status: 'invalid' };
    baseCooldown = 2000;
    const castleHp = Math.min(context.castleMaxHp, context.castleHp + item.attack!);
    // В отличие от городского Free Repair, молот расходуется и при полностью целой стене.
    effect = { kind: 'repair', castleHp, restoredHp: castleHp - context.castleHp, flashFrames: 15 };
  } else if (item.id === 37) {
    effect = { kind: 'protection', frames: Math.trunc(item.attack!), effectX: 550, effectY: 270 };
  } else {
    // Это намерение, а не замена тридцати исходных spawnEnemy фиктивным уроном.
    effect = { kind: 'ragnarok', enemyId: 13, spawnAttempts: 30, missionTimeDelta: 200, message: "Let's Ragnarok!", requires: 'original-dinosaur-runtime' };
  }
  const itemAfter = { ...item, ammo: item.ammo - 1 };
  if (itemAfter.ammo <= 0) itemAfter.num = 0;
  const cooldownFrames = baseCooldown > 0 && itemAfter.ammo > 0 ? Math.trunc(baseCooldown * 100 / (100 + supplier)) : null;
  return { status: 'ready', itemAfter, effect, cooldownFrames, blocksForUpdates: cooldownFrames === null ? 0 : cooldownFrames + 1 };
}

export interface ExplosionStats { damage: number; radiusX: number; radiusY: number; visualScale: number; visualOnly: boolean }

/** explode: DA_BOMB влияет и на урон, и на размеры; вариант explosion2 увеличивает только размеры. */
export function explosionStats(rawDamage: number, daBombEffect = 0, large = false): ExplosionStats {
  if (!Number.isFinite(rawDamage) || rawDamage < -1 || !finiteNonnegative(daBombEffect)) throw new Error('Invalid explosion calculation.');
  const sourceDamage = Math.trunc(rawDamage);
  let multiplier = (100 + daBombEffect) / 100;
  const damage = sourceDamage === -1 ? -1 : Math.trunc(sourceDamage * multiplier);
  if (large) multiplier *= 1.1;
  return { damage, radiusX: 60 * multiplier, radiusY: 50 * multiplier, visualScale: multiplier, visualOnly: sourceDamage === -1 };
}

/** Попадание проверяет строгий прямоугольник вокруг регистрационной точки, без затухания по расстоянию. */
export function explosionContains(stats: Readonly<ExplosionStats>, centerX: number, centerY: number, enemyX: number, enemyY: number, alive: boolean): boolean {
  return alive && !stats.visualOnly && enemyX > centerX - stats.radiusX && enemyX < centerX + stats.radiusX
    && enemyY > centerY - stats.radiusY && enemyY < centerY + stats.radiusY;
}

export interface GrenadeFlight {
  x: number; startX: number; startY: number; targetX: number; targetY: number;
  speed: number; remainingUpdates: number;
}

/** Исходный вертикальный бросок имеет деление на ноль; возвращаем явную границу вместо вымышленных координат. */
export function createGrenadeFlight(startX: number, startY: number, targetX: number, targetY: number, baseSpeed = 12): GrenadeFlight | null {
  if (![startX, startY, targetX, targetY, baseSpeed].every(Number.isFinite) || baseSpeed < 0) throw new Error('Invalid grenade trajectory.');
  if (targetX === startX) return null;
  let speed = baseSpeed * Math.atan2(Math.abs(targetX - startX) * 2, Math.abs(targetY - startY)) * 2 / Math.PI + 0.1;
  const remainingUpdates = Math.trunc(Math.abs(targetX - startX) / speed) + 1;
  if (targetX > startX) speed *= -1;
  return { x: startX, startX, startY, targetX, targetY, speed, remainingUpdates };
}

export function advanceGrenadeFlight(flight: Readonly<GrenadeFlight>): GrenadeFlight & { y: number; shadowY: number; exploded: boolean } {
  if (flight.targetX === flight.startX) throw new Error('The original vertical grenade trajectory is singular.');
  const x = flight.x - flight.speed, remainingUpdates = flight.remainingUpdates - 1;
  const a = 0.003;
  const b = (flight.targetY - flight.startY - a * flight.targetX * flight.targetX + a * flight.startX * flight.startX) / (flight.targetX - flight.startX);
  const c = flight.targetY - a * flight.targetX * flight.targetX - b * flight.targetX;
  const y = a * x * x + b * x + c;
  let shadowY = (flight.targetY - flight.startY) * (x - flight.startX) / (flight.targetX - flight.startX);
  if (flight.targetY < 135) shadowY /= 3;
  shadowY += flight.startY;
  return { ...flight, x, remainingUpdates, y, shadowY, exploded: remainingUpdates <= 0 };
}

/** onEnterFrame: положительная защита и отрицательное затухание имеют разный шаг счётчика. */
export function advanceProtection(counter: number, blueMultiplierAdd = 0): { counter: number; blueMultiplierAdd: number; protectsCastle: boolean } {
  if (!Number.isInteger(counter) || !Number.isFinite(blueMultiplierAdd)) throw new Error('Invalid protection state.');
  if (counter !== 0) {
    counter--;
    if (counter <= 0) {
      if (blueMultiplierAdd >= 0) blueMultiplierAdd -= 0.1;
      counter--;
      if (counter <= -100) { counter = 0; blueMultiplierAdd = 0; }
    } else if (blueMultiplierAdd < 1.3) blueMultiplierAdd += 0.1;
  }
  return { counter, blueMultiplierAdd, protectsCastle: counter > 0 };
}
