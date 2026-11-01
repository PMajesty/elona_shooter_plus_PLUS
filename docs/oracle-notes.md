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
