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
ordinary `fireAt` now uses the same `processPellet` path tested by the comparator;
the temporary damage-only test adapter was removed. Accepted original records
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
completed both runs without rebuilding the SWF. Inactive-surface throttling is
the suspected cause, not an isolated causal finding. Keep the oracle surface
visible when capturing these browser-driven fixtures and treat a pre-oracle
startup timeout separately from a failed original-method assertion.

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

The accepted 18-case capture covers these requested frames at registration position (200, 220):

| Enemy | Original ID | Requested frames |
| --- | --- | --- |
| Sheep | 3 | 5, 32, 44, 107 |
| Rat | 17 | 14, 41, 93 |
| Chicken | 19 | 5, 37, 105, 208 |
| Crow | 6 | 3, 30, 46 |

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
- `complete`: `ok: true`, `snapshots: 18`, `sampledPoints: 73728`.
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

The captured original trace was accepted after both complete runs matched. Its
capture time is `2026-11-01T19:44:48.562Z`; the trace SHA-256 is
`f682b7ee1d364767d3063ff2ff7ed821bc95d3f297a745eff93249801c7b49f8`.
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

The result proves the sampled combined predicate at these 18 poses/positions.
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

Review also identified a source-supported state-history risk, not yet confirmed
by a runtime grid: sheep frame 32 sets `shadowHit = false`, while Sheriff
knockback returns the clip to the `alive` label at frame 5 without an apparent
restoring assignment. The port currently derives shadow exclusion from the
current frame alone. The fixture's fresh frame-5 sheep does not exercise the
32-to-5 transition, so its passing grid cannot establish that transition's shadow
behavior. A bounded original transition capture is the next informative check;
this frame-only assumption already existed in the former alpha-mask path.

The builder now includes one additional sheep case with `poseFrames: [32, 5]`,
making its pending suite 19 snapshots and 77,824 sampled points. That diagnostic
SWF compiled with resource preservation and SHA-256
`052ba65780b52e584bcf9a18ddb68ccc2378ec3436c11ffe103c6f451f69cae7`.
Browser attempts stalled during the intro without emitting oracle records;
bounded visibility and explicit background-execution experiments did not obtain
a transition observation. These are harness-startup failures, not geometry-test
failures. A failed attempt is preserved in
`.build/oracle/geometry-background-startup-failure.json`; the prior successful
SWF, build report, browser capture and exact comparison are archived under
`.build/oracle/geometry-before-sheep-transition/`.
The checked-in fixture and accepted production comparison therefore still have
18 cases. The 32-to-5 behavior remains unverified, and no persisted-shadow-state
change was made for this milestone. Do not substitute the compiled 19-case
builder's status for successful runtime capture or update fixture expectations
from a timeout. Reference-startup diagnosis can resume separately without
blocking the validated playable slice.

### Regenerating and comparing geometry

From the repository root, build the diagnostic SWF and start the local harness:

```powershell
python tools/build_geometry_oracle.py
python tools/serve_oracle.py --port 5176
```

Open `http://127.0.0.1:5176/?suite=geometry` in a visible browser and keep that
surface active until both runs finish. The harness saves the complete original
report to `.build/oracle/geometry-browser-report.json`. A compiler success alone
does not replace this capture. The current builder targets the pending 19-case
suite above. Retain the accepted fixture unless a new original
capture has been checked for provenance, successful completion and repeatability.

In another terminal, regenerate assets and run the production comparison:

```powershell
python tools/extract_web_assets.py
cd web
node --experimental-strip-types scripts/compare-geometry-reference.ts
node --experimental-strip-types --test tests/geometry-reference.test.ts
```

The main asset extractor includes contour generation and preserves the original
SWF hash. When `.build/reference/original.xml` already exists, the bounded
`python tools/extract_collision_geometry.py` command regenerates only the contour
asset. The comparator requires two identical successful original runs and writes
every mismatch, if any, to its report; any discrepancy makes it exit nonzero.
The ordinary regression test uses the checked-in original fixture and production
geometry asset, so it does not need a new browser capture or ignored build cache.
While the 19-case capture remains pending, the archived accepted comparison can
be rerun from `web/` with
`node --experimental-strip-types scripts/compare-geometry-reference.ts ../.build/oracle/geometry-before-sheep-transition/geometry-browser-report.json`.
The default report path currently belongs to the unsuccessful follow-up capture.

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
`randomStuff` and `generateLoot` methods after actual Sheriff initialization,
with a controlled xorshift32 stream. The boundary covers day 1, zero Engineer
and Looter, no recycle medal and normal weapon-level mode. Starting-item cases
include the original grenade → temporary bow → shotgun calls and overrides;
they exclude the preceding character-generation random draws.

The capture on 2026-11-01 used `@ruffle-rs/ruffle 0.7.1`. Both runtime runs were
identical: each contained ready, 139 snapshots and successful completion. All
139 snapshots matched on the first production comparison:

- 116 base-item cases: all 58 original IDs at seeds 42 and 3735928559.
- 15 random-item cases: modes 0–4 at seeds 42, 1 and 3735928559, target value 500.
- Six ordinary-loot cases: queues `[1117]` and `[1117,6,28,30]` at those three seeds.
- Two starting-item sequences at seeds 42 and 3735928559.

Comparison checks all 33 observed item fields, ordinary offer slots and consumed
guarantee markers, plus exact RNG draw count and final state. The build preserves
all 3491 root tags, non-code payloads, tag order and frame header; only DoABC tag
2782 changes. The diagnostic SWF uses version 10 for the compiler output.

- Original SWF SHA-256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Instrumented SWF SHA-256: `f3442688510f347914d2fd7dcd2e379bb676dbd4b727053140072e2f7df72289`.
- Captured trace SHA-256: `4737eab10c90f8bbb87e550e1ff7070c14fb03f303efefee47cffaa743af4c2b`.

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
drag/drop or visual parity, boss prizes, skill progression, town/shop behavior,
modifier mounting, later days or playable support for every generated weapon.
See [item integration notes](../web/docs/items-notes.md) for the current
Simulation v2 save migration and ordinary-loot screen.
