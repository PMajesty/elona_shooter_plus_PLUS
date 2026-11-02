# Barbarian behavior, effects and original comparison

The sixth-day implementation adds original enemy ID 7, `barbarian`, using
symbol 1340. Catalogue level 7/power 95 and `BATCH`/`MASS` determine selection;
the accepted sixth-day wave fixture checks that separately. Barbarian movement,
rage, attacks, knockback, death and temporary effect geometry are compared here.
No intentional balance correction is introduced for this enemy.

Source anchors:

- `src/original/MainTimeline.as:1535`: catalogue position after Fly.
- `.build/export/scripts/enemy.as:166`: common initialization, including `rampage=0`.
- `enemy.as:386`: Barbarian initialization; `enemy.as:550`: damage processing.
- `enemy.as:842`: nonlethal rage branch and its speed calculations.
- `enemy.as:1007`: knockback and the **parent** display-width clamp.
- `enemy.as:1036`: shared Ogre AI used by Barbarian.
- `.build/export/scripts/enemy_barb.as`: symbol 1340 frame scripts.
- `.build/export/scripts/ef_rampage_enemy.as` and `effect.as`: temporary effects.

## Source state and timeline

Initialization sets HP 85, attack 5, speed `1.2 + random()*0.8`, ground y,
critical bounds `[-9,7,-19,-8]`, loot 7 and knockback resistance 0.8. Common
initialization applies mission modifiers, truncates y, records `speedOrg`,
and rolls rewards. Until attacking, the actor moves by speed. Reaching
`x>=455` sets speed 0, starts attack and sets `attacking=true`.

The 266-frame source clip has labels `init=1`, `alive=3`, `attack=26`,
`attack2=38`, `dead=84`, `null=252`. Frame 23 returns to 3. Frame 26 invokes the
source alert. Frame 45 damages the castle. Frame 72 returns to 26. Frame 1 sets
`shadowHit=true`, with no later frame changing it. Death starts 84, plays
`sound_dead2`, stops at 119, and removes the actor at death update 200. Removal
leaves HP −1/frame 252/death counter 201. The detached clip still has width 18.5,
while the now-empty enemy parent has width 0; the comparator models that actual
display relationship rather than dropping either observation.

After a nonlethal hit, an unraged Barbarian rolls `random()>0.75`. Earlier
weapon effects and damage have already occurred. Success sets `rampage=100`,
changes nonzero current speed to `speed*1.5+1.7`, changes stored speed with
**`speedOrg *= speedOrg*1.5+1.7`**, and changes attack to `int(attack*0.5)+1`.
The unequal speed formulas are retained exactly. In the seed 42 case they yield
current speed 4.292374372854829 and stored speed 7.418294215258452. Interrupting
an attack with knockback restores the latter. An unusual expression alone is
not evidence of an intended bug fix.

Enemy rage does not count down: the original only resets it during `init`.
Subsequent hits skip the activation roll. The fixture explicitly tests the
strict threshold with 0.75 followed by 0.750001, then a repeated hit. Lethal hits
return through the kill branch before the rage roll; their other kill/drop RNG
is still compared. The attack timeline checks rage at 27 and jumps to 38, then
at 53 returns to 26. Observed normal castle hits occur 46 updates apart for 5 HP;
raged hits occur 16 updates apart for 3 HP. These are the original cadence and
damage, not a redesigned difficulty curve.

## Why temporary effects are combat state

Rage creates `ef_rampage_enemy` symbol 2385 **under mc**, at local `(0,20)`.
Its active frames 1–12 participate in `mc.hitTestPoint` and in display width;
frame 13 removes the effect. This short visual lifetime is separate from the
permanent rage flag. The production contour function includes that original
effect geometry and persists its current frame.

Every normal Barbarian hit also adds source `effect` symbol 1459 under the
**enemy parent**, at `(hitX-enemy.x,hitY-enemy.y)`, stored at twip precision.
Blood uses 50–62 and removes at 63. A critical hit adds another effect at 70–75,
removing at 76; frame 1 is a different blood animation, not the critical effect.
These parent particles affect the knockback width even though they do not
belong to the target's `mc.hitTestPoint` geometry.

The strengthened source probes demonstrate a consequence, not just different
reported widths. With actor x −25 and a within-body hit offset +10, the initial
body/rage width is 21.8 but parent width is 26.05. The first original knockback
ends at −26.05; a body-only clamp would end at −21.8. A controlled critical input
widens the parent to 29.05 and permits x −26.5. The separate far-offset probe
starts x −60 with offset +60 and is explicitly labeled `syntheticWidthDiagnostic`;
it isolates the same union rule and is not presented as a natural shot.

