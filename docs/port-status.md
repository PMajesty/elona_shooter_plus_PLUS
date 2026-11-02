# Browser port status

Current implementation: **six connected Sheriff days**, with owned firearms and
consumables, ordinary/boss loot, earned skills, prepared towns, shop transactions,
weapon Upgrade, MOD mounting, Free Repair, Rest and the first title claim.
This is not a complete remake.
The TypeScript/Phaser client runs independently of Flash and Ruffle; the preserved
game remains the reference for behavior, content and appearance.

The verified **v13 six-day release** is served at
`http://127.0.0.1:5175/elona/`. Its deployable archive is
`.build/elona-shooter-browser-day6-slice.zip` (7,906,573 bytes); the previous v12
release is retained in `.build/browser-before-day6` and its Day5 archive.
All 267 tested release files match the served directory and archive. The bundle
is `assets/index-Bilu_2M0.js`; the archive SHA-256 is
`47851e21b61f1b57015f96ce6433d521217b91ead1a261d7db33c4a7c90c420f`.
Browser boundaries and historical milestones are in
[port verification](port-verification.json).

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
- Opening mission0 and prepared missions1–5 on displayed Days1–6, victory/defeat,
  rewards and subsequent towns. Day4 includes BATCH1 wave selection, boss shields,
  fourth-town MOD stock and level-2 recruit growth. Day5 adds AIR waves and Fly
  movement, hovering, knockback, distant shadow, death and castle exit. The fifth
  town returns to ordinary stock, generates level-2/3 recruits and prepares
  mission5 with the Holy Grail reward. Day6 adds Barbarian movement, rage,
  accelerated attacks, knockback and death. Town6 prepares mission6 with Crow
  Statue1106; Day7 combat remains disabled.
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
  the source boss appearance progression for the six covered days.
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
  after dialog acknowledgment into Days2–6, without healing or spending gold/AP. Guns refill;
  consumable charges stay spent.
- Day6 settlement deducts the first 10 GP tax separately from default upkeep 40.
  Mission → Claim title costs 4 AP and grants Honorary Citizen, once eligible.
  It consumes no RNG and pays no immediate gold. Its 100 GP salary begins at the
  following settlement; that source-method case is tested but Day7 is not playable.
- Pause, browser-local save, Continue and validated JSON import/export.

Other classes, Day 7+, Ragnarok, recruiting/party AI, other card/search actions, stock
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

Current saves use **version 13**, accepting port versions **1–12** through their
existing migrations. Barbarian records require rage state, rage-effect frame and
hit-particle frames/offsets: these affect source collision and the parent-width
knockback clamp. The earned title persists; older saves initialize title 0 without
RNG consumption. No old save gains fabricated Barbarian history. Active mission
absorption stays separate from future preparation and town state.

Version **12** added Fly counters, frames and shadow history. Pre-v12 saves did
not contain Fly and retain their original supported campaign state on migration.

Version **9** added the upgrade reference and pending Upgrade/MOD confirmation.
Continue restores the exact preview and opens its shop dialog; confirmation does
not reroll. Other town mutations are blocked while it is pending. Original enchant
can retain historical reload metadata after refilling a gun; town imports permit
that metadata, while active-battle reload validation remains strict.

Version **10** added saved Archer counters and cosmetic arrow flight. Its
migration adds an empty arrow list to older saves without RNG draws.
Day3 retains the just-completed Day2 town and historical mission absorption.
Archer frame bounds are validated before the frame-width lookup can run.
Version **11** added Day4 and saved boss facing. Boss AI and its child animation
advance together, preserving original firing stops, walk loops and shield hold.
Versions1–10 migrate with their former left-facing default and no RNG draws;
legacy walking frames212–219 normalize into the source200–211 walk cycle.
The fourth town retains level-2 recruit growth, MOD sale stock and medal61's
0.02 future absorption separately from Day4's historical active mission.

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

The published v13 release passes **234 tests**, focused browser acceptance and
production New Game/save restoration. Historical v11/v12 release checks below
retain their original scope.
Original comparisons use controlled inputs/random draws and expected
results captured from the original, never regenerated from the port.

Day6 source captures match **nine wave cases**, **22 town/economy/title
observations**, and **671 Barbarian states** plus **12 collision grids/76,800
points**. Barbarian rage preserves the original unequal current/stored speed
formulas and permanent rage flag; normal and raged attack intervals are 46 and 16
updates in the captured cases. Full transient-effect state and parent widths
match, including the meaningful left-clamp difference from body-only bounds.
This is faithful integration of observed source behavior, not a new balance
correction or a late-game hitbox diagnosis. See
[Barbarian source notes](../web/docs/barbarian-source.md).

The sixth-town cases cover ordinary preparation, recruit thresholds, the first
tax, title eligibility/claim/acknowledgment and controlled future salary timing.
Claiming the title after the Day6 result cannot retroactively change that result.
The two Day7 salary cases observe source methods only and do not enable Day7.
See [sixth-town source notes](../web/docs/sixth-town-source.md).

Day5 source captures match **nine wave cases** and **17 fifth-town/recruit
observations**, including AIR, BATCH1 and fallback selection, ordinary stock,
Holy Grail mission preparation and all nine recruit classes at level 3. Fly adds
**503 matching fresh or explicitly reset state observations** and **eight full
body/shadow grids containing 81,920 points**. Another **73 raw pooled states**
remain separate evidence: original Fly initialization can inherit counter 45
from a prior Fly or resistance 0.9/1.1/0 from Sheep/Rat/Boss. The port deliberately
starts each Fly with counter 0/resistance 1, compared with an explicit two-field
reset followed by the original initialization and AI. This fixes observed state
leakage; it is not raw-pool parity or a late-game hitbox diagnosis.

