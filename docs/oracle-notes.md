# Original ActionScript behavioral oracle

`python tools/build_oracle.py` generates `.build/oracle/reference.swf` from the
preserved original SWF and the existing startup-compatible MainTimeline source.
It writes the injected source, compiler log and `build-report.json` beside it.
The original SWFs and both checked-in ActionScript sources remain untouched.
The existing SWF verifier checks all 3,491 root tags: only one DoABC payload may
change; non-code payloads, tag order, stage dimensions and frame rate must match.
The diagnostic copy uses the already verified SWF10 startup compatibility change.

This is a test executable, not a replacement game or website dependency. The
injection does not import TypeScript mechanics or expected simulation values.
Its observations come from executing the original `reload`, `reloading`,
`cancelReload`, and `onTick` methods in Ruffle.

## Initialization and clock boundary

The shared test bootstrap sets only `frame1`'s `skipLoader` and `skipAd` flags
to 1. Original `frame3` still enters the original initialization branch. This
removes the retired ad and animated intro from method fixtures; it does not
change game clocks, gameplay initialization, comparison methods or assets.

After the original title initializer completes, the injected driver follows the
same New Game branch as the mouse handler, selects Sheriff through `updateGene`,
and sets the original Proceed fade. Original event transitions call
`exitMenuResult`, `gameStart`, and the battle initializer. The driver requires
Sheriff's class ID and shotgun item ID 3 before it reports ready.

At the end of battle initialization the driver stops the real `Timer(50)` and
removes the game's root `ENTER_FRAME` handler. It runs its short scenarios
synchronously, before another display frame can interleave. Each ordinary
`timer` sample is one direct call to the original `reloading`; `pause_gate`
instead calls the original `onTick`, which contains the pause guard. Spawning
is suppressed by assigning a distant mission timer, and fixtures reset ammo,
reload counter, shooting flags and rampage. Reload modifiers and weapon
definitions come from the initialized original game.

Consequently these checks prove reload transitions, the calls made for per-shell
sound/animation changes, cancellation, rampage reload reduction, and the original
timer handler's pause guard. They do **not** prove actual wall-clock intervals,
30 Hz / 20 Hz event ordering, mouse targeting/click routing, audible playback,
rendered animation duration, combat randomness, or complete-game fidelity.
The root frame loop does not run, so rampage does not count down in these fixtures.

Use a fresh Ruffle storage origin: the original title initializer reads its
SharedObject index, and existing medal bonuses can alter initial class state.
The `ready` record exposes relevant original values so such contamination is
visible. Repeating `oracleRun` in the same initialized fixture resets all state
that these scenarios consume.

## Trace protocol

With the tested Ruffle 0.7.1 build, attach the public
`player.ruffle().traceObserver` immediately after awaiting `load()`: setting it
before the internal player exists loses the observer. The fixture's normal
startup frames leave time to attach before the scenarios run.
Separate `ELONA_STARTUP:` records report frame/phase progress and elapsed time
until battle initialization. They are saved under `report.startup` and excluded
from canonical method-record equality, because startup timing is not an expected
gameplay result.
Each structured record is one trace line prefixed `ELONA_ORACLE:` followed by
JSON. Other original traces are not oracle records. Automatic execution needs
no mouse or keyboard input. With script access enabled, an optional callback
`player.ruffle().callExternalInterface('oracleRun')` reruns the suite after ready.

All records include `version: 1` and a `type`:

- `ready`: `weaponId`, `ammoMax`, `reloadTimeMax`, `manualReload`, `autoReload`,
  `reloadSkill`, and `clock: 'manual-original-methods'`.
- `snapshot`: `scenario`, `op`, `step`, `ammo`, `reloadTicks`, `rampage`, `paused`,
  `frame`, `sounds`, and `animations`.
- `complete`: `ok: true`, total `snapshots`, and a `scenarios` array of
  `{ name, snapshots }` counts.
- `error`: `message`, with `phase` or `scenario` when available.

`sounds` contains original source sound-variable names whose `play` calls
occurred since the preceding snapshot. `animations` contains
`{ method: 'gotoAndPlay' | 'gotoAndStop', target: string | number }` for original
player animation calls within the three reload methods. These observers run
immediately before the original calls; none replace them. `frame` is the
MovieClip's sampled current frame, without advancing the display timeline.

The fixed scenarios are:

| Scenario | Controlled setup | Original calls |
| --- | --- | --- |
| `empty_reload` | Ammo 0, rampage 0 | `reload`, then `reloading` until finished |
| `cancel_before_shell` | Ammo 0, rampage 0 | `reload`, two `reloading`, `cancelReload` |
| `cancel_after_shell` | Ammo 0, rampage 0 | `reload`, seven `reloading`, `cancelReload` |
| `pause_gate` | Ammo 0, rampage 0 | `reload`, three paused `onTick`, one resumed `onTick` |
| `rampage_reload` | Ammo 3, rampage 300 | `reload`, then `reloading` until finished |

Each begins with `op: 'initial', step: 0`, followed by `op: 'reload', step: 0`.
Direct reload ticks use `op: 'timer'`; cancellation uses `op: 'cancel'` at the
current step. Pause emits `pause`, three `paused_timer` records, `resume`, then
`resumed_timer`. Sound/animation arrays are reset after every snapshot.

## Evidence status

The first build completed successfully with FFDec 26.4.0 / Java 21 and passed
resource-preservation checks. Two subsequent Ruffle 0.7.1 browser runs both
completed automatically and produced identical traces: 74 records per run,
consisting of `ready`, 72 snapshots across the five scenarios, and `complete`.
The observed original reload/idle frames were 30 and 109; the trace includes
the original sound and animation calls. No oracle error record was emitted.

The durable `.build/oracle/browser-report.json` reports `passed`, two runs and
`repeatable: true`. `.build/oracle/comparison-report.json` reports 72 matching
snapshots across all five scenarios, comparing ammo, reload timer, rampage,
pause gating, sound intents and animation intents. Its trace SHA-256 is
`6839b558ccb0c45a749d93ef0586a262e6afc1b7b58a3d71be8949135fcffba8`.
The simulation's pause is supplied by its test adapter; browser pause/input is
checked separately. `build-report.json` records compilation/resource checks
and intentionally does not claim runtime validation.

## Separate wave-generation oracle

`python tools/build_wave_oracle.py` creates `.build/oracle/waves-reference.swf`,
`WavesMainTimeline.as`, `waves-build.log`, and `waves-build-report.json`. It reuses
the serializer and automatic initialization helper text from the reload builder
without altering that fixture. Both reference SWFs can be run independently.

The wave fixture reaches the original Sheriff's battle initializer, which builds
the complete original enemy catalog. For each seed it selects ordinary day-one
conditions, resets a test-only xorshift32 stream, then calls the **original**
`generateMission(0)` followed immediately by `preGenerateWave()`. Seed values are
42, 1 and 3735928559 (`0xdeadbeef`). Both calls share one stream. Snapshotting occurs
before any gameplay timer or frame handler can advance the result.

All 132 `Math.random()` call sites in the generated MainTimeline copy route to a
wrapper. It uses the controlled stream only during the synchronous scenario and
falls back to `Math.random()` at all other times. The wrapper uses signed 32-bit
xor shifts 13, 17 and 5, unsigned right shift for 17, stores the result as uint,
and divides by 4294967296. Zero seeds map to one. The builder verifies that
reversing the call-name substitution recovers the original source exactly.
Production ActionScript, TypeScript RNG and the reload fixture are unchanged.

Source inspection confirms this bounded call chain stays in MainTimeline:
`generateMission` calls `generateSpecialLoot`; `preGenerateWave` calls
`generateWave`, which calls `randLv` and `selectEnemy`. In particular, generating
special loot consumes a random value, the forced first-day boss wave still
consumes its discarded random value, and `selectEnemy` tests the fly filter
before checking that enemy's level. These calls must remain in the stream.
No enemy instance AI or external class random calls are included in this claim.

Wave records use the same prefix and protocol version with `kind: 'waves'`:

- `ready`: `seeds`, `rng: 'xorshift32'`, and
  `clock: 'synchronous-original-generation'`.
- `snapshot`: one per seed, containing `seed`, `missionLevel`, `day`, `bossWave`,
  `drawCount`, `rngState`, `powerOrg`, `reward`, `spawnRate`, `loot`, and `waves`.
  Each wave is `{ index, enemies, delays, initialCount }`, preserving original
  numeric enemy IDs and array order. Gameplay later consumes these arrays from
  the end. Delays retain the source's assignment before each shuffle swap.
- `complete`: `ok: true`, `snapshots: 3`, and `seeds`.
- `error`: `message` and optional `phase`.

The optional ExternalInterface callback is `oracleRunWaves`. Two automatic browser
runs produced identical five-record traces. The comparison matches all three
snapshots, including wave arrays, delays, pending loot, mission values, draw count
and final RNG state. Seeds 42, 1 and 3735928559 consume 150, 151 and 153 draws and
produce 28, 29 and 31 enemies respectively. Trace SHA-256:
`479295a34c068696271273a426bf235f118cc5e05a69be56bc49b4b41b1f038f`.

The first comparison failed: the port omitted the initial special-loot draw and
the unconditional fly-filter draw in each enemy selection. The original trace
exposed both omissions, and the corrected implementation now passes. The failed
report remains in `.build/oracle/waves-before-comparison-report.json`. Accepted
original traces are checked into `web/tests/fixtures/`; normal tests also verify
that a deliberately extra RNG draw is detected despite remaining deterministic.

This establishes generation equivalence under the **same injected RNG stream**,
not equivalence to historical Flash randomness or full combat timing. It does
not cover spawn initialization, combat, later days or inventory redemption.

## Why these checks are separate

The [Ruffle regression-test framework](https://github.com/ruffle-rs/ruffle/blob/master/tests/README.md)
supports controlled ticks, trace expectations, images, audio assertions and
explicit numerical tolerances. Its browser player does not expose that same
tick-driving test API. These first fixtures therefore drive original methods
inside a diagnostic copy and state that boundary explicitly. Native event order
and rendered frames need their own comparisons.

Use three complementary evidence layers: original-versus-port state/event
comparisons for rules; seeded replay and save checks for stability; and ordinary
browser flows plus matched images for input, sound and rendering. A fast bot can
reach checkpoints without human reaction time. A bot winning a battle is not by
itself proof that the battle matches the original.

## Separate spawning and pellet-hit oracle

`python tools/build_combat_oracle.py` exports `enemy.as` directly from the
preserved SWF, then creates `.build/oracle/combat-reference.swf` and
`combat-build-report.json`. It instruments MainTimeline and enemy in a separate
diagnostic copy. Both classes reside in original DoABC tag 2782; the verified
build changes that one tag and retains every non-code payload. The reload and
wave diagnostic SWFs are unaffected.

After original Sheriff battle initialization, the driver freezes ambient frame
and timer handlers. Original `spawnEnemy` and `enemy.init` execute synchronously
with one controlled xorshift32 stream shared by MainTimeline and enemy. Only
those two classes' random calls are intercepted (132 and 89 call sites,
respectively); calls fall back to ordinary `Math.random()` outside a fixture.
The builder verifies reversible random-call substitution and that removing the
single damage-observer statement recovers the original enemy source exactly.

Ten spawn cases cover enemy IDs 3 (sheep), 17 (rat), 19 (chicken), 6 (crow), and
999 (boss), each with seeds 42 and 3735928559. They capture initialization before
any enemy frame callback advances. Each case uses a new original enemy instance
in the first free slot. Cleanup is an injected detach helper, not an original
death or despawn action, so previous cases cannot leave live enemy handlers.

