# Browser port status

Current implementation: **seven connected Sheriff days**, with owned firearms and
consumables, ordinary/boss loot, earned skills, prepared towns, shop transactions,
weapon Upgrade, MOD mounting, Free Repair, Rest, the first title claim and its salary,
plus permanent recruitment, companion equipment, autonomous AI, growth and wages,
and Castle House capacity two/three and Wall purchases.
This is not a complete remake.
The TypeScript/Phaser client runs independently of Flash and Ruffle; the preserved
game remains the reference for behavior, content and appearance.

The **v16 Castle release** is served at `http://127.0.0.1:5175/elona/` after
automated/source checks and eleven complete-save browser checks. All 308 files
from `.build/browser-castle-final` match publication and the archive. The bundle
is `assets/index-s1hKilh5.js`; the deployable archive is
`.build/elona-shooter-browser-castle-slice.zip` (8,573,679 bytes), SHA-256
`510b912aa4da55f270d4b1b9afa28b86f3ddde7e351f6fcf7ea101ac303988b4`.
Final production New Game and exact actual v15-save migration/restore checks pass.
The verified v15 release is retained in `.build/browser-before-castle` (all 300
files match that release) and `.build/elona-shooter-browser-party-slice.zip`
(8,432,781 bytes, SHA-256
`1a49d3530e19f2a8c31fcd3f167f128f5b33139735189489cdae34b38b1c99a7`).
Historical v14 recovery remains `.build/browser-before-party` and the Day7 archive.
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
- Opening mission0 and prepared missions1–6 on displayed Days1–7, victory/defeat,
  rewards and subsequent towns. Day4 includes BATCH1 wave selection, boss shields,
  fourth-town MOD stock and level-2 recruit growth. Day5 adds AIR waves and Fly
  movement, hovering, knockback, distant shadow, death and castle exit. The fifth
  town returns to ordinary stock, generates level-2/3 recruits and prepares
  mission5 with the Holy Grail reward. Day6 adds Barbarian movement, rage,
  accelerated attacks, knockback and death. Town6 prepares mission6 with Crow
  Statue1106. Day7 adds RANGED wave selection and the boss grenade special;
  the wall is hit at release and the travelling grenade's explosion is cosmetic.
  Its seventh town can generate level-4 recruits and prepares mission7; Day8
  combat remains disabled.
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
  the source boss appearance progression for the seven covered days.
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
  after dialog acknowledgment into Days2–7, without healing or spending gold/AP. Guns refill;
  consumable charges stay spent.
- Castle House/Wall clicks purchase immediately without AP, RNG or confirmation.
  House costs 2,000 then 5,000 GP, caps at 3 and enables the corresponding permanent
  companion slots without automatic hiring. Wall adds 5 current/maxHP, preserving
  the damage deficit; its price is derived from maxHP (first 240 GP). House adds 50
  upkeep per level and Wall adds 10 per purchase. Existing settled results remain
  historical. The original tiles, prices, levels and affordability are displayed;
  other Castle purchases and page2 remain disabled.
- Day6 settlement deducts the first 10 GP tax separately from default upkeep 40.
  Mission → Claim title costs 4 AP and grants Honorary Citizen, once eligible.
  It consumes no RNG and pays no immediate gold. Its 100 GP salary begins at the
  following settlement. Day7 deducts 45 GP tax and default upkeep 40; a previously
  earned title adds 100 GP salary once. A delayed first title can still be claimed
  in town7 without changing its already settled result. Seven perfect completions
  add medal62's absorption to future preparation, preserving active mission history.
- Pause, browser-local save, Continue and validated JSON import/export.
- Characters supports permanent hiring/cancel/dismissal of all nine generated classes,
  orders, Boss/Defend preferences and skill focus. Initial house capacity is one;
  House purchases expand it to two/three.
  Equipment preserves whole records and checks both directions of companion swaps;
  companion MOD No returns the MOD, unlike the owned-inventory swap behavior.
  Rest connects autonomous targeting, reloads, class effects, owner-attributed
  damage/projectiles and postbattle growth/wages. Pending confirmations and AI
  history survive save/Continue. This is not a claim of complete class-mechanic parity.
  Orders retain source quirks, including NoArmor falling through to Normal targeting.
  See [party integration](../web/docs/party-integration-status.md).

