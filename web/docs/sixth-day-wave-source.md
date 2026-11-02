# Sixth-day wave boundary

The sixth battle uses mission level5 prepared in town5, then generates its
waves after the calendar changes to6. `generateMission:12144` gives power1400,
reward700 and spawn rate14. `generateSpecialLoot:12064` consumes the optional
Ragnarok roll before the guaranteed Holy Grail1037 from calendar5. Wave
generation retains that prepared loot instead of regenerating it for day6.

Town6 may prepare mission6 with power1520, reward720, spawn rate13.8 and Crow
Statue1106. That preparation does not enable seventh-day combat: the wave API
rejects mission6, whose RANGED branch needs separate integration.

## Selection and newly reachable enemy

`generateWave:5274` still uses the AIR, BATCH1 and ordinary paths. AIR consumes
one successful branch draw; BATCH1 consumes the failed AIR draw and successful
BATCH1 draw. Ordinary waves also consume the RANGED and BATCH2 draws even though
their level guards fail. RANGED requires level greater than5, so it cannot occur
in this battle. The source's per-wave power reduction, pre-shuffle delay
assignment, boss insertion and first-enemy delay additions remain unchanged.

The source catalogue at `MainTimeline:1527` contains Barbarian ID7, level7,
power95 and flags BATCH/MASS. General selections at `mission.level+2` can now
choose it. AIR selections cannot choose Barbarian because of its flags. Other
BATCH selections use `randLv` at level5 and cannot reach level7. The full source
catalogue order remains in the selector; a reduced enemy list would change the
nearest-level selection and the unconditional Fly availability draw.

`selectEnemy:1113` still makes three fallback draws at fixed level5: Sheep/Rat,
then Chicken, then a second Rat override. The Barbarian fallback is guarded by
fixed level greater than7 and is not active here. A fallback can ignore the
requested AIR flag, as already observed in the fifth-day capture.

The normal spawn loop at `onTick:8397` checks
`enemyLevel > random() * mission.level - 6 || random() > 0.8`. At mission5 the
first right-hand value is in `[-6,-1)`, while every selected enemy level is
nonnegative. The first comparison therefore always succeeds: one enemy spawns,
one break-condition draw is consumed after its initialization, and the second
draw is skipped. The current Simulation path preserves this order. This is a
source review, not an additional native scheduling capture. The tested wave
boundary does not execute that loop, enemy AI or the frame/timer scheduler.
Barbarian lifecycle and geometry have their own separate original capture.

## Independent diagnostic

`tools/build_sixth_day_wave_oracle.py` derives a diagnostic SWF from the preserved
original and the startup-fixed source. It uses the tested original New Game
bootstrap, freezes ambient timers, sets the normal solo/default context, and
invokes original `generateMission(5)` on calendar5 followed by original
`preGenerateWave()` on calendar6. Random calls use the test stream only while
that boundary runs. Source calculations and selection order are unchanged;
observation records expose branches, selected groups, final arrays, delays,
mission fields and RNG state/count.

The nine cases use xorshift seeds42,1,0xdeadbeef,2; constants0,0.099999,0.1,0.99;
and a separately labeled `[0.5,0.5,0.5,0]` prefix followed by0 to select BATCH1.
Boundary streams are legal controlled inputs, not claims that a production seed
reaches those complete sequences. The selected natural seeds are intended to
exercise Barbarian without forced RNG; only the captured original observations
can establish that coverage.

Outputs use `.build/oracle/sixth-day-waves-*` and the `sixth-day-waves` harness
suite. `web/scripts/compare-sixth-day-wave-reference.ts` compares actual original
records against the production mission/wave methods.

## Accepted original evidence

Two identical Ruffle0.7.1 runs captured nine snapshots at
`2026-11-02T00:13:52.383Z`. The first comparison matched all nine snapshots:
enemy IDs and their original order, every delay, mission fields before/after
generation, the preparation boundary, final RNG state and draw count. The four
seeded runs contain respectively2/4/4/4 Barbarians. Seed42 naturally includes
ordinary, AIR and BATCH1 waves; seed2 contains only ordinary waves. The scripted
BATCH1 first wave selects Chicken, Barbarian and Rat, then subsequent waves use
AIR. The all-AIR cases contain no Barbarian.

Draw counts in case order are246/228/237/257/248/248/250/244/233. Enemy totals are
81/71/78/74/91/91/88/67/92. First-selection draw positions are5 for AIR,6 for
BATCH1 and8 for ordinary waves, preserving branch short-circuit behavior. The
AIR fallback still demonstrates six selection draws: two target draws, one Fly
availability draw and three fallback draws, with Sheep as the selected result.

- Original SWF SHA-256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Diagnostic SWF SHA-256: `022f1a9911a502d41667f06f2a857e24c0dcb7329bd9de5f0a02c4ffe0d37fa1`.
- Trace SHA-256: `35288d4f556069e8a8af2fb7420ab6e913a31f5e289274327228d97a9930508a`.
- Accepted fixture: `web/tests/fixtures/original-sixth-day-wave-trace.json`.
- Reports: `.build/oracle/sixth-day-waves-browser-report.json` and
  `.build/oracle/sixth-day-waves-comparison-report.json`.

`web/tests/sixth-day-wave-reference.test.ts` checks provenance, observed branch
and Barbarian coverage, exact comparisons, and negative controls for omitted
Barbarian, altered AIR delays and an extra branch draw. These two tests and the
seven mission tests pass. The previously accepted Day1–5 fixtures were unchanged
and their earlier regression run passed. The original/fixed SWFs and both AS
baseline byte hashes still match `docs/port-verification.json`.
