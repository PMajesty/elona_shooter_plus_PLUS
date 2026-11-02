# Seventh-day wave boundary

The seventh battle uses mission6 prepared on calendar6. Its source values are
power1520, reward720, spawn interval13.8 and guaranteed Crow Statue1106 after
the optional Ragnarok1038 roll. Generating waves after Rest changes neither
that prepared loot nor its historical absorption. Town7 may prepare mission7
with power1640, reward740 and spawn interval13.6. Calendar7 supplies no guaranteed
loot; the optional Ragnarok roll remains. Mission7 waves are still rejected.

Source anchors are `src/original/MainTimeline.as:5274` (`generateWave`),1113
(`selectEnemy`),1638 (`randLv`),8533 (`preGenerateWave`),12064
(`generateSpecialLoot`) and12144 (`generateMission`).

## The newly enabled RANGED branch

At mission6, AIR remains the first10% branch and BATCH1 remains the second10%
branch. After both fail, the source checks `random()<0.2 && level>5` for RANGED.
It selects five groups in this order:

| Requested level | Budget | Required flags |
| --- | ---: | --- |
| `randLv(level,0.8)` |10% |none |
| `randLv(level,1)` |30% |RANGED |
| `level+2` |20% |none |
| `randLv(level,1)` |15% |none |
| `randLv(level,1)` |15% |RANGED |

The budget totals90%, as in the source. A successful RANGED branch omits the
BATCH2 condition draw. Failed RANGED still consumes its draw before evaluating
the level guard, preserving all previously accepted mission0–5 streams. The
ordinary path then consumes the BATCH2 draw even though its level guard fails.

The maximum requested level is8, so no additional species becomes reachable:
Barbarian is level7 and Lava, the next catalogue species, is level9. The full
catalogue order, Fly availability draw and per-wave duplicate list remain
unchanged. At fixed level6, a failed selection still consumes the three original
fallback draws. A RANGED request can therefore yield a non-ranged fallback,
particularly after its only eligible Archer has already been used. This is
source behavior, not a replacement policy for the port.

Source delays are computed from the pre-shuffle enemy and remain associated
with their array positions while only IDs swap. First-enemy delay additions,
boss insertion and wave power reduction are unchanged. The separate spawning
loop at8397 still takes one break-condition draw at mission6 because
`random()*6-6<0` and every selected enemy has nonnegative catalogue level.
The diagnostic below does not execute that spawning loop or native clocks.

## Independent original capture

`tools/build_seventh_day_wave_oracle.py` builds a separate test-only SWF and
leaves earlier fixtures and baselines unchanged. It invokes original
`generateMission(6)` on calendar6 and `preGenerateWave()` on calendar7 after the
tested original New Game bootstrap. The controlled stream is active only during
that method boundary. Observation additions retain source method bodies and
record branches, group inputs/results, final enemy/delay arrays, mission fields,
RNG counts and final state. Non-code resources are checked against the original.

Ten cases use seeds42,1,0xdeadbeef,6; constants0,0.199999,0.2,0.99; and separately
labeled BATCH1/RANGED prefixes followed by0. Seed6's first three branch inputs
are approximately0.479/0.643/0.144, so it is intended to demonstrate natural
RANGED selection. The RANGED prefix `[0.5,0.5,0.5,0.5,0]` makes the first wave
take that branch while retaining the actual selection and fallback methods.
Boundary streams are controlled legal inputs rather than assertions about a
seeded stream reaching an entire constant sequence.

The suite is `seventh-day-waves`; outputs use
`.build/oracle/seventh-day-waves-*`. The comparator is
`web/scripts/compare-seventh-day-wave-reference.ts`. This boundary excludes boss special attacks,
enemy AI, town interactions and complete native battle scheduling.

## Accepted original evidence

Two identical Ruffle0.7.1 runs captured ten snapshots at
`2026-11-02T00:41:03.834Z`. All ten matched on the first comparison: complete
mission fields, enemy IDs and their order, delays, group counts, preparation
draw boundary, final RNG state and total draws.

All four seeded original runs include RANGED. Seed6 begins with RANGED and later
has two AIR waves. Constant0.199999 selects five RANGED waves;0.2 selects five
ordinary waves. The controlled first RANGED wave selects Fly, Archer, Barbarian,
Crow and fallback Sheep. Its last group retains the RANGED flag in the recorded
request but consumes three fallback draws and returns Sheep after Archer was
already used. First-selection draw positions5/6/7/8 for AIR/BATCH1/RANGED/ordinary
confirm the condition short-circuit boundaries.

Draw counts in case order are232/228/251/257/252/200/230/251/239/243; enemy totals
are81/77/74/91/95/53/68/74/98/88. Every case retains calendar6 Crow Statue1106.

- Original SWF SHA-256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Diagnostic SWF SHA-256: `ff3d698e9400cc321954838abb784c03839e9933aedc6da10bb50ba3c8fbdb7a`.
- Trace SHA-256: `3c44ced37fae7098b420faeb8f68a736df20bf1d00425157f5cde067b411f6da`.
- Fixture: `web/tests/fixtures/original-seventh-day-wave-trace.json`.
- Reports: `.build/oracle/seventh-day-waves-browser-report.json` and
  `.build/oracle/seventh-day-waves-comparison-report.json`.

The two new reference tests and eight mission tests pass. A negative control
transposes two random values supplied to the real generator while leaving the
source fixture unchanged; seed42 still consumes232 draws but its waves differ,
so count-only checking cannot satisfy the comparison. A second control replaces
the non-ranged fallback and changes a delay. Existing Day1–6 fixtures remain
unchanged, with their19-test regression run passing before acceptance.
