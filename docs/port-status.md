# Browser port status

Updated 2026-11-02. Current local build: **v34, eight hero classes, repeating cycles**.
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

Town coverage includes shop buy/sell, upgrades/MOD mounting, permanent companions
with equipment/orders/AI/growth/wages, temporary Mission Hire, both Castle pages,
repair, Smith stock, Museum income, chickens/eggs, Sister bombs, Villa/Party and
Sp.Trainer training. Prayer, Dinner, Taunt, searches and paid shop/recruit refreshes
apply their source effects. Searches retain their own saved random sequence.
Both original Museum medal pages show all38 English descriptions and earned states;
visitor robbery, action-medal AP bonuses and class/day/perfect-day medals work.

Original assets, English UI and credits remain. Sound starts muted unless the user
enabled it. Browser testing reuses one tab and keeps it muted. One browser save,
Continue and JSON backups work; imported/continued battles open paused.

## Validation and limits

- **474 tests passed**, with typechecking and production build passing.
  Latest bundle: `assets/index-Dee9n8Oq.js`.
- New checks cover unlock requirements, global profile validation/storage, carried
  medals, starting bonuses applied once, actual Sniper/Duelist damage, Ranger
  rampage, Noble XP, reload/decay, save replay and older-save migration. All eight
  classes finish the first two natural battles using ordinary Free Repair between
  damaged towns. This is not proof of full-campaign difficulty balance.
- Existing controlled campaign evidence covers all40 days, rewards, towns and
  Rest/save boundaries over97293 frames and all19 enemy kinds. Powerful test gear
  removes difficulty as an obstacle. Existing economy, search, hire, Museum,
  projectile, corruption and original-comparison checks remain relevant evidence
  for their unchanged behavior; seeded repeatability does not prove Flash parity.
- V31 browser checks refused locked Sniper selection, accepted the required class
  medals, selected Sniper through the second class page and started an actual
  battle with the original adrenaline HUD and saved class state. A malformed
  collection import preserved the full game/profile envelope. No console errors.
  Evidence: `.build/browser-qa/class-unlocks-verification.json` and
  `unlocked-classes.png`.
- V32 controlled combat crosses Days39–44 and77–82 through rewards, towns, Rest
  and JSON saves. Formula cases cover levels40/46/80/120/999, later-cycle selection,
  boss counts, calendar loot, strength, large-variant exclusions, actual size hit
  coverage and malformed imports. Day1000 and its level1009 henchman restore.
  The existing40-day full replay remains fixed at40 rather than expanding with
  the save boundary. This is progression evidence, not later-cycle balance proof.
- V32 browser Rest opens Day41 with fixedLv3/strength200. Its full exported
  simulation matches expected progression using the observed browser pointer
  coordinates as input. Controlled normal/large sheep display original artwork;
  import and Continue retain variant state. No console errors. Evidence:
  `.build/browser-qa/cycle-transition-verification.json` and `cycle-large-enemies.png`.
- V33 tests cover Ragnarok consumption,30 spawn attempts, the shared200-enemy
  capacity, actual dinosaur attacks and saved replay, controlled battle survival,
  defeat, medal timing, discounted wages, future New Game Luck and reset at Rest.
  The number3 key activated the artifact in the muted browser; all30 dinosaurs,
  consumed item and mission flag were exported and retained by Continue (pointer
  coordinates treated as observed input). No console errors. Evidence:
  `.build/browser-qa/ragnarok-verification.json` and `ragnarok.png`.
  This controlled survival run does not establish unassisted Ragnarok balance.
  An actual crash from killing an enemy before the first wave's timer boundary
  is fixed: missing group size follows the source's int(NaN)→0 drop calculation.
- V34 checks cover actual Casual XP/tax/mission power, two controlled battles and
  Rest/save replay, creation-mode changes without hero/RNG rerolls, Hardcore medal
  boundaries and bonuses, town-only save policy, preserved medals/mute settings,
  independent profile records and corrupt/old-mode rejection. Muted browser New
  Game exercised exclusive Casual/Hardcore toggles; Casual exports show500 opening
  power. Hardcore battle export was refused and Continue reported no save. Its
  town19 checkpoint restored and Rest opened a paused Hardcore Day20 battle.
  Original user adventure/profile restoration is exact after migration. Evidence:
  `.build/browser-qa/game-modes-verification.json` and `game-modes.png`.
  The app crash stopped the preview and invalidated the retained tab; Vite preview
  was restored at the same address and one muted replacement tab retained. No
  cause or fix for the Codex app crash itself is established by this recovery.
- The user's original Sheriff adventure **and collection** were restored with full
  exported-envelope equality: day1, tick674, RNG1744019180, HP40, gold209, paused
  and muted. No test unlocks remain in the collection.

Current evidence supports these features, not whole-game parity, native Flash
timing equivalence, full pixel/contour parity or a measured performance advantage.
Historical details are in Git and [historical verification](port-verification.json).

## Remaining features and differences

1. Long-session stability/performance and difficulty evidence beyond the first
   cycle; the current Day1000 save safety boundary remains an intentional limit.
2. Game MODs, alternative starts, carry-over and remaining medal
   effects/triggers, including recycling/modding bonuses and decorative fireworks.
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

## Working direction

Follow the [process review](development-process-review.md) and
[current objective](long-term-goal.md): work solo, deliver complete systems, favor
feature coverage over cosmetic/audio/RNG matching and keep validation proportionate.
Exact30Hz/20Hz rates are optional when observable gameplay remains faithful.
The 30-minute continuation watcher and three-hour workflow review remain active.
The user cleared the native app goal; do not recreate it without a new request.
