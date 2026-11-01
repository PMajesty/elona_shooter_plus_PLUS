# Original item and loot boundary

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
- `generateLootBoss`, 12536; `clearGameInv`, 13447.
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

`bossLoot()` returns up to eight prizes using the original
`min(8, trunc(bossKilled / 2) + 1)` count. Its target value is
`trunc((day * 60 + 500) * looterFix)`. Each prize uses random-item mode 3 when
modifier-only rewards are enabled or the selection draw exceeds 0.8; otherwise
it uses mode 2. Enabling modifier-only rewards skips that selection draw.
The caller gates this event on at least one killed boss. Original event-stack
order places ordinary loot before boss prizes, then skill choices and results.

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

The browser flow now uses these instances in Simulation save version 3. New
games generate the six-slot starting inventory before mission generation
using the same production random stream. Victory generates ordinary loot into
eight offer slots once, then opens the original loot artwork with click-to-pick,
click-to-place collection and swaps. Inventory, offers and the `postbattle`
stage are persisted. Proceed generates boss prizes after ordinary loot when a
boss was killed, passing remaining offer instances into the next generation;
after prizes, the flow continues through pending skill choices to financial
results. The loot screens have no selling operation. Weapon and grenade
quantities remain synchronized with the supported battle equipment.

Version 1 saves receive a deterministic reconstruction of the previously absent
starting-item metadata, while preserving their existing battle RNG for continued
play. Save provenance records `legacy-v1-reconstructed` and the reconstruction
seed. This is a migration approximation, not recovery of the original missing
item instances; new games use `original-generation` provenance. Version 2
inventories are retained when migrating to version 3.

`tools/build_loot_oracle.py` executes the original methods in an instrumented
SWF after true Sheriff initialization. It records 157 snapshots: 116 base-item
cases, 15 random-item cases, six ordinary-loot cases, two starting-item
sequences and 18 boss-prize cases. The latter cover fresh and reused slot
metadata, counts/cap and modifier-only selection. The comparison reads independently captured records from
`.build/oracle/loot-browser-report.json`; it compares all 33 observed fields,
raw loot markers, RNG draw counts and final RNG state. Two identical original
runtime captures were compared on 2026-11-01: all 157 snapshots matched, and the
original 139 snapshot records were unchanged from the previously accepted
fixture. Evidence is in `.build/oracle/loot-browser-report.json` and
`.build/oracle/loot-comparison-report.json`. The accepted independent trace is
checked in as `tests/fixtures/original-item-trace.json` and is exercised by
`tests/item-reference.test.ts` in the normal test suite. See the
[oracle instructions](../../docs/oracle-notes.md#original-item-and-ordinary-loot-oracle)
for provenance and regeneration. This generator comparison does not establish
visual or pointer-interaction fidelity of the ordinary browser screen.

The item-generation reference does not validate skill progression or the loot
screens' pointer interactions. Town/shop interaction, modifier mounting,
subsequent-day combat and the behavior of all generated weapons and consumables
remain outside the current playable slice despite the complete base-item catalogue.