Other playable hero classes, Day 8+, Ragnarok, temporary Mission Hire, recruit
refresh, other card/search actions, stock refresh, the remaining Castle/economy
actions, complete global medals and original Flash
save conversion remain unfinished. Companion/town skills cannot exercise systems
that are still absent. No completion percentage is inferred from extracted assets
or test counts; see the [feature ledger](feature-ledger.json).
Interrupted Chain Gun spin-up/down still uses the known counter fallback; the
original audio-channel position and reverse-seek history are not yet persisted.
Exact interrupted spin timing is not claimed.

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

Current saves use **version 16**, accepting port versions **1–15** through
their existing migrations. House capacity, Wall level and maxHP persist separately;
older saves initialize Wall level 1 without changing HP, RNG, owned party state
or settled results. Unsupported legacy expanded capacity is not retroactively
invented. Version 15 introduced the party state below. Canonical party/candidate and inactive records, equipment,
pending confirmations, cached party effects, AI/retained targets and projectile
owners persist. Older saves install retained candidate history without RNG or
a hiring charge, and do not invent an owned companion. Town generation records
the skill effects used then, independently of later hiring/dismissal.
The corrected v15 importer repairs only the recognizable early-v15 air-as-armor
pattern, preserving target identities, cache coordinates/history and RNG. Mixed
or ambiguous states are rejected. Current live Crow/Fly spawns use source Air type 1;
Armor is type 2. This fixes port integration, not an original-game balance defect.

Version **14** added boss action5 windup and released grenades that resume with their
stored state. Only a Day7 v14-or-later grenade with damage -1 and no owned weapon slot may
use the cosmetic sentinel; other negative damage and older/day-mismatched saves
are rejected. Earned titles remain valid during Day7 battles and results, and
seventh-town recruit growth/medal history are validated without rerolling.

Version **13** added Barbarian and the first title. Barbarian records require rage state, rage-effect frame and
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

The v16 Castle release passes **298 tests**, TypeScript checking and its build.
Two identical original runs match **23 House/Wall observations**: ten controlled
starting states plus thirteen transactions covering payment, denied actions,
House3 cap, damaged walls, nonstandard maxHP and upkeep. These controlled source
methods do not establish natural affordability or full browser/campaign parity.
See [source audit](../web/docs/castle-upgrades-source.md) and
[UI extraction](../web/docs/castle-upgrades-ui-source.md). The original SWF/AS and
unrelated prior assets remain byte-identical; the Castle panel split and new
tiles/page controls are explicit extraction changes. Eleven browser checks match
complete expected save envelopes: denied House leaves state unchanged; Wall costs 240
and changes HP 40→45 and upkeep 40→50 while retaining the previously paid result; Continue
is exact; natural House2 costs 2,000 and its second hire 400; controlled House3
costs 5,000 and rejects further expansion; third hire costs 400; Rest preserves all
three companions; ten actual combat updates match production replay; results
show 150 upkeep and 188 wages, then town entry matches. Evidence:
`.build/browser-qa/castle-ui-verification.json`; screenshots include
`castle-house3.jpg`, `castle-three-companions.jpg` and `castle-party-result.jpg`.
The controlled capital provenance remains explicit. Publication matches the
accepted candidate. Production loaded `s1hKilh5`; New Game exported v16 at tick 0,
HP 40, gold 200, ammo 5, Wall 1/capacity 1. The actual v15 backup migrated and restored
with exact full-envelope equality at tick 674, HP 40, gold 209 and unchanged RNG;
paused and no console errors. Evidence:
`.build/browser-qa/castle-production-verification.json` and
`.build/castle-publication.json`; screenshot `castle-production-restored.jpg`.

The historical published v15 release passed **288 tests**, TypeScript checking, the release
build, focused party browser checks and production New Game/migration verification.
Party references match **61 transaction observations from 79 captured snapshots**,
**45 progression**, **75 AI** and **37 combat snapshots**, including source RNG and
the declared method boundaries. The **20 integration tests** and connected soak
exercise production hiring, equipment, Rest, owner credit, settlement and persistence.
Details and limitations are in [party integration](../web/docs/party-integration-status.md).
Historical v11–v14 release checks below
retain their original scope.
Original comparisons use controlled inputs/random draws and expected
results captured from the original, never regenerated from the port.

