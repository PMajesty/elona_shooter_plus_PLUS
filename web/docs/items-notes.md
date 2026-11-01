# Original item and ordinary-loot boundary

`src/items.ts` ports all 58 item IDs explicitly defined by the preserved
`generateStuff()` function: 1–40, 101–110, 112–117, 120 and 121. Numeric item,
type, weapon-skill and modifier IDs retain their original meanings. Base
fields were extracted from the original assignments; dynamic generation is
implemented separately. Definitions do not establish playable support for
every weapon or consumable.

The source anchors are `src/original/MainTimeline.as`:

- `generateStuff`, line 3842; `setMod`, 13045.
- `randomStuff`, 6042; `weaponVariation`, 13126; `enchant`, 8577.
- `generateLoot`, 11402; `looterFix`, 12321.
- `generatePlayer` starting items, 2140–2178.
- `stuffGetValue`, 11482; inventory transfer/purchase handling, 2950–3037.

`ItemFactory` receives the caller's random function. It does not invent or own
a second production random stream. Every item, including sale items, spends
random numbers on its initial modifier-slot calculation. Starting equipment
uses the original item sequence: grenade, temporary Long Bow, then Sheriff's
Shotgun, with the original Soldier's Grenade overrides. That boundary excludes
the preceding character-generation random calls.

`ordinaryLoot()` accepts the raw mission queue and returns eight offer slots
plus the updated queue. The original random selection draw occurs even for
guaranteed IDs above 1000. Consumed guarantee markers are removed exactly as
in the source. Ordinary random replacement uses the full original candidate
pool and rejection loop, including weapon variation and modifiers; it is not
a handpicked selection of offers.

Repeated generation into one slot preserves fields the original does not
overwrite. This matters for exact instance snapshots and random candidate
retries. `previous` and `previousOffers` support that source behavior.

Player slot indexes 20–25 are represented by array indexes 0–5. Collecting
without a target requires a free slot. Explicit collection or inventory moves
may swap items. Placing a modifier onto a gun is refused by these move helpers:
the source treats that as a separate confirmed modification operation. Selling
uses the original truncated price, keeps full value for sale items, and returns
the amount for the caller to credit. The caller owns menu availability,
confirmation, persistence and gold updates.

The ordinary browser flow now uses these instances in Simulation save version
2. New games generate the six-slot starting inventory before mission generation
using the same production random stream. Victory generates ordinary loot into
eight offer slots once, then opens the original loot artwork with click-to-pick,
click-to-place collection and swaps. Inventory, offers and the `postbattle`
stage are persisted; Proceed discards uncollected offers and opens the existing
financial results. The loot screen has no selling operation. Weapon and grenade
quantities remain synchronized with the supported battle equipment.

Version 1 saves receive a deterministic reconstruction of the previously absent
starting-item metadata, while preserving their existing battle RNG for continued
play. Save provenance records `legacy-v1-reconstructed` and the reconstruction
seed. This is a migration approximation, not recovery of the original missing
item instances; new version 2 games use `original-generation` provenance.

`tools/build_loot_oracle.py` executes the original methods in an instrumented
SWF after true Sheriff initialization. It records 139 snapshots: 116 base-item
cases, 15 random-item cases, six ordinary-loot cases and two starting-item
sequences. The comparison reads independently captured records from
`.build/oracle/loot-browser-report.json`; it compares all 33 observed fields,
raw loot markers, RNG draw counts and final RNG state. Two identical original
runtime captures were compared on 2026-11-01: all 139 snapshots matched on the
first comparison. Evidence is in `.build/oracle/loot-browser-report.json` and
`.build/oracle/loot-comparison-report.json`. The accepted independent trace is
checked in as `tests/fixtures/original-item-trace.json` and is exercised by
`tests/item-reference.test.ts` in the normal test suite. See the
[oracle instructions](../../docs/oracle-notes.md#original-item-and-ordinary-loot-oracle)
for provenance and regeneration. This generator comparison does not establish
visual or pointer-interaction fidelity of the ordinary browser screen.

The ordinary-loot boundary does not implement boss-prize screens, skill
selection, town/shop interaction, modifier mounting, subsequent-day combat or
the behavior of all generated weapons and consumables. Those systems remain
outside the current playable slice despite the complete base-item catalogue.
