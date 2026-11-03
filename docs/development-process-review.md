# Development process review

Current review: 2026-11-03, scheduled02:09 UTC. Previous review23:09 UTC;
continuation cadence corrected23:25 UTC on2026-11-02.
Earlier detail remains in Git. Follow the [goal](long-term-goal.md) and
[current coverage/evidence/limits](port-status.md).

## Evidence since the previous review

The preceding review completed plain static-host verification (1d295c9); the
continuation interval was then corrected from10 to30 minutes (151b8b4). No gameplay
changes followed. Five heartbeats from23:57 through01:57 UTC repeated the same Git
status/log/document-mtime inspection and found the same clean151b8b4 checkpoint.
No tests, builds or browser runs were repeated. The website URL/platform question
remains unanswered; no new independent failure or changed direction was supplied.

The present constraint is missing deployment information. Rechecking unchanged
files does not resolve it. Both active automation prompts now skip tools and
repeat reviews while that exact known input wait remains unchanged. They resume
on an answer, changed direction or demonstrated independent gap. Cadences remain
30 minutes and three hours; neither the port nor its goal is marked complete.

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
| Five subsequent idle heartbeats repeated unchanged workspace inspection while the same human-input request was pending | Added an explicit unchanged-input branch to both existing automation prompts: return quietly without tools or rewriting docs, and resume on relevant new information. Schedules remain active as requested. |

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

The user supplied a VPS/domain on2026-11-03. Gateway had no connection for this
host, so a bounded direct SSH fallback inspected it; no web listener existed.
The distribution Caddy package and a hash-verified versioned dist now serve the
game publicly. One browser phase covers New Game through results/town and exact
battle/town Continue. An upload helper initially decoded the Cyrillic local path
using Windows' default encoding; explicit UTF-8 fixed the transfer before activation.
The initial tool discovery was also too broad and emitted a large schema dump;
keep Gateway discovery to exact tool names, with names-only inventories first.

DNS still points elsewhere and the user was asked to change its A record. While
waiting, check DNS once per continuation and reuse passed HTTP/gameplay evidence.
Enable the validated TLS config and verify the actual HTTPS origin when DNS is
ready. Do not rebuild, rerun the public HTTP phase or broaden the hosting matrix.
