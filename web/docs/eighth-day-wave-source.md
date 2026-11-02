# Day 8 waves and spawn batching

The eighth battle uses mission 7 prepared in town on calendar 7. Its normal source values are power 1640, reward 740, five waves and spawn interval 13.6. Calendar 7 has no guaranteed special item; the optional Ragnarok item 1038 roll remains. Rest changes the calendar to 8 before wave generation. Town 8 prepares mission 8 with power 1760, reward 760 and interval 13.4, also without a guaranteed calendar item. Preparing that mission does not establish support for the next battle.

Source anchors: preserved `src/original/MainTimeline.as` 1113 (`selectEnemy`), 1536 (Lava catalogue entry), 1638 (`randLv`), 2753 (`spawnEnemy`), 5274 (`generateWave`), 8381–8402 (timer spawn loop), 8533 (`preGenerateWave`), 12064 (`generateSpecialLoot`) and 12144 (`generateMission`). Enemy initialization and boss constants are in `.build/export/scripts/enemy.as`, exported from the preserved SWF.

## Lava is actually reachable

At mission level 7, unrestricted level + 2 requests can select Lava, original ID 4, catalogue level 9, power 300 and flags `KAMIKAZE`/`MASS`. Such requests occur in BATCH1, RANGED and ordinary waves. AIR's corresponding request still requires AIR and cannot select Lava. The ordinary requested level cap, nearest-level selection, Fly availability draw and per-wave duplicate list are unchanged. A natural target level of 8 can choose Lava through the original later-entry tie rule; the selection is not limited to an artificial random value of zero.

No new wave branch opens here. BATCH2 requires level > 10, and the additional Barbarian fallback draw requires fixed level > 7, so neither is active in mission 7. Failed RANGED selection still uses the three existing fallback draws and may return a non-ranged enemy. The original RANGED budget still totals 90%.

Lava's catalogue power also exercises the existing `power >= 300` delay addition: its pre-shuffle delay is `13.6 + 3 + 2`. The source calculates delays before swapping enemy IDs and does not swap those delay entries. That behavior remains part of the exact comparison.

The ordinary eighth boss has mission level 7 and therefore 325 HP and attack 1. With seven previous ordinary bosses its appearance is 58. There is no new Day 8 boss action threshold: shield begins at level 3, grenade special at 6, reactive damage shield at 10 and rocket special at 20. These are source facts; the wave/spawn suites do not retest complete boss AI.

## New timer behavior

At Main 8397 the break expression is:

```text
enemy catalogue level > random() * mission level - 6 || random() > 0.8
```

Through mission 6, every eligible enemy breaks after the first draw. At mission 7, Sheep's catalogue level is zero, so the first comparison fails at random values >= 6/7. Only then is the second draw consumed. A value <= 0.8 continues the loop.

The loop condition compares its increasing index with the **current shrinking queue length**. It must not use the original length or simply empty the queue. Each spawn removes the last enemy and delay; the final timer is the last popped delay plus `index * 4`. The enemy's own initialization draws happen before either break-condition draw. Rat and every higher-level enemy still break on the first comparison at mission 7.

Emptying the queue does not immediately set `newWave`: the newly assigned timer must expire and a later callback observes the empty queue. Enemy frame progression, actor inputs and native scheduling are separate from this timer-method boundary.

## Accepted original wave experiment

`tools/build_eighth_day_wave_oracle.py` calls original `generateMission(7)` on calendar 7 and `preGenerateWave()` on calendar 8 after the proven original New Game bootstrap. Four xorshift32 seeds, four explicit constant streams and BATCH1/RANGED prefixes produce ten snapshots. Observation additions record selection requests/results and draw boundaries while preserving the original generation bodies.

Two identical original Ruffle runs were captured at **2026-11-02T04:18:37.209Z**. All **10/10** snapshots match production mission fields, complete enemy/delay arrays, initial counts, preparation boundary, draw totals and RNG state.

