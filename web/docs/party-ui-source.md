# Party interface: original source and browser boundary

This note covers the original Characters and Equipment menus and the assets used by `src/party-view.ts`. Hiring transactions and AI behavior are audited separately in [party-hiring-source.md](party-hiring-source.md) and [party-ai-source.md](party-ai-source.md). Source anchors below refer to the preserved `src/original/MainTimeline.as`; symbols and placements come from `.build/reference/original.xml`.

## Two different kinds of hiring

**Permanent recruitment starts in Characters, not the Mission panel's Hire card.** `MouseLDownFunc_town` selects Characters (`menuId=3`, `menu_chara`) at lines 13743–13750, and Equipment (`menuId=6`, `menu_equip`) at 13711–13721. The Characters candidate is source player index 5. Selecting the candidate changes the lower-right action to `RECRUIT`; selecting an existing companion changes it to `DISMISS`. The hero has no dismiss action.

The Mission Hire card is `_dialogHire=6`, the temporary henchman agreement: “The henchman demands half the mission reward. Accept?” (`MouseLDownFunc_town`, 13510; `endDialog`, 4805). Its existing `button_townHire` artwork is also used for Characters' **search for another candidate** card. Sharing that button asset does not make these actions equivalent.

Permanent recruitment (`_dialogRecruit=4`) checks, in order, the occupied third companion slot, house capacity, and gold, then opens the source Yes/No dialog (`MouseLDownFunc_town`, 13610 onward). Its messages are:

- `You have reached the limit of recruits.`
- `You need to upgrade the house!`
- `You don't have enough money!`
- `Do you really want to recruit NAME for COST gp?`

Only a click on Yes confirms; every other click cancels (`MouseLDownFunc_town`, 13472–13483). `endDialog` at 4945–4960 subtracts the candidate's cost, transfers the character and weapon, removes the candidate, refreshes the panels, and recalculates party skills. The UI must not mutate or generate a candidate merely by selecting a portrait or opening/canceling this dialog. `swapChara` at 4772 transfers the character arrays and source weapon slot `40 + characterIndex`.

Dismissal uses `Do you really want to dismiss NAME?` and the same modal (`endDialog`, 4962 onward). Searching for another candidate is a separate **2 AP** event (`showEventDialog`, 10540): card 7, title `New Recruit!`, a replacement candidate and reopened Characters panel. The view exposes this as an optional callback; a missing callback leaves the original action visibly disabled.

## Character indices and panels

`maxAlly=5` and `maxParty=4` are initialized at 9169–9170. The source indices are:

| Index | Role | Weapon slot |
| --- | --- | --- |
| 0 | Hero | Selected hero inventory slot 20–24 |
| 1–3 | Permanent companions | 41–43 |
| 4 | Temporary henchman | 44 |
| 5 | Available recruit candidate | 45 |

The shared window is symbol 1995. `menu_chara` starts on frame 63; `menu_equip` starts on frame 71. Both use the settled town offset **x=24.41238023502831, y=−22**. The exported full-stage panel PNGs already contain y=−22. Their separately rendered controls, text, portraits and slots need both offsets. `town-layout.json` records these placements and the original matrices.

`updateCharaList` at 1393 creates source `ally3` (symbol 685) at local `(160 + index*62, 146)`, with an additional +10 x for candidate index 5. It creates only existing characters. The source portrait includes:

| Child | Local position | Source |
| --- | --- | --- |
| Selectable card `bg` | `(14.6, 9)` | Button130, scale `(0.49331665, 0.61906433)` |
| Shadow | `(−9.25, 7)` | Sprite680, scaleX `0.9024353` |
| Character `chara1` | `(−12.45, −15.45)` | Sprite677, scaleY `0.9530487` |
| Name | `(−11.8, 20)` | Text683, font682, 12px |
| Level/experience | `(12, −10)` | Text684, font682, 12px; `L:N\nE:EXP/10` |

