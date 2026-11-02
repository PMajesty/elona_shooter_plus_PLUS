# Companion damage and reward reference

The accepted fixture `web/tests/fixtures/original-party-combat-trace.json`
contains37 observations from two identical Ruffle runs of the original game.
`tools/build_party_combat_oracle.py` instruments test-only copies. The original
method bodies remain unchanged apart from reversible RNG wrappers and damage/
pellet observers; all non-code SWF tag payloads, ordering and frame header are
preserved. The original and fixed ActionScript recovery files are untouched.

The production comparison is exact for all37 snapshots. Together with the
75-snapshot AI fixture, six focused tests pass, including negative controls
that deliberately attribute companion contact to the hero, refresh cached
party skills too early, change target-order behavior, or omit a shared RNG
draw. These tests call actual `Simulation.processPellet`, `fireActorAt`,
`damageCastle` and `finishDay` boundaries. The settlement adapter stops only
the following `prepareOrdinaryLoot` call, so subsequent loot RNG is excluded.

| Original boundary | Observations |
| --- | ---: |
| All9classes: nonlethal body contact and critical kill with catch-up XP/level growth |18|
| All9classes: level4 pending SP, all4weapon-XP buckets and actual eventAfterBattle |9|
| NPC Shotgun2 weapon-XP equality22 versus promotion23 |2|
| Ranger team threshold and LivingWeapon expiry |2|
| Guardian retaliation credited to hero versus companion |2|
| Level4 Noble kill with catch-up and level-gap truncation |1|
| Actual Sniper/Duelist/Noble shots with observable class damage modifiers |3|

Source `procHit` (Main:1428–1484) consumes one SENSE draw per contour contact,
including dead actors, applies Duelist projectile frenzy, then invokes the
original `enemy.damage` (enemy:550–839). The fixture supplies the observed
original contour predicate as input to the port; the port computes the
critical region, damage, effects, attribution and RNG sequence itself.
Actual `shoot` cases additionally capture pellet coordinates and draw timing,
so they test the two-roll hitscan path rather than substituting procHit.

Concrete observed outcomes:

- Source nonlethal contacts reduce Sheep HP1000→990 for all9classes. The
  Duelist gains frenzy; the Sheriff applies its knockback.
- Critical kills grant the companion its own weapon XP, catch-up XP and
  level-up; the hero receives no personal kill or XP from that attack.
- Ranger's threshold starts hero rampage455 and companion rampage403. Only
  the hero's `rampageOn` calls `shake`, so the complete case uses6random draws,
  not8 (Main:2796,12299). The initial runtime comparison detected this error.
- LivingWeapon expires, invokes original `enchant`, and resets its countdown
  to200. Full modified item metadata and RNG agree.
- Guardian's list contains both existing actors even when only one is a
  Guardian (Main:8499–8509). Retaliation can therefore credit the hero or the
  companion; both actual `damageCastle` branches are captured (Main:10859).
- `enemy.exp` is an integer. The level4 Noble case performs87→21→29 before
  adding XP, demonstrating that level-gap reduction must truncate before the
  later Noble multiplier (enemy:773–783). The resulting level-up leaves19XP.
- `wexpUp` examines all first4buckets, including unowned weapon skills. NPCs
  use half the hero threshold, with strict `>` (Main:6907–6942): Shotgun2 keeps
 22XP unchanged, while23XP promotes the skill to3 and resets that bucket.
- Actual Sniper idle10 produces89damage and leaves idle8. Duelist frenzy30
  produces26damage and leaves frenzy33.55. A Noble legally equipped with an
  original Rifle4 produces59damage from its55attack. Each actual shot uses
 7draws. The Noble's initial PDW would round the small bonus away, so the
  informative case uses a supported equipped weapon instead.

`eventAfterBattle` grants250XP to every existing actor first, then processes
weapon XP and spends each NPC's pending skill points before queuing loot
(Main:12484–12546). It does not call `initPartySkill`. The comparison retains
and verifies the pre-growth party cache through this boundary, including
cases where newly learned ACTIVE would change an immediate recomputation.
Town preparation refresh timing is covered separately.

## Evidence and limitations

Instrumented SWF SHA-256:
`0046cc98202a5c2babc6f047368503ff7301b4bf9903028b3c31fbca39cdbfbb`.
Accepted trace SHA-256:
`03ac432e66b5a77445104a193d42c484520d7310da69fa3cf52e28814e78a2a0`.
The accepted first34 observations are byte-for-byte unchanged in the final
37-observation trace. Reports and earlier builds are retained under ignored
`.build/oracle/party-combat-*`.

The first diagnostic used a body point outside the actual frame5contour for
its noncritical cases. It compared exactly while failing to exercise those
effects. The raw report is preserved under `before-level-gap`; later builds
fail immediately if an intended contact or shot misses, and the tests assert
actual damage/level/rampage outcomes. The failed Ranger RNG comparison is
preserved under `before-weapon-threshold`. The earlier Noble PDW observation
is retained under `before-noble-weapon`.

Generated actor stats and items are captured inputs, with their generation
tested by separate fixtures. This boundary does not revalidate raster/vector
collision equivalence, native Flash callback scheduling, projectile travel,
audio synchronization, partial-magazine postbattle refill timing or an entire
party campaign. Hero personal lifetime kills/earn are observed in the source
but not asserted as independently persisted counters by this adapter; total
battle kills and companion history are compared. Integrated save/Continue,
equipment transfers, wages and UI behavior require their own checks.
