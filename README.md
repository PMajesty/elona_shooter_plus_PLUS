# Elona Shooter Plus PLUS

A browser remake of **Elona Shooter Plus 1.3.0.4**, written in TypeScript with
Phaser 4. The published **v24 release** covers **nine connected Sheriff days**:
choose one of 22 appearances, fight, collect ordinary and boss loot, choose earned
skills, enter town, hire permanent companions, improve the House, Wall and Sandbags,
expand Storage, employ Repairmen and Trainers, exchange equipment, buy/sell and
upgrade weapons, mount MODs, repair
the castle with gold or AP, then Rest into Days 2–9 with your
retained party and equipment. Victory, defeat,
rewards, town entry and save/restore work across these stages. Original English
artwork, fonts, audio and credits are retained.

Day 9 adds the original Barbarian fallback draw, Rat spawn batching and ninth
settlement/town. Town9 prepares the first six-wave boss-day mission, with ordered
Shop Token/Dragonfly Statue guarantees, but **Day10 combat remains unavailable**.
The v24 release is published at [the local game](http://127.0.0.1:5175/elona/).
It passes **406 unique tests** across the
403-test suite and three added title tests, plus typechecking and the final build.
Original wave/spawn/town and title hit-area comparisons, six complete-save UI
paths, four title controls and production New Game/exact v23-save restoration pass.
All 310 live and ZIP files match the tested build. Archive:
`.build/elona-shooter-browser-day-nine-slice.zip`; rollback:
`.build/browser-before-day-nine`, retaining all 310 v23 files.

The historical **v23 Day8 release** added Lava, the original later spawn batching,
the eighth settlement/town and the first possible Mk-3 random weapons. It passed **386 tests**,
the accepted source comparisons, four natural eight-day campaigns and five
complete-save browser checks. It was published at
[the local release](http://127.0.0.1:5175/elona/) with successful production New Game
and exact v22-save migration/restore checks. All **310 live and archive files**
matched its tested build. The deployable archive is
`.build/elona-shooter-browser-day-eight-slice.zip`; the verified v22 release remains
in `.build/browser-before-day-eight` and the Trainer archive below.

The historical **v22 Trainer release** was published after 363 passing tests,
27 accepted original observations, seven complete-save UI checks and production
New Game/exact v21-save migration and restore checks. Trainer connects the original
Castle purchase to hero and companion kill XP, with no recurring upkeep.
The deployable archive is `.build/elona-shooter-browser-trainer-slice.zip`;
the verified v21 release remains in `.build/browser-before-trainer` and the
Looter archive.

The historical **v21 Looter release** was verified with 351 passing tests,
26 accepted original observations, seven complete-save UI checks and successful
production New Game/exact v20-save migration and restore checks. Looter now
connects the original Castle purchase to future ordinary/boss generation budgets.
Its deployable archive is `.build/elona-shooter-browser-looter-slice.zip`;
the verified v20 release remains in `.build/browser-before-looter` and the prior
loot MOD archive. Earlier recovery and verification evidence is retained below.

This is not yet the complete game. Day 10 onward, other playable hero classes, full town
management, the other Castle upgrades, temporary henchmen, recruit refresh, other card actions, Ragnarok and
original Flash save conversion remain to be ported. Ordinary firearms use owned
item statistics and weapon-skill requirements; the covered Sheriff combat skills
affect play. Unsupported actions remain unavailable. See
[port status](docs/port-status.md) for coverage, evidence and differences.
The complete preserved Flash game and its Ruffle startup fix remain available
as the comparison and recovery baseline.

## Run the browser version

Install **Node.js 22.12 or later** with npm. From the repository root in Windows
PowerShell:

```powershell
Set-Location web
npm.cmd ci
npm.cmd run dev
```

Open [the local game](http://127.0.0.1:5173/), choose **New Game**, select an
appearance and press **Proceed**. Sheriff is the implemented class.

| Control | Action |
| --- | --- |
| Mouse | Aim |
| Left click | Fire; hold/release to draw/fire a bow; interrupt a manual reload |
| Space | Reload; resume while paused |
| 1–5 | Select a firearm or use the item in that inventory slot |
| Esc | Pause / resume |

Losing browser focus pauses combat. The game saves locally in this browser;
**Continue** restores that save. **Export Save** and **Import Save** transfer a
browser-port save as a JSON file. These saves use a separate format from Flash
and do not automatically follow you to another browser or website.

The starting grenade is in slot 2. Grenades, Repair Hammers and the Holy Grail
use their original charge/cooldown or protection rules. Using a consumable keeps
the selected weapon. Hammers consume a charge even at full HP; the Grail is
single-use. Firearms require their indicated weapon skill. Reloading, automatic
fire and automatic reload follow the selected item's properties.

Long/Wind Bows, both Crossbows, the Grenade Launcher, Rocket Launcher,
Gravity Gun and Flamethrower now use their original projectile behaviors and
artwork when owned and usable. Wind Bow releases three arrows. Gravity Gun
starts reloading immediately while its projectile continues. Exactly vertical
shots use an explicit corrected path: the original divides by zero there.
That correction is separate from the still-unreproduced late-game hitbox report.

Day 3 can introduce the original Archer. Its bow damages the castle when the
arrow is released; the separate flying arrow is visual and does not apply a
second hit on arrival. Original attack, movement, knockback and death frames
are retained. The source's missing `stand` label resolves to frame 1 in the
captured Ruffle runtime; the port matches that observed behavior rather than
introducing another gameplay correction.

After victory, the reward sequence is **ordinary loot → earned boss prizes →
earned skill choices → results**. Click an item to pick it up and click a slot to
place or swap it; click outside the slots to cancel. Proceed leaves unclaimed
items behind. Skill choices show original descriptions and previews. Owned inventory slots,
offers, pending choices and chosen traits persist without
rerolling when you reload a current save. Gold is settled once after the reward
choices finish, when results appear.

Proceed from results to the first town, still on **Day 1**, with **4 AP**. Open
the Castle tab to use **Free Repair**: it costs **2 AP**, restores all wall HP
and costs no gold. Click to acknowledge its message. A full wall costs no AP to
repair again. **House** and **Wall** are immediate gold purchases, with no AP
cost, RNG draw or confirmation dialog. House1→2 costs **2,000 GP** and House2→3
costs **5,000 GP**, permitting two or three permanent companions; it does not hire
anyone automatically. The first Wall costs **240 GP** and adds five current and
maximum HP, retaining any existing damage deficit. Its following price depends
on maxHP. Each extra House adds **50 GP** daily upkeep and each Wall adds **10 GP**;
the already-settled result does not change.

**Fix Wall** spends **8 GP per missing HP** and fully heals without AP or a
dialog; at full HP it is unavailable. **Repairman** starts at **700 GP**, then
costs 950 GP at level 1, with later prices `250 × level² + 700`. Buying a level
adds **60 GP daily upkeep** and repairs **2 HP per level** when an opening or
ordinary wave begins, capped at maximum HP. Buying it does not heal immediately.
The final battle-completion boundary does not repair. Wave repair occurs before
the original perfect-wave check, but cannot undo a previously lost perfect bonus.
**Sandbag** costs **1,000 GP** initially, then `240 × level² + 1,000`, and caps
at **level 10**. Each level lowers the castle damage multiplier by0.05 and adds
**40 GP daily upkeep**. Existing mission absorption, protection and integer
rounding/minimum-damage rules still apply; buying it does not heal. At the cap,
repeated clicks cost nothing. The displayed absorption hint retains the original
floating-point calculation and truncation.

**Storage** adds one owned slot per purchase, from **six to sixteen**. The first
costs **370 GP**; later prices are `(current slots - 4)² × 30 + 250`. Each extra
slot adds **40 GP daily upkeep**. Shop, Equipment and ordinary/boss loot show eight
columns and a second row when needed. Purchases, sales, swaps, town Upgrade/MODs,
Shop Tokens and companion equipment use the expanded slots; only the **first five**
remain battle hotkeys. At16 slots, further purchases cost nothing and are blocked.
Castle page2 remains unavailable. MOD mounting during ordinary and
boss loot uses these same expanded slots.

**Looter** is available in Castle. Its first level costs **300 GP**;
subsequent prices are `125 × current level² + 300`, with no source level cap.
Each level adds **5 GP daily upkeep**. Level zero has multiplier 1; positive
levels use `1.05 + level × 0.08` when generating random ordinary replacements
and boss prizes. This raises the generation budget, not every item's sale value:
guaranteed drops and already-owned/offered items are unchanged, the minimum
budget remains 500, and individual outcomes can stay the same. Purchase consumes
no AP or RNG and does not alter a settled result.
**Trainer** is available in Castle. Purchases cost
`180 × current level² + 250` (250, then 430 GP), without a source level cap,
AP cost, RNG draw or additional upkeep. Kill XP uses multiplier 1 at level zero,
otherwise `1.03 + level × 0.04`, after the original integer adjustment stages.
The observed original applies it to both hero and companion kills. Weapon XP and
the fixed **250 XP daily completion award** are unchanged. Its original tile,
level, affordability and float-truncated percentage hint are retained.

Town preparation generates stock, cards, next-mission data and a
recruit once. Open the Shop tab, click stock to pick it up, then click an empty
owned slot to buy it. Owned items can be moved or swapped; dropping one outside
the slots asks to sell it. Only Yes confirms, and any other dialog click cancels.
Shop Tokens discount stock. Town HP, AP, prepared data and full inventory records
survive save/restore. **Mission → Rest** opens the original Resting dialog;
acknowledging it begins the prepared next battle, up to Day 9. Rest does not heal
the castle, spend AP or cost gold. A purchased Repairman heals when the opening
wave starts after Rest. Guns refill; consumable charges stay spent.
Days 2–8 each end in their own rewards and prepared town. Day 4 adds the source's
harder BATCH1 wave pattern and boss shield. The boss turns when retreating,
plays its original firing and shield frames, and reduces guarded damage to
one tenth plus one. The fourth town generates the original MOD sale with a
guaranteed Auto Reload Mod and may prepare a level-2 recruit. Four perfect
days award the next protection medal for future mission preparation. Day 5 adds
AIR waves and the original Fly's flight, hovering, distant shadow and falling
corpse. The fifth town returns to ordinary stock, can generate level-3 recruits
and prepares the Holy Grail mission reward. Each Fly starts with counter 0 and
knockback resistance 1: this deliberately fixes the observed original pool
carrying those fields over from a previous enemy. Fresh and explicitly reset
original runs provide the comparison; raw pooled cases remain recorded separately.
Day 6 adds the original Barbarian, whose surviving-hit rage increases movement
speed and accelerates attacks. Its original unequal current/stored speed formulas
remain intact. Rage artwork participates in collision; hit particles also affect
the original knockback bounds. The sixth-day result includes the first **10 GP tax**.
In town, **Mission → Claim title** spends **4 AP** to grant **Honorary Citizen**;
it pays no gold immediately and does not change the settled result. Its **100 GP
salary** starts with the following day's settlement. Day 7 adds the original
RANGED wave branch and the boss grenade special: the wall takes damage at release,
while the later explosion is cosmetic. Surviving hits during windup double only
the boss's damage accumulator; a lethal hit prevents an unreleased grenade.
Day 7 settlement includes 45 GP tax, default upkeep of 40 GP and any earned title
salary. Its town can generate level-4 recruits; seven perfect days grant the next
absorption medal for future mission preparation. The release carries that
prepared mission and its historical absorption into Day 8. Lava warns the party,
keeps moving during its attack and explodes against the wall; killing it before
the explosion uses its ordinary death/reward path. Day 8 also permits source
Sheep batching. Its result has 80 GP tax plus actual upkeep and wages, with any
earned title salary. Town 8 retains normal stock and level-2–4 recruits, permits
Mk-3 random weapon variation and prepares mission 8 without guaranteed calendar
loot. The v24 release carries that mission into Day9, with the added fallback
draw and Sheep/Rat batching thresholds. Its result deducts115 GP tax plus actual
upkeep/wages. Town9 keeps level2–4 recruits and the Mk3 cap, while preparing the
first boss-day mission: six waves, bossWave5 and no normal boss-wave RNG draw.
Its ordered future guarantees are Shop Token then Dragonfly Statue, after the
optional Ragnarok roll. These are not immediate items. Rest beyond Day9 remains unavailable.
Recruit refresh, temporary Mission Hire, other card actions and Refresh Stock remain unavailable.

Open **Characters**, select the candidate and choose **Recruit** to hire one of
the nine generated classes. All nine can be hired and fight; this does not claim
every class mechanic is complete. The initial house allows **one permanent companion**;
Castle House purchases expand that limit to two, then three.
Yes pays the displayed gold without spending AP or rerolling the prepared mission;
No cancels. Set the companion's order, Boss/Defend preferences and eligible skill
focus there. Orders retain observed source quirks, including NoArmor falling
through to Normal targeting. **Equipment** exchanges its gun with hero inventory while checking
both sides' skill requirements. MOD No on a companion returns the MOD without
swapping the gun. The companion fights autonomously after Rest, earns its own
combat credit and growth, and incurs a daily wage in results. Dismissal does not
refund hiring or return the gun to inventory; the original inactive record remains
saved. See [party integration](web/docs/party-integration-status.md) for behavior
and evidence. Interrupted Chain Gun spin timing still uses a counter fallback;
its original audio-position history is not yet reproduced.

In the shop, **Upgrade Weapon** requires **4 AP** to enter selection mode.
Choose an owned gun to see its before/after comparison and gold cost;
only Yes pays the displayed gold and spends the AP. Check the new weapon-skill
requirement before confirming: upgrading does not grant that skill, and a red
requirement means the weapon is currently unusable. **Upgrade keeps all mounted
MODs and Living Weapon progress.** This intentionally fixes the original
upgrade parser dropping the final modifier; it is not a claim to reproduce that
defect. Opening a preview consumes the original random draws. Cancel keeps the
gun, gold and AP, but does not rewind RNG; opening another preview generates a
new one.

To mount a MOD in town, pick it up from owned inventory and click an owned gun.
Version 20 also supports this on ordinary and boss loot screens, with
any offered/owned source and destination, including expanded inventory slots.
Yes mounts a compatible MOD without spending AP, gold or RNG, and consumes the
MOD while retaining its inactive metadata. Rejected mounting keeps both items.
**No or clicking outside this confirmation swaps the MOD and gun**, matching the
original non-ally behavior; it does not cancel like a sale. Mounting on an offered
gun does not collect it automatically. While confirmation is open, clicks cannot
also move another item or advance rewards. Stock MODs must first be bought into
an empty owned slot.

Current saves use **version 24**; versions **1–23** are accepted. Version23
migration changes only the version and retains RNG, party, upgrades and prepared
history. Day9 uses the saved mission8; town9 validates its six-wave boss-day
preparation and ordered guarantees without enabling Day10. Version22
migration changes the format version without rerolling existing state. Day8
records retain the prepared/prior town and historical absorption; Lava requires
its alert flag and hit-effect history alongside the existing enemy state. Older
or earlier-day saves cannot introduce Lava. Canonical
`trainerLevel` is a nonnegative integer; older saves initialize it to zero without
purchases, XP changes or RNG draws. Existing `looterLevel`, items, offers, party
state and settled results remain unchanged. Pending
loot MOD confirmation retains both area/index endpoints and resumes on the same
reward screen without repeating a move or enchant. Older versions initialize it
to null without consuming RNG. Capacity is the owned inventory length 6–16;
Storage level is derived as slots minus five, with no duplicate saved level.
Versions 1–18 retain their six-slot inventory; v19 retains its actual expanded
capacity. Migration makes no purchases or RNG changes and discards no item metadata. Sandbag
level0–10 persists; older saves initialize it to zero without spending, healing,
changing RNG or repricing settled results. Repairman
level and the paid Fix Wall purchase count persist. Older saves initialize both
to zero without buying, healing, consuming RNG or changing settled results. House
capacity, Wall level and maximum HP persist as distinct fields. Legacy saves
initialize the previously absent Wall level without replaying purchases or
changing RNG, retained party records, HP or settled balances. Party records,
candidate history, equipment, pending confirmations, AI targets, cached bonuses
and projectile owners persist. Older saves migrate without a hiring charge or
RNG draw and do not gain an owned companion. Day 7 boss windup,
released cosmetic grenades and the active title persist without relaunching or
rerolling. Barbarian rage and temporary effect frames/offsets remain saved.
Pre-v13 saves begin without a title and retain their RNG and inventory; v13
titles remain intact. Fly hover counters,
animation and shadow history persist, alongside boss facing, Archer attack
counters and cosmetic arrow flight. Older saves retain the applicable migration
rules, including an empty enemy-arrow list and the former boss-facing default
where those fields were absent. Pending Upgrade and MOD
confirmations survive reload, preserving the chosen items and the exact stored
upgrade preview without another random draw. In-flight projectiles and
charged bows resume without relaunching or rerolling. Legacy hand grenades retain
their stored positions, damage and remaining lifetime. Ammo and reload timers live
on the owned items, with a selected slot, five item cooldowns and saved
protection state. Weapon experience is tracked separately for Small Gun, Big
Gun, Rifle, Shotgun and other items. Legacy scalar experience maps to Shotgun;
the old ammo/cooldown fields migrate without rerolling inventory. Days 2–9 saves
retain the prepared mission and prior town, including the historical absorption
bonus that applied when battle began. New characters retain the
original hidden growth potentials and base aiming/teamwork rolls. Portrait and
selected-Sheriff clicks reroll the character before Proceed, as in the source.
Older missing hero data is reconstructed with explicit provenance on a separate
random stream; its lost history cannot be recovered. Migration preserves the
saved combat RNG and owned item records. An older result that skipped earned rewards
resumes at the still-owed stage, generating those rewards once with the saved
RNG. Earlier versions paid gold before reward selection; migration preserves
the final balance while moving payment to results and initializing AP once.
Version 4 town saves retain their settled gold, AP and HP while missing town
preparation runs once. Current saves retain inactive item metadata and completed
search initialization; metadata discarded by older versions is unrecoverable.
Original Flash saves use a different format.

## Build and host on your website

From `web/`:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

The build writes `web/dist/`. Upload **the contents of that directory**, keeping
its asset paths intact, to a static website directory such as
`https://example.com/games/elona/`. Serve its `index.html` over HTTP or HTTPS;
do not open the built file with `file://`.

Vite uses `base: './'`, so the build supports a website subdirectory. You can link
to the game or embed that URL in an iframe. Phaser and the game assets are served
with the build: the browser version needs no Flash plugin, Ruffle, external CDN,
or gameplay server. Node and npm are development tools, not hosting requirements.

## Automated fidelity checks

`npm.cmd test` runs ordinary regressions, including captured results from the
original ActionScript game. The accepted fixtures currently cover 72 reload
snapshots, first-day wave generation under three controlled random seeds and
21 spawn/single-pellet snapshots, 157 item/loot snapshots, nine Sheriff skill
choice cases, 11 result-settlement/Free Repair snapshots, 16 first-town preparation
snapshots including all nine recruit classes, 12 character creation/growth
snapshots, three prepared second-day wave snapshots, 22 actual shotgun-firing
snapshots, 56 equipment/input snapshots, 17 castle-damage/protection snapshots,
three final Rest transitions from 12 original observations, six second-town
preparation snapshots, and 19 ordinary-enemy
collision grids containing 77,824 sampled points from the original display shapes. The pellet
tests supply original geometry as input; separate contour tests exercise the
same collision implementation used in the browser. Coverage is documented in
the feature ledger rather than inferred from the number of passing tests.
Negative controls verify that missing shell feedback and altered RNG consumption
are detected. Expected original results are never regenerated from the port.
Projectile comparisons add **14 original scenarios with 650 recorded updates**,
covering every projectile family, hits, penetration, overlapping corpses, weapon
switching and random draws. A separate native probe checks first-update timing;
two vertical-shot diagnostics preserve the original failure and verify the
intentional correction. These are bounded comparisons, not a complete replay of
an original battle.

Upgrade/MOD checks add **104 observations per run in two identical original runs**:
**88 production comparisons pass**, including **84 complete reference-item
comparisons**. Four comparisons defer reference-item equality to a separately
captured corrective step. The other **16 observations** retain the raw original
last-MOD-loss defect as source evidence. Corrected previews are compared against
the original `enchant` method reapplied to the omitted modifier, with retained
Living Weapon progress; expected corrected values do not come from the port.
See [oracle notes](docs/oracle-notes.md) for this explicit comparison boundary.

Day 3 adds **five original wave-generation cases** and **six third-town
preparation cases**. Archer comparisons cover **517 original state snapshots**
and **six collision grids containing 24,576 points**, including release-time
castle damage, arrow flight/removal, the missing-label fallback and changing
display widths at the left knockback boundary. This fixture explicitly steps
enemy AI and child frames; native timeline scheduling and browser rendering
remain separate checks. It introduces no intentional behavior correction.

Day 4 adds **seven original wave cases**, **16 town/recruit observations**, and
**305 boss observations** (301 AI states plus four guarded/open hit cases).
The harder wave branch, shield, facing, animation stops, damage and exact RNG
match the captured original within those controlled scenarios. The renderer
also now tests a projectile against the boss's current pose. A controlled browser
regression distinguishes the former miss from the corrected 40-damage hit.

Day 5 adds **nine original wave cases**, **17 town/recruit observations**, and
Fly comparisons covering **503 fresh or explicitly reset states** plus
**eight full body/shadow grids containing 81,920 points**. Another **73 raw
pooled states** preserve the source defect evidence. Exact Fly width and
movement comparisons also exposed and corrected narrow bounds-rounding and
signed-zero differences; the existing Archer bounds table is unchanged.
See [Fly source notes](web/docs/fly-source.md) for the correction boundary.

Day 6 adds **nine original wave cases**, **22 town/economy/title observations**,
and **671 Barbarian state snapshots** with **12 collision grids containing
76,800 points**. The comparison includes rage, accelerated attacks, temporary
particle bounds, damage and exact RNG. A real contact probe confirms that the
parent's hit particles change the left knockback clamp. See
[Barbarian notes](web/docs/barbarian-source.md) and
[sixth-town notes](web/docs/sixth-town-source.md) for the controlled boundaries.

Day 7 adds **ten original wave cases**, **38 town/economy/recruit observations**
and **337 boss-special snapshots**, all matching the captured original. The boss
comparison covers branch boundaries, stopped windup, release-time wall damage,
grenade flight, shake RNG and death before/after release. See
[boss-special notes](web/docs/boss-special-source.md),
[seventh-day wave notes](web/docs/seventh-day-wave-source.md) and
[seventh-town notes](web/docs/seventh-town-source.md).

The v24 Day9 release matches **12 original wave cases**, **12 timer-spawn
observations** and **22 town/recruit/item/mission/settlement observations**, each
from two identical original runs. They cover the strict Barbarian fallback
threshold, Rat continuation, shrinking queues and the prepared boss-day's skipped
RNG draw. Calendar guarantees retain source order, and the existing Mk3 cap is
checked independently of its changing probability. See
[Day9 wave/spawn notes](web/docs/ninth-day-wave-source.md) and
[ninth-town notes](web/docs/ninth-town-source.md).

The release passes **406 unique tests**: the403-test suite plus three added
title tests. Typechecking and the final build pass with bundle
`assets/index-D8Tk-vVM.js` in `.build/browser-day-nine-final` (310 files).
The current natural campaign run reaches and wins Day9 in all four cases, with
82,162 ticks, 865 runner checkpoints, 32 Rest transitions and105 fixtures. It
records17 multi-spawn callbacks, six Rat continuations, ten Lava spawns/kills and
three alerts, with no gold, HP, item or RNG grants. Independent replay verifies
all105 fixture hashes/full states and82,417 operations/events, restoring at93
distinct boundaries; the865 runner checkpoint schedule is not recreated.
All observed ninth bosses have350 HP/appearance59. No Lava explosion occurs in
these winning branches. These are port integration
observations using production ordinary contours and the declared headless boss
rectangle, not original whole-campaign parity. All307 public assets remain
byte-identical to v23. Six complete-envelope UI paths pass: town8 Continue,
Rest into Day9, battle Continue, actual idle spawn batching, result→town9 and
blocked Day10. Production New Game starts at tick0, HP40, gold200 and five shells;
the actual v23 backup restores as the exact expected v24 envelope at tick674,
HP40 and gold209, with unchanged RNG, paused and no console errors.
All 310 live/archive files match the tested build. The ZIP is 8,666,208 bytes,
SHA-256 `0a5c6185feb98bff00ee2fa3aa81cb63dd51ced930eca82756c52d3e5b58f69b`.
Evidence: `.build/day-nine-party-soak/report.json`,
`.build/browser-qa/day-nine-scenario-audit.json` and
`.build/day-nine-asset-preservation.json`,
`.build/browser-qa/day-nine-ui-verification.json`,
`.build/browser-qa/day-nine-production-verification.json` and
`.build/day-nine-publication.json`.

New Game, Continue and Help now use the original text-field hit regions, including
transparent spaces between letters, instead of requiring visible PNG pixels.
All12 original state observations/204 points match; six alpha-zero samples
demonstrate the previous missed-click behavior. Current-state borders and the
separate pointer Hit state remain distinct. Actual browser New Game and Help
clicks at transparent points, Continue restoration and an outside control all pass.
The four controls are recorded in `.build/browser-qa/day-nine-title-ui-verification.json`. See
[title hit-area notes](web/docs/title-hit-source.md). This corrects port input
behavior and does not claim full native event ordering or pixel parity.

The historical v23 Day8 release matches **10 original wave cases**, **10 timer-spawn
observations**, **18 town/recruit/variation/settlement observations**, and **659
Lava states plus 12 collision grids (76,800 sampled points)**. The source captures
are repeatable and retain the original method bodies and non-code resources.
They establish the declared method boundaries and sampled geometry, not complete
native scheduling or pixel parity. See [Day8 wave/spawn notes](web/docs/eighth-day-wave-source.md),
[town notes](web/docs/eighth-town-source.md) and [Lava notes](web/docs/lava-source.md).

The Lava comparison exposed six port-only false positives at the explosion
corpse's slanted edge. The correction retains the full global f32 inverse
transform, its separate integer-twip rounding stages and ties-to-even behavior;
the original expected points and tolerance are unchanged. Earlier contour
references still pass. These corpse checks can consume hit-processing RNG, so
the correction matters beyond appearance. It does not reproduce the reported
veteran late-game hitbox problem. Focused save checks cover prepared mission
history, party/upgrades, actual companion alert, both Lava death paths and
version22 migration without rerolls.

The published build passes **386 tests**, TypeScript checking and its build.
Four fresh natural campaigns all win Day8, with **72,263 simulation ticks**, 764
runner checkpoints and 93 captured fixtures, without gold, HP, item or RNG grants.
They observe four Lava spawns/kills, one alert and five multi-spawn callbacks.
Independent replay verifies all 93 fixture hashes/full states and **72,494
operations and events**, restoring at 81 distinct fixture boundaries; it does
not recreate the runner's separate checkpoint schedule. Ordinary enemies use
production contours; headless bosses retain the declared rectangle fallback.

A separate ordinary-input branch from the earned natural-2 Day7 town changes
companion orders and deliberately allows a Lava attack. Its 663 operations,
658 ticks and seven fixtures replay exactly: the explosion reduces HP43→32,
credits no kill and removes the actor. This is an earned branch, not another
independent campaign or a granted encounter. Five complete-envelope browser
checks pass for Rest into Day8, Continue, the actual one-frame Lava34→35
explosion, result→town8 and blocked Day9. No console errors were observed.
The final title shows `Sheriff · Day 8`. Production New Game starts at tick0,
HP40, gold200 and five shells; restoring the actual v22 backup yields the exact
expected v23 envelope at tick674, HP40 and gold209, with unchanged RNG, paused
and no console errors. The bundle is `assets/index-CPbT627r.js`. All 310 live/ZIP
files match `.build/browser-day-eight-release`; the ZIP is 8,665,911 bytes,
SHA-256 `d94325f7ef63956bd3f0f86527e385f24fae799b3b0b777ac089a35546d6772d`.
Rollback `.build/browser-before-day-eight` preserves all 308 v22 files. Evidence:
`.build/day-eight-party-soak/report.json`,
`.build/browser-qa/day-eight-scenario-audit.json`,
`.build/browser-qa/day-eight-lava-exposure-audit.json` and
`.build/browser-qa/day-eight-ui-verification.json`,
`.build/browser-qa/day-eight-final-label-verification.json`,
`.build/browser-qa/day-eight-production-verification.json` and
`.build/day-eight-publication.json`.

The v22 Trainer release passes **363 tests**, TypeScript checking and its build
(`assets/index-mtID2Ws9.js`). **All 27 original observations are accepted**:
11 purchase observations and 16 kill/settlement cases. Six focused reference tests
include five negative controls for a hero exemption, early multiplication before
integer XP stages, multiplying daily XP, extra weapon XP and premature party-cache
refresh. The observed original `_root.pc` is undefined, so Trainer affects hero
kills too; this source behavior is retained. Threshold cases verify both growth
draws before later drop RNG. See [Trainer source notes](web/docs/castle-trainer-source.md),
`web/tests/fixtures/original-castle-trainer-trace.json` and
`.build/oracle/castle-trainer-comparison-report.json`.

Four natural campaigns pass **61,042 frames and 732 save/event replay checkpoints**,
with 16 Trainer purchases, 24 Rest transitions and four Day7 wins, without gold,
item, HP or RNG grants. Of 1,332 paired single-kill observations, 442 hero and 451
companion credits increase, with four earlier level-ups. Another 48 ambiguous
frames are retained without isolated attribution. All 24 paired daily settlements
are identical except for Trainer level. These one-boundary Trainer0 controls are
port integration measurements; they do not replace the original comparison.
The runner uses production ordinary contours and the documented boss rectangle
fallback. Evidence: `.build/trainer-party-soak/report.json` and
`.build/trainer-tests-output.txt`.

The independent audit in `.build/browser-qa/trainer-scenario-audit.json`
confirms all 224 saved fixtures, 16 purchases, 1,332 paired kills and 24 daily
settlements. Seven full-envelope UI checks pass: Trainer levels 1/2,
insufficient-gold rejection, Continue, Rest, companion growth and earned
result/town entry. From an earned checkpoint, three actual browser updates take
White from level 4 / XP 937 to level 5 / XP 0; the separate Trainer0 control ends
at level 4 / XP 992. This is an observed browser transition plus a port control,
not a new original scheduler comparison.

All 308 candidate/live/ZIP files match and all 305 public assets are unchanged.
Production New Game starts at tick 0, HP 40, gold 200, ammo 5 and Trainer 0.
The actual v21 backup migrates and restores with complete-envelope equality at
tick 674, HP 40 and gold 209, with unchanged RNG; paused, without console errors.
Evidence: `.build/browser-qa/trainer-ui-verification.json`,
`.build/browser-qa/trainer-production-verification.json` and
`.build/trainer-publication.json`.

The v21 release passes **351 tests**, TypeScript checking and its build.
**All 26 original observations are accepted**, covering purchase/denial, upkeep,
live ordinary/boss generation, exact budgets/RNG/item records, unchanged guaranteed
drops and shop generation. Four focused reference tests include negative controls
for omitting the current level, rounding instead of truncating budgets and
multiplying guaranteed items' final values. Actual capture confirms the source
hint displays 100% at level 12 and 109% at level 13. No runtime correction or
expected-value adjustment was required. These source-method comparisons remain
separate from native scheduling and the actual browser checks below.

Four natural campaigns pass **61,187 frames and 703 save/replay checkpoints**,
with 16 Looter purchases, 24 Rest transitions and 101 reward actions. All four
finish Day 7. At 48 actual ordinary/boss generation boundaries, a separate replay
changes only Looter to zero: **11 generated outcomes differ, all boss rewards;
37 remain unchanged**. Unchanged ordinary rewards do not prove every case hit
the 500-budget minimum: fixed drops and the same accepted random item also leave
outcomes unchanged. Targeted original cases establish the minimum separately.
No gold, items, HP or RNG are granted, and this evidence does not imply every individual
drop is more valuable. The test policy targets level four by town four when
affordable; that is not a game cap. The runner uses production ordinary contours
and the documented boss rectangle fallback. Reports:
`.build/looter-party-soak/report.json`, `.build/looter-tests-output.txt` and
`.build/oracle/castle-looter-comparison-report.json`. The accepted fixture is
`web/tests/fixtures/original-castle-looter-trace.json`. The independent audit in
`.build/browser-qa/looter-scenario-audit.json` confirms all 168 saved fixtures,
16 purchases and 48 paired generation boundaries.

Seven full-envelope UI checks pass: Looter levels 1/2, unaffordable rejection,
Continue, actual boss reward generation, Rest and earned result/town entry.
All 308 candidate/live/ZIP files match, and all 305 public assets are unchanged.
Production New Game starts at tick 0, HP 40, gold 200, ammo 5, six inventory slots
and Looter 0. The actual v20 backup migrates and restores with complete-envelope
equality at tick 674, HP 40, gold 209 and unchanged RNG; paused and with no console
errors. Evidence: `.build/browser-qa/looter-ui-verification.json`,
`.build/browser-qa/looter-production-verification.json` and
`.build/looter-publication.json`; screenshot `looter-production-restored.jpg`.

The historical v20 loot MOD release passes **341 tests**, TypeScript checking and its
build (`assets/index-BJh2mRko.js`). **All 53 original observations across 18 cases
match**, covering ordinary/boss rewards, all offer/owned directions, Yes,
No/outside swaps, rejection, consumed metadata, new Living Weapon and cached
Engineer. Four focused reference tests include three negative controls for No
as a no-op, erased inactive MOD metadata and omitted Engineer. The final rifle
case distinguishes 72 attack with cached Engineer from 70 without it; the earlier
Shotgun probe rounded both results equally and was replaced with this stronger
probe. This is method-boundary evidence, not complete native scheduling or
browser-input parity. See [loot MOD source notes](web/docs/loot-mod-source.md)
and [UI notes](web/docs/loot-mod-ui-source.md).

The natural integration run passes **4,487 aggregate frames, 53 save/replay
checkpoints and 27 saved fixtures**. One fresh seed earns the MOD, rewards,
towns and paid Storage normally; four confirm/cancel branches start from those
earned checkpoints. An independent replay audit verifies every fixture and real
automatic reloads in both mounted branches. No items, gold, HP or RNG are granted.
These are aggregate branches, not one continuous campaign; the runner uses original
ordinary contours and the documented boss rectangle fallback. Reports are
`.build/loot-mod-scenarios/report.json` and
`.build/browser-qa/loot-mod-scenario-audit.json`. These headless checks remain
separate from the original-method and actual browser evidence.

Eleven full-envelope UI checks pass on the final candidate: all four offer/owned
endpoint directions, pending Continue, Yes/No, a click over the covered Proceed
button that declines without advancing rewards, the shared town confirmation,
Rest and full-mod-capacity rejection. The rejection fixture explicitly grants
one Damage enchantment to an earned gun; its separate provenance is recorded in
`.build/browser-qa/loot-mod-controlled-full-provenance.json`. It is failure-path
evidence, not natural acquisition. The natural integration branches above have
no grants. All 305 public asset files are unchanged, and all 308 candidate/live/ZIP
files match. Production New Game starts at tick 0 with HP 40, gold 200, ammo 5,
six inventory slots and no pending loot action. The actual v19 backup migrates
and restores with complete-envelope equality at tick 674, HP 40, gold 209 and
unchanged RNG; paused, with no console errors. Evidence:
`.build/browser-qa/loot-mod-ui-verification.json`,
`.build/browser-qa/loot-mod-production-verification.json` and
`.build/loot-mod-publication.json`; screenshot `loot-mod-production-restored.jpg`.

The historical v19 Storage release passes **331 tests**, TypeScript checking and its build
(`assets/index-Cb35fe28.js`). **All 37 original observations match**. The initial
36/37 comparison exposed consumable reload metadata being cleared too early at
battle completion; correcting that boundary preserves it until the source's
later reset. Four focused reference tests include three negative controls that
detect discarded inactive metadata, the premature timer reset and refilling only
the original six slots. Controlled method comparisons remain separate from
native scheduling, full rewards and browser rendering.

Fourteen UI checks match complete expected save envelopes: purchases to 7/9/16
slots, insufficient-gold/cap guards, buys into slots 9/16, owned transfer, Continue,
loot into slot 9, Upgrade preview/confirmation in the expanded inventory, Rest
preserving a backpack Hammer's two charges, and earned result/town entry with 80
upkeep. The first five checks ran before the consumable metadata correction and
were re-compared against the final runtime; the other nine ran on the final
candidate. All 305 public asset files are unchanged, and all 308 candidate/live/ZIP
files match. Production New Game reached tick 0, HP 40, gold 200, ammo 5 and six
inventory slots. The actual v18 backup migrated and restored with exact
full-envelope equality at tick 674, HP 40, gold 209 and unchanged RNG; paused and
no console errors. Evidence: `.build/browser-qa/storage-ui-verification.json`,
`.build/browser-qa/storage-production-verification.json` and
`.build/storage-publication.json`; screenshot `storage-production-restored.jpg`.

The corrected Storage soak passes **nine scenarios, 135,074 frames and 1,491
checkpoints**, including 54 Rest transitions, 253 reward actions, 34 Storage
purchases, 34 expanded-slot loot transfers and 45 Rest transitions with occupied
extra slots. Seven natural campaigns finish Day7; one loses there. The separate
capital-start adds **20,000 gold only** at an earned first town, buys sixteen
slots through normal purchases and finishes Day7. It grants no items and does
not establish natural maximum-capacity affordability. Exact state/event replay
uses original ordinary contours and the documented boss rectangle fallback;
this is integration evidence, not original balance or browser scheduling parity.
Report: `.build/storage-party-soak/report.json`.

The historical v18 Sandbag release passed **319 tests**, TypeScript checking and its build
(`assets/index-2cijlKJd.js`, 308 files). Two identical original runs match **25
observations**: 12 damage cases, six controlled starting states and seven purchase
outcomes. A strengthened 100-damage case produces 48 damage and distinguishes the
source's additive mission absorption from the 49 produced by multiplying the two
reductions; no tolerance was widened. See [Sandbag source notes](web/docs/castle-sandbag-source.md).

Six browser checks match complete expected save envelopes: level 1/2 purchases,
insufficient-gold rejection, Continue, seven actual combat updates from
3552→3559 with HP 45→42 and unchanged expected RNG, and earned Day3 settlement
with 80 upkeep/58 wages followed by town entry. The paired replay without Sandbags
takes 4 damage instead of 3. No console errors were observed. All 305 public assets
remain byte-identical, and all 308 candidate/live/archive files match. Production New Game exported v18 at tick 0 with 40 HP, 200 gold, five shells
and Sandbag/repair fields at zero. The actual live v17 backup migrated and
restored with complete-envelope equality at tick 674, 40 HP and 209 gold,
preserving RNG; paused with no console errors. Evidence:
`.build/browser-qa/sandbag-production-verification.json` and
`.build/sandbag-publication.json`; screenshot `sandbag-production-restored.jpg`.

Its separate soak passes **nine scenarios, 132,552 frames and 1,470 checkpoints**,
with 53 Rest transitions, 219 reward actions, 19 Sandbag purchases, 17 Repairman
purchases, 11 Fix Wall purchases and 41 positive wave heals. All eight natural
campaigns finish Day7. A separate earned-first-town run adds 12,000 gold only,
buys Sandbag 4 through ordinary purchases, sets companions to Armor-only through
the normal town order action and temporarily avoids aiming at Crows to expose larger
hits. That exposure policy ends in Day6 defeat; it is not another natural win.

Among 186 accepted single-hit frame comparisons, one shows a positive integer
reduction: at Day 3 tick 3553 the capital-start takes 3 damage with Sandbag 4 versus 4
when the same production frame is replayed with only the Sandbag level set to 0.
Accepted pairs preserve final RNG and a surviving wall; one ambiguous lethal
frame is excluded. The first low-damage attempt produced no positive reduction
and remains recorded in `.build/sandbag-party-soak-low-damage/`. The adjusted
run is `.build/sandbag-party-soak/report.json`. This is limited port integration
evidence, not original balance parity; ordinary source contours and the documented
boss rectangle remain the collision boundary. Run `npm.cmd run test:sandbag-party-soak`
from `web` to reproduce that policy.

The historical v17 repair release passed **309 tests**, TypeScript checking and its build
(`assets/index-XNVk3crn.js`). Two identical original runs match **37 observations**:
17 controlled starting states, eleven tile transactions and nine timer outcomes.
These include repair eligibility/payment, wave heal/clamp order, perfect-state
history and the terminal no-heal boundary. Actor activity and decorative
fireworks are excluded from that source timer diagnostic; connected play is
checked separately.

Eight browser checks match complete expected save envelopes: Repairman purchases
for 700/950 gold, an unaffordable upgrade, paid Fix Wall, repeated full-HP rejection,
Continue, six actual combat updates from tick 10795→10801 with HP 43→45, and earned
Day5 results/town entry with 170 upkeep and 74 wages. No console errors were observed.
All 305 public asset files are unchanged, and all 308 candidate/live/archive
files match. Production New Game exported v17 at tick 0 with 40 HP, 200 gold,
five shells and both new repair fields at zero. The actual live v16 backup
migrated and restored with complete-envelope equality at tick 674, 40 HP and
209 gold, preserving RNG; paused with no console errors. See
[port verification](docs/port-verification.json).

The historical v16 Castle release passed **298 tests**, TypeScript checking and its build.
Two identical original runs provide **23 Castle observations**: ten controlled
starting states and thirteen House/Wall transactions, including caps, denied
purchases, damaged walls and nonstandard maxHP. The source methods match without
changing AP or RNG. See [Castle source notes](web/docs/castle-upgrades-source.md)
and [original UI extraction](web/docs/castle-upgrades-ui-source.md). Eleven
complete-save browser checks pass: denied House purchase, Wall HP/upkeep and
historical result preservation, Continue, House2/3 and cap, second/third hiring,
Rest with three companions, ten actual combat updates, and result/town entry
with 150 upkeep and 188 wages. All 308 candidate, published and archive files match.
Production New Game exported v16 at tick 0 with 40 HP, 200 gold, five shells and
Wall 1/House 1. The actual v15 backup migrated and restored with full-envelope
equality at tick 674, 40 HP, 209 gold and unchanged RNG, paused with no console
errors. Evidence is in [port verification](docs/port-verification.json).

The historical **v15 release passed 288 tests**, TypeScript checking and the release
build. Original party comparisons cover 61 transactions from 79 captured states,
45 progression states, 75 AI states and 37 combat states. Browser checks verified
actual hiring for 400 gold with unchanged AP/RNG, pending-confirmation Continue,
orders, equipment round trips, Rest, exact combat/reload checkpoints, wages and
cancelled/confirmed dismissal. All 300 tested files match publication and the ZIP.
Production New Game reached tick 0 with 40 HP, 200 gold and five shells; the prior
v14 save migrated exactly to v15 at tick 674 with 40 HP, 209 gold and unchanged RNG.
No console errors were observed. These checks do not claim a complete manually
played browser campaign; see the [party evidence](web/docs/party-integration-status.md).

The final v15 build corrects a port-only targeting error: Crow and Fly belong to
Air type 1, not Armor type 2. Actual-spawn/order regressions cover the distinction.
Only unambiguous early-v15 saves are repaired, preserving targets, cache history
and RNG; mixed states are rejected. An earned Day 5 save repaired its Crow through
browser import with exact expected state. Import Save remains disabled until the
scene is ready. The full party soak was rerun on this corrected runtime.

The historical **v14 release passed 252 tests** and the release build. Nine focused
browser checks verified Rest into Day7, Continue, result-to-town progression and
a controlled boss's windup, grenade flight and cosmetic landing against full
expected saves. All 267 tested files matched that published build and archive.
Production New Game reached tick 0 with 40 HP, 200 gold and five shells; the prior
v13 save was restored through the UI at tick 674 with exact full-envelope migration
equality, including appearance. No console errors were observed. These checkpoint
checks do not claim a complete manually played browser campaign.

The previous v13 release passed browser checks for Rest into
Day 6, settlement, Claim title and a controlled Barbarian's rage/hit effects
against complete expected saves, with unchanged Continue exports. All 267 tested
release files matched that published build and archive. Production New Game reached
tick 0 with 40 HP, 200 gold and five shells; the previous live v12 save restored as
v13 with exact full-save migration equality and no observed console errors.
The previous v12 release's Rest/Fly checks remain historical evidence. Details
and limits are recorded in
[port verification](docs/port-verification.json).

`npm.cmd run test:soak` automatically exercises 32 seeds with idle, aimed and
interrupted-input policies. It checks finite state, battle completion and exact
JSON save/replay state and event equality across the supported campaign, earned rewards,
town preparation, repair, shop transactions, weapon modifications and Rest.
The recorded v14 solo run passed **96 scenarios, 412,874 frames and 4,501 checkpoints**,
including **699 reward transitions, 760 town actions and 162 Rest transitions**.
It reached **32 Day2 wins, 32 Day3 wins, 25 Day4 wins and 13 Day5 wins**. Thirteen
scenarios entered Day6; one won, claimed the title and entered Day7. **None won
Day7 under these policies.** It also exercised
**124 upgrade previews, 27 upgrades, 97 cancellations and 29 mounted MODs**.
Defeats under the bounded test policies remain valid outcomes.
Reports and reproducible failure checkpoints are written beneath `.build/soak/`.
This is a stability check, not
evidence that every original feature has been ported.

A separate connected test wins Day7 with 10 HP using ordinary repair, targeting
priority and an owned grenade, then checks rewards, salary and town save/restore.
It uses rectangular hit geometry and retains its existing Day1 setup of 39 HP;
it does not establish production collision or original balance parity. All
recorded attempts from the earned 11-HP Day7 checkpoint using production ordinary
contours failed and are preserved as historical solo evidence.

The v15 party soak separately passed **32 natural campaigns, 482,844 frames and
5,024 checkpoints**. All nine classes were naturally hired; all runs reached
Day 7, with **30 victories and two castle defeats**. Companions produced 6,559
shots, 5,658 hits, 3,174 kills and 1,386 projectiles, with exact state/event replay.
It uses original ordinary-enemy contours and a documented boss rectangle fallback;
these are port consistency results, not original balance or browser performance
proof. Run `node --experimental-strip-types scripts/party-soak.ts 32` from `web`.
The v16 expanded-party check passes **nine campaigns, 135,297 frames and 1,450
save/replay checkpoints**, including 54 Rest transitions, 223 reward actions,
10 House purchases and nine Wall purchases. All eight natural campaigns earn a
second companion. A separate run adds **12,000 gold only** at an earned first
town, then purchases House3 and hires three naturally generated candidates.
Across the runs, parties enter battle 23 times with two companions and four times
with three; all nine finish Day7. This does not establish natural affordability
of three companions within seven days. The same ordinary-contour/boss-rectangle
boundary applies. Run `node --experimental-strip-types scripts/party-soak.ts 8 castle`
from `web`; reports are in `.build/castle-party-soak/`.

The separate repair soak passes **nine campaigns, 135,549 frames and 1,487
checkpoints**, with 54 Rest transitions, 223 reward actions, 18 Repairman purchases
and 10 paid Fix Wall purchases. Of 205 observed wave boundaries, 29 restore positive
HP—64 HP total across five natural campaigns. All eight natural campaigns and the
separate 12,000-gold capital-start finish Day7. Prioritizing repairs delays six
natural second hires until Day7 town; expanded-party battles in this run occur
only in the capital-start. The earlier Castle soak remains the natural
multiple-companion battle evidence. This is state/event replay under production
ordinary contours with the documented boss rectangle, not full original balance
or native browser scheduling parity. Run
`node --experimental-strip-types scripts/party-soak.ts 8 repair` from `web`;
reports are in `.build/repair-party-soak/`.

Work is paused at the user's v24 checkpoint; automatic continuation is stopped.
For a later resume, the next useful progression slice is a
source audit of **Day10's first boss-day battle and its enemy, reward, medal and town dependencies** before
enabling that battle. Optional Castle page2 remains deferred. The veteran
late-game hitbox complaint still needs its own failing original encounter.

`npm.cmd run test:projectile-soak` separately exercises eight projectile guns
and hand grenades under three seeds: **27 scenarios, 9,720 frames and 1,080
save/replay checkpoints**. These configured scenarios grant the required weapon
skills and exercise switches, bow charge/release, pulses and vertical aiming;
they do not claim ordinary campaign acquisition of every weapon.

To refresh independent original traces, build the diagnostic SWFs and start the
local development-only runner from the repository root:

```powershell
python tools/build_oracle.py
python tools/build_wave_oracle.py
python tools/build_combat_oracle.py
python tools/build_geometry_oracle.py
python tools/build_loot_oracle.py
python tools/build_progression_oracle.py
python tools/build_town_oracle.py
python tools/build_hero_oracle.py
python tools/build_prepared_wave_oracle.py
python tools/build_shoot_oracle.py
python tools/build_equipment_oracle.py
python tools/build_castle_oracle.py
python tools/build_rest_oracle.py
python tools/build_second_town_oracle.py
python tools/build_projectile_oracle.py
python tools/build_modification_oracle.py
python tools/build_third_day_wave_oracle.py
python tools/build_archer_oracle.py
python tools/build_third_town_oracle.py
python tools/build_fourth_day_wave_oracle.py
python tools/build_boss_ai_oracle.py
python tools/build_fourth_town_oracle.py
python tools/build_fifth_day_wave_oracle.py
python tools/build_fly_oracle.py
python tools/build_fifth_town_oracle.py
python tools/build_sixth_day_wave_oracle.py
python tools/build_barbarian_oracle.py
python tools/build_sixth_town_oracle.py
python tools/build_seventh_day_wave_oracle.py
python tools/build_boss_special_oracle.py
python tools/build_seventh_town_oracle.py
python tools/build_eighth_day_wave_oracle.py
python tools/build_eighth_day_spawn_oracle.py
python tools/build_eighth_town_oracle.py
python tools/build_ninth_day_wave_oracle.py
python tools/build_ninth_day_spawn_oracle.py
python tools/build_ninth_town_oracle.py
python tools/build_lava_oracle.py
python tools/build_castle_upgrades_oracle.py
python tools/build_castle_repair_oracle.py
python tools/build_castle_sandbag_oracle.py
python tools/build_castle_storage_oracle.py
python tools/build_loot_mod_oracle.py
python tools/build_castle_looter_oracle.py
python tools/build_castle_trainer_oracle.py
python tools/serve_oracle.py
```

Open `http://127.0.0.1:5176/` for reload or
`http://127.0.0.1:5176/?suite=waves` for generation, or
`http://127.0.0.1:5176/?suite=combat` for spawn/hit scenarios, `?suite=geometry`
for shape-hit grids, `?suite=loot` for item generation, or `?suite=progression`
for Sheriff skill choices and previews, or `?suite=town` for result settlement
and Free Repair. Use `?suite=hero` for character creation/growth,
`?suite=prepared-waves` for the prepared next-mission waves, and `?suite=shoot`
for actual firing. Use `?suite=equipment` for selection/fire/reload input,
`?suite=castle` for castle damage/protection, `?suite=rest` for Rest, and
`?suite=second-town` for the second preparation, and `?suite=projectiles` for
projectile launches and lifecycles (`npm.cmd run test:projectile-reference`).
Use `?suite=modifications` for weapon Upgrade and MOD mounting, then run
`npm.cmd run test:modification-reference` from `web/`. The town fixture excludes full
town preparation. Day 3 uses `?suite=third-day-waves`, `?suite=archer` and
`?suite=third-town`, compared from `web/` with
`npm.cmd run test:third-day-wave-reference`, `npm.cmd run test:archer-reference`
and `npm.cmd run test:third-town-reference`. Day 4 uses `?suite=fourth-day-waves`,
`?suite=boss-ai` and `?suite=fourth-town`, with `test:fourth-day-wave-reference`,
`test:boss-ai-reference` and `test:fourth-town-reference`. Day 5 uses
`?suite=fifth-day-waves`, `?suite=fly` and `?suite=fifth-town`, with
`test:fifth-day-wave-reference`, `test:fly-reference` and `test:fifth-town-reference`.
Day 6 uses `?suite=sixth-day-waves`, `?suite=barbarian` and `?suite=sixth-town`,
with `test:sixth-day-wave-reference`, `test:barbarian-reference` and
`test:sixth-town-reference`. Day 7 uses `?suite=seventh-day-waves`,
`?suite=boss-special` and `?suite=seventh-town`, with
`test:seventh-day-wave-reference`, `test:boss-special-reference` and
`test:seventh-town-reference`. Day8 uses `?suite=eighth-day-waves`,
`?suite=eighth-day-spawn`, `?suite=eighth-town` and `?suite=lava`, with
`test:eighth-day-wave-reference`, `test:eighth-day-spawn-reference`,
`test:eighth-town-reference` and `test:lava-reference`. Day9 uses
`?suite=ninth-day-waves`, `?suite=ninth-day-spawn` and `?suite=ninth-town`, with
`test:ninth-day-wave-reference`, `test:ninth-day-spawn-reference` and
`test:ninth-town-reference`. Castle House/Wall transactions use
`?suite=castle-upgrades` and `npm.cmd run test:castle-upgrades-reference`. Paid
repair and Repairman use `?suite=castle-repair` and
`npm.cmd run test:castle-repair-reference`. Sandbags use `?suite=castle-sandbag`
and `npm.cmd run test:castle-sandbag-reference`. Storage uses `?suite=castle-storage`
and `npm.cmd run test:castle-storage-reference`. Reward MOD mounting uses
`?suite=loot-mod` and `npm.cmd run test:loot-mod-reference`; run
`npm.cmd run test:loot-mod-scenarios` for the earned-checkpoint integration branches.
Looter uses `?suite=castle-looter` and `npm.cmd run test:castle-looter-reference`;
`npm.cmd run test:looter-party-soak` runs the four natural purchase/reward campaigns.
Trainer uses `?suite=castle-trainer` and `npm.cmd run test:castle-trainer-reference`;
`npm.cmd run test:trainer-party-soak` runs the four natural purchase/XP campaigns.
Run these scripts with `npm.cmd run` from `web/`. Each page runs the original
twice automatically, requires identical observations and saves its report. From
`web/`, use the matching comparison command: `npm.cmd run test:reference`,
`npm.cmd run test:wave-reference`, `npm.cmd run test:combat-reference`,
`npm.cmd run test:item-reference`, `npm.cmd run test:progression-reference`, or
`npm.cmd run test:town-reference`.
For geometry, run
`node --experimental-strip-types scripts/compare-geometry-reference.ts`.
These development tools require the local FFDec/Java and Ruffle
packages; the distributed game does not. Diagnostic builds skip the retired ad
and intro while retaining original game initialization and compared methods.
See [oracle notes](docs/oracle-notes.md)
for controlled state, source preservation and limitations, and the
[feature ledger](docs/feature-ledger.json) for missing and unverified systems.

## Original assets and extraction

The runtime assets are included under `web/public/assets/`, so ordinary browser
development does not require Java or Flash tooling. Their manifest records
original symbol IDs, frame numbers and registration offsets.
The selected package contains **108 images, 49 clips, 89 sounds and six fonts**,
including Archer, Fly and Barbarian timelines, the separate Archer arrow,
boss guard and Barbarian hit/rage effects, title-action artwork and original
collision contours, plus Characters/Equipment panels, portraits and controls.
Generated display-width data keeps the covered knockback
clamps independent of raster transparency or Phaser.

To regenerate assets from the preserved SWF, use Python 3 with Pillow, Java 21
and **JPEXS FFDec 26.4.0**. Run from the repository root:

```powershell
python tools/extract_web_assets.py
```

Add `--refresh` to regenerate the intermediate FFDec exports as well. Intermediate
files stay in ignored `.build/`; the extractor verifies the original SWF hash.
[Asset provenance](docs/asset-manifest.json) and
[UI reference](docs/ui-reference.md) describe the rendering adjustments.

Original game and artwork credits belong to **Noa** and the contributors credited
in the supplied Elona Shooter Plus release. This port retains those credits and
does not claim authorship of the original game assets.

## Preserved Flash version and startup fix

Load **`elonashooter1.3-fixed.swf`** with Ruffle's **Select File** control. Choose
**New Game**, select your character and press **Proceed**. This version retains
the original English interface, gameplay and balance, without a language selector.

The original SWF9 file stalled during New Game in Ruffle because the character
selection window accessed children before their construction completed. The fix
uses SWF10 construction behavior. Title initialization also waits one frame when
required children are unavailable and guards against reentrant setup.

The original loader and advertising flags remain unchanged in this SWF. Ruffle
may log a nonfatal warning about the retired MochiAds endpoint.

- `original/elonashooter1.3.swf` is the unchanged supplied game.
- `src/original/MainTimeline.as` is the unchanged decompiled comparison baseline.
- `src/shootem_fla/MainTimeline.as` contains the startup compatibility fix.
- `tools/build.py` rebuilds a separate fixed SWF and checks non-code preservation.

From the repository root:

```powershell
python tools/build.py
```

This requires Python 3, Java 21 and FFDec 26.4.0. Portable Java and FFDec are
installed locally in ignored `.tools/`; those binaries are not committed. On
another machine, place FFDec at `.tools/ffdec/ffdec.jar` and Java under
`.tools/jre/`, or pass their paths:

```powershell
python tools/build.py --java C:/path/to/java.exe --ffdec C:/path/to/ffdec.jar
```

Official tools: [JPEXS FFDec](https://github.com/jindrapetrik/jpexs-decompiler/releases/tag/version26.4.0),
[Eclipse Temurin Java](https://adoptium.net/temurin/releases/), and
[Ruffle](https://ruffle.rs/).

The fixed SWF was tested in Ruffle 0.7.1 web through New Game, character creation,
combat, enemy damage and the normal game-over screen, without observed
ActionScript exceptions. Its 3,491 root tags retain their order and types;
original non-code resource payloads remain byte-identical. Only the ActionScript
payload and SWF version change. These preservation claims apply to the fixed
SWF, not to the new browser renderer. See
[SWF verification](docs/verification.json) and
[latest SWF build verification](docs/build-verification.json).

Original SWF SHA256:
`4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
