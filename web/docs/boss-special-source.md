# Day 7 boss grenade special

Mission level 6 first enables the boss grenade special. The implementation uses
the existing boss state, ally animation and grenade projectile path. It does not
add the level-20 rocket special, level-10 reactive shield or level-15 boss rage.

## Source behavior

The preserved `enemy.as` export, lines 1087–1104, checks these conditions when a
walking boss's count reaches zero:

1. `random() < 0.15 && level >= 3` chooses the existing shield.
2. Otherwise, `random() < 0.2 && level >= 6` chooses the special.
3. Otherwise, the boss prepares ordinary gunfire.

The random calls occur before the level checks. Special entry faces left, stops
movement, sets action 5 and `spAttack = [60,184,1]`, then evaluates another
`random() < 0.5 && level >= 20` condition even at level 6. The grenade windup is
`60 + int(random() * 30)` AI calls, with ally frame 184 stopped. Decrementing idle
from 1 to 0 does not release it until the following AI call.

Release at `enemy.as` lines 1131–1148 sets action -1 and recovery idle
`25 + int(random() * 25)`, starts ally frame 170, and calls the original equivalent
of:

```text
throwGrenade(-1, -1, boss.x, boss.y,
             player.x + random()*120 - 20,
             player.y + random()*100 - 50,
             12, -1, 1)
damageCastle(boss, int(boss.attack * 3))
sound_gun11.play(...)
```

The wall takes damage at release. The travelling grenade is cosmetic: its
damage is the source sentinel `-1`, and its owner/weapon are also `-1`.
`MainTimeline.as` lines 3042–3075 create the explosion artwork and sound, then
call `shake(10,5,0.9)` before returning for damage -1. Shake consumes two random
draws even though this explosion damages no enemy and does not hit the wall again.
The ordinary `damageCastle` protection, absorption and skill rules still apply
to the immediate release damage.

`bullet_grenade2.as` supplies the existing grenade trajectory. Its root has y=0;
the body starts at local x=-0.6, y=-79.85 and shadow y=-21.7. Each update decrements
count, moves x, rotates the body by -24 degrees, evaluates the parabola and moves
the shadow. At count zero it calls the explosion callback and detaches. Source
display-coordinate quantization remains in the shared projectile implementation.
The original launcher-grenade body/shadow, explosion and ally frames 170–184
were already extracted; this slice adds no replacement artwork.

Surviving damage during action 5 subtracts normal damage from HP, then doubles
that damage only for `boss.damage` (`enemy.as` lines 869–874). It does not double
HP damage, reset the windup or immediately select a shield at level 6. Boss
knockback resistance is zero, so the tested ordinary weapon hit also preserves
the windup. A lethal hit returns before this accumulator update and prevents
an unreleased special. Projectiles already launched are independent of the boss
and remain in flight after its death.

## Runtime and save boundary

The port uses `bossAction=5`, the existing idle/frame fields and the shared
`ProjectileState`. At the current campaign boundary the only available special
is a grenade, so a separate `spAttack` array would duplicate known state.
The cosmetic projectile is exactly `kind='grenade', damage=-1, weaponSlot=null`.
Version 14 permits this combination only in Day 7 state; older saves
and other negative-damage combinations remain invalid. Cosmetic explosions bypass
the hero's Da Bomb multiplier and enemy damage while retaining sound/art and
the two shake random draws. The existing birth-UID boundary delays movement of
a newly created projectile until the next simulation update.

This is source fidelity, not a new balance correction. Pause continues the port's
documented policy of freezing actors, including projectiles.

## Independent original evidence

`tools/build_boss_special_oracle.py` instruments a copy of the preserved SWF.
The original enemy AI/damage, ally frame scripts, grenade factory/flight and
castle-damage bodies remain intact behind observers. The driver configures
bounded inputs and advances boss AI, ally child frame, then previously existing
projectiles. New projectiles are initialized and observed on their birth step.
This explicit schedule does not establish native full-battle scheduling parity.

The diagnostic contains nine cases and 337 snapshots:

- Shield priority at 0.149; the special upper boundary at exactly 0.2; and a
  below-level-6 guard with a qualifying special draw.
- Complete special entry with the first draw exactly 0.15, stopped windup,
  release, flight, explosion and subsequent movement.
- Two surviving hits and an ordinary weapon hit during windup.
- Lethal hits immediately before release and after release.
- Two controlled consecutive releases, observing both projectiles independently.

Controlled random prefixes replace returned values while still advancing and
counting every seeded xorshift32 draw. The expected results come from two
identical Ruffle runs captured at `2026-11-02T00:42:46.241Z`; no expected state is
generated by the port. The comparator invokes the actual production
`tickEnemy`, `tickProjectiles`, `damageEnemy` and `damageCastle` paths. Every
compared numeric field, including rotation, matches exactly without a tolerance.

In the full windup case, entry at step 1 holds idle 75/frame 184. Step 76 reaches
idle zero without a shot. Step 77 releases, reaches frame 171 after the explicit
child step and changes wall HP 40→37. The grenade is still at its original birth
transform. It lands at step 102, x=531.25/y=282.45; wall HP stays 37 and exactly
two shake draws are consumed. Surviving hits of 10 and 7 leave HP 283 and damage
accumulator 34. Death before release leaves the wall at 40; death after release
leaves one completed cosmetic explosion. Two controlled releases cause exactly
two immediate wall hits and two later cosmetic explosions.

The first comparison found 117 differences confined to a one-ULP speed value:
source `speedBase * atan2(...) * 2 / PI` versus the port's grouped
`speedBase * (atan2(...) * 2 / PI)`. Keeping source operation order made all
337 snapshots match. The initial report is preserved at
`.build/oracle/boss-special-before-arithmetic-comparison.json`; the vertical-shot
correction remains unchanged. A negative-control test replaces the doubled
windup accumulator with ordinary damage accounting and the original trace
rejects it.

Provenance:

- Original SWF SHA-256:
  `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Diagnostic SWF SHA-256:
  `ff498f9d152972b59cbf27b6ef666a9188fd7941c5d42da1827bd74a9c0107f3`.
- Canonical captured trace SHA-256:
  `370d1694b3fe8828bc8e3581a7d0127aabcbc7578eddd3253892af82612b5081`.
- All 3,491 tags retain order and non-code payloads. Only DoABC tag 2782 changes;
  the diagnostic SWF header version is 10. Recovery inputs remain unchanged.
- Accepted fixture: `web/tests/fixtures/original-boss-special-trace.json`.
  Browser/build/comparison reports use `.build/oracle/boss-special-*.json`.

Regeneration and comparison:

```powershell
python tools/build_boss_special_oracle.py
# Capture two original runs through the existing oracle page with ?suite=boss-special.
Set-Location web
npm run test:boss-special-reference
node --experimental-strip-types --test tests/boss-special-reference.test.ts
```

These cases isolate original methods and controlled hits; they do not prove
geometric shooting, native event scheduling, a full browser campaign, pixel/audio
parity or the reported late-game hitbox problem. The repeated-release case does
not measure the frequency of natural special attacks. Fixture replacement
requires another repeatable original capture and reviewed comparison.
