# Usable items: source boundary and runtime requirements

`consumables.ts` contains pure calculations for the original item IDs 11
(grenade), 12 (Repair Hammer), 37 (Holy Grail of Jure) and 38 (Ragnarok).
Source line numbers below refer to `src/original/MainTimeline.as`; embedded
class scripts are reproducible exports under `.build/export/scripts/`.
These source-derived tests are not an accepted original-runtime trace.

## Input, action order and consumption

The number-key handler (13231–13250) addresses source slots 20–24, corresponding
to the five visible shortcuts. It checks `num > 0`. Usable items call `useItem`
without switching the selected gun, cancelling its reload or checking its shot
cooldown. Empty shortcuts beep. Slot 25 is storage, not a sixth combat shortcut.

`useItem` (3645–3714) first checks whether a child named `timer` plus the source
slot index exists. A present timer beeps and returns, including when its value
is zero. Otherwise it performs the item's effect, decrements `ammo`, sets
`num = 0` if the remaining quantity is nonpositive, updates inventory, and only
then creates a recharge timer when both the base cooldown and remaining ammo
are positive. Runtime effects must succeed before committing the returned
`itemAfter`; an unavailable Ragnarok implementation must leave the item intact.

| Item | Effect before consumption | Base recharge |
| --- | --- | --- |
| Grenade 11 | Throw from the hero's actual display registration point toward the current mouse point, speed parameter 12, damage `item.attack`, shooter 0, weapon -1 | 100 |
| Repair Hammer 12 | `castleHP = min(castleMHP, castleHP + item.attack)`, castle flash counter 15, repair sound | 2000 |
| Grail 37 | Replace `protTime` with `item.attack` (normally 250), original `layhand` at (550,270), prayer sound | None |
| Ragnarok 38 | Thirty `spawnEnemy(13)` calls, then original message/effects, `mission.ragnarok = true`, `mission.time += 200` | None |

`calcRepair` (5429) returns the stored attack directly. Hammer has no full-HP
guard; using it on a full wall still consumes a charge and starts recharge if
more charges remain. This differs from the city's Free Repair action.
Ragnarok's stored attack 200 is unused by `useItem`; it is not explosion damage.
Its exact message is `Let's Ragnarok!`, with blend counter +15, blend type 0 and
`shake(150,1.5,1)` after the spawn attempts. These are presentation side effects.
Cooldown refusal has a beep and no text message in this method.

Grail/Ragnarok generation (4349–4366) has `ammoMax = 0`. `generateStuff` sets
their ammo to zero, so normal successful use stores **`ammo = -1, num = 0`**.
Retain that exact inactive record instead of fabricating a charge or replacing
the whole item with null. Only these artifacts need this known negative sentinel.
The helper rejects an inconsistent active grenade/hammer with zero ammo;
legacy ports that left such records active must canonicalize them during
migration. The original outer guard checks `num`, not an independent ammo guard.

`PARTY.SUPPLIER` is an already computed percentage, not a skill level. Supplier's
formula is 20 × level (9572). Recharge is
`int(base * 100 / (100 + PARTY.SUPPLIER))`. `itemTimer` decrements once per child
ENTER_FRAME and removes itself only when its timer becomes negative, so nominal
100 requires 101 child updates. A rounded value of zero still blocks for one
update. The helper exposes `cooldownFrames: null` for no timer and a separate
`blocksForUpdates`. Timers belong to slots, not item identities. `exitBattle2`
(13300) sets all five timers to zero for removal on the next child update;
`fillAmmo` does not replenish finite-charge consumables.

## Grenade trajectory and blast

`throwGrenade` (13357) computes speed as
`base * atan2(abs(targetX-startX)*2, abs(targetY-startY)) * 2/PI + 0.1`.
The grenade uses curvature 0.003. Its embedded class sets the update count to
`int(abs(targetX-startX)/speed)+1`, reverses speed for a target to the right,
then subtracts speed from x each update. Explosion occurs at the resulting
parabola point, which can overshoot the requested endpoint. The shadow follows
the linear ground path, divided by three before adding startY when targetY <135.
`createGrenadeFlight` and `advanceGrenadeFlight` preserve these calculations.