Eleven additional cases call original `procHit` for **one shotgun pellet**, not
the full `shoot` method. They use the original shotgun's damage expression and
the original vector `hitTestPoint(..., true)`, shadow exclusion, SENSE roll,
critical rectangle checks, and `enemy.damage`. The target is positioned at
(200, 220), and its display clip is explicitly stopped at a specified original
frame. Spawn setup uses seed 42; the stream is then reset to 42 immediately
before `procHit`, so the reported hit draw count excludes setup.

| Scenario | Enemy frame | Local point relative to enemy |
| --- | --- | --- |
| `sheep_miss` | Sheep 5 | (-100, -100) |
| `sheep_body` | Sheep 5 | (0, -5) |
| `sheep_crit_inside` | Sheep 5 | (10, 4) |
| `sheep_crit_left_boundary` | Sheep 5 | (4, 4) |
| `sheep_crit_left_inside` | Sheep 5 | (5, 4) |
| `sheep_crit_right_boundary` | Sheep 5 | (19, 4) |
| `sheep_crit_top_boundary` | Sheep 5 | (10, -1) |
| `sheep_crit_top_inside` | Sheep 5 | (10, 0) |
| `sheep_crit_bottom_boundary` | Sheep 5 | (10, 9) |
| `crow_body` | Crow 3 | (0, 0) |
| `rat_lethal` | Rat 14 | (0, -5) |

Names describe the intended probes, not asserted hit outcomes. Vector coverage
can exclude a point even when it lies inside the critical rectangle; captured
`geometry` and actual damage events distinguish those cases. The rat probe can
exercise original death/experience/loot logic if its point hits. The fixture
sets normal first-day multipliers and no rampage, resets observed reward counters,
and supplies a group size of 10 for controlled loot-roll arithmetic. It does not
claim the group came from a generated wave.

Records use `kind: 'combat'`, protocol version 1 and the existing trace prefix:

- `ready`: `spawnSeeds`, `enemyIds`, `rng`, `clock`, `geometry`, `displayAdvance`.
- Spawn `snapshot`: `scenario: 'spawn'`, `seed`, `enemyId`, `drawCount`,
  `rngState`, `enemy`, and `displayAdvance: 'none-after-init'`.
- Hit `snapshot`: `scenario`, `seed`, `enemyId`, `point`, `rawDamage`, `before`,
  `after`, `geometry: { shapeHit, shadowExcluded }`, `hit`, `damageEvents`,
  `playerDelta`, `drawCount`, `rngState`, and
  `displayAdvance: 'none-after-explicit-frame'`.
- `complete`: `ok: true`, `snapshots: 21`, `spawnCases: 10`, `hitCases: 11`.
- `error`: `message` and optional `phase`.

Enemy snapshots include raw ID, level, HP, attack, speed, original speed, gold,
experience, critical bounds, knockback, attack/drop flags, damage type, drop
result, death counter, frame, scale, clip dimensions/local bounds, shadow-hit
flag, alive/free state, and primitive boss initialization fields. `damageEvents`
records the actual damage and critical type immediately before the original HP
subtraction. `playerDelta` reports reset-counter results for experience, kills,
weapon experience, rampage, earned gold, critical kills and queued loot.

The optional callback is `oracleRunCombat`. Native display advancement, actual
30 Hz / 20 Hz scheduling, shotgun spread/cadence, mouse input, collision parity
with Phaser raster masks, and random calls in other effect classes are outside
this fixture. These limits matter especially for lethal-hit cosmetic effects.
Compilation/resource checks passed. The durable
`.build/oracle/combat-browser-report.json` reports two successful, identical
Ruffle 0.7.1 runs: 23 records each, containing 21 snapshots plus ready/complete.
The captured SWF SHA-256 is
`3930a9a1e9a4ed9d50a4eb59ad50748e2875a82685041e83ebf6c085eaa84148`.
The independent port comparator now passes all 21 snapshots. Its first report
matched only 11: it exposed missing SENSE and critical-kill voice-selection
draws, a changed rat drop, and two one-bit speed differences. Preserving the
original multiplication/division order fixed speed without a tolerance. The
earlier `fireAt` incorrectly reused the `processPellet` path tested by this
comparator. The source audit separated normal `shoot` from projectile `procHit`:
normal firing consumes a second hit roll and dilutes SENSE by shell count.
This fixture remains a projectile-method comparison; the separate shoot
fixture exercises production `fireAt`. Accepted original records
and a negative control for the missing SENSE roll are in the ordinary suite.

The comparator supplies the original vector body/shadow classification to the
port's hit-test callback. It therefore checks the port's own critical rectangle,
damage, death/accounting and RNG sequence **conditional on that geometry**, not
the equivalence of the raster hit masks. Eight probes hit and three miss; the
right critical boundary and shadow exclusion are not exercised by a covered
point. Original display bounds/scales, boss idle/fire defaults, earned-gold
attribution and audible output remain outside this comparison.

The observations demonstrate why geometry is recorded independently: the
`sheep_body` probe at local (0, -5) misses the original silhouette. The inside
critical probes apply 32 damage, while covered left/top/bottom boundary probes
apply 16. The right boundary point misses. The crow body probe applies 12 damage;
the rat probe hits critically and executes lethal-hit logic, consuming five
controlled draws. These are captured original results, not fixture expectations
copied from the port.

An earlier browser attempt timed out at the Kongregate intro before any oracle
records appeared. Another in-app browser tab was active during the initial
attempt; closing it and reloading the sole visible oracle tab subsequently
completed both runs without rebuilding the SWF. Inactive-surface throttling was
a hypothesis, not an isolated causal finding. The later startup probe below
identified slow intro progression and removed that dependency from test builds;
a pre-oracle timeout remains distinct from a failed original-method assertion.

A read-only integrity check exported MainTimeline back from the actual combat
SWF and confirmed that the deferred-title startup fix, `oracleBootstrap`,
`oracleBattleReady`, RNG wrapper, and combat driver survived the second class
replacement. Corresponding hooks were also present in the working wave SWF.
No code changes were made to obtain the successful rerun.

## Ordinary-enemy geometry oracle

`python tools/build_geometry_oracle.py` creates
`.build/oracle/geometry-reference.swf` and `geometry-build-report.json`. It reuses
the tested original spawn driver and serializer but executes a separate geometry
suite. Original vector `mc.hitTestPoint(x, y, true)` and the original shadow
display object supply all mask data. No exported raster masks or TypeScript
collision rules are copied into the reference.

The initial 18-case capture covers these requested frames at registration position (200, 220):

| Enemy | Original ID | Requested frames |
| --- | --- | --- |
| Sheep | 3 | 5, 32, 44, 107 |
| Rat | 17 | 14, 41, 93 |
| Chicken | 19 | 5, 37, 105, 208 |
| Crow | 6 | 3, 30, 46 |

The accepted 19-case fixture adds a sheep explicitly visiting frames 32 then 5
at (200, 220), so two identical final poses can have different shadow state.

Each type also uses its first listed frame at requested position
(200.375, 220.625). The trace records the actual coordinates returned by Flash
after assignment, rather than assuming how fractions are converted to twips.
Each case samples a 64 × 64 grid of integer **world coordinates**, beginning at
`floor(actualEnemyX) - 32, floor(actualEnemyY) - 32`. This matches the integer
pellet-coordinate domain and exposes fractional enemy-registration differences.
The sample index is `row * 64 + column`, with x increasing first.

Fresh original enemies are spawned with test seed 42 and positioned explicitly.
The game timer and ordinary root frame handler remain stopped, and the fixture
sets the game's pause guard before selecting poses. One entire grid is sampled
synchronously per diagnostic `ENTER_FRAME` callback; the driver yields between
cases to avoid one long ActionScript call. This callback is harness scheduling,
not a simulation of native gameplay event ordering.

Original frame scripts are allowed to execute. For sheep frame 44, the fixture
first visits frame 32, whose original entry script disables shadow hits. It
does not assign that flag itself. Both `spawnFrame` and the explicit `poseFrames`
sequence are recorded. A frame script can redirect a requested frame, such as
crow frame 46 returning to its attack label, so the trace separately records
the final actual `frame`. Dead poses are selected display frames; the fixture
does not simulate the full death sequence or corpse lifetime.

Protocol version 1 uses `kind: 'geometry'` and the usual trace prefix:

- `ready`: enemy IDs, snapshot count, grid dimensions, seed, sampling convention
  and `clock: 'one-synchronous-grid-per-diagnostic-frame'`.
- `snapshot`: `caseIndex`, `enemyId`, `requestedFrame`, `frame`, `spawnFrame`,
  `poseFrames`, `requestedPosition`, actual `position`, `rootPosition`,
  `shadowHit`, `bounds`, and `grid: { x, y, width, height, step }`.
- Each snapshot also has `bodyBits`, `shadowBits`, `combinedBits` and their
  respective counts. Each string has 4,096 characters, one `0` or `1` per point.
  `bodyBits` samples the complete original enemy clip, `shadowBits` samples its
  shadow, and `combinedBits` is
  `body && !(shadowHit === false && shadow)`, matching original `procHit`.
- `complete`: `ok: true`, `snapshots: 19`, `sampledPoints: 77824`.
- `error`: `message` and the current `caseIndex`.

The archived `.build/oracle/geometry-before-sheep-transition/geometry-browser-report.json` confirms two successful,
identical Ruffle runs: 20 records and 18 snapshots per run, covering 73,728 grid
points per run. The complete two-run report is 482,850 bytes, below the requested
2 MB bound. Its captured SWF SHA-256 is
`b70dcadf87a70b9ea31d4d8991bc1600ec43c3c23e3960ae71c322a828be8326`.
All four fractional assignments were observed as (200.35, 220.6). Sheep frame
44 retained `shadowHit: false` after the original frame-32 entry script; crow's
requested frame 46 resolved to actual frame 30. These are original-runtime
observations; the separate production-path comparison is described below.

The optional callback is `oracleRunGeometry`; concurrent reruns are rejected
while the current suite is active. The verified SWF changes only DoABC tag 2782
and retains all original non-code resources. Port geometry comparison remains
a separate check. The grids cover their stated 64 × 64 regions only; geometry
outside those regions is not asserted by these snapshots.

### Contour comparison and accepted fixture

