# Sound settings

Choose **Sound** below Help on the title screen, or open **Menu / Pause**
during a game, including the tavern. Both editions share three volume sliders:

- **Master volume:** all sound.
- **Effects:** weapons, enemies, actions and interface feedback.
- **Ambience:** the forest and town background loops only.

100% retains the existing mix, including quieter companions and positional
panning. Zero silences that channel. Mute remains a separate switch and does
not reset the sliders. Preferences are stored in this browser, outside adventure
saves, and apply to both editions. An already playing or paused sound adopts
the new volume without restarting.

The tavern uses the town ambience loop. Title gunfire, reloads and impacts use
Effects; there is no separate menu music track in the current playback paths.
The controls use original parchment, checkbox and metal radio-button artwork
with the game's menu fonts. The title dialog closes with its red cross, Escape
or a tap outside it. The existing speaker buttons still toggle mute directly.

## Classification audit

The source playback sites were inspected before implementing the split. All
89 entries in `web/public/assets/manifest.json` are explicitly accounted for in
`web/src/audio-settings.ts`. New names fail classification instead of silently
falling into a default channel. The catalog test checks exact manifest coverage.

Evidence below uses the preserved `src/original/MainTimeline.as` and the
corresponding original SWF's cached decompilation in `.build/export/scripts`.
The latter is reproducible extraction output, not a committed dependency.
Ranges in the table include every numbered key in that range.

| Files / sound keys | Category and source use |
| --- | --- |
| `soundBgForest`, `soundBgTown` | **Ambience.** The original `amb` channel loops them at MainTimeline lines 1512, 3167 and 6260. The port loops them in battle and town. |
| `soundGun1` through `soundGun15` | Effects. Weapon presentation table, MainTimeline 9940–10023; boss weapons in `enemy.as` 1070, 1140, 1147. `soundGun2` is also used by the title and town robbery. |
| `soundBow1`, `soundBow2` | Effects. Arrow launch (`enemy_archer.as` 66, `enemy_cata.as` 73); bow drawing (MainTimeline 7934). |
| `soundChain1`, `soundChain2`, `soundChain3` | Effects. Chain-gun wind-up, wind-down and firing (MainTimeline 7912, 2493, 7917). The firing loop is a weapon, not ambience. |
| `soundReloading1` through `soundReloading3`, `soundReloaded1` through `soundReloaded3` | Effects. Reload start/completion, weapon selection and title reload (MainTimeline 2670–2686, 4580–4589, 7368; original title StartSound cues). |
| `soundThrow1`, `soundExp1`, `soundFireball`, `soundLightning`, `soundPuls` | Effects. Grenade throw/explosion, dragon fire, dinosaur lightning and pulse attacks (MainTimeline 13363, 3055, 6172; `enemy_dragon.as` 71; `enemy_dino.as` 48). |
| `soundLaunch`, `soundDrop`, `soundDefend` | Effects. Sister launch, bird dropping a rat and castle defense (MainTimeline 8312, 10868–10883; `enemy.as` 1408). |
| `soundDamage1`, `soundLow`, `soundRampage`, `soundRampageEnemy` | Effects. Castle damage, resisted hits and hero/enemy rage (`enemy.as` 595–653, 851, 1321; MainTimeline 12310). |
| `soundDead1` through `soundDead9`, `soundDeadChicken`, `soundDeadBoss1`, `soundDeadBoss2` | Effects. Enemy deaths in the matching `enemy_*.as` timelines; boss death stages in `ally1.as` 77 and 148. |
| `soundChicken`, `soundChickenAttack`, `soundCrow`, `soundCata`, `soundTank`, `soundTank2` | Effects. Enemy entrance/call/attack frames: `enemy_chicken.as` 44, 100; `enemy_crow.as` 60; `enemy_cata.as` 41; `enemy_tank.as` 43, 70. These are not environmental birds or background machinery. |
| `soundGoodshot0` through `soundGoodshot4` | Effects. Kill praise selected in `enemy.as` 812. |
| `soundBattleBegin`, `soundBattleEnd`, `soundKilled` | Effects. Battle start, victory and defeat (MainTimeline 6261, 6197, 8066). |
| `soundComplete`, `soundMedal`, `soundAward`, `soundGold1`, `soundBag1`, `soundPop1` | Effects. Level/training, medal, title, gold, loot-bag and wave notifications (MainTimeline 10498, 10731, 10523, 10639, 10668, 6513; `enemy.as` 959). `soundBag1` is bundled but has no current port playback call. |
| `soundFirework`, `soundImpact1` | Effects. Victory fireworks and title impacts (MainTimeline 11398, 12813–12851). A finite repeating celebration is not a background ambience loop. |
| `soundClick1`, `soundScroll1`, `soundBeep`, `soundCard1` | Effects. Buttons, panels, invalid actions and activity-card hover (MainTimeline 1625, 1818, 1863; `actions.as` 55). |
| `soundPay1`, `soundMod`, `soundGood` | Effects. Payment, equipment modification and successful town actions (MainTimeline 2955, 2902, 10547). |
| `soundSearch`, `soundEat1`, `soundParty`, `soundNight` | Effects. Search, dinner, party and sleep action cues (MainTimeline 11205 onward, 10654, 10607, 10783). Night is a one-shot action cue, not the ambient night background. |
| `soundPray1`, `soundRepair1` | Effects. Prayer/protection and repair, shared by town and combat (MainTimeline 3682, 10624, 3673, 10574). |
| `soundMute` | Original silent placeholder assigned to `amb` when leaving a screen (MainTimeline 2559). The extracted MP3 decodes to a sample peak of zero. Not loaded or played by the port. |
| `soundBad` | Unused. Constructed at MainTimeline 9101, with no playback reference in the original scripts or port. Its intended gameplay role is unknown; it is not routed to a channel or loaded. |

This is a classification by gameplay role. It does not change timing, sample
content, sound selection or game rules. There is no separate music track in
the current playback paths, so there is no misleading Music slider.
