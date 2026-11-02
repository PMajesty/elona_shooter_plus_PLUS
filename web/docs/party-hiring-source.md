# Permanent party hiring: original transaction and persistence boundary

Source map for permanent recruiting, the `party.ts` transaction model and its accepted original reference. Companion combat/AI has a separate [source boundary](party-ai-source.md); transaction equality alone does not establish a completed hired-companion battle or visual parity.

## Original slots and user flow

`maxAlly=5`, `maxParty=4`, `maxChara=7` (9169–9171); `_nc=5` (332), `_invAlly=40` (742). Slot0 is the hero, slots1–3 permanent companions, slot4 the separate temporary henchman, and slot5 the town candidate. The candidate is shown in the character menu, but excluded from battle/party loops and the equipment menu. `weapon(i)` returns `40+i` for companions (5401); the candidate's weapon is45. Default `game.house=1` (9245) allows one permanent companion.

1. Character menu selection shows candidate cost and **RECRUIT**, or an owned companion's **DISMISS**, order, Boss/Defend options and daily wage (`updateCharaMenu`, 10245–10329).
2. Candidate Recruit checks, in order: `player.exist[3]` must be false; `getFreeAlly() <= game.house`; hero money must cover candidate cost (13610–13640). `getFreeAlly` scans0–4 for the first `exist==false` (10047). The source assumes valid, compact party slots and a live hero.
3. Confirmation uses `_dialogRecruit=4`. `endDialog(true)` deducts `player.cost[5]` from hero money, finds the first free slot, swaps candidate5 into it, deletes candidate5, refreshes menus and party skills (4945–4960). **No AP deduction, RNG call, automatic replacement candidate, `totalMoney` adjustment, or campaign-save call occurs in this transaction.** Cancel changes no game data. The ordinary dialog handler treats any click outside Yes as cancel (13478–13487).
4. **New Recruit** is a different action: costs2AP, immediately calls `generateRecruit()` to replace slot5 and consumes its generation RNG, then shows an acknowledgement (10540–10559). The acknowledgement does not generate again. Normal new-town entry also generates the next candidate; a continued town skips generation (3183–3215).
5. **Hired Gun** on the mission page is also different: `_dialogHire=6`, sets `mission.hire`, creates temporary slot4 on Rest and takes half the mission reward later (4805, 6642, 12738, 3431). It is not required to implement permanent recruiting correctly.

## Transfer, dismissal and equipment invariants

`swapChara(a,b)` swaps **every column of `player`**, then exactly one full inventory record, `40+a ↔ 40+b` (4772–4782). `swapStuff` swaps every inventory field (1363). Preserve name, class, portrait, sex, traits, potentials, level/XP/SP, weapon XP, money, kill/earn counters, order, focus, options, nextTrait and transient values rather than regenerating a character. Hired recruits retain their own money200; that is not a bonus to hero gold.

Militia generation writes auxiliary items47/48 in addition to weapon45 (`generatePlayer`, 2191–2204). Hiring transfers **only45**. Giving the new companion all entries in `recruit.items` would invent equipment:47/48 are retained global slot metadata and remain where the source wrote them.

`deleteChara` only sets `exist=false` and calls `sortChara` (10041). That sort is one ascending pass over adjacent slots0–4, swapping a live right neighbour into an empty left slot (9923). Dismiss confirmation does not refund the fee, sell, erase or return the equipped gun to hero inventory (4963). The inactive record/weapon persists. A later hire swaps that old inactive gun into candidate slot45; its metadata can affect later generation. Preserve this history while making it unavailable as a second owned item. In a full party, slot IDs can change through compaction; do not attach ownership or selected UI state solely to an old array position.

Equipment UI (`updateEquipSlots`, 4529–4563) exposes the hero inventory and one gun slot per existing companion0–4, excluding candidate5. Normal swaps cost no AP. `updateInvSlots`1963–2051 validates **both directions**: companions accept guns whose requirement they meet, or a MOD onto an occupied gun; a gun moved from an ally slot cannot swap back a consumable or a gun that ally cannot use. Hero under-skill equipment is merely warned about; ally under-skill equipment is blocked. Emptying an ally gun slot into an empty hero slot is allowed. `invDrag` performs the full-record swap (3006).

