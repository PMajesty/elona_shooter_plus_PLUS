# Fly source behavior and comparison boundary

Fly is original enemy ID 10: catalogue level 6, power 30 and `AIR`. It becomes
reachable in the fifth-day mission, whose wave selection has a separate
accepted reference. This implementation includes movement, hovering,
knockback, castle exit, death, the original artwork and filled-contour collision.
It also deliberately removes two observed dependencies on a previously pooled
enemy's state. That correction is distinguished below from source parity.

Source anchors are `src/original/MainTimeline.as:1534` (catalogue),
`.build/export/scripts/enemy.as:427` (initialization), `enemy.as:1011`
(knockback), `enemy.as:1300` (Fly AI), `enemy.as:152` and `enemy.as:933`
(removal), and `.build/export/scripts/enemy_fly.as` (symbol 952 frame scripts).
The exported class scripts and XML can be regenerated from the unchanged SWF
with `python tools/extract_web_assets.py`.

## Initialization, movement and saved state

Original initialization sets HP 2, attack 2, speed `1.8 + random()`,
`y=int(random()*70/1.5 + 80)`, AIR type and loot 33. Critical bounds are
`[-100,-100,-100,-100]`. The common initialization also applies its source
speed calculation, records `speedOrg` and rolls the reward fields. The
comparison checks these complete spawn results, RNG state and draw count;
the renderer does not reroll them.

Each living AI update increments `dirCounter`. Counts below 40 move by speed.
At 40 the original sorts the actor and sets speed 0. From 40 onward, each update
rolls `<0.02` to restore `speedOrg` and reset the counter 0. A successful reset
does not move the actor until the next AI update. Crossing `x>640` invokes
original `damageCastle(undefined,attack)` and removes the actor. The controlled
unprotected case changes castle HP 40→38.

Knockback decrements its counter before subtracting
`counter*counter/40 + resKnock/2 + 0.2`, then clamps the parent x to `-mc.width`.
That width is the transformed display geometry, including transparent bitmap
fill bounds and the shadow; it is not the opaque PNG width. Version 12 persists
`flyCounter`, frame, shadow history and the existing combat fields. New Fly
actors use counter 0 and resistance 1; importing older port saves does not invent
Fly actors or recover original Flash save history.

## Observed pool-state defect and explicit correction

The source declares `dirCounter:int` with default 0 and `resKnock=1` on the
enemy object, but Fly initialization resets neither field. The original pool
therefore makes a new Fly depend on the previous occupant of that object.
The accepted diagnostic runs observe both the raw reuse and a separate
intervention calling only `dirCounter=0; resKnock=1` before original Fly
initialization:

| Previous pooled enemy | Raw new Fly counter | Raw resistance | Explicitly reset new Fly |
| --- | ---: | ---: | --- |
| Fly after 45 controlled updates | 45 | 1 | counter 0, resistance 1 |
| Sheep | 0 | 0.9 | counter 0, resistance 1 |
| Rat | 0 | 1.1 | counter 0, resistance 1 |
| Boss | 0 | 0 | counter 0, resistance 1 |

The prior Fly is advanced with controlled random returns 0.5, still consuming
the underlying stream. Before the new Fly spawn, both paired cases reset to
the same seed and draw count. Thus raw and reset cases have identical prior
observations and spawn RNG; the changed fields are exposed, rather than hidden
in an expected-value adjustment. The port compares against fresh and explicit
reset original runs. It retains all 73 raw observations as defect evidence and
does not claim to reproduce them. This is an intentional fix for the observed
state leak, not evidence that the reported late-game hitbox problem is solved.

## Animation, distant shadow and collision

Symbol 952 contains 126 frames with labels `init=1`, `alive=3`, `dead=12` and
`null=126`. Frame 9 jumps to 3. Frame 12 plays original `sound_dead6`; frame 41
stops the fallen corpse. Frame 1 makes the shadow visible and sets
`shadowHit=false`; frame 15 makes it visible again; frame 23 sets
`shadowHit=true`.

The named shadow is symbol 680 at local `(-6.1,104.1)`, with scale
`(0.714141845703125,0.547576904296875)` and an identity nested shape 679.
It is about 104 pixels below the living body. The original corpse falls toward
that position, so clipping collision probes or artwork to a small square around
the root would omit consequential geometry. The extracted atlas retains all 126
frames, 23 unique images, a 21×122 frame rectangle and registration offset
`(9.6,7.65)`.

