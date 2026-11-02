// Исходные определения getMedalInfo; генерируется tools/extract_web_assets.py.
export interface MedalInfo { name: string; condition: string; earned: string; bonus: string }
export const MEDALS: Readonly<Record<number, MedalInfo>> = {
  "40": {
    "name": "Newcomer",
    "condition": "Just play!",
    "earned": "Given when you first play Elona Shooter. It's a free medal!",
    "bonus": "No Bonus"
  },
  "41": {
    "name": "Experienced",
    "condition": "Survive 10 days.",
    "earned": "You've survived 10 days. It's not that hard to accomplish it but well.",
    "bonus": "+100 GP Starting Money"
  },
  "42": {
    "name": "Survivor",
    "condition": "Survive 20 days.",
    "earned": "You've survived 20 days. You sure know how to kill sheep!",
    "bonus": "+200 GP Starting Money"
  },
  "43": {
    "name": "Veteran",
    "condition": "Survive 35 days.",
    "earned": "You've survived 35 days. This is something.",
    "bonus": "+300 GP Starting Money"
  },
  "44": {
    "name": "Elite",
    "condition": "Survive 50 days.",
    "earned": "You've survived 50 days! Nice!",
    "bonus": "+500 GP Starting Money"
  },
  "45": {
    "name": "Savior",
    "condition": "Survive ?? days.",
    "earned": "You've survived 80 days! You are the savior.",
    "bonus": "+750 GP Starting Money"
  },
  "46": {
    "name": "Choosen one",
    "condition": "Survive, survive!",
    "earned": "You've survived 150 days! I don't believe it!",
    "bonus": "+1000 GP Starting Money"
  },
  "50": {
    "name": "Chicken Lover",
    "condition": "Buy 30 chickens.",
    "earned": "You've bought 30 chickens. You love chickens, chickens love you!",
    "bonus": "+5% Egg Revenue"
  },
  "51": {
    "name": "Chicken Prince",
    "condition": "Buy 60 chickens.",
    "earned": "You've bought 60 chickens. You love chickens, chickens love you!",
    "bonus": "+15% Egg Revenue"
  },
  "52": {
    "name": "Chicken King",
    "condition": "Buy lots of chickens!",
    "earned": "You've bought 120 chickens. You love chickens, chickens love you!",
    "bonus": "+30% Egg Revenue"
  },
  "53": {
    "name": "Sister Lover",
    "condition": "Get 10 younger sisters.",
    "earned": "You've convinced 10 of your younger sisters to commit suicide bombing. Keep going!",
    "bonus": "+10% Bomb Damage"
  },
  "54": {
    "name": "Sister Mania",
    "condition": "Get 20 younger sisters.",
    "earned": "You've convinced 20 of your younger sisters to commit suicide bombing. More sisters!",
    "bonus": "+20% Bomb Damage"
  },
  "55": {
    "name": "Sister Master",
    "condition": "You need to become a beast.",
    "earned": "You've convinced 30 of your younger sisters to commit suicide bombing. You are nasty!",
    "bonus": "+30% Bomb Damage"
  },
  "60": {
    "name": "Novice Defender",
    "condition": "Score a perfect game.",
    "earned": "You've marked 1 perfect game. Good.",
    "bonus": "+1% Castle Wall Absorption"
  },
  "61": {
    "name": "Skilled Defender",
    "condition": "Score 4 perfect games.",
    "earned": "You've marked 4 perfect games. Good good.",
    "bonus": "+1% Castle Wall Absorption"
  },
  "62": {
    "name": "Adept Defender",
    "condition": "Score 7 perfect games.",
    "earned": "You've marked 7 perfect games. Great!",
    "bonus": "+1% Castle Wall Absorption"
  },
  "63": {
    "name": "Master Defender",
    "condition": "Score perfect games like hell!",
    "earned": "You've marked 10 perfect games. Great! I mean it...really!",
    "bonus": "+1% Castle Wall Absorption"
  },
  "65": {
    "name": "Hunter's Award",
    "condition": "Grow your hunter.",
    "earned": "You've made a level 10 hunter.",
    "bonus": "Unlocks Ranger Class"
  },
  "66": {
    "name": "Rogue's Award",
    "condition": "Grow your rogue.",
    "earned": "You've made a level 10 rogue.",
    "bonus": "Unlocks Duelist Class"
  },
  "67": {
    "name": "Sheriff's Award",
    "condition": "Grow your sheriff.",
    "earned": "You've made a level 10 sheriff.",
    "bonus": "Unlocks Noble Class"
  },
  "68": {
    "name": "Militia's Award",
    "condition": "Grow your militia.",
    "earned": "You've made a level 10 militia.",
    "bonus": "Unlocks Sniper Class"
  },
  "70": {
    "name": "Killer",
    "condition": "Score 10 critical hits in one battle.",
    "earned": "You've scored 10 critical kills in a battle. Lucky shots maybe?",
    "bonus": "Starting Bonus skill:Luck +1"
  },
  "71": {
    "name": "Assassin",
    "condition": "Score 30 critical hits in one battle.",
    "earned": "You've scored 30 critical kills in a battle. Fear the assassin!",
    "bonus": "Starting Bonus skill:Sense +1"
  },
  "72": {
    "name": "Unseen Hand",
    "condition": "Critical hits? You wonder what's so special about them.",
    "earned": "You've scored 50 critical kills in a battle. Be thankful you don't have to clean up the mess.",
    "bonus": "Starting Bonus skill:Accuracy +2"
  },
  "80": {
    "name": "Prayer",
    "condition": "Pray to your God! (15 times)",
    "earned": "You've prayed 15 times. You must be a religious person.",
    "bonus": "+1 AP chance"
  },
  "81": {
    "name": "Provoker",
    "condition": "Taunt'em! (10 times)",
    "earned": "You've taunted 10 times. You know lots of slang!",
    "bonus": "+1 AP chance"
  },
  "82": {
    "name": "Boomer",
    "condition": "Hold parties. Lots of parties. (10 times)",
    "earned": "You've held 10 parties. Don't you ever get tired?",
    "bonus": "+1 AP chance"
  },
  "83": {
    "name": "Gun Mania",
    "condition": "Don't forget to recycle your gun. (10 times)\t",
    "earned": "You've recycled 10 guns. A true ecologist!?",
    "bonus": "+15% Modding Bonus"
  },
  "84": {
    "name": "Robber",
    "condition": "Guess what? Rob some people! (20 times)",
    "earned": "You've robbed 20 times. Everyone hates you!",
    "bonus": "+25% robbery money"
  },
  "86": {
    "name": "Hard Badge",
    "condition": "The name tells eveything. It is hard to get, but not impossible.",
    "earned": "You've achieved the Hard Badge! Dare to challenge the impossible badge?",
    "bonus": "+1 Starting Inventory Slot"
  },
  "87": {
    "name": "Impossible Badge",
    "condition": "And this is impossible!",
    "earned": "You've achieved the Impossible Badge! After all, it wasn't that impossible.",
    "bonus": "+20 Starting Fame"
  },
  "91": {
    "name": "Kongregate",
    "condition": "Isn't there a banner somewhere?",
    "earned": "You've visited the Kongregate Web. Good for you!",
    "bonus": "3% Wage discount"
  },
  "92": {
    "name": "Ragnarok Surviver",
    "condition": "Ragnarok is an ancient sword you will find eventually.",
    "earned": "You've survivied Ragnarok. Just unbelievable.",
    "bonus": "Starting Bonus skill:Luck +1"
  },
  "93": {
    "name": "Ha-na-bi",
    "condition": "Ha-na-bi means fireworks.",
    "earned": "You've watched fireworks long enough. I hope you had a good relief.",
    "bonus": "+25 Fireworks"
  },
  "94": {
    "name": "Elonian",
    "condition": "Given when you win the first round.",
    "earned": "You've successfully won the first round of the game. Congratulations!",
    "bonus": "You will be able to import weapons to Elona, someday!"
  },
  "95": {
    "name": "Hardcore",
    "condition": "Survive 20 days in Hardcore mode.",
    "earned": "You've survived 20 days in Hardcore Mode. Way to go!",
    "bonus": "Starting Bonus skill:Sense +1"
  },
  "96": {
    "name": "Ultimate Hardcore",
    "condition": "Survive 40 days in Hardcore mode.",
    "earned": "You've won the first round of the game in Hardcore Mode. You're not a human.",
    "bonus": "Starting Bonus Weapon:GravityGun"
  },
  "97": {
    "name": "RNG Award",
    "condition": "Survive, survive! And survive in Hardcore mode!",
    "earned": "You've survived 80 days in Hardcore Mode. RNG loves you.",
    "bonus": "Starting Bonus skill:Luck +3"
  }
};