Day7 source captures match **ten wave cases**, **38 town/economy/recruit
observations** and **337 boss-special states**. They cover the RANGED branch and
fallback selection, level-four recruit thresholds/growth, salary/tax/medal timing,
special probability and level guards, windup, release, grenade flight, surviving
hits and death before/after release. Wall damage occurs at release; landing adds
art and two shake RNG draws without a second hit. All boss-special fields match
exactly after retaining the source's arithmetic order in projectile speed; the
initial one-ULP differences remain recorded. No comparison tolerance was widened.
See [wave notes](../web/docs/seventh-day-wave-source.md),
[town notes](../web/docs/seventh-town-source.md) and
[boss-special notes](../web/docs/boss-special-source.md). That v14 slice reused
86 images, 40 clips, 89 sounds and five fonts; v15 adds party UI assets.

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
Those two historical Day7 salary cases observed source methods only; the current
Day7 integration and its separate reference suite extend that earlier boundary.
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

The recorded v14 solo campaign soak passed **96 scenarios across 32 seeds**, with
**412,874 frames, 4,501 JSON checkpoints, 699 reward transitions, 760 town actions
and 162 Rest transitions**. It reached **32 Day2 victories, 32 Day3 victories,
25 Day4 victories and 13 Day5 victories**. Thirteen scenarios entered Day6;
one won, claimed the title and entered Day7; **zero won Day7**. The run exercised **297 equipment selections,
124 upgrade previews, 29 MOD mounts, 27 upgrades and 97 cancellations**,
with exact continued state/events after save/restore. Idle, aimed and interrupted policies
exercise actual integrated commands. The earlier projectile sweep separately
passed 27 configured cases/9,720 updates/1,080 checkpoints; 21 vertical regressions
check finite completion. These are bounded replay/stability tests, not original
parity, ordinary acquisition of every configured gun, or browser performance proof.

The separate v15 party soak passed **32 natural campaigns, 482,844 frames and
5,024 full JSON checkpoints**, with **192 Rest transitions and 810 reward actions**.
All nine recruit classes were naturally hired and fought; every run reached Day7,
with **30 victories and two castle defeats**. Companions produced **6,559 shots,
5,658 hits, 3,174 kills, 2,583 reload starts and 1,386 projectiles**. Wages totaled
15,311 across 190 settlements. Ordinary collisions use production filled contours;
bosses retain the documented headless rectangle fallback. State and newly emitted
events match restored execution; this is not original campaign or browser parity.
The full run was repeated after correcting airborne target classification, with
the same totals and hashes matching the corrected runtime. Reports, per-class
activity and replay logs are in `.build/party-soak/`, with
133 derived UI checkpoints indexed by `.build/browser-qa/party-soak-fixtures.json`.

A separate connected campaign test reaches a Day7 victory with 10 HP using
ordinary fifth-town Free Repair, boss-windup/Archer targeting priority, critical
aim and an owned grenade. Rewards, title salary and seventh-town save/restore
then complete. This test uses rectangular hit geometry and retains its pre-existing
Day1 39-HP setup; it is not production-contour or original-balance proof. All
recorded pre-party attempts from the earned 11-HP checkpoint using production ordinary
contours failed. Both these historical solo failures and the successful rectangle-based test
remain recorded separately, including
`.build/test-probes/day7-connected-campaign-report.json` and the Day7 provenance
files under `.build/browser-qa/`. No full browser campaign victory is claimed.

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

The v14 browser entered Day7 through ordinary Rest from the earned Day6 town,
retaining title 1, 11 HP and 4,596 gold; Continue restored the complete save
unchanged. A separate imported Day7 result from the documented rectangle-based
campaign test proceeded to the seventh town and restored exactly through Continue.
That result fixture does not establish a browser victory using production geometry.
A controlled boss at (160,240) completed its windup, damaged the wall from 11 to 9
and launched one grenade. The 15-update in-flight export matched normal production
ticks, and Continue restored it exactly. A further 43 updates matched the full
expected state, including the cosmetic explosion at tick 12601, no further wall
hit and removal of the projectile. All nine full-envelope comparisons passed;
the controlled setup and render observations remain separate from original-source
and complete-campaign parity claims.

