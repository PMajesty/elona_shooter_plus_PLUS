# Sandbags: source boundary and independent reference

Status: **25 original observations matched and accepted**, from two identical
Ruffle runs. Three focused reference tests pass. This document does not claim
browser publication, full native scheduling or a complete Castle implementation.

Source anchors refer to preserved `src/original/MainTimeline.as`, with enemy
retaliation behavior in the SWF-exported `enemy.as`.

## Purchase, upkeep and persistence

Castle page0 index2 is `Sandbag`, stored in `game.sandbag`
(Main:9185–9186). The starting level is0 (Main:9237–9242). `getUpgradeCost`
returns `int(level * level * 240 + 1000)` until level10; at10 it returns0,
disabling the tile (Main:12630–12632,12674–12677). The first two purchases cost
1000GP and1240GP. The level9→10 purchase costs20440GP. `upgradeMax` displays10
(Main:9246).

The normal Castle tile handler checks `possible`, plays payment sound,
deducts the current quote, calls `upgradeDone`, rebuilds the tiles and updates
the interface (Main:13526–13555). `upgradeDone` increments `game.sandbag`
through the common field path without a special Sandbag effect
(Main:7301–7323). It does not heal, spend AP, consume RNG, change totalMoney,
refresh party skills or regenerate the prepared mission. There is no purchase
confirmation dialog.

`calcUnkeep` adds40GP per level (Main:1666). Starting Castle upkeep is therefore
40/80/440GP at Sandbag levels0/1/10. A purchase does not reprice an already-paid
result; later `renewResult` obtains the new upkeep (Main:3411–3452). The source
save clones the entire `game` object (Main:6311–6349). Browser save version18
uses `sandbagLevel`, restricted to integer0–10; earlier saves initialize0.

The UI description is `Stronger sandbags will absorb more damage done to the wall.`
Its positive-level detail uses `int(100 - castleAbsorb() * 100)` percent
(Main:11876); keep that source expression rather than replacing it with a new
display-rounding rule. Level0 instead shows
`[ You haven't acquired this upgrade yet ]` due to the common hint tail
(Main:11892–11902). The label is `Sandbag`, then `Sandbag Lv N`
(Main:1322–1327).

## Damage arithmetic and effect order

`castleAbsorb()` returns `1 - game.sandbag * 0.05` (Main:1423–1425).
`damageCastle` takes an integer damage parameter, then uses
`param2 *= castleAbsorb() - mission.absorbFix` (Main:10859,10892).
Assigning that product back to the integer parameter truncates it. Only then
does the source clamp damage to at least1 and subtract it from current HP
(Main:10893–10897).

For nonnegative supported inputs the effective calculation is:

```text
max(1, trunc(trunc(rawDamage) * ((1 - sandbagLevel * 0.05) - missionAbsorbFix)))
```

Mission/medal absorption is subtracted from the Sandbag multiplier, rather than
applied as a separate multiplication. One-point attacks still inflict at least
one damage at maximum Sandbag level. The source does not introduce a new random
draw for absorption.

The surrounding method retains this order (Main:10859–10916):

1. Immunity returns immediately; active protection plays defense sound and
   returns before party effects.
2. A defined attacker and nonzero Guardian cause retaliation. One shared RNG
   draw selects a credit owner from `PARTY.GUARDIAN_LIST`, then original enemy
   `damage` executes. That list contains existing actors, not just actors who
   contribute Guardian (Main:8499–8509).
3. Insurance credits current and cumulative money before Defender is tested.
4. Defender consumes its random draw and may stop the incoming damage.
5. The source applies integer Sandbag/mission absorption and the minimum1 rule.
6. Last Hope consumes its gate draw, then a physical actor-selection draw when
   the gate passes. A valid selected actor must not already be in rampage and
   must pass the source threshold direction. Hero rampage also consumes the
   existing two shake draws. Sandbags must not reorder any of this work.

## Diagnostic scope

