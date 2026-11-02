# Browser port status

Updated 2026-11-02. Current local build: **v38, remaining medal milestones and Museum hints**.
[Play locally](http://127.0.0.1:5175/elona/). This is an incomplete remake.

## Current coverage

All eight original hero classes are connected to ordinary New Game, equipment,
skill choices, growth, combat and saves. Rogue/Hunter start with Little Girl;
Militia has its starting weapons and periodic grenade. Sniper, Ranger, Duelist
and Noble unlock through the four original level10 class medals. Sniper's idle
charge, Ranger's party rampage, Duelist's frenzy and Noble's passive bonuses work
in combat. The first three use the original adrenaline bar artwork.

A separate browser medal collection survives New Game, carries earned medals
forward and supplies original starting gold, traits, inventory/fame and Gravity
Gun bonuses. Current exports include both the adventure and collection; importing
one restores that snapshot. Legacy exports merge earned medals into the current
collection. Continue preserves it. Corrupt collection storage does not prevent
loading a valid adventure; invalid explicit imports leave the running game intact.

Repeating encounter cycles are connected, including all19 enemy kinds,
later bosses, shields/rage/rockets, bird-dropped rats and extracted animation attack
frames. Manual/automatic reload, firearms, bows, projectiles, consumables, boss
health bars, ordinary/boss loot, skills, results, towns and Rest are playable.
The original fixed-level cycle controls enemy selection while calendar level
controls power, rewards and boss counts. Every40 levels adds200 strength: ordinary
enemy HP/attack and movement speed scale by their source formulas. After Day40,
the original5% roll can produce eligible enemies at1.25 size, triple HP, slower
speed and double XP/gold. Original unscaled weak-point rectangles are retained.
The browser save safety boundary is Day1000, not an original campaign ending.
F now toggles the hero's Fire at will mode. It shares original party target
selection, aiming/workrate, boss/defense priority, AI firing delay, accuracy penalty
and reload behavior. It uses the selected inventory gun and preserves hero kill/XP,
projectile ownership and class meters. Mouse input can cancel manual reload or
trigger a shot at the AI target. The original Sister line/rage artwork indicates
the mode. Saves retain its target/counters and Continue remains paused; Rest starts
the next battle in manual mode. Earlier saves migrate without AI fields/RNG draws.
Source: KeyDown (13190), onEnterFrame (2338), shoot (7812–7883), refreshPlayer (4655).
Ragnarok now uses the ordinary inventory controls: its artifact is consumed,
30 real dinosaur spawns are attempted and the next spawn timer gains200 ticks.
Winning the battle awards medal92, including its wage reduction and future-start
Luck bonus. The battle flag survives saves and resets at Rest for the next mission.
Casual and Hardcore are selectable on New Game and remain exclusive. Casual uses
source encounter power,35% more kill XP and lower taxes. Hardcore uses normal
combat, removes the browser adventure save at battle start and permits saving,
export and Continue only in town. Medal collection and separate mode day records
persist independently; Hardcore medals are awarded at original day20/40/80 boundaries.
All seven original Game MODs are selectable in the original options panel: boss
MOD drops, Intense Start, weapon-level limits, Skip hard waves, Tighter crosshair,
Laptop difficulty and Community Compilation. Their combat, loot, town and saved
state effects are connected. MOD sale days now repeat every10 days as in source;
Community Compilation retains the sale for refreshes on that day.

Carry Over is connected to the defeat screen from Day2 outside Hardcore. The first
use asks the original confirmation; later retries are direct. It restores the full
town snapshot taken before Rest, adds the hero's battle earnings (minimum200 GP)
and1 AP, and applies the original medal restrictions. Earned medals remain in the
independent collection. The town snapshot travels with battle exports/Continue;
repeated retries do not nest snapshots. Earlier battle saves have no town history,
so Carry Over becomes available after their next Rest.

Town coverage includes shop buy/sell, upgrades/MOD mounting, permanent companions
with equipment/orders/AI/growth/wages, temporary Mission Hire, both Castle pages,
repair, Smith stock, Museum income, chickens/eggs, Sister bombs, Villa/Party and
Sp.Trainer training. Prayer, Dinner, Taunt, searches and paid shop/recruit refreshes
apply their source effects. Searches retain their own saved random sequence.
Both original Museum medal pages show all38 English descriptions and earned states;
visitor robbery, action-medal AP bonuses and class/day/perfect-day medals work.
Survival medals now cover all six source boundaries: days10/20/35/50/80/150.
Museum visits check both Hard Badge (25 medals) and Impossible Badge (current
Hardcore Day100 or a saved Hardcore record of100), including cross-slot records.
The collection supplies all cumulative starting-gold bonuses and Impossible
Badge's20 starting Fame. The original Kongregate banner awards medal91 on a user
click. Museum descriptions now use the original fixed hint1657 artwork/fields;
locked medals show the original requirement and ???? bonus. This corrects descriptions
being sent only to the hidden page status. No save format or RNG changes were needed.
Source: startBattleMedal6732, museumMedal1101, kongregateLink1623, updateMedals5635.
Equipment's original Recycle Gun and Charge Item buttons are connected with their
selection prompt, eligible-slot dimming and cancellation. Recycle costs5 AP and
replaces an owned gun with a random MOD using value/2+250; Charge Item costs3 AP
and fills eligible usable-item ammo. Neither spends gold. Ten recycles award Gun
Mania outside Carry Over; its +15% MOD efficiency reaches hero/companion/loot
mounting, upgrades, living-weapon growth and generated weapons. The optional
recycle counter is saved; earlier saves migrate without adding a counter or RNG draws.
Source: invDrag (2900), menu_equip input (13683), actionMedal (5474).
Claim title supports all eight promotions through King, on days6/11/16/26/41/61/
81/101, with salaries100/200/400/700/1000/1500/2000/3000 GP. Delayed claims advance
one rank per4 AP; the new salary pays from the next settlement. Mission availability,
original event text and the character panel use the same rank. This extends the
existing numeric title field without changing the save format or earlier saves.
Source: MainTimeline.newTitle (9752), titleList (9247), claim dialog (10632).

Original assets, English UI and credits remain. Sound starts muted unless the user
enabled it. Browser testing reuses a tab when available and keeps it muted. Eight
browser slots use the original title-screen ComboBox skin/placement and trash
button. Selection persists; New Game, Continue, saves and JSON import/export use
the selected slot. Existing single saves remain under their original key as slot1,
without copying or rewriting them. Deletion uses the original confirmation and
marks only that adventure empty; the shared medal collection/day records remain.
Hardcore clears only its active adventure slot. Each JSON export holds one run
and the shared collection, not every slot. Imported/continued battles open paused.
The browser page now contains only the centered game on black. The surrounding
heading, instructions, feature list and footer are removed. The requested fullscreen
icon stays in the top-right corner for manual use. The added bottom toolbar and
floating explanation overlays were removed after user feedback. Original item/skill
tooltips remain. Ctrl+S saves; Ctrl+Shift+S/O exports/imports JSON; Ctrl+Shift+M
toggles mute. Desktop keeps native620×380 size; smaller windows shrink proportionally.
Never activate native fullscreen in testing: it takes over the user's desktop.

Help now opens over the title or paused battle without creating a new simulation.
All four original pages (Basic, Battle, Town, Credits),13 English tips and9 credits
links are extracted from the source. Tips support wheel/keyboard scrolling,
arrow buttons, track clicks and thumb dragging with the original component skins.
Esc/outside click returns to the underlying screen; Space cannot resume combat
under help.
Source: window frames162–165; insertHelp (4598), procHelp (7482), procLink (8698).

The original Statistics & Options menu replaces the temporary pause panel in
combat, town and results. Original Menu/Mute icons, Help, Save Game, statistics,
quit confirmation and all six English option controls are connected. Settings
control player/NPC damage numbers, nearest-pixel rendering, fireworks, original
color-blind crosshair and screen flashes. Non-default options are saved beside
the simulation; old/default envelopes remain unchanged. Mute remains independent.
Original firework launch/particle clips run on results with a separate decorative
random stream;651 unpaused presentation frames award Ha-na-bi. Source startFire
uses48 bursts or60 with medal65; Ha-na-bi's advertised +25 has no check there.
Source: pauseMenu/endPauseMenu, optionwindow_222, enemy.damage, startFire/fireWork1.

## Validation and limits

- **520 tests passed**, with typechecking and production build passing. Latest
  bundle: assets/index-Dd2iyTt7.js. Slot checks cover unchanged legacy storage,
  eight independent adventures, selection persistence, shared medals/mute,
  deletion/tombstones, Hardcore isolation, corrupt data and failed writes.
  Existing deterministic checks cover classes, campaign, equipment services,
  medal efficiency, modes/MODs, town economy, titles, Carry Over and JSON replay.
  Legacy loot generation treats a not-yet-initialized medal collection as empty
  during migration; it does not consume extra RNG to reconstruct that field.
  The new help-content check compares every tip/link with the preserved source.
  Two Python extraction regressions also pass: matrix-only PlaceObject2 moves must
  retain the earlier PlaceObject3 format/filters. Losing that format broke credits
  artwork extraction; the corrected exporter produces the original page.
  Seven Fire at will checks cover autonomous shots/reload/kills, AI/manual JSON
  replay, bows, class meters, selected-slot projectile ownership, reload cancellation,
  new-mission reset, v37 migration and invalid/missing AI targets.
  Five presentation checks cover defaults/JSON validation, independent damage
  channels, original statistics, deterministic48/60-burst plans and Ha-na-bi
  eligibility/persistence, including Carry Over. Presentation does not draw combat RNG.
  Six further medal checks cover every survival threshold, ordinary Rest into
  Day150 with JSON replay, cumulative starting gold, both Impossible Badge paths,
  starting Fame, invalid records, Carry Over and the idempotent website medal.
- The controlled full40-day campaign completed in96494 simulation frames, with
  all19 enemy kinds, rewards, towns and save boundaries. Its changed frame count
  follows the repeating MOD-sale correction and resulting generation RNG. Strong
  test gear removes difficulty as an obstacle; this is not a balance claim.
- Existing checks cover all eight heroes through two natural opening battles;
  controlled Day40/80 cycle crossings; later formulas/Day1000 henchman; economy,
  search, hire, Museum, projectiles, Ragnarok and Casual/Hardcore. Ragnarok and
  later-cycle survival tests use controlled gear/HP. Original comparison cases
  still pass for unchanged defaults. Seeded repeatability is distinct from parity.
- The muted V35 browser check opened the extracted original MOD panel, toggled an
  option, verified Back/reset, enabled all seven and started an actual battle with
  1175 opening power. Continue retained its entire envelope using observed pointer
  coordinates as input. No console errors. Evidence:
  .build/browser-qa/game-mods-verification.json and game-mods.png.
- The muted V36 browser check verified Carry Over Cancel preserves the entire
  envelope, Yes restores the exact expected town, Rest captures it and Continue
  preserves the battle and checkpoint. Recursive checkpoint import was refused
  without changing the active envelope. No console errors. Evidence:
  .build/browser-qa/carry-over-verification.json and carry-over-confirmation.png.
- The muted title browser check claimed King in a controlled Day101 town and
  verified the original dialog,3000 GP salary and character title. Export changed
  only rank/AP; Continue retained the entire envelope. Evidence:
  .build/browser-qa/titles-verification.json and title-king.png. No console errors.
- The revised game-only page was checked muted in the existing tab: bottom toolbar
  absent, explanation overlay removed, fullscreen icon visible without activation,
  working keyboard backup and exact full-envelope preservation of the user's save.
  No console errors. Screenshot: .build/browser-qa/no-extra-toolbar.png.
- The muted V37 browser check used the original Equipment controls: Cancel retained
  the full envelope, Recycle awarded the tenth-use medal and Charge Item refilled
  a grenade stack. Exported states matched the expected simulation; Continue
  preserved the complete result. No console errors or fullscreen activation.
  Evidence: .build/browser-qa/equipment-services-verification.json and
  equipment-recycle-selection.png. The user's full adventure/collection was restored.
- The muted slot browser check created a real New Game in empty slot8 while slot1
  remained intact, verified exact-envelope Cancel, selection persistence and
  Continue of slot8, then deleted only that disposable run and resumed slot1.
  Both continued exports matched their complete saved envelopes. No console
  errors/fullscreen activation. Evidence: .build/browser-qa/save-slots-verification.json,
  save-slots-dropdown.png and save-slot-delete-confirmation.png.
- The muted help browser check opened all four pages from the title, reached the
  final tip, used wheel/arrows/thumb dragging, then opened help from paused Continue.
  Space left combat paused at tick674; Esc returned to pause. Full exported
  envelopes before/after both flows matched exactly. No console errors/fullscreen.
  Evidence: .build/browser-qa/help-verification.json and original-help-basic.png.
- The muted F browser check used disposable slot8: one press enabled the original
  indicator,820 frames produced9 kills without firing input, and Continue retained
  the complete exported envelope. One F press returned to manual; F was ignored
  while paused. Testing exposed repeated queued keyboard delivery in a hidden tab
  (F toggled twice; Escape later resumed). Combat shortcuts now use direct DOM key
  events, ignore repeats/modifiers and remained stable in the subsequent check.
  The test run was deleted; slot1's adventure/profile matched its backup except the
  two v37→v38 version fields. No console errors or fullscreen activation. Evidence:
  .build/browser-qa/fire-at-will-verification.json and fire-at-will.png.
- Earlier browser evidence covers reload/combat/results/town, activities, hires,
  Museum, class unlocks, Ragnarok and both difficulty modes. Hardcore battle export
  is refused and Continue has no battle save; its town checkpoint loads and Rest
  works. These records remain useful for unchanged paths, without repeating all
  UI flows at every checkpoint.
- The muted pause/options browser check used slot8: all six toggles changed only
  the optional settings field, the color-blind cursor reached frame3, and Continue
  retained the complete envelope. Quit Cancel and invalid-options import retained
  their complete envelopes. Controlled town/results saves verified original Menu,
  Save, Help, quit handling, fireworks disable/re-enable and Ha-na-bi without RNG
  changes. The test slot was deleted and the user's complete adventure/profile
  restored exactly, including removal of the test medal. No console errors or
  fullscreen activation. Evidence: .build/browser-qa/pause-options-verification.json,
  original-pause-options.png and original-fireworks.png.
- The user's original Sheriff adventure and collection were restored with full
  exported-envelope equality after migration: day1, tick674, RNG1744019180, HP40,
  gold209, paused/muted. No test MODs, unlocks or records remain.
- The muted medal check used slot8 and a controlled Normal-mode town with a saved
  Hardcore record of100. A Museum visit changed only medal87 in the adventure and
  collection, Continue retained the whole envelope, and a real New Game started
  with20 Fame. Original earned/locked hint panels were visibly checked; no external
  link was opened. The test slot was deleted and the user's whole envelope restored
  exactly, with no test medals or records left. No console errors/fullscreen.
  Evidence: .build/browser-qa/medal-completion-verification.json and original-medal-hint.png.

Current evidence does not establish whole-game parity, native Flash timing, full
pixel/contour parity or a measured performance advantage. Historical details are
in Git and [historical verification](port-verification.json). The Codex app crash
stopped the preview; it was recovered at the same URL. Recovery does not establish
that the app's crash cause was fixed.

## Remaining features and differences

1. Long-session stability/performance and difficulty evidence beyond the first
   cycle; the current Day1000 save safety boundary remains an intentional limit.
2. All38 defined medal award paths are connected; award-notification presentation
   remains partial. Preserve source bonus discrepancies: Kongregate advertises a
   wage discount, but wage3610 checks Ragnarok92; medal91 does not add another
   discount. Ha-na-bi's advertised firework bonus likewise differs from startFire.
3. Flash save conversion. The browser dropdown displays all eight choices at once,
   rather than the original ComboBox's five-row scrolling list.
4. Measured performance, rendering sharpness and remaining visual/audio details:
   camera shake, decorative boss reticle, some ranged spell effects/frame sounds,
   rage art, Chain Gun interruption timing and raster/filter/subpixel differences.
   Firework timing/tint/audio and screen flashes approximate the Flash presentation;
   low quality uses nearest filtering/pixel rounding rather than rerasterizing
   original vectors. The right pause panel shifts50px left and statistics panel15px
   up to fit620×380. Statistics
   uses wheel scrolling instead of a native Flash TextArea scrollbar. Normal-mode
   browser checkpoints remain available during combat/results; Flash's Save Game
   button was town-only. The medal93 bonus text/source-count discrepancy is preserved.
   Help's dynamic TextArea uses canvas cropping/scrolling in place of Flash's native
   component; external credits retain their original URLs, whose availability is unverified.
   The pause statistics' total-kill label still uses the current battle counter;
   a lifetime counter is not yet recorded. External Museum link availability is unverified.
5. Separate static castle Sister damage/death interactions. Bird-rat falling
   motion is approximate; later enemy hit regions use rendered alpha. Town/search/
   robbery outcomes use concise English messages rather than all original modals.
   Searching preserves the source's ineffective Trouble HP expression.
6. The veteran late-game hitbox complaint remains unreproduced and **deferred
   until core coverage is complete**. Prior contour/projectile corrections are
   not its diagnosis.

Source audit corrected the event-card inventory: generateCard/cardEvent and their
five saved negative card records remain in the preserved source, but no reachable
player action that reveals those cards or enables cardCount was found. The actual
Mission board uses actList's activities, already connected here. These dormant
functions are not treated as missing normal gameplay without contrary evidence;
the generated records and their RNG draws remain preserved.

Alternative-start audit: optionAltStart is initialized to0 and never assigned a
different value in the preserved source; no player control was found. Its debug
branches are not treated as missing normal gameplay without contrary evidence.
Carry Over is reachable and has been implemented separately.

Save-slot audit corrected the earlier six-slot inventory: init creates six empty
names, but the title sets maxSave=8 (2598); updateSaveSlot (10082) fills all eight.
The port follows the title behavior, shared medal index and original deletion prompt.

## Working direction

Follow the [process review](development-process-review.md) and
[current objective](long-term-goal.md): work solo, deliver complete systems, favor
feature coverage over cosmetic/audio/RNG matching and keep validation proportionate.
Exact30Hz/20Hz rates are optional when observable gameplay remains faithful.
The 30-minute continuation watcher and three-hour workflow review remain active.
The user cleared the native app goal; do not recreate it without a new request.
