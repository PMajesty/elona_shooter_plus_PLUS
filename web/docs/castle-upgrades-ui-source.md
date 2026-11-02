# Castle House and Wall UI

The Castle panel now presents the original eight first-page tiles. House and
Wall use the production immediate-purchase API; the other six tiles and page2
are visibly disabled and explain their unavailable scope. This note covers the
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
unavailable tile to0.3. The port follows those values. The six unimplemented
tiles display their default source levels/prices but remain disabled regardless
of gold. Page2 is unavailable. No other Castle purchase is exposed by this UI.

`MainTimeline.as:13526–13555` purchases immediately: payment sound, current
price deduction, upgrade, tile rebuild and interface refresh. There is no
confirmation dialog, AP cost or RNG draw. The port callback invokes
`Simulation.buyCastleUpgrade`, saves on success and rebuilds the Castle panel.
Failure beeps; the small explanatory status messages are port UI rather than
quotes from the original game. Affordability is recomputed by the transaction
API, so rendered prices never authorize a stale purchase.

Upkeep comes from `castleUpkeep(state)` and the Wall/House prices from
`castleUpgradeCost`. Free Repair continues to rebuild the panel after healing.
Main accepts save envelopes1–16 and emits16. The town DOM diagnostic
`data-castle-upgrades` exposes House, Wall, maxHP, upkeep and both current costs
for ordinary browser checks; it is not an alternate action interface.

## Preservation and reproduction

Run `python tools/extract_web_assets.py` from the repository root. The original
SWF remains SHA256
`4ceb133dce049204d66213f23abe14bd953b8931291a23337490ae5c1f031663`.
The derived XML/SWF and full FFDec exports are cached under
`.build/web-assets/castle-tiles*`; no source timeline file is edited.

This extraction adds six page-button PNGs and the tile atlas PNG/JSON. Among
previous public assets, only `screens/townCastle.png`, `town-layout.json` and
`manifest.json` change. All other prior public asset hashes and both preserved
SWF/AS baselines match the pre-extraction snapshot. The runtime manifest now
contains108 images,49 clips,89 sounds and6 fonts. Details are recorded in
`.build/web-assets/castle-assets-verification.json`.

Validation completed here: cached export pipeline, original-art atlas inspection,
asset hash comparison and `npx tsc --noEmit` from `web`. These do not substitute
for the separate actual Castle click/save/browser checks.
