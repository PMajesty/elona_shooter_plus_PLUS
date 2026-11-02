# MOD mounting during reward collection

The original permits MOD mounting during both ordinary and boss loot. Every displayed offer and owned item uses the same inventory transaction path. A confirmation changes neither reward stage nor currency, and declining it performs a normal item swap.

## Exact source contract

Anchors refer to preserved `src/original/MainTimeline.as`.

- `_eventLoot=3`:416 and `_eventLootBoss=8`:156 select different reward panels at6230–6242. Both call `procLootMenu`:11166, which creates offers0–7 and owned20 through`20+invSlot−1` with operation flag1. Offers are not shop stock in this context.
- `invDrag`:2989–2996 opens `_dialogMod` only when the carried item is a MOD and the occupied target is a gun. It has no town-only restriction. Offered→owned, owned→offered, owned→owned and offered→offered pairs all qualify. Gun→MOD is an ordinary full-record swap and opens no dialog.
- `showDialog`:5782–5810 sets `gameDialog` and shows the common dialog at stage coordinates0,0. MOD confirmation has no before/after comparison popups. The prompt is “Do you really want to mount the mod on this gun?” Opening the dialog changes no inventory fields, gold, totalMoney, AP or RNG.
- `MouseLDownFunc_result`:1739–1762 handles a pending dialog before checking Proceed, fade, reward stage or item clicks. A shape hit on Yes calls `endDialog(true)`; every other non-volume click calls `endDialog(false)` and returns. Thus clicking outside or attempting Proceed declines the mount without advancing rewards.
- `endDialog`:4852–4888 checks rejection conditions on Yes: no free mod capacity; Ammo/Reloading with `ammoMax==1`; Ammo/Reloading with `reloadTimeMax==0`; AutoReload on a non-manual gun; Living Weapon on an already living gun. These source checks are independent, so a bow can issue the same ammo/reloading warning twice. A rejected mount closes the dialog and preserves both item records.
- Successful Yes:4890–4896 calls original `enchant(target, source.mod, source.modMax)`, then sets only the MOD's `num=0`. Its other metadata remains. `enchant`:8577–8683 uses cached Engineer and repeated-mod efficiency, changes the weapon, increments its mod count/text/value and refills ammo. It leaves reload metadata unchanged and uses no RNG when given a fixed mod ID and level.
- No:4899–4909 restores the dragged icon for a companion target at40 or above; every loot destination is below40, so No swaps the two complete records. This includes an offered gun swapping into owned inventory while the declined owned MOD becomes an offer.
- Both postbattle modes leave uncollected offered items subject to their ordinary reward-stage continuation. Mounting an owned MOD on an offered gun does not automatically collect that gun.

The port's persisted v20 action uses `{kind:'mod', mod:{area,index}, gun:{area,index}}`, with `area` equal to`offers` or`inventory`. `moveLootItem` opens a qualifying modal; `beginLootModMount` exposes the same operation; `resolveLootModMount` applies Yes or the reverse-direction swap for No. While pending, other item moves and Proceed must refuse changes. Save/load, modal guards and real browser interaction are separate integration checks from the original method capture.

## Independent diagnostic boundary

`python tools/build_loot_mod_oracle.py` builds an instrumented copy of the preserved original SWF. A startup-fixed original New Game reaches battle, then a continued-town entry supplies actual initialized root controls. The driver selects the real ordinary/boss loot panel and calls its original `procLootMenu`; fresh town generation and loot generation are outside the comparison boundary.

An objects-under-point seam selects actual original inventory slots for `invDrag`. Confirmation uses original button geometry and `MouseLDownFunc_result`, including a separate outside-click case. All original method bodies are retained except reversible observation/input/random wrappers; non-code tag payloads, tag order and frame header remain identical. Original SWF version9 is promoted to10 only in the diagnostic copy, as with the existing AS3 trace fixtures.

Eighteen scenarios provide53 snapshots: Yes and No for all four offered/owned directions; boss reward pairs using original owned slot35; full capacity, Ammo/Reloading-on-bow, AutoReload and duplicate-Living rejection; a new Living Weapon; repeated Damage with explicit cached Engineer25; and reverse gun→MOD swap. All33 item fields, exact RNG state/count, currency/AP, dialog state, source warning messages and source slot eligibility are recorded.

The first diagnostic failed because its button observer typed the original SimpleButton as MovieClip. Changing only that observer to DisplayObject corrected the type error. The first SWF/build/browser artifacts are preserved under `.build/oracle/loot-mod-*-before-button-type.*`. This was an instrumentation defect, not an original game or production runtime defect.

The production comparator drives actual `moveLootItem` and `resolveLootModMount` against captured original input records. It compares exact owned/offer state, pending endpoints, gold/AP/totalMoney, RNG and reward/party/result invariants. Warning outcomes compare their meaning; duplicate source popups and audio presentation are not claimed identical. Cached Engineer25 is an explicit method input, not a claim that this diagnostic acquired the skill through a campaign.

Ruffle0.7.1 captured two identical53-snapshot runs at `2026-11-02T03:33:26.700Z`. All53 production comparisons pass, including full33-field records, every outcome and zero RNG throughout. New Living Weapon receives800 remaining experience. Repeated Damage on a Hunter's Rifle under cached Engineer25 produces72 attack; the deliberate no-Engineer control produces70. The prior Shotgun case rounded both branches equally, so that earlier exact-match evidence was preserved under `.build/oracle/loot-mod-*-before-engineer-boundary.*` and the final fixture uses the discriminating rifle.

Accepted evidence:

- Fixture: `web/tests/fixtures/original-loot-mod-trace.json`.
- Instrumented SWF SHA256: `4666992fd4f29c36801e87b5f8274c45e37880c51921f83b57f5c7f587525f08`.
- Canonical trace SHA256: `3be24c9b8398d261c1958d95fb202ab6a6eccaa8cac6ef4e84aa845697282751`.
- Build/browser/comparison reports: `.build/oracle/loot-mod-{build,browser,comparison}-report.json`.
- Comparator: `npm run test:loot-mod-reference`.
- Four focused reference tests pass, including negative controls for No-as-no-op, erased consumed-MOD metadata and omitted cached Engineer. No production correction was required by this capture.

The suite URL is `http://127.0.0.1:5176/?suite=loot-mod`. This method fixture does not establish native result scheduling, save persistence or actual browser drag behavior.
