# Browser port status

Updated 2026-11-02. Current local build: **v26, four starting classes, Days1–40**.
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
first title/salary and Rest. Original assets and English UI are retained.

Sound defaults to muted, remembers the user's preference and displays an explicit
`Sound: muted` / `Sound: on` state. Browser testing uses one retained tab. The
interruption closed the earlier temporary tab; the replacement is retained for reuse.

## Validation

- The complete suite passes **423 tests**. The controlled full-cycle run completed
  all40 days, rewards, towns and Rest/save boundaries over97293 simulation frames,
  encountering all19 implemented enemy kinds. Powerful test equipment/HP removes
  difficulty as a test obstacle; this is not a full-campaign balance claim.
- Twelve seeded generation runs cover all first-cycle encounter families and
  boss formations. Focused cases check later attacks, armor targeting, bird drops,
  JSON restore/replay, rockets, frozen Spider/Ghost poses and malformed saves.
- Class combat restores identical full state/events after JSON restoration,
  including Little Girl's AI and the Militia cooldown. Invalid identities/counters
  are rejected. Prior Sheriff migration preserves inventory and combat RNG.
- Typechecking and production build pass. Browser checks cover Hunter selection,
  creation, Little Girl, combat, pause/Continue and a controlled Day26 scene with
  later enemy art. No console errors observed. Final exports use version26.
  The preserved user save restores paused with every simulation field equal
  to its expected migration: tick674, RNG1744019180, HP40 and gold209. Evidence:
  `.build/browser-qa/campaign-restoration.json`.
- Natural class smoke tests use rectangle hit regions, like the older opening
  battle tests. They do not prove browser contour/pixel parity, balance across the
  full campaign or a performance advantage over Flash.

No day-specific SWF diagnostic family, large fixture collection or per-day ZIP
was created. Existing reference tests continue to pass. The prior baseline is
committed at `9588b35`; old evidence is
in [historical verification](port-verification.json) and Git history.

## Remaining features and differences

1. Later campaign cycles beyond Day40, strength/large-enemy variants and the
   systems below. Day40 town prepares the next mission, but Rest is guarded until
   those cycles are implemented. This is not an endless-campaign claim.
2. Castle page two, remaining town/card/search actions, recruit refresh, temporary
   Mission Hire, Ragnarok and remaining economy/medal systems.
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

## Working direction

Read the [development process review](development-process-review.md). Work solo;
prioritize complete systems/content over cosmetic/audio/RNG matching. Preserve
known balance, document approximations, use accelerated deterministic scenarios
and proportional comparisons/browser checks. Keep current-state docs concise.
Exact30Hz/20Hz rates remain optional if observable timing is preserved.

The long-term goal and 30-minute watcher remain paused in the app. This resumed
work is user-directed; do not restart recurring unattended work automatically.
