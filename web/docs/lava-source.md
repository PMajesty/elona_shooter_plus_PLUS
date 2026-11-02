# Lava: source behavior, assets and comparison boundary

Lava is required for the next connected Day8 battle. The original registration is
ID 4, level 9, power 300, flags `KAMIKAZE`/`MASS` (MainTimeline1536). A normal Day8
battle uses the mission prepared at level7; unrestricted `level + 2` groups in
BATCH1, RANGED and ordinary waves can select Lava. The AIR branch retains its AIR
filter. The selection target and per-wave duplicate exclusion still decide whether
it actually appears. This eligibility is source-derived; the separate eighth-day
wave oracle supplies actual selection observations.

## Initialization and movement

The following anchors use `.build/export/scripts/enemy.as`, exported from the
unchanged `original/elonashooter1.3.swf`:

- Lines182–208 initialize gold `1 + int(U * power / 10 + 5)`, XP `1 + int(power * .4)`,
  normal damage type, no drop, no disarm, no rage, no knockback and no alert. The
  actor begins at x−20.
- Lines362–371 set HP72, attack12, speed `4.5 + U * 2`, ground y
  `170 + U * 155`, critical rectangle `[-9,9,-19,-7]`, loot31, and `enemy_lava`.
  The shared tail truncates y, applies mission strength/HP and cached Threat speed
  effects, stores `speedOrg`, starts `init`, and resets death time/attacking.
- The fresh class field `resKnock` is1. Lava's branch does not reset it when an
  original pooled actor is reused. The port uses a fresh actor, consistent with
  its previously documented source-backed pool-state correction. The new Lava
  diagnostic starts fresh; it does not claim a new pooled-history comparison.
- Lines1287 onward always add speed to x, including while attacking. At x≥155,
  the actor invokes the actual root `alert` once and sets `alerted`. At x≥455,
  it enters `attack` without setting speed to zero.
- Generic knockback at1007 onward normally decrements the counter, moves left by
  `knockBack²/40 + resKnock/2 + .2`, clamps against negative parent width, then
  returns. For an already-attacking Lava it instead clears knockback and proceeds
  with normal movement. A weapon can still alter speed through Cripple Shot;
  knockback immunity does not undo those other original weapon effects.

MainTimeline3814 `alert` is a targeting operation, not an extra visual. It selects
the first eligible wall-defending actor, clears its burst/shooting state, assigns
the target/onMark flags and resets its aim count. The ordinary manually controlled
hero is excluded. If none is assigned and the target is already at x≥435, it stores
`nextAlert`. The Lava diagnostic records invocation count and this fallback with
no eligible companion; it does not pretend to compare a complete companion AI
cycle there.

## Original timeline and death paths

`enemy_lava.as` embeds symbol883 with **223 frames**:

| Entry/action | Original behavior |
| --- | --- |
| `init` 1 | Stores root/parent references and sets `shadowHit=true`. |
| `alive` 4 | Walking loop; frame20 jumps back to4. |
| `attack` 23 | Sets `shadowHit=false`; movement continues in parent AI. |
| Frame35 | Calls `damageCastle(undefined, attack)`, then `shake(20,5,.9)`, plays `sound_exp1`, and sets parent HP to−1. |
| Frame51 | Calls parent `nullify`: removes the actor/clip and sets null frame223, HP−1 and death time201. |
| Frame86 | Jumps to `attack`; the ordinary suicide path has already removed itself at51. |
| `dead` 98 | Plays `sound_dead1`. No shadow flag reset. |
| Frame128 | Stops the ordinary death pose. |
| `null` 223 | Empty timeline entry used on removal. |

The frame35 explosion is original artwork inside the Lava timeline, not a new
grenade entity. Its castle call has no attacker, so it does not trigger Guardian
retaliation. `shake` consumes two direction draws after the castle damage path.
The suicide path does not call ordinary `damage`/`kill`, so it does not award a
kill, XP or loot. A lethal player hit before frame35 jumps to98 instead, preserves
the current shadow flag, and follows ordinary death/drop/fade/removal timing.
Therefore death while walking can have `shadowHit=true`, while death after attack
entry retains `false`. Save/restore must retain that history.

Parent hit particles influence `parent.width` and the left knockback clamp even
though they are outside `mc.hitTestPoint`. The existing blood50–62 and critical70–75
assets/bounds cover them; they need no invented effect or duplicated artwork.

## Extracted assets

`tools/extract_web_assets.py` now packages `enemy_lava` from symbol883. The atlas is
73×62 per frame, registration offset `(35.45,38.35)`, 223 named frames and 43 unique
raster frames. Initial body shape840 has geometric bounds
`[-15.5,15.45,-17.5,13.45]`; the named shadow extends below it. The atlas keeps its
complete timeline bounds rather than cropping each animation frame.

`tools/extract_collision_geometry.py` adds all original Lava filled contours and
matrices to `collision-geometry.json`, plus generated `LAVA_DISPLAY_WIDTHS`,
`LAVA_DISPLAY_X_BOUNDS` and `lavaParentWidth(frame, hitEffects)` in
`enemy-display-bounds.ts`. All captured widths, including parent hit particles,
match exactly; existing Archer/Fly/Barbarian tables are unchanged.
The generated collision data retains every earlier enemy/shape/effect exactly.

