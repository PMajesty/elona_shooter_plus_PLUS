# Archer boundary

The three-day campaign includes original enemy ID2, Archer. Source selection can
reach it on Day3 through the low-level random-group boundary; it is not replaced
by another enemy when absent from an ordinary seeded sample. The separate wave
fixture proves selection, while the Archer fixture below proves bounded behavior.

`enemy.as:299` initializes 38HP, attack3, range `[290,400]`, speed
`random()*0.7+0.8`, counter120, knockback resistance0.8 and critical rectangle
`[-7,9,-20,-8]`. `enemy.as:1255` moves it toward that range, starts an attack after
the counter becomes negative (reset80), and uses the original random range test
after x290. `enemy_archer.as` supplies the child-frame transitions: alive25→5,
attack82→28, arrow release59, death94 and death animation stop125.

The castle takes damage at frame59 when the arrow is created. The arrow is a
visual actor, with no second collision or damage on arrival. `arrow.as` advances
x by15, increments its trajectory parameter, updates its quadratic height and
rotation, and removes itself once x exceeds650. The production state saves
these arrows separately from player projectiles, together with the Archer's
attack counter and normal enemy state.

## Evidence and corrections

Two identical Ruffle runs of `tools/build_archer_oracle.py` captured five
scenarios: the opening counter, repeated ranged attacks, knockback interruption,
the left-edge clamp and death. There are **517 state observations**: five initial
states and 512 explicit steps. All match production spawn/AI/animation/arrow
processing, including HP, speed, attack, gold, experience, counter, flags, frames,
display width, castle HP, RNG draw count and final RNG state. Six 64×64 original
filled-contour grids at frames1/5/28/59/94/125 match all **24,576 points**.

The initial strict comparison matched239/517 state observations. The preserved
`.build/oracle/archer-comparison-before.json` exposed these concrete corrections:

- The source requests the absent `stand` label after an early ranged attack.
  The captured runtime resolves it to frame1 without an exception, then the
  fixture's explicit nextFrame reaches2. The port now follows that observation,
  including restored movement speed, instead of restarting at alive5.
- Knockback x assignments truncate to twips. The left clamp uses the current
  display width before the child-frame advance; it is not a fixed60px margin.
  `enemy-display-bounds.ts` derives widths from original shape bounds and
  placement matrices. Every captured width is also compared directly.
- An already valid arrow rotation keeps its direct calculated Number value.
  Unnecessary modulo arithmetic had changed its final floating-point bits.

These are parity corrections, with no intentional difference or ignored source
exception. The three focused reference tests verify provenance/full comparison,
assert the source release/fallback/clamp/death edges, and prove that changing
arrow movement makes the comparison fail.

## Reproduction and limits

Run `python tools/build_archer_oracle.py`, capture `?suite=archer` twice on the
reference harness, then run `npm run test:archer-reference` from `web/`.
The checked-in trace is `tests/fixtures/original-archer-trace.json`; focused tests
run with `node --experimental-strip-types --test tests/archer-reference.test.ts`.
Hashes and capture provenance are in [the oracle notes](../../docs/oracle-notes.md).

The fixture deliberately calls original AI, explicitly advances the child frame,
then advances arrows that existed before that step. It does **not** establish
native Flash/Ruffle event scheduling, paused animation behavior, whole-battle
timing or pixel-identical rendering. Collision grids are finite samples, and do
not resolve the reported late-game hitbox problem. Day4 boss shields and later
enemy behavior remain separate work.
