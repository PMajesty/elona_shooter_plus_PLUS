# Castle purchase UI

The Castle panel presents the original eight first-page tiles. Fix Wall, Wall,
Sandbag, Storage, House and Repairman use the production immediate-purchase API;
Looter, Trainer and page2 are visibly disabled and explain their unavailable scope. This note covers the
UI and asset boundary. Transaction evidence is in
[castle-upgrades-source.md](castle-upgrades-source.md); browser acceptance is
recorded separately by the integration owner.

## Source layout and extraction

Preserved `src/original/MainTimeline.as:1304–1357` builds eight `upgrades`
instances at `x=150+(i%4)*100`, `y=140+floor(i/4)*110` inside the Castle window.
The settled window offset is `(24.41238023502831,-22)`. Wall is tile1 and House
tile4, giving parent origins `(274.41238023502831,118)` and
`(174.41238023502831,228)` respectively.

`tools/extract_web_assets.py` derives `castleUpgradeTiles` from original
sprite2192. It retains the source coin1442, underline2156, button2159,
picture2191, placement matrices, color transforms and filters. Picture frames
2–9 select Fix Wall, Wall, Sandbag, Storage, House, Looter, Repairman and Trainer.
The 16 atlas frames are up/over pairs: `index*2+1` and `index*2+2`. The common
frame is148×152 with registration offset `(37.95,28.1)`; those offsets include
filter expansion and must not become the click bounds.

Original dynamic name/cost fields2152/2153 are drawn separately using embedded
font682 at12px, source positions `(-11.6,64)` / `(-11.6,82)`, and paragraph
indents17 /31px. Castle hint2 uses embedded font1535, loaded under family `ui`.
The original page buttons1625/1630 are separate assets so page2 can be dimmed
without dimming the panel. `townCastle.png` omits those two baked buttons;
the existing original Free Repair button and labels remain separate.

Button2159's hit-state uses shape2157, whose outer rectangle is filled even
though its alpha is3 before the inherited button opacity. Raster alpha testing
would discard legitimate portions of that rectangle. The extractor therefore
derives its source rectangle, translated into the tile parent:
`(-16,-8,104,111)`. The UI uses that rectangle rather than filter-expanded PNG
alpha. Dynamic labels also receive clicks. This is a bounded source geometry
choice, not a claim that every overlapping Flash display-list edge was compared
in a browser.

## Behavior and scope

`MainTimeline.as:1322–1356` appends positive current levels, displays the cost,
uses blue `#0000cc` when available and red `#cc0000` otherwise, and dims an
unavailable tile to0.3. The port follows those values. The two unimplemented
tiles display their default source levels/prices but remain disabled regardless
of gold. Page2 is unavailable. No other Castle purchase is exposed by this UI.

`MainTimeline.as:13526–13555` purchases immediately: payment sound, current
price deduction, upgrade, tile rebuild and interface refresh. There is no
confirmation dialog, AP cost or RNG draw. The port callback invokes
`Simulation.buyCastleUpgrade`, saves on success and rebuilds the Castle panel.
Failure beeps; the small explanatory status messages are port UI rather than
quotes from the original game. Affordability is recomputed by the transaction
API, so rendered prices never authorize a stale purchase.

Upkeep comes from `castleUpkeep(state)` and all six prices from
`castleUpgradeCost`. Free Repair continues to rebuild the panel after healing.
Main accepts save envelopes1–19 and emits19. The town DOM diagnostic
`data-castle-upgrades` exposes House, Wall, maxHP, upkeep, the Fix Wall purchase
counter, Repairman level/repair amount, Sandbag level/damage multiplier/absorption
percentage, derived Storage level/capacity and the six current costs for ordinary
browser checks; it is not an alternate action interface.

## Paid repair and Repairman extension

Fix Wall is tile0 at parent origin `(174.41238023502831,118)`; Repairman is tile6
at `(374.41238023502831,228)`. Existing atlas frames1/2 and13/14 provide their
normal/hover states. No new asset extraction or pixel edits are needed.

`MainTimeline.as:11874` describes Fix Wall as "This will completely fix the castle
wall." The price is `int(8 * (maxHP - HP))` from `getUpgradeCost` at12598. A zero
price at full HP disables the tile. A successful purchase increments the source
`wallFix` counter and fills HP (`upgradeDone`,7306–7309), but the index0 exception
in `updateCastleMenu`,1322 suppresses its level suffix. The port saves that count
as `wallFixCount`; the visible label remains **Fix Wall**.

Repairman uses source `repair`, stored as `repairmanLevel`. Its cost is
`level² * 250 + 700` (12618–12620), giving700,950,1700 GP for the first three
purchases. There is no source Repairman cap. Its level suffix appears only above
zero. The original description at11880 is "Repairers will slowly fix the castle
wall during a battle between waves." At level0,11898–11902 replaces the detail
with "[ You haven't acquired this upgrade yet ]"; thereafter the detail reports
`castleRepairAmount(state)` HP per wave, equivalent to `repair * 2` at12467.
The recurring upkeep includes60 per Repairman level (1664).

Both purchases follow the same immediate payment/rebuild path, with no dialog,
AP or RNG cost. Buying a Repairman does not heal immediately. The source's
new-wave path at8366–8375 adds/clamps HP and calls `updateHP` before evaluating
perfect-wave status. It plays no repair sound and sets no castle flash or visual
effect. Those hooks belong to Repair Hammer use (3659–3673), not this upgrade.
The port therefore refreshes the ordinary HP HUD without inventing an automatic
repair effect. Paid Fix Wall uses the normal payment sound, whereas Free Repair
retains its separate repair sound and event dialog.

