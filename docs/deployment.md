# VPS deployment

Updated2026-11-03. Public HTTP build:
[Elona Shooter Plus](http://151.241.155.138/elona/).
The root URL redirects to /elona/. Only the game is served.

## Current state

- Ubuntu24.04, distribution Caddy2.6.2 package, enabled systemd service.
- Release: /srv/elona/releases/39c0c50-Cn5tm2du/elona/.
- /srv/elona/current points to that release's parent directory.
- Active config: /etc/caddy/Caddyfile, from deploy/Caddyfile.http.
- Prepared TLS config: /srv/elona/staging/Caddyfile.https, from
  deploy/Caddyfile.https. Both configurations pass Caddy validation.
- Browser saves stay on each visitor's device. No account/gameplay backend exists.
  Export/import a backup to move a run between localhost, IP and domain origins.
- The archive was checked by SHA-256 before extraction. Its build is unchanged
  from the verified local Cn5tm2du bundle; no gameplay changes were needed.
- SSH credentials are not stored in this repository or deployment files.

An isolated muted Chrome156.0.8078.80 check passed actual New Game, shooting5→4,
loot/boss loot/skill selection/results/town, delivered JSON export and exact full
battle/town Continue. There were no script errors, failed requests or HTTP errors.
The script response uses gzip and the proper JavaScript MIME type. First load in
this single public-network observation was3649ms; this is not a loading-speed SLA.
Evidence: ignored .build/deployment/public-verification.json and screenshots.
The user's existing browser profile/adventure/collection were not used or changed.

## Connect the domain

The authoritative DNS zone uses ns1.reg.ru / ns2.reg.ru. On inspection, the apex
A record still pointed to95.163.244.138; no apex AAAA record was returned.
The user has been asked to change the @ A record to151.241.155.138.
No registrar access is available in this session.

While waiting, check that DNS answer once per continuation; do not repeat the
game build, server inspection or successful HTTP browser phase. When the apex
resolves to this VPS, validate and activate the prepared config:

```sh
caddy validate --config /srv/elona/staging/Caddyfile.https --adapter caddyfile
cp -p /etc/caddy/Caddyfile /srv/elona/staging/Caddyfile.http-active
install -m 644 /srv/elona/staging/Caddyfile.https /etc/caddy/Caddyfile
systemctl reload caddy
```

Then verify a publicly trusted certificate, HTTP-to-HTTPS redirect and actual
New Game/save/Continue at https://pastalapizza.site/elona/. Do not bypass browser
certificate checks. If issuance fails, inspect the exact Caddy error and DNS/ports;
do not repeatedly reload or request certificates. The HTTP IP site remains in the
TLS configuration. Caddy documents the DNS, port and automatic-renewal behavior
in its [automatic HTTPS guide](https://caddyserver.com/docs/automatic-https).

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
