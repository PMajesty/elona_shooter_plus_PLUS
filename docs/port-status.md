# Browser port status

Current playable scope: **three connected Sheriff days**, with owned firearms and
consumables, ordinary/boss loot, earned skills, prepared towns, shop transactions,
weapon Upgrade, MOD mounting, Free Repair and Rest. This is not a complete remake.
The TypeScript/Phaser client runs independently of Flash and Ruffle; the preserved
game remains the reference for behavior, content and appearance.

The **v10** build is served at `http://127.0.0.1:5175/elona/`. The deployable archive
is `.build/elona-shooter-browser-day3-slice.zip`; the previous v9 release
is retained in `.build/browser-before-day3`. All 250 release files match
the served directory and archive. Hashes, browser boundaries and historical
milestones are in [port verification](port-verification.json).

## Current goal amendments

The user amended the long-term goal on 2026-11-01: exact **30 Hz / 20 Hz rates
are optional**, unless changing them materially changes gameplay. Preserve
observable pacing, weapon cadence, reload durations, movement and enemy behavior.
The existing clocks remain the reference implementation, not an independent
requirement. This amendment supersedes older wording in the stored goal.

The veteran complaint, **“hitboxes that plague ES lategame,”** is an investigation
target, not a reproduced defect. Use controlled late-game encounters to distinguish
visible shapes, hit regions, overlaps, animation, projectile paths and input timing.
Preserve a failing original case and a passing port regression before documenting
an intentional correction. Earlier contour and vertical-projectile fixes do not
establish this late-game diagnosis.

## Playable coverage and remaining gaps

- Title, New Game, 22 appearances and Sheriff creation, including original hidden
  hero rolls, pre-Proceed rerolls and level growth.
- Opening mission0 and prepared missions1/2 on displayed Days1–3, victory/defeat,
  rewards and subsequent towns. Day4 remains disabled until its distinct branches
  are implemented; the third town already prepares its mission3 data.
- Mouse aiming/shooting and keys 1–5 for owned slots. Damage, accuracy, cadence,
  ammo, skill requirements, manual/magazine reload, automatic fire/reload and
  covered Sheriff skills use source-derived calculations.
- Long/Wind Bows, both Crossbows, Grenade/Rocket Launchers, Gravity Gun and
  Flamethrower, with owned-item properties and projectile lifecycles. Bows draw
  on hold and fire on release; Gravity Gun reloads while its shot remains active.
- Grenades, Repair Hammers and Holy Grail protection. Consumables keep the gun
  selected; charges and per-slot cooldowns persist. Hammers spend a charge even
  at full HP; the Grail is single-use.
- Original art, fonts, audio, layered character animation, boss health bars and
  the source boss appearance progression for the three covered days.
- Ordinary loot → earned boss prizes → earned Sheriff skill choices → results.
  Gold settles once. Six inventory slots, offers and choices persist without rerolls.
- Town preparation retains stock, cards, next-mission/recruit data and search
  initialization in source order. Purchases, owned swaps, confirmed sales and
  Shop Token discounts work. Generated data does not imply its action is playable.
- **Upgrade** requires 4 AP to enter; selecting a gun immediately rolls its preview.
  Yes spends 4 AP and the displayed cost once. Cancel retains consumed RNG and
  the reference item without spending gold/AP. Higher skill requirements still
  apply: a starter Shotgun Mk-2 requires Shotgun 6. Upgrade grants no skill levels.
- **Owned MOD mounting** uses original compatibility checks, fixed enchant and
  ammo refill without AP/gold/RNG cost. No or an outside click swaps the two owned
  items, as in the source. A shop MOD must first be bought into an empty slot.
- Free Repair costs 2 AP, restores the wall and costs no gold/RNG. A full wall
  rejects before the insufficient-AP check. Mission → Rest starts the next prepared battle
  after dialog acknowledgment into Days2 and3, without healing or spending gold/AP. Guns refill;
  consumable charges stay spent.
- Pause, browser-local save, Continue and validated JSON import/export.

