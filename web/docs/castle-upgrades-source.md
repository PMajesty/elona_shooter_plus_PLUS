# Castle House and Wall upgrades: source audit

Status: **not implemented** in the current browser port. This document records
original source behavior and proposed validation boundaries. It makes no
runtime-parity claim for Castle purchases, upgraded walls or an expanded
permanent party.

Source anchors below refer to preserved `src/original/MainTimeline.as`.
The original/default state is House1, Wall1, currentHP40/maxHP40 and Storage1
(Main:9208–9209,9237–9246). Permanent companions occupy physical slots1–3;
slot4 is the separate temporary henchman and slot5 is the recruiter candidate.

## Costs, levels and immediate effects

`upgradeRef`/`upgradeRefStr` define page0 indices0=Fix Wall,1=Wall and4=House
(Main:9185–9186). `getUpgradeCost` returns an `int` local result
(Main:12592–12682):

| Upgrade | Original price before purchase | Effect | Cap |
| --- | --- | --- | --- |
| House | `house * house * 1000 + 1000` | Increments House/capacity by1 | At House3, price becomes0 and tile disables |
| Wall | `int(maxHP * maxHP / 2.5 - 400)` | Increments Wall level and adds5 to currentHP and maxHP | No explicit gameplay cap |
| Fix Wall, context only | `8 * (maxHP - currentHP)` | Increments its stored purchase counter and sets currentHP=maxHP | Price0 when undamaged |

House1→2 costs2000GP; House2→3 costs5000GP. The third permanent slot therefore
requires7000GP of House purchases in total, in addition to recruitment fees.
The first Wall costs240GP at40maxHP, then410GP at45maxHP, then600GP at50maxHP.
`upgradeDone` increments the selected `game` field before applying its special
effect (Main:7301–7323). A damaged wall at30/40 becomes35/45: the purchase
preserves the damage deficit rather than fully repairing the castle.

Wall level and maxHP are distinct original fields. A Search outcome increments
`game.castleMHP` by1 without increasing Wall level or currentHP
(Main:11297–11302). Consequently a Wall at41maxHP costs272GP, even if its
displayed level remains1. Do not derive either field from the other merely
because normal Wall purchases add5. Debug-only alternative initial maxHP
assignments also exist (Main:7251,8200); they are outside this ordinary slice.

The displayed names append the current level when positive, e.g. `House Lv 1`
and `Wall Lv 1` (Main:1322–1327). `upgradeMax` declares House3 and leaves the
Wall cap blank (Main:9246). No day, class, party-skill or title prerequisite
appears in these two price/upgrade branches.

## Original click flow and side effects

The Castle navigation handler sets menuId2, opens `menu_castle`, and attaches
`procCastleMenu` (Main:13732–13740). That method stops the panel and calls
`updateCastleMenu` (Main:12274–12290). There are8tiles per page, placed at
local `x=150+(index%4)*100`, `y=140+floor(index/4)*110`
(Main:1317–1321). House4 is at150,250; Wall1 is at250,140.

`updateCastleMenu` computes costs and sets `possible=false` when gold is below
the cost or cost equals0. Unavailable tiles have alpha0.3 and a disabled child
button; available tiles have alpha1 (Main:1333–1356). The town handler still
checks the entire tile's shape and its `possible` flag, so an unavailable
tile click beeps and returns (Main:13526–13555).

A successful purchase is an **immediate single click**, with no confirmation
dialog. The handler plays the payment sound, deducts the current cost, calls
`upgradeDone`, removes/rebuilds tiles and refreshes the interface. Do not reuse
the separate `_dialogUpgrade` weapon-upgrade flow, which spends4AP
(Main:4815–4831). Castle House/Wall purchases have:

- No AP requirement or deduction; sufficient gold allows a purchase at AP0.
- No RNG draw in the normal House/Wall path.
- No `totalMoney` change, automatic recruit replacement or automatic hiring.
- No prepared-mission regeneration or `initPartySkill` refresh.
- No automatic campaign-save call in the transaction.

`upgradeDone` calls `upgradeMedal`, but that function checks only Chicken and
Sister thresholds, not House or Wall levels (Main:11908–11937). Ordinary
House/Wall purchases therefore award no medal. The UI refresh invokes the
normal ammo/gold/level/day/HP/selection/AP display updates
(Main:12420–12432).

The surrounding handler gives dialogs, pause, event windows and card/order
interaction their usual precedence (Main:13455–13501). The Castle tile branch
requires menuId2 and delay>3. A headless purchase API should enforce the current
town interaction state and recompute affordability from canonical state;
stale rendered `possible` data should not become a second authority.

