# Development process review

Current review: 2026-11-02, scheduled23:09 UTC; cadence checked23:25 UTC
(2026-11-03 locally).
Earlier detail remains in Git. Follow the [goal](long-term-goal.md) and
[current coverage/evidence/limits](port-status.md).

## Evidence since the previous review

Nine checkpoints followed the19:37 review: seven delivered required-asset Retry,
explicit-save backup, WebGL-loss pause, original creation/item/skill information,
and visible Continue/import failures. Two recorded Chrome iframe/stability and
Edge cross-origin evidence. Changes reached ordinary play and reused existing
renderers, simulation, validators and save flows. Work stayed solo and muted;
isolated headless browsers left the user's adventure/collection untouched.

The last full suite passed578 checks in11.236s. The last UI-only save-recovery
change reused it and ran the affected browser flows plus build/typecheck.
A one-hour dense-battle run completed with exact final Continue, no script errors
or failed requests; retain the983.4ms maximum gap and sampled-heap limits.
Repository evidence cannot allocate billing or exact time percentages.

## Bottlenecks and corrections

| Observed evidence | Correction applied |
| --- | --- |
| Late hover failures reran already-passing Barracks/focus/Continue steps; the save-recovery driver also reran all recovery cases to investigate one keyboard action | After a partial pass, isolate the failed transition in the existing ignored driver. Save completed observations separately; rerun the integrated flow only when changed code could affect it. No new harness family. |
| New interactive rows enter Phaser's input list in preUpdate. Moving before that frame left no hover event; waiting after the move did not help. A mutation trace and the local Phaser source established this sequence | Synchronize a dependent pointer action after row creation. Check actual screen/input phase, rather than treating click acknowledgement as completed UI work. A normal keyboard selection passes after its input frame; no keyboard fix is claimed. |
| Independent New Game and Barracks hint work repeated source interpretation; weapon skills were initially misclassified in creation and corrected in4f915e6 | Keep the now-shared source hint formatter/renderer and class limits. Group related ordinary callers before browser verification; do not infer source groups from numeric IDs when definitions are available. |
| Several combined reads were truncated; one emitted6070 tokens despite a4900-token output budget. The review document again accumulated chronological continuations | Use a file/line inventory followed by one relevant function or short section. Budget the whole batch. Replace this document with current findings; Git preserves history. |
| Three consecutive information slices followed the stability/hosting work while the completion gate still mixed release questions and cosmetic differences | Treat restored information as delivered. Next address a finite hosting gap: serve the production dist from a plain static server at a nested path and exercise the documented embed. Defer exact filters/audio/camera work. |
| The saved continuation schedule was every10 minutes despite the user's30-minute request, confirmed in its automation.toml | Updated the existing heartbeat through the native automation tool to30 minutes, preserving its prompt, active status and chat. The workflow-review schedule already matches three hours. No billing/time savings are inferred. |

The full-suite runtime is small; repeated orientation, setup and unfocused source
reads are the demonstrated process concerns. No time/cost percentage follows.
Browser failures above include test assumptions; do not turn them into speculative
product repairs. The reproduced storage and WebGL defects did warrant fixes.

## Working rules retained

1. Start with one useful player or hosting outcome and finish its ordinary flow.
   Reuse existing simulation, saves, source data and renderers. No opt-in demos.
2. Preserve English, artwork, known rules and balance. Feature completeness takes
   priority over exact cosmetic/audio/RNG matching; the late-game hitbox complaint
   remains deferred. Exact30Hz/20Hz rates are optional when gameplay stays faithful.
3. Test changed behavior and affected callers proportionately. Add replay/save
   checks when persisted state changes; reuse unchanged campaign, full-suite and
   hour-run evidence. Test counts are not completion percentages.
4. Use controlled late states rather than demanding manual progression. Retain
   independent original-game comparisons; seeded self-replay proves reproducibility,
   not Flash equivalence or natural difficulty balance.
5. Use one muted browser phase per integrated slice; reuse its tab where possible.
   If IAB automation is unavailable, use installed Chrome/Edge headlessly in an
   isolated profile. Never activate native fullscreen or alter the user's saves.
6. Inspect actual outcomes: delivered export files, full saved envelopes, raw stalls
   and error details. An API return, smoothed FPS, silence or tool timeout alone
   does not establish success, sound readiness or a game stall.
7. Keep current docs concise and push useful checkpoints. Do not repeat release
   archives, full migration ceremonies, browser discovery or historical trace reads.
8. Work solo. Do not recreate the native app goal the user cleared. Watchers should
   stay quiet for unchanged states and pause at the documented completion boundary.

## Remaining decisions and evidence limits

The one-hour run is complete; do not schedule another unchanged soak. Chrome/Edge
loopback embeds and backup delivery pass, but public HTTPS/CDN hosting, sandboxed
or restrictive privacy policies and historical player SOL files remain unverified.
The intermittent IAB ready-but-black observation is undiagnosed; loader/context
recovery is not proof of its cause. Preserve these limits rather than retrying
indefinitely or declaring the whole port complete.

Applied next experiment: a copied dist on Python's plain static server at
/games/elona/ passed on the first run: folder redirect, New Game/fire, same-origin
iframe input, actual export and full-envelope direct/embedded/host-reload Continue.
No Vite/backend, failed/error requests or script errors. The local1099ms load and
12,986,070 transferred bytes are recorded without a public-network speed claim.
README now has plain static-preview/upload steps. Browser/server closed afterward.

The actual website URL/platform was requested for its HTTPS deployment check.
Continue independent useful work where available; do not replace this missing
input with an invented policy matrix, another unchanged soak or cosmetic churn.