Other classes, Day 4+, Ragnarok, recruiting/party AI, card/search actions, stock
refresh, most castle/economy actions, complete global medals and original Flash
save conversion remain unfinished. Companion/town skills cannot exercise systems
that are still absent. No completion percentage is inferred from extracted assets
or test counts; see the [feature ledger](feature-ledger.json).

## Architecture and persistence

`simulation.ts` owns state separately from rendering. It currently uses 30 Hz
frame updates and 20 Hz timer work while Phaser renders at browser refresh rate.
Pause freezes simulation work. `main.ts` connects input, scenes, audio and saves.
Focused modules own hero growth, missions, combat, projectiles, item generation,
rewards, town preparation and equipment transactions. See the source notes in
`web/docs/` for formulas, original anchors and known boundaries.

Ordinary-enemy collision uses original filled contours and placement matrices,
including persisted sheep shadow history. Bosses use rendered alpha geometry;
the headless soak uses an explicitly documented boss rectangle fallback.

Version **9** retains the upgrade reference and pending Upgrade/MOD confirmation.
Continue restores the exact preview and opens its shop dialog; confirmation does
not reroll. Other town mutations are blocked while it is pending. Original enchant
can retain historical reload metadata after refilling a gun; town imports permit
that metadata, while active-battle reload validation remains strict.

Version **10** adds saved Archer counters and cosmetic arrow flight. Versions
**1–9** remain accepted; migration adds an empty arrow list without RNG draws.
Day3 retains the just-completed Day2 town and historical mission absorption.
Archer frame bounds are validated before the frame-width lookup can run.
Important earlier migration limits:

- v7 made owned items canonical for ammo/reload, with selected slot, five item
  cooldowns, protection and five weapon-XP categories. Older scalar XP maps to
  Shotgun; missing historical categories cannot be recovered.
- v8 added projectile/bow state. Legacy grenades retain stored position, damage
  and lifetime instead of relaunching. v1–6 keep their former fixed damage of 45.
- Missing early item/hero data uses separate recorded reconstruction streams,
  preserving the saved combat RNG. Lost metadata, potentials and growth history
  cannot be recovered. Current saves require enemy shadow history.
- Legacy omitted rewards resume once; early gold settlement is reconciled without
  double payment. Older towns retain gold/AP/HP while missing preparation runs once.
  Ready towns include completed search initialization and do not reroll on restore.
- Active mission, prior town, entry gold, earned early medals and boss/perfect-day
  counts persist. A newly earned medal changes future preparation, not past combat.
  Historical income omitted by older ports is not reconstructed.

The port preserves its own RNG sequence. Its generator differs from Flash
`Math.random()`; the same seed does not recreate an arbitrary original playthrough.
Saves remain local to the browser/site unless exported. Original Flash saves use
a different format. The static build supports subdirectory hosting and requires
no Flash plugin, Ruffle, external CDN or gameplay server.

## Evidence and intentional corrections

The integrated release passes **180 tests**, TypeScript checking and production
build. Original comparisons use controlled inputs/random draws and expected
results captured from the original, never regenerated from the port.

Newest source captures match **five Day3 wave cases**, **six third-town cases**
and **517 Archer states**, with **six filled-shape grids/24,576 points**. Boundary
streams expose rare Archer selection and the Chicken fallback; all30 selectors
per wave-generation case are observed. Archer AI, damage timing, arrow motion,
source widths, death behavior and RNG match the controlled original. The missing
stand label returns frame1 in Ruffle without error; this is preserved behavior,
not a new intentional fix. See [Archer notes](../web/docs/archer-source.md).

Town equipment evidence: **104 original Upgrade/MOD observations**, **88 matching port
transaction comparisons**, of which **84 compare the full reference item**.
Two original runs were identical. The original loses the last mounted modifier
when upgrading, including Living Weapon when last. The port intentionally retains
all modifiers and its progress. Sixteen raw bug observations remain separate;
four corrected scenarios use the original `enchant` method to apply the omitted
modifier, providing independent corrected expectations. Four preview rows defer
reference equality to that following intervention record. See
[equipment source notes](../web/docs/town-equipment-source.md).

