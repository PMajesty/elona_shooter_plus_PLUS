# Rest and the second day

This is a source-backed integration contract. The Rest and second-town
diagnostic SWFs have preserved resources and two identical browser captures
each. Production Rest matches three final transitions from twelve captured
observations; second-town preparation matches all six snapshots. Accepted
fixtures are under `web/tests/fixtures/`. Dialog presentation and native timing
need separate browser checks. The prepared-wave fixture also covers level-1
mission waves on calendar day 2.

## Transition

Original `showEventDialog` (MainTimeline line 10781) creates card 11 with title
`Resting` and the original bed text. Opening it does not spend AP, heal walls,
refill items, advance the calendar or consume randomness. Rest is allowed at
zero AP.

Acknowledgment uses `procEventDialog` (6631): close menus, `exitTown` (2702),
optional Hardcore save deletion and hired companion generation, increment day,
queue Begin, enter the event timeline. Normal solo play excludes those optional
branches. `exitTown` only removes display objects and listeners.

`frame65` (3092) and `selectEvent` (6244) prepare Begin. `updateAlly` (6776)
resets shooting, shot timer, recoil, rampage, burst, frenzy and idle count.
It refills every non-use inventory slot, preserves remaining consumable ammo,
and clears all reload timers. The selected inventory slot becomes 20. These
resets run again in battle setup, so they must not consume extra ammunition.

After the original Begin presentation, `frame27` (1503) calls
`preGenerateWave` using the existing prepared mission. It records current gold
as `mission.resultBefore`, resets `resultTaken`, clears battle-only flags,
and recalculates current equipment/party stats. It does not regenerate the
mission, heal the castle, spend AP or deduct gold. With no purchased sisters,
randomness in this boundary comes from wave generation.

`build_rest_oracle.py` follows the original dialog and acknowledgment through
the actual event and battle frames. It invokes the original result-frame
handler at delay 89 to skip only the decorative Begin wait. Three controlled
cases include zero AP, damaged/full walls, partially loaded guns, spent grenade
and hammer charges, and medal-60 absorption. Four observations per case are
captured: before, dialog, after acknowledgment, battle ready. This is not evidence
of native browser timing until separately measured.

## Completion and the next town

The level-1 mission reward is 620. A perfect battle multiplies it by 1.3;
default upkeep is 40 and day-2 tax is zero. `renewResult` (3411) consumes the
fame draw even when fame is zero; `townEvent` (6417) then consumes both Active
draws even when Active is zero. Solo Sheriff choices do not include Negotiator,
Accountant, Engineer or Active, so these defaults remain valid without hired
companions or upgrades. Insurance earnings during combat must still survive.

`eventAfterBattle` grants 250 XP and calls `wexpUp` (6907) before loot/skill
screens. For each of the four weapon skills, the threshold is
`currentSkill * 12 + 20`; **strictly greater** weapon XP grants one skill level
and resets that category's weapon XP to zero. At Shotgun 2 the threshold is 44.
XP is per weapon category, so a single aggregate kill counter is insufficient
once players can switch categories.

`prepareEarlyTown(random, day, input)` covers calendar days 1 and 2. Shop budgets
scale by day; item generation receives that same day; cards retain source
ordering and duplicate-index retries. Recruit level remains 1 for both days,
but its level draw is still consumed. Prior recruit slots 45/47/48 and shared
offer metadata survive replacement. Existing `searched` is retained without
a new draw. Day 2 prepares mission level 2 (power 1040, reward 640, spawn rate
14.6, Sheep statue), but its waves are deliberately unsupported until the next
battle slice is implemented.

The separate `build_second_town_oracle.py` covers three seeds with and without
medal 60, retained Militia equipment and an existing search value. Accepted
first-town fixtures remain unchanged.

The Rest adapter compares actual `Simulation.startNextDay`, with exact RNG,
known item metadata, gun refills, spent consumables, combat counters and mission
waves. Completely uninitialized inventory slots normalize to `null`; the
source's newly assigned empty-slot `reloadTime = 0` is always overwritten by
later item generation. Initialized and inactive item metadata is preserved.
The source also records `resultTaken`, burst, frenzy and idle count, which are
outside the current model comparison. Intermediate dialog observations are
not reported as twelve independently compared port states.

## Early medals

- Newcomer 40 is awarded at battle start; it has no gameplay bonus.
- Perfect-game count increments when leaving Clear. Medal 60 is awarded at
  the first perfect game; medals 61–63 need 4/7/10. Each owned medal adds 0.01
  absorption to subsequently generated missions. Awarding it precedes first
  town preparation, so it can affect Day 2.
- Critical medals 70/71/72 require 10/30/50 critical kills in one mission.
  Their Luck/Sense/Accuracy bonuses apply only in a later `gameStart` through
  `geneMedalBonus`, not immediately to the current hero.
- Clear's fireworks countdown begins at 650; when it becomes negative,
  medal 93 is awarded. No original behavior reads medal 93, despite the bonus
  described in its text. Do not invent an effect.
- Surviving Ragnarok awards 92 when leaving Clear; its Luck bonus applies
  to future starts. The original wage formula also uses it for a 3% discount,
  which does not change a solo party's zero wages.
- Sheriff level 10 awards 67 and unlocks Noble. Action, upgrade, badge and
  day-10-plus medals are outside the enabled first-two-day actions.

`getMedal` immediately persists original global medal flags through
`kongregateStatsIdx` and `saveIndex`. A campaign save can preserve earned IDs,
but future-New-Game persistence needs an explicit index equivalent. The source
anchors are `resultMedal` 2815, `criticalMedal` 5705, `startBattleMedal` 6732,
`geneMedalBonus` 8807 and `exitMenuResult` 11749. Current-campaign party effects
of Defender, Insurance and Last Hope must be handled by the battle damage path.
