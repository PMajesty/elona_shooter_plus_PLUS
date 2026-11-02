# Elona Shooter Plus PLUS

A browser remake of **Elona Shooter Plus 1.3.0.4**, written in TypeScript with
Phaser 4. The current implementation covers **seven connected Sheriff days**:
choose one of 22 appearances, fight, collect ordinary and boss loot, choose earned
skills, enter town, buy/sell and upgrade weapons, mount MODs, use Free Repair,
then Rest into Days 2–7 with your retained equipment. Victory, defeat,
rewards, town entry and save/restore work across these stages. Original English
artwork, fonts, audio and credits are retained.

The seven-day **v14 release** has passed the automated checks below, focused
browser acceptance and production New Game smoke testing. Its deployable archive
is `.build/elona-shooter-browser-day7-slice.zip`; the previous six-day v13 release
is retained for rollback.

This is not yet the complete game. Day 8 onward, other classes, full town
management, recruiting and other card actions, Ragnarok and
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
items behind. Skill choices show original descriptions and previews. The six
inventory slots, offers, pending choices and chosen traits persist without
rerolling when you reload a current save. Gold is settled once after the reward
choices finish, when results appear.

Proceed from results to the first town, still on **Day 1**, with **4 AP**. Open
the Castle tab to use **Free Repair**: it costs **2 AP**, restores all wall HP
and costs no gold. Click to acknowledge its message. A full wall costs no AP to
repair again. Town preparation generates stock, cards, next-mission data and a
recruit once. Open the Shop tab, click stock to pick it up, then click an empty
owned slot to buy it. Owned items can be moved or swapped; dropping one outside
the slots asks to sell it. Only Yes confirms, and any other dialog click cancels.
Shop Tokens discount stock. Town HP, AP, prepared data and full inventory records
survive save/restore. **Mission → Rest** opens the original Resting dialog;
acknowledging it begins the prepared next battle, up to Day 7. Rest does not heal
the castle, spend AP or cost gold. Guns refill; consumable charges stay spent.
Days 2–7 each end in their own rewards and prepared town. Day 4 adds the source's
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
absorption medal for future mission preparation. Rest beyond Day 7 remains unavailable.
Recruiting, other card actions and Refresh Stock remain unavailable.

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

To mount a MOD, pick it up from owned inventory and click an owned gun. Yes
mounts a compatible MOD without spending AP or gold, and consumes the MOD.
Rejected mounting keeps both items. **No or clicking outside this confirmation
swaps the MOD and gun**, matching the original owned-inventory behavior; it does
not cancel like a sale. Stock MODs must first be bought into an empty owned slot.

Saves now use **version 14**; versions **1–13** are accepted. Day 7 boss windup,
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
the old ammo/cooldown fields migrate without rerolling inventory. Days 2–7 saves
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

The current **v14 release passes 252 tests** and the release build. Nine focused
browser checks verified Rest into Day7, Continue, result-to-town progression and
a controlled boss's windup, grenade flight and cosmetic landing against full
expected saves. All 267 tested files match the published build and archive.
Production New Game reached tick 0 with 40 HP, 200 gold and five shells; the prior
v13 save was restored through the UI at tick 674 with exact full-envelope migration
equality, including appearance. No console errors were observed. These checkpoint
checks do not claim a complete manually played browser campaign.

The previous v13 release passed browser checks for Rest into
Day 6, settlement, Claim title and a controlled Barbarian's rage/hit effects
against complete expected saves, with unchanged Continue exports. All 267 tested
release files match the published build and archive. Production New Game reached
tick 0 with 40 HP, 200 gold and five shells; the previous live v12 save restored as
v13 with exact full-save migration equality and no observed console errors.
The previous v12 release's Rest/Fly checks remain historical evidence. Details
and limits are recorded in
[port verification](docs/port-verification.json).

`npm.cmd run test:soak` automatically exercises 32 seeds with idle, aimed and
interrupted-input policies. It checks finite state, battle completion and exact
JSON save/replay state and event equality across the supported campaign, earned rewards,
town preparation, repair, shop transactions, weapon modifications and Rest.
The latest run passed **96 scenarios, 412,874 frames and 4,501 checkpoints**,
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
contours failed and are preserved. Hiring and party AI are the next integration
priority before further campaign expansion; they are original early-game systems
that remain absent here.

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
`test:seventh-town-reference`.
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
The selected package contains **86 images, 40 clips, 89 sounds and five fonts**,
including Archer, Fly and Barbarian timelines, the separate Archer arrow,
boss guard and Barbarian hit/rage effects, title-action artwork and original
collision contours. Generated display-width data keeps the covered knockback
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
