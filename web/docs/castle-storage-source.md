# Storage and expanded owned inventory

Storage expands the owned backpack from six to sixteen slots. It does not expand the five battle hotkeys, the eight shop/loot slots, or companion equipment. The v19 port represents its level as `inventory.length - 5`; no second capacity counter is saved.

## Original rules and caller boundaries

Anchors refer to preserved `src/original/MainTimeline.as`.

- Initial `game.invSlot=6` and `game.storage=1`:9210,9244. Storage is Castle upgrade index3:9185–9186. `upgradeDone`:7301–7318 increments both values and grants no item.
- `getUpgradeCost`:12606–12608 charges `(invSlot - 4)^2 * 30 + 250`, with a capacity16 cap:12662. Prices include370 for6→7,520 for7→8,730 for8→9 and3880 for15→16. Displayed maximum level is11:9246.
- The Castle mouse handler:13526–13555 checks price/affordability, debits money, applies the upgrade and rebuilds the menu. It spends no AP, draws no randomness and does not revise an already settled result or regenerate town stock/recruits/missions.
- `calcUnkeep`:1667 adds `storage * 40`: baseline40, then40 per purchased slot. The separate Hard Badge86 bonus:8833–8836 increments both inventory/storage; its upkeep compensation:1668–1671 and global starting-medal acquisition are outside this slice.
- Owned inventory begins at20:130, shop at0:740, companion weapons at40:742. Capacity16 therefore means original owned IDs20–35. Shared stock/loot remains0–7; Upgrade scratch item49 remains separate.
- Shop slots:11742–11746 and Equipment slots:4533–4537 use eight columns, `x=140+column*50`, `y=250+row*48`. Loot slots:11183–11187 use the same columns with `y=224+row*48`. Parent panel translation is separate. Only owned IDs20–24 display hotkey labels1–5:3548–3550; `updateInventory`:5677 and `KeyDown`:13231–13245 still expose exactly five battle slots.
- `getEmptyInventory`:13341–13353 scans all owned slots and treats `num=0` or undefined as empty. Empty retained item records still participate in full-field swaps. They must not be discarded when stock is purchased into them.
- `fillAmmo`:12719–12733 scans every owned slot and changes ammo/reload only for non-consumables. `updateAlly`:6810–6821 refills all non-consumables and resets every owned reload counter, including consumables. Extra backpack guns refill even though they cannot be selected directly with a sixth battle key.

The shared `invDrag` and `endDialog` paths also work at owned slot35. Stock buys require an empty destination; loot collection and owned moves swap complete records. Selling retains a `num=0` item and credits gold/totalMoney. Shop Token consumes its own record and reduces the selected stock value. Upgrade preview draws randomness immediately; confirmation spends gold and4AP and moves the old gun into scratch49. MOD confirmation consumes the MOD and changes the gun without AP/RNG; declining an owned MOD→gun action swaps the two owned items.

Original `invDrag`:2989–2996 can open a MOD dialog in loot as well as town. The port still rejects loot-phase MOD mounting and directs the player to town. This is a known scope gap, not evidence that the source forbids it.

## Independent original capture

`python tools/build_castle_storage_oracle.py` builds a diagnostic copy from the preserved SWF and startup-fixed AS. All non-code tag payloads, tag ordering and frame header remain identical; one DoABC tag changes. Reversible seams supply town mouse coordinates and inventory objects-under-point. The original Castle click handler, inventory transfer/dialog logic, Upgrade generation, sixth-key handler, `fillAmmo` and `updateAlly` execute their source bodies.

The diagnostic initializes the original Sheriff battle, records ammo/input boundaries, then enters actual continued-town frame71 so all required UI controls exist. Continued entry deliberately excludes fresh town generation. Ruffle0.7.1 produced two identical runs at `2026-11-02T03:10:22.021Z`, each39 records with37 snapshots:

| Boundary | Snapshots | Observed cases |
| --- | ---: | --- |
| Castle purchases | 13 | Insufficient gold;6→7;8→9;15→16;cap16;consecutive6→7→8; all at0AP |
| Expanded-slot transactions | 20 | Slot35 stock purchase, loot collection, owned swap with28, MOD from34 confirm/cancel, plain Upgrade preview/confirm, sale preview/confirm, Shop Token |
| Ammo/input | 4 | Initial backpack state, ignored key6, `fillAmmo`, `updateAlly` |

The comparison invokes actual production Simulation methods and compares all33 item fields for owned inventory, stock/loot, Upgrade scratch and an inactive companion-weapon sentinel. Purchase invariants include existing settlement, prepared town data, party/cache, current HP and totalMoney. No item grant or hidden stock/companion overlap is inferred from a capacity increase.

The initial comparison passed36/37 and exposed the premature consumable reload reset in `finishDay`. The unchanged original capture retains an extra-slot Grenade's ammo1/reload7 after `fillAmmo`; `updateAlly` later leaves ammo1 and resets reload0. The runtime moved its settlement reset inside the non-consumable guard. Final comparison passes37/37. The failed report is retained at `.build/oracle/castle-storage-comparison-before-consumable-metadata.json`.

Accepted evidence:

- Fixture: `web/tests/fixtures/original-castle-storage-trace.json`.
- Instrumented SWF SHA256: `4caf0485cac7eaa7c0d8df0a8255899d94dd06bee1efd6864c05998c9b598968`.
- Canonical trace SHA256: `7ef3c3b02c73d861c2432f91401f00e358d5fdb89cf8496ea2c61b006d3fe65b`.
- Browser/build/comparison reports: `.build/oracle/castle-storage-{browser,build,comparison}-report.json`.
- `npm run test:castle-storage-reference` reproduces the comparison. Four focused tests in `castle-storage-reference.test.ts` pass, including deliberate loss of inactive slot metadata, the prior consumable reset defect and refill limited to the original six slots.

This is controlled method evidence, not full native scheduling or browser rendering parity. The ammo adapter stops production settlement before unrelated loot generation and projects item state after actual next-day entry; wave-generation RNG lies outside original `updateAlly` and is not compared there. Uninitialized AS3 empty cells acquire zero reload metadata during refill; port `null` slots do not represent that inert metadata, so ammo comparison projects occupied slots. The deliberately nonzero consumable reload value tests preservation at a method boundary and does not claim ordinary consumable use creates that value. Source slot coordinates are recorded; actual port layout, save migration and connected battles have separate integration checks.
