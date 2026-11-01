# Original UI reference

This is an extraction-based reference for the browser port, not a claim of
visual parity. Coordinates come from the preserved original SWF and
`src/shootem_fla/MainTimeline.as`. The stage is **620 × 380**, at **30 FPS**.
SWF matrix translations and bounds use twips (20 twips = 1 pixel).

## Live comparison

The local comparison harness is `.build/ruffle-reference/index.html`, using
Ruffle **0.7.1** and the existing fixed SWF. Launch from the repository root:

```powershell
python -m http.server 5174 --bind 127.0.0.1 --directory .build/ruffle-reference
```

Open `http://127.0.0.1:5174/`. The game appears at its native 620 × 380 size.
The ignored harness is development state, not part of the browser port.

Original SHA256: `4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
Fixed reference SHA256: `bf573da9f6dc7dae9538ccc3e458b1eba80dc7947ad16f520fde62388b3c4363`.

## Title

The root title is frame 22 (`title`). Static symbol placements are not settled
button coordinates: `onEnterFrame_title()` moves buttons downward in 25-pixel
steps, with impact effects and camera shake.

| Element | Symbol | Initial position | Settled vertical position |
| --- | ---: | --- | ---: |
| New Game | 2521 | 185, -79.3 | 195.7 |
| Continue | 2542 | 187.9, -126 | 249 |
| Help | 2579 | 207.9, -174 | 301 |
| Save slot ComboBox | 1740 | 470.5, 30.7 | 30.7 |
| Save trash button | 2644 | 445.95, 29 | 29 |
| Volume | 2671 | 596.95, 366.35 | 366.35 |

Title code: lines 12837–12935. Buttons have their own local graphics/bounds;
these positions are origins, not necessarily top-left visible bounds.
Clouds move left 0.5 pixels per frame and wrap at x < -1280.

## Character creation

The shared `window` sprite is symbol **1995**, frame **125** (`menu_gene`).
The event window is initially set to (0, -26), then its slide animation sets
x to 590 and subtracts `i^1.7` for i = 15 through 0. Its settled position is
**(-15.587619764971691, -26)**, from `onEnterFrame_result()` at lines 5267–5280.
All coordinates below are local to that window; apply this settled offset for
stage coordinates. Static `gene` and `result` asset exports already include the
-26 y offset but retain x = 0, so rendering should shift those images left by
15.587619764971691 pixels. Their dynamic controls need the same x adjustment.

| Element | Symbol | Local position |
| --- | ---: | --- |
| Panel background | 1479 | 314.1, 224.35 (scale 0.853302, 1.1465759) |
| Heading | 1878 | 228, 82 |
| Welcome text | 1854 | 291, 88 |
| Appearance label | 1855 | 151, 126 |
| Class label | 1865 | 151, 214 |
| Class illustration | 1864 | 402.2, 287.5 |
| Class starting equipment description | 1875 | 280, 231 |
| Proceed | 1547 | 267, 327 |
| Game MODs | 1881 | 408.05, 327 |
| Next Page / Previous Page | 1874 | 155, 340 |
| Casual Mode | 1475 | 417.4, 278 |
| Hardcore Mode | 1475 | 418, 301 |

The welcome text is exactly:

> Welcome, famed officer. We need your help badly to defend our castle!

There are **22 appearance choices**, in two rows of eleven:
`x = 176 + (index % 11) * 32`, `y = 157 + floor(index / 11) * 30`.
They use `ally4` (symbol 681), which selects nested `charaPic` frames from the
chosen portrait index. The selection value is separate from class.

Class order is **Rogue, Hunter, Sheriff, Militia, Sniper, Ranger, Duelist, Noble**.
The first four are initially unlocked. The second page shows `??????` for locked
classes, with `You need to win a medal to play this class.` as the explanation.
The original default is Rogue (`geneClass = 0`). Radios are at `(180, 240 + i*20)`.
The radios use symbol 2312. Trait entries use symbol 2143 at
`(271 + floor(i/4)*130, 244 + (i%4)*18)`.

Starting equipment descriptions from `getClass()` (lines 13935–13969):

| Class | Description |
| --- | --- |
| Rogue / Hunter | Starts with Little Girl. |
| Sheriff | Starts with a shotgun. |
| Militia / Sniper | Starts with a rifle. |
| Ranger | Starts with cheap worn HMG. |
| Duelist | Starts with a modified pistol. |
| Noble | Starts with a modified smg. |

`gameStart()` (line 13850) adds Little Girl for Rogue/Hunter. Her appearance
index is 50, and she uses the Fire At Will AI. Omitting her changes the starting
combat behavior for those two classes.

## Battle presentation

The root battle is frame **27**. These are origin placements, before any
runtime changes or camera shake:

| Element | Symbol | Position |
| --- | ---: | --- |
| Background | 2493 | -5, -15 |
| Cloud | 2496 | 160, -35 |
| Castle | 2673 | 575, 219.95 |
| Sister | 2622 | 596, 97 |
| Bottom bar | 2675 | 315, 370 |
| Sandbag | 2678 | 480, 255 |
| Static HUD elements | 2680, 2693 | 0, 0 |
| Day text | 2694 | 47, 8.95 |
| Money text | 2682 | 427, 8.95 |
| Castle HP text | 2695 | 531, 8.95 |
| Ammo bar | 2698 | 290.9, 11 |
| Ammo text | 2699 | 292, 9.95 |
| Menu button | 2703 | 597, 361.35 |
| Volume | 2671 | 559.95, 367.35 |
| Level text | 2710 | 518.05, 356.15 |
| EXP text | 2712 | 518.05, 367.3 |
| Adrenaline fill | 2717 | 148, 9.9 |
| Adrenaline label | 2718 | 154, 11.85 |

Player presentation uses `ally1` (symbol **838**), positioned by `updateAlly()`:
`x = 510 + index*2` (minus eight for index 3),
`y = [245, 215, 275, 185, 305][index]`. The player's appearance comes from
`charaPic` frame `appearanceIndex*10 + pose`, selected by ally frame scripts.

The enemy defense line is **455**. Ground enemy spawn y is based on
`groundLine = 170`, `groundWidth = 155`; the air range is 40–110.
Enemy draw order, shadow, critical shapes, and hit testing are separate concerns.
Do not infer a hitbox from the visible sprite rectangle alone.

Battle HUD values come from `updateDay`, `updateHP`, and `updateAmmoBar`:
day shows `game.day + "/" + mission.wave`, HP shows `current/max`, ammo shows
`current/max`. The source does not show elapsed seconds as the day counter.

## Fonts and drawing fidelity

| SWF font ID | Face | Use |
| --- | --- | --- |
| 682 | HGPGyoshotai | Menu text, typically 12–13 px |
| 2681 | Leelawadee Bold | Day/money/HP/ammo at 16 px; Adrenaline at 12 px |
| 1392 | Levenim MT Bold | Level/EXP at 10 px |

HUD text has white fill, 1-pixel letter spacing, embedded outlines, and shadow
filters. Text fields generally begin at local bounds (-2, -2). Matching a font
name without extracting the embedded glyphs does not establish visual parity.

Flash frame export does not execute ActionScript. In particular, exported
character poses can be wrong when a nested `charaPic` is switched by a frame
script. Static exports also retain placeholder HUD values and may not apply
runtime visibility or background transforms. Verify against the live reference.

The detailed extracted metadata lives in ignored
`.build/reference/ui-layout.json`; `.build/reference/original.xml` contains the
full FFDec XML export. These support development and are not needed at runtime.

## Player and boss animation reconstruction

`tools/extract_animation_metadata.py` extracts symbol 838 placement matrices and
the `ally1.as` frame-script pose selections into
`web/public/assets/ally-animation.json`. `web/src/original-animation.ts` applies
these matrices to the selected appearance's `charaPic` frames. The two effects
atlases contain the original timeline decorations below/between the body parts:
`allyBack`, chara1, `allyFront`, chara2.

The Sheriff uses firing frames 95–108 and stops on frame 109. Firing uses pose 1;
frame 109 changes to pose 2. Reload loops frames 30–41 with poses 3 and 4. The
first boss uses pistol/SMG firing frames 10–23, stops at 24, and walks on frames
200–211 using poses 1, 2, 7, 2. Death begins at 281, selecting body poses 8 and 9,
and stops at 403. Mirror the entire actor container for a boss facing right;
flipping only the face loses the original weapon/shadow placement.

## Character bitmap sampling

All 273 `charaPic` bitmap fills in the original SWF are type `0x43`, a
non-smoothed clipped bitmap fill. The idle body uses a fractional placement
of `(-12.7, -17.95)`. Applying linear texture sampling therefore blends neighboring
pixels even at a native 620×380 canvas and CSS size with DPR 1. `main.ts` now uses
`Texture.setFilter(Phaser.Textures.FilterMode.NEAREST)` for `charaPic` only, keeping
the original fractional transforms. Its frame 2 export exactly matches original
bitmap 133 (24×32 RGBA); that extraction did not introduce blur.

The installed Phaser 4.2.1 API was checked against its implementation and
[official texture documentation](https://docs.phaser.io/api-documentation/class/textures-texture).
UI/vector/effect textures retain their existing sampling. Browser inspection
confirms the integrated game still renders, but this is not complete live
Flash-versus-port image parity or a claim that every source of blur is resolved.