Free Repair remains a separate2AP event action. It checks fullHP before AP,
heals fully, and refreshes Castle prices after the repair
(Main:10561–10584). Implementing paid Fix Wall is not required by this bounded
House/Wall proposal; its source cost is documented to avoid confusing the
three actions.

## Continuing costs, party capacity and persistence

`calcUnkeep` (original spelling, Main:1660–1681) computes:

```text
upkeep = max(0,
    (house - 1) * 50
  + repair * 60
  + (maxHP - 40) * 2
  + sandbag * 40
  + storage * 40
  - (HardBadge ? 40 : 0)
  + looter * 5
  + museum * 15)
```

With otherwise-default upgrades, upkeep is40 at House1,90 at House2 and140
at House3. Each Wall purchase adds10GP of recurring upkeep. Companion wages
remain separate; Accountant affects wages, not this formula.
`renewResult` combines tax and current upkeep into its deduction
(Main:3411–3452). Purchasing after an already-settled result must not reprice
or repay that result; the higher upkeep applies to the next settlement.

The hiring handler first blocks an occupied permanent slot3, then checks
`getFreeAlly() > game.house`, then checks candidate cost
(Main:13618–13637). A House upgrade increases the permitted permanent capacity
only. It neither creates a companion nor removes the independent absolute
three-companion limit. Candidate and owned character records remain unchanged.

Original `saveGame` clones complete `game`, `player`, `inventory` and `mission`
objects; `loadGame` restores those objects (Main:6311–6349,4986–5003).
Relevant persistent fields are `game.house`, `game.wallUpgrade`,
`game.castleHP`, `game.castleMHP`, and hero `player.money[0]`. AP and
`totalMoney` persist unchanged through the purchase. The Fix Wall counter is
also stored if that action is later implemented.

At audit time, the browser port already has canonical `party.capacity:1|2|3`,
but no ordinary House purchase. Reuse that field instead of adding a second
mutable house capacity. Wall level needs its own value alongside existing
current/maxHP. Legacy saves can initialize Wall1 without consuming RNG.
Current `Simulation.fromSave` rejects maxHP other than40, and settlement uses
fixed `FIRST_DAY.upkeep`; both must change with this feature. Existing healing,
HUD and Last Hope calculations already accept the state's maxHP, but their
upgraded-wall callers and save round trips need focused verification.

## Smallest useful implementation and original reference

The proposed player outcome is: buy House/Wall from Castle, see the price,
capacity/HP and upkeep update immediately, save/Continue, hire an additional
eligible companion, then enter the next supported battle and pay the correct
later upkeep and wages. Day/campaign expansion is not required.

A minimal state API can expose a computed quote and immediate
`buyCastleUpgrade('house'|'wall')`, returning purchased, insufficient-gold,
capped or unavailable. It should not create a confirmation-state framework
for an original immediate transaction. Keep upgraded maxHP, Wall level and
party capacity authoritative and persist them once.

For independent evidence, reuse the proven **continued-town frame71** setup
from `tools/build_party_hiring_oracle.py`, then open the actual Castle menu.
Drive original `MouseLDownFunc_town` using the reversible coordinate-input
seam and real tile hit testing; calling `upgradeDone` alone would bypass
affordability/cap guards. Observe before/after money, AP, totalMoney, House and
Wall levels, current/maxHP, `calcUnkeep`, tile cost/availability, RNG count and
state. Do not execute unrelated fresh-town generation inside this boundary.

Keep the fixture bounded to informative cases:

- House:1999GP rejected, exact2000GP purchase, exact5000GP second purchase,
  and House3 cap rejection.
- Wall:239GP rejected, exact240GP purchase at fullHP, damaged30/40→35/45,
  and a repeated purchase using the newly computed410GP price.
- A declared configured41maxHP input, representing the source Search outcome,
  to establish272GP integer pricing and independent level/HP fields. This
  does not imply Search itself is implemented.
- AP0 successful purchases with zero transaction RNG, unchanged totalMoney,
  and increased upkeep. Test disabled/full or capped buttons through the
  original handler rather than assuming a zero price means free purchase.

Production checks should cover save/Continue after each purchase without a
second payment, corrupted wall/capacity state rejection, unchanged already-paid
result totals, and the next settlement's updated upkeep. One ordinary expanded
party flow should exercise two/three companions, their equipment and slot
ordering, shared target/RNG behavior, Guardian list, combined wages and save
replay. The original transaction fixture alone cannot establish that integrated
multi-companion battle behavior or native scheduling is correct.