The current original trace was accepted after both complete 19-case runs matched.
Its capture time is `2026-11-01T20:22:50.995Z`; the trace SHA-256 is
`9c6b91049b5b901016e4f26f3a1e05fac349df4bb1497ad7af1405b46b9e5f6e`.
Its instrumented SWF SHA-256 is
`f533d0e01c221a042bcf8cd0aa215261632b461dc275249dc1f3a66f6d7d89d9`.
The complete browser report is 513,722 bytes, with 21 records per run. Its first
18 snapshots are identical to the archived initial capture; the added case is
the sheep 32-to-5 transition described below.
The checked-in `web/tests/fixtures/original-geometry-trace.json` preserves those
original records, runtime, capture time, original/instrumented SWF hashes and
trace hash. Expected hit bits come from the original SWF, not the port's output.
The original SWF SHA-256 remains
`4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
The build report verifies all 3,491 root tags, with only DoABC tag 2782 changed;
its compilation status is separate from the successful browser-run report.

The first comparator exercised the same alpha-mask geometry and alpha sampling
used by `main.ts`, reading exact RGBA frames from the exported game atlases.
It agreed with all eleven earlier sparse ordinary-enemy combat probes, but the
dense grids exposed substantial differences:

| Production geometry | Compared points | False positives | False negatives |
| --- | ---: | ---: | ---: |
| Original port alpha masks | 73,728 | 104 | 4,211 |
| Extracted original filled contours | 73,728 | 0 | 0 |

Here a false positive means the port accepts a point rejected by the original;
a false negative means the port rejects an original hit. Rat frame 14 had 764
original hit points versus 302 with alpha masks; crow frame 3 had 754 versus
350. The discrepancy is primarily a shape-semantics difference, not raster
edge noise: original bitmap-fill rectangles include transparent bitmap pixels.
For rat frame 14, shape 1260 contributes 713 sampled points and the original
shadow rectangle contributes 51 additional points, explaining all 764 hits.

`tools/extract_collision_geometry.py` reads the original XML shape records and
placement matrices into `web/public/assets/collision-geometry.json`. It preserves
filled contours, including the quadratic blood shape, in twips. It does not use
the captured hit grids to construct geometry. `web/src/collision.ts` transforms
world samples into those shapes and applies the original shadow exclusion;
`main.ts`, the comparator and the regression test all call this same production
function. Ordinary collision is therefore independent of bitmap transparency
and Phaser texture filtering. Boss collision still uses its separate rendered
alpha path.

An intermediate contour comparison had 199 exact-boundary differences. Matching
the observed left-exclusive/right-inclusive vertical-edge convention removed
them; no distance threshold, widened tolerance or oracle-mask substitution was
used. The final geometry asset SHA-256 is
`c062ab2837aa3e95d670e90ee986ccd1fe8346fca27a9f3b62bef7aec56d69b8`.
Before evidence remains in `.build/oracle/geometry-comparison-before.json` and
`collision-alpha-baseline.ts`; the final exact result is
`.build/oracle/geometry-comparison-report.json`. `.build/` is an ignored local
evidence cache; the accepted original fixture and regression test are checked in.

The result proves the sampled combined predicate at these 19 poses/positions.
It does not establish all animation frames, the continuous subpixel domain,
geometry outside the grids, native Adobe Flash behavior, boss geometry or
dropping rats. The extractor fixes nested sprite timelines at frame 1; the only
animated nested sprite in these four enemy definitions is the dropping-rat
sprite, outside the current scope. The accepted corpse samples precede the
quadratic blood shape, so later corpse/blood contours are extracted but not
independently validated by these samples. The game can still consume a SENSE
random draw when a pellet intersects a corpse, making that a meaningful future
comparison rather than a cosmetic-only omission. Full shotgun targeting and
moving-enemy integration need their own checks.

### Startup diagnosis and sheep shadow history

The first 19-case attempts timed out with no canonical records. An early
`ELONA_STARTUP` observer then proved that the intro was advancing, rather than
establishing a stalled timeline or missing observer. In that capture, the logo
advanced about five frames per second and the title appeared at 44,126 ms;
character creation was still progressing when the unchanged 60-second budget
expired. The exact cause of the slow browser scheduling was not isolated.
The probe SWF, build report and capture are preserved as
`.build/oracle/startup-diagnosis/slow-intro-*`. Earlier visibility/background
options did not establish a remedy and were removed.

The bounded remedy skips only the diagnostic copy's ad/intro flags through
`instrument_startup()` in `tools/build_oracle.py`. The original init, New Game,
Sheriff selection, Proceed fade and battle initialization still execute. In the
successful two-run capture, title appeared at startup tick 3 in both runs, and
both suites completed within the original 60-second timeout. The reference
runner no longer needs repeated user-assisted intro restarts for this case.
This result does not assert a general browser scheduling fix. No original
ActionScript baseline, runtime game clock or resource was changed.

The added original sheep case visits frame 32 and then frame 5. It observes
`shadowHit: false`, giving 410 combined hits; a fresh frame-5 sheep gives 486.
The previous frame-only port rule produced exactly 76 false positives and no
false negatives, all in the added case. That before report is preserved in
`.build/oracle/geometry-shadow-history-before.json`.

The port now persists `EnemyState.shadowHit`. Its shared `shadowHitAtFrame`
helper follows original frame-script assignments: sheep frame 1/107 enables
shadow hits, frame 32 disables them, and frame 5 retains the existing state.
The production collision path receives that state. The comparator reconstructs
it from the captured spawn/pose sequence through the same production helper;
it does not feed the expected original flag into the port calculation. The
current comparison matches all 77,824 points with zero false positives or
negatives, without changing the contour asset or tolerances.

Focused tests exercise the actual simulation attack, Sheriff knockback, alive
loop, death and save/restore paths. Old saves that lack the flag cannot reveal
past attacks; they retain the former frame-derived behavior without consuming
RNG, then persist subsequent state. Explicit non-boolean flags are rejected.
For example, a saved sheep already returned from attack frame 32 to alive frame
5 can be inferred as accepting shadow hits, although its original retained
flag was false. Neither its current frame nor its position can recover that
missing history.
This corrects a demonstrated port discrepancy, not the separately reported
late-game hitbox problem.

### Regenerating and comparing geometry

From the repository root, build the diagnostic SWF and start the local harness:

```powershell
python tools/build_geometry_oracle.py
python tools/serve_oracle.py --port 5176
```

Open `http://127.0.0.1:5176/?suite=geometry` in a visible browser and keep that
surface active until both runs finish. The harness saves the complete original
report to `.build/oracle/geometry-browser-report.json`. A compiler success alone
does not replace this capture. The current builder targets the accepted 19-case
suite above. Retain the accepted fixture unless a new original
capture has been checked for provenance, successful completion and repeatability.

In another terminal, regenerate assets and run the production comparison:

```powershell
python tools/extract_web_assets.py
cd web
node --experimental-strip-types scripts/compare-geometry-reference.ts
node --experimental-strip-types --test tests/geometry-reference.test.ts tests/enemy-shadow.test.ts
```

The main asset extractor includes contour generation and preserves the original
SWF hash. When `.build/reference/original.xml` already exists, the bounded
`python tools/extract_collision_geometry.py` command regenerates only the contour
asset. The comparator requires two identical successful original runs and writes
every mismatch, if any, to its report; any discrepancy makes it exit nonzero.
The ordinary regression test uses the checked-in original fixture and production
geometry asset, so it does not need a new browser capture or ignored build cache.
The archived initial 18-case comparison can still be rerun from `web/` with
`node --experimental-strip-types scripts/compare-geometry-reference.ts ../.build/oracle/geometry-before-sheep-transition/geometry-browser-report.json`.
The default report path now contains the successful 19-case follow-up capture.

This is a reference observation, not a requirement to preserve collision bugs.
Per the current user direction, observable gameplay pacing and balance matter;
the original scheduler is a comparison baseline rather than a mandatory new
architecture. The reported late-game hitbox problems still need their own
reproduction with relevant larger/modified enemies and states. These ordinary
enemy grids neither establish nor fix those late-game cases. A later deliberate
collision correction should retain the original observation and document the
new intended behavior with its own regression check.

## Original item and ordinary-loot oracle

`tools/build_loot_oracle.py` runs the preserved ActionScript `generateStuff`,
`randomStuff`, `generateLoot` and `generateLootBoss` methods after actual Sheriff initialization,
with a controlled xorshift32 stream. The boundary covers day 1, zero Engineer
and Looter, no recycle medal and normal weapon-level mode. Starting-item cases
include the original grenade → temporary bow → shotgun calls and overrides;
they exclude the preceding character-generation random draws.

The capture at 2026-11-01 20:25:09 UTC used `@ruffle-rs/ruffle 0.7.1`. Both runtime
runs were identical: each contained ready, 157 snapshots and successful
completion. All 157 snapshots matched the production comparison, and the
original 139 snapshot records were unchanged from the previously accepted trace:

- 116 base-item cases: all 58 original IDs at seeds 42 and 3735928559.
- 15 random-item cases: modes 0–4 at seeds 42, 1 and 3735928559, target value 500.
- Six ordinary-loot cases: queues `[1117]` and `[1117,6,28,30]` at those three seeds.
- Two starting-item sequences at seeds 42 and 3735928559.
- 18 boss-prize cases: three seeds across counts 1/2/16, the eight-slot cap,
  modifier-only selection and fresh/reused slots (including `num = 0` metadata).

Comparison checks all 33 observed item fields, ordinary/boss offer slots and consumed
guarantee markers, plus exact RNG draw count and final state. The build preserves
all 3491 root tags, non-code payloads, tag order and frame header; only DoABC tag
2782 changes. The diagnostic SWF uses version 10 for the compiler output.
The shared diagnostic startup sets only the original `skipLoader`/`skipAd`
flags to skip the intro; actual New Game, Sheriff initialization and compared
methods still execute. Separate startup observations are excluded from the trace.

- Original SWF SHA-256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Instrumented SWF SHA-256: `82b73f64662cd400a54a4a6fb1197c25e14247706c455e8a08bf5e30791c9aa9`.
- Captured trace SHA-256: `31ddf186413fd024af1e38c253ba8af5231ca3eaeb7d6ef56691b57c0c549efe`.

Evidence is saved in `.build/oracle/loot-build-report.json`,
`.build/oracle/loot-browser-report.json` and
`.build/oracle/loot-comparison-report.json`. Regenerate from the repository root:

```powershell
python tools/build_loot_oracle.py
python tools/serve_oracle.py --port 5176
```

Open `http://127.0.0.1:5176/?suite=loot` in a visible browser and keep it active
until both original runs finish and save. In another terminal:

```powershell
cd web
node --experimental-strip-types scripts/compare-item-reference.ts
node --experimental-strip-types --test tests/item-reference.test.ts
```

The comparator requires two identical successful captures. The ordinary
regression uses `web/tests/fixtures/original-item-trace.json`, so it needs no
browser or ignored build cache. Replacing that accepted fixture requires a
checked original capture, not regeneration from TypeScript expectations.

These cases establish item-generation parity within the stated boundary, not
pointer-interaction or visual parity, skill progression, town/shop behavior,
modifier mounting, later days or playable support for every generated weapon.
See [item integration notes](../web/docs/items-notes.md) for the current
Simulation v3 save migration and ordinary/boss loot screens.

## Original Sheriff skill-choice oracle

`tools/build_progression_oracle.py` exercises the preserved `listTrait`,
`listTrait2` and trait `REF`/`CALC` methods after actual Sheriff initialization.
The test boundary supplies level 2, known initial traits and controlled hidden
base values, with Focus disabled. It is a method comparison; preceding character
generation and growth are outside the boundary.

The capture at 2026-11-01 20:27:08 UTC used `@ruffle-rs/ruffle 0.7.1`. Both runs
were identical, each with ready, nine snapshots and successful completion.
All nine snapshots match the production progression module: seeds 42, 1 and
3735928559 at Capable levels 0, 1 and 2. Checks cover the original candidate
order, eligible pool, three to five selected skills, all 15 current/next effect
descriptions and preview labels, level requirements, maximum levels, raw effect
calculations, RNG draw count and final state.

- Original SWF SHA-256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Instrumented SWF SHA-256: `43871c046326abf03f452e386a52dd94b1c8b15e918a8f794fa6700766d9f240`.
- Captured trace SHA-256: `258e2b8b174de014162b651be314f15a46cf0fd64f5066f7a2dc2f5b064071c1`.

The build preserves all non-code tag payloads, ordering and frame metadata.
It uses the shared diagnostic intro/ad skip and separate startup observations.
Evidence is under `.build/oracle/progression-*-report.json`; the accepted fixture
is `web/tests/fixtures/original-progression-trace.json`.

Regenerate with `python tools/build_progression_oracle.py`, start
`python tools/serve_oracle.py --port 5176`, then open
`http://127.0.0.1:5176/?suite=progression`. After two successful identical runs,
run `npm.cmd run test:progression-reference` from `web/`. Ordinary `npm.cmd test`
uses the accepted fixture without requiring a browser or ignored build cache.
Expected values must come from a checked original capture, never the port.

This boundary does not operate original radio buttons or commit a selection.
Other classes, Focus, exhausted-pool fallback, hidden-stat growth, subsequent
combat effects and live visual matching remain separate work. Current REF labels
and category/max-label metadata are captured but not compared by this screen
adapter. Browser checks independently cover selecting, previewing, committing,
reload/Continue and migration from the earlier result screen.

