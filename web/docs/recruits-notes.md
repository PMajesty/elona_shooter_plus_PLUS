# First-town recruit generation

`generateFirstTownRecruit(random, options?)` ports original
`generateRecruit()` for Day 1, followed by `generatePlayer(_nc, 1, -1)`.
It returns `FirstTownRecruit` using the original field names and numeric IDs.
This is generation of the candidate at slot 5, not recruitment, a party member,
AI behavior or higher-level character growth.

The initial recruit level is always 1, but its random draw is still consumed.
Then the original character generator consumes nine draws, in this order:

1. Sex.
2. Name index in the complete 132-entry `nameBoy` table.
3. Random class from IDs 1–9.
4. Aiming potential (`random / 1.25 + 0.1`).
5. Teamwork potential, using the same formula.
6. Base aiming 900, from 1 to 10.
7. Base teamwork 901, from 1 to 10.
8. `nextTrait`, from 0 to 99.
9. Appearance `pic`, from 0 to 21.

The recruit has level 1, zero experience/skill points/training/kills/earnings,
200 personal gold, default AI 0, no focus (`forcus: -1`), cost 400 and five zero
weapon-experience counters. Boss/wall targeting options and existence are true.
`trait` contains nonzero original IDs; omitted entries correspond to the
original's 1,000-entry zero initialization.

Every class first generates a Long Bow in original inventory slot 45. Class
generation then runs in its original order:

| Class ID | Class | Final slot 45 | Other source writes |
| --- | --- | --- | --- |
| 1 | Hunter | Hunter's Crossbow (23), original overrides | — |
| 2 | Sniper | Hunter's Rifle (4) | — |
| 3 | Rogue | Pistol (1) | — |
| 4 | Militia | Hunter's Rifle (4) | Simple Flame Thrower (40) in 47, Living Weapon level 1; Simple Chain Gun (16) in 48 |
| 5 | Ranger | Cheap Worn HMG (36) | — |
| 6 | Sheriff | Shotgun (3) | — |
| 7 | Duelist | Pistol (1), four mod slots, Ammo level 3 | — |
| 8 | Noble | PDW (2), two mod slots, Accuracy level 3 | — |
| 9 | Guardian | Initial Long Bow (24) | — |

All item generation and fixed enchantments call the existing `ItemFactory`.
Its `enchant` method is now public; its calculations were not changed. Fixed
enchantment ID/level arguments consume no additional random numbers. Weapon
slot-count overrides happen after the original item value was calculated,
matching the source.

`options.previousSlots` supplies original slot metadata, including inactive
`num: 0` items. Generation does not mutate that input. The returned `items` map
contains only the actual source writes: 45, plus 47/48 for Militia. The caller
merges these writes into persistent town slot state and retains unrelated slots.
`itemContext` accepts existing factory context fields with Day 1 fixed. Normal
first-town Sheriff context has no Engineer or recycling-medal bonus.

The hero's unknown hidden base stats are untouched. These recruit values are
actual generation outputs, not reconstructions of the hero. The source
`initPartySkill()` ignores recruit index 5 because `maxAlly` is 5; its call
does not add recruit-generation RNG in this boundary.

Source anchors in `src/original/MainTimeline.as`: `generatePlayer`, 2075–2227;
`generateRecruit`, 7709; `nameBoy`, 9368; recruit index 5, 332; ally inventory
base 40, 742; five weapon skills, 508; 22 appearances, 894; default AI 0, 998.
Class-specific starting trait assignments retain original IDs 103–106, 108,
109, 113, 119 and 121.

Focused tests compare all 132 names directly with the preserved source, cover
all nine class branches with a controlled random stream, verify field/draw
ordering and special item adjustments, and ensure old slot metadata is not
modified. These are source-based tests; the ordered town-preparation oracle
provides separate original-runtime evidence when captured and accepted.
