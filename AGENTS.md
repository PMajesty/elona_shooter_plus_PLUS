# Project instructions

The current scope is a faithful browser port, authorized on 2026-11-01.
Preserve the original English UI, content, balance and observable gameplay timing.
User amendment on 2026-11-01: exact 30 Hz frame and 20 Hz timer rates are not
requirements. Keep them as reference clocks while useful; modernize scheduling
when measured movement, firing, reload and enemy behavior remain faithful.
User amendment on 2026-11-02: defer the reported late-game hitbox complaint until
core port coverage is complete. Focus on the faithful port first.
Build complete playable slices in `web/`; label incomplete coverage honestly.
User amendment on 2026-11-02: work solo, prioritize feature completeness over exact
cosmetic/audio/RNG fidelity, and use proportionate validation. Read
`docs/development-process-review.md` for the process correction. Reuse the existing
browser tab and keep testing muted. The user explicitly reauthorized recurring
work on 2026-11-02: a 30-minute continuation watcher and a three-hour workflow
meta-review watchdog. Read `docs/long-term-goal.md` for the current objective.
User amendment on 2026-11-02: never activate native fullscreen during automated
testing; it takes over the user's desktop. Keep the requested in-game fullscreen
icon for the user to operate. Do not add browser toolbars below the hotbar or
floating explanatory labels over the game. Preserve original in-game tooltips.
Use original extracted assets. Do not replace original behavior with invented
mechanics merely to make a demo work. Record intentional fixes and differences.
User amendment on 2026-11-03: finish remaining port gaps independently of DNS;
restore creation animation, improve fullscreen graphics and add an adjacent mute
button. Native fullscreen remains forbidden during automated testing.
Project checkpoint on2026-11-03: the documented v43 desktop-release boundary is
met; both recurring watchers are confirmed paused. Follow later user direction
for new work; see docs/port-status.md for the finite supported scope/differences.

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
