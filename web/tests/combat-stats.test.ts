import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemFactory } from '../src/items.ts';
import { createSheriffTraits } from '../src/progression.ts';
import { COMBAT_TRAIT as T, advanceReload, autoReloadReady, criticalType, explosionStats, hitscanHit, hitscanShotModifiers, livingWeaponKill, rampageDuration, recoverAccuracy, shotDamage, shotSpread, weaponBehavior, weaponHitDamage, weaponHitEffects, weaponStats } from '../src/combat-stats.ts';

const factory = () => new ItemFactory(() => 0.1);
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test('starting Sheriff stays unchanged while learned shotgun skills alter the actual combat quantities', () => {
  const gun = factory().generate(3), traits = createSheriffTraits();
  const baseline = weaponStats(gun, traits);
  assert.equal(baseline.canFire, true); assert.equal(baseline.shells, 6);
  assert.equal(baseline.accuracyDiv, 65); assert.equal(baseline.reloadTime, 7);
  assert.equal(baseline.intervalFrames, 25); assert.equal(shotDamage(gun, traits), 16);
  assert.equal(baseline.aimTime, null); assert.equal(baseline.workRate, null);
  const learned = { ...traits, [T.COOL]: 1, [T.ACCURACY]: 1, [T.RELOADING]: 1, [T.DR_HOLLIDAY]: 1, [T.ANTI_ARMOR]: 1 };
  const stats = weaponStats(gun, learned);
  assert.equal(stats.shells, 7); close(stats.accuracyDiv, 65.65);
  assert.equal(stats.reloadTime, 6); close(stats.recovery, 0.0224);
  assert.equal(weaponHitDamage(gun, traits, 16, { critical: 0, target: 'armor' }).damage, 4);
  assert.equal(weaponHitDamage(gun, learned, 16, { critical: 0, target: 'armor' }).damage, 5);
  assert.equal(rampageDuration(traits), 339);
  assert.equal(weaponStats(factory().generate(1), traits).canFire, false);
  assert.equal(weaponStats({ ...gun, num: 0 }, traits).canFire, false);
});

test('source range and tight-mode formulas distinguish shotgun, rifle, recoil and AI aiming', () => {
  const gun = factory().generate(3), traits = createSheriffTraits();
  close(recoverAccuracy(gun, traits, 0.24, 500), 0.22);
  close(recoverAccuracy(gun, traits, 0, 200), 1 / 6);
  assert.equal(recoverAccuracy(gun, traits, 0, 200, true), 0);
  close(weaponStats(gun, traits, { tight: true }).recoil, 0.12);
  close(weaponStats(factory().generate(24), traits, { tight: true }).recoil, 0.4);
  close(shotSpread(gun, traits, 0.24, { tight: true }), shotSpread(gun, traits, 0.24) * 0.75);
  const rifle = factory().generate(4), trained = { [T.RIFLE]: 1, [T.DR_HOLLIDAY]: 1, [T.COOL]: 1, [T.BASE_AIMING]: 1, [T.BASE_TEAMWORK]: 1 };
  const manual = weaponStats(rifle, trained), ai = weaponStats(rifle, trained, { manualControl: false, partyLeadership: 7 });
  // Штраф Dr Holliday в исходнике действует и без дробовика; лишних пуль здесь нет.
  assert.equal(manual.shells, 1); assert.equal(manual.accuracyDiv, 162);
  close(ai.accuracyDiv, 183.6); close(ai.aimTime!, 16.55 * 100 / 107); close(ai.workRate!, 0.055);
  assert.equal(recoverAccuracy(rifle, trained, 0, 100), 0);
  close(shotSpread(rifle, trained, 0, { manualControl: false, fireAtWill: true }), shotSpread(rifle, trained, 0, { manualControl: false }) * 1.5);
});

test('damage truncates at each source assignment before critical, armor/air and boss guarding', () => {
  const gun = { ...factory().generate(3), attack: 17, dmgAir: 50 };
  const traits = { [T.AIMED_SHOT]: 3, [T.NOBLE]: 1, [T.DUELIST]: 1, [T.SNIPER]: 1, [T.ANTI_AIR]: 1 };
  const damage = shotDamage(gun, traits, { missionDamage: 1.25, frenzy: 10, idleCount: 10, rampage: true });
  assert.equal(damage, 70);
  assert.deepEqual(weaponHitDamage(gun, traits, damage, { critical: 1, target: 'air', bossGuard: true }), { damage: 8, beforeGuard: 76, lowDamage: true });
  assert.equal(weaponHitDamage(null, traits, 17.9, { critical: false, target: 'armor' }).damage, 17);
});

test('hitscan rolls retain source strict boundaries, pellet SENSE dilution and one-hit carryover', () => {
  const rifle = factory().generate(13), traits = { [T.SENSE]: 1, [T.ONE_HIT_KILL]: 1 };
  assert.equal(criticalType(traits, 0.05, false, true), 2);
  assert.equal(criticalType(traits, 0.05, false, true, 2), 0);
  assert.equal(criticalType(traits, 0.05, true, true, 2), 1);
  const input = { senseRoll: 0.9, oneHitRoll: 0.05, weakPoint: false, alive: true, boss: false, shells: 1 };
  assert.deepEqual(hitscanHit(rifle, traits, 100, input), { damage: 100, critical: 0, specialHitType: 0 });
  const killed = hitscanHit(rifle, traits, 100, { ...input, oneHitRoll: 0.049 });
  assert.deepEqual(killed, { damage: 999999, critical: 3, specialHitType: 3 });
  assert.deepEqual(hitscanHit(rifle, traits, killed.damage, { ...input, specialHitType: killed.specialHitType }), { damage: 999999, critical: 0, specialHitType: 3 });
  assert.equal(hitscanHit(rifle, traits, 100, { ...input, oneHitRoll: 0, boss: true }).damage, 100);
  assert.throws(() => hitscanHit(rifle, {}, 100, { ...input, oneHitRoll: undefined! }), /ONE_HIT_KILL/);
});

