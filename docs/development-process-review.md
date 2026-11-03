# Development process review

Current review:2026-11-03. Follow the [goal](long-term-goal.md) and
[current coverage](port-status.md). Earlier reviews remain in Git.

## Evidence and corrections

The user supplied the missing VPS/domain input, so the earlier unchanged-input
wait ended. Public HTTP, trusted domain HTTPS and versioned rollback now work.
The latest update restores creation animation, adds linked mute and integer
scaling, then connects source combat shake/reticle/hotbar/frame cues. The next
integrated check exposed a material gameplay defect: shared shot skills were
incorrectly gated on an advanced-class meter for manual base classes.

| Observation | Correction applied |
| --- | --- |
| Pure shot formulas and the finite trait-connection screen passed while manual base-class skills were still skipped. The browser One Shot check failed; an actual Simulation.tick shot reproduced it. | Test the ordinary caller for affected skills. Five focused tests now cover all four base classes, real damage/Killer cooldown, Burst persistence/control transfer and45-frame replay. Existing helper/reference tests remain useful but do not prove their callers are connected. |
| A first fix required counters on every v42 base hero and broke synthetic legacy fixtures across the suite. | Removed that broad schema requirement. Only manual Burst allocates optional saved state; stateless bonuses apply without a meter. V41 migration changes only version unless existing legacy migrations apply. The firing/save fix passed585 checks; the final integrated release passes589 in12.008s. |
| Some batched source reads were truncated, filename guesses failed, and source scripts were exported again despite the cached .build/export/scripts tree. | Inventory filenames first, read one short function/section with an adequate total budget, and reuse cached decompilation. Do not broaden output after a narrow question is answered. This remains an active discipline problem. |
| The presentation browser driver initially expected cues only after Continue, which intentionally suppresses old cues. | Collect new cues before reload; retain exact save comparison and verify that Continue does not replay the entrance. Do not repair game code to satisfy a flawed test ordering. |
| Direct DNS/curl reached Caddy while Windows socket lookup and Chrome still reached the old IP. Get-DnsClientCache exposed the95.163.244.138 entry and77475s remaining TTL. One local cache refresh fixed normal lookup; the final public Chrome flow now passes. | Compare normal socket resolution with direct DNS before attributing browser failure to upstream propagation. Keep each path's evidence separate; no server/certificate repair or DNS-setting change was needed. |
| Regenerating JSON reordered fields; a JavaScript rewrite also changed float spelling without changing values. | Retained existing JSON order/representation and limited the manifest diff to the two added clips. No game rebuild/retest is needed for equivalent JSON formatting. |

No billing/time allocation is inferred from repository evidence. Tests and trait
counts are not completion percentages. Source audits and self-replay do not
establish natural late-game balance or complete Flash equivalence.

## Working rules retained

1. Work solo in complete ordinary-player slices. Preserve original English,
   artwork, known rules/balance and the user's saves. No disconnected opt-in demos.
2. Prioritize feature completeness over exact cosmetic/audio/RNG matching. Defer
   the veteran hitbox complaint; exact30Hz/20Hz scheduling is optional.
3. Run affected deterministic/integration/save checks, then broaden only for a
   concrete risk. The current full suite covers the changed firing/save path;
   reuse the completed hour-long browser run for unchanged stability behavior.
4. Use the existing muted browser driver/page where possible. When IAB automation
   is unavailable, use an isolated headless Chrome/Edge profile. Never activate
   native fullscreen or touch the user's stored run.
5. Measure delivered files, full save envelopes, actual shots and raw stalls.
   A successful function, screenshot metadata or smoothed FPS is insufficient.
6. Keep current documentation concise, push useful integrated checkpoints and
   retain rollback. Avoid repeated discovery, historical trace reads and release
   ceremony for unchanged code.
7. Watchers stay quiet for unchanged/non-actionable states and stop at the
   documented completion boundary. The user cleared the native app goal; do not
   recreate it. Continue useful port work independently of DNS delays.

## Current release evidence and limits

The integrated release also restores source clouds/day-night transitions and
three special-shot trails/One Shot flash and the once-per-wave Sister launch
cue. The latter has an actual muted WebAudio-start observation on the final public
release as well as single/multiple-bomb event tests. A transition save replays exactly;
all three trails, Pause, ending and the flash-disable option pass in muted
Chrome. A missed lethal-shot browser probe aimed above its visible target; only
the remaining cases were rerun after correcting that fixture. No hitbox change
was made. A short30-second dense check covers the changed renderer separately
from the retained hour run: max66.7ms gap, one67ms long task, exact final Continue,
no errors. Do not repeat either check for unchanged code.

The finite source-flow inventory exposed no further disconnected normal-play
system after these fixes. This supports the documented release boundary; it
cannot establish all formulas, natural late-game difficulty or bug-free play.
Keep the explicit Day1–1000 numerical scope, presentation differences and browser
limits in port-status. The diagnosed local DNS wait is closed. Historical player
SOL variants, restrictive embeds and the intermittent IAB observation remain
limits, not grounds for an unbounded verification loop. Pause recurring work at
the documented boundary and resume for concrete new evidence or user direction.
