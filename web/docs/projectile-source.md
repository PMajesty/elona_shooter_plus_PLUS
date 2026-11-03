# Projectile runtime boundary

`projectiles.ts` represents the seven original projectile actors. `Simulation`
owns their firing, collision callbacks, damage, random stream and persistence.
The enabled game remains the solo Sheriff two-day slice. Configured tests can
grant an owned gun's required weapon skill; that is not evidence that ordinary
two-day progression obtains every weapon.

The original source is `src/original/MainTimeline.as`; embedded `bullet_*.as`
exports under `.build/export/scripts/` are reproducible derivatives. Two actual
Ruffle captures produced identical 17-snapshot traces: 14 ordinary scenarios,
one native birth probe and two exact-vertical diagnostics. All 14 ordinary
scenarios match over 650 manually advanced steps. The accepted fixture is
`web/tests/fixtures/original-projectile-trace.json`; build/runtime provenance,
comparison tolerances and regeneration instructions are in
[`docs/oracle-notes.md`](../../docs/oracle-notes.md).

## Launch and weapon identity

`shoot` (7787, special branch 7987) applies firing guards, shot timer, recoil,
ammo and base damage before launching. Each special shot consumes four aim
draws for one integer target. Wind Bow launches three arrows from that one
target, in order: startX+5/targetX+20, center, startX-5/targetX-20. Special
branches return before hitscan Burst, One Shot and Power Shot processing.

Long Bow 24 and Wind Bow 25 first enter a drawing state, add recoil and return
before ammo, damage or aim randomness. Manual hero shot timer becomes zero.
`mouseUpFunc` (3141) invokes `shoot` again using release-time aim. Every selection
refresh (4617) resets this drawing state, including selecting the same slot.

Actors store launch damage, shooter and **launch inventory slot**, not a frozen
copy of the item. `enemy.damage` reads that slot's current armor/air modifiers,
leech, impact and living-weapon metadata at impact. Switching the selected item
does not redirect those effects. Kill experience instead follows the current
selected item's weapon category, as described in `rest-notes.md`.

## Actor updates

`throwGrenade` (13357) initializes all but rockets; `throwRocket` (10920)
initializes rockets. Source root `y` is zero and child `mc.y` holds the visible
vertical coordinate. Initial child positions come from original symbol
placements, not the launch position: hand grenade -96.75, launcher grenade
-79.85, rocket -114.25, bow/bolt -45, gravity -47.95, flame -34.5.

The runtime capture established coordinate truncation to twips (1/20 pixel)
on each display assignment, including intermediate shadow assignments; alpha
is truncated to 1/256 on each assignment and rotation is normalized. The native
launcher-grenade probe initializes on logical frame 1 and first advances on
frame 2. Production input-created actors therefore wait until the next
simulation frame before advancing. This separate birth observation does not
establish native interleaving for every actor throughout a battle.

| Actor / item | Source update behavior |
| --- | --- |
| Hand grenade11 / launcher21 | Count down, move, rotate, compute parabola and shadow; explode when count is nonpositive. Curvature .003, rotations -4/-24 per update. |
| Rocket22 | Move by signed acceleration squared, then increase acceleration by speed*.01. Linear trajectory; explode after passing targetX by five pixels. Blast radii are 1.1 times ordinary grenade radii. |
| Long/Wind Bow24/25 | Decrement count, bounds check, test the previous body position, then fade or move. Ground collision has a four-update window; sky collision has separate gates. Fade ends below count -40. |
| Crossbows23/26 | Bounds check, shrink/slow when a ground-target bolt enters the sky, otherwise test previous body position; increment count and move. Crossbow23 gets one extra penetration. |
| Gravity27 | Check pause/bounds, count down and pulse every15 updates before movement. Linear motion at one quarter launch speed; firing starts reload immediately. |
| Flame40 | Check pause/bounds, pulse every2 updates before movement, then follow curvature -.003 at three quarters launch speed. Damage rectangle has .9 times ordinary radii. |

Bow speed's sky boost tests the unadjusted targetY<150, then targetY gains 6.
Bow initialization and later collision gates use that adjusted value. Bolts
add 4. Exact adjusted targetY 135 falls between the bolt collision branches.
Gravity/flame remove an out-of-bounds actor without returning: the same source
callback still finishes its possible pulse and movement. Bounds use root y0,
not child `mc.y`; for ordinary nonvertical trajectories, a body outside the
screen vertically is not itself a removal condition. The intentional vertical
fallback below uses a vertical bound instead.

## Hits and randomness

Arrow/bolt `procHit` (1428) probes `(actor.x-4, mc.y)` **before movement** using
original body/shadow geometry. Geometry and critical-region queries retain
floating-point coordinates; coordinates passed to damage are then truncated
to integers, matching the original damage boundary. It visits all overlapping
nonfree enemy slots,
including corpses, and consumes one Sense roll per geometric hit. There is no
One Hit Kill roll in this path. It returns whether any target was alive before
damage. A successful call consumes one penetration regardless of the number of
overlapping enemies; targets are not deduplicated across successive updates.