The only changed existing public files are `manifest.json` and
`collision-geometry.json`; two new files are `sprites/enemy_lava.png` and `.json`.
Counts become 108 images, 50 clips, 89 sounds and 6 fonts. No previous image, font or
sound bytes change. `soundExp1` is already used; `soundDead1` was packaged but
requires the ordinary runtime preload/kill routing. Asset preservation evidence is
`.build/web-assets/lava-assets-verification.json`.

## Controlled original comparison

`tools/build_lava_oracle.py` creates an ignored diagnostic from the preserved SWF.
It wraps RNG, adds observers and uses the established startup bypass; it retains
original `enemy.init`, AI, damage, root alert, castle damage, timeline scripts and
vector `hitTestPoint`. All non-code tag payloads, tag order and frame header remain
unchanged. The explicit schedule is **AI → child frame → existing parent effects**;
native scheduler timing is not claimed.

The accepted capture has 11 controlled cases/659 snapshots: fresh walking, alert
crossing/fallback, moving attack/explosion/removal, pre-attack and post-attack
knockback, a real critical weapon hit at the left clamp, a nonlethal hit during
attack, and lethal hits while walking or just before explosion. Twelve80×80 grids
cover alive/attack/explosion/death poses, both death shadow histories and a
fractional actor position: 76,800 sampled points. Direct damage inputs are controlled
method probes, not complete firing volleys or an earned campaign.

Commands from the repository root:

```powershell
python tools/extract_web_assets.py
python tools/build_lava_oracle.py
python tools/serve_oracle.py
```

The integration owner captured two identical original runs at `?suite=lava` on
2026-11-02T04:20:35.304Z, using `@ruffle-rs/ruffle 0.7.1`.
From `web`, compare with
`node --experimental-strip-types scripts/compare-lava-reference.ts`.
The report is `.build/oracle/lava-comparison-report.json`; the accepted fixture is
`web/tests/fixtures/original-lava-trace.json`. All **659 runtime snapshots and
12 grids/76,800 sampled points** match the production path. Four focused tests in
`web/tests/lava-reference.test.ts` pass, including negative controls for interrupting
the committed attack and retaining the previous coordinate transform.

- Diagnostic SWF SHA-256: `e8fb578050efd97d0192b7f1d2b2c4c96ac74c4730b532df0b1809066fb56711`.
- Accepted trace SHA-256: `5e4ef7546074262b74aaffb897b1f5846096239b265b4789bc80cc73e543d0b5`.
- In the ordinary attack probe, step1 reaches frame24/x459.8, step12 reaches
  frame35/x523.6 and reduces HP40→28, and step28 nullifies at frame223. The explosion
  consumes five draws beyond the three spawn draws: the ordinary castle path and
  two shake-direction draws.
- A walking lethal hit stops at frame128 with `shadowHit=true` and removes at
  death time200. A lethal hit after attack entry retains `shadowHit=false`, prevents
  the explosion and follows the same ordinary corpse lifetime.

## Reproduced coordinate conversion mismatch

The first production comparison matched all 659 states and 11 grids but returned
six false-positive points on the slanted explosion shape868 at frame50. The full
before-report is retained at
`.build/oracle/lava-comparison-before-geometry-review.json`. This was not missing
art, alpha transparency or a reason to widen tolerance.

The original run is through Ruffle 0.7.1. Independently inspected upstream source
at commit `bad2f8fbc6e7c1ae741b664034ad19e4ad8af9d0` (2026-11-01) provides the
mechanism: `Graphic.hit_test_shape` uses the full global inverse matrix, while
the renderer stores matrix coefficients in f32 and rounds inverse translation
and point multiplication separately to integer twips, with ties to even.
Primary sources: [graphic hit testing](https://github.com/ruffle-rs/ruffle/blob/bad2f8fbc6e7c1ae741b664034ad19e4ad8af9d0/core/src/display_object/graphic.rs#L267),
[global-to-local conversion](https://github.com/ruffle-rs/ruffle/blob/bad2f8fbc6e7c1ae741b664034ad19e4ad8af9d0/core/src/display_object.rs#L1547),
and [matrix inverse, multiplication and rounding](https://github.com/ruffle-rs/ruffle/blob/bad2f8fbc6e7c1ae741b664034ad19e4ad8af9d0/render/src/matrix.rs#L155).
This inspected commit is recorded separately; it is not asserted to be the exact
commit used to build the bundled 0.7.1 package.

The prior port subtracted the actor origin first, then used a double-precision
inverse and truncation. The corrected `collision.ts` follows the observed global
matrix calculation. An ignored candidate first passed the Lava comparison and
all 13 earlier ordinary/Archer/Fly/Barbarian reference tests; the same checks passed
again after integration. Source observations were not edited. The six exact points
remain in a negative control that demonstrates the previous formula's failure.
Candidate evidence and pinned source-file hashes are retained under
`.build/oracle/lava-comparison-global-matrix-candidate.json` and
`.build/oracle/ruffle-geometry-review/provenance.json`.

Although frame50 is already dead, it is not safe to dismiss its contour as merely
cosmetic: original `procHit` (Main1428) and `shoot` (7787) can consume SENSE/critical
RNG for a shape hit before enemy damage rejects a dead actor. The existing production
paths preserve that ordering. This correction concerns the reproduced port
coordinate mismatch; it does **not** reproduce the veteran late-game hitbox report.

Bounds and contours are verified at the sampled poses/positions, not every possible
fractional transform. Native child scheduling, complete screen pixel parity and
the camera-shake presentation remain separate limitations. The original explosion
art/audio and shake RNG are implemented; the current renderer's missing cosmetic
camera shake is a pre-existing presentation gap, not hidden by the source comparison.
