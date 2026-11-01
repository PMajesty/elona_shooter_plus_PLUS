# Sheriff initialization and base-skill growth

`hero.ts` implements the controlled `generatePlayer(0, 1, _devSheriff)` boundary
and one original `levelUp` operation. Source anchors refer to the preserved
`src/original/MainTimeline.as`, not generated expectations from the port.
This module does not yet establish full title-flow or campaign parity.

## Generation boundary

`generatePlayer` (2075–2242) consumes these seven draws before equipment:

1. `sex = int(random * 2)`.
2. A `nameBoy` selection, discarded when the PC name becomes `You`.
3. `potentialAim = random / 1.25 + 0.1`.
4. `potentialTeam = random / 1.25 + 0.1`.
5. Base Aiming 900 = `1 + int(random * 10)`.
6. Base Teamwork 901 = `1 + int(random * 10)`.
7. `nextTrait = int(random * 100)`.

The specified Sheriff class consumes no random class selection. The PC branch
consumes no portrait draw. It starts at level 1, zero XP and skill points, with
Sheriff 6 = 1, Shotgun 105 = 2 and Fury 121 = 1. Other constant source fields are
trained 0, boss/wall options true, kill/earn 0, money 200, hero AI -1, focus -1,
cost 400 and five zero weapon-XP counters; their runtime owners remain outside
this helper.

Equipment then generates grenade 11, temporary bow 24 and shotgun 3, in that
order. `ItemFactory` retains each real draw, including conditional mod-capacity
draws; a fixed dummy-draw count would be wrong. The grenade is overwritten with
the original Soldier's Grenade values. Optional previous inventory is copied
and reused because `generateStuff` leaves some old fields intact; other slots
are preserved. The default is a fresh six-slot inventory.

The actual title sequence differs from simply creating a hero and then making
a mission. New Game (7433–7435) generates mission 0 before the character menu;
wave generation occurs later. `updateGene` (7020–7030) calls `generatePlayer`,
then assigns the selected portrait. Portrait and class clicks (1845–1875) call
`updateGene` again, so the source rerolls the character during those interactions.
Global initialization also creates previews. The module deliberately has no
portrait property or title RNG orchestration: the caller owns that user choice
and must state its chosen comparison boundary.

`gameStart` (13798) adds no initial companion for the Sheriff. Medal bonuses and
alternative starts are separate conditions and are outside this normal-start
helper. Initial equipment setup later derives aiming/work rates from base
skills (4668–4679), without rerolling them. They remain hidden in the manual
hero's character sheet (7068, 10123); hidden does not mean nonexistent.

## Level-up

`levelUp` (10480–10505) applies `exp %= 1000`, increments character level and
pending skill points, and sets the class trait to the new level. It then always
draws Aiming first and Teamwork second. A base skill increases only when its
draw is strictly less than its stored potential. There is no cap check in this
method and `nextTrait` does not change here. News, audio, animation and remote
statistics are presentation/host side effects outside the pure helper.

`levelUpHero` returns a new progress record and growth flags without mutating its
input. The caller checks the XP threshold. Original callers use a single `if`,
not a loop: even an XP amount over 2000 triggers one increment and modulo.
In `enemy.damage` (exported class, around 797), growth occurs before critical-kill
voice selection and drop RNG. `eventAfterBattle` (12493–12496) checks again after
adding 250 XP, before weapon-XP advancement and reward events. These positions
matter to later loot and skill-choice streams.

## Legacy saves

Missing raw potentials, sex and `nextTrait` cannot be recovered from current
level, displayed traits or a saved combat RNG. `unknownHeroInitialization()`
represents that absence with null values and explicit provenance. Growth rejects
unknown potentials or missing base levels before consuming RNG or changing data.

`reconstructSheriffHero(level, seed)` is an explicit migration alternative. Its
separate xorshift stream samples the source distributions and the source
high-level generation order: initial raw rolls, two growth draws per level,
then `nextTrait`. It generates no equipment and returns only raw hero fields
and the two base levels. It records `legacy-reconstructed`, the normalized seed
and reconstruction level. This is deterministic replacement data, **not recovered
original history**. The caller must preserve saved combat RNG, owned inventory,
ordinary traits, level/XP and the old save; it chooses and records the migration
seed. The helper cannot change those unrelated values.

Reconstruction rejects levels above the current save schema's Sheriff maximum
before looping. This prevents malformed legacy imports from requesting billions
of growth iterations; it does not add a cap to the original `levelUp` formula.

## Integration and accepted reference

The version 6 simulation stores `state.hero`, including raw potentials and
provenance. New Game prepares mission 0, generates the hero and then prepares
waves. Character creation defers waves: portrait changes reroll the hero while
preserving mission preparation, and Proceed generates waves once. Pending
creation cannot be exported as a resumable battle. Loading an existing battle
does not re-enter creation even if that constructor option is supplied.

Kill and postbattle level-ups use the production growth helper. Older saves use
the explicit reconstruction path on a separate stream; known ordinary traits,
inventory, player counters and combat RNG remain intact. UI explanations should
describe raw fields as generated or reconstructed according to this provenance,
rather than reporting all new characters' base stats as unknown.

`tools/build_hero_oracle.py` invokes original `generatePlayer` and `levelUp` under
controlled randomness. Two identical original runs were captured and compared:
all **12 snapshots match exactly**, including three seeds, fresh/reused inventory,
selected portrait preservation, two consecutive level-ups per fresh hero,
all retained item fields and RNG counts/states. The comparator continues the
production helper's state between level-ups, without replacing it with expected
traits. The accepted fixture is `tests/fixtures/original-hero-trace.json`; its
provenance records the preserved SWF, diagnostic SWF and actual trace hashes.

Focused tests also check strict comparison boundaries, single-level modulo
semantics, missing-data guards, deterministic reconstruction, integrated creation
order and migrations. A negative control omitting both growth draws fails the
independent fixture. Reconstruction remains replacement data and is not certified
as recovered history by this comparison. Native title interactions, full campaign
timing and equipment/trait effects remain separate checks.

Regenerate the diagnostic with `python tools/build_hero_oracle.py`, run the local
oracle page with `?suite=hero`, then run `npm.cmd run test:hero-reference` from
`web/`. The browser capture must complete twice identically before acceptance;
expected snapshots are never regenerated from the port.
