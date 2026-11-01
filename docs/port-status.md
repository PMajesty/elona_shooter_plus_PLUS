# Browser port status

Current milestone: **opening battle, ordinary and boss loot, earned Sheriff
skill choices, results and first-town Free Repair with persistence**, not a complete remake.
The browser game runs independently of Flash and Ruffle. The preserved game
remains the reference for behavior, content and appearance.

## Current goal amendments

The user amended the long-term goal on 2026-11-01: exact **30 Hz / 20 Hz rates
are optional**, unless changing them materially changes gameplay. Preserve
observable pacing, weapon cadence, reload durations, movement and enemy behavior;
the existing clocks remain a useful reference implementation. This supersedes
the literal clock-preservation wording in the goal's original stored description.
The goal remains active; its tool currently supports status changes, not editing
that original description. These amendments and the watcher carry the current
scope forward without falsely completing/recreating the goal.

The reported veteran complaint, **“hitboxes that plague ES lategame,”** is an
explicit investigation target, not yet a reproduced defect. Build controlled
late-game encounters and compare visible shapes, hit regions, overlaps,
animation phases, projectile paths and input timing. Identify the actual cause
before choosing a correction. Preserve a failing original case and a passing
port regression, document the intended gameplay difference, and proceed in
sequence rather than rushing speculative changes.

## Playable coverage

- Title, New Game, 22 appearance choices and the Sheriff starting class.
- The original `generateMission(0)` opening battle, displayed as Day 1, with
  source-derived wave, enemy, damage, critical-hit and reward calculations.
- Mouse shooting, shotgun ammunition and reload interruption, grenades, castle
  damage, pause, and battle victory / defeat screens.
- Original artwork, fonts and audio; character poses and weapon/effect layers
  reconstructed from the original Flash timeline metadata.
- Local browser saves, Continue, and validated JSON save import / export.
- Ordinary postbattle loot with original item instances, six inventory slots,
  click-to-pick/place swaps and one-time generation preserved through saves.
- Boss prizes when the opening boss was killed, followed by earned Sheriff
  skill choices with original candidate order, eligibility, descriptions and
  previews. Offers, pending choices and selected traits survive reloads.
- Once-only result settlement after all reward choices, then first-town entry
  on Day 1 with four AP. Castle Free Repair spends two AP, restores all HP,
  preserves gold and RNG, and saves the resulting town state.

Other starting classes are visible but unavailable. Full town preparation and
management, Day 2 and
later days, recruitment, equipment/shop interactions and importing original Flash
saves are not implemented. Chosen skills persist, but their effects on later
combat and town systems remain to be connected. Hidden base aiming/teamwork
rolls and growth remain unknown. Finishing the opening battle advances through
ordinary loot, earned boss loot, earned skill choices and results, then enters
the first town. This is a bounded town-action path, not complete town gameplay:
shop stock, cards, the next mission and recruits are still pending.

## Architecture

`web/src/simulation.ts` owns gameplay state separately from Phaser rendering.
`content.ts` holds the implemented source-derived definitions. The simulation
preserves two original clocks: **30 Hz frame updates** and **20 Hz timer work**.
Rendering can run at the browser's refresh rate. Pause freezes simulation work.

`main.ts` connects input, scenes, original asset rendering, audio and persistence.
`original-animation.ts` combines exported back/front layers with selected
character poses and original frame actions. Ordinary-enemy browser hit testing
uses original filled shape contours and placement matrices. Bitmap transparency
does not define the original hit regions. Bosses retain a separate alpha path;
headless simulation callers can supply their own hit-test callback.
The ordinary collision path also receives persisted shadow state: a sheep
returning from attack to walking retains the original shadow exclusion.

`items.ts` owns generated item instances and loot; `progression.ts` owns the
implemented Sheriff choices and previews. `loot-view.ts` and `skill-view.ts`
render these stages through the normal postbattle flow. The town view uses
original town, mission/castle menu and repair-dialog assets. Combat effects of new
equipment and earned traits are a separate, unfinished integration boundary.

