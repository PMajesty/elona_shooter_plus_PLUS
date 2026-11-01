# Town weapon Upgrade and MOD mounting

The solo Sheriff Days 1–2 slice supports upgrading owned guns and mounting owned
MODs in the town shop. `equipment.ts` provides item operations; `Simulation`
owns confirmation, money, AP, RNG and persistence. Player slots 20–25 map to
inventory indexes 0–5. Ally equipment and other town actions are separate work.

The preserved source is `src/original/MainTimeline.as`:

| Boundary | Source anchors |
| --- | --- |
| Upgrade eligibility and mode | Shop action 13644; `updateInvSlots` 1963; `invDrag` 2868; mode cleanup 13788 |
| Preview and confirmation | `showDialog` 5782; `upgradeWeapon` 6654; `endDialog` 4797 |
| MOD placement and constraints | `invDrag` 2943–2994; `endDialog` 4852–4919 |
| Shared item operations | `generateStuff` 3842; `weaponVariation` 13126; `enchant` 8577; `swapStuff` 1363 |

## Upgrade transaction

Entering Upgrade requires 4 AP. Only occupied, owned gun slots are eligible;
shop stock and ally slots are excluded. Selecting a gun immediately generates
its preview in original reference slot 49. Generation consumes two random
draws and sometimes a third. Explicit variation to the next weapon level adds
no draw. The newly rolled modifier capacity affects the preview's value before
its capacity is replaced with the source gun's capacity; this ordering is
preserved.

The price is `trunc(source.value * 1.2) + 500`. Cancel, or confirming without
enough gold, retains the preview and the advanced RNG, but spends no gold or
AP. Reopening generates a new preview. Successful confirmation uses the exact
stored preview, spends the displayed price and 4 AP once, and swaps the old gun
into reference slot 49. The reference remains after cancellation, confirmation
and the next-day transition. The original town handler leaves equip mode after
opening the dialog; confirmation does not reroll the item.

Weapon requirements still increase through original `weaponVariation`. The
starter Shotgun becomes Mk-2 with Shotgun requirement 6, while an unchanged
Sheriff has skill 2. Upgrade grants no skill levels. Owning the gun remains
allowed, but battle firing rejects an unmet requirement.

## MOD transaction

Only dragging a MOD onto an occupied owned gun opens mounting confirmation.
Choosing **No swaps the two owned items**; it is not a no-op. The reverse
gun-onto-MOD move is an ordinary swap. Source ally cancellation differs and is
outside this slice.

Yes checks free modifier capacity, Ammo/Reloading compatibility (neither a
single-ammo weapon nor one with zero reload time), manual reloading for Auto
Reload, and whether a Living Weapon is already alive. Invalid confirmation
leaves both items intact. Success invokes fixed-ID/fixed-level `enchant`, spends
no AP, gold or RNG, fills gun ammo, and sets the consumed MOD's `num` to zero
while retaining its metadata. Repeated modifiers use original diminishing
effects; repeated Auto Reload replaces its level. The browser reports one
failure category where the original emits duplicate compatibility messages.

Stock cannot be mounted directly onto an occupied gun. `updateInvSlots`
(2014–2016) dims occupied destinations for a shop source, and `invDrag` rejects
that destination before its payment branch. The apparent charge-before-dialog
ordering therefore does not establish a reachable ordinary shop-MOD payment
bug. Buy into an empty owned slot first, then mount it as a separate operation.

## Intentional last-mod correction and evidence

Original `enchant` appends `Name(Lv.n) ` to modifier text. `upgradeWeapon`
(6667–6671) splits that text and loops one entry too few: one installed modifier
disappears entirely, and several lose their last entry. A last-position Living
Weapon also loses its remaining progress. The port preserves all installed
entries and the Living Weapon countdown.

Two identical original runtime captures contain **104 observations**. The
accepted comparison matches **88/88 snapshots**, including **84 complete
reference-item comparisons**. Four raw scenarios preserve the original loss;
four parallel scenarios independently apply original `enchant` to the omitted
entry, with Living Weapon progress restored where applicable. The original
method body is unchanged. Corrected port items are compared against those
explicitly labeled original-method interventions, not port-generated expected
values. Four intermediate rows defer reference-item equality until that
correction; the raw defect observations are retained separately.

Mounting and upgrade regeneration reuse `ItemFactory` and its source-derived
`enchant`, rather than a second set of modifier formulas. Existing generation
provenance is the 157-snapshot `original-item-trace.json` fixture. Transaction
provenance, SWF/trace hashes, seams and commands are documented in
[the oracle notes](../../docs/oracle-notes.md#town-upgrade-and-mod-transactions).
The transaction fixture excludes full town generation, ally equipment, physical
pointer geometry, animated dialogs and audio. Production transactions begin
when an owned item or MOD/gun pair has been selected.

## Saves and integration checks

Version 9 persists `upgradeReference` and `pendingTownAction`. Older formats
initialize both to null without additional RNG. Loading a preview validates
its gun identity, next level, capacity, quoted cost, source slot and AP; it never
regenerates the preview. Pending MOD saves validate distinct owned MOD/gun slots
but allow incompatible pairs, because compatibility is checked on Yes. Pending
dialogs block unrelated town mutations and Rest.

Ordinary battle completion clears reload timers before town. Accepted imported
town metadata may retain a timer: original `enchant` fills ammo without clearing
it, and Reloading can lower the maximum below that old timer. Town saves retain
that source-method result exactly. Rest clears it before battle. Battle imports
still reject occupied guns with full ammo and a nonzero timer, or timers beyond
the active reload maximum plus one. This supports imported metadata continuity;
it does not claim ordinary town entry leaves a gun reloading.

- Nine `modification-save.test.ts` checks cover migration, preview/cancel RNG,
  confirmation once, reference retention through Rest, mounting/rejection,
  pending-action guards and malformed imports.
- Four `modification-gameplay.test.ts` checks follow mounting through Rest into
  actual firing: increased Damage MOD hits, held Auto Fire shots, the upgraded
  gun's skill guard, and ordinary reload cleanup. They use explicitly configured
  items/skills; the damage case supplies hit membership rather than testing
  collision contours.
- Three `modification-reference.test.ts` checks exercise accepted source data
  and negative controls for changed previews, cancellation and RNG.
- The passed campaign replay report `.build/soak/report.json` covers 96 scenarios,
  196,379 updates and 2,287 save checkpoints, with **53 upgrade previews, 16 MOD
  mounts, 18 upgrades and 35 upgrade cancellations**. It checks port consistency
  and replay, uses a documented rectangular boss fallback, and makes no claim
  about original parity, browser rendering, input latency or audio.
