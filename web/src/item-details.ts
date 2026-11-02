import { ITEM_TYPE, type Item } from './items.ts';

export function itemDetail(item: Item): string {
  if (item.type === ITEM_TYPE.mod) return `A modification device that can be mounted on a weapon. ${MOD_DETAILS[item.mod] ?? ''}`;
  if (item.id === 11) return `[Usable] When thrown to the ground, it exlodes and deals ${item.attack} damage to all enemies surrounding it.`;
  if (item.id === 12) return `[Usable] Repairs ${item.attack} points of castle HP when used. It's a life saver but has long recharge time.`;
  if (item.id === 35) return `A special token. When dragged onto a shop item, the item get discounted by ${item.attack} gp. Use it wisely!`;
  return ITEM_DETAILS[item.id] ?? '';
}

// Оригинальные английские описания getItemDetail и encRef.
const ITEM_DETAILS: Readonly<Record<number, string>> = {
  "6": "Fur skinned from a dead animal. You can sell it for money.",
  "7": "An armor looted from a dead soldier. You can sell it for some money.",
  "28": "Yummy rat roast. You can sell it for money.",
  "29": "A helmet looted from a dead soldier. You can sell it for some money.",
  "30": "A beautiful feather of some bird. You can sell it for some money.",
  "31": "A piece of meat of some animal or whatever. You can sell it for some money.",
  "32": "Taken from a destroyed machine. Contains some rare metals. You can sell it for some money.",
  "33": "A bottle of insect blood. You can sell it for some money.",
  "34": "Carefully taken from a dead dragon. You can sell it for some money.",
  "37": "[Usable] A special artifact of Jure, Goddess of Healing. Her blessing protects your castle from enemies for a short period.",
  "38": "[Usable] A special artifact. The ancient sword is called Ragnarok for a reason.",
  "101": "\"These guy's do two thing's well, feasting on food bought with their hard earned gold... And earning their gold.\"",
  "102": "\"One day these guy's just showed up shooting... That make's them party crashers and they must be treated accordingly!\"",
  "103": "\"Something seems to have scared the sheep all in your direction, they are not damaging \"Your castle\" intentionally but... You don't care you kill them anyway.\"",
  "104": "\"One night you saw one trip on a rock and then blow up... Now there's a whole army of them!\"",
  "105": "\"Unfortunately you do not carry insurance against damage from these weapons, also unfortunate is the fact that during your recent tax audit they were mistaken as yours and your taxes have been raised accordingly.\"",
  "106": "\"They eat Dragonflies, Dragonflies have taken up residence in your castle...\"",
  "107": "\"Apparently the rat's came over in ships... From the stench you can guess why they left.\"",
  "108": "\"Oddly enough these zealots just showed up and attacked you, you just assume they want to meet their maker sooner.\"",
  "109": "\"An underground spider known to like peace and quiet, how sad for it because you produce neither.\"",
  "110": "\"These insects are in brooding season and are looking for a place to nest... Apparently they've taken a liking to your younger sister.\"",
  "112": "\"You don't know where these came from but by the look's of them it's probably safe to say you've ticked off Mani of Machine.\"",
  "113": "\"Some guy from Vernis showed up the other night and killed a Bard...\"",
  "114": "\"Well with as much killing as you have been doing lately Someone was bound to hold a grudge.\"",
  "115": "\"Some guy from Vernis showed up the other night and killed a Bard...\"",
  "116": "\"Apparently this is just a Juere prototype related to a bigger project, the fact that it's causing you nuisance is purely coincidental.\"",
  "117": "\"These monster's chew through anything. Seems they've eaten everything on the way and the castle food supplies are kinda low...\""
};
const MOD_DETAILS: Readonly<Record<number, string>> = {
  "0": "This mod increases the base accuracy of a weapon.",
  "1": "This mod increases the base accuracy of a weapon.",
  "2": "This mod speeds up the reloading time of a weapon.",
  "3": "This mod improves the firing rate of a weapon. For weapons with a very high firing rate, its effect may be less than satisfactory.",
  "4": "This mod enchances the damage output of a weapon.",
  "5": "This mod adds anti-air capability to a weapon.",
  "6": "This mod adds anti-armor capability to a weapon.",
  "7": "This mod inreases the ammo capacity of a weapon.",
  "8": "This mod grants a weapon an ability to knock back enemies.",
  "9": "This mod grants a weapon an ability to convert inflicted damage to the castle HP.",
  "10": "This handy mod automatically refills your ammo when you're not shooting. Only works on manual reloading guns.",
  "11": "Once mounted, your weapon will be parasitized by this rare creature and slowly develop unique powers.",
  "12": "This handy mod gives auto-fire function to a weapon when mounted. It also boosts the firing rate. For weapons with a very high firing rate, its effect may be less than satisfactory.",
  "13": "This mod reduces the impact of weapon recoil on accuracy."
};