Existing MOD semantics need an ally-specific cancellation path: cancelling a MOD on a companion weapon restores the MOD to its source, **not** the hero-inventory gun/MOD swap (4899–4915). Upgrade/recharge target selection explicitly excludes all slots>=40 (1992–2004); an ally gun must first move into hero inventory to use those actions. `fillAmmo` refills non-consumable companion weapons and clears reloadTime (12707), and is called on battle exit (13312).

## Persistence and settlement are part of the feature

Original save/load clones the complete `game`, `player`, `inventory` and `mission` objects (6311–6349, 4986–5003), including inactive metadata. `PARTY`/`PARTYLV` are derived caches, not cloned in those four objects. Their refresh occurs at explicit source boundaries: hire/dismiss4960/4973, battle1581, town3229, generateMission12148, generatePlayer2137 and event-dialog10854.

`recruits.ts` describes a **fresh candidate**, with `exist:true`, zero XP/kills/weapon XP and SP=`lv−1`. The mutable `PartyState` instead retains five physical slots1–5, each with an existence flag, a nullable normalized member and one weapon record. Slot5 is the canonical candidate; `town.recruit` remains the historical generation snapshot validated by `town-save.ts`. Hiring and dismissal exchange whole member/weapon records, preserving inactive metadata. The v15 migration creates an empty owned party plus the ready current or previous town's candidate without RNG. New town generation uses canonical candidate weapon45 and retained auxiliary47/48 metadata, then installs the new candidate.

`validPartyState` validates compact owned slots, house capacity, known class/trait data and finite combat fields. Source critical-rampage countdown can reach−6 and is accepted. Battle imports additionally require active AI state, valid reload timing and a bow for `bowDrawing`; town imports preserve source stale reload metadata until Rest normalizes it. Cross-actor target identities and cached party values are checked by Simulation's save boundary.

Daily wages are separate from castle upkeep. `wage(i)`3610–3624 is:

```text
base = max(0, level*6 + 50 - (portrait==50 ? 50 : 0))
wage = int(base * (75 + potentialAim*potentialTeam*100)
           / (100 + PARTY.ACCOUNTANT + (RagnarokMedal ? 3 : 0)))
```

Hero wage is zero. `renewResult`3411 sums wages for existing slots1–4 **before** removing a temporary henchman; result net is reward minus wages/tax/upkeep plus castle income. `totalMoney` increases only by reward+castle income, not the net amount (3448–3451). Hiring after an already-settled result does not retroactively charge that day's wage. Future settlement uses the then-current level, including postbattle growth.

`eventAfterBattle`12484 first awards250XP and possible `levelUp` to each existing actor0–4, then processes weapon XP and spends **all** outstanding ally SP through `gainTrait`11517. This happens before loot screens. A level4 recruit arrives with3 unspent SP and does not spend them on hire. All nine class choice lists, focus and source RNG order are therefore reachable in the first hired battle; retaining a frozen fresh-candidate record would break progression immediately.

Party effects are not summed indiscriminately. `getBestSkill`7761 chooses the highest calculated value and its owning trait level across existing0–4, truncating into the caches. `initPartySkill`8479 enumerates16 party skills; Guardian damage is summed, and its attribution list includes every existing actor. Hunter starts with Scavenger and Guardian starts with Defender, so contributions matter before any growth. Later skills affect wages (Accountant), AP (Active), next generated mission reward (Negotiator), MOD strength (Engineer), drops and combat. Mission generation refreshes party skills, but hire does **not** regenerate the already-prepared mission. ItemFactory already accepts engineer/weapon-skill context; current town preparation supplies only day. Weapon-skill filtering is relevant when the corresponding original option is enabled (6111,13131).

