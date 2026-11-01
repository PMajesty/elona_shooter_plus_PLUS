# Early boss shield and presentation

The current boundary is the solo Sheriff's first four days, through mission
level 3. It includes the first shield branch; special attacks, reactive shields
at level 10 and boss rampage remain outside that campaign boundary.

Source anchors are `.build/export/scripts/enemy.as` (original boss initialization
around line 197, guarded damage around 651, AI actions around 1049–1179),
`ally1.as` (symbol 838 frame scripts), and `src/original/MainTimeline.as`
`getWeaponInfo` (9938), `soundPos` (5854), and sound transforms (9154).

## AI, direction and animation

- Action 3 sets `mc.scaleX=-1`, starts `walk` at frame 200, restores positive
  `speedOrg`, and becomes action 2. Action 4 uses scaleX=1 and negative speed.
- Action 2 moves, decrements its count, and checks the shield roll before the
  special-attack roll. The first shield requires level 3 and a roll below 0.15.
  It sets count to `100 + int(random()*100)`, action 6 and frame `shield` (221).
  Entry retains the preceding speed and facing until the next action-6 update.
- Action 6 decrements the count, sets scaleX=-1 and speed=0, then returns to
  action 2 when the count reaches zero. It does not restart walking immediately.
- The walk frame script jumps 212→200. Shield frame 221 selects body pose 1,
  frame 227 selects pose 4, and frame 236 stops. Child animation advances while
  AI waits, including its idle timer; the stopped shield remains visible until
  another original action selects a frame.
- Boss weapons 1 and 2 both use firing frame 10 and idle frame 24. Their sounds
  are respectively `soundGun6` and `soundGun2`. Source sound position uses
  `clamp(int(int(x)/25),0,19)*0.08-0.8` and volume 0.9.

The renderer uses the simulation's canonical frame and `bossFacing`, rather
than advancing another boss animation clock. Existing `allyBack`, `charaPic`,
`allyFront`, `charaPic` layers already contain the full shield artwork.
`syncBossActor` also runs at each boss collision query, so projectiles see the
position, direction and pose after that update's enemy AI. This corrects a
port-specific stale-display query; it does not reproduce or resolve the reported
late-game hitbox problem. Boss collision still samples the reconstructed raster
layers and has not received the ordinary-enemy contour equivalence claim.

Version 11 saves persist boss facing. Legacy versions 1–10 retain the old
renderer direction (-1); lost historical facing cannot be recovered. Legacy
walking frames 212–219 fold into the original 200–211 loop. This is a migration
of an earlier port state, not a claim about original Flash saves.

## Guarded hit presentation

Source `enemy.damage` reduces guarded raw damage to `int(rawDamage/10 + 1)`,
plays `sound_low` and uses effect symbol **1459**, frames **140–145**. Frame 146
removes the effect. `shieldHit` contains those six frames, three unique images,
with frame size **35×32** and registration offset **(14.95,15.85)**.
The source alpha sequence is **0.7, 0.7, 0.5, 0.5, 0.2, 0.2**.

The effect follows the enemy's parent position, above that enemy's body. It is
not mirrored with `mc`: the source adds it to the enemy container itself.
The browser's `bossGuard` hit event selects this original artwork and sound.
General damage particles remain a separate existing presentation gap; adding
this specific effect does not establish full combat-VFX parity.

`python tools/extract_web_assets.py` reproducibly extracts the six source frames
and alpha metadata. The original SWF SHA-256 remains
`4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.

## Original comparison boundary

`tools/build_boss_ai_oracle.py` executes original boss AI followed by an explicit
child-frame step. Read-only observers track the source's own play/stop calls;
the driver does not copy the port's list of stopped frames. Eight scenarios
produce **301 state snapshots**, covering forward/backward walking, shield
entry/hold/exit, the below-level guard, both weapons and idle animation. Four
additional original `procHit`/`explode` cases compare guarded and open targets.
The single-pellet cases supply raw damage 45 and original shape-hit results;
the complete shooting volley and boss collision geometry have separate limits.

The initial capture matched all AI states and hit damage/RNG, but its guarded
hit setup jumped directly to frame 236, skipping the source's pose-selection
script at 227. That report is retained under
`.build/oracle/boss-ai-before-pose-path/`. The corrected setup enters
221→227→236 before testing damage. No original expected values are rewritten
and no pose comparison is exempted. Two identical corrected Ruffle 0.7.1 runs
were captured at `2026-11-01T23:37:58.173Z`; all **305 observations match** with
no source errors. Guarded raw damage 45 becomes 5, while open damage stays 45.
Pellet guard/open cases consume 1/3 random draws; explosion guard/open cases
consume 2/4. All state snapshots also compare exact RNG state and draw counts.

- Accepted fixture: `web/tests/fixtures/original-boss-ai-trace.json`.
- Diagnostic SWF SHA-256: `4cc75bd86156ddec8a505c3a24336e2c38d4a68457df5336e30d87e389e0a750`.
- Accepted trace SHA-256: `1cb733b3cce8f452370657e846b1c3aad3137385accc8dc7de73b51deb634cee`.
- Detailed report: `.build/oracle/boss-ai-comparison-report.json`.
- Three regressions in `web/tests/boss-ai-reference.test.ts` verify the trace,
  consequential source transitions/damage, and rejection of fixed-facing state.

Regeneration and comparison:

```powershell
python tools/build_boss_ai_oracle.py
# Capture two identical runs at http://127.0.0.1:5176/?suite=boss-ai
Set-Location web
npm.cmd run test:boss-ai-reference
```

These are controlled original-method comparisons. Native display scheduling,
rendered pixels and stereo audio require separate observation in the browser.
