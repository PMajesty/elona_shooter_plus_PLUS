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
| A first fix required counters on every v42 base hero and broke synthetic legacy fixtures across the suite. | Removed that broad schema requirement. Only manual Burst allocates optional saved state; stateless bonuses apply without a meter. V41 migration changes only version unless existing legacy migrations apply. All585 checks now pass in12.248s. |
| Some batched source reads were truncated, filename guesses failed, and source scripts were exported again despite the cached .build/export/scripts tree. | Inventory filenames first, read one short function/section with an adequate total budget, and reuse cached decompilation. Do not broaden output after a narrow question is answered. This remains an active discipline problem. |
| The presentation browser driver initially expected cues only after Continue, which intentionally suppresses old cues. | Collect new cues before reload; retain exact save comparison and verify that Continue does not replay the entrance. Do not repair game code to satisfy a flawed test ordering. |
| Ordinary curl now reaches Caddy, while a fresh Chrome default-route check still fails TLS. Mapped Chrome validates the actual new public release normally. | Report these network paths separately. Preserve the default failure; no certificate reissue, repeated cache flush or global DNS change. One later default-route confirmation remains. |
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

## Current limits

The hour-long check is complete; no unchanged repeat is required. Default Chrome
HTTPS routing still needs confirmation after stale resolution clears. Historical
player SOL files, restrictive embeds and the intermittent IAB ready-but-black
observation remain stated support/evidence limits. They do not justify speculative
recovery layers or an unbounded testing matrix. See port-status for the finite
presentation differences and the distinction between connected coverage and parity.