Version 13 Barbarian records therefore retain `rampage`, `rageEffectFrame` and
`hitEffects:{frame,x,y}[]`. `barbarianDisplayWidth` derives body/rage width;
`barbarianParentWidth` also unions every live hit particle's original X bounds.
AI uses the current bounds before body/effect advancement. The renderer draws
the same saved effect frames and offsets. This integration is scoped to
Barbarian, not a claim that all prior enemy particle interactions are covered.

Blood alpha is observed at the source's 1/256 precision: frames 50–53 use 1,
54–55 use 0.796875,56–57 use 0.59765625,58–59 use 0.3984375 and 60–62 use 0.09765625.
Critical and rage alpha remain 1. The comparison checks every recorded effect's
kind, frame, x/y, width and alpha as well as parent width and actor movement.

## Original artwork and generated geometry

`tools/extract_web_assets.py` generates these manifest clips:

| Clip | Source frames | Atlas frame size | Registration offset |
| --- | --- | --- | --- |
| `enemy_barbarian` | symbol 1340, frames 1–266 | 35×40 | (17.75,16.5) |
| `enemyRage` | symbol 2385, frames 1–14; display 1–12 | 43×49 | (21.75,48) |
| `bloodHit` | symbol 1459, frames 50–62 | 48×41 | (23.85,26.35) |
| `criticalHit` | symbol 1459, frames 70–75 | 20×20 | (10,10) |

Hit atlas frames start at 1 and declare `sourceFrameStart` 50/70 plus their
source alpha sequences. Original SWF symbol matrices and shape bounds generate
the contour JSON and TypeScript width tables. The first 637-state comparison
found 72 width differences and no other state differences: transformed Barbarian
bounds require nearest-twip rounding, such as 16.25 rather than 16.2. Only the new
Barbarian table was corrected. Existing Archer/Fly tables and all 86 prior
contour shapes/six prior enemy entries remain unchanged.

Twelve 80×80 source grids sample actor `(200,220)` from world `(160,172)`:
nine poses 1/3/22/26/38/45/53/84/119, plus pose 3 with rage frames 1/5/12.
All 76,800 points match the production filled-contour predicate. Shadow flags
come from source frame scripts. The parent-only blood/critical particles are
correctly excluded from these mc grids, while rage artwork is included.

## Accepted reference and regeneration

Two identical Ruffle 0.7.1 runs captured **671 state snapshots in 13 scenarios**
and the 12 grids at `2026-11-02T00:24:26.358Z`. All state fields, damage events,
RNG draws/states, effect observations, widths and grids match. Direct damage
fixtures supply raw damage and critical type explicitly; they do not test a
complete firing volley or automatic critical-point classification.

- Original SWF SHA-256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Diagnostic SWF SHA-256: `175b8a99384557ff5181de3052f0cdecb635e38cae83a068fd39a05198e55469`.
- Trace SHA-256: `e011432fcfed517c1f62ab33bc30aa81988863ea2b7317276e06046ac007e38c`.
- Accepted fixture: `web/tests/fixtures/original-barbarian-trace.json`.
- Reports: `.build/oracle/barbarian-browser-report.json` and `barbarian-comparison-report.json`.
- First capture, builder, SWF and pre-rounding evidence: `.build/oracle/barbarian-before-parent-clamp/`.
- Initial removed-parent projection failure: `.build/oracle/barbarian-before-detached-projection-report.json`.

All 3491 tag positions/types and non-code payloads are preserved. Only DoABC 2782
changes, with diagnostic header version 10; original SWF/AS baselines stay
unchanged. The explicit clock is original AI → body frame → existing transient
effects, observing source play/stop calls. Native event interleaving, visual
pixels, source alert presentation, arbitrary fractional transforms and whole
battle equivalence remain outside this fixture. It neither reproduces nor
resolves the reported late-game hitbox problem.

```powershell
python tools/extract_web_assets.py
python tools/build_barbarian_oracle.py
# Capture two runs with the local reference server at:
# http://127.0.0.1:5176/?suite=barbarian
Set-Location web
npm.cmd run test:barbarian-reference
node --experimental-strip-types --test tests/barbarian-reference.test.ts
```

Five focused tests cover provenance/full comparison, rage formulas and attack
timing, meaningful parent-clamp effects, death/removal and a negative control
that wrongly replaces stored rage speed with current speed. Expected source
results are never generated from the port.
