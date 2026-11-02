# Browser port status

Updated 2026-11-02. Current local build: **v37, Equipment Recycle and Charge Item**.
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
enabled it. Browser testing reuses a tab when available and keeps it muted. One browser save,
Continue and JSON backups work; imported/continued battles open paused.
The browser page now contains only the centered game on black. The surrounding
heading, instructions, feature list and footer are removed. The requested fullscreen
icon stays in the top-right corner for manual use. The added bottom toolbar and
floating explanation overlays were removed after user feedback. Original item/skill
tooltips remain. Ctrl+S saves; Ctrl+Shift+S/O exports/imports JSON; Ctrl+Shift+M
toggles mute. Desktop keeps native620×380 size; smaller windows shrink proportionally.
Never activate native fullscreen in testing: it takes over the user's desktop.

## Validation and limits

- **495 tests covered**: the latest full run passed494; its remaining renamed
  test-helper call was corrected and the12 affected service/MOD tests then passed.
  Typechecking and production build pass. Latest bundle: assets/index-CnSL4HP9.js.
  Service checks cover costs, exact generation, no-op failures, reload fields,
  medal thresholds/efficiency, Carry Over and JSON replay. The full run caught
  legacy loot generation reading medals before migration initialized them; the
  context now treats that missing legacy collection as empty. Title checks cover every unlock day, sequential
  late claims, AP refusal, settlement credits, rank limits and save/Carry Over
  restoration. Carry Over checks cover full-town restoration,
  minimum/earned money, AP, medal restrictions, repeated JSON replay and refusal
  of Day1/Hardcore/incompatible/malformed checkpoints. Existing MOD checks cover selection/reset without
  hero/RNG rerolls, combined Casual/Intense power, both skipped batch branches,
  actual movement, spread/recoil, range penalty, manual XP, boss rewards, party
  weapon-skill limits, explicit upgrade behavior, fixed Active AP, sale refreshes,
  malformed imports and JSON replay across Rest. Earlier normal saves migrate
  without adding MOD fields or changing their simulation RNG/state.
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
- Earlier browser evidence covers reload/combat/results/town, activities, hires,
  Museum, class unlocks, Ragnarok and both difficulty modes. Hardcore battle export
  is refused and Continue has no battle save; its town checkpoint loads and Rest
  works. These records remain useful for unchanged paths, without repeating all
  UI flows at every checkpoint.
- The user's original Sheriff adventure and collection were restored with full
  exported-envelope equality after migration: day1, tick674, RNG1744019180, HP40,
  gold209, paused/muted. No test MODs, unlocks or records remain.

Current evidence does not establish whole-game parity, native Flash timing, full
pixel/contour parity or a measured performance advantage. Historical details are
in Git and [historical verification](port-verification.json). The Codex app crash
stopped the preview; it was recovered at the same URL. Recovery does not establish
that the app's crash cause was fixed.

## Remaining features and differences

1. Long-session stability/performance and difficulty evidence beyond the first
   cycle; the current Day1000 save safety boundary remains an intentional limit.
2. Remaining medal effects/triggers and decorative fireworks.
3. Original six save slots/global slot UI, deletion and Flash save conversion.
4. Measured performance, rendering sharpness and remaining visual/audio details:
   camera shake, decorative boss reticle, some ranged spell effects/frame sounds,
   rage art, Chain Gun interruption timing and raster/filter/subpixel differences.
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

## Working direction

Follow the [process review](development-process-review.md) and
[current objective](long-term-goal.md): work solo, deliver complete systems, favor
feature coverage over cosmetic/audio/RNG matching and keep validation proportionate.
Exact30Hz/20Hz rates are optional when observable gameplay remains faithful.
The 30-minute continuation watcher and three-hour workflow review remain active.
The user cleared the native app goal; do not recreate it without a new request.
