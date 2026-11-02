# Development process review

Current review: 2026-11-02, scheduled19:37 UTC; checkpoint completed after the
user's reboot. Earlier reviews remain in Git. Follow the [current goal](long-term-goal.md)
and [coverage/evidence/limits](port-status.md).

## Findings from actual work

Since the16:02 review, nine integrated checkpoints delivered original Flash
adventure import with independent source-save fixtures, manual Chain Gun spin,
falling-rat behavior, missing combat audio, iframe input isolation, late-enemy
attacks, original combat announcements/auras and font-failure recovery. Import
reused the AMF reader, validator and ordinary UI; attacks reused saved flights.
Work remained solo, muted and save-preserving. Keep those practices.

The last two full suites took14.225s and12.222s; builds took roughly0.8–6s.
Execution time does not explain the larger development cycle. Repository evidence
cannot allocate billing or exact time percentages; do not invent them.

| Observed bottleneck | Specific correction |
| --- | --- |
| Remaining work mixes release evidence with small cosmetic details, encouraging another easily provable visual increment | Use finite completion gates in current status. Prioritize missing reachable behavior, reproduced failures, hosting and sustained stability. Exact filters/audio/RNG matching stay deferred. |
| Each small checkpoint repeats browser recovery, disposable-slot setup, export/import/Continue and documentation | Group related changes before one browser phase. Use the affected flow; do not automatically repeat a whole save ceremony for UI-only code. Reload for changed code/startup; otherwise prefer Return to Title/Continue. |
| Bounded searches still become truncated batch reads, including trait investigation and initial reboot recovery in this review | Print a compact inventory first; inspect only flagged functions. Bound output across the whole batch. Avoid dumping runtime/request metadata or broad app lists. |
| This review document grew to about270 lines of chronological appendices | Consolidate current findings and operating rules here; Git preserves earlier detail. Do not duplicate trace archives in current docs. |
| Initial browser recovery after the reboot attempted APIs that are no longer exposed | Stop after bounded discovery. Restore the documented preview independently and retain earlier browser evidence; do not build a replacement automation protocol or disturb the user's desktop. |

The concern about repeated small visual releases is a selection/overhead pattern,
not proof those features were worthless. The real iframe input defect, omitted
audio preloads and startup failures justified their focused checks and corrections.

## Applied during this review

A finite connection screen covered all52 defined traits. Guardian9 is aggregated
into party skills and consumed by castle retaliation; Shotgun105 uses generic
weapon-requirement checks. Neither apparent missing direct reference was a missing
feature. Source checks also supported the existing manual-reload gate and One hit
kill boss exclusion. This establishes connections, not every formula, condition or
balance outcome. No52-skill matrix or speculative rule change was justified.

A missing required town-layout JSON reproduced a functional startup failure:
loading reached100%, title creation partly ran and scene callbacks threw. The fix
checks required caches/textures before creating the UI, guards updates until the
scene is ready and offers an in-game Retry. Optional audio failure still permits
play. This uses the existing loader, not another loading framework.

Actual muted checks covered required-data failure, Retry, optional background
audio failure, healthy recovery and Continue. A readiness-guard correction warranted
one focused failure/retry recheck. Full exports before/after are byte-identical
(v41, tick674); all served fault-injection files were restored. New Game/combat
font-fallback evidence and the unchanged572-test suite are reused. No save or
simulation change required a new campaign replay. Reboot recovery retained these
artifacts and restored the preview at its documented URL.

The earlier IAB runtime is unavailable after reboot. A standard Playwright check
using installed Chrome in one muted headless page restores automated browser
verification without touching the user's profile or desktop. Actual same-origin
iframe export delivers a file and direct Continue preserves its full envelope.
A one-hour dense-battle measurement recorded raw frame gaps, long tasks and
heap samples to an ignored evidence file and completed on2026-11-03 local time.
Final full-envelope export/reload/Continue matches. Keep the measured983ms maximum
gap and sampled heap limits visible; a completed check does not mean perfect
smoothness or no leaks. No duplicate run was started. One fixture comparison needed the
known v40→v41 version migration, and a focus click hit the pause shade: correct
those test assumptions, not product behavior.

