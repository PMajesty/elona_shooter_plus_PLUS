# Paid Fix Wall and Repairman: source and accepted reference

Status: the production purchase/timer methods match **37 recorded original
observations** from two identical Ruffle runs. This is a controlled transaction
and wave-transition reference, not a claim of complete Castle features, browser
interaction or native scheduling parity. Source anchors below refer to preserved
`src/original/MainTimeline.as`.

## Purchases and persistent fields

The first Castle page maps index0 to **Fix Wall** / `game.wallFix` and index6 to
**Repairman** / `game.repair` (Main:9185–9186). Both begin at zero in the upgrade
initialization loop (Main:9237–9242). Neither has a declared maximum in
`upgradeMax` (Main:9246), and `getUpgradeCost` has no Repairman level cap.

| Action | Price before purchase | Immediate effect |
| --- | --- | --- |
| Fix Wall | `int(8 * (castleMHP - castleHP))` | Increments `wallFix`, then sets currentHP to maxHP |
| Repairman | `int(repair * repair * 250 + 700)` | Increments `repair`; does not heal immediately |

Prices use the original integer result variable in `getUpgradeCost`
(Main:12592–12622). Repairman costs700GP,950GP and1700GP for levels1,2 and3;
the next quote is2950GP. Fix Wall at30/40 costs80GP. Its stored purchase counter
is independent of Wall level and maximumHP; starting at counter3, one paid
repair changes it to4. Neither action changes Wall level or maximumHP.

The common original tile handler performs the actual transaction immediately:
`MouseLDownFunc_town` checks the enabled tile, plays `sound_pay1`, deducts its
current price, calls `upgradeDone`, removes/rebuilds tiles and updates the HUD
(Main:13526–13555). `upgradeDone` increments the selected stored field before
its special effect (Main:7301–7323). There is no confirmation dialog, AP cost,
random draw, totalMoney credit/debit, skill-cache refresh or town regeneration.
The cost0/full-HP Fix Wall tile is disabled, so clicking it cannot increment
the counter. Insufficient funds also disable the tile; the handler repeats
that `possible` guard (Main:1335–1353,13538–13542).

`calcUnkeep` adds60GP per Repairman level (Main:1664). The Fix Wall purchase
counter has no upkeep term. With all other starting Castle values, upkeep is
40/100/160/220GP at Repairman levels0/1/2/3. Buying an upgrade after settlement
must leave the already-paid result unchanged; later settlement uses the new
upkeep through `renewResult` (Main:3411–3452).

The source save clones the entire `game` object, including both fields
(Main:6311–6349). Browser save version17 uses canonical `wallFixCount` and
`repairmanLevel`; older saves initialize both to0. The production API extends
`buyCastleUpgrade` with `fix-wall` and `repairman`. A full-HP paid repair returns
`capped` because the existing purchase API uses that result for zero-cost,
disabled tiles; this is not a cap on the historical repair counter.

## Automatic healing and the perfect flag

`castleRepair()` returns `game.repair * 2` (Main:12467–12470).
The actual `onTick` order matters (Main:8239–8381):

1. A paused game returns. HP at or below0 enters defeat and returns before
   any reload, wave work or healing.
2. Existing actor reload/skill timer work runs. This reference disables actors
   to isolate Castle behavior; it does not assert that a complete live timer
   call always consumes zero random draws.
3. If `mission.newWave` is true, the source clears that flag. At wave0 or below
   it checks remaining damage, sets the final wave to0, pauses/protects the
   game and begins the battle-exit path. **This branch returns before repair.**
4. For an actual next wave, the source decrements `mission.wave`, updates the
   day/wave display, adds `2 * repair`, clamps HP to maximum and calls `updateHP`.
5. Only then does remaining damage set `mission.noDamage=false`. An existing
   false value is never restored to true.

The opening battle starts with `newWave=true` and five waves
(Main:12168,12190); the first5→4 transition therefore also heals. There is no
continuous healing on ordinary timer calls between transitions. Repairman
uses only `updateHP` at this point: no repair sound or healing-effect event is
created (Main:8366–8378).

