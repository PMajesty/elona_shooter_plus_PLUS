# Ninth town: preparation and economy boundary

Day9 combat uses mission8 prepared on calendar8: base reward760 and no guaranteed
calendar loot. Its completed town prepares mission9 on calendar9. Preparing that
mission does not enable Day10 combat.

Source anchors below refer to preserved `src/original/MainTimeline.as`.

## Ordered preparation and the first boss day

The frame71 block at3155–3226 keeps the existing order: determine sale status,
generate shop, five cards, mission, recruit, medal effects and town flags, then
save; initialize `searched` only when absent. The existing inactive records in
shared slots0–7 and candidate slots45/47/48 remain meaningful. An inherited search
value consumes no new draw. The port stores the completed preparation rather than
rerunning it on restore.

`generateShop`5246 still creates two items with default Smith0 and then replaces
slot0 with a guaranteed gun, retaining the consumed draws and previous fields.
Calendar9 is not a MOD sale (`day % 10 == 4`). No new card, stock-size, action-point
or search threshold opens on day9. Current party Engineer/Negotiator effects keep
their existing preparation-cache boundaries; the diagnostic below uses the
declared default solo context.

`generateMission`12144 gives level/fixedLv9, strength0, power1880, base reward780
and spawn interval13.2. At12192 the first `fixedLv % 10 == 9 && fixedLv > 8` branch
changes the prepared mission to **six waves, bossDay true and bossWave5**. It does
not execute the normal random boss-wave selection. This changes the stream
consumed by the following recruit generation, even before the future battle is
available. Earlier towns retain five waves, bossDay false and bossWave2–3.

`generateSpecialLoot`12064 always consumes the optional1038 roll first. Calendar9
then appends **1035 Shop Token** at12074 and **1110 Dragonfly Statue** at12094, in
that order. The stored loot is `[1035,1110]` or `[1038,1035,1110]`. These are future
mission guarantees, not grants to the day9 inventory or its just-finished battle.
The existing `generateLoot`11414 first consumes its selection roll and subtracts
1000 for guaranteed IDs. Item110 already exists: `Statue of Dragonfly`, typeSell,
value150 at4456–4460. It adds no medal or combat effect. Museum income remains
outside the implemented Castle page1 scope.

## Recruit and item thresholds

`generateRecruit`7709 uses `int(U * day * .3) + int(day / 5) + 1`. On day9 this
still yields levels2–4, with boundaries **10/27** and **20/27**. No new recruit
level or class branch is introduced. `generatePlayer`2075 calls `levelUp(false)`
before next-trait and portrait/equipment generation. Each level adds one SP and
consumes the ordered hidden aiming/teamwork growth draws (10480). Costs remain
450/500/550, SP1/2/3. All nine classes remain eligible; changing candidate class
does not erase retained Militia47/48 records.

`weaponVariation`13126 retains the Mk3 cap introduced at calendar8. Calendar9's
Mk2→Mk3 probability boundary moves to **10/19** because the input span is3.8;
the high-roll result is unchanged from day8. The source still truncates the
chosen variation before applying damage, rate, value and skill requirement.
No new item catalogue entry or free weapon skill is added.

## Rewards, titles and medals

`calcTax`3587 gives normal day9 tax115. Default upkeep remains40 (`calcUnkeep`1660);
purchased upgrades and real party wages continue to apply independently. The
active mission8 reward is760 or988 after a perfect30% bonus. In the controlled
solo/default-upkeep context, net rewards are605/833 without a title or705/933
with the existing100 salary. `renewResult`3411 consumes the fame draw and calls
`townEvent`6417, which consumes the two normal ACTIVE draws before setting AP.
Settlement remains once-only; the future mission9 reward780 is not paid now.

An unclaimed first title remains eligible (`newTitle`9752), but the second tier
requires day>10. Nine perfect completions do not award the next absorption medal:
`resultMedal`2815 uses1/4/7/10. `startBattleMedal`6732 next adds a day milestone at10,
and `startTownMedal`3716 next checks40. Existing class-level or other earned medals
retain their independent rules; no calendar9 substitute is invented. Previously
earned medal60/61/62 absorption remains0.03 when applicable.

## Independent original comparison

`tools/build_ninth_town_oracle.py` instruments the preserved SWF using unchanged
generation/result bodies, the established diagnostic startup and an observed
save boundary. It prepares six complete towns for seeds42/1/0xdeadbeef with
retained metadata and absorption0/.03; four recruit boundary cases; four weapon
variation cases; four direct mission8/9 controls with/without optional1038; and
four day9 normal/perfect title0/1 settlements. Forced prefixes still advance the
underlying xorshift stream. The prepared boss mission is compared before any
future battle generation.

The build preserves all3491 non-code resources/tag ordering/frame metadata;
only DoABC2782 changes. Two identical actual runs were captured on
2026-11-02T04:46:58.627Z with `@ruffle-rs/ruffle 0.7.1`. All **22/22 observations**
match the production methods, full projected item/recruit/mission states and RNG.
No expected observations were generated from the TypeScript implementation.

- Full-town draw counts for seeds42/1/0xdeadbeef are90/113/203, unchanged by the
  controlled absorption0/.03 context. All six have ordered guarantees1035/1110.
- The direct mission8 controls take two draws; both mission9 controls take one.
  The optional roll precedes both calendar guarantees when it succeeds.
- Recruit probes produce levels2/3/3/4 with full source growth and item metadata;
  total draws16/18/18/21 include subsequent generated-item draws, not just growth.
- Weapon probes produce Mk3/Mk2/Mk3/Mk3 with one draw each. Result probes consume
  three draws and reproduce tax115, default upkeep40 and the four stated balances.
- Six focused module/reference tests pass. Negative controls detect an extra
  obsolete boss-wave draw even when mission fields stay correct, and reversed
  calendar guarantees even when RNG accounting stays correct.

Diagnostic SWF SHA-256:
`a1c3c17dc902cdafbac783bd22fa3597555cdd8e8730d69270d25522103ca780`.
Accepted trace SHA-256:
`397d9ee9aae7d2a9b79d8920b9eaaaccf1cbd94e71c3c905601110c84dff4399`.
Fixture: `web/tests/fixtures/original-ninth-town-trace.json`.
Reports: `.build/oracle/ninth-town-{browser,build,comparison}-report.json`.

```powershell
python tools/build_ninth_town_oracle.py
# Capture two original runs through the existing harness at ?suite=ninth-town.
Set-Location web
node --experimental-strip-types scripts/compare-ninth-town-reference.ts
```

The focused module checks cover retained metadata, strict day9/earlier-day mission
validation, ordered guarantees, recruit growth thresholds and unchanged Mk3 cap.
The original diagnostic is a method-boundary comparison, not complete native
scheduling, browser rendering or an earned Day9 campaign.