This UI extension is typechecked after runtime integration. Actual purchase,
wave-boundary, save/Continue and browser acceptance are separately recorded by
the integration owner; this note alone does not establish them.

## Sandbag extension

Sandbag is tile2 at parent origin `(374.41238023502831,118)`. Existing atlas
frames5/6 contain its normal/hover art, so the v18 integration changes no assets.
The current source level appears as `Sandbag Lv N` above zero. The source price
is `level² * 240 + 1000` (`MainTimeline.as:12629–12631`); at level10 it becomes0
and the tile dims/disables (`12673`). Repeated clicks then beep without payment,
matching the common Castle transaction guard. Each level adds40 recurring upkeep
(`1666`). Existing repair, House and Wall state is retained.

The description at11876 is "Stronger sandbags will absorb more damage done to
the wall." The level0 detail is replaced by the generic not-yet-acquired text
at11900–11902. Positive levels use the source expression
`int(100 - castleAbsorb() * 100)` in "(Currently, sandbag will absorb N% damage)".
`castleAbsorb`,1423–1426 returns `1 - level * 0.05`. The UI calls the production
`castleDamageMultiplier` helper and preserves this exact floating arithmetic
and truncation instead of simplifying the display to `level * 5`.

`main.ts` includes `sandbag`, `sandbagCost`, `damageMultiplier` and
`sandbagAbsorptionPercent` in the ordinary town diagnostic. It emits/imports
v18 envelopes; the runtime owns validation and v17 migration. Success uses the
existing payment sound and Castle rebuild, and cap feedback identifies Sandbag.
No new damage effect, sound, alternate input path or timer is introduced by the
UI. Production damage integration, source comparison, save/replay and browser
acceptance remain separate evidence owned by the integration work.

## Storage extension and expanded inventory

Storage is tile3 at parent origin `(474.41238023502831,118)`; atlasframes7/8
provide the unchanged up/over artwork. The displayed level is derived from
`inventory.length - 5`, matching initial Storage1/six slots and maximum
Storage11/sixteen slots. No duplicated saved Storage field is introduced. Price
is `(slots - 4)² * 30 + 250` before purchase, and becomes0 at16 slots. Each
purchase adds one empty owned slot and40 recurring upkeep. The source hint at
`MainTimeline.as:11877` is "Buying this upgrade gives you +1 extra inventory
slot." with the current capacity detail. Cap and affordability reuse the original
disabled tile style and payment/denial path. The runtime remains the authority
for capacity, payment and pending-dialog guards.

Owned inventory IDs20–35 are represented by port indices0–15. The original
shop (`11742–11746`) and Equipment (`4533–4537`) grids use local
`x=140+(index%8)*50`, `y=250+floor(index/8)*48`. Existing `town-layout.json`
already contains this eight-column/48px row metadata. Their views already
iterate `state.inventory.length`, so no layout or art replacement is needed.
Town's parent offset gives actual row origins y228/276 and leftmost x164.41238.
Shop buy/swap/sale, Upgrade, MOD and Token callbacks pass the full slot index;
Equipment uses the same dynamic indices for both hero-owned and companion moves.
These routes still use the existing modal guards and cancellation behavior.

`procLootMenu`,11174–11188 retains eight offers and iterates all owned slots,
with local owned rows at224/272. The loot panel already bakes parent y−26, so
its dynamic rows are198/246, leftmost x124.41238 after the existing menu slide.
`loot-view.ts` now iterates actual capacity with eight columns and48px row
spacing. Its old port status text at y262 would cover the second row, so that
copy hides when capacity exceeds8; messages use the existing status below the
canvas. Slot artwork, tooltips, pickup/drop, offer count and Proceed placement
remain unchanged. Main's `data-inventory-slots` exposes the actual capacity in
battle/reward/town states, and Castle diagnostics include derived level/cost.
Only the first five owned slots show hotkey numbers and are available to battle
selection/cooldowns, as in `createInvSlot`,3553–3556. Storage is not extra hotkeys.

There is an existing scoped difference: the original common `invDrag` route
at2990–2996 allows MOD→gun confirmation during loot as well as town. The port
still allows mounting in town only. Its loot message explicitly directs the
player to town and preserves both items; adding reward-phase confirmation and
persistence is separate work. Expanded-slot loot transfer coverage must not be
reported as loot-MOD parity.

The v19 wrapper accepts versions1–19 and the runtime owns canonical length6–16
validation/migration. No sprite, font, sound, extractor or layout file changes
are needed for this extension. Source placement inspection and shared typecheck
are separate from the root's browser checks of second-row actions and persistence.

## Preservation and reproduction

Run `python tools/extract_web_assets.py` from the repository root. The original
SWF remains SHA256
`4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
The derived XML/SWF and full FFDec exports are cached under
`.build/web-assets/castle-tiles*`; no source timeline file is edited.

The earlier v16 extraction added six page-button PNGs and the tile atlas PNG/JSON. Among
previous public assets, only `screens/townCastle.png`, `town-layout.json` and
`manifest.json` change. All other prior public asset hashes and both preserved
SWF/AS baselines match the pre-extraction snapshot. The runtime manifest now
contains108 images,49 clips,89 sounds and6 fonts. Details are recorded in
`.build/web-assets/castle-assets-verification.json`.

The v16 validation completed here: cached export pipeline, original-art atlas inspection,
asset hash comparison and `npx tsc --noEmit` from `web`. These do not substitute
for the separate actual Castle click/save/browser checks.