The card is alpha 0.6 when unselected and unhovered; selection/hover sets the card to 1 (`onEnterFrame_town`, 6499). Other portrait children do not inherit that card-only dimming. Both `ally3` and equipment `ally2` start `stand` at frame 8: frames 8–11 choose `pic*10+5`, frames 12–15 choose `pic*10+6`, frame 16 jumps back to `stand`. The view reuses the existing `charaPic` atlas with this eight-frame cycle instead of exporting 22 duplicate portraits.

`updateCharaMenu` at 10104 supplies the fields below. Coordinates are window-local:

| Field/control | Position | Behavior |
| --- | --- | --- |
| Class | `(185,190)` | `getClass(devType)[0]` |
| Wage/title value | `(185,208)` | Hero title; otherwise `Free` or `N GP` |
| Earned / kills | `(312,190)` / `(312,208)` | Character counters |
| Order label | `(347,210)` | `ORDER.` or candidate `COST.` |
| Order ComboBox | `(404,201)` | Source width `100*1.2500153`, height22 |
| Candidate cost | `(401.4,208.2)` | Blue `#0000cc`, or red `#cc0000` if unaffordable |
| Boss / Defend | `(400,181)` / `(472.45,181)` | Character targeting preferences |
| Recruit/dismiss text | `(462,358)` | Source Impact font1653, 11px |
| Recruit/dismiss button | `(527,362)` | Button1696 |

The source hides orders and options for the candidate, and hides Boss/Defend for the hero in Hero Mode. Orders, in source order, are Hero Mode (`−1`, hero only), Attack mobs in weapon range (`0`), don't attack air (`1`), don't attack armored (`2`), don't attack either (`3`), Attack air (`4`), Attack armored (`5`), Always fire at will (`6`). Labels retain the original English. `orderClick` at 12996 updates the selected character; the UI delegates the mutation.

Traits are placed at `(150 + floor(index/6)*130, 232 + index%6*18)` using symbol2143. Sorting keys are descending: class `100000+id`, base `70000+id`, normal `50000−id`, party `10000+id`. Class/base icons use original frame2; party frame3; normal frame1. Base/class text is `#044010`. Hero Mode hides base aiming/teamwork900/901. A selected focus indicator is positioned at trait `(x−22,y+2)`. Candidate traits are informational; class/base traits cannot be focused (`Base skills can't be focused.`). Names, descriptions and values come from the caller's normalized source traits, not fabricated UI calculations.

## Equipment flow

`procEquipMenu` at 12750 sets the original hint: `Drag & drop to move items or change equipment.` `updateEquipSlots` at 4529 creates:

- Hero inventory: source slots20 onward, `(140 + (index%8)*50, 250 + floor(index/8)*48)`; the first five display hotkeys1–5.
- Existing hero/companion portraits (`ally2`, symbol687): `(155 + characterIndex*80,195)` for indices0–4. Candidate5 is excluded.
- Companion weapons: source `40+characterIndex`, `(166 + characterIndex*80,160)`.
- Hero's top placeholder: source46, `op=−1`, alpha0.5; it is not an extra equipment slot.

`ally2` has the same body cycle as `ally3`, with body at `(−12.45,−19.45)`, shadow at `(−9.25,3)`, and name at `(−2.45,20)`. The weapon icon is centered using its actual source display width, not the common atlas width. The view reuses the original item width/height tables exported by `shop-view.ts` and the original `inventorySlot`/`itemPicture` assets.

`invDrag` at 2868 is click-pickup/click-drop, with the picked-up item following the pointer between clicks. `updateInvSlots` at 1964 dims ineligible targets. A companion slot accepts a gun meeting that companion's weapon-skill requirement, or a MOD over an occupied gun. Swapping an existing companion gun back onto an occupied slot must also leave that companion with an eligible gun. Hero inventory can hold a gun the hero cannot use, with the original warning. The view performs these checks for dimming only; the transaction callback remains authoritative.

Dropping outside the Equipment slots **returns the item without selling it**. The sale path is explicitly restricted to `menuId==4` (Shop) near the end of `invDrag`, 3020 onward. A MOD onto an occupied gun opens its own confirmation; the view requests that transaction and never consumes the MOD itself. The original ally-target MOD cancellation behavior differs from the hero-owned swap case; see the transaction audit.