## Original result settlement and Free Repair oracle

`tools/build_town_oracle.py` exercises the original `renewResult` (line 3411),
`townEvent` (6417), `showEventDialog` Free Repair branch (10561) and
`procEventDialog` (6624) after actual Sheriff initialization. It prepares the
original Castle clip for the action, but explicitly does not enter `frame71`.
Shop stock, cards, next-mission generation, recruits and town-entry medal effects
are outside this boundary. The shared diagnostic intro/ad skip remains in use.

The capture at 2026-11-01 20:43:14 UTC used `@ruffle-rs/ruffle 0.7.1`. Two
identical runs each contain ready, 11 snapshots and successful completion;
all 11 snapshots match the production Simulation methods:

- Six first-day settlements: seeds 42, 1 and 3735928559, with and without a
  perfect battle. Default upgrades, zero income, no companions/medals and
  Active 0 yield 40 upkeep, 4 AP and net rewards of 560 or 740. Each settlement
  consumes all three original fame/AP draws even when their bonuses are zero.
- Five Free Repair observations: success from 17/40 HP and 2 AP, acknowledgment,
  repeated use after full repair, damaged walls with 1 AP, and full walls with
  zero AP. The full-wall check takes priority over the AP check. Success spends
  2 AP, restores 40 HP and leaves gold/day/RNG unchanged; acknowledgment removes
  the original dialog without further game-state changes.

The captured original dialog uses card frame 2, title `Free Repair!`, and text
`Citizens acknowledge your hard work and decided to rebuild the castle walls for free!`
The original wording is preserved, including its tense. Rejection messages are
`The castle is not damaged!` and `You don't have enough action points!`.

- Original SWF SHA-256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Instrumented SWF SHA-256: `a3067ee0145054d8d834af0731085a6ba8e218261b7b18abbeef1e4280c261ad`.
- Captured trace SHA-256: `443099a3eaaf83a2b101b8aefa32737fbff835d7a85a189baa304d10176be702`.

Build verification preserves all 3491 root tags, non-code payloads, ordering and
frame header; only DoABC tag 2782 changes. Evidence is under
`.build/oracle/town-*-report.json`. The accepted fixture is
`web/tests/fixtures/original-town-trace.json`.

Regenerate with `python tools/build_town_oracle.py`, start
`python tools/serve_oracle.py --port 5176`, then open
`http://127.0.0.1:5176/?suite=town`. After two identical successful captures,
run `node --experimental-strip-types scripts/compare-town-reference.ts` from
`web/`. The focused `node --experimental-strip-types --test tests/town-reference.test.ts`
uses the accepted fixture without a browser or ignored build cache.

The comparison calculates the production result plan through `finishDay`, then
reseeds at `prepareResult`; it does not inject the expected reward total.
Free Repair comparisons call production `freeRepair` from controlled town state.
They exclude `enterTown`, which now also prepares the shop and other town state;
that preparation has its own reference below. The Simulation has no modal state,
so acknowledgment checks unchanged HP/AP/gold/day/RNG only.
Actual DOM dismissal, card rendering and text layout require separate browser
validation. Source earned-money totals are now compared directly. Separate
wage/income fields are recorded but absent from the current result model. This
is a bounded result and repair check, not whole-town or Day 2 parity.

## Original ordered first-town preparation oracle

`tools/build_town_preparation_oracle.py` extracts the original fresh-entry
preparation block from `frame71` (lines 3186–3211) and the subsequent search-state
initialization (3224–3227). After actual Sheriff initialization, it executes the
original `generateShop`, `generateCard`, `generateMission(game.day)`,
`generateRecruit`, medal checks and flag resets in their source order. Only
`saveGame()` I/O is replaced by an observation of the RNG boundary; the actual
source generator methods remain unchanged. The diagnostic intro/ad skip remains
in use. This is preparation logic, not the whole town timeline or its UI.

The capture at 2026-11-01 21:04:34 UTC used `@ruffle-rs/ruffle 0.7.1` in the
supported in-app browser. Two identical runs each contain ready, 16 snapshots
and successful completion. All 16 snapshots matched on the first comparison:

- Nine fresh-slot seeds exercise all nine recruit classes through original
  random class selection, including Militia's extra equipment and Guard.
- Three cases retain prior offer instances, including inactive `num = 0` slots.
- Three cases collect prior offers through original `swapStuff` before preparing
  the shop; the resulting empty cells retain exactly their source fields.
- One case starts with an existing search-state value and skips its final draw.

Comparison covers all 33 fields of every shop slot, including inactive item
metadata; five unrevealed cards; the complete generated mission configuration;
recruit identity, stats, nonzero traits and generated equipment; town flags;
search state; exact RNG draw count/state at the source save boundary and after
search initialization. Completely uninitialized slots are checked as raw
`num = 0`, `value = 0` and undefined remaining fields, not confused with formerly
occupied slots. An extra-draw negative control fails the independent comparison.

The scope is first-town day 1, normal mode, default upgrades and no medals.
The next mission is prepared at level 1 while the calendar remains day 1; no
waves are generated yet. The port persists the complete prepared state after
initializing search state, avoiding the original save-before-search ordering.
Shop transactions, card actions, recruiting/hiring, upgrades, Rest and Day 2
combat require their own integration checks. Older port saves cannot reconstruct
item metadata they previously discarded.

- Original SWF SHA-256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Instrumented SWF SHA-256: `184d3088ccf22a5e66aa27ca80c7f2f12153855517e1face72d5b8fed600e9c6`.
- Captured trace SHA-256: `980102e9439db74de3ce83d9e9db9b24febeb03b5da23b4bd5534e17bf52f652`.

Build verification preserves all 3491 root tags, non-code payloads, ordering and
frame header; only DoABC tag 2782 changes. Reports are under
`.build/oracle/town-preparation-*-report.json`; the accepted source fixture is
`web/tests/fixtures/original-town-preparation-trace.json`.

Regenerate with `python tools/build_town_preparation_oracle.py`, start
`python tools/serve_oracle.py --port 5176`, then open
`http://127.0.0.1:5176/?suite=town-preparation` in a supported visible browser.
After two successful identical captures, run `npm.cmd run test:town-preparation-reference`
from `web/`. The ordinary test suite uses the accepted fixture without requiring
a browser or ignored build cache. Expected state comes from the captured
ActionScript, never from TypeScript generation.

## Prepared second-day wave oracle

`tools/build_prepared_wave_oracle.py` calls the original `generateMission(1)`
while the calendar is day 1, records the prepared mission and RNG boundary,
then advances the calendar to day 2 and calls original `preGenerateWave()`.
The generation methods remain unchanged. This isolates the actual boundary
needed after Rest; it does not invoke or validate the Rest dialog.

The original capture at 2026-11-01 21:20:27 UTC contains two identical runs,
each with ready, three snapshots and successful completion. The production
module `web/src/missions.ts` matches all three seeds (42, 1, 3735928559),
including both boss-wave positions, every mission field before and after
generation, enemy ID arrays, initial counts, fractional spawn delays and exact
RNG draw counts/states. The existing three opening-wave snapshots also match
the extracted common module without changing their accepted fixture.

The prepared mission keeps the Rat statue from calendar day 1; regenerating
it after advancing to day 2 would wrongly produce a Sheep statue. Its spawn
rate is 14.8, and the initial delay adjustment uses fixed level 1. No additional
enemy kinds are selected: Sheep, Rat, Chicken, Crow and Boss cover this level.
Boss health and live behavior are outside this generation comparison.

- Original SWF SHA-256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Instrumented SWF SHA-256: `24be20f2efd05a35f93f26c76d9b4e5a27565dba1deb144c83590f4e2cd2bac3`.
- Captured trace SHA-256: `af377da869b98a344e655fe11f8181102195f63b043937d9175802878c9eafa6`.

Build verification preserves all 3491 root tags, non-code payloads, ordering
and frame header; only DoABC tag 2782 changes. The accepted fixture is
`web/tests/fixtures/original-prepared-wave-trace.json`; ignored runtime and
comparison reports are `.build/oracle/prepared-waves-*-report.json`.

Regenerate with `python tools/build_prepared_wave_oracle.py`, run
`python tools/serve_oracle.py --port 5176`, then capture two runs at
`http://127.0.0.1:5176/?suite=prepared-waves`. From `web/`, run
`npm.cmd run test:prepared-wave-reference`. The focused fixture test is
`node --experimental-strip-types --test tests/prepared-wave-reference.test.ts`.
This covers normal low-level missions without medals or party bonuses;
calendar transitions, equipment, live spawning and subsequent combat require
their own integration evidence.

### Missing cumulative boss damage in older saves

The v6 simulation persists `EnemyState.bossDamage`, the original accumulated
damage used by the boss's conditional shield check. Saves from v1–v5 never
stored it, so migration initializes this field to zero rather than claiming to
reconstruct the preceding hits. Loading preserves the saved RNG state, but
later conditional RNG consumption can differ from the unavailable original
history. This matters even below the shield's required level because the
source evaluates its random conditions before the level check. New v6 saves
retain the accumulator across save/restore. The separate missing-shadow-flag
limitation is documented above; neither migration recovers missing history.

### Actual shooting, modified weapons and kill ordering

`tools/build_shoot_oracle.py` invokes the original `shoot(_pc)` after controlled
setup. It replaces only two manual mouse reads with fixed-input getters,
wraps MainTimeline/enemy random calls, and adds observation hooks. The builder
verifies the original shoot body is recoverable by removing those changes.
All 3491 root tags, non-code payloads, tag order and frame header are preserved;
only DoABC tag 2782 changes. Original files remain unchanged.

The earlier assumption that the accepted `procHit` comparison covered normal
shooting was insufficient. `shoot` spends SENSE and ONE_HIT_KILL rolls at every
geometry hit, including corpses; `procHit` spends only SENSE and does not divide
its chance by shell count. The old fixture remains valid for its projectile
boundary. Nonlethal boss hits also spend one or two conditional rolls before
the source checks the boss's level. Living weapon evolution precedes XP growth,
whose two potential rolls precede voice/drop rolls.

Two Ruffle runs produced identical **22-snapshot traces**, all matched by
production `Simulation.fireAt`: eleven scenarios with seeds 42 and
3735928559. Coverage includes misses, ordinary/weak-point hits, actual corpse
intersections, Dr Holliday shells, SENSE evaluation away from weak points,
learned skills with modified shotguns, lethal hits, living-weapon evolution
combined with level-up, and two nonlethal boss accumulator conditions. Checks
include pellet coordinates and RNG position, damage/critical type/HP events,
all 33 weapon fields, XP/traits/kills/loot, slowing/knockback, boss damage,
every RNG value, draw count and final state. Observed counts include 24 for
complete misses, 36 for six corpse hits, 40 for lethal shots, 44 for combined
living-weapon/level-up shots, and 48 versus 42 for the boss conditions.

The first capture matched, but inspection found two named cases aimed into
transparent sheep pixels. Their aim was corrected using the accepted original
geometry grid, then both runs were recaptured before acceptance. Initial
passing capture/comparison artifacts remain in `.build/oracle/` with the
`-before-target-adjustment` suffix. A diagnostic private-field access error was
fixed by putting the boss accumulator setup setter inside the enemy class.

The comparator supplies original vector membership and captured pre-shot state
as inputs; it does not claim production geometry or initialization parity.
SENSE success is **not observed** for these fixed seeds: its non-weak-point
evaluation, failed outcomes and draw order are covered. Idle/burst/frenzy,
earned-gold attribution and display bounds are observed but not compared.
There is no frame/timer advancement, audio, rendered-frame, sister collision,
full AI or chain/bow/projectile-lifecycle comparison. Diagnostic SENSE and
growth inputs are explicit test states, not reconstructed hero history.

