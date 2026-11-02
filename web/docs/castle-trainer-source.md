# Trainer: original source and accepted comparison

Trainer is a live multiplier on kill XP. It affects the hero as well as companions in the observed original runtime. It does not multiply the flat daily completion award, weapon-skill credit, or the cached party effects. This slice adds the Castle purchase and that kill-credit behavior; it does not introduce new game modes or Search.

## Source contract

Anchors below refer to the preserved `src/original/MainTimeline.as` and the FFDec export `.build/export/scripts/enemy.as`. The latter is derived from the preserved SWF, not a production TypeScript expectation.

- Main 9186 and 9240: Castle tile 7 is `trainer`, initialized to zero with the other upgrades.
- Main 12622–12624: the next purchase costs `level * level * 180 + 250`, returned through an `int` local. There is no Trainer-specific cap. The old platform restriction at 12658 is disabled by `&& false`; the analogous hint restriction at 11888 is also disabled.
- Main 13536–13554: the ordinary Castle click handler checks the tile's affordability, plays the payment sound, subtracts the quote, invokes `upgradeDone`, then rebuilds the interface. Main 7301 increments `game.trainer` through the common upgrade path. It does not spend AP, draw RNG, change `totalMoney`, grant an item, or regenerate a prepared town. Main 1662 `calcUnkeep` has no Trainer term.
- Main 12949: `trainerFix()` reads live `game.trainer`: level zero returns 1, otherwise `1.03 + level * 0.04`. There is no party-cache lookup.
- Main 11881: description is “With more trainers, your troops will gain experience a lot faster.” Its detail uses `int(trainerFix() * 100 - 100)`; preserve the floating calculation. The shared zero-level suffix says the upgrade has not been acquired. Main 1323 adds `Lv N` to the tile name only above zero.

A search of all exported ActionScript found exactly one executable call to `trainerFix` outside the function and UI hints: `enemy.damage`, line 795. The type declaration at enemy 27 makes `exp` an `int`, so its intermediate assignments truncate individually.

## Kill XP order

The unchanged `enemy.damage` path (enemy 550 onward) performs damage and death processing, then:

1. Increments the shooter's kill count and selected weapon-skill bucket at 726–727. Ranger frenzy and Living Weapon effects follow before XP adjustment.
2. Multiplies integer enemy XP by `mission.expFix` at 756. Casual mode applies another 1.35 factor at 757–760. The normal companion branch at 761–769 doubles XP and adds a second weapon-skill credit when `day / 1.5 > actor level`, then applies the companion 1.5 factor. Hero Tight mode instead applies 0.7. The current port slice uses normal options; Casual and Tight are audited source facts, not newly enabled features.
3. Applies the level-gap denominator when enemy level + 3 is below actor level, then Noble's 1.4 factor (774–781). Each assignment still writes an integer. Critical handling then updates Rogue/rampage behavior; critical kills do not have a separate XP multiplier.
4. The check at 789 is **`shooterIndex == _root.pc`**, while the actual declared hero constant and subsequent checks use `_root._pc`. The diagnostic observes `typeof root.pc == "undefined"`, its string value `"undefined"`, and `_pc == 0`. Consequently even shooter 0 takes line 795: add `int(exp * trainerFix())`.
5. If accumulated XP reaches 1000, calls actual `levelUp` before voice/drop RNG. Main 10480 applies `% 1000`, increments level/SP/class trait, then draws once for aiming growth and once for teamwork growth. The kill path subsequently rolls critical voice where applicable, gold and loot.

The source `enemy.exp` field stores the pre-Trainer adjusted value. Applying Trainer early, or combining all factors before one final truncation, changes this observable state and can change credited XP, level-up timing and later RNG. All nine classes share this credit path; the bounded new cases specifically exercise Sheriff and the order-sensitive Noble branch. Existing party combat/progression references cover the other classes separately.

## Completion, reserves and cache

Main 12484 `eventAfterBattle` adds exactly 250 XP to existing actors 0–4, performs threshold growth, then runs `wexpUp` and spends companion SP through `gainTrait`. An inactive record and the recruiter candidate at physical slot 5 receive neither the daily award nor automatic skill training. Main 6907 `wexpUp` uses its own weapon-credit thresholds and contains no Trainer factor. Main 11346 Search Training also adds its own flat XP, without Trainer; Search is outside this implementation.

