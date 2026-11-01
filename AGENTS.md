# Project instructions

The current scope is a faithful browser port, authorized on 2026-11-01.
Preserve the original English UI, content, balance and observable gameplay timing.
User amendment on 2026-11-01: exact 30 Hz frame and 20 Hz timer rates are not
requirements. Keep them as reference clocks while useful; modernize scheduling
when measured movement, firing, reload and enemy behavior remain faithful.
Investigate the reported late-game hitbox problems in due course. Reproduce them
in the original, distinguish defects from intended rules, and retain before/after
regressions for deliberate fixes. Do not preserve a demonstrated bug solely for
literal parity or rush a speculative hitbox redesign.
Build complete playable slices in `web/`; label incomplete coverage honestly.
Use original extracted assets. Do not replace original behavior with invented
mechanics merely to make a demo work. Record intentional fixes and differences.

For SWF compatibility changes, edit `src/shootem_fla/MainTimeline.as`. Keep `original/elonashooter1.3.swf` and
`src/original/MainTimeline.as` unchanged as recovery and comparison baselines.
Use `python tools/build.py` to rebuild and validate non-code resource preservation.
Do not commit `.tools/`, `.build/`, credentials, runtime caches or unrelated games.

Read `README.md` and `docs/verification.json` before changing the startup path.
Validate the actual New Game flow in Ruffle after startup changes. A successful
compiler return alone does not prove gameplay initialization completed.

For the browser port, validate the actual New Game, combat, results and save/load
flows in a browser. Keep simulation independent of rendering. Measure behavior
against the preserved game before claiming parity. Read `docs/port-status.md`
for current port coverage and known differences when that file exists.

Use English working notes and Russian explanatory code comments.
