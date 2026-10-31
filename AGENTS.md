# Project instructions

The current scope is the game-start fix only. Preserve the original English UI
and balance; add features or localization only when the user requests them.

Edit `src/shootem_fla/MainTimeline.as`. Keep `original/elonashooter1.3.swf` and
`src/original/MainTimeline.as` unchanged as recovery and comparison baselines.
Use `python tools/build.py` to rebuild and validate non-code resource preservation.
Do not commit `.tools/`, `.build/`, credentials, runtime caches or unrelated games.

Read `README.md` and `docs/verification.json` before changing the startup path.
Validate the actual New Game flow in Ruffle after startup changes. A successful
compiler return alone does not prove gameplay initialization completed.

Use English working notes and Russian explanatory code comments.