An exactly vertical target divides by zero in the original parabola. The helper
returns null for that launch instead of generating NaN coordinates or silently
moving the target. A caller that repairs this original defect must document its
chosen geometry; it should resolve the launch before consuming the item.

`explode` (3042–3085) applies `multiplier=(100+DA_BOMB)/100` for a valid allied
shooter. It multiplies and truncates the integer damage, then uses a strict
rectangle with half-width `60*multiplier` and half-height `50*multiplier`.
There is **no falloff**, ellipse or body-mask test. Corners inside that rectangle
receive the same raw damage as its center; boundary points are excluded.
The alternative explosion2 variant multiplies radius/VFX scale by 1.1 only
after damage scaling. Raw damage -1 is a visual-only sentinel.

The source iterates enemy slots in ascending index order and calls each live
enemy's ordinary damage method at its registration x/y with critical flag false.
`enemy.isDead` means HP <1, so the blast's alive predicate is HP >=1. Chain
explosions and kills can mutate later entries and consume RNG; preserve runtime
ordering rather than collecting an unordered hit set first.

Item grenades use weapon -1. Consequently `enemy.damage` skips weapon air/armor
scaling, leech, disarm, cripple and weapon knockback. It still applies the boss's
blocking action reduction (`int(damage/10+1)`), ordinary deaths/rewards, and the
special bomb-enemy branch that nullifies the bomb and triggers its own blast.
The pure explosion helper does not replace those runtime damage rules.

## Grail protection and pause

Root `onEnterFrame` (2247–2268) returns while paused, then handles `protTime`
before later frame work. Positive values decrement once. The update from 1
becomes -1 because the nonpositive branch decrements again. Negative values
decrease twice per update until <=-100, then reset to zero. Only `protTime > 0`
protects the castle; the negative tail is visual fade, not extra immunity.
The blue value is an addition to the color transform's **blue multiplier**,
not its offset. `advanceProtection` returns that value as `blueMultiplierAdd`.

`damageCastle` (10859) checks global immune first, then positive protection.
Protected damage plays the defend sound and returns **before** Guardian
retaliation, insurance money, Defender RNG, sister damage, absorption, HP loss
or Last Hope RNG. Reusing a Grail replaces the counter; it does not add duration.

The original `itemTimer` and `bullet_grenade` child handlers do not test pause.
Although `checkPaused` is assigned to the grenade, that class does not call it.
The port's global pause policy therefore needs an explicit decision; freezing
these objects consistently is an intentional difference, not exact source
child scheduling. No pure helper advances time by itself.

## Ragnarok's required runtime

Enemy 13 is the source dinosaur, with registration level 28 and power 550
(1544). Its base initialization in `enemy.as` uses HP700, attack25, attack range
[190,400], speed `random*1.3+1.7`, ground Y, counter `50+int(random*70)`, loot34,
knock resistance0.2 and an absent critical region. Common initialization first
draws gold, starts x at -20, truncates Y and applies mission/party modifiers.
The spawn pool and original RNG order are part of the effect.

The `enemy_dino` symbol1247 also owns behavior: frame26 alerts; frame146 plays
lightning and damages the castle when unpaused; frame179 marks an attack;
frame182 marks it and loops the attack; frame194 plays its death sound; frame225
stops. Its AI chooses/loops attack phases and can resist weapon knockback while
attacking. Thirty placeholders or a single burst of damage would not implement
Ragnarok. `planConsumableUse` exposes the exact spawn intent with
`requires: 'original-dinosaur-runtime'`; the caller decides availability before
committing consumption. Source pool exhaustion also needs inspection rather
than assuming every one of the thirty spawn attempts creates an enemy.
