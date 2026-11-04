# Classic and Expanded

Implemented 2026-11-04, jointly designed and coded by Codex and Claude Opus.
These are fan additions, separate from the original developers' game.

## Player behavior

- The title's **New Game Edition** selector defaults to Classic. Expanded opts
  into new features; the original Game MODs remain independent choices.
- An adventure keeps its edition throughout its life. Continue/import use the
  saved edition regardless of the selector. There is no in-place conversion.
- Both editions share the eight labeled adventure slots, with confirmation
  before overwriting. Use an empty slot to keep both adventures. Medals and day
  records are independent; importing merges only the matching collection.
- Existing browser saves and Flash imports are Classic. The save format is v46;
  current saves require a supported edition/content revision. Unknown revisions
  fail before changing the active adventure or storage. Carry Over stays within
  the adventure's edition. Mute remains a shared browser preference.

## Careful Consideration

In Expanded, open Barrack, select a companion and choose the order. Change back
to any ordinary order to remove its penalty. The hero does not receive this order.
After contracting a temporary henchman, the Inn offers the same opt-in before
Rest; this preference is saved for future contracts.

Urgent wall threats come first, then ranged attackers, then other enemies.
This hierarchy applies to every weapon, including shotguns and SMGs. Chickens
are ranged threats: the original egg-attack frame damages the castle from
midfield. Weapon roles break ties within a threat category. Preferred
range is a preference, not an exclusion. Tagged enemies remain eligible so
another troop's target does not leave everyone else idle. Boss is a small
preference; Defend broadens the urgency boundary. A troop keeps its aim unless
its target becomes invalid/shielded or a higher-priority threat appears, including
a ranged attacker appearing while it is targeting a distant melee enemy.

The order trades speed and damage for less supervision. Each new gun target
takes **0.2 seconds longer to aim at**, including a switch to a more urgent foe.
It chooses the target immediately and stops shooting a shielded boss immediately.
Keeping the same target does not restart this delay or slow subsequent shots.
The extra six simulation frames use the existing saved aim counter.

It also costs **15% automatic shot damage**, including class grenades, applied
once when fired. Grenades have no extra targeting delay. Projectiles retain their
launch damage after an order change or Continue.
Integer projectile damage can round the effective loss slightly above 15%.
Learned skills, weapon eligibility, accuracy, ammunition and reload rules are
unchanged. Careful uses ordinary-order accuracy; Fire at will keeps its original
spread penalty. Ordinary orders keep their original aiming time and full damage.
Orders can only be changed in town, so the costs cannot be toggled off mid-battle.
Existing saves keep pending aim and projectile damage; the new delay applies
when a new target is acquired.

The order stops targeting guarded bosses. Existing projectiles and incidental
pellets/blasts can still arrive after a shield rises. Ordinary acquisition rolls
remain, and shooting beyond preferred range can waste ammunition. This
is assistance toward a Perfect Game, not a guarantee of one.

## Evidence and limits

The first release compared mainly against Fire at will, which has its own
accuracy penalty. After player feedback, Codex and Opus added the aim delay
and compared ordinary order0 as well. Four paired seeds (42, 137, 2026, 8675309)
use identical starting stats/RNG, one companion, an idle hero, 100 castle HP and
a 30-second limit. These are hand-positioned encounters, not campaign victories.

| Encounter | Ordinary order | Careful Consideration |
| --- | --- | --- |
| Close-range rush, SMG | Clears in 6.70s; 65.75 HP left | Clears in 8.53s; 53.75 HP left |
| Six sheep, shotgun | Clears in 5.66s; 5 shots | Clears in 7.35s; 5.75 shots |
| Ranged foes among sheep, sniper | Does not clear in any seed | Clears in every seed; 61.75 HP left |
| Shielded boss with other foes, rifle | Does not clear in any seed | Clears in every seed; 92.50 HP left |

Values are means. Careful lost more castle HP in every rush seed. It remains
useful against mixed threats, but ordinary orders can clear suitable targets
faster. Careful aimed no new shots at the guarded boss; Fire at will aimed four
per seed. Class charge bonuses can partly offset the extra aim time, and different
decisions change later RNG. These 44 short runs support an initial tradeoff,
not a claim of universal or long-term campaign balance. No further damage cut
was added.

Reproduce with `node --experimental-strip-types --test web/tests/careful-balance.test.ts`.
Focused tests cover urgency, range fallback, retained aim, shields, original-order
parity, actual damage, launch persistence, save/replay, edition/profile isolation,
and hired-gun Rest integration. Browser checks use isolated muted profiles and
real menu actions/exported saves. Original AI snapshots remain unchanged.

`rulesets.ts` defines the small edition/capability boundary. Both editions still
use the original content catalog; no new classes, items or enemies ship yet.
Add future content through this boundary and versioned save identities as needed,
without a parallel game engine or speculative plugin framework.