Do not silently recalculate caches after each SP increment: neither `gainTrait`, `wexpUp` nor `eventAfterBattle` calls `initPartySkill`. Capture the original post-growth → loot → result → town sequence to establish when new Accountant/Active/Engineer values first affect results and generation. The current solo formulas and AP<=4 save assumptions cannot simply remain fixed after recruiting.

## Smallest useful integration and independent probes

A complete first slice is: inspect any of the nine generated classes, hire/cancel at the existing house1 capacity, save/Continue, exchange its valid weapon, Rest into a supported day, run its source-backed AI and shared RNG, settle its kills/XP/automatic skill growth/wage, return to town, then dismiss or keep it. Retain all nine classes; the legitimate one-companion house limit bounds this slice without filtering classes. House upgrades, multiple companions, temporary henchmen and recruit-refresh can remain separate visible scope, but candidate absence, dismissal metadata and all reachable first-battle skill effects cannot be omitted from the accepted path.

Use actual original methods with shared seeded RNG and full records, not port-created expectations:

- Hire/cancel all nine classes: cost−1/exact-cost, AP0 hire, occupied house1, absolute three-companion limit, absent candidate. Compare all swapped player columns and item fields, money/AP/totalMoney and zero transaction RNG. Observe guard outcomes through the actual town handler as well as `endDialog`.
- Dismiss → hire again with a distinctive stale inactive gun; verify compaction and candidate45 metadata. Include Militia47/48 retention. Verify cancel is a no-op and reload does not regenerate a hired candidate.
- Equipment: empty destination, compatible swap, incompatible reverse gun, consumable rejection, MOD confirm/cancel on companion, upgrade target rejection. Capture full item records and requirements.
- Existing level1 and level4 recruits through a completed-battle boundary: unspent-SP consumption, all nine class growth branches, seeded RNG, cached party values before/after explicit refresh, wage and Active AP. Include owned Guardian/Hunter immediately and one learned Accountant/Active/Engineer/Negotiator case.
- JSON replay during a companion reload/projectile, then one connected hire → next battle → results → town → dismiss/save flow. Combat geometry, frame scheduling and kill attribution require the separate companion AI reference; transaction equality alone is insufficient.

## Accepted transaction reference

The original diagnostic entered real frame71 through a continued town after actual Sheriff New Game initialization. Two browser runs on Ruffle0.7.1 produced identical79 snapshots on 2026-11-02. Eighteen captured starting states feed the production helpers; all61 subsequent transaction observations match. Cases cover all nine level4 classes, actual town click/dialog guards, AP0 exact-cost hiring, cancellation, dismissal/re-hiring with a retained inactive gun, Militia47/48 retention, ally MOD confirmation/cancellation and bidirectional equipment eligibility. Compared state includes complete persistent member records, all33 item fields, gold/AP/totalMoney and RNG state/count. Transient AI columns, native scheduling and fresh-town generation are outside this reference.

- Original SWF SHA256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
- Diagnostic SWF SHA256: `ab17b8ddf7a62a787ee86c8a11f1f4e4e391aa6ecf61be2721621e66338d6122`.
- Canonical trace SHA256: `32b7b529b18a50b78055dd9ce85c41b26088a0aa05f843753bf390b4dbee0891`.
- All3491 resource tags retain order and non-code payloads; only DoABC2782 changes. Fixture: `web/tests/fixtures/original-party-hiring-trace.json`.

The first fixture attempt opened Characters while still on battle frame27. The original town click handler continued after opening the Recruit dialog and touched absent town buttons, causing Error1009. The failed report remains in `.build/oracle/party-hiring-first-failure-report.json`. Moving the diagnostic into the actual continued-town timeline fixed that setup error; compared transaction methods were not changed to suppress it.

Rebuild with `python tools/build_party_hiring_oracle.py`, capture two runs at the existing oracle page's `suite=party-hiring`, then run `node --experimental-strip-types scripts/compare-party-hiring-reference.ts` from `web`. The focused command is `node --experimental-strip-types --test tests/party.test.ts tests/party-hiring-reference.test.ts`. Its negative control deliberately loses the inactive gun exchanged into candidate45 and must fail the dismissal/re-hire comparison.
