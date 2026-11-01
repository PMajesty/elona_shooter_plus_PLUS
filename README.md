# Elona Shooter Plus PLUS

A browser remake of **Elona Shooter Plus 1.3.0.4**, written in TypeScript with
Phaser 4. The current build is a **first playable slice**: choose one of 22
appearances, play the Sheriff's original opening battle, collect ordinary loot
and earned boss prizes, choose earned Sheriff skills, reach results, enter the
first town, use Free Repair and buy or sell at the shop, or reach defeat. Save and
restore your progress through these stages. Original English artwork, fonts,
audio and credits are retained.

This is not yet the complete game. Other classes, full town management, recruiting
and card actions, Day 2 and later days, equipment selection and remaining combat effects, and original Flash save
conversion remain to be ported. Earned skills are selected
and saved; their effects must be connected to future combat before later days
are enabled. See [port status](docs/port-status.md) for coverage and differences.
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
| Left click | Fire; interrupt a reload |
| Space | Reload; resume while paused |
| 2 | Throw a grenade at the cursor |
| Esc | Pause / resume |

Losing browser focus pauses combat. The game saves locally in this browser;
**Continue** restores that save. **Export Save** and **Import Save** transfer a
browser-port save as a JSON file. These saves use a separate format from Flash
and do not automatically follow you to another browser or website.

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
survive save/restore. Recruiting, card actions, Refresh Stock, Upgrade Weapon,
MOD mounting and Day 2 remain unavailable.

Saves now use version 6; versions 1–5 are accepted. New characters retain the
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
snapshots, and 19 ordinary-enemy
collision grids containing 77,824 sampled points from the original display shapes. The pellet
tests supply original geometry as input; separate contour tests exercise the
same collision implementation used in the browser. Coverage is documented in
the feature ledger rather than inferred from the number of passing tests.
Negative controls verify that missing shell feedback and altered RNG consumption
are detected. Expected original results are never regenerated from the port.

`npm.cmd run test:soak` automatically exercises 32 seeds with idle, aimed and
interrupted-input policies. It checks finite state, battle completion and exact
JSON save/replay state and event equality, including every earned reward stage,
first-town preparation, repair and shop transactions.
Reports and reproducible failure
checkpoints are written beneath `.build/soak/`. This is a stability check, not
evidence that every original feature has been ported.

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
python tools/serve_oracle.py
```

Open `http://127.0.0.1:5176/` for reload or
`http://127.0.0.1:5176/?suite=waves` for generation, or
`http://127.0.0.1:5176/?suite=combat` for spawn/hit scenarios, `?suite=geometry`
for shape-hit grids, `?suite=loot` for item generation, or `?suite=progression`
for Sheriff skill choices and previews, or `?suite=town` for result settlement
and Free Repair. Use `?suite=hero` for character creation/growth,
`?suite=prepared-waves` for the prepared next-mission waves, and `?suite=shoot`
for actual firing. The town fixture excludes full town preparation. Each page runs the original
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
