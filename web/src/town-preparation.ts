import { ItemFactory, type Item } from './items.ts';
import { generateLowLevelMission } from './missions.ts';
import { generateFirstTownRecruit, type FirstTownRecruit } from './recruits.ts';

export interface FirstTownMission {
  level: 1; fixedLv: 1; strength: 0; power: 920; powerOrg: 920; reward: 620;
  hire: false; ragnarok: false; wave: 5; spawnRate: number; group: number[];
  waveType: 0; loot: number[]; newWave: true; time: 30; bossDay: false; bossWave: number;
  note: ''; hpFix: 1; dmgFix: 1; expFix: 1; absorbFix: 0; bossKilled: 0;
  noDamage: true; criticalCount: 0; resultOther: 0;
}

export interface FirstTownPreparationInput {
  priorOffers?: readonly (Readonly<Item> | null)[];
  recruitSlots?: Readonly<Record<number, Item | null>>;
  searched?: number;
}

export interface FirstTownPreparation {
  shop: (Item | null)[];
  cards: number[];
  mission: FirstTownMission;
  recruit: FirstTownRecruit;
  flags: { specialSale: 0; egg: true; partyHeld: false; prayed: false; robbed: 0; taunted: 0 };
  searched: number;
}

export function prepareFirstTown(random: () => number, input: FirstTownPreparationInput = {}): FirstTownPreparation {
  const factory = new ItemFactory(random, { day: 1 });
  // clearGameInv сохраняет поля даже у пустых слотов; первая лавка использует только 0 и 1.
  const shop = Array.from({ length: 8 }, (_, index) => input.priorOffers?.[index] ? { ...input.priorOffers[index], num: 0 } as Item : null);
  for (let index = 0; index < 2; index++) {
    shop[index] = factory.randomItem(Math.trunc(random() * 250) + 200, 0, shop[index] ?? undefined);
  }
  // Исходный generateShop сначала тратит броски слота 0, затем заменяет его гарантированным оружием.
  shop[0] = factory.randomItem(Math.trunc(random() * 200) + 200, 4, shop[0]!);

  const cardPool = [1, 1, 1, 2, 3, 4, 5, 6, 7];
  const cards: number[] = [];
  while (cards.length < 5) {
    const index = Math.trunc(random() * cardPool.length);
    if (cardPool[index] === 0) continue;
    cards.push(-cardPool[index]);
    cardPool[index] = 0;
  }

  // Миссия уровня 1 готовится ещё вечером дня 1; календарная статуя поэтому снова Rat.
  const mission = generateLowLevelMission(1, 1, random) as FirstTownMission;
  const recruit = generateFirstTownRecruit(random, { previousSlots: input.recruitSlots });
  // При выбранных исходных условиях townMedalBonus/startTownMedal не добавляют бросков или эффектов.
  const flags = { specialSale: 0, egg: true, partyHeld: false, prayed: false, robbed: 0, taunted: 0 } as const;
  // В оригинале этот бросок идёт после автоматического сохранения frame71; вызывающий код сохраняет весь готовый результат.
  const searched = input.searched ?? Math.trunc(random() * 1000);
  return { shop, cards, mission, recruit, flags, searched };
}