`tools/build_castle_sandbag_oracle.py` preserves original `damageCastle`,
`castleAbsorb`, purchase, upkeep and rampage method bodies apart from reversible
RNG/event observations. The real enemy class supplies nonlethal Guardian
retaliation against a Sheep. Enemy randomness uses the same diagnostic stream.
All non-code SWF tags and tag ordering are verified unchanged.

Twelve damage snapshots retain before/after states, generated actor traits,
cached party effects, enemy state, Guardian damage/owner, ordered source
observations and every RNG draw/state. They cover Sandbag0/1/10, mission
absorption0/.01/.02, fractional input coercion, minimum damage, Insurance and
Defender, Guardian before defense, Last Hope success/low-HP failure, and the
early protection gate. Explicit prefixes target those branches while advancing
the underlying xorshift32 state for every draw. These inputs do not establish
that all trait combinations are naturally acquired during the enabled campaign.

Six town scenarios use actual continued-town frame71, original tile2 shape
hits and `MouseLDownFunc_town`. They produce thirteen snapshots: six starting
states and seven clicks, covering insufficient funds, first/second/sequential
purchases, the final level and cap. Every town input has AP0 and retained
totalMoney1234. Fresh-town preparation is outside this boundary.

The comparator calls production `buyCastleUpgrade('sandbag')` and the actual
private `damageCastle`. It checks quotes, levels, HP, upkeep, party effects,
RNG, retaliation credit and rampage. Purchase checks also protect prepared
town, party/cache, other Castle fields and settled result from unintended
changes. Source UI text and effect-order observations supplement state checks;
actual browser controls, save migration and connected battle pacing remain
separate integration evidence.

Build with `python tools/build_castle_sandbag_oracle.py`, capture
`http://127.0.0.1:5176/?suite=castle-sandbag`, then run
`node --experimental-strip-types scripts/compare-castle-sandbag-reference.ts`
from `web`. The diagnostic uses `.build/oracle/castle-sandbag-reference.swf`,
`castle-sandbag-build-report.json` and `castle-sandbag-browser-report.json`.

## Accepted evidence and discriminating checks

Actual capture: `@ruffle-rs/ruffle 0.7.1`, `2026-11-02T02:55:10.176Z`, two
identical runs. All25 observations match production: twelve damage cases,
six initial town states and seven original click outcomes. No production
correction was required by this comparison.

- Original SWF SHA256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`
- Diagnostic SWF SHA256: `e66246721657a2c54ef5fc7b56247073b1ce5e04f7ca961bf4c05e3730574046`
- Trace SHA256: `d8f6da8a183f51bc97e10cfb3a5edcce676e0f4e96b1f7c0b42fd5d6d8782027`

The accepted fixture is `web/tests/fixtures/original-castle-sandbag-trace.json`.
The local comparison report is `.build/oracle/castle-sandbag-comparison-report.json`.
The preserved original SWF and both ActionScript baselines remain unchanged.

The initial25-case capture also matched, but the small damage inputs did not
distinguish additive mission absorption from an incorrectly separate multiplier
after integer truncation. Before final acceptance, the maximum-level/.02 case
was strengthened to100 raw damage against140HP. The original inflicts48damage;
the incorrect multiplicative composition inflicts49. The earlier source run,
SWF, build report and comparison are retained locally under
`.build/oracle/castle-sandbag-before-percent-boundary-*`.

`web/tests/castle-sandbag-reference.test.ts` has three passing tests: exact
accepted-source comparison, a negative control for multiplicative absorption,
and a negative control for rounding rather than truncation. The latter disagrees
with five recorded outcomes, including both ordinary hits and party-effect cases.

The original order observations demonstrate nonlethal Guardian damage4 credited
to companion1 before Insurance+3 and successful Defender, leaving castleHP40.
The alternate owner0/Last Hope case damages the castle by1, reaches hero rampage339
and consumes six shared draws, including the hero's shake draws. Active protection
consumes zero draws, credits no Insurance and does not damage the attacker.
These are bounded source-method observations; connected attacks, actual browser
controls, save migration and publication are reported separately.
