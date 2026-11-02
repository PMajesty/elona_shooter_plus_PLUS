# Party integration: published v15

Permanent companions are connected to the existing Sheriff Days 1–7 campaign and published at `http://127.0.0.1:5175/elona/`. The v15 release passed 288 tests, TypeScript checking, its release build and browser/production checks. This records a verified partial remake, not completion of the original game.

The tested bundle is `assets/index-Do-bjyfx.js`; all 300 published/archive files match. The package `.build/elona-shooter-browser-party-slice.zip` is 8,432,781 bytes, SHA256 `1a49d3530e19f2a8c31fcd3f167f128f5b33139735189489cdae34b38b1c99a7`. The previous v14 build and Day7 ZIP remain available in `.build/browser-before-party` and `.build/elona-shooter-browser-day7-slice.zip`.

## Integrated behavior

In **Characters**, the player can inspect the actual generated candidate, confirm or cancel recruitment, select companion orders and Boss/Defend priorities, focus an eligible skill, and dismiss an owned companion. The original house level permits **one permanent companion**. All nine generated classes can be hired and fight; complete class-mechanic parity is not claimed. Orders preserve observed source quirks: NoArmor falls through to Normal targeting instead of imposing the exclusion its label suggests. Hiring spends the displayed gold, costs no AP, and does not reroll the prepared mission or immediately generate another candidate.

**Equipment** transfers complete weapon records between the hero inventory and companion, checking both directions of a swap. Companion MOD mounting uses a confirmation; No returns the MOD without exchanging it for the gun. Companion weapons can be moved into hero inventory for the existing shop upgrade path. Inactive character and weapon records remain preserved after dismissal.

Rest initializes autonomous companion targeting, reloads, hitscan/projectile attacks and class effects. Damage, kills, weapon XP, gold and projectiles retain their actor owner. Postbattle processing awards the source's 250 XP, levels companions and spends their outstanding skill points before loot; wages are a separate positive deduction in the result. Party bonuses stay cached through this growth boundary, then refresh at the original explicit boundaries. Town generation separately preserves cached Engineer for shop stock and refreshed Engineer/Negotiator for the recruit and next mission.

Save **v15** retains the canonical candidate, owned/inactive party records, equipment, AI targets and retained target identities, owner-attributed projectiles, party caches and pending confirmations. Versions 1–14 migrate without a recruitment charge or RNG draw; a retained town candidate becomes canonical without granting an owned companion. The transient event queue is not serialized; replay checks compare newly emitted events, not every audible or visual resume case. Battle exit refills companion guns, including retained inactive slots, before town equipment access.

Source details: [hiring and equipment](party-hiring-source.md), [AI and orders](party-ai-source.md), [combat and progression](party-combat-source.md), [UI assets and placements](party-ui-source.md).

## Accepted evidence and its boundaries

Each original reference below was captured twice with identical results in Ruffle 0.7.1. Diagnostic builds preserve the original resource tags and compared methods. Controlled method calls establish their stated boundaries, not native full-battle scheduling.

| Reference | Accepted comparison | Boundary |
| --- | --- | --- |
| Hiring | 61 matching transaction observations from 79 captured snapshots; 18 starting states | Nine classes, actual dialog guards, cancel/hire/dismiss, retained records and bidirectional equipment/MOD rules. |
| Progression | 45 matching snapshots | Nine-class growth, skill selection/focus, party bonus calculation and wages with source RNG. |
| AI | 75 matching snapshots | Initial profiles, orders, target caches, cursor positions, reload/action requests and actual empty-world weapon launches. |
| Combat | 37 matching snapshots | Original hit/damage/credit, Guardian retaliation, class-modified Sniper/Duelist/Noble shots and postbattle growth before loot generation. |

Accepted fixtures are `web/tests/fixtures/original-party-{hiring,progression,ai,combat}-trace.json`. Capture/build/comparison reports and failed diagnostic assumptions remain under `.build/oracle/party-*`. The final combat trace SHA256 is `03ac432e66b5a77445104a193d42c484520d7310da69fa3cf52e28814e78a2a0`; its source notes explain the earlier noncritical contact that missed and the strengthened checks.

**20 production Simulation integration tests** cover all nine classes through hire/cancel, equipment, Rest, owner XP, settlement/dismissal and JSON restoration, plus invalid saves, pending dialogs, lost projectile ownership, all three Wind Bow arrows and postbattle gun refill. They also test actual Crow/Fly spawns under Air (4)/Armor (5) orders, legacy type reconstruction and the bounded early-v15 repair. Some tests deliberately control a starting town or contact; they are not evidence of naturally surviving a campaign.

The initial v15 integration incorrectly classified airborne enemies as armor. The corrected live spawn and pre-party migration paths use source Air type 1 rather than Armor type 2. Current-save repair recognizes only the unambiguous old v15 pattern, preserving selected/retained target identities, cache history and RNG; mixed states are rejected. This port integration correction is separate from the unreproduced veteran hitbox report. The accepted 218 original method comparisons are unchanged and do not independently cover live spawn classification.

## Connected campaign run

