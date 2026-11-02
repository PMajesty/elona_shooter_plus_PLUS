# Seventh-town preparation and recruit growth

This boundary covers the original normal solo Sheriff conditions with the
existing default castle upgrades. It prepares town 7 and its next mission,
including retained item metadata, level-four recruits, tax and first-title
income. It does not enable the next battle or additional town actions.

## Preparation and calendar

`MainTimeline.as:3155` (`frame71`) still orders `generateShop:5246`,
`generateCard:5410`, `generateMission:12144`, `generateRecruit:7709`, medal
effects and flags. Day 7 is not a MOD sale day. The same shared item slots 0–7,
prior Militia slots 47/48 and existing search value survive preparation.

`generateSpecialLoot:12064` always consumes the optional Ragnarok roll. Day 7
matches none of its guaranteed-item conditions, so mission 7 starts with
either an empty loot list or `[1038]`. In particular, the Crow Statue 1106
belongs to mission 6, prepared in town 6 and fought on Day 7; it must not be
added again to the next mission. Mission 7 has power 1640, reward 740, five
waves and spawn interval 13.6. Town preparation does not generate those waves.

Seven perfect completions award medal 62 (`eventClear`, around line 2831).
`generateMission:12224` contributes its additional 0.01 absorption to the
newly prepared mission, for a possible total of 0.03. The already completed
Day 7 battle retains the historical absorption of its earlier preparation.

## Level-four recruits and persistence

`generateRecruit:7709` requests
`floor(random * 7 * 0.3) + floor(7 / 5) + 1`, yielding levels 2–4. The two
distribution boundaries lie at 10/21 and 20/21. Reference probes use values
just below and above each boundary, preserving the source multiplication order.

`generatePlayer:2075` calls `levelUp(false):10480` before nextTrait, portrait
and class equipment. A level-four recruit receives three growth steps, each
with independent aiming/teamwork potential rolls. It has class rank 4,
three unspent skill points, cost 550 and hidden aiming/teamwork bounded by 13.
The class weapon and fixed trait assignments still occur after growth. The
oracle exercises every one of the nine classes at level 4 and reverses the
Sheriff's hidden-growth outcomes in a separate case.

Town-save validation now distinguishes class rank from fixed starting skills:
class rank follows recruit level, while the unchanged fixed skills remain
bounded by their original levels. A level-four candidate is valid only in town
7 under this scope; previous town 6 still requires level 2 or 3. Candidate
generation and validation retain inactive/shared-slot metadata rather than
reconstructing items on load.

## Day 7 economy and titles

`calcTax:3587` gives 45 GP on Day 7. Default `calcUnkeep:1660` remains 40, so
the combined deduction is 85. The active mission 6 pays 720, or 936 with the
perfect-game bonus. `renewResult:3411` therefore nets 635/851 without a title,
or 735/951 with the first title's 100 GP salary. The existing one fame draw and
two default Active-skill AP draws remain necessary. Default AP is still 4.

`newTitle:9752` continues offering the first title when it was not claimed on
Day 6. An inherited Honorary Citizen title remains unchanged: the next title
does not become eligible until `day > 10`. The original action eligibility
guards repeat claims before `showEventDialog(_dialogActClaim):10631` runs.
Claiming still costs 4 AP, changes no immediate gold and consumes no RNG.
Salary belongs to a future settlement; it does not alter the already settled
result when the claim happens in town.

## Independent reference boundary

`tools/build_seventh_town_oracle.py` reuses the original preparation statements
and unchanged generation/economy methods. It records six complete towns with
zero or 0.03 medal absorption, fourteen recruit probes, twelve normal/perfect
settlements with title 0/1 across three seeds, and six first-title states.
The controlled recruit prefixes advance the underlying RNG on every draw.
The source save call is replaced by a recorded boundary; native menu rendering
and whole-campaign scheduling are separate checks.

Two identical Ruffle 0.7.1 runs captured **38 observations**, all matching
production exactly on the first comparison. Full-town seeds 42/1/3735928559
consume 94/112/204 draws and produce levels 2/2/3; the controlled cases supply
the rarer level-four branch across every class. The six town observations have
empty mission loot, and the medal variants record absorption 0.03. Each result
consumes three draws; title eligibility and actions consume none.

Five focused preparation/reference tests cover provenance, all nine classes,
thresholds, retained metadata, validation and a deliberate extra-RNG error.
Accepted Day 1–6 town fixtures remain unchanged and pass their comparisons.
The diagnostic preserves all 3,491 tags outside the modified DoABC payload;
the original SWF and source remain unchanged.

Accepted fixture: `tests/fixtures/original-seventh-town-trace.json`.
Instrumented SWF SHA-256:
`c1b408a6bb287eb9fc611339246c08dceab432e39ee722271133300247257b2c`.
Canonical trace SHA-256:
`39dabd5c3cb8516c274afabccdd05f1ab0400e0324d4aa066070b93b212a8806`.
Rebuild with `python tools/build_seventh_town_oracle.py`, capture
`?suite=seventh-town` twice, then run `npm.cmd run test:seventh-town-reference`
from `web/`. Campaign save/Rest checks are separate from these isolated source
generation, settlement and action boundaries.
