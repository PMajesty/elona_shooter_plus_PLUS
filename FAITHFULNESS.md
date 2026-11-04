# Faithfulness to the Flash game

This port is based on **Elona Shooter Plus 1.3.0.4**. Classic preserves the original content, rules and balance, with the bug fixes described below.

## What carries over

The original artwork, fonts, sound, English text and credits are retained. So are the eight hero classes, weapons, companions, town activities, medals, Casual and Hardcore modes, and the seven original Game MODs.

Encounters repeat in cycles with stronger enemies later on. Class unlocks and medal bonuses carry into future adventures within the same edition.

The [port status](docs/port-status.md) lists detailed coverage, comparisons and remaining differences.

## Fixes are part of Classic too

Gameplay fixes apply to both Classic and Expanded. For example, ground-level arrows and crossbow bolts have corrected collision handling, and a piercing projectile cannot damage the same enemy repeatedly while overlapping it. Other corrections include the No Armor order, Trouble's next-day enemy health and the Kongregate wage discount.

The [fidelity review](docs/fidelity-review.md) records the original behavior and why it was changed.

## What changes in a browser

Menus, scrolling, touch controls and display scaling are adapted for browsers. Normal play can save during combat and results as well as in town; Flash adventure saves were town checkpoints. Hardcore still permits saving and exporting only in town. Combat resumes paused after Continue.

Browser adventures currently support **Day 1–1000**. This limit comes from browser save validation. Later-day progression has been checked with controlled scenarios; natural late-game difficulty still needs more playtesting.

Random outcomes will not exactly match a Flash playthrough. Browser saves retain their random stream for continuation, but Flash saves did not store that generator state. Fonts, filters, cosmetic randomness, animation timing and sound mixing can differ. Performance has not been benchmarked against native Flash.

## Saves and original Flash imports

Classic and Expanded have independent medals and day records, while sharing eight labeled adventure slots. A JSON import restores one adventure and merges medals only into the matching edition's collection. It does not replace the collection or restore all eight adventures.

Flash imports are Classic. The importer accepts the original medal file, `elonas_idx.sol`, and supported town adventures, `elonas0.sol` through `elonas7.sol`. Import the matching medal file first and choose an empty slot for the adventure. Keep the original files and a browser backup.

Compatibility remains provisional. A town save produced by the preserved game under Ruffle imported successfully, and its next search matched the original event, AP and search cursor. Historical player saves and the native Adobe Flash runtime remain unverified. See the [Flash fixture notes](web/tests/fixtures/flash-native/README.md).

## Expanded is optional

Expanded contains optional fan-made features. Its first addition is **Smart Mode**, the default order for new companions in Expanded. Allies spread their fire and prioritize threats, with 15% less damage and an aiming delay that grows with the distance to the next target. Adventures keep their edition when loaded; saves made before Expanded was introduced load as Classic. The [Expanded guide](docs/expanded-edition.md) explains the order and its balance limits.

Desktop and touch controls are available, but physical iOS and Android devices have not been checked. See [port status](docs/port-status.md#accepted-differences-and-support-limits) for browser and embed limits.

[Back to the game overview](README.md) · [Development](DEVELOPMENT.md)
