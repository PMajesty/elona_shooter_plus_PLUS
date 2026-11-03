# VPS deployment

Updated2026-11-03. Domain:
[Elona Shooter Plus](https://pastalapizza.site/elona/).
The root URL redirects to /elona/; www redirects to the apex domain.
The [HTTP IP address](http://151.241.155.138/elona/) remains available.
The ordinary Chrome HTTPS route now passes without host mappings or TLS bypass.

## Current state

- Ubuntu24.04, distribution Caddy2.6.2 package, enabled systemd service.
- The current game is `/srv/elona/releases/review-DMuRZUK8/elona/` (save v45,
  code `73bd70d`). The previous v45 release is `releases/review-1shtHcPP`
  and the previous v43 release is `releases/release-By__DLWU`.
- /srv/elona/current points to that release's parent directory.
- Active config: /etc/caddy/Caddyfile, from deploy/Caddyfile.https.
- Both domain certificates were issued successfully by Let's Encrypt. Caddy's
  enabled service manages renewal. HTTP redirects to HTTPS for the domain;
  www preserves the path while redirecting to the apex. Config validation passes.
- Browser saves stay on each visitor's device. No account/gameplay backend exists.
  Export/import a backup to move a run between localhost, IP and domain origins.
- The server verified the v45 archive and index before switching the current
  symlink atomically. The public JavaScript SHA-256 matched the local bundle.
- SSH credentials are not stored in this repository or deployment files.

Muted Chrome 156 verified the public bundle's SHA-256, started a new Rogue,
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
exports and use a matching pre-update checkpoint rather than editing live saves. For a bad HTTPS
configuration, restore /srv/elona/staging/Caddyfile.http-active and reload Caddy.
The original package configuration is saved as
/srv/elona/staging/Caddyfile.before-elona. Do not restart unrelated services.
