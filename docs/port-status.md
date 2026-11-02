# Browser port status

Updated 2026-11-02. Current local build: **v38, persistent lifetime kill statistics**.
[Play locally](http://127.0.0.1:5175/elona/). This is an incomplete remake.

## Current coverage

All eight original hero classes are connected to ordinary New Game, equipment,
skill choices, growth, combat and saves. Rogue/Hunter start with Little Girl;
Militia has its starting weapons and periodic grenade. Sniper, Ranger, Duelist
and Noble unlock through the four original level10 class medals. Sniper's idle
charge, Ranger's party rampage, Duelist's frenzy and Noble's passive bonuses work
in combat. The first three use the original adrenaline bar artwork.

The hero's original Barrack controls are connected: focus an owned non-base skill,
choose Hero Mode or any of seven AI orders, and set Boss/Defend priorities.
The focused skill receives the source 50% first-choice check when eligible. The
manual-only placeholder and disabled controls are removed. Saved preferences
cost no AP/gold/RNG; Rest preserves them and resets the separate F flag. Autonomous
orders use the existing party AI, aiming cursor, firing/reload/class meters and
selected hero weapon. Mouse firing is ignored in these orders as in source;
F remains a separate indicator/toggle. Hero Mode restores manual combat. Old saves
retain implicit manual/unfocused defaults without migration draws or new fields.
Source: updateCharaMenu10235, orderClick13051, listTrait2 (11881), battle
initialization1571, mouseDownFunc12104 and weapon5453.

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
the next battle with F off, following the saved town order. Earlier saves migrate without AI fields/RNG draws.
Source: KeyDown (13190), onEnterFrame (2338), shoot (7812–7883), refreshPlayer (4655).
The static castle Sister now uses her original damage, critical-kill cheering and
death artwork/timelines. Ordinary hero/companion hitscan can kill her, including
her original shadow contour; projectiles do not use that hitscan-only check.
Unblocked castle damage triggers her reaction while she is free/alive. Death
stops cheering and its voice-selection RNG draw, without removing critical-kill
credit or adding a penalty/reward. Her optional saved frame/free/dead state replays
deterministically; older saves retain their implicit living Sister unchanged.
Rest revives her for the new battle. Collision uses extracted source contours in
both headless simulation and browser, independently of rendering.
Source: shoot8116, damageCastle10938, enemy.damage, sister_37 frame scripts.
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
Town activities now show the original event window, card artwork and complete
English narratives: all six activities, all18 search families and their talent/gift
variants, first/repeated robbery, shop/recruit refreshes and Mission Hire. Rest,
Free Repair and title events share the same source renderer. Outcomes are saved
when applied; dismissing the notice spends nothing and consumes no RNG. Escape,
Space or Enter can dismiss a notice without pausing the town underneath it.
Source: showEventDialog, search/searchProc and procEventDialog; window2437/card2336.
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
New awards now use the original infoPop artwork, English announcement and sound.
Its ten slots retain source battle/town positions and alpha/movement frames,
release their slot at139 and disappear at150. Notifications survive town redraws,
consume no RNG and are transient; Continue/import suppress already-owned awards.
Source: getMedal10511, popInfo5748 and infoPop2291 frame scripts.
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
Statistics now retain hero/companion enemy kills across days. Rest records the
finished battle once; Carry Over restores the town's count and discards kills from
the failed attempt. The optional history travels with saves without changing
combat RNG. Old Day1 saves retain exact totals and unchanged envelopes; older
Day2+ saves display a lower bound ("at least") because prior kills were not stored.
Source: game.totalKill initialization9233, enemy.damage and pauseMenu8799.
Original firework launch/particle clips run on results with a separate decorative
random stream;651 unpaused presentation frames award Ha-na-bi. Source startFire
uses48 bursts or60 with medal65; Ha-na-bi's advertised +25 has no check there.
Source: pauseMenu/endPauseMenu, optionwindow_222, enemy.damage, startFire/fireWork1.

Ctrl+Shift+O also accepts the original elonas_idx.sol SharedObject. A native-art
preview confirms merging known medals and maximum Normal/Hardcore/Casual records;
it preserves adventures, slot selection, mute and options. New Games receive
imported class unlocks and bonuses; existing adventures retain their saved medal
set. Unknown flags (including the undefined Beta90) are reported/ignored. Adventure
files elonas0–7.sol remain unsupported and are refused visibly. No save format
change was needed. The bounded reader supports the AMF3 primitive/object/array
types used by the index, including sparse arrays and string/object/trait references.
Other encodings/types fail before storage changes. Source: saveIndex10961/loadIndex7052.

## Validation and limits

- **551 tests passed**, with typechecking and production build passing. Latest
  bundle: assets/index-D7lMl7Ks.js. Slot checks cover unchanged legacy storage,
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
  Six Sister checks cover source contours, hero/companion hitscan, projectile
  exclusion, damage/cheer interruption, protection/Defender, death RNG, JSON replay,
  old/corrupt saves and revival at Rest.
  Six Flash import checks cover two independent Ruffle SOL samples, source-schema
  collection conversion, references, Unicode, dense/sparse flags, signed/double
  values, non-destructive/idempotent merging, bonuses/JSON replay, and invalid or
  oversized files/records/references. The Elona index test is controlled data;
  no actual player's Flash collection has yet been supplied/verified.
  Eight hero-control checks cover free/idempotent town mutations and refusals,
  focus through skill rewards, accepted orders and air-only targeting, F separation
  and original accuracy penalties, Sniper/Militia JSON replay, manual-mode reset,
  preserved defaults and corrupt/missing state. Existing party AI tests cover the
  shared targeting routines; unchanged full campaigns were not replayed.
  Three town-event content checks compare fixed English text, activity cards/titles
  and robbery amounts with the preserved ActionScript, including JSON round trips.
  The existing18 deterministic search cases also check source narrative prefixes.
  Four medal-notice checks cover original text/layout, idempotence, slot overflow,
  frame139/150 reuse/removal, shared/saved award suppression and unchanged JSON/RNG.
  Four lifetime-kill checks cover real hero/NPC kills, corpse/bomb exclusions,
  repeated Rest/Carry Over, JSON replay, legacy lower bounds, RNG independence and
  malformed/unsafe history values.
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
- The muted Sister browser check used empty slot8: actual New Game rendered the
  separate living sprite, a controlled ordinary shot killed her, animation stopped
  at source frame72, and Continue retained the complete exported envelope. The test
  slot was deleted; slot1 and the shared collection matched their fresh backup
  exactly. No console errors/fullscreen. The first targeted background regeneration
  passed the whole timeline instead of its selected frame, producing a black scene;
  browser inspection caught it and the corrected export was rebuilt/verified.
  Evidence: .build/browser-qa/castle-sister-verification.json and castle-sister-dead.png.

- The muted Flash import check used a controlled source-schema index. Cancel and
  an unsupported adventure retained the user's complete envelope; Space left the
  preview paused. Confirm changed only the shared profile, and an actual New Game
  selected unlocked Sniper with500 GP/20 Fame. Continue retained its whole envelope.
  The disposable slot8 was deleted and the user's complete adventure/collection
  restored exactly. No console errors/fullscreen. A browser-tool deadline occurred
  after the import action; inspection confirmed success without repeating it.
  Evidence: .build/browser-qa/flash-collection-verification.json, flash-collection-preview.png
  and flash-import-unlocks.png.

- The muted hero-control browser check used slot8 and a controlled town/weapon.
  Original skill/order/checkbox clicks changed only hero preferences (Fury focus,
  Always fire at will, Boss/Defend off), with exact town-envelope Continue. Rest
  started autonomous Day2 with F off. Without firing input, it won with27 kills
  in1572 frames and reached loot/level-up; the battle used200 attack/10000 accuracy
  test gear, so this is not difficulty evidence. Its whole outcome envelope survived
  Continue, and Fury2 appeared among the real level-up offers. The test slot was
  deleted and the user's whole adventure/profile restored exactly. No console
  errors/fullscreen. Evidence: .build/browser-qa/hero-town-controls-verification.json
  and hero-town-controls.png.

- The muted town-event check used slot8: Prayer, Search, New Goods, visitor robbery
  and Rest displayed original cards/text. Prayer and stock-refresh dismissal left
  the entire exported envelopes unchanged; Continue retained the complete town
  after robbery. Rest started Day2 combat, then Escape paused it. The disposable
  run was deleted and the user's whole adventure/collection restored exactly.
  No console errors or fullscreen activation. Evidence:
  .build/browser-qa/town-events-verification.json, original-town-prayer.png and
  original-town-new-goods.png. Unchanged campaigns were not replayed.

- The muted medal-notice check earned Prayer from a controlled14-prayer town in
  slot8. The original notification appeared above the event card, survived its
  dismissal, then expired. Dismissal and Continue preserved the entire exported
  envelope; Continue did not announce saved medals. The disposable run was deleted
  and the user's full adventure/collection restored exactly. No console errors or
  fullscreen activation. Evidence: .build/browser-qa/medal-notices-verification.json
  and original-medal-award.png. Asset loading exceeded the browser tool's wait
  deadline on two reloads but completed without another reload or a game error.

- The muted lifetime-kill check used a controlled seven-kill Day1 town in slot8.
  Rest started Day2 with zero current kills; the original Statistics panel still
  displayed seven total kills. Save/Return to Title/Continue preserved the full
  envelope, reusing loaded assets. The test run was deleted and the user's whole
  adventure/collection restored exactly. No console errors or fullscreen.
  Evidence: .build/browser-qa/kill-history-verification.json and lifetime-kills.png.

Current evidence does not establish whole-game parity, native Flash timing, full
pixel/contour parity or a measured performance advantage. Historical details are
in Git and [historical verification](port-verification.json). The Codex app crash
stopped the preview; it was recovered at the same URL. Recovery does not establish
that the app's crash cause was fixed.

## Remaining features and differences

1. Long-session stability/performance and difficulty evidence beyond the first
   cycle; the current Day1000 save safety boundary remains an intentional limit.
2. All38 defined medal award paths and award notifications are connected. Preserve
   source bonus discrepancies: Kongregate advertises a
   wage discount, but wage3610 checks Ragnarok92; medal91 does not add another
   discount. Ha-na-bi's advertised firework bonus likewise differs from startFire.
3. Flash adventure conversion; medal/index import is implemented. The browser dropdown displays all eight choices at once,
   rather than the original ComboBox's five-row scrolling list.
4. Measured performance, rendering sharpness and remaining visual/audio details:
   camera shake, decorative boss reticle, some ranged spell effects/frame sounds,
   rage art, Chain Gun interruption timing and raster/filter/subpixel differences.
   Firework timing/tint/audio and screen flashes approximate the Flash presentation;
   medal notification glow/filter transitions are approximate.
   Low quality uses nearest filtering/pixel rounding rather than rerasterizing
   original vectors. The right pause panel shifts50px left and statistics panel15px
   up to fit620×380. Statistics
   uses wheel scrolling instead of a native Flash TextArea scrollbar. Normal-mode
   browser checkpoints remain available during combat/results; Flash's Save Game
   button was town-only. The medal93 bonus text/source-count discrepancy is preserved.
   Help's dynamic TextArea uses canvas cropping/scrolling in place of Flash's native
   component; external credits retain their original URLs, whose availability is unverified.
   External Museum link availability is unverified. Older Day2+ browser saves lack
   earlier kill totals, so their lifetime statistic remains a marked lower bound.
5. Bird-rat falling motion is approximate; later enemy hit regions use rendered
   alpha. Searching preserves the source's ineffective Trouble HP expression;
   its restored original narrative still promises an HP increase.
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
