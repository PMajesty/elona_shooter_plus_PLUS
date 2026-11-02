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
work is solo. Recurring work was subsequently reauthorized in the current goal.

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
   no automatic expansion of the test matrix. The user subsequently authorized
   a 30-minute continuation watcher and three-hour workflow review; see the
   [current goal](long-term-goal.md). Reviews must improve useful throughput.
   Reassess immediately when another small feature demands a parallel family of
   bespoke tools or repeated repair work. Do not infer access to dollar billing.
9. **Quiet browser testing.** Default the port to muted unless the user explicitly
   enabled sound; persist that preference. Reuse the existing Codex browser tab.
   Do not open audible original-game diagnostics during routine verification.

## Current development order

The former class/campaign/town priorities are implemented; use current status for
their evidence and limits. Original-game/Ruffle adventure import now has independent
save/search evidence beyond controlled schema files. Address remaining original
interactions and browser/hosting/stability/performance gaps; historical player
files remain an explicit compatibility limit.
Defer costly cosmetic/audio matching and the late-game hitbox complaint as directed.

Completion remains the original game's feature coverage with documented intentional
differences. This is a priority change, not a claim that the current port is close
to complete or that an overnight finish can be promised.

## Subsequent operating correction — 2026-11-02

The user explicitly reauthorized recurring work and a deep workflow review every
three hours. The [current goal](long-term-goal.md) records both schedules and
defers the hitbox complaint until core coverage is complete. Do not reread large
historical verification files at each wakeup. Filter tool discovery by precise
tool names before printing descriptions: broad description matches produced
large irrelevant output during watcher setup. A retained browser session reported
`browser.user is unavailable`; one runtime reset restored the same tab without
new windows. Prefer that bounded recovery over repeated handle acquisition.

## Scheduled review — 2026-11-02 16:02 UTC

Observed progress: native save slots/help/options, hero AI/focus/orders, Sister
reactions, medal paths/import/hints/announcements, full town narratives and lifetime
statistics now reach ordinary play. Work stayed solo, muted and save-preserving.
The last three full suites took11.7–13.3 seconds and passed. No new campaign-specific
harnesses or unchanged full campaign replays were added. Preserve these practices.

The larger remaining Flash adventure import was briefly investigated, then deferred
for another small statistic fix. Recent narrow slices each repeated browser setup,
save restoration and release documentation. This is evidence of a selection/overhead
pattern, not a measured billing allocation. Prioritize that complete import next;
group connected minor corrections instead of making every detail a new release.

Concrete waste: multiple source reads were truncated; a substring search for kills
also returned skills. Use exact words/symbols and bounded function ranges, with a
small result set before expanding. The medal-notice slice built three times as
minor edits continued after browser QA. Finish implementation first, then run one
suite/build/browser phase; repeat only checks affected by a necessary correction.

Browser asset waits expired twice but loading completed without another reload or
console error. This does not diagnose a product stall. The latest statistics check
successfully used Save/Return to Title/Continue instead of reloading all assets;
make that the normal save check and reload only to load changed code or test startup.
Keep one browser phase per integrated slice; the tool's stale-session documentation
output is fixed overhead, so avoid unnecessary phases rather than layering recovery.

Current status had390 lines, much of it chronological browser evidence. Keep current
capabilities, active gaps and a compact evidence index; Git retains older detail.
No test count establishes parity/completion. Billing and the cause of occasional
browser-tool delays remain unmeasured. No new infrastructure or agents are justified.

Applied this review: compressed current status from390 lines to273 before adding
the new coverage, and resumed Flash adventure import rather than another cosmetic
slice. Reused the existing AMF reader/encoder and save validator. The browser check
exposed clipped preview text, warranting a focused text/build recheck; metadata
alone did not establish that the rendered prompt was usable. Actual player SOL
files remain missing evidence, so controlled round trips are not called full parity.

Independent save check: captured two actual original-game SOLs through Ruffle's
Save Manager, then reused the existing converter/tests and ordinary browser import.
No production changes or extra harness were needed. Two native regressions and13
affected checks pass; reuse the unchanged full-suite/build results. This establishes
one source-save path and an independent fixed-search comparison, not general parity.

A rushed canvas action batch reached a town Resting notice instead of the intended
title. Equal exports alone had not proved navigation. With rendered pause/title/town
observations, Return to Title/Continue succeeded and the full save remained equal.
Confirm actual UI phases before dependent canvas actions; town Return to Title is
direct and must not be followed by a guessed confirmation click. No product defect
was established. The transient disposable notice was cleared and the user's whole
adventure/collection restored exactly.