- Original SWF SHA-256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Accepted diagnostic SWF SHA-256: `62e14f1154c4068acf0778ac8b5b215c7abacc8f7146d1d821f536624502a217`.
- Accepted trace SHA-256: `cadfce66833c709c76c6dd582c8b3ff5637402ea28dfbbf0b843414199b0464a`.

Accepted data: `web/tests/fixtures/original-shoot-trace.json`. Regenerate with
`python tools/build_shoot_oracle.py`, capture `?suite=shoot` on the local oracle
server, then run `npm.cmd run test:shoot-reference` from `web/`. The focused
regression is `node --experimental-strip-types --test tests/shoot-reference.test.ts`.

## Equipment selection, held fire and reload input

`tools/build_equipment_oracle.py` derives a separate diagnostic SWF after genuine
Sheriff New Game initialization. It invokes the actual `KeyDown`, mouse handlers,
`onEnterFrame`, and `onTick` methods in an empty world. Input events precede each
controlled frame; an explicit 20/30 accumulator schedules timer calls. MainTimeline
and enemy RNG use the established seeded wrapper. Fixed coordinate reads cover
mouse-down, shooting and accuracy recovery; grenade trajectory is not compared.
All 3491 tags and every non-code resource remain preserved; only DoABC 2782 changes.

Two Ruffle runs produced identical **56-snapshot traces across 16 scenarios**.
All 56 matched production `useSlot`, `requestReload`, and `tick` on the first
comparison. Checks cover all 33 fields of all six inventory slots, selection,
consumable cooldowns, physical held input versus queued shooting, shot cooldown,
recoil/reload progression, the three `getWeaponInfo` animation indices, random
draw count and final state. Initial generated items are captured inputs; their
generation is tested by the separate item oracle.

Observed branches include selecting the same slot to cancel reload; preserving
cooldown while switching; ignoring empty/6th slots; selecting but refusing to fire
an unsuitable gun or non-gun; Space's pre-frame cooldown guard; manual cancellation
versus magazine reload retaining a queued shot; automatic versus semi-automatic
held fire; switching while held; firing during automatic reload; its exact idle
threshold and immediate first timer step; and an empty trigger that reloads
without automatically resuming fire. A grenade-use probe leaves the selected
weapon/reload unchanged and refuses a second use while its 101-update cooldown
exists. Automatic hold produced three shots/120 draws, while semi-automatic hold
produced one shot/24 draws until another press.

This tests imposed callback ordering, not native Flash event scheduling. Actor
current frame, chain/burst bookkeeping and audio are observed or source-audited
but are not runtime comparisons here. There are no enemy hits, AI or projectile
lifecycle claims. Actual manual aim for the zero-frame grenade-use probe is
irrelevant to the compared inventory/cooldown state. The accepted reload and
shoot fixtures retain their original expectations; only their adapters changed
to read canonical item ammo/reload fields after save version 7 integration.

- Accepted diagnostic SWF SHA-256: `85ba31143d1e5d3f15f96103e5aa34dcb4a107027d8c376002200764e6266406`.
- Accepted trace SHA-256: `f27efba72ad9b8fd2c08db038e8c4d7910359914181757ab798038822cb2b7f1`.
- Accepted fixture: `web/tests/fixtures/original-equipment-trace.json`.

Regenerate with `python tools/build_equipment_oracle.py`, capture `?suite=equipment`,
then run `npm.cmd run test:equipment-reference` from `web/`. The focused regression
is `node --experimental-strip-types --test tests/equipment-reference.test.ts`.

## Rest into the second battle

`tools/build_rest_oracle.py` exercises the original Rest dialog and
acknowledgment, `frame65`/Begin, and `frame27` battle setup. It skips only the
decorative Begin wait by invoking the original frame handler at delay 89;
the transition methods remain unchanged. Each of three seeds captures before,
dialog, after acknowledgment and battle ready. Cases include zero AP, full and
damaged walls, spent consumables, partially loaded guns, and medal-60 absorption.

The capture at 2026-11-01 21:47:43 UTC produced two identical runs with 12
snapshots each. The production `Simulation.startNextDay()` matches all three
final transitions: day, HP, money, retained AP, selected slot, all initialized
item fields, gun refills, remaining consumables, shot/recoil/rampage resets,
mission parameters, wave arrays and exact RNG state. Opening/acknowledging Rest
consumes no random numbers; battle-entry wave generation consumes 146, 152 and
147 draws for these controlled inputs. Repeated Rest is rejected.

The comparison reports **three transitions from twelve source observations**.
It does not count the captured source dialog states as independently tested
port DOM states. Source `resultTaken`, burst, frenzy, idle count and unmodeled
mission bookkeeping are recorded but excluded. A wholly uninitialized inventory
slot normalizes to `null`, including the source's new empty-slot reload timer;
later `generateStuff` always overwrites that timer. Initialized inactive item
metadata is retained and compared.

- Diagnostic SWF SHA-256: `637eeeda598260f7b433083dd67920455c6b19f16e97c69eee825c63ef6582ff`.
- Trace SHA-256: `64ced0b7d0c4b7126cb236fb46b9fe6beb3971e4c68193cb01532ca077a97719`.
- Accepted fixture: `web/tests/fixtures/original-rest-trace.json`.

Regenerate with `python tools/build_rest_oracle.py`, capture `?suite=rest`, then
run `npm.cmd run test:rest-reference` from `web/`. The focused test is
`node --experimental-strip-types --test tests/rest-reference.test.ts`.
Normal solo play is covered; hired companions, Hardcore save deletion, purchased
sisters, visible transition timing and dialog interaction require separate checks.

## Second-town preparation

`tools/build_second_town_oracle.py` reuses the independently extracted original
`frame71` preparation block. Six cases cover seeds 42, 1 and 3735928559 with
medal 60 absent/present, prior offer metadata, retained Militia slots 45/47/48,
and an existing search value. The capture at 2026-11-01 21:51:59 UTC produced
two identical runs; `prepareEarlyTown` matches all six snapshots and exact RNG.
All 33 shop-item fields, retained recruit items, other recruit fields, cards,
mission parameters, flags and search state are compared.

Day-2 shop budgets and item generation use calendar 2. The recruit's level is
still 1, but its level draw remains mandatory. Preparing the next mission gives
level 2, power 1040, base reward 640, spawn rate 14.6 and a Sheep statue. Medal 60
adds 0.01 absorption without an extra draw. Third-day waves remain unsupported.
The accepted first-town fixture is unchanged.

- Diagnostic SWF SHA-256: `34546d7cad84d9c6ebc881d477be8f923715910cd1599a36a0edf3edc47df331`.
- Trace SHA-256: `782e453a7525ba7616301fcd397c64256f2fb2a0267b5429d60a81287d4b58ae`.
- Accepted fixture: `web/tests/fixtures/original-second-town-trace.json`.

