import { SAVE_VERSION } from '../src/save-version.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import { Simulation } from '../src/simulation.ts';
import { generateHero, levelUpHero } from '../src/hero.ts';
import { HERO_CLASSES, availableHeroTraits, applyHeroChoice, rollHeroChoices, type HeroClass } from '../src/hero-classes.ts';
import { ALL_TRAITS, CLASS_CHOICE_ORDER } from '../src/party-progression.ts';
import { describeTrait } from '../src/progression.ts';
import { ENEMIES } from '../src/content.ts';

const classes = Object.keys(HERO_CLASSES) as HeroClass[];
const seeded = (seed: number) => () => {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return (seed >>> 0) / 4294967296;
};

test('all eight original hero classes get their class, weapon skills, grenade and original gear', () => {
  const weaponIds = { rogue: 1, hunter: 23, sheriff: 3, militia: 4, sniper: 4, ranger: 36, duelist: 1, noble: 2 };
  for (const classId of classes) {
    const hero = generateHero(seeded(123), classId);
    assert.equal(hero.traits[HERO_CLASSES[classId].id], 1);
    assert.equal(hero.inventory[0]!.id, weaponIds[classId]);
    assert.ok((hero.traits[hero.inventory[0]!.reqTrait!] ?? 0) >= hero.inventory[0]!.reqLv!);
    assert.equal(hero.inventory[1]!.name, "Soldier's Grenade");
    assert.equal(hero.inventory[1]!.ammo, 5);
    for (const [id, level] of Object.entries(HERO_CLASSES[classId].traits)) assert.equal(hero.traits[Number(id)], level);
  }
  const hunter = generateHero(seeded(1), 'hunter').inventory[0]!;
  assert.equal(hunter.name, "Hunter's Crossbow"); assert.equal(hunter.attack, 30); assert.equal(hunter.shootRate, 32);
  const militia = generateHero(seeded(1), 'militia');
  assert.equal(militia.inventory[2]!.name, 'Simple Flame Thrower');
  assert.equal(militia.inventory[2]!.attack, 10); assert.equal(militia.inventory[2]!.reqLv, 1);
  assert.equal(militia.inventory[3]!.name, 'Simple Chain Gun');
});

test('class and appearance rerolls stay in creation; Proceed grants Little Girl once to Rogue and Hunter', () => {
  for (const classId of classes) {
    const sim = new Simulation(12, { deferOpeningWaves: true });
    assert.ok(sim.rerollOpeningHero(classId)); assert.ok(sim.rerollOpeningHero());
    assert.equal(sim.state.player.classId, classId);
    assert.equal(sim.state.party.slots.filter(slot => slot.exists).length, 0);
    assert.ok(sim.startOpeningBattle()); assert.equal(sim.startOpeningBattle(), false);
    const girl = sim.state.party.slots[0];
    if (classId === 'hunter' || classId === 'rogue') {
      assert.equal(girl.member?.name, 'Little Girl'); assert.equal(girl.member?.appearance, 50);
      assert.equal(girl.member?.ai, 6); assert.equal(girl.member?.potentialAim, 0.7);
      assert.equal(girl.weapon?.id, 24); assert.ok(girl.member?.aiState);
      assert.equal(sim.state.partySkills.effects[113], 7);
    } else assert.equal(girl.exists, false);
    assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave());
  }
});

test('every class has its source skill pool, descriptions, valid choices and class-specific level growth', () => {
  for (const classId of classes) {
    const hero = generateHero(seeded(93), classId);
    const choices = rollHeroChoices(classId, 5, hero.traits, seeded(44));
    assert.equal(new Set(choices).size, 3);
    assert.ok(choices.every(id => CLASS_CHOICE_ORDER[HERO_CLASSES[classId].id].includes(id)));
    for (const id of choices) assert.ok(describeTrait(id, hero.traits, ALL_TRAITS).description.length);
    const before = hero.traits[choices[0]] ?? 0;
    assert.equal(applyHeroChoice(classId, hero.traits, choices, choices[0]), true);
    assert.equal(hero.traits[choices[0]], before + 1);
    assert.equal(applyHeroChoice(classId, hero.traits, choices, 900), false);
    const grown = levelUpHero({ ...hero, exp: 1100 }, hero.hero, seeded(8), classId);
    assert.equal(grown.level, 2); assert.equal(grown.traits[HERO_CLASSES[classId].id], 2);
    assert.equal(grown.skillPoints, 1); assert.equal(grown.exp, 100);
    assert.ok(availableHeroTraits(classId, 2, grown.traits).length);
    if (classId !== 'sheriff') assert.equal(grown.traits[6], undefined);
  }
});