- Seeds 42, 1, 0xdeadbeef and 6 contain respectively **2, 1, 1 and 2 Lava enemies**. This is actual original selection evidence.
- Draw totals in case order: 250, 229, 247, 235, 263, 219, 229, 257, 240, 254. Enemy totals: 76, 95, 94, 87, 106, 57, 67, 80, 99, 99.
- The controlled first BATCH1 groups select Barbarian, Lava and Chicken. The controlled RANGED groups select Barbarian, Archer, Lava, Fly and fallback Sheep. That final RANGED request takes six draws: three selection draws plus three fallback draws.
- First selection draw positions remain 5/6/7/8 for AIR/BATCH1/RANGED/ordinary. Constant 0.199999 chooses RANGED; 0.2 chooses ordinary. Only the constant-high preparation receives optional item 1038.

Two focused tests pass. Negative controls reorder actual generator inputs and change an observed fallback/delay. Reordering can leave the draw count unchanged while changing waves, so count-only agreement cannot satisfy this comparison.

Wave fixture: `web/tests/fixtures/original-eighth-day-wave-trace.json`.
Diagnostic SWF SHA-256: `b73dca3630c9570fd0e13088fd2d3f65f6150d2898edc23bed2bf040c5f1a9d6`.
Trace SHA-256: `059240c406396eae6c857a3cc9c0463a2706b7c14e020c4abf1678fcf7d18cc3`.
Reports: `.build/oracle/eighth-day-waves-{browser,build,comparison}-report.json`.

## Accepted original timer experiment

`tools/build_eighth_day_spawn_oracle.py` calls unchanged original `onTick` and actual `spawnEnemy`/`enemy.init` with explicit queue and random-prefix inputs. Every enemy starts as a fresh original object. Actor timer behavior is disabled in the source; enemy frame callbacks do not advance. The production adapter calls actual `Simulation.timerTick` with an idle full-ammo Sheriff and no active companions, observing spawn calls and numerical state rather than implementing a substitute spawn loop.

Two identical original runs at **2026-11-02T04:19:54.026Z** yielded **10/10** exact comparisons. All sampled random values and states, enemy initialization, remaining queues/delays and every timer step match.

- Sheep first-break takes four total draws; exact first-threshold followed by second-break takes five. Three initialization draws precede either decision.
- At the second threshold of 0.8, continuation allows another spawn. A first continued Sheep followed by a first-condition break consumes nine total draws.
- Four continued Sheep stop after two spawns, leaving two; three stop after two, leaving one. Their final timers are 19.6 and 18.6 under the deliberately distinct input delays, including the source `index * 4` term.
- A final single Sheep leaves `newWave` false at timer 13.6. Fifteen actual timer calls end at `-0.40000000000000036` and `newWave == true`, with no extra spawn RNG. An initially empty queue marks `newWave` with zero draws.
- Rat and Lava controls each use three initialization draws and one break draw. The original Lava observation has 72 HP, attack 12, speed 5.5 and y 286 for the supplied initialization inputs.
- Boss initialization uses five draws before its first-condition break, produces 325 HP and increments the existing boss counter from seven to eight.

Four focused tests pass. Negative controls detect retaining the earlier one-spawn behavior, an unconditional extra break draw and removal of the later-spawn delay offset.

Spawn fixture: `web/tests/fixtures/original-eighth-day-spawn-trace.json`.
Diagnostic SWF SHA-256: `9bc849483859e3fa2242af3616deecef358edafb854c7c01a6e793793ff52745`.
Trace SHA-256: `b33a18153944cdca87d8c037ab3056172e1b1cd46f715df641338bed25e25653`.
Reports: `.build/oracle/eighth-day-spawn-{browser,build,comparison}-report.json`.

Both builders preserve original SWFs/AS and verify non-code resource payloads, tag order and frame headers. Raw original geometry is retained in the spawn capture, but these suites do not claim new contour or native scheduler parity. Undefined source `shadowHit` is projected to the canonical true value because original collision excludes the shadow only when the field equals false. Lava AI/geometry, town preparation, connected play and browser persistence have separate integration evidence.
