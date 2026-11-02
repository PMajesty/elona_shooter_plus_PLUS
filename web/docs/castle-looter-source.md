# Looter purchases and reward valuation

The Looter transaction and live reward integration match 26 captured original observations. This establishes the controlled purchase/generation boundaries below; campaign affordability, native scheduling, actual browser interaction and publication have separate evidence.

## Source rules

Anchors refer to preserved `src/original/MainTimeline.as`.

- Castle page0 tile 5 is Looter:9185–9186. The upgrade-array initialization sets its default level 0:9235–9244. Its maximum-label entry is empty:9246; `getUpgradeCost` has no Looter cap.
- `getUpgradeCost`:12614–12616 returns `level * level * 125 + 300` through an `int` local. The first prices are300,425 and800. `upgradeDone`:7301–7323 increments the live `game.looter` field. The shared Castle click handler:13526–13555 debits money and rebuilds the interface without AP/RNG, item generation or a new settlement.
- `calcUnkeep`:1672 adds five gold per Looter level. Buying the upgrade does not change the already settled result; later settlement reads the increased upkeep.
- `looterFix`:12321–12323 returns exactly `level == 0 ? 1 : 1.05 + level * 0.08`. It reads live `game.looter`, independent of cached party effects. The first level gives a1.13 multiplier, not1.08.
- The exact source hint:11879 uses `int(looterFix() * 100 - 100)`. Level0 receives the generic unacquired text at11895–11904. Preserve floating arithmetic order: captured level 12 displays100%, not the algebraic101%; level 13 displays109%.

There are only two generation uses of `looterFix()`:

| Caller | Budget before multiplication | What changes |
| --- | --- | --- |
| `generateLoot`:11403–11429 | `day * 40 + 250` | The random replacement branch only, passed to `randomStuff` mode1 |
| `generateLootBoss`:12536–12559 | `day * 60 + 500` | Each generated boss prize, passed to mode2 or3 |

Both functions hold their budget in an `int` local, then apply `*=looterFix()`. The product is truncated before reaching `randomStuff`. That function:6042–6049 raises a budget of500 or less to500. Consequently, an early Looter upgrade can leave ordinary items and every RNG draw unchanged even though the incoming budget increased.

Ordinary generation always draws its initial probability before checking the guarantee marker:11414. A draw above0.2, or a queue ID above1000, directly calls `generateStuff`; guaranteed IDs lose1000 in the queue. Those direct items receive no Looter value multiplier. Boss generation chooses mode3 when its modifiers-only option is true, otherwise draws once and selects mode3 above0.8 or mode2 at/below0.8. Item count remains `floor(bossKilled/2)+1`, capped at eight slots. Looter changes neither count nor those probabilities.

Looter raises a generation budget; it does **not** multiply the resulting item's `value`. `randomStuff` still applies rarity/type filters, item variation and enchantment, the immediate value≤500 acceptance, its random exception and progressively relaxed attempt threshold. A higher budget can accept an earlier candidate, consume fewer draws and change later item/mode choices. It does not promise that every individual item improves.

Other paths do not call `looterFix`: shop generation5253–5262, equipment recycling2907 and the Search “Gift?” MOD reward11332 supply their own budgets. Recruit/starter item generation also has no Looter read. `stuffGetValue`:11482 onward truncates the existing item value for purchase; selling divides non-sale items by five with another integer conversion. Looter does not change those prices directly, cash rewards, or cached party bonuses. Recycling, Search and unsupported shop upgrades are source-audit facts, not newly implemented features.

## Production boundary

The v21 state stores `looterLevel`, default0 for new games and legacy versions1–20. `buyCastleUpgrade('looter')` uses the shared Castle transaction path. `castleLootMultiplier` and the reward factory share the same source arithmetic.

Both actual Simulation reward callers pass the current level: `prepareOrdinaryLoot` constructs the ordinary factory with it, and `equipmentFactory` supplies it to the boss reward branch in `finishLoot`. Already generated rewards and stock remain untouched by a purchase. Other factory operations ignore the context field unless their source method uses Looter. Party Engineer remains a separately cached input; it is fixed at0 in this diagnostic.

## Independent capture and discriminating results

`python tools/build_castle_looter_oracle.py` builds a diagnostic copy of the preserved SWF. Original method bodies remain unchanged except reversible RNG, town mouse and observation seams. An entry observer records each original `randomStuff` slot, incoming typed budget, mode and current RNG position. Every xorshift32 draw/value/state is recorded, together with all 33 item fields, retained inactive metadata, normalized queues and buy/sale valuations.

The driver invokes actual `generateLoot`, `generateLootBoss` and `generateShop` under controlled day/level/seed inputs. It then enters continued-town frame71 and uses the original tile 5 shape-hit handler. Fresh town preparation, native battle/result timing and earning the controlled setup are outside this boundary. Non-code tag payloads, tag order and frame header remain identical; one DoABC tag changes.

Ruffle 0.7.1 produced two identical runs at `2026-11-02T03:50:27.000Z`, each 28 records containing 26 snapshots: 15 generation cases and 11 purchase observations. All 26 match production on the first comparison.

| Original observation | Result |
| --- | --- |
| Day1, seed42, ordinary level 0 versus1 | Incoming budgets290/327; the500 floor leaves all items and90 draws identical |
| Day7, seed3, ordinary level 0 versus3 | Repair Hammer(ID12), value345 and190 draws becomes Shotgun(ID3), value680 and75 draws; remaining captured direct drops stay unchanged |
| Day2, seed `0xdeadbeef`, boss level 0 versus1 | `[SMG622, MOD400]`/312 draws becomes `[Crossbow1778, HMG599]`/60 draws; incoming budgets620/700 |
| Day7, seed1000000, boss mode3, level 0 versus3 | MOD value480/28 draws becomes MOD value1120/10 draws; incoming budgets920/1186 |
| Guaranteed ordinary level 0 versus12 | Identical Statue of Rat150, Statue of Crow200 and Holy Grail1500; ten draws in both cases and no `randomStuff` calls |
| Shop level 0 versus12 | Identical three generation calls, all item fields/prices and69 draws |
| Purchases at 0 AP | Insufficient299 gold refuses; exact first purchase succeeds; sequential0→1→2 preserves items/settled state and spends725;11→12→13 remains available |

Accepted evidence:

- Fixture: `web/tests/fixtures/original-castle-looter-trace.json`.
- Instrumented SWF SHA256: `5495bfdd046aaac92ce4a74b82aa6eaf0afc452a7f71d00c46b522f3c76ca6e0`.
- Canonical trace SHA256: `c3e88707f82a6e5f148dbf782659568d1386765a66bb1dfc2f118b6276c61ce9`.
- Build/browser/comparison reports: `.build/oracle/castle-looter-{build,browser,comparison}-report.json`.
- Comparator: `npm run test:castle-looter-reference`.
- Four focused reference tests pass. Negative controls detect omitting the live level at reward generation, rounding budgets instead of truncating, and multiplying final guaranteed-drop values. No production correction was required by the actual capture.

The shop adapter projects actual `prepareEarlyTown` through its third `randomItem` call, matching the original `generateShop` boundary; subsequent cards, mission and recruit generation are not compared here. Current default boss-drop/weapon-level options, no modding medal and Engineer 0 are explicit inputs. Levels0–13 do not establish behavior at the source's extreme signed-int price overflow. Source UI text and purchase state are recorded, while actual rendered text, persistence and connected battles require the separate integration checks.