test('all class combats replay identical state and events across JSON restoration, including companion AI and Militia timer', () => {
  for (const classId of classes) {
    const sim = new Simulation(42, { heroClass: classId });
    for (let tick = 0; tick < 330; tick++) sim.tick({ aimX: 200, aimY: 220 });
    const restored = Simulation.fromSave(JSON.parse(JSON.stringify(sim.toSave())));
    for (let tick = 0; tick < 750; tick++) {
      const target = sim.state.enemies.find(enemy => enemy.hp > 0 && !enemy.removed);
      const input = { aimX: target?.x ?? 200, aimY: (target?.y ?? 220) - 15, firePressed: tick % 15 === 0, fireHeld: true };
      sim.tick(input); restored.tick(input);
      assert.deepEqual(restored.events, sim.events);
    }
    assert.deepEqual(restored.toSave(), sim.toSave());
  }
});

test('Militia automatically launches a free class grenade and preserves its cooldown', () => {
  const sim = new Simulation(47, { heroClass: 'militia' });
  let thrown = false;
  for (let tick = 0; tick < 2000 && sim.state.phase === 'battle'; tick++) {
    sim.tick({});
    if (sim.events.some(event => event.type === 'grenade' && event.actorSlot === 0)) {
      thrown = true; assert.equal(sim.state.inventory[1]!.ammo, 5);
      assert.equal(sim.state.player.grenadeCount, 321);
      assert.ok(sim.state.projectiles.some(projectile => projectile.damage === 27));
      assert.deepEqual(Simulation.fromSave(sim.toSave()).toSave(), sim.toSave()); break;
    }
  }
  assert.ok(thrown, 'The class grenade must occur during an ordinary battle.');
});

test('v24 Sheriff saves migrate while impossible class identities and skill selections are rejected', () => {
  const legacy = new Simulation(13).toSave() as unknown as Record<string, any>;
  legacy.version = 24; delete legacy.player.grenadeCount;
  const migrated = Simulation.fromSave(legacy).toSave();
  assert.equal(migrated.version, SAVE_VERSION); assert.equal(migrated.player.grenadeCount, 325);
  assert.equal(migrated.rng, legacy.rng); assert.deepEqual(migrated.inventory, legacy.inventory);
  const invalid = new Simulation(13, { heroClass: 'rogue' }).toSave();
  invalid.player.traits[6] = 1;
  assert.throws(() => Simulation.fromSave(invalid), /traits/);
  const invalidTimer = new Simulation(13, { heroClass: 'militia' }).toSave();
  invalidTimer.player.grenadeCount = -1;
  assert.throws(() => Simulation.fromSave(invalidTimer), /grenade/);
});

for (const classId of classes) test(`${classId}: natural first two battles, earned choices, towns and Rest remain connected`, () => {
  let sim = new Simulation(42, { heroClass: classId });
  for (let day = 1; day <= 2; day++) {
    for (let tick = 0; tick < 8000 && sim.state.phase === 'battle'; tick++) {
      const target = sim.state.enemies.filter(enemy => enemy.hp > 0 && !enemy.removed).sort((a, b) => b.x - a.x)[0];
      const rect = target ? ENEMIES[target.kind].critical : [0, 0, 0, 0];
      const weapon = sim.weapon!;
      sim.tick({ aimX: target ? target.x + (rect[0] + rect[1]) / 2 : 300,
        aimY: target ? target.y + (rect[2] + rect[3]) / 2 : 230,
        firePressed: Boolean(target) && weapon.reloadTime === 0 && weapon.ammo > 0,
        fireHeld: weapon.automatic && Boolean(target), reload: weapon.ammo === 0,
        ...(target?.kind === 'boss' && tick % 150 === 0 ? { slot: 1 } : {}),
      });
    }
    assert.equal(sim.state.phase, 'victory', `${classId} must finish Day ${day}`);
    while (sim.state.postbattle === 'loot' || sim.state.postbattle === 'boss-loot') assert.ok(sim.finishLoot());
    while (sim.state.postbattle === 'skill') {
      sim = Simulation.fromSave(sim.toSave());
      assert.ok(sim.chooseSkill(sim.state.skillChoices[0]));
    }
    assert.equal(sim.state.postbattle, 'result'); assert.ok(sim.enterTown());
    if (sim.state.castleHp < sim.state.castleMaxHp) assert.equal(sim.freeRepair(), 'repaired');
    sim = Simulation.fromSave(sim.toSave());
    assert.equal(sim.state.player.classId, classId); assert.equal(sim.state.day, day);
    if (day === 1) { assert.ok(sim.startNextDay()); sim = Simulation.fromSave(sim.toSave()); }
  }
});

