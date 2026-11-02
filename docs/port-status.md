# Browser port status

Updated 2026-11-03. Current local build: **v41, visible save-failure recovery**.
[Play locally](http://127.0.0.1:5175/elona/). This is an incomplete remake.

## Current coverage

Website embedding now isolates new mouse presses to the game canvas. Phaser's
parent-window mousedown listener had interpreted surrounding website controls as
game clicks, including resuming paused combat. Owned bow releases work in both
the iframe and accessible parent window. Focus loss pauses play. Same-origin
host-page reload/Continue and direct-route access to the same save slots work;
the README includes an embed example. Stock Chrome156 also delivers an actual
iframe export file and direct Continue preserves its full envelope. IAB iframe
download delivery remains unverified; no broader browser/origin claim follows.
Edge156 now passes an actual cross-origin HTTP host check (localhost host,
127.0.0.1 game): outside host clicks preserve pause, scaled fire spends5→4 rounds,
export delivers a file and host-page reload/Continue matches the full envelope.
The360px display retains the620×380 render buffer. Direct-route save labels also
remain populated in this default-policy context. Public HTTPS/CDN hosting,
sandboxed embeds and restrictive privacy-policy variants remain unverified.
An individual font-load rejection now uses browser fallback fonts while the rest
of startup proceeds. Previously one bad font prevented the canvas/game from being
created at all. Original fonts remain the normal path; fallback keys are visible
in DOM metadata and console warnings, without extra game controls or labels.
Missing required assets now stop before partial title creation and show an in-game
Retry. Required JSON caches and original image/clip textures are checked, and scene
updates wait for successful initialization. Optional failed audio does not block play.
An explicit Save Game/Ctrl+S failure now uses the original in-game confirmation
artwork and offers an immediate JSON backup. Adventure-write and medal-only
failures have separate messages. Cancel/Escape leave combat paused; Space cannot
resume under the prompt. Successful saves add no dialog. Hardcore combat keeps
its town-only save/export rule and explains it with an acknowledgement.
Automatic saves retain their existing non-interrupting behavior.

All eight original hero classes are connected to ordinary New Game, equipment,
skill choices, growth, combat and saves. Rogue/Hunter start with Little Girl;
Militia has its starting weapons and periodic grenade. Sniper, Ranger, Duelist
and Noble unlock through the four original level10 class medals. Sniper's idle
charge, Ranger's party rampage, Duelist's frenzy and Noble's passive bonuses work
in combat. The first three use the original adrenaline bar artwork.
Active hero/companion rampage now shows the original looping aura and disappears
when its saved bonus expires. Six original critical-kill countdown lines lead to
"Rampage!!"; Boss Day, Incoming Boss and Ragnarok use the original bottom text
field, font, motion/fade and waiting queue. Generic Wave/Level Up overlays are
removed; level-up uses its original separate animation. Continue restores active
auras without replaying old announcements. No save fields, format bump or combat
RNG changes were required. Aura phase follows saved tick; exact filters and the
original rampage bottom-bar tint remain differences.
Source: rampage7284/rampageOn12299/endRampage12472, textEffect2390,
levelUp10480/effect2 symbol1411 frames20–50, onTick8363 and battle-start1549.

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
Cata and Tank now launch their separate original bolts, and Dragon launches its
original fireball. Their source motion, rotation, shadows and removal are connected
to the existing saved enemy-flight system. Tank also shows its original muzzle
flash; all four late ranged attackers, including Dino's existing beam, use their
launch sounds. Damage remains immediate at the source attack frame; arrival adds
no damage or RNG draws. V41 saves flight kinds; older arrows retain their exact
fields and RNG. Muzzle flashes remain transient like other explosion effects.
Source: enemy_cata113, enemy_tank102, enemy_dino146, enemy_dragon66;
bolt2207/bolt_tank2203/fireball2196 and their original child artwork.
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
The Chain Gun's three phase sounds and bird-drop cue are now included in audio
preloading. Their recent simulation/render connections had omitted that list.
Muted browser inspection confirms all four in the loaded cache; audible playback
and exact sample timing remain unverified. Loaded keys are inspectable through
the existing game's DOM metadata without adding visible controls.
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

- Last full suite: **572 tests pass**. Four new checks cover critical countdown,
  boss-wave warnings, source notice queue boundaries and extracted feedback assets.
  Current typecheck/build pass; bundle: assets/index-vN9HJS3t.js. Twelve affected
  mode/slot checks pass. The572-test baseline is reused: only save-error UI changed,
  with no simulation, storage format or gameplay-rule changes.
  Existing source/deterministic checks cover
  classes, campaign/enemies, party AI, equipment/economy, medals/modes/MODs,
  activities/search, Carry Over, saves/migrations and extracted content.
- The controlled40-day campaign reached18 enemy kinds in96827 frames using strong
  gear. Dragon was absent from this seed; separate per-kind/mission checks cover
  all kinds. Later-cycle formulas, Day150 medals and Day1000 saves are checked.
  This establishes progression, not natural difficulty balance or hours-long play.
- Muted browser checks cover New Game, combat/reload/F/results/town, original
  controls/help/options, equipment/services/hires, all eight slots, JSON saves,
  Carry Over, medals/Museum, Sister reactions and Flash imports. Current user's
  entire adventure/collection is restored exactly at v41:
  Day1, tick674, RNG1744019180, HP40, gold209. Slot8 is empty; slot1 is
  selected, paused/muted. No console errors or fullscreen during the latest check.

Completed sustained check: `.build/browser-qa/chrome-stability-verification.json`
records3600.017s in one isolated muted headless Chrome156 page; simulation advanced
3598.567s. The controlled Day41 fixture starts150 enemies/six bosses/three companions
and remains dense with131 enemies. Only castle HP/max HP was raised to10million.
215870 raw rAF gaps average16.677ms: four exceed50ms, three exceed100ms, two exceed
250ms; maximum983.4ms. No gaps exceed1s. One observed long task lasts68ms.
Minute heap samples range16.2–43.7MiB, ending29.6MiB versus30.3MiB at the start;
this does not prove absence of leaks or measure total process/GPU memory. There
are no script errors/failed requests; final full-envelope export/reload/Continue
matches exactly. Outlier causes remain unattributed. This run used BnnXZxvQ;
the subsequent change affects only explicit save-error UI, so no repeat hour is
justified. The browser closed automatically and the user's profile was untouched.
Standard Playwright and temporary checks remain under ignored `.tools/`/`.build/`.

Recent evidence is in ignored `.build/browser-qa/`; older detail remains in Git.
Reuse it for unchanged behavior rather than repeating whole browser/campaign runs.

| Check | Evidence and practical boundary |
| --- | --- |
| Town events, medals, lifetime kills | `{town-events,medal-notices,kill-history}-verification.json`: ordinary source narratives/controls, saved outcomes and notifications. |
| Flash adventure import | `flash-adventure-verification.json`: Cancel preserves the full envelope; controlled Hunter Day3 import/Continue/Rest matches expected saved state. Five automated checks cover classes/modes, owned contents, replay and refusal of invalid files. |
| Independent original save | `native-flash-verification.json`: actual original-game/Ruffle0.7.1 Casual Hunter Day1 SOL (806 GP,5/40 HP,29 kills); original Rejoice! search AP4→5/cursor446→455 matches port import/search/Continue. Before/after SOLs are committed regression fixtures. This covers one source save, not historical player files/native Adobe Flash/index. |
| Chain Gun | `chain-gun-verification.json`: short hold keeps220 rounds, longer hold fires to181, release stops; entire interrupted-spin save survives Continue. |
| Bird-dropped rats | `bird-drop-verification.json`: actual shot kills the falling body with its separate ground shadow; mid-air death export/import matches the full envelope. |
| Crowded battle | `crowded-battle-verification.json`: controlled Day41 starts150 enemies/six bosses/three companions;313.821s wall vs313.833s simulation, five smoothed render windows near60 FPS;133041-byte save reloads exactly. Not raw frame-gap/stall, memory, hours-long or Flash-performance evidence. |
| Website embedding | `embedding-verification.json`: host input/resizing preserves paused metadata;360px display keeps620×380 buffer and working rifle fire10→9; outside bow release creates an arrow; host reload/Continue retains tick170/selection/ammo. Temporary host removed. Two iframe exports reported success without a file in IAB; direct export worked. Other browser/origin policies remain unverified. |
| Late enemy attacks | `late-attacks-verification.json`, `late-attacks-browser.png`: actual Cata/Tank/Dragon shots and Tank flash render; all four launch sounds are loaded while muted. A controlled tick6 save with all three flights survives import and actual Return to Title/Continue with the entire envelope unchanged. Source-derived motion/launch timing, flight removal, replay, legacy arrows and invalid kinds have automated checks. Transient flashes are not saved. |
| Combat feedback | `combat-feedback-verification.json`, `combat-feedback-browser.png`, `combat-level-up.png`: original boss text and both ally auras render; an ordinary shot levels the controlled hero1→2 with original artwork. Active bonuses survive full-envelope Continue, old notices do not replay, and both auras clear on expiry. Companion counter's one-frame acquisition delay follows the source continue; no clock change was made. |
| Font failure | `font-fallback-verification.json`, `font-failure-before.png`, `font-fallback-browser.png`: a zeroed served ui.ttf aborted the old build before canvas creation. The patched build reached ordinary Sheriff New Game/character creation/combat and fired5→4 rounds with that same fault. Restored font bytes match the source; healthy reload has no fallbacks and Continue preserves the entire tick18 save. User adventure/collection restored exactly. Original Flash/Ruffle startup path is unchanged. |
| Required-asset recovery | `asset-retry-verification.json`, `asset-retry-browser.png`, `asset-recovery-browser.png`: missing town-layout JSON previously left a partial title and scene errors. Patched startup names the failed file, offers Retry and avoids scene callbacks before readiness. Actual Retry recovers the title/Continue; optional background-audio failure also permits play. Full tick674 exports before/after are byte-identical; source/served fault-injection files match again. |
| Save failures | `save-failure-before.json`, `save-failure-verification.json`, `save-{all,profile}-browser.png`: injected storage failures previously produced only hidden status text. Actual Save Game now shows the original dialog, blocks Space, dismisses with Escape and exports the full unchanged envelope on Yes. Medal-only failure preserves the stored adventure. Healthy Save Game/reload/Continue remains exact. All checks use isolated muted contexts. |
| Edge cross-origin embed | `edge-cross-site-verification.json`, `edge-cross-site-browser.png`: actual HTTP host/game origins differ; default-policy Edge156 supports input isolation, scaled shooting, delivered export and exact full-envelope host reload/Continue. No script errors/failed requests or fullscreen. The first intercepted-host experiment was blocked before game loading by local-network checks; a real host response passed without changing security settings. Temporary host removed; user profile untouched. |

Current evidence does not establish whole-game parity, native Flash timing, full
pixel/contour parity or a measured performance advantage. The Codex app crash
stopped the preview; recovery at the same URL did not establish its crash cause.
Historical verification stays in Git and port-verification.json; do not reread it
for routine continuation.

## Completion gates

- **Reachable original content:** classes, enemies/cycles, weapons/skills, town,
  progression, modes/MODs, medals and ordinary controls are connected above. A
  finite52-trait connection screen found no disconnected consumer; this does not
  establish every formula or whole-game balance. Resolve demonstrated missing
  interactions before spending further effort on exact presentation.
- **Website and saves:** ordinary startup, New Game, combat/results/town,
  Continue, imports/exports and embedding must remain usable with preserved saves.
  Direct-route and same-origin input/save evidence exists; browser/origin policy
  limits below still require representative evidence or an explicit support scope.
- **Correctness and stability:** retain affected source comparisons/deterministic
  checks and sustained real browser operation with raw stall/memory observations.
  The hour above passes with stated outliers/limits. Passing tests alone is insufficient.
- **Finish boundary:** document a finite accepted difference list and supported
  hosting/browser scope, resolve material failures, then pause both watchers and
  report. Exact cosmetic/audio/RNG matching is not an unbounded prerequisite.

## Remaining features and differences

1. Broader browser/hosting performance and later difficulty evidence. The one-hour
   controlled Chrome run above passes with stated limits; longer sessions/other
   workloads are unverified. The Day1000 save safety
   boundary remains an intentional limit. Same-origin embedding has the input/save
   evidence above. Edge's cross-origin default-policy case also passes; public
   HTTPS/CDN, sandbox/privacy-policy variants and IAB iframe download delivery remain open.
2. All38 defined medal award paths and award notifications are connected. Preserve
   source bonus discrepancies: Kongregate advertises a
   wage discount, but wage3610 checks Ragnarok92; medal91 does not add another
   discount. Ha-na-bi's advertised firework bonus likewise differs from startFire.
3. Historical player Flash save compatibility remains unverified. The collection
   converter has controlled source-schema evidence; adventure import additionally
   has an independent original-game/Ruffle save and search comparison. The browser dropdown displays all eight choices at once,
   rather than the original ComboBox's five-row scrolling list.
4. Measured performance, rendering sharpness and remaining visual/audio details:
   camera shake, decorative boss reticle, other enemy frame sounds,
   rampage bottom-bar tint and raster/filter/subpixel differences. Ally aura phase
   derives from saved tick; textEffect motion/fade is extracted, but exact text
   filters remain approximate. Chain Gun phase playback follows
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
   One in-app-browser reload showed black canvas screenshots despite title/audio
   readiness; an empty-field focus click restored the title without an error.
   Cause and ordinary-browser reproduction are unverified; no fix for that rendering
   observation is claimed.
   The separately reproduced font-load failure above is fixed; it does not explain
   that earlier ready-but-black rendering observation. Fallback font appearance
   can differ; hanging requests, arbitrary missing artwork and malformed-but-present
   asset schemas remain untested. Missing required town-layout JSON and optional
   background-audio failure have the focused recovery evidence above.
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