`storage.ts` stores a versioned browser-port save in local storage. The simulation
includes its random-generator state so a restored port save can continue its own
sequence. That generator is not Flash's `Math.random()` and does not reproduce
the original game's random sequence.

Version 4 stores full generated items, boss-kill tracking, postbattle stage,
pending skill choices, known trait levels, town AP and reconstruction provenance. New
Game generates starter equipment with the ordinary gameplay RNG before mission
generation. Version 1 saves lacked item metadata; their migration uses a separate
deterministic reconstruction stream while preserving saved combat state and RNG.
Version 2 item instances remain intact. Both older versions reconstruct known
traits and infer boss-kill state with explicit provenance; hidden stats remain
absent. A legacy result that omitted boss/skill rewards resumes at the first
still-owed stage, consuming normal saved RNG once for newly generated rewards.
Subsequent current-version reloads do not reroll them. Versions 1–3 paid the
settlement early; migration reverses that advance while rewards are pending and
restores it exactly once at results, preserving the final balance. A completed
version 3 result keeps its gold and receives the missing result/AP preparation
once. Battle migration preserves combat RNG. Saves missing shadow history use
the former frame-derived rule, then persist future state changes.

Result preparation consumes the original fame draw and two Active-zero AP
draws, even though the first Sheriff gets no extra income or AP from them.
`town.preparation` remains `pending`: original `frame71` shop/card/mission/recruit
generation has not run. Entry and Free Repair add no placeholder RNG draws. Day 2
is blocked until real town preparation and equipment/skill combat effects exist.

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

The integrated suite passes 58 tests covering simulation, items, reward
transitions, migration, invalid imports and original-reference fixtures;
typecheck and the candidate release build also pass. Detailed run evidence is
recorded in `port-verification.json`. Independent original-SWF fixtures match 72 reload
snapshots and three seeded first-day generation
snapshots, plus 21 spawn and single-pellet snapshots. The point tests supply
original body/shadow classification as input and test the production damage and
critical-region rules. Separate geometry fixtures test the production contour
implementation across 19 cases / 77,824 points, including sheep attack-to-walk
history. The 157 item snapshots cover item generation, ordinary and boss loot
and starting inventory with exact RNG accounting; the earlier 139 observations
are unchanged. Nine progression cases cover three seeds and Capable levels
0/1/2, all 15 Sheriff previews, candidate order, eligibility and RNG usage.
Eleven accepted town snapshots cover six settlements (three seeds with and
without a perfect bonus) and five Free Repair/acknowledgment/repeat/guard cases.
They verify the result/AP RNG boundary and deterministic repair action, not
original full-town initialization.
Deliberate negative controls demonstrate that missing per-shell
feedback and an altered random stream are detected. The original comparisons
already exposed and corrected omitted special-loot and fly-filter random draws.

A separate automatic run exercised 96 first-day scenarios across 32 seeds and
three input policies, including 1,255 JSON save/resume checkpoints, 222 reward
transitions, 82 town actions and 121,588 simulation frames. Restored state and
events matched uninterrupted runs through ordinary loot, boss prizes, skill
choices, results and first-town repair. This
checks port stability and replay, not fidelity to unimplemented original rules.
It uses production ordinary-enemy contours; boss collision retains a documented
rectangular fallback in this headless runner.

The earlier ordinary-loot browser milestone also reached loot from a normal-play
checkpoint at tick 1658, 823 gold and 36/40 castle HP. Collecting the rat statue,
lossless swaps, page reload/Continue, corrupt-import rejection, pickup cancellation
and advancement to results were observed through ordinary UI. In that earlier
milestone, exported loot/result saves retained RNG state 2255067545 and the same
collected item metadata. The new reward stages consume their own original draws;
that older result RNG is not an expectation for the expanded reward sequence.
The checkpoint was generated by a headless aimed player; this is a transition
test, not a complete browser playthrough or original-game parity proof.

