# VPS deployment

Updated 2026-11-07. Domain:
[Elona Shooter Plus+](https://pastalapizza.site/elona/).
The root URL redirects to /elona/; www redirects to the apex domain.
The [HTTP IP address](http://151.241.155.138/elona/) remains available.
The current release passes HTTPS checks through the workstation's proxy, with
normal certificate verification and no host mappings or TLS bypass.

## Current state

- Ubuntu24.04, distribution Caddy2.6.2 package, enabled systemd service.
- Browser Release 1.3.4 is `/srv/elona/releases/review-CGxFnhbq/elona/`
  (save v46). The preceding release is `releases/review-BWN_FVXb`.
- /srv/elona/current points to that release's parent directory.
- Active config: /etc/caddy/Caddyfile, from deploy/Caddyfile.https.
- Both domain certificates were issued successfully by Let's Encrypt. Caddy's
  enabled service manages renewal. HTTP redirects to HTTPS for the domain;
  www preserves the path while redirecting to the apex. Config validation passes.
- Browser saves stay on each visitor's device. No account/gameplay backend exists.
  Export/import a backup to move a run between localhost, IP and domain origins.
- The server verified the v46 archive and index before switching the current
  symlink atomically. The public JavaScript SHA-256 matched the local bundle.
- SSH credentials are not stored in this repository or deployment files.

Release 1.3.4 replaces Guide with an in-game Options entry, opposite the edition
selector. Sound, touch controls and save transfer have separate concise sections.
The build, localization checks, local desktop/touch checks and mobile smoke pass.
Public HTTPS serves JavaScript SHA-256 `8e2806890de48816e2514c0faa4a4465512321c6b44ebc6b6be0a8e8b94a4f0b`.
The JavaScript and CSS match the local build. Muted Chromium verified New Game,
EN/RU menus, sound settings and return navigation, preserved pause state, preference
persistence and exact save export/import/Continue. No page errors occurred.
Evidence: `.build/deployment/1.3.4-options.json`.
These public checks use the workstation's HTTPS proxy with normal certificate
validation. Earlier direct-route evidence below is historical.

Release 1.3.3 added the optional inset circular Reload control and fixed controls
overlapping loading, HTML-dialog touch leakage and short-screen positioning.
Evidence: `.build/deployment/1.3.3-thumb-reload.json`.

Release 1.3.2 added transparent gutters to every enemy family. All 4,224 frames
retained their pixels and registration; public checks matched all 36 enemy atlas
files and exercised late-game fixtures. Evidence: `.build/deployment/1.3.2-enemy-sprites.json`.

V46 adds the optional Expanded edition and Careful Consideration. The first
release passed 636 automated checks and muted touch flows in Chromium/Expanded
and WebKit/Classic. Public HTTPS checks matched the local bundle hash and used
real New Game/import/export/Continue operations for both editions, preserving a
separate Classic save. Hired-gun selection survived Rest and exact battle Continue.
The followup corrects chicken threat classification and all-weapon ranged
priorities, and uses original artwork/fonts for the edition selector. See
[current behavior and evidence](expanded-edition.md).
Its muted public-HTTPS check matched `index-BpURX4JP.js` to the local SHA-256
and exported the actual shotgun targets: distant chicken while safe, approaching
sheep when urgent. The styled selector, short order hint and hired-gun control
were checked in the same browser run without script errors.

The piercing correction passed 43 focused gameplay, save, party and source-probe
tests plus the production build. Muted Chromium on public HTTPS imported bow
and crossbow scenarios, resumed 32 ticks and exported the resulting saves.
Each sheep took one hit (1000 to 980 HP); the bolt also hit the second sheep.
Saved RNG matched the deterministic run, the arrow retained its target history,
and the served JavaScript SHA-256 matched the local bundle. No script errors.

The preceding touch release serves the verified mobile JavaScript bundle and compact
dinosaur atlas. SHA-256 matches the local build for the JavaScript, atlas JSON
and sprite image. Muted Chromium on the public URL started a new game in
portrait, used the enlarged menu, rotated into landscape, fired and reloaded
with two fingers, used a grenade, exported and continued the same save, then
imported a final-wave checkpoint and tapped through loot and results to the Inn.

On the medal and crossbow release, muted Chrome matched the HTTPS bundle's SHA-256 to
the local build. An imported mid-flight bolt at adjusted height 135 reduced
a sheep from 42 HP to 22. A separate results save began without Ha-na-bi,
played through frame 1144 (the seeded 73-burst show's end), and exported medal 93.

On the previous release, muted Chrome checked the public bundle hash and imported two isolated saves
immediately before the recorded hits. The Rogue companion's Long Bow killed
the sheep with 10 HP left. The Crossbow reduced its target from 42 HP to 6.
Both outcomes were read from the game's exported saves.

On the preceding zoom release, muted Chrome 156 verified the public bundle's SHA-256, started a new Rogue,
and fired at 100% and 200% browser zoom. The exported aim and the visible
cursor agreed after zooming with the mouse stationary. Clicking Menu at 200%
paused combat and preserved ammunition. The [fidelity review](fidelity-review.md)
records the comparison with the Flash reference.

On the preceding cursor and town-lettering build, muted Chrome verified the public bundle hash, the aiming
point at 1× and 2×, the native reticle hotspot and the colorblind frame. The
Tower and Help → Credits buttons kept their hover artwork during a held click.
The enlarged Inn used 376 × 145 source pixels for a 188 × 72.5 label layer.

On the preceding credits and title-audio build, isolated Chrome loaded the public game at native size,
displayed Help → Credits, played the title reload and gunfire through Web Audio
with desktop output silenced, selected an appearance and fired at the requested
world coordinates. Restoring a victory save reached the results and town shop.
The served bundle, sheep atlas and shop shadow matched the local build hashes.

On the preceding opening-animation release, a muted, isolated Chrome session skipped the logo,
entered New Game through the animated menu, selected an appearance and reached
battle. It restored a victory save, displayed fireworks and opened the town
shop. The served JavaScript, logo, portrait, inventory, rocket and spark assets
matched the verified local build by SHA-256.

On the earlier town review release, isolated muted Chrome displayed the MOD details,
started battle, imported an older Day 198 Sister save and verified full state
equality after Continue. Evidence is in
`.build/deployment/https-town-review-verification.json`. The preceding v45
build also passed standalone and same-origin iframe Continue via the workstation
HTTPS proxy with normal TLS validation.

An earlier isolated muted Chrome156.0.8078.80 check passed actual New Game, shooting5→4,
loot/boss loot/skill selection/results/town, delivered JSON export and exact full
battle/town Continue. There were no script errors, failed requests or HTTP errors.
The script response uses gzip and the proper JavaScript MIME type. First load in
this single public-network observation was3649ms; this is not a loading-speed SLA.
Evidence: ignored .build/deployment/public-verification.json and screenshots.
The user's existing browser profile/adventure/collection were not used or changed.
The earlier sPGHzc2d bundle also passed a focused public check of both
creation poses, mute/unmute synchronization and2× expanded layout without native
fullscreen. Evidence: .build/deployment/display-public-verification.json.

## DNS and HTTPS verification

Reg.ru authoritative apex/www answers point to151.241.155.138. Both Let's Encrypt
certificates are issued. The remaining failure was a local Windows DNS-client
cache entry for95.163.244.138 with77475s TTL: direct DNS queries already returned
the VPS while normal socket lookup still returned the old IP. One local cache
refresh changed socket resolution to151.241.155.138. DNS settings were unchanged.

The C0xS2vSY release before the final launch-audio-only addition passes **ordinary Chrome DNS/network routing**:
TLS1.3/YE1, secure context, New Game/fire, delivered export, exact full-envelope
Continue, HTTPS iframe Continue, HTTP-to-HTTPS, www-to-apex and root-to-/elona/
redirects. No host mappings, proxy override, TLS bypass, script errors, failed
requests or HTTP errors. The parent embed HTML is a client fixture; game/assets
are actual public HTTPS responses. Muted headless Chrome leaves the user's
profile and native fullscreen untouched. This establishes the measured route,
not the instantaneous contents of every recursive cache worldwide.

The final By__DLWU bundle separately passes the affected public audio flow:
two Sister bombs, one original WebAudio launch start, correct loaded sample and
normal TLS1.3 with the published domain. Sound output remains muted.

Evidence: ignored .build/deployment/https-release-verification.json and
.build/browser-qa/sister-cue-public-verification.json. Earlier
mapped checks/default-route failures remain historical evidence and are not
current blockers. Do not repeat cache flushes or certificate issuance without a
new demonstrated failure. Caddy handles
[automatic renewal](https://caddyserver.com/docs/automatic-https/).

## Updates and recovery

Build locally, stage a new complete dist under a new /srv/elona/releases/ directory,
and verify the transfer before changing /srv/elona/current. Keep the previous
release for rollback; do not overwrite it in place. Keep index and original assets
together. no-cache permits revalidation of original, non-hashed artwork after an
update, and gzip compresses text responses. Directory browsing is disabled.

For content rollback, repoint current to the retained release. An older build
may reject saves from a newer schema (v43 lighting, v42 manual Burst); preserve
exports and use a matching pre-update checkpoint rather than editing live saves.
Release 1.2.0 also rejects the new `aimAssist` MOD key despite sharing save v46;
keep an enabled adventure's export for 1.3.0 or later. For a bad HTTPS
configuration, restore /srv/elona/staging/Caddyfile.http-active and reload Caddy.
The original package configuration is saved as
/srv/elona/staging/Caddyfile.before-elona. Do not restart unrelated services.
