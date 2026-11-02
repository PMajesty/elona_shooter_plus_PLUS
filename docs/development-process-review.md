# Development process review — 2026-11-02

## Finding

The overnight process optimized confidence in narrow increments at the expense of
feature coverage. The result is useful but substantially incomplete. The user
reports more than $1,000 spent. Repository records cannot verify billing or assign
an exact cost/time percentage to each activity; the workflow problems below are
observable without inventing those numbers.

## Evidence and root causes

| Problem | Evidence | Consequence | Doctrine |
| --- | --- | --- | --- |
| Calendar days became delivery units | Separate wave/town builders and comparison commands for Days 3–9; UI and save validators enumerate supported days | Repeated editing, fixtures and validation to extend an algorithm that should support progression | 1, 6, 10 |
| Small purchases became releases | Castle, repair, Sandbag, Storage, Looter and Trainer commits each have separate publication/migration/archive/rollback records | High fixed overhead around small runtime changes | 3, 4, 7 |
| Evidence overwhelmed current state | At checkpoint, status is about 1,000 lines and verification JSON about 31,000 lines, much of it release history | Re-reading and updating history consumes attention/context and obscures remaining features | 11 |
| Established checks were repeatedly broadened | Repeated natural campaigns and browser save paths accompany successive small Castle additions | Additional confidence had diminishing value while major systems remained absent | 4, 5 |
| Hero support was duplicated conceptually | Companion code already has nine class definitions, starting gear and combat effects, while the hero generator/choices/save validation are Sheriff-specific | Existing capability does not reach the ordinary New Game flow | 2, 10 |
| Local certainty displaced the overall outcome | Twenty-four save/release milestones still end at nine Sheriff days | Individual successful checks did not demonstrate whole-game completion | 1, 5, 13 |

The central decision error was applying the strongest faithfulness standard to
almost every detail before achieving breadth. Once that became habitual, each
small, readily provable addition appeared to be the safest next task. There was
no effective reassessment of progress per unit of work. Autonomous continuation
and the watcher perpetuated that choice; recurrence does not improve throughput.

A second cause is structural: save validation mixes structural integrity checks
with assertions about early-game content and historical implementation limits.
Repeated day/class enumerations make a content addition look like a format change.
This invites another migration/release cycle. Generalize the restrictions when
their supported feature is implemented; do not remove guards to expose missing
enemy behavior or silently substitute invented mechanics.

Resource control was also missing. The app goal record reports about15.27million
accumulated tokens and9.85hours; it does not distinguish billing categories or
provide a trustworthy dollar allocation. Repeatedly supplying long source reads,
generated traces and historical reports increases context work. On the resumed
run, the412-test suite completed in about8seconds and a production build in about
5seconds. Test execution itself does not explain the much longer feature cycles;
designing bespoke probes, repeated UI/release work and reasoning/reporting around
each increment are the stronger demonstrated targets for reduction.

The quality target was also too open-ended. "Absolutely perfect" supplied no
practical rule for deciding when another fidelity probe had earned its cost.
Use the original feature inventory as the completion boundary, structural and
behavioral checks as acceptance evidence, and a finite list of documented
differences. Pixel, audio and incidental RNG-order matching can follow broader
coverage. Comparisons observed under Ruffle establish agreement with that
reference runtime; they do not independently prove identical native Flash behavior.

The original-game comparison machinery is worth keeping. It detects errors that
tests written from the port alone cannot detect. Its expansion was disproportionate:
not every new day or purchase needs a bespoke SWF driver and another large stored
fixture. Existing passing comparisons remain evidence for unchanged behavior.
Seeded repeatability proves reproducibility, not equivalence to Flash; generated
fixtures and test counts must never be used as a completion percentage.

Collaboration also creates coordination/context costs, but the available records
do not establish its share of the spend. Per the user's instruction, all further
work is solo. No new agents or automatic recurring continuation are authorized by
this review.

## Changed working rules

1. **Feature completeness first.** Preserve original assets, rules, balance and
   saves where known. Accept documented cosmetic, audio timing and RNG-order
   differences when exact matching would block substantial playable functionality.
   Do not invent balance or claim parity for approximations.
2. **Choose a complete user capability.** Examples: all starting classes through
   creation/combat/growth/save, general campaign progression, or a complete town
   activity. A calendar day is not automatically a new project.
3. **Reuse implemented systems.** Share class definitions and skill selection
   with companions; keep the simulation independent of rendering. Consolidate
   only duplication directly encountered by the feature being added.
4. **Use proportional automation.** Deterministic targeted tests for new rules,
   save/restore replay for affected state, representative boundary cases and one
   integrated browser smoke. Run the full existing suite once at an integrated
   checkpoint, or earlier for a concrete cross-cutting risk. Avoid fresh giant
   fixture sets and full original-game replays for unchanged code.
5. **Test late states directly.** Controlled state setup and accelerated simulation
   should exercise unlocks, high levels, dense battles, unusual equipment and
   failures. Keep a smaller natural campaign smoke to catch progression errors.
   Distinguish controlled-state tests from naturally acquired progress.
6. **Release at useful checkpoints.** Keep the existing Git recovery baseline and
   local save backup. Build and update the ordinary local application after a
   meaningful group of features; do not create another ZIP/hash manifesto and
   full rollback copy for every small change.
7. **Keep records concise.** A current coverage summary, explicit differences,
   checks actually run and next missing systems. Retain historical evidence in
   place without copying it into every new report or rereading it wholesale.
8. **Control resource use.** Solo work, bounded tool output, shared test helpers,
   no recurring watcher restart, no automatic expansion of the test matrix.
   Reassess immediately when another small feature demands a parallel family of
   bespoke tools or repeated repair work. Do not infer access to dollar billing.
9. **Quiet browser testing.** Default the port to muted unless the user explicitly
   enabled sound; persist that preference. Reuse the existing Codex browser tab.
   Do not open audible original-game diagnostics during routine verification.

## Immediate development order

- Bring existing class/party capabilities into playable hero creation: Rogue,
  Hunter, Sheriff and Militia, their original gear, Little Girl where applicable,
  class-specific earned skill choices, growth and resumable combat.
- Generalize campaign and save boundaries with the missing enemy/boss behaviors,
  extending groups of supported encounters rather than one release per day.
- Complete remaining town/Castle actions, temporary hiring and other class unlocks.
- Then concentrate on visual/audio fidelity, measured performance and a controlled
  reproduction of the reported late-game hitbox problem.

Completion remains the original game's feature coverage with documented intentional
differences. This is a priority change, not a claim that the current port is close
to complete or that an overnight finish can be promised.
