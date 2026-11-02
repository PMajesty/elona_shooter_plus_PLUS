# Title button hit regions

The port's title buttons previously required PNG alpha of at least 100. The original buttons contain `TextField` objects, whose rectangular hit regions include transparent spaces between letters. This caused avoidable missed New Game, Continue and Help clicks. Only these three title buttons now use the source regions; other controls are unchanged.

`src/original/MainTimeline.as:7374` converts the stage mouse coordinates to integers, then calls each button's `hitTestPoint(x,y,true)` at lines 7425, 7439 and 7457. Original `DefineButton2` symbols 2521, 2542 and 2579 contain these states in `.build/reference/original.xml`:

| Button | Up / Over / Down / Hit text symbols | Up local bounds | Over, Down and Hit local bounds |
| --- | --- | --- | --- |
| New Game | 2517 / 2518 / 2519 / 2520 | (51, −17.9) to (189, 17.9) | (53, −17) to (191, 18.8) |
| Continue | 2538 / 2539 / 2540 / 2541 | (51, −17.9) to (189, 17.9) | (53, −17) to (191, 18.8) |
| Help | 2575 / 2576 / 2577 / 2578 | (51, −17.9) to (134, 17.9) | (53, −17) to (134, 18.8) |

These are computed from the original text bounds in twips and the button record's translation, not padded PNG bounds. The Up translation is `(1060,−318)` twips; the other states use `(1100,−300)`. All text bounds start at `(−40,−40)` and end at y=676. New Game and Continue end at x=2720; Help ends at x=1620 in Up and x=1580 otherwise.

`title-hit.ts` is the production geometry used by `main.ts`. It preserves inclusive edges and separate current-state bounds. Mouse picking considers the current state and the declared Hit state; the left-click action checks Down geometry after the original integer stage-coordinate conversion. Existing original Over/Down textures replace the previous tint; pointer exit restores Up. In particular, the Up-only left strip is not silently enlarged into a clickable Down region.

This distinction also follows the inspected Ruffle implementation: [`Avm2Button::hit_test_shape`](https://github.com/ruffle-rs/ruffle/blob/bad2f8fbc6e7c1ae741b664034ad19e4ad8af9d0/core/src/display_object/avm2_button.rs#L577) delegates to the current state, whereas [`mouse_pick_avm2`](https://github.com/ruffle-rs/ruffle/blob/bad2f8fbc6e7c1ae741b664034ad19e4ad8af9d0/core/src/display_object/avm2_button.rs#L695) also tests the hit area. `EditText` uses the default [bounding-box shape test](https://github.com/ruffle-rs/ruffle/blob/bad2f8fbc6e7c1ae741b664034ad19e4ad8af9d0/core/src/display_object.rs#L2697). That source revision is independently inspected; it is not asserted to be the bundled runtime's exact build commit.

## Accepted original observation

`tools/build_title_hit_oracle.py` preserves all original non-code SWF resources and calls the original `SimpleButton.hitTestPoint` using each original DisplayObject state in a diagnostic button at (200,200). Two identical Ruffle 0.7.1 runs captured on 2026-11-02T04:48:53.124Z contain 12 snapshots and 204 point results, including transparent interior, visible-letter, outside and 0.05-pixel edge probes. Every point and reported bound matches the production helper.

- Diagnostic SWF SHA256: `e529c49d7d901dc1354f2f27d09f6a00b5a0d8b10b8f8f4063886b44761958f5`.
- Accepted record SHA256: `600ab39e479e6e1d71728462a611c41e30d115df870f853674e90bd57871b285`.
- Durable fixture: `web/tests/fixtures/original-title-hit-trace.json`.
- Raw capture and build provenance: `.build/oracle/title-hit-browser-report.json` and `.build/oracle/title-hit-build-report.json`.

The fixture also records six independently measured PNG alpha samples with file hashes. Local (80,−10) hits in every original state but has alpha zero in every Up/Over PNG. The regression test explicitly rejects the old alpha-threshold behavior. Three focused tests pass; type checking passes.

The diagnostic directly observes shape tests, not native mouse transition ordering or pixel rendering. Actual browser checks now confirm transparent-point New Game, Continue and Help input, plus an outside click that leaves the title unchanged. Continue restores both the earned town and the Day9 battle with complete-save equality. Evidence: `.build/browser-qa/day-nine-title-ui-verification.json` and `.build/browser-qa/day-nine-ui-verification.json`. Hover artwork/reset is implemented from source; a separate pixel comparison of those transitions is not claimed. Useful canvas coordinates are New Game `(265,185)`, Continue `(268,239)` and Help `(288,291)`: all are transparent in the original exported Up/Over/Down PNGs and lie inside the corresponding source rectangles. `(235,195)` is the observed outside control to the left of New Game. Settled button registrations remain `(185,195.7)`, `(187.9,249)` and `(207.9,301)`.

Regenerate the diagnostic from the repository root with `python tools/build_title_hit_oracle.py`; capture two runs using the existing oracle page with `?suite=title-hit`. From `web`, run `node --experimental-strip-types --test tests/title-hit-reference.test.ts`. Expected point results must come from a fresh original capture, not from the production helper.