The browser corrects a reproduced ground-target miss for bows and crossbows.
When the usual tip check misses every living enemy, the simulation follows the
arc from the preceding eligible tip, accounting for target translation during
the update and using the current collision pose. It probes at half-pixel
intervals or finer in ordinary flight, capped at 256 subdivisions per target.
The earliest detected crossing uses the existing damage and penetration rules.
High bow arcs and gaps between eligible checks do not acquire ground hits.
Saves retain the previous tip during eligible flight. Older saves resume
sampling from their first eligible point. The separate bolt gap at adjusted
target height 135 remains reproducible.

`explode` (3042) and `explode_puls` (6158) check living enemies' registration
points in a strict rectangle, without falloff or silhouette collision. Stored
gun slot is passed to ordinary damage; hand grenades pass no weapon. DA_BOMB
scales integer damage and the rectangle at impact. Rocket's 1.1 and flame's .9
factors change radii after damage scaling. Ordinary explosions consume two
`shake` random draws before visiting enemies; gravity/flame pulses do not.
Damage and kills then use the existing combat random stream in enemy order.

The currently covered enemies are sheep, rat, chicken, crow and the low-level
boss. Bomb/sister chain reactions, later species and other player classes are
outside this boundary. This work does not reproduce the reported late-game
hitbox defect.

## Persistence and deliberate limits

Version 8 saves actor identity/kind, launch slot/damage, trajectory coordinates,
speed/curve, counters, penetration, rocket acceleration, visual phase fields,
nullable `verticalProgress` and bow draw state. Loading never relaunches a saved
actor. Versions 1–7 migrate
hand grenades by retaining stored coordinates, damage and remaining updates,
reversing the old speed convention, and reconstructing visual age/rotation/
shadow without random draws. Missing old coordinate precision is not recoverable.

Current saves reject nonfinite geometry, singular ordinary trajectories,
invalid or inconsistent vertical progress, invalid kinds/counters,
duplicate IDs and missing live launch gun records. Legitimate negative arrow
fade alpha and tiny positive bolt scales are accepted. Frozen postbattle actors
may retain stale slot references after loot changes; the next day clears them.

The port intentionally freezes all actors during pause and after battle ends.
Original grenade/rocket/arrow handlers do not check pause, while gravity/flame
do; original projectile children can also continue through Clear. Those native
postbattle effects are not claimed as implemented parity.

The two original exact-vertical diagnostics observed division-by-zero trajectory
arithmetic producing NaN, while the Flash display setter exposed child y=0.
The original grenade consequently exploded at the wrong location. An earlier
epsilon x offset made the port finite but still displaced impacts after twip
truncation; that approach has been removed.

For `abs(targetX-startX) < .01`, the port now normalizes targetX to startX and
uses explicit, saved `verticalProgress` rather than dividing by horizontal
distance. The body starts at the launch y and progresses toward the target
using the actor's launch-speed rules; x remains fixed. Grenades and rockets
clamp their explosion y to the requested target. Other families retain their
hit/pulse rules and terminate through vertical bounds or their fade lifetime.
Ordinary trajectories store `verticalProgress: null` and retain the captured
source behavior. This is an intentional correction, excluded from original
equality checks. It fixes the reproduced vertical-aim defect, **not** the
unreproduced late-game hitbox report.

The ordinary comparator supplies recorded original vector membership to the
production damage path. It independently computes trajectory/callback points,
damage, item/player/enemy state and RNG; it is not another collision-contour
proof. Enemy AI is frozen and callbacks after birth are advanced manually.
Whole-battle scheduling, child timeline animation/audio and repeated physical
input are outside that comparison. The port's `frame` is actor age, not the
original child timeline frame. Original assets and the gravity compositing
experiment are documented in [`docs/ui-reference.md`](../../docs/ui-reference.md);
those results do not establish pixel-perfect Phaser rendering.

## Checks

- `npm run test:projectile-soak`: 27 configured cases, three seeds and all eight
  projectile guns plus hand grenades, 360 updates per case. Checks finite state
  and exact saved-state/event replay through switches, drawing/release and
  pulses. Uses production ordinary-enemy contours and an explicitly reported
  rectangular boss fallback. Writes `.build/soak/projectile-report.json` with
  source hashes. The latest report (`2026-11-01T22:39:20.867Z`) passed 9,720 updates
  and 1,080 checkpoints, including 54 saved bow-draw states and 122 switches
  during flight. Rerun after behavior corrections. It measures headless test
  execution, not browser performance or original parity.
- `web/tests/projectile-save.test.ts`: legacy in-flight migration, all seven
  actor kinds, fade/shrink boundaries, invalid imports, saved bow release and
  frozen postbattle slot changes. The eight focused tests also cover 21 vertical
  family/direction cases (all seven actors aimed up, down and at the launch
  point), finite bounded termination within 1,000 updates, exact grenade/rocket
  impacts at (510,180)/(510,300), and matching JSON save/replay through removal.
  Near-vertical threshold and malformed-progress negative controls are included.
- Original capture route: `http://127.0.0.1:5176/?suite=projectiles` after
  `python tools/build_projectile_oracle.py`; comparator command
  `npm run test:projectile-reference`. The accepted comparison passes 14/14
  ordinary scenarios and two separate intentional-fix checks; the three fixture
  tests include negative controls for changed trajectory, RNG and birth order.
  Expectations come from the successful repeated original captures, not from
  the port or the replay soak.
