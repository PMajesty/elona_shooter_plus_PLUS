export interface TownNotice { cardFrame: number; title: string; text: string; sound?: string }
export interface CompletedTownAction { outcome: 'done'; message: string; notice: TownNotice }
export type TownActionResult = CompletedTownAction | { outcome: 'unavailable' | 'not-enough-ap'; message: string };

/** Текст и карточка принадлежат результату действия; показ/закрытие не меняет симуляцию. */
export function townEvent(cardFrame: number, title: string, text: string, sound?: string): CompletedTownAction {
  return { outcome: 'done', message: `${title}: ${text}`, notice: { cardFrame, title, text, ...(sound ? { sound } : {}) } };
}

export const TOWN_NOTICES = {
  rest: townEvent(11, 'Resting', 'The day is finally over! You relax for the first time today and settle down to enjoy the warm, cozy bed.').notice,
  repair: townEvent(2, 'Free Repair!', 'Citizens acknowledge your hard work and decided to rebuild the castle walls for free!').notice,
  hiredGun: townEvent(7, 'Hired Gun', "You've hired a henchman for this mission. Is it really worth the money? You'll find out soon!", 'soundGood').notice,
  newRecruit: townEvent(7, 'New Recruit!', 'As you review the list of recruits with no real prospects, one of the guards says, "Some traveler just arrived at the inn...looks quite capable in my opinion." Finally, a new recruit!', 'soundGood').notice,
  newGoods: townEvent(8, 'New Goods!', 'You start complaining how the selection of goods is limited. After much fussing, the blacksmith finally gets off his lazy butt, "Alright, alright, lad. Here\'re our special stocks." They have new goods now!', 'soundGood').notice,
} as const;
