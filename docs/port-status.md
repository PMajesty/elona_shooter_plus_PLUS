# Browser port status

Updated 2026-11-02. Current local build: **v40, bird-dropped rat behavior**.
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
The Chain Gun now winds up in manual control before spending bullets or applying
shot recoil. Release stops firing and winds down; resuming uses retained spin.
AI keeps its original idle-spin floor. Both modes use the original counter and
2462ms sound-position cutoff through saved simulation time, independent of mute.
Weapon changes/Rest reset spin; F transfers it without duplication. Original
wind-up/down/loop clips follow the phase and pause/clear with the game. V39 retains
optional manual spin/clock state; older saves add no spin fields or RNG draws.
Source: onEnterFrame2477, shoot7896, refreshPlayer4622 and chainSoundLength984.
Bird-dropped rats now retain a ground anchor while the original parachute/body
clip falls1.5px/frame, drifts±0.5, tilts and reverses by the source5% check. They
register for AI targeting in the air and keep falling during knockback. Death
stops drift/rotation and falls8px/frame before the normal ground death timeline.
The ground shadow stays fixed below the moving body; browser hits follow that
body. Source weak points remain relative to the ground parent. Optional saved
fall fields replay in life/death; legacy straight-fall saves migrate without RNG
draws. Newly spawned enemies begin moving on the next frame.
Source: enemy constructor279, rat1353/bird1399/death921, enemy_rat.frame1;
original body1258/shadow680, extracted with the existing campaign asset tool.
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
files elonas0–7.sol now have a separate native confirmation and town converter.
No save format change was needed. The bounded reader supports the AMF3 primitive/object/array
types used by the index, including sparse arrays and string/object/trait references.
Other encodings/types fail before storage changes. Source: saveIndex10961/loadIndex7052.

Flash adventure import accepts1.3.0.1–1.3.0.4 town checkpoints within Days1–1000.
It preserves the saved hero/party, owned equipment and stocks, gold/AP, upgrades,
mission effects, counters, focus/orders and options, without applying New Game
bonuses again. The selected browser slot is the destination; Cancel changes no
saved state. Use the matching medal index first: medals are not in adventure files.
Future RNG starts a deterministic browser stream because Flash did not serialize
Math.random. Unused past-combat bookkeeping is reconstructed; the saved town and
next mission are retained. The common save validator refuses unsupported values.
Source: saveGame6311, loadGame4986, generateMission12144 and source player/inventory
arrays. Controlled schema files and a fresh original-game/Ruffle save pass;
historical player SOL compatibility remains unverified.

## Validation and limits

- **565 tests pass**, with typechecking and production build passing. A subsequent
  test-only knockback assertion passed in the three affected checks; unchanged
  full-suite/build evidence was reused. Bundle:
  assets/index-BwVNE_GZ.js. Existing deterministic/source comparisons cover hero
  classes, campaign/enemies, party AI, equipment/economy, medals/modes/MODs,
  activities/search, Carry Over, saves/migrations and extracted content.
- The current controlled40-day campaign reached18 enemy kinds in96827 frames using
  strong test gear. Dragon was not selected in this random run; separate seeded
  mission and per-enemy checks cover all kinds. An earlier run encountered all19;
  this is an observation, not a guarantee for every seed or difficulty-parity evidence.
  Other checks cover later-cycle boundaries/formulas, Day150 medals and Day1000
  saves. Long-session browser performance and later difficulty remain unmeasured.
- Muted browser evidence covers New Game, combat/reload/F/results/town, original
  controls/help/options, equipment/services/hires, all eight slots, JSON saves,
  Carry Over, medal unlocks/Museum, Sister reactions and Flash collection import.
  Historical player Flash collection/adventure files remain unverified.
  Five controlled adventure checks cover
  all eight heroes, modes, exact owned/town contents, changed activities/options,
  inactive recruit cells, later-cycle Hardcore/Rest, deterministic replay and
  invalid/deleted/unsupported files. The existing AMF encoder fixture is shared.
- Unchanged town-card, medal-notice and lifetime-kill browser checks retain their
  .build/browser-qa/{town-events,medal-notices,kill-history}-verification.json evidence.
- Flash adventure browser check: Cancel preserved the user's full envelope;
  a controlled Hunter Day3 file imported to slot8 matched the entire expected
  save, Continue stayed equal, and Rest started Day4 with an exact town Carry Over
  checkpoint. Evidence: .build/browser-qa/flash-adventure-verification.json,
  flash-adventure-preview.png and flash-adventure-town.png.
- Independent original-save check: ordinary Casual Hunter New Game/battle/results
  under muted Ruffle0.7.1 produced a native Day1/level2 town SOL:806 GP,5/40 HP,
  29 kills. Original search produced Rejoice!, AP4→5 and cursor446→455. Importing
  that SOL reproduced the complete English event and saved changes; browser import,
  search and actual Return to Title/Continue matched full expected envelopes.
  The before/after SOLs are committed [regression fixtures](../web/tests/fixtures/flash-native/README.md),
  independent of the test encoder. Evidence: .build/browser-qa/native-flash-verification.json,
  ruffle-original-search.png and native-import-search.png. This covers one source
  save under Ruffle, not historical player files, native Adobe Flash or the index.
- Chain Gun browser check: controlled Militia mid-spin import matched the complete
  expected envelope. A short hold retained220 ammo; a longer hold fired to181;
  release stopped there and wound down. Save/Return to Title/Continue retained the
  entire interrupted-spin envelope. Four new checks cover counter/clock boundaries,
  recoil, release/resume, AI floor, F/weapon changes, JSON replay and old/invalid saves.
  Evidence: .build/browser-qa/chain-gun-verification.json and chain-gun-browser.png.
- Disposable slot8 was removed. The user's Sheriff adventure/collection was restored:
  only envelope/simulation version39→40 changed. Day1, tick674, RNG1744019180, HP40,
  gold209 remain unchanged, paused/muted. No test medals/records, console errors or fullscreen.
- Falling-rat browser check: a controlled Day26 live fall imported exactly, and
  an ordinary mouse shot hit the visible body in the air (one bullet, actual kill).
  Export/reimport of the mid-air death retained the full envelope. Body and ground
  shadow remained separated. Three source-rule regressions cover drift/rotation,
  AI acquisition/aiming, knockback, death/landing, replay and legacy/invalid saves.
  Evidence: .build/browser-qa/bird-drop-verification.json and bird-drop-browser.png.
- Earlier detailed evidence remains in Git (through146a891), existing
  .build/browser-qa records and historical verification. Reuse it for unchanged
  behavior. The source's inactive card/debug-start functions were audited below.

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
3. Historical player Flash save compatibility remains unverified. The collection
   converter has controlled source-schema evidence; adventure import additionally
   has an independent original-game/Ruffle save and search comparison. The browser dropdown displays all eight choices at once,
   rather than the original ComboBox's five-row scrolling list.
4. Measured performance, rendering sharpness and remaining visual/audio details:
   camera shake, decorative boss reticle, some ranged spell effects/frame sounds,
   rage art and raster/filter/subpixel differences. Chain Gun phase playback follows
   deterministic time; sample-perfect audio/native SoundChannel scheduling is unverified.
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
5. Falling-rat bodies and later enemy hit regions use rendered alpha; exact Flash
   filter/vector boundary matching remains unverified. Searching preserves the source's ineffective Trouble HP expression;
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