test('burst recoil refund, power shot and last-round bonuses apply in original order', () => {
  const rifle = factory().generate(5);
  const burst = hitscanShotModifiers(rifle, { [T.BURST]: 1 }, 17, { burst: 0, ammoAfterShot: 29, accuracyFix: 0.24 });
  assert.equal(burst.damage, 21); close(burst.accuracyFix, 0.16); assert.equal(burst.burst, 1);
  assert.equal(hitscanShotModifiers(rifle, { [T.BURST]: 1 }, 17, { burst: 2, ammoAfterShot: 27, accuracyFix: 0.24 }).damage, 17);
  const pistol = factory().generate(1);
  const result = hitscanShotModifiers(pistol, { [T.POWER_SHOT]: 1, [T.ONE_SHOT]: 1 }, 17, { burst: 0, ammoAfterShot: 0, accuracyFix: 0.1, powerShotRoll: 0.09 });
  assert.equal(result.damage, 117); assert.equal(result.specialHitType, 2);
});

test('weapon status effects preserve stationary targets and resolve leech before boss protection', () => {
  const gun = { ...factory().generate(3), leech: 10 };
  const target = { speed: 0, speedOrg: 0.42, attack: 12, disarmed: 0, knockBack: 0, resKnock: 0.5 };
  const traits = { ...createSheriffTraits(), [T.CRIPPLE_SHOT]: 1, [T.DISARM]: 1 };
  const result = weaponHitEffects(gun, traits, target, { damageBeforeGuard: 76, castleHp: 30, castleMaxHp: 40, leechRoll: 0 });
  assert.equal(result.castleHp, 38); assert.equal(result.attack, 10); assert.equal(result.disarmed, 20);
  assert.equal(result.speed, 0); assert.equal(result.speedOrg, 0.4); assert.equal(result.knockBack, 6);
  assert.equal(target.speedOrg, 0.42);
  assert.equal(weaponHitEffects(gun, traits, result, { damageBeforeGuard: 10, castleHp: 40, castleMaxHp: 40, leechRoll: 0 }).attack, 10);
  assert.throws(() => weaponHitEffects(gun, traits, target, { damageBeforeGuard: 1, castleHp: 30, castleMaxHp: 40 }), /LEECH/);
});

test('manual and magazine reloads preserve continuation, rampage acceleration and automatic start threshold', () => {
  const traits = createSheriffTraits(), gun = { ...factory().generate(3), ammo: 3, reloadTime: 1 };
  assert.deepEqual(advanceReload(gun, traits), { ammo: 4, reloadTime: 7, completion: null, restarted: true });
  assert.deepEqual(advanceReload({ ...gun, ammo: 4 }, traits), { ammo: 5, reloadTime: 0, completion: 'manual', restarted: false });
  assert.equal(advanceReload({ ...gun, reloadTime: 6 }, traits, true).reloadTime, 4);
  const magazine = { ...factory().generate(2), ammo: 1, reloadTime: 1 };
  assert.deepEqual(advanceReload(magazine, traits), { ammo: 275, reloadTime: 0, completion: 'magazine', restarted: false });
  const automatic = { ...gun, autoReload: 1, reloadTime: 0 };
  assert.equal(autoReloadReady(automatic, -119), false); assert.equal(autoReloadReady(automatic, -120), true);
  assert.equal(autoReloadReady({ ...automatic, ammo: 5 }, -120), false);
});

test('special weapon dispatch and explosion size distinguish every original projectile family', () => {
  const items = factory();
  assert.equal(weaponBehavior(items.generate(16)).chainSpinUp, true);
  assert.equal(weaponBehavior(items.generate(24)).bowDraw, true);
  assert.deepEqual([21, 22, 23, 24, 25, 26, 27, 40].map(id => weaponBehavior(items.generate(id)).projectile), ['grenade', 'rocket', 'bolt', 'arrow', 'arrow', 'bolt', 'gravity', 'flame']);
  assert.equal(weaponBehavior(items.generate(25)).projectileCount, 3);
  assert.equal(weaponBehavior(items.generate(23)).extraPenetrations, 1);
  assert.equal(weaponBehavior(items.generate(27)).immediateReload, true);
  assert.equal(weaponBehavior(items.generate(3)).projectile, null);
  const blast = explosionStats({ [T.DA_BOMB]: 1 }, 17, 'launcher');
  assert.equal(blast.damage, 18); close(blast.radiusX, 69.96); close(blast.radiusY, 58.3);
});

test('living weapon kills enchant exactly at the threshold while retaining original items unchanged', () => {
  const gun = { ...factory().generate(3), livingWeapon: 2, modMax: 1, mod: 0 };
  let draws = 0;
  const random = () => { draws++; return 0; };
  const first = livingWeaponKill(gun, random);
  assert.equal(first.livingWeapon, 1); assert.equal(draws, 0); assert.equal(gun.livingWeapon, 2);
  const evolved = livingWeaponKill(first, random);
  assert.equal(draws, 2); assert.equal(evolved.modMax, 2); assert.equal(evolved.mod, 1);
  assert.equal(evolved.livingWeapon, 100); assert.equal(evolved.attack, 18); assert.equal(first.modMax, 1);
  draws = 0;
  const capped = livingWeaponKill({ ...gun, livingWeapon: 1, modMax: 6, mod: 6 }, random);
  assert.equal(draws, 0); assert.equal(capped.livingWeapon, 1600); assert.equal(capped.modMax, 6);
});
