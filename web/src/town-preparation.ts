import { ItemFactory, type Item } from './items.ts';
import { generateLowLevelMission, validCampaignDay, type LowLevelMission } from './missions.ts';
import { generateEarlyTownRecruit, type FirstTownRecruit } from './recruits.ts';

export interface FirstTownMission extends LowLevelMission {}

export interface FirstTownPreparationInput {
  priorOffers?: readonly (Readonly<Item> | null)[];
  recruitSlots?: Readonly<Record<number, Item | null>>;
  searched?: number;
  absorbFix?: number;
  shopEngineer?: number;
  missionNegotiator?: number;
  recruitEngineer?: number;
}

export interface TownPreparationEffects { shopEngineer: number; missionNegotiator: number; recruitEngineer: number }
export function validTownPreparationEffects(value: unknown): value is TownPreparationEffects {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const effects = value as Record<string, unknown>;
  const engineer = (amount: unknown) => typeof amount === 'number' && Number.isInteger(amount)
    && (amount === 0 || amount >= 7 && amount <= 52 && (amount - 2) % 5 === 0);
  const negotiator = effects.missionNegotiator;
  return Object.keys(effects).length === 3 && engineer(effects.shopEngineer) && engineer(effects.recruitEngineer)
    && typeof negotiator === 'number' && Number.isInteger(negotiator)
    && (negotiator === 0 || negotiator >= 9 && negotiator <= 45 && (negotiator - 5) % 4 === 0);
}

export interface FirstTownPreparation {
  shop: (Item | null)[];
  cards: number[];
  mission: FirstTownMission;
  recruit: FirstTownRecruit;
  flags: { specialSale: 0; egg: true; partyHeld: false; prayed: false; robbed: 0; taunted: 0 };
  searched: number;
  preparationEffects?: TownPreparationEffects;
}

export function prepareFirstTown(random: () => number, input: FirstTownPreparationInput = {}): FirstTownPreparation {
  return prepareEarlyTown(random, 1, input);
}

export function prepareEarlyTown(random: () => number, day: number, input: FirstTownPreparationInput = {}): FirstTownPreparation {
  if (!validCampaignDay(day)) throw new RangeError('Unsupported campaign town day.');
  const effects: TownPreparationEffects = { shopEngineer: input.shopEngineer ?? 0,
    missionNegotiator: input.missionNegotiator ?? 0, recruitEngineer: input.recruitEngineer ?? 0 };
  if (!validTownPreparationEffects(effects)) throw new RangeError('Invalid original town preparation effects.');
  // frame71 генерирует лавку до generateMission/initPartySkill: здесь действует прежний кэш.
  const factory = new ItemFactory(random, { day, engineer: effects.shopEngineer });
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
  const mission = generateLowLevelMission(day, day, random, { absorbFix: input.absorbFix, negotiator: effects.missionNegotiator }) as FirstTownMission;
  // generatePlayer вызывает initPartySkill до выдачи оружия; кандидат5 не входит в активные0–4.
  const recruit = generateEarlyTownRecruit(random, day, { previousSlots: input.recruitSlots, itemContext: { engineer: effects.recruitEngineer } });
  // Смена кандидата не стирает неиспользованные слоты прежнего ополченца.
  const retainedRecruitItems: Record<number, Item> = {};
  for (const [slot, item] of Object.entries(input.recruitSlots ?? {})) if (item) retainedRecruitItems[Number(slot)] = { ...item };
  recruit.items = { ...retainedRecruitItems, ...recruit.items };
  // При выбранных исходных условиях townMedalBonus/startTownMedal не добавляют бросков или эффектов.
  const flags = { specialSale: 0, egg: true, partyHeld: false, prayed: false, robbed: 0, taunted: 0 } as const;
  // В оригинале этот бросок идёт после автоматического сохранения frame71; вызывающий код сохраняет весь готовый результат.
  const searched = input.searched ?? Math.trunc(random() * 1000);
  const explicitEffects = input.shopEngineer !== undefined || input.missionNegotiator !== undefined || input.recruitEngineer !== undefined;
  return { shop, cards, mission, recruit, flags, searched,
    ...(explicitEffects ? { preparationEffects: effects } : {}) };
}