Earlier accepted comparisons remain: 72 reload snapshots; three opening and three
prepared-Day-2 wave cases; 21 spawn/pellet cases; 22 actual firing cases; 56 equipment
input snapshots; 17 castle/protection states; 12 hero creation/growth cases; 157
item/loot snapshots; nine progression cases; 11 settlement/repair cases; 16 first-
town and six second-town snapshots; three final Rest transitions from 12 original
observations; 19 ordinary-enemy grids/77,824 points; and 14 projectile scenarios/
650 source steps, with separate native-birth and vertical diagnostics.

The latest campaign soak passed **96 scenarios across 32 seeds**, with **261,877
frames, 3,037 JSON checkpoints, 542 reward transitions, 593 town actions, 91 Rest
transitions, 32 Day2 victories, 32 Day3 victories and 297 equipment selections**.
It includes **85 upgrade previews, 16 MOD mounts, 24 upgrades and 61 cancellations**, with exact
continued state/events after save/restore. Idle, aimed and interrupted policies
exercise actual integrated commands. The earlier projectile sweep separately
passed 27 configured cases/9,720 updates/1,080 checkpoints; 21 vertical regressions
check finite completion. These are bounded replay/stability tests, not original
parity, ordinary acquisition of every configured gun, or browser performance proof.

Historical browser input on the v9 candidate verified MOD No→swap, MOD Yes, before/after
upgrade display, red skill requirement, pending-preview reload/Continue, payment
and insufficient AP. Full exported states matched the same simulation commands;
the pending preview exports were byte-identical. The fixture adds one MOD to an
actual second-town checkpoint without changing gold/AP/traits. This does not claim
ordinary MOD acquisition or a full browser campaign.

The previous v9 release separately passed New Game → Proceed → combat at tick 0
with five shells and full HP. Its v8 import/export matched independent migration
at tick 674 exactly, and the previous save was restored after testing. Initial
Continue also restored that state but advanced five ticks before pause; the exact
equality evidence is the subsequent immediate-pause import. No console errors
were observed. Candidate/final bundle differences and historical browser segments
are recorded explicitly in [port verification](port-verification.json).

The v10 browser check entered Day3 from an actual Day2 town through Rest. Its
entire exported state matched the prepared transition; Continue was byte-identical.
A controlled Archer damaged the wall at release and rendered its original arrow;
the in-flight export was also byte-identical after Continue. The final production
build differs only in the corrected Day3 title badge and passed New Game at tick0.
The prior production save is restored after acceptance. This is focused browser
evidence; automatic three-day progression is measured separately by the soak.

The source contour correction removes overly strict ordinary-enemy targets;
persisted sheep shadow history removed 76 false-positive grid hits. Vertical
grenade/rocket flight intentionally fixes original NaN trajectories. These and
the final-MOD retention fix are separate from the unverified late-game complaint.

Remaining evidence limits: native event interleaving and full original battle
replay are not established; sampled cases do not cover every combination. Flash
raster/filter/font/subpixel differences remain, including Gravity Gun hard-light
rendering. Projectile pause/postbattle freezing is a documented difference.
There is no comparative speed benchmark or broad browser compatibility result.
The original runner's slow-intro timeout was resolved by diagnostic intro skipping;
that capture mechanism does not prove native scheduling equivalence. Details and
negative controls are in [oracle notes](oracle-notes.md) and
[rendering evidence](ui-reference.md).

## Next integrated work and continuation

Extend through Day4: original BATCH1 waves, level3 boss shields, then the fourth
town's special MOD-stock overwrite and possible recruit level growth. Day5 adds
AIR waves and Fly behavior; later branches remain part of the full-port goal.
Keep automatic progression and save checks connected to ordinary playable flow.
Do not enable later days by dropping a reachable source branch.

The long-term goal and the existing **30-minute watcher remain active**. Unchanged
monitoring stays quiet. The user is asleep and authorized autonomous continuation;
request help only for a consequential decision or access that cannot be resolved
independently. Current user direction overrides old plans and watcher instructions.
Original SWF/AS and startup-fix baselines remain unchanged. Their separate
[SWF verification](verification.json) is not browser-port completeness evidence.