The source Equipment action cards are Recycle (5 AP) and Restock (3 AP), separate from ordinary movement (`MouseLDownFunc_town`, 13683; `invDrag`, 2901–2927). Their original artwork and labels are retained but visibly disabled until those actions are implemented. This does not block zero-AP equipment transfers.

## Battle actors and HUD

`updateAlly` at 6776 creates source `ally1` symbol838 for indices0–4, in ascending order, using the already extracted `allyBack`, chosen `charaPic`, `allyFront`, and optional second body. The positions are:

| Slot | Actor position | Aim cursor position |
| --- | --- | --- |
| 0 | `(510,245)` | `(480,245)` |
| 1 | `(512,215)` | `(482,215)` |
| 2 | `(514,275)` | `(484,275)` |
| 3 | `(508,185)` | `(486,185)` |
| 4 | `(518,305)` | `(488,305)` |

The cursor is original `cursor2`, symbol2340. It is added before its actor; actor/cursor source metadata is now included in `town-layout.json.battleParty`. The browser maps `actorSlot` shot/reload/bow/level events to that companion's `OriginalAlly` instance and reads its saved AI cursor position. Source audio transforms at 9147–9150 set companion volumes to 0.2/0.3/0.1/0.2 and pans to 0.8/0.7/0.9/0.85. Companion bow sounds pause/resume with the battle and are destroyed on scene reset. No additional companion HP bars are introduced: the source defense shares castle HP.

`updateInterface` at 12420 still updates the ordinary hero ammo/gold/level/day/HP/hotbar and town AP. `updateCi` at 6294 displays the hero's five item slots; **keys1–5 select items, not companions**. Characters portrait selection is menu state and must not repurpose combat hotkeys.

## Extracted additions and verification boundary

`python tools/extract_web_assets.py` now reproducibly adds:

- Screens `townCharacters`, `townCharactersLabels`, `townEquipment`, `townEquipmentLabels`; the action labels remain separate foreground layers above their card buttons.
- Original button states `button_partyPortrait`130, `button_partyDismiss`1696, `button_partyRecycle`1758, `button_partyRestock`1762.
- Original clips `partyShadow`680, `partyTraitIcon`2142, `partyAimCursor`2340, `partyCheckOff`1474, `partyCheckOn`1469, `partyOrderSkin`1713, `partyOrderListSkin`1721.
- Embedded Impact font1653 as `fonts/impact.ttf`, registered by the application as `ElonaImpact`.
- `town-layout.json` sections `characters`, `equipment`, `partyPortrait`, `equipmentPortrait`, `partyTrait`, `partyControls`, `battleParty`. Existing generic dialog2131 and Yes/No buttons are reused.

The extraction produces **102 images, 47 clips, 89 sounds and 6 fonts**. The original SWF hash is checked before and after extraction; the previously packaged assets are unchanged. The panel PNGs were visually inspected for unwanted placeholder fields and source layering. No new drawing substitutes for missing original artwork.

The source Flash `UIComponent.configUI` absorbs placed scale into component dimensions. Accordingly, the checkbox icon remains 14×14, while its control width reflects the source scale; order/list skins use their original `DefineScalingGridTag` borders. The browser recreates those controls' interaction and text using the source skins, rather than executing Flash components. Dynamic font rasterization, dropdown behavior and the complete composed panel have not yet been compared pixel-for-pixel against an original runtime capture.

`main.ts` now wires Characters/Equipment into ordinary town navigation and restores saved recruitment/dismissal/ally-MOD confirmations. The current hero remains manually controlled: the panel shows source name `You`, disables hero AI/focus, and displays an em dash for unavailable cumulative hero kills/earnings instead of relabeling day-local/global money counters. Companion values and controls use their canonical party records. Candidate refresh, temporary henchmen, Recycle and Restock remain disabled. Restored companion visuals recover idle/reload/bow poses from saved mechanics; the presentation-only frame within an ordinary shot is not separately saved, matching the existing hero presentation policy. This UI work alone is not evidence that recruitment transactions, companion AI, wage settlement or party progression are integrated correctly; those require the separate runtime and ordinary-flow checks. TypeScript validation passes; final browser acceptance is owned by the integration task.
