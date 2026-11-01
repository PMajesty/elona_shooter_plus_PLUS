# Sheriff rewards and skill progression

The first-day reward path is ordinary loot, boss loot when a boss was killed,
earned skill choices, then results. `Simulation.finishLoot()` advances either
loot stage. `chooseSkill(id)` accepts only a displayed, improvable choice,
spends one pending point, and creates the next choice list only if another point
remains. Generated offers and choice IDs live in the save; viewing or restoring
a current-version stage does not reroll them. A boss that survives mission completion
does not earn a prize.

`progression.ts` preserves the original numeric IDs and Sheriff candidate order.
At level 2, all 15 candidates are eligible. `listTrait2` selects three distinct
skills, plus the current Capable level, using random indexes into the original
list. Duplicate selections retry and spend additional random draws. Focus uses
the original separate 50% roll; the current UI has no focus control. Maxed skills
are excluded. The original safeguard after 2,000 attempts is retained; it can
produce disabled/duplicate options in exhausted late-game pools, which this
first-day save schema does not support.

The known starting traits are Sheriff 6 = 1, Shotgun 105 = 2 and Fury 121 = 1.
The class trait follows character level. Original hidden base aiming 900 and
teamwork 901 each start at a random value from 1 to 10 and can grow on level-up.
Those character-generation rolls and growth are not yet ported. Their values
remain absent, not fabricated; their known existence still counts toward the
original owned-trait limit. `traitsProvenance` records that boundary. No new
character-generation RNG draws are inserted into the established battle stream.

Trait descriptions, preview labels, maximum levels and effect calculations are
ported. Choosing a skill persists its level. Its use in subsequent combat,
equipment requirements, party actions, mission setup or town events must be
integrated with those systems before a later day becomes playable. Current
first-day combat does not resume after these choices. In particular, preserve
the distinction between Dr Holliday's accuracy penalty (7 × level + 3) and
additional pellets (the level itself). Last Hope's source condition uses a
greater remaining-HP percentage than its threshold, contrary to its displayed
low-HP description; this discrepancy is recorded, not silently corrected here.

## Save migration

Version 3 added `bossKilled`, `skillChoices`, `player.traits`,
`traitsProvenance` and `bossKilledProvenance`, and the `boss-loot` / `skill`
postbattle stages. Version 4 adds first-town AP and moves the once-only gold
settlement to the result stage. All older inputs are cloned before migration.

Battle migration preserves the saved combat RNG, player counters, enemies,
waves and existing item instances. Known starting traits are reconstructed,
with Sheriff set to the saved character level; hidden base values stay unknown.
Boss kills are inferred from a recorded dead boss or an already-spawned boss
that has disappeared after its wave was reached. A living or queued boss takes
precedence over the victory phase. Provenance explicitly marks these inferred
values.

A legacy result screen omitted boss and skill rewards. Migration resumes at
the first still-owed stage. Newly generated boss offers and skill choices consume
the normal saved RNG once; the resulting current save persists them. This can
advance the RNG of a migrated completed result, as new rewards are being delivered.
Reopening that migrated save leaves it unchanged.

Version 1 still lacks item metadata. Its previously established separate
reconstruction stream restores starter items and ordinary offers from only the
recorded loot queue, without advancing combat RNG. It does not invent a missing
guaranteed loot item. Later, newly delivered boss/skill rewards use the normal
simulation RNG. Version 2 inventory and collected item modifications are retained.

Versions 1–3 paid the result balance immediately at battle completion. Migration
subtracts that recorded net payment from pending rewards, then the result stage
restores it once. The final gold balance is preserved. A version 3 completed
result retains its final balance while receiving the missing result RNG draws
and AP initialization once. Battle saves keep their combat RNG unchanged.

## First-town and Free Repair boundary

The reward plan is recorded at battle completion, but gold is credited only
after all reward choices finish. `prepareResult()` consumes the original fame
draw even with fame zero, followed by the two normal `townEvent()` draws even
with Active zero. The first-day Sheriff receives four AP. The persistent
`town: {ap, preparation: 'pending'}` is also the once-only settlement marker;
pending rewards, battle and defeat have `town: null`.

`enterTown()` accepts only completed victory/results and changes the phase to
`town`, keeping Day 1 and `postbattle: 'result'`. It spends no RNG and cannot
reset AP on repeat. `freeRepair()` is available only in town. It checks full HP
before insufficient AP; on success it spends two AP, restores maximum HP and
changes neither gold nor RNG. A repeated repair at full HP costs nothing.
There is no daily-used flag. Modal acknowledgment is UI state, while repaired
HP, AP, inventory and the town phase persist through saves.

This is the first-town **actions boundary**, not complete original town entry.
Original `frame71` generates shop stock, cards, the next mission, a recruit and
medal adjustments before saving. Those generators are still pending; no dummy
random draws are inserted for them. `town.preparation` remains `pending`, and
Day 2 cannot start. Its saved RNG is the exact port boundary for adding the real
preparation sequence later. Equipment selection and learned skills must affect
combat before another day is enabled.

Town saves accept rearranged inventory. Validation requires completed rewards,
positive castle HP, integer AP in 0–4 and the explicit pending preparation marker.
Results before town entry must still have all four AP. It rejects town state on
unfinished rewards or battle saves and rejects unsupported Day 2 data.

Source anchors: `renewResult`, 3411; `townEvent`, 6417; `frame71`, 3157;
`showEventDialog` Free Repair branch, 10561; `noAp`, 4743; castle action,
13530; `procEventDialog`, 6620. The day increments only when the sleep dialog
starts the next battle, at 6646.

## Source anchors and validation boundary

`src/original/MainTimeline.as`:

- `generatePlayer`, 2075: class/hidden starting traits; Sheriff assignments, 2175.
- `setTrait`, 5890; definitions, 9388–9584; Sheriff group, 9590.
- `listTrait`, 7714; `listTrait2`, 11817: eligibility and random selection.
- `procLevel`, 11432; `updateLevel`, 2714; chosen increment, 1918.
- `levelUp`, 10480: class level and earned point.
- `eventAfterBattle`, 12487: queue order and original point consumption.
- `damageCastle`, 10858–10906: Last Hope condition.

The port consumes a point when the validated choice is committed, instead of
when the source queues its menu event. The pending choice and point persist
together, preventing restore from losing or granting an extra choice. Tests
exercise a normal complete opening battle, each reward-stage save/restore,
legacy migration, rejected selections and repeat claims. These are integration
checks. The accepted independent original-method fixture contains nine snapshots:
three controlled seeds at Capable levels 0, 1 and 2. It matches candidate order,
eligibility, choices, all 15 skill previews, raw effect calculations and RNG
accounting. It does not establish later combat effects, character growth or
original pointer interaction. See `docs/oracle-notes.md` for capture provenance.
