# MOD confirmation on reward screens

Ordinary loot and boss prizes use the same two-click item flow: pick a MOD,
then choose an occupied gun. Either endpoint can be an offer or an owned slot,
including the second inventory row. The UI delegates the move to
`Simulation.moveLootItem`; that method opens `pendingLootAction` instead of
moving the records immediately. Rendering does not generate or enchant items.

## Original behavior and artwork

The preserved `src/original/MainTimeline.as` supplies these boundaries:

| Source | Behavior |
| --- | --- |
| `invDrag`, 2989–2996 | A carried MOD over a gun opens `_dialogMod`; there is no menu-ID restriction excluding ordinary or boss loot. |
| `showDialog`, 5782–5811 | Attach the shared dialog to stage at `(0,0)`. Only Upgrade shows comparison popups and their arrow; MOD does not. |
| `MouseLDownFunc_result`, 1741–1762 | Handle an open dialog before reward-screen actions. Yes confirms; any other click resolves No. |
| `endDialog`, 4852–4933 | Yes checks compatibility and mounts using original enchant. No swaps non-ally item records; ally cancellation is a separate behavior. Rejected confirmation returns the MOD to its source. |

The existing `town-layout.json.saleDialog` describes sprite **2131** and the
already extracted `shopSaleDialog` image. Its question is at `(224,175.7)` using
font **682**, 15px. Original Yes (**2128**) is at `(213.8,226)` and No (**2126**)
at `(319.9,226)`. Normal and hover button images already exist. No assets,
extractor changes or invented replacement art are needed.

`mod-confirmation-view.ts` renders this original confirmation for both shop and
loot. The loot panel has an x offset of `−15.587619764971691`; the modal cancels
that parent offset so its artwork, text and hit areas remain at stage coordinates.
The original question is retained: “Do you really want to mount the mod on this
gun?” The modal has a full-canvas input surface beneath Yes/No and above the
slots and Proceed control. A click on an underlying slot or Proceed therefore
chooses No and cannot also move an item or advance rewards. Hover hints and
reward actions have explicit pending guards as well.

Before opening the dialog, original `invDrag` stops the carried MOD at the target
gun's slot and retains its topmost item layer. Both shop and loot reconstruct
that pending presentation: the same MOD icon moves from its source to the
target's registration, using `target.x − (MOD graphic width − 48) / 2 − 4` and
the target's y coordinate. There is no duplicate icon at the source. The target
gun remains underneath, while both stored item records remain unchanged. This
also applies after Continue and to either offer/owned endpoint or inventory row.

## Persistence and integration

Save version **20** retains `pendingLootAction` with `kind: 'mod'` and two
`{area,index}` endpoints. The UI saves after opening and resolving confirmation.
Continue/import returns through `showOutcome` to the same ordinary or boss loot
screen and reconstructs the modal from saved state; it does not replay the move.
Reward phases do not advance battle simulation while the dialog is open.

Only Yes invokes `resolveLootModMount(true)`. No and outside clicks invoke
`resolveLootModMount(false)`. The screen is redrawn from the resulting records,
so a source No-swap is visible immediately. Confirmation opens with
`soundScroll1`; resolution uses `soundClick1`, successful mounting adds
`soundMod`, and a compatibility failure uses the existing source message and
`soundBeep`. As with the town UI, one failure message is shown even where the
original emits several compatibility warnings.

The DOM exposes `data-pending-loot-action`, alongside the existing loot-offer,
inventory and capacity fields, for inspecting the ordinary UI result. This is
status only; it does not add production test controls. The browser wrapper now
exports version 20 and accepts versions 1–20; canonical validation and legacy
initialization belong to `Simulation.fromSave`.

This note records implementation and source placement. Actual browser click,
save/Continue and original-method comparison evidence is reported separately;
it does not establish complete pixel, audio or native scheduler parity.