The same tested v14 bytes were published. Production New Game reached tick 0
with 40 HP, 200 gold and five shells. The prior live v13 save was restored through
the UI, paused at tick 674 with 40 HP, 209 gold, five shells, 10 kills and boss
HP 75/150; no console errors were observed. The complete envelope matched the
expected v13→v14 migration, preserving appearance, and the resulting v14 save
restored exactly. Historical v14 publication and browser evidence are in
`.build/day7-publication.json`, `.build/browser-qa/day7-ui-verification.json`
and `.build/browser-qa/day7-production-verification.json`; the restored production screenshot
is `.build/browser-qa/day7-production-restored.jpg`.

The published v15 browser verified hiring for 400 gold with unchanged AP/RNG,
pending-confirmation Continue, order 6, equipment removal/return, Rest and exact
35-update combat state. An earned companion reload checkpoint advanced 13 updates,
inserted one shell and matched the complete expected save. The observed result
included wage 53; town entry and pending/cancelled/confirmed dismissal also matched
full expected saves. These checkpoints are documented in
`.build/browser-qa/party-ui-verification.json`; they do not assert a manually
played full browser campaign. Production New Game reached tick 0, HP 40, gold 200,
ammo 5. The old v14 save restored paused as v15 at tick 674, HP 40, gold 209, with
unchanged RNG and exact full-envelope migration/restore equality. No console
errors were observed. Publication hashes and production evidence are in
`.build/party-publication.json` and `.build/browser-qa/party-production-verification.json`.
All 14 existing party UI export checks were revalidated against the corrected
runtime. A separate earned Day 5 save at tick 9770 repaired Crow type 2→1 through
browser import with complete expected-state/restore equality and unchanged RNG;
`.build/browser-qa/party-air-verification.json` records this boundary. Actual
Crow/Fly spawn and Air (4)/Armor (5) selection have focused Simulation regressions.
Import Save was also observed disabled during asset loading and enabled only after
scene creation. The final published bundle passed a fresh New Game and actual v14
backup restoration, with no console errors.

The separate v16 Castle/expanded-party run passes **nine campaigns, 135,297
frames and 1,450 checkpoints**, with **54 Rest transitions, 223 reward actions,
10 House and nine Wall purchases**. All eight natural campaigns earn a second
companion. The ninth starts from an earned first town with a clearly recorded
12,000-gold grant, then buys House3 and hires naturally generated candidates;
no HP, skill, equipment, candidate or RNG grant is made. There are 23 two-companion
and 4 three-companion battle entries, and all nine finish Day7. This demonstrates
integration and save/event replay, not natural three-companion affordability,
original balance or browser performance. Ordinary collision uses source contours;
boss collision retains the documented rectangular fallback. Evidence:
`.build/castle-party-soak/report.json`; command from `web`:
`node --experimental-strip-types scripts/party-soak.ts 8 castle`.

## Next integrated work and continuation

The next useful slice is **remaining Castle page0 actions**, starting with paid
Fix Wall and Repairman after a fresh source audit of costs, repair timing and
upkeep. This connects early-town spending and repeated battles before extending
the campaign again. Storage, Looter, Trainer and Sandbag should follow in bounded
integrated slices, rather than be treated as one large prerequisite. The
[House/Wall source audit](../web/docs/castle-upgrades-source.md) and
[UI notes](../web/docs/castle-upgrades-ui-source.md) preserve this milestone's boundary.
Later campaign work still includes Lava and further town thresholds; Day8 onward
remains unavailable. The veteran late-game hitbox report is still unproven and
requires its own failing original encounter before a correction is claimed.

The long-term goal and the existing **30-minute watcher remain active**. Unchanged
monitoring stays quiet. The user is asleep and authorized autonomous continuation;
request help only for a consequential decision or access that cannot be resolved
independently. Current user direction overrides old plans and watcher instructions.
Original SWF/AS and startup-fix baselines remain unchanged. Their separate
[SWF verification](verification.json) is not browser-port completeness evidence.
