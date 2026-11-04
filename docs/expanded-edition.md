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

Urgent wall threats outrank weapon roles. Rifles and long-range weapons otherwise
prefer ranged attackers; close weapons favor approaching enemies. Preferred
range is a preference, not an exclusion. Tagged enemies remain eligible so
another troop's target does not leave everyone else idle. Boss is a small
preference; Defend broadens the urgency boundary. A troop keeps its aim unless
its target becomes invalid/shielded or a more urgent threat appears.

The order costs **15% automatic shot damage**, including class grenades, applied
once when fired. Projectiles retain that damage after an order change or Continue.
Integer projectile damage can round the effective loss slightly above 15%.
Learned skills, weapon eligibility, accuracy, ammunition and reload rules are
unchanged. Careful uses ordinary-order accuracy; Fire at will keeps its original
spread penalty. No extra accuracy bonus or aim-time shortcut is introduced.

The order stops targeting guarded bosses. Existing projectiles and incidental
pellets/blasts can still arrive after a shield rises. Normal acquisition/aiming
delays remain, and shooting beyond preferred range can waste ammunition. This
is assistance toward a Perfect Game, not a guarantee of one.

## Evidence and limits

Opus reviewed the integration and ran three actual-Simulation skirmishes with
four paired seeds (42, 137, 2026, 8675309). Same starting stats/RNG, ordinary
movement, attack, accuracy, damage and reload; one companion, idle hero, 100 HP,
30-second horizon. These are hand-positioned encounters, not campaign victories.

| Encounter | Mean castle HP: Fire at will → Careful | Mean shots |
| --- | --- | --- |
| Ranged enemies among sheep, Sniper Rifle | 46.50 → 56.25 | 9.5 → 10 |
| Rats/barbarians approaching, SMG | 70 → 73 | 27.5 → 38.5 |
| Guarded boss with alternatives, Hunter's Rifle | 63.25 → 94.25 | 10.5 → 9 |

Careful lost more HP in two of four rush seeds and used 40% more shots on
average. It aimed zero new shots at the guarded boss, versus four per seed with
Fire at will. Comparisons include Fire at will's existing accuracy penalty;
divergent actions also change later RNG. Keep 15% as an initial balance choice;
these samples do not establish long-term campaign balance or universal superiority.

Reproduce with `node --experimental-strip-types --test web/tests/careful-balance.test.ts`.
Focused tests cover urgency, range fallback, retained aim, shields, original-order
parity, actual damage, launch persistence, save/replay, edition/profile isolation,
and hired-gun Rest integration. Browser checks use isolated muted profiles and
real menu actions/exported saves. Original AI snapshots remain unchanged.

`rulesets.ts` defines the small edition/capability boundary. Both editions still
use the original content catalog; no new classes, items or enemies ship yet.
Add future content through this boundary and versioned save identities as needed,
without a parallel game engine or speculative plugin framework.