The source death path 12→15→23 matters: directly jumping to 41 would skip the
script enabling shadow hits. In the accepted death trace, update 10 is frame 22
with shadow exclusion, update 11 reaches 23 and enables it, update 29 reaches the
stopped frame 41, and update 199 still has the corpse attached. Update 200 invokes
removal: frame 126, HP −1 and death counter 201. Later diagnostic steps leave that
removed state unchanged.

`ordinaryEnemyHit` uses extracted original filled contours, not PNG alpha.
The eight source grids cover frames 1/3/8/12/15/22/23/41 at actor `(200,220)`,
sampling integer world coordinates from `(168,196)` over 64×160. For each point
the comparison checks the whole original `mc.hitTestPoint(...,true)` predicate
and the combined predicate `body && !(shadowHit===false && shadow)`.
All 81,920 points match for both predicates. These grids cover body and distant
shadow; they do not establish every fractional placement or transform.

## Display-width and coordinate findings

The first comparison matched 207/503 states. It exposed 296 display-width
differences and 17 x differences: 16 from the left clamp and one JavaScript
negative zero. Original Fly widths include 14.25, 16.75 and 16.65 pixels where
truncating transformed shape-bound corners produced 14.2, 16.7 and 16.6.
The generator now rounds **Fly-only** transformed corners to the nearest twip
with `floor(value+0.5)`. All widths sampled by the source trace then match.
The previously accepted Archer table remains byte-for-byte unchanged; this
measurement was not generalized to untested symbols or frames.

This bounds rounding differs from assignment of a display coordinate. The
existing explicit movement quantization truncates to integer twips. The port
now canonicalizes a zero result to positive 0 at that assignment boundary,
matching the source's integer storage; it preserves other values, including
NaN, rather than using `value || 0`. No comparator tolerance or signed-zero
exception was added. The earlier report and generated table remain under
`.build/oracle/fly-before-width-rounding/`.

## Accepted original evidence and regeneration

Two identical Ruffle 0.7.1 runs captured 576 state snapshots in 13 scenarios,
plus eight geometry grids, at `2026-11-01T23:53:18.988Z`. All 503 fresh or
explicit-reset snapshots and all eight grids match. The 73 raw pooled states
remain separately classified. Four focused tests verify fixture provenance,
production comparison, the observed pool differences, consequential lifecycle
boundaries and rejection of an intentionally broken hover counter.

- Original SWF SHA-256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Diagnostic SWF SHA-256: `89246db4326950b6b55f5614c31b23b6b1ca5ee4b16c560d572a718e3c5041b9`.
- Trace SHA-256: `f613f617ed93c955f94b0059092cac7918f6adcf66f47c845464ca8a8ab00a08`.
- Accepted fixture: `web/tests/fixtures/original-fly-trace.json`.
- Runtime and comparison reports: `.build/oracle/fly-browser-report.json` and `.build/oracle/fly-comparison-report.json`.

The diagnostic preserves all 3491 tags, non-code payloads, tag order and frame
header. Only DoABC 2782 changes; the diagnostic SWF header is version 10 for the
instrumented code. The immutable original SWF and source baselines remain
unchanged. The builder alone reports `runtime_validated:false`; the separate
two-run browser report establishes actual execution.

```powershell
python tools/extract_web_assets.py
# Standalone geometry/bounds regeneration, using the exported original XML:
python tools/extract_collision_geometry.py --display-output web/src/enemy-display-bounds.ts
python tools/build_fly_oracle.py
# With the reference server running, capture two runs at:
# http://127.0.0.1:5176/?suite=fly
Set-Location web
npm.cmd run test:fly-reference
node --experimental-strip-types --test tests/fly-reference.test.ts
```

The diagnostic calls original AI followed by an explicit child-frame step,
observing the source's play/stop calls. It does not prove native timeline
scheduling, rendered pixel or audio parity, every damage/effect interaction,
or whole-battle balance. Fifth-day wave selection and fifth-town preparation
have their own accepted fixtures; browser integration is validated separately.