The perfect-game flag is consequently about HP at the checked wave boundaries,
including the final boundary, rather than a permanent record of every damage
event. A38/40 wall with Repairman1 reaches40 before the opening check and keeps
the flag. A35/40 wall reaches37 and loses it. A39/40 wall on the terminal wave
remains39 and loses it even with Repairman3. HP0 cannot be rescued by the upgrade.

## Original UI text

`updateUpgradeHint` assigns these descriptions (Main:11874,11880):

- Fix Wall: `This will completely fix the castle wall.` Its second line stays
  empty; index0 is excluded from the unowned-upgrade replacement loop.
- Repairman: `Repairers will slowly fix the castle wall during a battle between waves.`
  At positive levels its second line reports
  `(Currently, they can fix N HP per wave)`.

The tail of that method replaces the Repairman level0 detail with
`[ You haven't acquired this upgrade yet ]` (Main:11892–11902). This was checked
in the actual capture; assuming the initially assigned0HP text would be wrong.
The title is `Repairman` at level0 and `Repairman Lv N` afterward. Fix Wall never
shows its purchase counter as a level (Main:1322–1327).

## Accepted independent experiment

`tools/build_castle_repair_oracle.py` preserves the original method bodies and
all non-code SWF resource tags. It reuses the proven original Castle tile setup
and shape-hit coordinate seam from the House/Wall fixture. The source random
wrapper falls back to normal randomness outside the diagnostic boundary.

The fixture first calls original `onTick` nine times under controlled battle
state. For terminal cases, a reversible observer at the **entry to
`exitBattle2`** raises a diagnostic sentinel. The original `onTick` has already
performed its final noDamage/pause/immune changes; cleanup, rewards and event
transition are deliberately outside the observation. The production adapter
stops at the corresponding `finishDay` entry. Decorative fireworks are
disabled using the original option; source wave and healing methods are not
rewritten. The lethal case runs the real defeat guard.

Then actual continued-town frame71 is entered and eight controlled town
scenarios invoke the real `MouseLDownFunc_town` on hittable tile coordinates.
Fresh-town generation is outside this purchase boundary.

The37 snapshots contain17 initial states,9 timer outcomes and11 purchase/guard
outcomes. They cover opening restoration, partial/clamped healing, no upgrade,
an already-lost perfect flag, no transition, damaged/full terminal boundaries,
lethal HP, paid-repair affordability/full repeat/history, and sequential
Repairman purchases. Every scoped original record has zero RNG draws and state42.
All town cases use AP0 and retain totalMoney1234 and the prior perfect flag.

Actual capture: `@ruffle-rs/ruffle 0.7.1`, `2026-11-02T02:34:46.989Z`, two
identical runs. `compare-castle-repair-reference.ts` matches all37 observations
against the production purchase API and actual private timer method. It also
checks unchanged prepared town, party records/cache, Wall level/capacity and
settled result after purchases. Source pause/immune flags and UI descriptions
are captured and asserted as source evidence; their browser ownership/rendering
remain separate integration checks.

- Original SWF SHA256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`
- Diagnostic SWF SHA256: `705174478b6dd117b143bcb9344f555930b83673ba15abaf03012e9e111e7e82`
- Trace SHA256: `5c8791dec9d2e543bb6f92cbf4aa246b1a738cefedd3162640a125043c223a8e`

Accepted fixture: `web/tests/fixtures/original-castle-repair-trace.json`.
Local browser/comparison reports: `.build/oracle/castle-repair-browser-report.json`
and `.build/oracle/castle-repair-comparison-report.json`.

Reproduce with `python tools/build_castle_repair_oracle.py`, capture
`http://127.0.0.1:5176/?suite=castle-repair`, then run
`node --experimental-strip-types scripts/compare-castle-repair-reference.ts`
from `web`. Four focused reference tests pass. Negative controls prove the
unchanged trace rejects an early perfect-status check, an extra terminal heal
and loss of the paid-repair counter. This experiment does not replace connected
gameplay, actual browser clicks, save migration or active-party timing checks.
