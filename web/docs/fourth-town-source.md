# Fourth-town source boundary

The ordinary fourth-town entry now prepares the original MOD sale, cards, next
mission and recruit in source order. The prepared next mission is persisted;
starting the fifth battle remains outside this slice. Hiring and the other town
actions are not enabled by generating their source data.

## MOD sale and shared slots

Original `MainTimeline.as:3155` (`frame71`) sets `specialSale` when the calendar
day modulo 10 is 4, then calls shop, cards, mission and recruit generation.
`generateShop:5246` first generates its ordinary stock and replaces slot 0 with
a gun. The sale then overwrites the two default stock slots using MOD-only mode,
regenerates slot 0 as item 8, and assigns Auto Reload with `setMod(10)`.
The last generation still draws a random MOD before that fixed assignment.
Skipping any replaced stock would change subsequent cards, mission or recruit.

The port calls the existing `ItemFactory` methods; only `setMod` visibility was
changed, with its body preserved. Default Smith level 0 gives two stock slots.
`clearGameInv` clears occupancy rather than metadata, so all slot histories are
retained through replacements. Normal mode resets `specialSale` to 0 afterward;
that final flag does not mean ordinary gun stock should remain.

## Level-two recruits

`generateRecruit:7709` requests
`floor(random * day * 0.3) + floor(day / 5) + 1`. Day4 can therefore produce level
1 or 2. `generatePlayer:2075` initializes class and hidden traits, then calls
`levelUp(false):10480` before generating nextTrait, portrait and equipment.
Each growth step increments level, unspent SP and class rank, and consumes two
independent draws against aiming/teamwork potential. No `listTrait` or skill
selection occurs. Final cost is `level * 50 + 350`, hence 400 or 450.

All nine class loadouts keep their existing source assignments after growth.
A level-two recruit may have hidden trait values up to 11. Save validation binds
class rank, SP and cost to level, while earlier towns still require level 1.
Generating a new candidate preserves prior Militia slots 47/48 unless overwritten.

## Calendar rewards and historical absorption

`generateSpecialLoot:12064` consumes the optional Ragnarok roll first. Calendar
4 then adds Archer statue 1102; it does not repeat calendar 3's Shop Token.
`resultMedal:2815` grants medal 61 after four perfect days. The source mission
generator's medal additions at 12216–12231 yield absorption 0.02 when both medals
60 and 61 are owned.

That new absorption belongs to the mission prepared in town 4. Day4 itself used
the mission already prepared in town 3, so its active and previous-town mission
records retain their historical 0.01 (or 0 if no earlier perfect day). The
integrated save regression checks both records and the newly prepared mission.
Default upkeep and taxes do not change at this boundary.

## Evidence

Two identical original Ruffle runs captured six complete seeded town cases with
retained metadata and medal variants, plus ten controlled recruit probes covering
all nine level-two classes and both hidden-growth outcomes. All **16 observations
match exactly**, including items, traits, cards, mission, RNG draw counts and
final RNG state. The recruit prefix is an explicit diagnostic input seam that
continues to advance the underlying RNG; it is not a natural-campaign claim.

The five focused tests include an extra-draw negative control and malformed
grown-recruit saves. Earlier town fixtures remain unchanged. See
[oracle provenance and commands](../../docs/oracle-notes.md) and
`tests/fixtures/original-fourth-town-trace.json`. Native town interaction and
whole-campaign scheduling are separate checks.