Neither this settlement path nor `levelUp`, `gainTrait` or `wexpUp` refreshes `PARTY`. The captured cache remains the pre-growth cache until a later actual `initPartySkill` call. The production comparison checks that delay, including a settlement that actually changes companion traits. The source moves hero SP into `_eventLevel == 7` queue entries; the adapter compares that queue plus remaining SP with the port's persisted pending skill-point count.

## Independent experiment and result

`tools/build_castle_trainer_oracle.py` derives a disposable SWF from the preserved sources. It reuses the proven original New Game bootstrap, supplies a deterministic xorshift32 stream, observes XP immediately before the original credit branch, and invokes unchanged original `procHit`, `enemy.damage`, `eventAfterBattle` and Castle tile-click methods. Purchase cases use the real continued-town frame 71 and original shape hit tests. Fresh town preparation is excluded. Only the existing startup seam, controlled mouse/random inputs and observation code change; both replacement classes occupy DoABC tag 2782, with every non-code resource payload, tag order and frame header preserved.

The root captured two identical runs on **2026-11-02T04:04:34.420Z**. All **27 snapshots** match the production comparison: 16 kill/settlement cases and 11 purchase observations. Six focused tests pass, including negative controls for hero exemption, applying the multiplier early, multiplying the daily award, extra weapon credit and prematurely refreshing party skills.

Discriminating observations:

- A hero's ordinary sheep kill awards 29 XP at Trainer 0 and 31 at Trainer 1. Its weapon bucket gains one in both cases.
- With hero XP 970, the critical kill ends at level 1 / XP 999 without Trainer, versus level 2 / XP 1 at Trainer 1. The original draw count changes from 5 to 7.
- A companion starting at XP 956 ends at 999 or level 2 / XP 2. The adjusted enemy XP is 43, the trained credit 46, and the draw count changes from 4 to 6.
- Day 7 level-4 Noble catch-up and level-gap processing turns the sheep's 29 base XP into integer stages 58, 87, 21 and 29. Trainer 10 then awards 41, leaving the enemy's adjusted XP at 29. The selected weapon bucket gains two regardless of Trainer. Starting at XP 960 makes this a real level-up boundary: 989 versus level 5 / XP 1.
- With mission XP factor 1.17, the integer intermediate is 33; Trainer 3 awards 37. Multiplying everything first would produce a different credit.
- Settlement at Trainer 0 and 10 produces identical actors, automatic skills, items and all 102 sampled RNG draws. Both active actors end at XP 150 after their level-up; inactive and candidate records remain identical to their inputs.
- At AP 0, sequential purchases debit 250 then 430, reach level 2, quote 970 next, and leave upkeep at 40. Insufficient 249 gold does nothing. The level-10 purchase succeeds and reaches 11, quoting 22,030 next. These are finite witnesses, not a claim about extreme signed-int price overflow.

Artifacts:

- Accepted fixture: `web/tests/fixtures/original-castle-trainer-trace.json`.
- Comparator: `npm run test:castle-trainer-reference`; focused tests: `npx tsx --test tests/castle-trainer-reference.test.ts` from `web`.
- Original runtime/build/comparison reports: `.build/oracle/castle-trainer-{browser,build,comparison}-report.json`.
- Instrumented SWF SHA-256: `d7484a046ff5f5e3af913bed3354dcb9186ccc9fb95da43a0667a5223b8ee976`.
- Accepted trace SHA-256: `2fbe245324e68c6f9e96c43ccf66ae51975c6e610a0794dc282bc3571fbb0ede`.

The first successful capture is retained as `.build/oracle/castle-trainer-browser-report-prior-sister-dead.json`. Inspection showed its nominal hero-growth inputs stopped at 997/999 and inherited a dead sister from an earlier companion fixture. Before acceptance, the new fixture was corrected to the ordinary living-sister context and thresholds that actually cross a level. No original expected values were edited to fit the port.

These synchronous boundaries prove the recorded method outcomes and RNG ordering; they do not establish complete native scheduler or browser contour parity. The adapter supplies the observed original contour predicate, and maps never-created empty slots to the port's `null` representation (the original `updateAlly` may have written only `reloadTime = 0` there). Every generated item field remains exact. Connected play, UI purchase/save recovery and publication evidence are recorded separately by the integration owner.
