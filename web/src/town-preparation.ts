import { ItemFactory, type Item } from './items.ts';
import { generateLowLevelMission } from './missions.ts';
import { generateEarlyTownRecruit, type FirstTownRecruit } from './recruits.ts';

export interface FirstTownMission {
  level: 1 | 2 | 3 | 4 | 5 | 6; fixedLv: 1 | 2 | 3 | 4 | 5 | 6; strength: 0; power: 920 | 1040 | 1160 | 1280 | 1400 | 1520; powerOrg: 920 | 1040 | 1160 | 1280 | 1400 | 1520; reward: 620 | 640 | 660 | 680 | 700 | 720;
  hire: false; ragnarok: false; wave: 5; spawnRate: number; group: number[];
  waveType: 0; loot: number[]; newWave: true; time: 30; bossDay: false; bossWave: number;
  note: ''; hpFix: 1; dmgFix: 1; expFix: 1; absorbFix: number; bossKilled: 0;
  noDamage: true; criticalCount: 0; resultOther: 0;
}

export interface FirstTownPreparationInput {
  priorOffers?: readonly (Readonly<Item> | null)[];
  recruitSlots?: Readonly<Record<number, Item | null>>;
  searched?: number;
  absorbFix?: number;
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
  return prepareEarlyTown(random, 1, input);
}

export function prepareEarlyTown(random: () => number, day: 1 | 2 | 3 | 4 | 5 | 6, input: FirstTownPreparationInput = {}): FirstTownPreparation {
  if (![1, 2, 3, 4, 5, 6].includes(day)) throw new RangeError('Town preparation is limited to days 1 through 6.');
  const factory = new ItemFactory(random, { day });
  // clearGameInv сохраняет поля даже у пустых слотов; первая лавка использует только 0 и 1.
  const shop = Array.from({ length: 8 }, (_, index) => input.priorOffers?.[index] ? { ...input.priorOffers[index], num: 0 } as Item : null);
  for (let index = 0; index < 2; index++) {
    shop[index] = factory.randomItem(Math.trunc(random() * day * 250) + 200, 0, shop[index] ?? undefined);
  }
  // Исходный generateShop сначала тратит броски слота 0, затем заменяет его гарантированным оружием.
  shop[0] = factory.randomItem(Math.trunc(random() * day * 200) + 200, 4, shop[0]!);
  if (day === 4) {
    // Распродажа заменяет уже созданный товар: исходные броски и поля слотов остаются значимыми.
    for (let index = 0; index < 2; index++) {
      shop[index] = factory.randomItem(Math.trunc(random() * day * 75) + 500, 3, shop[index]!);
    }
    shop[0] = factory.generate(8, shop[0]!);
    factory.setMod(shop[0], 10);
  }

  const cardPool = [1, 1, 1, 2, 3, 4, 5, 6, 7];
  const cards: number[] = [];
  while (cards.length < 5) {
    const index = Math.trunc(random() * cardPool.length);
    if (cardPool[index] === 0) continue;
    cards.push(-cardPool[index]);
    cardPool[index] = 0;
  }

  // Уровень следующей миссии равен текущему дню; календарная добыча определяется до Rest.
  const mission = generateLowLevelMission(day, day, random, { absorbFix: input.absorbFix }) as FirstTownMission;
  const recruit = generateEarlyTownRecruit(random, day, { previousSlots: input.recruitSlots });
  // Смена кандидата не стирает неиспользованные слоты прежнего ополченца.
  const retainedRecruitItems: Record<number, Item> = {};
  for (const [slot, item] of Object.entries(input.recruitSlots ?? {})) if (item) retainedRecruitItems[Number(slot)] = { ...item };
  recruit.items = { ...retainedRecruitItems, ...recruit.items };
  // При выбранных исходных условиях townMedalBonus/startTownMedal не добавляют бросков или эффектов.
  const flags = { specialSale: 0, egg: true, partyHeld: false, prayed: false, robbed: 0, taunted: 0 } as const;
  // В оригинале этот бросок идёт после автоматического сохранения frame71; вызывающий код сохраняет весь готовый результат.
  const searched = input.searched ?? Math.trunc(random() * 1000);
  return { shop, cards, mission, recruit, flags, searched };
}
