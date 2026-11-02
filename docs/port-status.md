# Browser port status

Updated 2026-11-02. Current local build: **v25, four starting classes, Days1–9**.
[Play locally](http://127.0.0.1:5175/elona/). This is an incomplete remake.

## Current coverage

Rogue, Hunter, Sheriff and Militia can be selected through ordinary New Game,
with their original starting traits and weapons. Rogue/Hunter receive Little Girl;
Militia receives its rifle, living Simple Flame Thrower, Simple Chain Gun and
periodic free class grenade. Imported/continued battles start paused so they cannot
advance while the player is navigating load controls. Skill choices, descriptions, growth, combat, towns,
equipment and saves use shared systems.

Existing coverage remains: nine connected days; firearms/projectiles, manual and
automatic reload, consumables, boss health bars, enemy animation, ordinary/boss
loot, skills, results, town generation, shop and equipment transactions,
permanent companions with AI/growth/wages, Castle page-one purchases, repairs,
first title/salary and Rest. Original assets and English UI are retained.

Sound defaults to muted, remembers the user's preference and displays an explicit
`Sound: muted` / `Sound: on` state. Browser testing uses one retained tab. The
interruption closed the earlier temporary tab; the replacement is retained for reuse.

## Validation

- Existing suite plus six class tests: **412 passing tests**. Four subsequent
  targeted cases also pass: each class completes two natural battles, earned
  rewards/choices, town entry, save restoration and Rest. **416 unique tests**
  across those runs; not a single 416-test run.
- Class combat restores identical full state/events after JSON restoration,
  including Little Girl's AI and the Militia cooldown. Invalid identities/counters
  are rejected. V24 Sheriff migration preserves inventory and combat RNG.
- Typechecking and production build pass. Browser checks cover Hunter selection,
  creation, Little Girl in battle, pause and Continue. Final exports use version25.
  The preserved v24 user save restores paused with every simulation field equal
  to its expected migration: tick674, RNG1744019180, HP40 and gold209. Evidence:
  `.build/browser-qa/solo-class-restoration.json`.
- Natural class smoke tests use rectangle hit regions, like the older opening
  battle tests. They do not prove browser contour/pixel parity, balance across the
  full campaign or a performance advantage over Flash.

No new original-SWF diagnostic family, multi-campaign fixture collection, ZIP or
full rollback copy was created for individual classes. Existing reference tests
continue to pass. The prior baseline is committed at `2075094`; old evidence is
in [historical verification](port-verification.json) and Git history.

## Remaining features and differences

1. General campaign progression beyond Day9, first boss-day combat, missing enemy
   families and later variants. Mission selection still rejects enemy kinds with
   missing behavior; do not bypass that guard to claim broader coverage.
2. Castle page two, remaining town/card/search actions, recruit refresh, temporary
   Mission Hire, Ragnarok and remaining economy/medal systems.
3. Unlockable hero classes (Sniper, Ranger, Duelist, Noble), original multiple save
   slots/global index behavior and Flash save conversion.
4. Measured performance, rendering sharpness and full visual/audio parity. Known
   details include interrupted Chain Gun sound timing, camera shake, decorative
   boss reticle and some raster/filter/subpixel differences.
5. The veteran late-game hitbox complaint is still **unreproduced**. Earlier
   contour/vertical-projectile corrections do not establish its diagnosis.

## Working direction

Read the [development process review](development-process-review.md). Work solo;
prioritize complete systems/content over cosmetic/audio/RNG matching. Preserve
known balance, document approximations, use accelerated deterministic scenarios
and proportional comparisons/browser checks. Keep current-state docs concise.
Exact30Hz/20Hz rates remain optional if observable timing is preserved.

The long-term goal and 30-minute watcher remain paused in the app. This resumed
work is user-directed; do not restart recurring unattended work automatically.