Continuation reproduced a silent explicit-save failure by blocking browser writes.
Reused the original confirmation renderer to offer a JSON backup; actual Save Game,
total/medal-only write failure, backup equality, modal keys and healthy Continue
pass in isolated muted contexts. Twelve existing mode/slot checks and the new
build pass; unchanged simulation/full-suite/hour evidence is reused. Automatic
saves retain their existing behavior; do not claim all storage policies supported.

The next hosting check used stock Edge with different host/game origins. The
intercepted host was blocked by local-network access checks before loading game
code. One bounded correction served a real temporary host file; input isolation,
scaled fire, delivered export and full-envelope host reload/Continue then passed.
No security flags/permissions or game code changed, and the host file was removed.
Keep this result scoped to the measured HTTP/default-policy case; do not infer
public hosting or every storage policy from it. Reuse the current build/tests.

An intermittent ready-but-black screenshot recurred once; Continue rendered the
battle correctly. Its cause is unresolved. Loader recovery does not establish a
fix for that observation. An unchanged iframe download path twice reported success
without a delivered file in IAB: retain that limit, rather than retrying indefinitely
or claiming ordinary-browser compatibility from an API return.

## Working rules retained

1. Deliver a useful capability through ordinary play. Reuse existing classes,
   simulation, saves, fixtures and asset extraction. No disconnected opt-in demos.
2. Preserve known rules, balance, English and original artwork. Record intentional
   differences. Exact presentation/RNG matching and the late-game hitbox complaint
   remain deferred as directed.
3. Test changed rules and meaningful failures proportionately. Add save/replay
   checks when persisted state changes. Broaden only for a concrete integration
   risk; reuse unchanged full-suite, campaign and original-game results.
4. Exercise late states directly with controlled saves and accelerated simulation;
   retain a smaller natural progression check. Do not make calendar days separate
   delivery units or build bespoke harness families for every purchase.
5. Use one muted browser phase for an integrated slice, reuse the existing tab,
   preserve the whole user adventure/collection and never enter native fullscreen.
   Observe the actual UI phase before dependent canvas actions.
6. Keep practical Git/save recovery; push useful checkpoints. No repeated release
   archives, hash manifestos or full migration ceremonies for minor additions.
7. Read current docs and affected code, not historical traces. Discover tools by
   precise name. On a stale supported browser binding, one documented recovery
   attempt is enough; unavailable automation is not permission to invent a client.
8. Work solo. Scheduled reviews must change a demonstrated bottleneck or preserve
   the working approach; recurrence itself is not progress. Do not recreate the
   native app goal the user cleared.

## Evidence boundaries and corrected assumptions

- Seeded self-replay proves reproducibility, not original-game equivalence. Test
  totals are not completion percentages. Ruffle comparisons do not prove native
  Adobe Flash equivalence or compatibility with historical player SOL files.
- A controlled40-day run encountered18 kinds; absence of Dragon in that valid
  sequence is not a product defect. Separate per-kind checks cover all19. The
  fixture must copy mission loot like production, rather than alias old town state.
- Five minutes near60 FPS with matching simulation/wall time is useful evidence,
  not an hours-long stability result. Phaser's reported delta is smoothed; raw
  stalls and memory remain separate measurements.
- Muted silence does not prove sound readiness; inspect the loaded cache. A tool
  wait timeout does not prove the product stalled when later observations complete.
- Source AI target-acquisition continues can explain a one-frame counter difference;
  do not change balance from counter divergence alone. Compare exported JSON bytes
  rather than cross-realm REPL object prototypes.

Next priority: remaining reachable functionality if demonstrated, sustained real
browser stability and the documented hosting/browser boundaries. Do not substitute
more cosmetic slices for these gates or call the port complete from passing tests.
