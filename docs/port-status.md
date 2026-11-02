# Browser port status

Updated 2026-11-02. Current local build: **v31, eight hero classes, Days1–40**.
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

The first encounter cycle is connected through Day40, including all19 enemy kinds,
later bosses, shields/rage/rockets, bird-dropped rats and extracted animation attack
frames. Manual/automatic reload, firearms, bows, projectiles, consumables, boss
health bars, ordinary/boss loot, skills, results, towns and Rest are playable.

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

- **461 tests passed**, with typechecking and production build passing. After the
  final reload-burst correction, the six affected class/unlock tests passed again.
  Latest bundle: `assets/index-C7sJfAxq.js`.
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
- The user's original Sheriff adventure **and collection** were restored with full
  exported-envelope equality: day1, tick674, RNG1744019180, HP40, gold209, paused
  and muted. No test unlocks remain in the collection.

Current evidence supports these features, not whole-game parity, native Flash
timing equivalence, full pixel/contour parity or a measured performance advantage.
Historical details are in Git and [historical verification](port-verification.json).

## Remaining features and differences

1. Campaign cycles beyond Day40, strength/large-enemy variants and related content.
   Day40 town prepares a mission, but Rest remains guarded until that cycle works.
2. Ragnarok, event-card systems, alternative modes/starts and remaining medal
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

## Working direction

Follow the [process review](development-process-review.md) and
[current objective](long-term-goal.md): work solo, deliver complete systems, favor
feature coverage over cosmetic/audio/RNG matching and keep validation proportionate.
Exact30Hz/20Hz rates are optional when observable gameplay remains faithful.
The 30-minute continuation watcher and three-hour workflow review remain active.
The user cleared the native app goal; do not recreate it without a new request.
