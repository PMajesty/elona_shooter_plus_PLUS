# Browser port status

Updated 2026-11-02. Current local build: **v28, four starting classes, Days1–40**.
[Play locally](http://127.0.0.1:5175/elona/). This is an incomplete remake.

## Current coverage

Rogue, Hunter, Sheriff and Militia can be selected through ordinary New Game,
with their original starting traits and weapons. Rogue/Hunter receive Little Girl;
Militia receives its rifle, living Simple Flame Thrower, Simple Chain Gun and
periodic free class grenade. Imported/continued battles start paused so they cannot
advance while the player is navigating load controls. Skill choices, descriptions, growth, combat, towns,
equipment and saves use shared systems.

The first encounter cycle is connected through Day40. Catapult, Spider, Ghost,
Ogre, Knight, Bird, Tank, Dino and Dragon use original atlases and extracted frame
commands for attack timing, loops, stops and alerts. Birds drop falling rats.
Multi-boss days and later boss shields, rage and rockets are implemented.

Existing coverage remains: firearms/projectiles, manual and
automatic reload, consumables, boss health bars, enemy animation, ordinary/boss
loot, skills, results, town generation, shop and equipment transactions,
permanent companions with AI/growth/wages, Castle page-one purchases, repairs,
first title/salary and Rest. Both Castle pages are now active: Smith expands and
refreshes shop stock, Museum pays medal-based income, Chickens supply eggs, Sisters
launch shootable bombs, Villa boosts the next battle through Party, and Sp.Trainer
permits lifetime skill-training sessions per troop. Prayer, Dinner, Party, egg
collection, Taunt and Train are on the Mission board. Stock/recruit refresh cost
2 AP each. Go searching costs 1 AP and implements the original event families,
including rewards/setbacks, three-stage talent growth, inventory gifts, stock
refresh, party XP, wall/chicken changes and fame income at the next settlement.
Its separate saved random sequence continues across saves and days.
Original assets and English UI are retained.

Sound defaults to muted, remembers the user's preference and displays an explicit
`Sound: muted` / `Sound: on` state. Browser testing uses one retained tab. The
interruption closed the earlier temporary tab; the replacement is retained for reuse.

## Validation

- The complete suite passes **438 tests**. The controlled full-cycle run completed
  all40 days, rewards, towns and Rest/save boundaries over97293 simulation frames,
  encountering all19 implemented enemy kinds. Powerful test equipment/HP removes
  difficulty as a test obstacle; this is not a full-campaign balance claim.
- Twelve seeded generation runs cover all first-cycle encounter families and
  boss formations. Focused cases check later attacks, armor targeting, bird drops,
  JSON restore/replay, rockets, frozen Spider/Ghost poses and malformed saves.
- Economy tests cover all new purchases, Smith/Sp.Trainer caps, next-day income,
  upkeep, daily egg limits, AP, refresh ownership, persistent training, bonuses,
  bomb launches/chains and Love compensation. Combat checks measure actual Party
  damage, Dinner XP, Prayer absorption and Taunt enemy HP.
- Search checks cover every outcome family, saved/reloaded repeatability, Quick
  Eyed, full inventory, insufficient AP, nonfatal loss limits, talent growth,
  next-settlement fame, and AP above14/XP above999. These are source-led behavior
  tests, not a new instrumented-original comparison or proof of RNG parity.
- Class combat restores identical full state/events after JSON restoration,
  including Little Girl's AI and the Militia cooldown. Invalid identities/counters
  are rejected. Prior Sheriff migration preserves inventory and combat RNG.
- Typechecking and production build pass. Browser checks cover Hunter selection,
  creation, Little Girl, combat, pause/Continue and a controlled Day26 scene with
  later enemy art. The v27 UI checks exercise Castle page two/Smith, four stock
  slots, both refreshes, Prayer, Training, Party and Rest into a bonused Day2.
  A stationary 90-degree Sister bomb allows a real pixel-hit check without live
  aiming delay; one visible-body click consumed one shot and caused one explosion.
  No console errors observed. Final exports use version27.
  The preserved user save restores paused with every simulation field equal
  to its expected migration: tick674, RNG1744019180, HP40 and gold209. Evidence:
  `.build/browser-qa/economy-restoration.json`. Economy/rotated-hit evidence:
  `.build/browser-qa/town-economy-verification.json` and
  `.build/browser-qa/sister-rotation-verification.json`.
- Two v28 searches through the actual Mission card produced full exported state
  equal to the expected simulation: AP14→12, fame0→2, search cursor13→19.
  Evidence: `.build/browser-qa/search-verification.json` and `town-search.png`.
  No browser errors; the original save was restored paused/muted and every field
  equals its expected migration (`search-restoration.json`, tick674/HP40/gold209).
- Natural class smoke tests use rectangle hit regions, like the older opening
  battle tests. They do not prove browser contour/pixel parity, balance across the
  full campaign or a performance advantage over Flash.

No day-specific SWF diagnostic family, large fixture collection or per-day ZIP
was created. Existing reference tests continue to pass. The prior baseline is
committed at `1c603a8`; old evidence is
in [historical verification](port-verification.json) and Git history.

## Remaining features and differences

1. Later campaign cycles beyond Day40, strength/large-enemy variants and the
   systems below. Day40 town prepares the next mission, but Rest is guarded until
   those cycles are implemented. This is not an endless-campaign claim.
2. Event-card actions, museum robbery, temporary Mission Hire,
   Ragnarok and remaining global economy/medal systems. Museum income currently
   counts the medals known to this port; global medal carry-over is incomplete.
3. Unlockable hero classes (Sniper, Ranger, Duelist, Noble), original multiple save
   slots/global index behavior and Flash save conversion.
4. Measured performance, rendering sharpness and full visual/audio parity. Known
   details include interrupted Chain Gun sound timing, camera shake, decorative
   boss reticle and some raster/filter/subpixel differences.
5. The veteran late-game hitbox complaint is still **unreproduced**. Earlier
   contour/vertical-projectile corrections do not establish its diagnosis.

The later enemy hit regions use rendered alpha; extending the contour extractor
encountered unsupported strokes. Existing early contours remain unchanged.
Bird-rat falling motion is approximate. Decorative ranged bolt/fireball/lightning
effects, some frame-triggered sounds and boss rage art are incomplete; castle
damage follows the extracted source attack frames. These are explicit fidelity
gaps retained while completing gameplay coverage.
New town activities report outcomes in concise English status messages rather
than recreating every event dialog. Bomb artwork is original; its combined
shadow/body rotates together. The separate static castle Sister's damage/death
interactions remain unported. Failed insufficient-AP actions preserve RNG.
Searching retains the source's ineffective Trouble expression (`hpFix + value`
without assignment); its message reports stronger enemies but does not alter HP.
Search event text is concise English; original event-modal composition is deferred.
Unspent training XP can exceed1000 until the usual progression check; saved XP/AP
validation now accepts legitimate search gains instead of early-game-only limits.

## Working direction

Read the [development process review](development-process-review.md). Work solo;
prioritize complete systems/content over cosmetic/audio/RNG matching. Preserve
known balance, document approximations, use accelerated deterministic scenarios
and proportional comparisons/browser checks. Keep current-state docs concise.
Exact30Hz/20Hz rates remain optional if observable timing is preserved.

The user reauthorized recurring work: the 30-minute continuation watcher and
three-hour workflow meta-review are active. See [current goal](long-term-goal.md).
Defer the reported late-game hitbox complaint until core port coverage is complete.
The native goal card still contains the earlier paused goal: a supported update
attempt was refused because this chat has an active writer. The revised repository
goal and both active heartbeat prompts supersede that old wording; development
continues through the authorized watchers without bypassing the writer lock.
