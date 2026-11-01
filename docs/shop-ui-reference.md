# Original shop UI and transaction contract

This records the supplied game's source behavior for the first prepared town
shop. It does not establish that every shop service or equipment effect is
implemented in the port. Source line anchors refer to
`src/original/MainTimeline.as`; symbol IDs refer to the preserved SWF.

## Layout and original assets

Town uses root frame 71. Shop navigation is the original `shopButton` symbol
2758 at `(46, 268)`, with its slight source scale recorded in
`web/public/assets/town-layout.json`. The shared window symbol 1995 uses frame
80 (`menu_shop`). Its settled town position is
`(24.41238023502831, -22)`, as for the Mission and Castle panels.

The `townShop` panel and `townShopLabels` foreground are full 620 × 380 images
with the -22 vertical offset already included. Draw both at `(menuX, 0)`;
draw separate controls using the named child transforms plus `(menuX, -22)`.
Preserve the original order: panel, action buttons, then foreground labels.
The blacksmith greeting and stock/inventory headings remain original artwork.
Runtime popup, warning and action-help text are omitted from the panel.

| Element | Original symbol | Local registration |
| --- | --- | --- |
| Refresh stock, `act1` | 1807 | (472.15, 98.75), rotated by the source matrix |
| Upgrade weapon, `act2` | 1815 | (416.95, 98.3) |
| Close | 1497 | (528, 90.95) |
| Sale confirmation window | 2131 | Full stage at (0, 0) |
| Sale Yes | 2128 | (213.8, 226) in the dialog |
| Sale No | 2126 | (319.9, 226) in the dialog |
| Sale question | 2123 | (224, 175.7), source menu font 682 at 15px |

The manifest provides `button_shopRefresh`, `button_shopUpgrade`,
`button_dialogYes` and `button_dialogNo`, each with `_over` and `_down` states.
`shopSaleDialog` excludes its dynamic question, Yes/No buttons and the two
upgrade-preview popups. `saleDialog.children` contains exact question bounds,
styles and button transforms. Original town input confirms only when Yes is
hit; any other click cancels (`MouseLDownFunc_town`, 13457).

`updateShopSlots` (11732) creates eight stock slots and `game.invSlot` owned
slots. The initial inventory has six slots; storage upgrades can expand it.

| Area | Original inventory IDs | Window-local placement | Operation code |
| --- | --- | --- | --- |
| Stock | 0–7 | x = 140 + i × 50, y = 160 | 0 |
| Owned | 20 onward | x = 140 + (i % 8) × 50, y = 250 + floor(i / 8) × 48 | 1 |

Reuse the existing `inventorySlot` and `itemPicture` atlases. `shopCoin` is the
original coin symbol 1442. `inventorySlot.children` records the omitted dynamic
parts: cost at `(14, 53)` with menu font 682 at 11px, coin at `(3.95, 56.9)`,
hotkey number at `(6, 29.4)` and the original unusable-item mark. Only the first
five owned slots display shortcut numbers. Empty stock slots are hidden; empty
owned slots remain available. `updateSlot` (5604) colors an affordable stock
price `#0000cc`, otherwise `#cc0000`. The source warning uses Arial font 1535,
included as `fonts.ui`.

## Purchase, movement and sale

`invDrag` (2868) implements two mouse-down actions: pick up an occupied slot,
then select a destination. It calls `startDrag` between these clicks; dropping
is not tied to mouse-up. Interaction is blocked while the panel is sliding.
`procShopMenu` (6281) only constructs the view. Opening it does not regenerate
stock or consume random draws.

- A stock item can enter an **empty owned slot**. `updateInvSlots` (1963)
  disables occupied destinations when the carried source has operation code 0.
  There is no purchase-and-swap operation with an occupied owned slot.
- The price is checked immediately before the transaction. Insufficient money
  beeps and returns the item without changing inventory or gold. A zero price
  is allowed. A successful purchase subtracts its price and transfers the whole
  item; the source stock slot becomes empty and hidden. No automatic restock or
  buyback list is created.
- Owned items can move to empty owned slots or swap with occupied ones.
  `swapStuff` (1363) exchanges **every inventory metadata field**, including
  modifications, ammunition, reload state, value and generated level. It does
  not regenerate a base item from its ID.
- A player weapon's unmet skill requirement displays a warning; it does not
  block purchase into the player's inventory. Companion equipment has separate
  restrictions and is outside this shop slice.
- Dropping an owned item outside a valid destination requests sale confirmation.
  Dropping an ordinary owned item onto a stock slot follows this same route.
  The question is `Do you really want to sell it for N gold?`.
- Confirmation (`endDialog`, 4928) credits both player money and the original
  cumulative `game.totalMoney`, then clears the source item's `num` and slot.
  Cancellation preserves the item and money. All owned slots are eligible,
  including the initial shotgun and grenades; the source does not protect them.
  The HUD reads the selected slot and clears ammo text if that slot is empty.

`stuffGetValue` (11482) first converts stored `inventory.value` to an integer.
Buying returns that integer. Selling items of type 3 (`_typeSell`, sale loot)
returns the same integer; other types return its integer division by five.
Generated shop discounts are already reflected in `value`; the price function
adds no further skill, level or sale multiplier. Selling a partially used item
does not apply an additional ammunition-based price adjustment here.

## Unsupported services must preserve items

An owned MOD placed onto a gun opens a separate mounting confirmation instead
of swapping. If mounting remains unavailable, reject it with an explanation
before changing either item or money. Stock-to-occupied guards also prevent
buying a shop MOD directly onto an occupied gun slot.

Shop Token item 35, type 6, has a separate source path: dropping it onto stock
reduces that stock item's stored value by the token's `attack` amount, clamps it
to 0–999,999,999, and consumes the token. If token application is not implemented,
it must not silently consume the token or discount stock. It can still be sold
through the ordinary outside-slot confirmation at its normal sale value.

Refresh Stock requires 2 AP and regenerates stock through its event dialog.
Upgrade Weapon first requires 4 AP and enters a selection mode, then asks for
money confirmation. These services and MOD mounting must be visibly unavailable
until their actual state transitions are implemented. Their original artwork
is provided separately so disabled controls can retain the correct layering.

This audit describes source contracts. Generated stock parity, transactions,
save validation and ordinary browser interaction require their separate
implementation and runtime checks.