The separate party soak starts 32 natural New Games, earns the first town with aimed Sheriff input, hires the actual candidate when affordable, and lets the companion AI act autonomously through ordinary rewards, repair and Rest. It grants no stats, money, invincibility or forced kills. All nine classes were naturally hired and fought, so the final run required no controlled-class fallback.

- 482,844 frames, 5,024 full JSON checkpoints, 192 Rest transitions and 810 reward actions.
- All 32 campaigns reached Day 7; 30 completed it and two lost the castle.
- Companions emitted 6,559 shots, 5,658 hits, 3,174 kills, 2,583 reload starts, 513 reload completions and 1,386 projectiles. They leveled 179 times and incurred 15,311 gold in wages across 190 settlements.
- Restored state and newly emitted events matched uninterrupted execution at every action/tick. Companion arrows, bolts and Militia grenades were observed; counts by class are retained rather than treating class presence as coverage of every ability.

This uses **production ordinary-enemy filled contours**, with the existing **rectangular boss fallback** explicitly retained. It proves bounded port consistency, not original campaign balance, boss shape parity, browser performance or audio/visual equivalence. Death counts mean castle defeats; companions do not have a separate HP/death model in this source combat flow.

Evidence is `.build/party-soak/report.json`, per-scenario `*-replay.json`, and `.build/browser-qa/party-soak-fixtures.json`. The full 32-seed run was repeated on the corrected runtime with the same totals; the report records matching current source hashes. The 133 browser checkpoints include the earned hired-town, battle-entry, projectile, reload and result states; the manifest records their file-byte SHA256 and generating operation. The earlier nine-class pilot and Living Weapon applicability audit are historical artifacts, not substitutes for this final rerun.

## Published browser checks

Browser acceptance used ordinary UI actions and full exported saves: hiring cost 400 gold with no AP/RNG change; a pending confirmation restored through Continue; order 6 and equipment round trips persisted; Rest and 35 combat updates matched; an earned manual-reload checkpoint advanced 13 updates and inserted one shell; wage 53, town entry and dismissal cancel/confirm matched expected states. Production New Game reached tick 0 / HP 40 / gold 200 / ammo 5. The actual old v14 save migrated/restored exactly to v15 at tick 674 / HP 40 / gold 209 with unchanged RNG, paused and without console errors. Evidence: `.build/browser-qa/party-ui-verification.json`, `party-production-verification.json` in that directory, and `.build/party-publication.json`. These focused observations do not establish a manually played full browser campaign or pixel/audio parity.

All 14 existing UI export checks were revalidated on the corrected runtime. A separate earned Day 5 checkpoint imported at tick 9770 repaired Crow type 2→1 and matched the complete expected envelope, unchanged RNG and subsequent restore. `.build/browser-qa/party-air-verification.json` records it and the startup check: Import Save is disabled during asset loading, then enabled after scene creation. The final published bundle also passed a fresh New Game and actual v14 backup restoration. Real spawn/order behavior is covered by the focused integration tests, not an extra manually played campaign.

## Remaining scope and timing

Recruit refresh, house upgrades/additional party capacity, temporary Mission **Hire**, remaining town/card actions, other playable hero classes, Ragnarok and Day 8 onward remain unavailable. Companion availability does not imply that every original class mechanic or late-game encounter has been proven. The veteran late-game hitbox complaint remains a separate, unreproduced investigation target.

The next useful slice is house upgrades for capacity two/three and Castle wall upgrades; [the source audit](castle-upgrades-source.md) records their costs, effects and validation boundaries. The long-term goal and watcher remain active.

The Chain Gun currently uses the known counter fallback. The original also uses audio-channel position and reverse-seek history during interrupted spin-up/down; the port does not yet preserve that virtual audio position. Exact interrupted Chain Gun timing is therefore not claimed. See the AI source note for the source thresholds and pause question.

The user's clock amendment is unchanged: exact 30 Hz / 20 Hz rates are optional unless their alteration materially changes gameplay. The present reference clocks remain in use, and pause freezes the port simulation. Neither the synchronous references nor the soak establishes native Flash callback timing or measured browser speed.

## Commands

From `web`, run the focused integration check, accepted-report comparisons and connected run:

```powershell
node --experimental-strip-types --test tests/party-integration.test.ts
node --experimental-strip-types scripts/compare-party-hiring-reference.ts
node --experimental-strip-types scripts/compare-party-progression-reference.ts
node --experimental-strip-types scripts/compare-party-ai-reference.ts
node --experimental-strip-types scripts/compare-party-combat-reference.ts
node --experimental-strip-types scripts/party-soak.ts 32
```

Rebuilding a diagnostic does not recapture its evidence. From the repository root, use `python tools/build_party_hiring_oracle.py`, `build_party_progression_oracle.py`, `build_party_ai_oracle.py` or `build_party_combat_oracle.py` with the same `python tools/` prefix. Capture two completed runs using the corresponding `suite=party-hiring`, `party-progression`, `party-ai` or `party-combat` route served by `tools/serve_oracle.py`, then compare. Keep accepted fixtures unchanged until the new actual capture passes. Ordinary development remains `npm ci`, `npm run dev` and `npm run build` from `web`; publication is a separate validated step.