Regenerate with `python tools/build_second_town_oracle.py`, capture
`?suite=second-town`, then run `npm.cmd run test:second-town-reference` from
`web/`. The focused test is
`node --experimental-strip-types --test tests/second-town-reference.test.ts`.
Both builders preserve all 3491 root tags, non-code payloads, ordering and frame
header; only DoABC tag 2782 changes. The original SWF fingerprint remains
`4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
See `web/docs/rest-notes.md` for source transition, medal and settlement boundaries.

## Castle damage, party skills and protection expiry

`tools/build_castle_oracle.py` invokes original `damageCastle(undefined, damage)`
after genuine Sheriff initialization. Seventeen scenarios cover full/low HP,
Defender success/failure, Insurance alone and before a blocked hit, Last Hope
success/gate failure/empty ally/low HP/already-active rampage, combined skills,
protection before skills, protection expiry/fade end, and medal absorption
truncation/minimum damage. Three cases invoke an original frame before the hit.
The damage, frame, absorption, rampage and shake bodies are preserved; only RNG
wrapping and defense-sound observation are added. All 3491 tags and non-code
payloads remain preserved, with only DoABC 2782 changed.

Two Ruffle runs produced identical **17-snapshot traces**. Production
`Simulation.damageCastle` and protection advancement through normal `tick`
matched all 17 on the first comparison. Inputs are explicit skill levels,
HP/money/protection state and seeds; expected results come solely from the
original. Comparisons include HP, money and totalMoney, skill effect values,
protection counter/blue fade before and after the hit, rampage, defense events,
every random value, draw count and final state.

The source audit exposed missing random consumption in the previous HP-only
castle-damage implementation; integration was corrected before this capture was
compared. The original spends two or three draws even with no relevant skills.
Protection blocks before Insurance and consumes zero draws. Insurance pays
before Defender, whose successful cancellation consumes one draw. Last Hope
can choose a nonexistent ally, and its HP check is reversed relative to its
description: level 1 activated at 37/40 HP but not 3/40 HP. A successful activation
consumes five draws, including two in `shake()` before Fury-adjusted rampage is
set to 339. The same `rampageOn` source dependency also applies those two shake
draws to ordinary critical-kill rampage, though this fixture triggers it only
through Last Hope. Protection counter 1 becomes −1 before the tested hit and
allows damage; −99 completes the visual fade at counter/blue zero.

The boundary is solo Sheriff with five ally positions and only the hero present.
Guardian/attacker callbacks, sandbags, subsequent shake frames, rendered/audio
effects, native Flash scheduler ordering, enemy attack timelines and defeat/town
transitions are outside it. Sandbag is explicitly zero; absorbFix tests use
0/.01/.04. Initial HP can become negative after a hit; defeat is a later timer
transition and is not invented by the diagnostic.

- Accepted diagnostic SWF SHA-256: `227cad13133c31a7e753a740a9983dfda596b6ba1864e83ff21c89c1cd44a700`.
- Accepted trace SHA-256: `72c9aa59822465b0b744161bc220210b4313740a679db318111e3dac364b718d`.
- Accepted fixture: `web/tests/fixtures/original-castle-trace.json`.

Regenerate with `python tools/build_castle_oracle.py`, capture `?suite=castle`,
then run `npm.cmd run test:castle-reference` from `web/`. The focused regression
is `node --experimental-strip-types --test tests/castle-reference.test.ts`.

## Projectile launch, flight and impact

`tools/build_projectile_oracle.py` captures original `shoot`/`useItem`, the seven
`bullet_*` implementations, and their original `procHit`/explosion callbacks.
The diagnostic preserves the method bodies, with reversible aim, RNG and
observation seams. It invokes each original first-frame initializer once when
native initialization has not yet run. All 3491 tags, their order, frame header
and non-code payloads remain unchanged; only DoABC 2782 changes. No original SWF
or application ActionScript is rewritten by this tool.

Two Ruffle runs produced identical **17-snapshot traces**: one native birth
probe, 14 ordinary scenarios, and two exact-vertical diagnostics. The 14 ordinary
scenarios match production launch, flight and damage over **650 manually
advanced steps**. They cover hand and launcher grenades, rockets, crossbows,
bows, Wind Bow's shared-target fan, Repeating Crossbow, shrinking crossbow
removal, gravity and flame pulses, a sky shot, overlapping living targets and a
corpse, weapon switching during flight, and repeated penetration hits on one
enemy. The two vertical diagnostics add two original callback observations but
are deliberately excluded from parity comparisons.

The adapter invokes actual `Simulation.fireAt`/`useSlot`, `advanceProjectile`,
and production hit/explosion methods. It compares launch ammo/reload/bow-draw
state, every actor step and callback, all item fields, enemy/player state, every
random value, draw count and final RNG state. Original vector membership is
supplied to the damage comparator; the trajectory and callback coordinates are
computed independently by the port. Consequently this is a damage/trajectory
proof at those source hit predicates, not another proof of pixel or vector
collision contours. Numerical tolerances are 1e-9 for gameplay values and 1e-7
for visual transforms, with rotation compared modulo 360. Expected data is the
unchanged browser trace.

The capture corrected several concrete assumptions. Flash truncates x/y to
twips on **each assignment**, including intermediate shadow assignments; it
truncates alpha to increments of 1/256 and normalizes rotation. The native
launcher-grenade probe initializes on logical frame 1 and first advances on
frame 2. A production input regression now checks that timing and the first
observed displacement through ordinary `Simulation.tick`. The final comparison
also exposed a missing Crow death frame: the source begins its dead sequence at
58. Source-derived runtime corrections resolved these discrepancies; the
earlier failed comparison remains in
`.build/oracle/projectiles-comparison-before.json`.

Observed branches include two shake draws for each grenade/rocket explosion,
four shared launch-spread draws for all three Wind Bow arrows, SENSE draws for
corpse intersections, and three successive damage hits on the same sheep from
one penetrating arrow. Switching to the shotgun during a bolt's flight still
uses the launch slot for damage effects, while the kill increases shotgun
experience. Gravity and flame both execute a final pulse after removal is
requested in their callback. These behaviors are guarded by fixture coverage
assertions. Negative controls demonstrate that the comparator rejects changed
trajectory coordinates, random values and birth ordering.

Both original exact-vertical launches divide by zero. The captured computed
trajectory is NaN while the Flash display setter exposes child y=0; the original
grenade therefore explodes at the wrong location. An epsilon offset initially
made the port finite but still produced badly displaced impacts after twip
truncation. The integrated correction uses explicit vertical distance progress
and preserves the requested x. The two diagnostic regressions require finite
flight, bounded completion, and one grenade/rocket explosion exactly at the
requested point. This intentional correction is distinct from the user's
reported late-game hitbox problem, which this fixture does not reproduce.

The boundary excludes moving enemy AI, native callback interleaving after the
birth probe, child timeline animation/audio, repeated input scheduling and whole
battle execution. Original child `currentFrame`/`mcX` are recorded but excluded
from numerical comparison; the port's `frame` is actor age. Ordinary cases freeze
enemy motion and use manual callbacks. The native ordering observation applies
to the separately captured launcher grenade. Initial target placement was
adjusted using original callback coordinates so the named bow-hit branches were
actually exercised; the initial capture is retained as
`.build/oracle/projectiles-browser-report-before-target-adjustment.json`.

- Accepted diagnostic SWF SHA-256: `057c803ceab7ec45e20a66399d7e88864cca9a02dc56add9dc548e6b1f94ea72`.
- Accepted trace SHA-256: `7b7309ffbf0673df71b51ea8db8dc4876352a960066c43dbebade6bd5338a32b`.
- Accepted fixture: `web/tests/fixtures/original-projectile-trace.json`.
- Runtime capture: `.build/oracle/projectiles-browser-report.json`, dated `2026-11-01T22:32:59.038Z`.

Regenerate with `python tools/build_projectile_oracle.py`, capture
`?suite=projectiles`, then run `npm.cmd run test:projectile-reference` from `web/`.
The focused regression is
`node --experimental-strip-types --test tests/projectile-reference.test.ts`;
all three tests pass. The browser report, build report and accepted fixture have
separate roles: compilation/resource preservation, actual runtime observation,
and repeatable offline regression are not treated as interchangeable evidence.

## Town Upgrade and MOD transactions

`tools/build_modification_oracle.py` runs the original Shop Upgrade action,
`invDrag`, `showDialog`, `endDialog`, `upgradeWeapon` and `enchant` after genuine
Sheriff initialization. A reversible mouse-coordinate seam selects a hittable
point on the original Upgrade action; the inventory point-query seam supplies
an actual original slot child. Original slot eligibility, item/dialog logic,
prices and random calls remain intact. The diagnostic creates the shop display
without running the full frame71 preparation. All 3491 tags and non-code
payloads are preserved; only DoABC 2782 changes.

Two Ruffle runs produced identical **104-snapshot traces** across 12 upgrade and
13 MOD scenarios. Production transactions match **88 of 88 compared snapshots**.
Of these, 84 compare the complete reference item as well as every owned/shop
item field, gold, earned-money total, AP, pending dialog type, price, every RNG
draw and final RNG state. Four rows intentionally postpone reference-item
equality until the independently captured corrective intervention described
below. Sixteen other observations preserve the unmodified original defect and
are checked as source evidence rather than advertised as port parity.

The original `upgradeWeapon` parser loses the last installed modifier. A single
modifier disappears entirely; with several, only the preceding entries are
reapplied. A final Living Weapon modifier loses both its effect and remaining
progress. Four raw source cases reproduce this through preview and confirmation.
Four parallel cases preserve the raw preview, then invoke **original `enchant`**
for the omitted final modifier and restore the original Living Weapon countdown
when applicable. This intervention is explicitly labeled in the trace and does
not alter the original method body. Production retains all modifiers and is
compared against that independently computed item, not against an expectation
generated by the port. The source dialog's popup is not refreshed by the
intervention; the numerical corrected item is the reference at this boundary.
Living Weapon progress 17 survives in both retained positions after correction.

Other observed behavior is preserved. Upgrade requires 4 AP to enter its mode,
only permits owned guns, and creates its preview immediately. Preview generation
spends two or three RNG draws even if the user cancels or lacks gold. Cancel
retains both the preview and advanced RNG; reopening spends new draws. Its
current price is `int(source.value * 1.2) + 500`, with no extra random call.
Confirmation pays once, spends 4 AP and swaps the old gun into reference slot 49.
The preview's randomly generated capacity affects its value before the source
capacity is restored; tests retain that ordering.

Known-level MOD mounting spends no AP, gold or RNG. Source confirmation checks
capacity, Ammo/Reloading compatibility, manual reload for Auto Reload, and an
already-living weapon. Repeated modifiers retain original diminishing effects;
a lower-level repeated Auto Reload overwrites its level. Successful mounting
refills ammo and consumes the MOD by setting `num=0`, preserving its remaining
metadata. Rejecting confirmation leaves both items intact. Choosing No for an
owned MOD dropped onto an owned gun **swaps the two items**, whereas stock MODs
cannot be dropped onto occupied guns: original `updateInvSlots` dims the target
before `invDrag` reaches payment. The original emits duplicate identical error
messages for Ammo/Reloading on a bow; the comparator preserves those source
calls but compares the common failure category rather than requiring duplicate
browser popups.

Ordinary cases start with full ammo and zero reload progress, as town entry
provides. One explicitly controlled metadata case starts with partial ammo and
reloadTime 3; original `enchant` refills ammo while retaining that timer. This
case establishes the method behavior for accepted imported metadata, not a claim
that normal town entry leaves guns reloading. Two production comparisons
override only ItemFactory's engineer/recycling-medal context to check the
captured bonus calculation; ordinary party acquisition of those bonuses remains
outside this fixture.

The first runtime capture used nonzero reload progress in every case. It is
preserved in `.build/oracle/modifications-browser-report-before-town-context.json`
and was replaced before fixture acceptance by the explicit ordinary/controlled
boundary above. The accepted comparison passed on its first run. Three focused
regressions verify source branch coverage and show that changing a corrected
preview, MOD cancellation outcome or random value causes comparison failure.
Full frame71 generation, ally equipment, pointer geometry, animated dialogs and
sounds are not covered. UI pickup/equip-mode bookkeeping remains original
evidence; production transactions start when an item or MOD/gun pair is chosen.

- Accepted diagnostic SWF SHA-256: `c1e013952b53b9e0686a592cf9de6f6b28ae3e00f7b214241e0736f0e499794a`.
- Accepted trace SHA-256: `7b2c5cf07d8b0290aa62dd4149b2c7690334483ca2f47f7f18054a9e4e5f3ce7`.
- Accepted fixture: `web/tests/fixtures/original-modification-trace.json`.
- Runtime capture: `.build/oracle/modifications-browser-report.json`, dated `2026-11-01T22:54:51.150Z`.

Regenerate with `python tools/build_modification_oracle.py`, capture
`?suite=modifications`, then run `npm.cmd run test:modification-reference` from
`web/`. The focused regression is
`node --experimental-strip-types --test tests/modification-reference.test.ts`.

## Third-day mission and wave generation

`tools/build_third_day_wave_oracle.py` calls original `generateMission(2)` on
calendar day 2, then original `preGenerateWave()` on calendar day 3. The prepared
mission retains its Sheep statue guarantee; it is not regenerated after Rest.
Two identical Ruffle runs captured five cases: seeds 42, 1 and 3735928559, plus
explicit constant-zero and constant-0.99 random inputs. All five match the
production generators on the first comparison, including every mission field,
enemy ID, fractional delay, group count, RNG draw count and final RNG state.
All 3491 tags and non-code payloads remain preserved, with only DoABC 2782 changed.

Source selection observations prove six groups per wave with budget percentages
`15, 15, 20, 20, 15, 15` and flags `BATCH, any, BATCH, any, any, BATCH`. The two
additional groups begin at mission level 2. The first three seeded cases spend
246/243/244 draws and generate 52/51/52 enemies. Constant-zero spends 229 draws
and generates 47; constant-0.99 spends 233 and generates 41. These counts include
the two mission-preparation draws.

The boundary inputs matter: zero-valued source randomness selects **Archer ID 2**
in the fourth group, despite its absence from the three ordinary seeded cases.
The high-input case selects **Chicken ID 19 at requested level 0** through the
fallback, which deliberately does not repeat the usual level/flag exclusions.
Both observations are now regression assertions. The port uses the complete
20-entry original selection catalog in original order, including the Fly filter
draw before its level check. It does not substitute an implemented enemy when
an unsupported original ID is selected.

Mission preparation now includes level 3/calendar day 3: power 1160, reward 660,
spawn rate 14.4, and the Shop Token guarantee after the optional Ragnarok roll.
That next mission is prepared but its fourth-day battle remains unsupported.
Mission level 3 enables BATCH1 waves and the boss's first shield behavior;
mission level 4 additionally enables AIR waves, another fallback roll and Fly
selection. These are concrete next dependencies, not permission to reuse the
third-day behavior indefinitely. The first Boss Day is mission level 9.

The fixture is a synchronous generation comparison. Constant streams are legal
input-boundary probes, not claims that the seeded production RNG naturally
produces those sequences. Rest, town preparation, Archer behavior, rendering and
whole-battle scheduling have separate checks. Existing first/second-day fixtures
remain unchanged. Two new regressions check the accepted trace and reject changed
delays, omitted rare enemies and altered random consumption.

- Accepted diagnostic SWF SHA-256: `15cecb3af39db52b6ae5da0784c6e3ef4cd71c5bb111411a9bc43da355f9f80c`.
- Accepted trace SHA-256: `753c428914dd20c5fdfb1f1931943886ffe228c64ea0a71707461238a656589a`.
- Accepted fixture: `web/tests/fixtures/original-third-day-wave-trace.json`.

Regenerate with `python tools/build_third_day_wave_oracle.py`, capture
`?suite=third-day-waves`, then run `npm.cmd run test:third-day-wave-reference`
from `web/`. The focused regression is
`node --experimental-strip-types --test tests/third-day-wave-reference.test.ts`.

## Third-town preparation

`tools/build_third_town_oracle.py` extracts the same original frame71 preparation
block as the first/second-town fixtures and executes it on calendar day 3. Two
identical Ruffle runs captured six cases: seeds 42, 1 and 3735928559, each with
medal60 absent/present, retained ordinary offer metadata, prior Militia slots
45/47/48 and an existing search value. All six match production shop, cards,
mission, recruit, flags, search state, save-boundary RNG and final RNG exactly.
The prepared mission contains Shop Token 1035 instead of a statue, after the
optional Ragnarok roll. The recruiter still produces level1 candidates.

The source preparation statements are preserved, except actual save I/O is
replaced by an RNG observation. All 3491 resource tags and non-code payloads are
preserved; only DoABC2782 changes. Existing first/second-town fixtures are unchanged.
The accepted reference test verifies the trace hash. Three additional focused
checks cover wrong-calendar/statue rejection, retained metadata without input
mutation, and the largest Day3 recruit level roll.

This boundary uses default castle upgrades, the solo Sheriff party and only the
reachable absorption medal. It does not cover town interactions or Day4 combat.
Town4 requires the source MOD-sale overwrite and potentially level2 recruits;
those branches have a separate fourth-town comparison below.

- Accepted diagnostic SWF SHA-256: `e9ea5b163839b742a4de75e44f57dc2612ee65f88a97f84f511cb2b00f727052`.
- Accepted trace SHA-256: `d0ee4e7c2c90099e16c70554a579014241658ab717ad32da34774e3686b37155`.
- Accepted fixture: `web/tests/fixtures/original-third-town-trace.json`.
- Runtime capture: `.build/oracle/third-town-browser-report.json`, dated `2026-11-01T23:13:31.127Z`.

Regenerate with `python tools/build_third_town_oracle.py`, capture
`?suite=third-town`, then run `npm.cmd run test:third-town-reference` from `web/`.
Focused checks: `node --experimental-strip-types --test tests/third-town.test.ts tests/third-town-reference.test.ts`.

## Archer AI, arrows and collision samples

`tools/build_archer_oracle.py` calls the actual original Archer spawn and AI,
then explicitly advances its child frame and previously existing arrows. Two
identical Ruffle runs captured five scenarios: opening counter, repeated ranged
attacks, knockback interruption, left-edge knockback and death. All **517 state
observations** (five initial states plus 512 steps) match production, including
display widths, frames/flags/counter, motion, rewards, castle HP, every arrow,
RNG draw count and final RNG state. Six original 64×64 filled-contour grids match
all **24,576 points**. All 3491 tags and non-code payloads remain preserved;
only DoABC2782 changes.

The first strict comparison matched239/517 and is retained in
`.build/oracle/archer-comparison-before.json`. It identified frame1 fallback for
the missing `stand` label, per-assignment twip rounding and changing display-width
knockback clamps, and unnecessary arrow-rotation modulo rounding. The actual
source emitted no exceptions; the corrected comparison contains no exemptions
or intentional behavior changes. Widths are independently derived from original
shape bounds/placement matrices and checked against every captured width.

The accepted three-test regression checks trace provenance and full comparison,
the observed release/fallback/clamp/death edges, and a deliberately wrong arrow
step. This is a controlled manual scheduling boundary, **not native timeline
scheduling** or whole-battle/pause/rendering parity. Finite contour grids do not
establish late-game hitbox correctness. See
`web/docs/archer-source.md` for source mapping and scope.

- Accepted diagnostic SWF SHA-256: `5b7907f3529e19970a9a12e7e80998089c248dda93ee4d57d3d0656450b3054a`.
- Accepted trace SHA-256: `6ed7077e2b8afdc618ea48091905c64c0f9fa44b27d2cb712104fa0276d6fb58`.
- Accepted fixture: `web/tests/fixtures/original-archer-trace.json`.
- Runtime capture: `.build/oracle/archer-browser-report.json`, dated `2026-11-01T23:13:29.594Z`.

Regenerate with `python tools/build_archer_oracle.py`, capture `?suite=archer`,
then run `npm.cmd run test:archer-reference` from `web/`. Focused tests:
`node --experimental-strip-types --test tests/archer-reference.test.ts`.

## Fourth-day waves and the BATCH1 threshold

`tools/build_fourth_day_wave_oracle.py` preserves the original generation methods
and observes `generateMission(3)` on calendar day 3 followed by `preGenerateWave()`
on calendar day 4. Two identical Ruffle runs captured seven cases. All seven match
the production generators exactly on first comparison: every enemy and delay,
mission state/loot, group counts, RNG draw count and final RNG state.

Seeds 42, 1 and 3735928559 consume 238, 229 and 239 draws and generate 54, 64 and 53 enemies.
Seed 1 takes BATCH1 in its first wave and ordinary groups in the other four;
all three seeded cases contain Archer, Crow, Chicken, Rat, Sheep and Boss.
Explicit constant inputs 0 and 0.099999 take BATCH1 in all five waves; 0.1 and 0.99
take ordinary waves. The captured first selector starts after six versus eight
draws, proving the source skips the RANGED/BATCH2 condition draws on BATCH1.
These constants are legal diagnostic RNG inputs, not claims about production
seed frequency. The prepared mission retains calendar day 3's Shop Token 1035.

All 3491 tags and non-code payloads are preserved; only DoABC 2782 changes.
The accepted fixture retains original branch/selection observations. Two focused
tests verify provenance, the real seeded branch and strict threshold, and reject
changed draw counts, RNG states, rare enemies and delays. Earlier Day1–3 wave
fixtures remain unchanged. This boundary does not establish enemy AI, boss shield,
native scheduling or whole-battle parity. Mission 4/calendar day 4 preparation is
enabled separately with Archer statue 1102; fifth-day waves remain unsupported.

- Accepted diagnostic SWF SHA-256: `6c9331c90896523c9875448fa19b974ec75da86c611369f9cc7daf072541b1eb`.
- Accepted trace SHA-256: `2ad4fe00fe9058d1d1c25cfd1fb81fad1fb37b27d312ab3d6ff45280081ba2e4`.
- Accepted fixture: `web/tests/fixtures/original-fourth-day-wave-trace.json`.
- Runtime capture: `.build/oracle/fourth-day-waves-browser-report.json`, dated `2026-11-01T23:30:39.201Z`.

Regenerate with `python tools/build_fourth_day_wave_oracle.py`, capture
`?suite=fourth-day-waves`, then run `npm.cmd run test:fourth-day-wave-reference`
from `web/`. Focused tests: `node --experimental-strip-types --test tests/fourth-day-wave-reference.test.ts tests/missions.test.ts`.

## Fourth-town MOD sale and recruit growth

`tools/build_fourth_town_oracle.py` runs the original frame71 preparation block
on calendar day 4. Two identical Ruffle runs captured **16 observations**: six
complete towns (seeds 42/1/3735928559 with no medals or both medals 60/61), plus
ten controlled calls to original `generateRecruit`. All 16 match production on
their first comparison, including every recorded item/recruit/mission field,
retained slot metadata, source save-boundary RNG and final RNG state.

The town cases preserve the full `generateShop` order (MainTimeline:5246): normal
stock first, the guaranteed gun replacement, two MOD-sale replacements, then
`generateStuff(8)` and `setMod(10)` for the guaranteed Auto Reload Mod Lv.1. The
discarded stock and random MOD still consume their original draws. Normal mode
resets `specialSale` to 0 after generating these offers. Mission preparation uses
calendar 4's Archer statue 1102 after the optional Ragnarok roll, with absorption
0 or 0.02 according to the fixture medals. The existing search value is retained.

Recruit probes run all nine original classes at level 2, with one additional
Sheriff case reversing the hidden-growth outcomes. A documented twelve-value
random prefix controls level, class and growth inputs while the underlying
xorshift stream still advances on every call. These are input-boundary probes,
not claims about naturally occurring seeded recruitment. Original
`generatePlayer` at 2075 invokes `levelUp(false)` at 10480 before nextTrait,
portrait and items: class rank becomes 2, two growth draws affect hidden
aiming/teamwork, SP1 remains unspent, and cost becomes 450. No skill-choice method
is invoked. Old Militia slots 47/48 remain intact when the next class does not
overwrite them.

All 3491 resource tags/non-code payloads are preserved; only DoABC2782 changes.
First/second/third-town accepted fixtures remain unchanged. Five focused tests
cover the accepted trace/hash, an extra-draw negative control, MOD-sale/calendar
behavior, all-class growth order, and valid/invalid grown-recruit saves.

This boundary assumes the current solo/default-castle setup. Hiring, other town
actions, native menu interaction and Day5 combat remain outside this fixture.
The Day4 active battle keeps its historical absorption; the newly earned fourth
perfect-day medal affects the next prepared mission, checked separately by the
integrated Day4 save tests. See `web/docs/fourth-town-source.md` for the source map.

- Accepted diagnostic SWF SHA-256: `e6ebdbce8fef70797598da6799ef18ebd2a5607ce93ef1d81ad8b2138d1fd9d9`.
- Accepted trace SHA-256: `6be479171ce4dbc85e5784d0b55108c02e1a43d2902cc49ddb11a5bf45dadb00`.
- Accepted fixture: `web/tests/fixtures/original-fourth-town-trace.json`.
- Runtime capture: `.build/oracle/fourth-town-browser-report.json`, dated `2026-11-01T23:30:33.794Z`.

Regenerate with `python tools/build_fourth_town_oracle.py`, capture
`?suite=fourth-town`, then run `npm.cmd run test:fourth-town-reference` from `web/`.
Focused checks: `node --experimental-strip-types --test tests/fourth-town.test.ts tests/fourth-town-reference.test.ts`.

## Fifth-town ordinary stock and level-three recruits

`tools/build_fifth_town_oracle.py` preserves the original frame71 preparation
block on calendar day 5. Two identical Ruffle runs captured **17 observations**:
six full towns (seeds 42/1/3735928559 with no medals or medals 60/61), plus eleven
controlled `generateRecruit` probes. All 17 match production on their first
comparison, including complete item/recruit/mission fields, retained metadata,
cards, flags, search value, save-boundary RNG and final RNG state.

The full-town seeds produce level 2/2/3 candidates and consume 244/112/204 draws
respectively, with the same counts in both medal configurations. Day5 returns
to ordinary stock after Day4's MOD sale. Its prepared mission adds Holy Grail
1037 after the optional Ragnarok roll; Day5's active battle retains its earlier
Archer statue mission. Default normal taxes/title income remain 0 through Day5,
and current default upkeep remains 40.

Recruit probes cover all nine classes at level 3, one reversed hidden-growth
case and the level 2 minimum. Controlled prefixes advance the underlying RNG
on every call. They prove one/two original `levelUp(false)` steps occur before
nextTrait, portrait and equipment, leaving SP1/2 and costs450/500 with class
rank matching level. Hidden traits can reach 12; prior Militia slots remain
unless overwritten. These are explicit diagnostic inputs, not claims about
the frequency of a seeded campaign's recruits.

All 3491 tags and non-code payloads are preserved; only DoABC2782 changes.
Earlier town fixtures remain unchanged. Five focused tests cover provenance and
comparison, an extra-draw negative control, ordinary-stock/calendar behavior,
all-class growth and calendar-dependent save validation. The fixture assumes
the solo/default-castle scope and does not cover native town interaction,
hiring or Day6 combat. See `web/docs/fifth-town-source.md` for the source map.

- Accepted diagnostic SWF SHA-256: `8cea1f726e41cb74f33b11e7803aac566122d5d1e45c9019942251f2dba7989f`.
- Accepted trace SHA-256: `d0637440d53ac962a24e219ec5b8fb7424dd34d2f46dcb8297816b447c72e2bb`.
- Accepted fixture: `web/tests/fixtures/original-fifth-town-trace.json`.
- Runtime capture: `.build/oracle/fifth-town-browser-report.json`, dated `2026-11-01T23:53:24.404Z`.

Regenerate with `python tools/build_fifth_town_oracle.py`, capture `?suite=fifth-town`,
then run `npm.cmd run test:fifth-town-reference` from `web/`. Focused checks:
`node --experimental-strip-types --test tests/fifth-town.test.ts tests/fifth-town-reference.test.ts`.

## Fifth-day AIR waves and Fly selection

`tools/build_fifth_day_wave_oracle.py` observes the unchanged original
`generateMission(4)` on calendar day 4 followed by `preGenerateWave()` on day 5.
Two identical Ruffle runs captured nine cases; all nine match the production
mission/wave generators exactly on first comparison. The comparison includes
every enemy and delay, group counts, mission/loot state, RNG draw count and final
RNG state. Mission preparation retains Archer statue 1102 from calendar day 4.

Four seeded cases use 42, 1, 3735928559 and 2. Seed 2 produces 14 Flies through
ordinary selection; seed 1 reaches BATCH1 naturally. Constant inputs 0 and
0.099999 exercise AIR in all five waves, while 0.1 and 0.99 take the ordinary
path. A separately labeled prefix `[0.5,0.5,0.5,0]` followed by constant zero
exercises BATCH1 first, then AIR, with Fly present in both branches. The first
selector starts after 5, 6 or 8 draws for AIR, BATCH1 or ordinary waves. These
controlled inputs are legal diagnostic RNG sequences, not production-frequency
claims. The source also proves AIR fallback can select a ground enemy and that
fixed level 4 adds the third fallback draw, including the final Rat overwrite.

The accepted cases consume 225, 217, 245, 260, 237, 237, 259, 257 and 230 draws
and generate 62, 71, 59, 71, 80, 80, 82, 65 and 89 enemies respectively. All
3491 tags and non-code payloads are preserved; only DoABC 2782 changes. The first
eight-case capture was retained under `fifth-day-waves-before-seed2-*`; it was
expanded before acceptance because the usual three seeds did not select Fly.
Earlier Day1–4 fixtures remain unchanged.

Two focused reference tests verify provenance and the observed branches, and
reject removed Fly, changed spawn delays and omitted fallback RNG. This boundary
does not establish Fly lifecycle, collision, native scheduling or whole-battle
parity. Fifth-town mission 5 preparation is available separately; sixth-day
combat remains unsupported.

- Accepted diagnostic SWF SHA-256: `53cb6eeee5397f98697478c6dd970659fc444538b41c86cbeb9b4b720ff8f78f`.
- Accepted trace SHA-256: `eb6444578107846ce26478be4d4d32cb428e7d164d1b43426d1a31ce495555f0`.
- Accepted fixture: `web/tests/fixtures/original-fifth-day-wave-trace.json`.
- Runtime capture: `.build/oracle/fifth-day-waves-browser-report.json`, dated `2026-11-01T23:55:30.544Z`.

Regenerate with `python tools/build_fifth_day_wave_oracle.py`, capture
`?suite=fifth-day-waves`, then run `npm.cmd run test:fifth-day-wave-reference`
from `web/`. Focused checks:
`node --experimental-strip-types --test tests/fifth-day-wave-reference.test.ts tests/missions.test.ts`.

## Fly lifecycle, distant shadow and explicit pooled-state correction

`tools/build_fly_oracle.py` executes original Fly initialization and AI followed
by an explicit child-frame step. Read-only observers retain the original
play/stop decisions; native display scheduling is not asserted. Two identical
Ruffle 0.7.1 runs captured **576 state snapshots in 13 scenarios** and **eight
64×160 geometry grids**. The production comparator matches **503/503** fresh
or explicitly reset states, including exact RNG/draw counts, and **8/8 grids
over 81,920 world points** for both whole-body and shadow-excluded predicates.
The remaining **73 raw reused-object observations** are deliberately retained
as defect evidence rather than claimed as port parity.

Original Fly initialization does not reset the object's `dirCounter` or
`resKnock`. A reused Fly retains counter 45 after the controlled prior flight;
objects formerly used by Sheep, Rat or Boss retain resistance 0.9/1.1/0.
Separate original runs set only `dirCounter=0; resKnock=1` before the original
Fly initialization. Paired cases retain identical prior observations and reset
to the same spawn RNG; the changed fields are explicit. Production creates
fresh Fly state with counter 0/resistance 1. This intentional correction removes
the observed pool-state leak without adding an object pool or deriving expected
values from the port. It does not reproduce the veteran late-game hitbox report.

Symbol 952's shadow lies about 104 pixels below the living body, so the grids
cover the full body/shadow extent at actor `(200,220)`, world origin `(168,196)`.
Frames 1/3/8/12/15/22/23/41 are sampled. Death probes enter 12→15→23 before later
frames, preserving source shadow history: frame 22 excludes the shadow, frame 23
enables it, and frame 41 stops. The corpse is still attached at death update 199;
update 200 produces the original removed state, frame 126/HP −1/counter 201. The
original atlas contains 126 frames/23 unique images with a 21×122 frame rectangle
and `(9.6,7.65)` registration. See `web/docs/fly-source.md` for source anchors,
the full state boundary and extraction commands.

The first comparison matched 207/503 states. It found 296 width differences,
16 consequent left-clamp differences and one JavaScript negative-zero result.
Original measured widths 14.25/16.75/16.65 correspond to nearest-twip transformed
shape bounds, where the earlier truncation produced 14.2/16.7/16.6. The generator
now rounds Fly bounds only; the accepted Archer table remains unchanged.
Actual display-coordinate assignments still truncate to integer twips and now
canonicalize zero to positive 0 at that boundary. No comparison tolerance or
signed-zero exemption was added. Before evidence is preserved in
`.build/oracle/fly-before-width-rounding/`; the final comparison has no source
errors. Four tests cover the accepted trace, pool distinction, lifecycle
boundaries and a deliberate hover-counter regression.

All 3491 tags, non-code payloads, order and frame header are preserved; only
DoABC 2782 changes, with a version 10 diagnostic header. Original baselines and
earlier fixtures remain unchanged. The builder's `runtime_validated:false`
means compilation alone is insufficient; actual execution is recorded in the
separate repeatable browser report.

- Original SWF SHA-256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Accepted diagnostic SWF SHA-256: `89246db4326950b6b55f5614c31b23b6b1ca5ee4b16c560d572a718e3c5041b9`.
- Accepted trace SHA-256: `f613f617ed93c955f94b0059092cac7918f6adcf66f47c845464ca8a8ab00a08`.
- Accepted fixture: `web/tests/fixtures/original-fly-trace.json`.
- Runtime capture: `.build/oracle/fly-browser-report.json`, dated `2026-11-01T23:53:18.988Z`.
- Detailed comparison: `.build/oracle/fly-comparison-report.json`.

Regenerate with `python tools/build_fly_oracle.py`, capture `?suite=fly`, then
run `npm.cmd run test:fly-reference` from `web/`. Focused checks:
`node --experimental-strip-types --test tests/fly-reference.test.ts`.
Integer grids and explicit AI→child stepping do not establish all fractional
transforms, rendered pixels/audio, native scheduling or whole-battle parity.

## Sixth-town preparation, tax and Claim Title

`tools/build_sixth_town_oracle.py` retains the original preparation statement
order and unchanged `generateRecruit`, `calcTax`, `calcUnkeep`, `renewResult`,
`newTitle`, `showEventDialog` and `procEventDialog` bodies. The established
diagnostic startup skips only the intro; actual Sheriff initialization still
precedes the controlled cases. The `frame71` save call is replaced by an RNG
observation, as in the earlier town fixtures.

Two identical Ruffle 0.7.1 runs captured **22 observations**: six full Day 6 towns,
two recruit rolls around the 5/9 level threshold, six Day6 normal/perfect
settlements, two controlled Day 7 salary settlements, and six title
eligibility/claim/acknowledgment/rejection states. All **22/22** match production,
including item metadata, recruit fields, RNG counts/state, money and AP. Full
town seeds 42/1/3735928559 consume 94/112/204 draws and yield recruit levels 2/2/3.
Calendar day 6 prepares Crow Statue 1106; previous shared item and recruit slots remain
observable. Earlier fixtures are unchanged.

The source confirms tax 10 plus upkeep 40 on Day 6, net rewards 650/860, and three
settlement draws. Claim Title spends 4 AP, grants Honorary Citizen/salary 100 and
adds no immediate money or RNG draws. The original UI's `newTitle(0)` condition
guards repeat claims. The observed event title is `New Title!`, card3; closing
it changes no game values. Day 7 salary probes yield net 735/951, including tax 45.
Those probes call settlement only: they do not enable or verify Day 7 combat or
town generation. The port stores one title field and derives original
`titleMoney`; browser dialog rendering remains separate evidence. See
[the bounded source map](../web/docs/sixth-town-source.md).

All 3491 tags, non-code payloads, tag order and frame header are preserved; only
DoABC 2782 changes, with the diagnostic version 10 header. Four focused tests
include an extra-RNG negative control and recruit/save boundary checks.

- Original SWF SHA-256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Diagnostic SWF SHA-256: `c16b2cc781301bd5e8c8454521e0d981e5a1daa192a08c1cf670462dfec79201`.
- Canonical trace SHA-256: `f15e87bc77e3192311f02a90be509fcb39947801d56331e4b283d4b4c8fd2e25`.
- Accepted fixture: `web/tests/fixtures/original-sixth-town-trace.json`.
- Runtime capture: `.build/oracle/sixth-town-browser-report.json`, dated `2026-11-02T00:13:57.784Z`.
- Comparison: `.build/oracle/sixth-town-comparison-report.json`.

Regenerate with `python tools/build_sixth_town_oracle.py`, capture
`?suite=sixth-town` twice, then run `npm.cmd run test:sixth-town-reference` from
`web/`. Focused checks:
`node --experimental-strip-types --test tests/sixth-town.test.ts tests/sixth-town-reference.test.ts`.

## Seventh-town preparation and level-four recruits

Two identical Ruffle 0.7.1 runs of `build_seventh_town_oracle.py` captured
**38 observations**, matching production **38/38**. The boundary contains six
full towns, all nine recruit classes at level 4, reversed Sheriff growth,
four probes around 10/21 and 20/21, twelve Day 7 settlement cases and six
title states. Controlled prefixes still advance the underlying RNG. The
original generation/economy methods are unchanged; the extracted `frame71`
save call remains an observation of the source save boundary.

The source confirms three growth steps, SP 3, cost 550 and hidden-growth maximum
13 for level-four candidates. Shared offer and Militia slot metadata survive.
Calendar day 7 has no guaranteed loot, while medals 60/61/62 produce 0.03
absorption in the newly prepared mission. Day 7 settlement deducts tax 45 plus
upkeep 40, applies salary 100 only for an existing title, and spends three RNG
draws. Unclaimed first titles remain available; inherited title 1 cannot be
claimed again. Title actions consume no RNG or immediate money. Full-town
seeds 42/1/3735928559 consume 94/112/204 draws. Five focused tests include
source provenance, both recruit thresholds and an extra-draw negative control.
Earlier town fixtures remain unchanged. See
[the seventh-town source map](../web/docs/seventh-town-source.md).

All 3491 tags and non-code resources are preserved; only DoABC 2782 changes
under the diagnostic version 10 header. This boundary does not establish
Day 8 combat, native town rendering or whole-campaign scheduling.

- Diagnostic SWF SHA-256: `c1b408a6bb287eb9fc611339246c08dceab432e39ee722271133300247257b2c`.
- Canonical trace SHA-256: `39dabd5c3cb8516c274afabccdd05f1ab0400e0324d4aa066070b93b212a8806`.
- Accepted fixture: `web/tests/fixtures/original-seventh-town-trace.json`.
- Browser capture: `.build/oracle/seventh-town-browser-report.json`, dated `2026-11-02T00:42:13.324Z`.
- Comparison: `.build/oracle/seventh-town-comparison-report.json`.

Regenerate with `python tools/build_seventh_town_oracle.py`, capture
`?suite=seventh-town` twice, then run `npm.cmd run test:seventh-town-reference`
from `web/`. Focused tests:
`node --experimental-strip-types --test tests/seventh-town.test.ts tests/seventh-town-reference.test.ts`.
