# Sixth-town preparation and economy

The supported boundary is the normal solo Sheriff campaign with the existing
default castle upgrades. Town preparation extends through calendar day 6.
Day 7 settlement is exercised as a controlled source-method case to verify
salary timing; it does not enable a seventh battle or town.

## Preparation and recruitment

`MainTimeline.as:3155` (`frame71`) still orders shop, five negative cards,
mission, recruit and town flags. Day 6 is not a MOD sale day. Shared slots 0–7
retain inactive item metadata; prior recruit slots 47/48 and the existing
search value also survive. `generateSpecialLoot:12064` consumes the optional
Ragnarok roll before adding Crow Statue 1106 at calendar day 6. This is the
mission prepared for the next day. The Day 6 battle uses mission 5, prepared
in town 5 with Holy Grail 1037.

`generateMission:12144` prepares level 6 with power 1520, reward 720, five
waves and spawn interval 13.8. Its waves are outside town preparation.
Absorption retains the medal values owned when the mission was prepared;
six perfect days still provide at most 0.02.

`generateRecruit:7709` evaluates `floor(random * 6 * 0.3) + floor(6 / 5) + 1`.
The resulting recruit has level 2 or 3, one or two unspent skill points,
and cost 450 or 500. The existing `generatePlayer:2075` /
`levelUp(false):10480` growth order is unchanged. Two diagnostic probes straddle
the level threshold at 5/9, advancing the underlying RNG even during the forced
prefix. Previous original captures cover the unchanged equipment and growth
branches for all nine recruit classes.

## Tax, claim and salary timing

`calcTax:3587` gives `max(0, day * 35 - 200)` in normal mode: tax first becomes
10 GP on Day 6. `calcUnkeep:1660` remains 40 GP under the supported defaults.
`renewResult:3411` combines both deductions. Mission 5 reward 700 therefore
settles to 650 GP normally or 860 GP for a perfect game, before other income.
The port retains separate `result.tax` and `result.upkeep` fields while
preserving the original combined deduction.

The city action's eligibility comes from `actList[9]` at 3367 and
`newTitle(0):9752`. Before Day 6 it is unavailable. The actual
`showEventDialog(_dialogActClaim):10631` branch requires 4 AP, spends those AP,
calls `newTitle(1)`, and shows card 3 with the title **New Title!**. It grants
**Honorary Citizen** and a daily salary of 100 GP. It adds no immediate money
and consumes no random numbers. The original UI eligibility condition prevents
repeating the claim after the title has been awarded; the raw dialog function
alone does not supply that guard. Acknowledgment only closes the event window
(`procEventDialog:6624`). Spending AP on repair first can prevent that day's claim.

The port stores `title: 0 | 1` and derives the original `titleMoney` value as
0 or 100, avoiding a second independently mutable value. Older saves initialize
the title to zero without consuming RNG. Settlement happens before entering
town, so a claim in town 6 does not change the already settled Day 6 result.
The first salary belongs to Day 7's result. `renewResult:3443` adds salary
alongside the fame roll; `totalMoney` includes that gross income. The same one
fame draw and two default Active-skill AP draws remain necessary even when fame
and Active are zero.

## Reference boundary

`tools/build_sixth_town_oracle.py` instruments unchanged source methods and
extracts the original preparation statements from `frame71`. As in the earlier
town oracle, the source save call is replaced by a recorded RNG boundary.
The suite contains six complete preparation cases, two recruit-threshold
probes, six Day 6 settlements, two controlled Day 7 salary settlements and six
title eligibility/action/acknowledgment observations. Result and title probes
have their own explicit RNG boundaries; they do not claim complete native
town interaction or browser rendering equivalence.

Two identical Ruffle 0.7.1 runs captured all **22 observations**. Production
matches every observation, including complete item/recruit fields and exact
RNG count/state. The three full-town seeds 42/1/3735928559 consumed 94/112/204
draws and produced recruit levels 2/2/3, with the same stream positions under
the medal variants. Each settlement consumed three draws; title eligibility,
claim, acknowledgment and rejected claims consumed none.

The source confirms Day 6 net rewards of 650/860 and the controlled Day 7
salary case's 735/951, including that day's 45 GP tax. The actual title dialog
reads **New Title!**, uses card 3 and names **Honorary Citizen**. No text or
title anomaly was observed. Four focused tests cover the accepted provenance,
source edge conditions, an extra-draw negative control, retained metadata and
the recruit distribution threshold; earlier fourth/fifth-town references
remain unchanged.

The diagnostic preserves all 3,491 tags outside the modified DoABC payload.
Accepted source fixture: `tests/fixtures/original-sixth-town-trace.json`.
Instrumented SWF SHA-256:
`c16b2cc781301bd5e8c8454521e0d981e5a1daa192a08c1cf670462dfec79201`.
Canonical trace SHA-256:
`f15e87bc77e3192311f02a90be509fcb39947801d56331e4b283d4b4c8fd2e25`.
Rebuild with `python tools/build_sixth_town_oracle.py`, capture the
`?suite=sixth-town` harness twice, then run
`node --experimental-strip-types scripts/compare-sixth-town-reference.ts`
from `web/`.
