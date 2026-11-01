# Browser port status

Current milestone: **a first playable opening-battle slice**, not a complete remake.
The browser game runs independently of Flash and Ruffle. The preserved game
remains the reference for behavior, content and appearance.

## Playable coverage

- Title, New Game, 22 appearance choices and the Sheriff starting class.
- The original `generateMission(0)` opening battle, displayed as Day 1, with
  source-derived wave, enemy, damage, critical-hit and reward calculations.
- Mouse shooting, shotgun ammunition and reload interruption, grenades, castle
  damage, pause, and battle victory / defeat screens.
- Original artwork, fonts and audio; character poses and weapon/effect layers
  reconstructed from the original Flash timeline metadata.
- Local browser saves, Continue, and validated JSON save import / export.

Other starting classes are visible but unavailable. Town management, advancing
to later days, recruitment, equipment/shop interactions, the complete skill and
loot systems, and importing original Flash saves are not implemented. Finishing
the opening battle saves its result and returns to the title; it does not begin
a complete campaign.

## Architecture

`web/src/simulation.ts` owns gameplay state separately from Phaser rendering.
`content.ts` holds the implemented source-derived definitions. The simulation
preserves two original clocks: **30 Hz frame updates** and **20 Hz timer work**.
Rendering can run at the browser's refresh rate. Pause freezes simulation work.

`main.ts` connects input, scenes, original asset rendering, audio and persistence.
`original-animation.ts` combines exported back/front layers with selected
character poses and original frame actions. Browser hit testing samples exported
alpha masks, including the original shadow exclusions; headless simulation
callers can supply their own hit-test callback.

`storage.ts` stores a versioned browser-port save in local storage. The simulation
includes its random-generator state so a restored port save can continue its own
sequence. That generator is not Flash's `Math.random()` and does not reproduce
the original game's random sequence.

`tools/extract_web_assets.py` extracts selected assets from the preserved SWF,
packages atlases and records registration offsets. It also calls
`tools/extract_animation_metadata.py` for actions and character transforms that
a static FFDec render cannot execute. Source exports and derived SWFs stay in
ignored `.build/`. Runtime files are under `web/public/assets/`.

The production build is static HTML, JavaScript and assets in `web/dist/`, with
relative URLs for deployment beneath a website subdirectory. Phaser is bundled;
the playable client does not depend on a Flash plugin or an external asset CDN.

## Evidence and remaining uncertainty

Observed browser checks include New Game reaching combat with five shells and
no accidental shot, a real click causing damage and consuming one shell, and
pause leaving the simulation tick unchanged. Continue restored appearance 6 and
saved state. A prepared near-victory checkpoint reached victory at tick 1668
with 989 gold, 40 castle HP, five shells, level 2 and 175 XP. This checkpoint
check verifies the completion path; it is not evidence of an entire manually
played campaign or complete Flash parity.

The exported victory JSON contained that result, and a page reload followed by
Continue restored it. A near-defeat checkpoint reached defeat at tick 542 and
castle HP -3, showed the original skull and returned to the title. Pressing 2
consumed one grenade, reducing the quantity from five to four. An invalid import
was rejected without changing the paused state at tick 880, four shells and
32 castle HP.

After the final input fixes, Continue retained three shells without firing;
pressing Space after cooldown replenished them to five. The production bundle
also loaded under `/elona/` and reached combat through New Game and Proceed,
with enemies visibly spawning and no observed console errors.

The latest ordinary regression run passed 19 tests. Independent original-SWF
fixtures match 72 reload snapshots and three seeded first-day generation
snapshots, plus 21 spawn and single-pellet snapshots. The point tests supply
original body/shadow classification as input and test the production damage and
critical-region rules; alpha-mask geometry is not validated by that adapter.
Deliberate negative controls demonstrate that missing per-shell
feedback and an altered random stream are detected. The original comparisons
already exposed and corrected omitted special-loot and fly-filter random draws.

A separate automatic run exercised 96 first-day scenarios across 32 seeds and
three input policies, including 957 JSON save/resume checkpoints and 122,812
simulation frames. Restored state and events matched uninterrupted runs. This
checks port stability and replay, not fidelity to unimplemented original rules.

Browser checks also cover manual reload animation restarts, Space resuming pause,
and original boss health bars at full, half and zero HP. Character-body textures
now use nearest sampling to match the original non-smoothed bitmap fills;
fractional animation positions are retained. Other sources of blur and complete
visual parity still require matched reference captures.

These checks do not establish exact native frame/timer ordering, reload
wall-clock timing or comparative performance. Detailed acceptance evidence is
recorded separately in `port-verification.json`. The
older `verification.json` and `build-verification.json` describe the preserved
SWF startup fix, not browser-port completeness.

Known limits:

- Rasterized Flash exports can differ from Flash/Ruffle filtering, text and
  subpixel rendering. Not every animation or effect has been compared live.
- Dynamic UI placement, hit-mask edges, animation timing and VFX parity remain
  partially verified. Static asset preservation does not prove identical play.
- The implementation covers one class and one mission. Definitions present in
  an atlas or source table do not imply the corresponding full feature works.
- Save migration currently accepts the browser-port format only. Browser storage
  is local to the site and browser profile; exported files provide portability.
- No comparative performance benchmark establishes an improvement over Flash or
  Ruffle yet. Browser compatibility beyond the exercised environment remains to
  be checked.

## Next integrated slice

The user authorized continuous goal work and a 30-minute watcher on 2026-11-01.
The native goal remains active; automation `elona-shooter-faithful-port-watcher`
is attached to the same chat. Routine unchanged watcher checks stay quiet.

Reload, wave-generation, spawn and controlled single-pellet comparisons are
established. The latter exposed missing SENSE and critical-kill sound-selection
draws, which changed later drops, and a floating-point difference caused by
omitting the original speed multiplication/division. These are corrected in the
ordinary simulation; critical kills also play the selected original voice line.
The initial living sister is assumed until sister damage is ported.

Next combat checks should address actual alpha-mask versus vector geometry,
full shotgun spread and corpse/animation interactions, followed by native clock
ordering. A test-only instrumented SWF and
automatic browser runner live under `.build/oracle/`; builders and runner source
are in `tools/`. Preserve the production preview while candidates are validated.
Manually advancing original methods does not establish native timer/frame
scheduling equivalence. Record each comparison's actual boundary and limitations.

### Campaign continuation after the reference-test slice

The original victory path is Clear, normal loot, earned boss loot, earned skill
choices, financial result and town. Implement item instances/inventory and these
mandatory rewards before activating Day 2. A direct result-to-Day-2 shortcut
would discard progression. The next useful campaign milestone is collecting or
leaving real prizes, making earned Sheriff skill choices, reaching town, using
Free Repair and saving/reloading that state. Equipment and chosen skills must
affect combat before the following mission is enabled.

The following slice should allow two connected days through the ordinary UI,
with rewards and equipment retained. Town prepares mission level 1 while the
displayed day is still 1; Rest increments it to 2. Guns refill between battles,
but consumable grenades do not. Compare the transitions against the preserved
game and document concrete differences before expanding content.
