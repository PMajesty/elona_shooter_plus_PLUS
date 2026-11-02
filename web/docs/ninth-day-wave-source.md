# Day 9 waves and timer spawning

Day 9 uses normal mission 8 prepared on calendar 8, with power 1760, base reward 760, five waves and spawn interval 13.4. Rest advances the calendar to 9 before generating waves. Calendar 8 adds no guaranteed special item; the optional 1038 roll remains. Source anchors are preserved `src/original/MainTimeline.as` 1113 (`selectEnemy`), 1524–1544 (enemy catalogue), 1638 (`randLv`), 5274 (`generateWave`), 8381–8402 (timer spawning), 8533 (`preGenerateWave`) and 12144 (`generateMission`).

## Reachability and new random boundary

The largest normal selection request is mission level + 2 = 10. Existing Lava (ID 4, catalogue level 9) remains available; Catapult (ID 5, level 11) is still unavailable. No additional enemy implementation is required for the ninth battle. AIR, BATCH1, RANGED and ordinary wave branches remain unchanged. BATCH2 requires level > 10 and is still unavailable; its preceding random test is still consumed when reached. Calendar 9 retains the early-game +20 delay because `game.day < 10`.

The new condition is `mission.fixedLv > 7` in the selection fallback at Main 1194–1197. A failed selection now consumes a fourth fallback draw after the existing Sheep/Rat/Chicken/Rat choices. A value strictly greater than 0.5 replaces the fallback with Barbarian (ID 7). The draw occurs even when it leaves the prior fallback unchanged. Duplicate exhaustion and failed RANGED/AIR requests can reach this path. Delay generation remains before the enemy-ID shuffle, without swapping delay entries.

## Spawn batching

The unchanged break expression is `enemyLevel > random() * mission.level - 6 || random() > 0.8`. At mission 8, Sheep can reach the second condition at first values >= 0.75; Rat can now do so at values >= 0.875. Continuation needs the second value <= 0.8. Chicken's level 2 and all higher-level enemies always break on the first comparison for valid random values < 1. Enemy initialization draws precede these tests.

The loop compares its increasing index against the shrinking queue length. The last popped delay gains `index * 4`. An emptied queue still waits for the assigned timer to expire before a later callback marks a new wave. The diagnostic invokes the actual timer method without advancing enemy frames or claiming native scheduling parity.

The ninth normal boss has 350 HP and appearance 59 after eight prior normal bosses. No new boss AI threshold is crossed: shield starts at level 3, grenade special at 6, reactive shield at 10 and rocket special at 20. These constants and initialization are in exported original `enemy.as` 11, 67, 87, 143 and 214 onward. The spawn suite observes initialization, not full boss behavior.

## Diagnostic boundary

`tools/build_ninth_day_wave_oracle.py` derives a test-only copy from the preserved SWF and startup-fixed MainTimeline. It calls actual `generateMission(8)` on calendar 8 and `preGenerateWave()` on calendar 9. Twelve observations cover four xorshift32 seeds (42, 1, 0xdeadbeef, 6), constant streams around the RANGED boundary, AIR/ordinary waves, BATCH1/RANGED prefixes and first-wave fallback values 0.5/0.500001. Each snapshot includes complete mission/wave/delay arrays, draw values/count/state and source selection observations. Observer additions identify fallback entry without changing its calculation.

`tools/build_ninth_day_spawn_oracle.py` calls original `onTick`, `spawnEnemy` and fresh `enemy.init` under twelve explicit queue/input cases. It covers Sheep/Rat first thresholds, the second threshold, mixed shrinking queues, deferred empty queues and Chicken/Lava/Boss initialization. Each snapshot retains sampled random values, every timer step, numerical enemy state and raw source geometry. Actor timer behavior and enemy frame advancement are disabled at this method boundary.

Builds verify original resources, tag order and frame headers. Two identical original Ruffle runs were captured for each suite. All 12 wave snapshots and all 12 spawn snapshots match the production methods exactly. Previous accepted fixtures remain unchanged.

## Separate next-town dependency

Town 9 prepares mission 9, which is already the original first boss-day mission: six waves, bossWave 5, no normal boss-wave random draw. Calendar 9 appends Shop Token 1035 then Fly Statue 1110 after the optional 1038 roll. This preparation does not enable Day 10 battle; its original town/reference work is separate from the normal ninth-battle suites.

## Accepted reference evidence

The wave capture at **2026-11-02T04:45:46.115Z** matches all mission fields, complete wave/delay arrays, preparation boundary, every sampled random value, final draw count and RNG state. Source selections also retain requested levels, flags, group budgets and fallback observations.

- The four natural seeds contain respectively 0, 1, 2 and 4 Lava enemies. No Catapult is selected. They encounter 7, 2, 6 and 5 fallback groups respectively.
- The controlled first RANGED wave selects Barbarian, Archer, Lava, Fly and fallback Sheep. The last group consumes seven draws: three selection draws and four fallback draws.
- Its final draw at **0.5 selects Sheep**, while **0.500001 selects Barbarian**. The complete source wave outputs differ as expected: 103 versus 102 total enemies and 271 versus 270 total draws because the different group sizes also change the shuffle count.
- All twelve draw totals are 253, 225, 242, 254, 286, 220, 260, 258, 257, 271, 271 and 270. Three focused tests include actual reordered-input and strict-boundary negative controls. The inherited claim that reordering also preserves total draw count was removed after the experiment showed that it does not hold for these Day 9 cases; wave-difference rejection remains required.

Wave fixture: `web/tests/fixtures/original-ninth-day-wave-trace.json`.
Diagnostic SWF SHA-256: `ef077436fc6f82a611f7ae8286cf33bfb6631cffb288e46b2c1fe6b0b9284e91`.
Trace SHA-256: `e99ce787af78ad5cfceac32d50ae69c803a83a7b1bd139e2cfb94e86771e9e33`.
Reports: `.build/oracle/ninth-day-waves-{browser,build,comparison}-report.json`.

The spawn capture at **2026-11-02T04:46:08.837Z** matches all twelve original method traces, including every initialization draw and timer step.

- Sheep and Rat just below their first thresholds use four draws total; exactly at those thresholds with second value 0.800001 uses five.
- Rat at 0.875 with second value 0.8 continues and can spawn another Rat, using nine draws when the next first comparison breaks.
- Four mixed Rat/Sheep entries spawn two and leave two; three spawn two and leave one. Final timers are 19.4 and 18.4 including the additional four ticks.
- A final Rat leaves the queue empty at timer 13.4 without immediately starting the next wave. Fifteen timer callbacks end at -0.5999999999999996 and `newWave == true`.
- Chicken and Lava each use three initialization draws plus one break draw. The ordinary boss uses five initialization draws plus one break draw, has 350 HP and advances the boss counter from eight to nine.
- Four focused tests reject retaining the prior mission7 thresholds, an unconditional second break draw and loss of the additional delay.

Spawn fixture: `web/tests/fixtures/original-ninth-day-spawn-trace.json`.
Diagnostic SWF SHA-256: `79cb3ee517fd479050b4b9c4b9e642db8457cb01b6e7d6e7e31dfc53bd1d00b7`.
Trace SHA-256: `191b73aa5cde40ff7bcc5f23372cf2a2c682ac5d401029cfb708da651af07e57`.
Reports: `.build/oracle/ninth-day-spawn-{browser,build,comparison}-report.json`.

These are synchronous original-method comparisons, not native scheduler, new collision or complete campaign claims. Enemy AI, town preparation, connected gameplay and browser save/resume have separate evidence.
