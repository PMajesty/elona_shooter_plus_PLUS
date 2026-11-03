# VPS deployment

Updated2026-11-03. Domain:
[Elona Shooter Plus](https://pastalapizza.site/elona/).
The root URL redirects to /elona/; www redirects to the apex domain.
The [HTTP IP address](http://151.241.155.138/elona/) remains available.
Some recursive DNS paths still cache the previous host; see the boundary below.

## Current state

- Ubuntu24.04, distribution Caddy2.6.2 package, enabled systemd service.
- Release: /srv/elona/releases/combat-ei1CwovT/elona/ (save v42).
  Prior display-sPGHzc2d (3d732fd) remains available for rollback.
- /srv/elona/current points to that release's parent directory.
- Active config: /etc/caddy/Caddyfile, from deploy/Caddyfile.https.
- Both domain certificates were issued successfully by Let's Encrypt. Caddy's
  enabled service manages renewal. HTTP redirects to HTTPS for the domain;
  www preserves the path while redirecting to the apex. Config validation passes.
- Browser saves stay on each visitor's device. No account/gameplay backend exists.
  Export/import a backup to move a run between localhost, IP and domain origins.
- The gameplay update archive was checked by SHA-256 before extraction and the
  current symlink switched atomically. It includes manual shared-skill corrections
  and the restored combat feedback. V42 retains optional manual Burst state.
- SSH credentials are not stored in this repository or deployment files.

An isolated muted Chrome156.0.8078.80 check passed actual New Game, shooting5→4,
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
certificates are issued. On2026-11-03 at07:03UTC, ordinary curl HTTPS reached Caddy
with200; Chrome156's ordinary route still failed with
ERR_SSL_VERSION_OR_CIPHER_MISMATCH. These paths are distinct observations;
global DNS propagation is not established.

The current ei1CwovT release passes a public browser check using the real domain
mapped to the VPS only inside its isolated process: TLS1.3/YE1 and secure context,
New Game/fire, delivered export, exact full-envelope Continue, HTTPS iframe
Continue, HTTP-to-HTTPS, www-to-apex and root-to-/elona/ redirects. No TLS bypass,
script errors, failed requests or HTTP errors. The embed parent HTML is a
client-side fixture; the game/assets are actual public HTTPS responses. Muted
headless Chrome leaves the user's profile and native fullscreen untouched.

Evidence: ignored .build/deployment/https-combat-verification.json and
https-default-verification.json. The earlier mapped check and default failure
remain separate. Check the ordinary route once on a later continuation; after
it refreshes, confirm the default-network browser flow. Do not rebuild, reissue
certificates or repeatedly flush caches for unchanged propagation. Caddy handles
[automatic renewal](https://caddyserver.com/docs/automatic-https/).

## Updates and recovery

Build locally, stage a new complete dist under a new /srv/elona/releases/ directory,
and verify the transfer before changing /srv/elona/current. Keep the previous
release for rollback; do not overwrite it in place. Keep index and original assets
together. no-cache permits revalidation of original, non-hashed artwork after an
update, and gzip compresses text responses. Directory browsing is disabled.

For content rollback, repoint current to the retained release. For a bad HTTPS
configuration, restore /srv/elona/staging/Caddyfile.http-active and reload Caddy.
The original package configuration is saved as
/srv/elona/staging/Caddyfile.before-elona. Do not restart unrelated services.