The first Fly comparison also exposed bounds-rounding and signed-zero
differences. Measured Fly bounds now round transformed corners to the nearest
twip; the accepted Archer table is unchanged. Existing explicit coordinate
quantization canonicalizes zero at assignment without a comparator exemption.
Before evidence, source hashes and limits are in
[Fly source notes](../web/docs/fly-source.md) and [oracle notes](oracle-notes.md).

Day4 source captures match **seven wave cases**, **16 fourth-town/recruit
observations** and **305 boss observations** (301 states plus four guarded/open
pellet/explosion cases). Exact fields include shield entry/exit, facing, source
walk/firing/held frames, damage, RNG draws and final RNG state. All nine recruit
classes are tested at level2. A diagnostic setup initially jumped directly to a
held shield frame and skipped its pose script; that failed capture is retained,
and the accepted capture enters through the original frame-script path.
These are explicit method/child-frame observations, not native scheduling proof.

Day3 source captures match **five wave cases**, **six third-town cases**
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

The latest six-day campaign soak passed **96 scenarios across 32 seeds**, with
**411,504 frames, 4,490 JSON checkpoints, 699 reward transitions, 760 town actions
and 161 Rest transitions**. It reached **32 Day2 victories, 32 Day3 victories,
25 Day4 victories and 13 Day5 victories**. Thirteen scenarios entered Day6;
one won and claimed the title. The run exercised **297 equipment selections,
124 upgrade previews, 29 MOD mounts, 27 upgrades and 97 cancellations**,
with exact continued state/events after save/restore. Idle, aimed and interrupted policies
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

The previous v10 release separately passed New Game → Proceed → combat at tick 0
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

The v11 candidate entered Day4 through ordinary Rest from an earned third-town
checkpoint. Full state matched the ordinary transition, and Continue exports
were byte-identical. A controlled boss entered and held its shield; the exported
state matched16 elapsed updates and was byte-identical after Continue. A separate
projectile case hit the newly turned boss for40damage (185/225HP) and removed the
bolt; all four browser updates matched an independent asset-geometry replay.
The old cached pose missed that contact. This is a corrected port integration
lag, not proof of the veteran's late-game complaint or exact Flash raster parity.
The same 252 tested v11 files were published locally and matched the deployable archive.
That production New Game reached combat at tick0 with40HP,200gold and five shells.
The prior v10 save was backed up and restored as v11 at tick674, paused; its
entire simulation equals the expected migration. No console errors were observed.
Previous-release files remain available for rollback.

The v12 browser entered Day5 by Rest from an earned fourth-town checkpoint;
the entire save equals the normal simulation transition and Continue exports
are byte-identical. A controlled Fly rendered its small airborne body and distant
ground shadow; its saved waiting state matches seven production updates and
restores identically. An ordinary mouse shot consumed a shell but missed; this
observation is not counted as a successful hit test. Source collision comparisons
and automated death/exit replay provide separate behavior evidence.

All 254 tested v12 candidate files matched the published build and deployable archive.
That production New Game reached combat at tick0 with40HP,200gold and five shells.
The previous live v11 save was restored as v12 at tick674, paused, with exact full
migration equality and no observed console errors. Rollback files are retained
in `.build/browser-before-day5`; release evidence is in
[port verification](port-verification.json).

The v13 browser entered Day 6 by Rest from an earned fifth-town checkpoint and
preserved the complete state through Continue. A separate ordinary-repair branch
won Day 6: results deducted 10 GP tax plus 40 GP upkeep, and proceeding entered town
with 4 AP. Claim title changed only title 0→1 and AP 4→0; gold, cumulative income,
RNG and the already settled result remained unchanged. Continue and a repeated
disabled Claim title attempt preserved the exact exported state. A controlled
Barbarian's rage and hit particles matched eight production updates and restored
exactly through Continue. These checks use earned headless checkpoints and a
controlled actor; they do not establish a manually played browser campaign or
whole-screen pixel parity.

The tested v13 candidate was published unchanged. Production New Game reached
tick 0 with 40 HP, 200 gold and five shells. The previous live v12 save restored as
v13, paused at tick 674 with 40 HP, 209 gold, five shells, 10 kills and boss HP 75/150.
The complete save envelope, including appearance, matched the expected migration;
no console errors were observed. The 267-file publication/archive check and full
browser-save comparisons are recorded in `.build/day6-publication.json`,
`.build/browser-qa/day6-ui-verification.json` and
`.build/browser-qa/day6-production-verification.json`.

## Next integrated work and continuation

The next campaign boundary is Day7: mission6 introduces RANGED waves and the boss
special attack. Integrate those source behaviors, the now-earned salary and
relevant town/economy thresholds before
enabling Rest beyond Day6. Keep progression and replay checks connected to
ordinary playable flow. Hiring, other deferred town actions and the unproven
late-game hitbox report remain explicit work beyond the six-day slice.

The long-term goal and the existing **30-minute watcher remain active**. Unchanged
monitoring stays quiet. The user is asleep and authorized autonomous continuation;
request help only for a consequential decision or access that cannot be resolved
independently. Current user direction overrides old plans and watcher instructions.
Original SWF/AS and startup-fix baselines remain unchanged. Their separate
[SWF verification](verification.json) is not browser-port completeness evidence.