In the earlier expanded reward flow, an actual browser import of a version 2 result
resumed the boss-prize menu, then skill choices `[100, 107, 105]`. Selecting
Reloading (107) reached results with the same inventory and RNG state 91036 as
the equivalent direct version 3 route. This verifies that observed legacy
result checkpoint; it predates the version 4 result/AP draws and is not a current
final-RNG expectation. Broader save validation and rejected imports have
separate automated coverage.

The version 4 candidate was checked through the ordinary browser UI: a version 3
result migrated with its final **823 gold** unchanged. Proceed entered Day 1 town
with **4 AP and 36/40 HP**. Free Repair produced **40/40 HP, 2 AP and 823 gold**.
Any click acknowledged the original dialog; repeating repair at full HP spent
no extra AP. Exported state before and after town reload/Continue matched
exactly, including RNG state **2262752108**. An insufficient-AP checkpoint
(1 AP, 39/40 HP) displayed the original refusal and preserved AP, HP and 823 gold.
These observations cover town entry and its first action, not the
unimplemented stock, cards, recruit generation or next-day loop.

The shared HUD now applies the original XP display conversion (`exp / 10`):
175 internal XP displays as 17.5. The result table includes the perfect-game
bonus in Reward, following `renewResult`, instead of classifying it as Other.
Town foreground labels are layered above the original card artwork.

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
- Chosen Sheriff traits are saved, but their effects, equipment requirements,
  weapon changes and modifier mounting are not connected to future combat.
  Hidden base aiming/teamwork rolls and their level-up growth are not ported.
- Town supports entry, the mission/castle presentation and Free Repair only.
  The source's ordered shop, card, mission and recruit preparation, other town
  actions and upgrades remain pending. A rendered town menu is not a prepared
  next mission.
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

The contour comparison exposed and corrected early-enemy targeting that had been
too strict with alpha masks. The accepted sheep attack-to-walk case then exposed
76 false-positive hits caused by discarding shadow history; persisted state now
matches all 19 sampled grids exactly. Other animation histories, full shotgun
spread and corpse interactions remain unverified. Investigate clock ordering
when needed to explain a material pacing or behavior difference. A test-only instrumented SWF and
automatic browser runner live under `.build/oracle/`; builders and runner source
are in `tools/`. Preserve the production preview while candidates are validated.
Manually advancing original methods does not establish native timer/frame
scheduling equivalence. Record each comparison's actual boundary and limitations.

### Campaign continuation after the reference-test slice

The original victory path is Clear, normal loot, earned boss loot, earned skill
choices, financial result and town. Item instances and the mandatory first-day
reward stages now lead through results into Day 1 town, Free Repair and a saved
town state. The next useful slice is the real, ordered first-town preparation:
shop stock, cards, mission level 1, recruits and applicable entry effects, stored
once and restored without rerolling. Compare that sequence with original
`frame71`, including RNG order. The current `preparation: pending` marker keeps
this gap explicit. Equipment and chosen skills must affect combat before the
following mission is enabled; a direct result-to-Day-2 shortcut would omit that
preparation.

After those prerequisites, enable two connected days through the ordinary UI,
with rewards and equipment retained. Town prepares mission level 1 while the
displayed day is still 1; Rest increments it to 2. Guns refill between battles,
but consumable grenades do not. Compare the transitions against the preserved
game and document concrete differences before expanding content.

The prior reference-startup timeout is diagnosed: an early observer showed the
intro advancing slowly, reaching the title after 44.1 seconds and exhausting the
60-second budget during character creation. Diagnostic builds now skip only
the retired ad/intro flags while executing original game initialization. Two
identical 19-case runs completed, and the sheep `32→5` shadow-history comparison
was accepted. The first 18 original snapshots remain unchanged. This resolves
that test-runner obstacle; it does not establish a general browser scheduling
fix or reproduce the veteran late-game hitbox complaint. Provenance and before/
after comparisons are in `docs/oracle-notes.md`.
