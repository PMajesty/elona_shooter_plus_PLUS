# Eighth-town preparation

Day 8 uses the existing town preparation sequence with a later recruit
distribution and the first possible Mk-3 weapon variation. It prepares mission
8 for a future battle; the active Day 8 battle uses mission 7 prepared in town
7. This module does not enable Day 9 combat.

## Preparation and saved metadata

Original `MainTimeline.as:3155` (`frame71`) orders the shop, five negative
cards, `generateMission(game.day)`, the candidate, medal effects and town flags.
The existing search value survives; its one-time random initialization occurs
after the source save boundary. Shared offer/shop slots 0–7 retain inactive
item metadata. Candidate equipment retains slots 45 and any old Militia slots
47/48, including inactive records. Preparation reads those records without
mutating its inputs. Canonical party candidate transfer is the caller's job.

Day 8 is not a MOD sale day (`day % 10 == 4`). `generateShop:5246` therefore
keeps the normal sequence of two item rolls followed by replacement of slot 0
with a gun in the supported zero-Smith context. Existing cached Engineer and
Negotiator inputs remain supported by the production helper; the isolated
Day 8 reference uses the original default solo Sheriff context.

`generateSpecialLoot:12064` still consumes its optional Ragnarok roll, but
calendar day 8 matches no guaranteed-item condition. Prepared mission 8 has
power 1760, base reward 760, five waves and interval 13.4
(`generateMission:12144`). Its loot is empty or `[1038]`. Wave generation is a
separate boundary. Eight perfect completions add no new medal: the next
perfect-day threshold after seven is ten (`resultMedal:2815`). The prepared
mission can retain the existing 0.03 absorption from medals 60–62.

## Recruits and weapons

`generateRecruit:7709` requests
`floor(random * 8 * 0.3) + floor(8 / 5) + 1`, producing levels 2–4. The
distribution changes at 5/12 and 5/6. No new recruit level or class branch is
needed. `generatePlayer:2075` still runs ordered aiming/teamwork growth via
`levelUp(false):10480` before nextTrait, portrait and equipment. Levels 2–4
retain one to three unspent points and costs 450–550. Town-save validation
accepts this range while keeping prior towns bound to their own day.

`weaponVariation:13126` has a consequential day threshold:
`limit(1 + int(random * (day / 5 + 2)), 1, 2 + day / 8)` is assigned to an
integer parameter. Day 7 therefore caps at Mk-2, while Day 8 allows Mk-3.
At day 8 the Mk-2/Mk-3 threshold is 5/9; a high roll that initially requests
level 4 still caps at 3. The existing `ItemFactory.varyWeapon` already follows
this arithmetic, including higher damage, slower firing, price and skill
requirements. No free skill levels or alternate item-generation path is added.

## Settlement

`calcTax:3587` gives 80 GP on Day 8. Default upkeep remains 40; purchased
upgrades and companion wages continue through the existing economy code.
The active mission 7 pays 740, or 962 for a perfect game. In the reference's
solo/default context this nets 620/842 without a title and 720/942 with the
first title's 100 GP salary. `renewResult:3411` and `townEvent:6417` retain
one fame draw and two Active-skill draws; default AP is four. The first title
remains eligible if unclaimed, while the next tier requires day greater than
ten (`newTitle:9752`). There is no new title tier at day 8.

## Validation boundary

The focused production checks cover shared inactive metadata, calendar and
absorption validation, both recruit distribution thresholds and the Mk-3
boundary. Accepted Day 1–7 preparation reference fixtures remain unchanged.

`tools/build_eighth_town_oracle.py` builds an independent original-source
diagnostic with six full-town cases, four recruit threshold probes, four
weapon-variation probes and four normal/perfect title0/1 result cases. Its
controlled random prefixes advance the underlying xorshift stream on every
draw. It observes the original save boundary without writing an original
save. Generation and result cases use separate declared RNG boundaries.

Two identical Ruffle 0.7.1 runs captured all **18 observations**, and all 18
matched production on the first comparison. Full-town seeds 42/1/3735928559
consume 94/112/204 draws and produce level 2/2/3 candidates. Those six towns
have empty calendar loot; the separate threshold probes exercise level 4.
Original Shotgun variation records Mk-2 attack20/required-level6 and Mk-3
attack23/required-level8. Each variation uses one draw; each result uses three.

Six focused tests pass, including negative controls for an extra preparation
draw and incorrectly retaining the earlier weapon cap without changing RNG.
Accepted fixture: `tests/fixtures/original-eighth-town-trace.json`.
Instrumented SWF SHA-256:
`67fd0cb58536987e7c0a2d897df4410e431296c6140cfe2f0dae50552c1f760b`.
Canonical trace SHA-256:
`663dd46cf1f2718ed474d8985ece10fa2b2dca27b4187255810b88b9e4d3591c`.
All 3,491 non-code resources are preserved. Run
`python tools/build_eighth_town_oracle.py`, capture
`?suite=eighth-town` twice, then run
`node --experimental-strip-types scripts/compare-eighth-town-reference.ts`
from `web/`. Browser presentation and whole-campaign replay are separate checks.

`tests/day-eight-save.test.ts` separately checks controlled settlement/Rest
transitions, v22 migration, existing party and upgrades, historical medal
absorption, Day 8 settlement and the blocked Day 9 transition. Its Lava checks
exercise production warning/companion targeting, live and corpse save replay,
and invalid import rejection. Earlier battles in these focused tests are
completed through an explicit controlled boundary; they do not establish
ordinary campaign survival or replace the independent Lava source comparison.
