# VPS deployment

Updated2026-11-03. Domain:
[Elona Shooter Plus](https://pastalapizza.site/elona/).
The root URL redirects to /elona/; www redirects to the apex domain.
The [HTTP IP address](http://151.241.155.138/elona/) remains available.
Some recursive DNS paths still cache the previous host; see the boundary below.

## Current state

- Ubuntu24.04, distribution Caddy2.6.2 package, enabled systemd service.
- Release: /srv/elona/releases/39c0c50-Cn5tm2du/elona/.
- /srv/elona/current points to that release's parent directory.
- Active config: /etc/caddy/Caddyfile, from deploy/Caddyfile.https.
- Both domain certificates were issued successfully by Let's Encrypt. Caddy's
  enabled service manages renewal. HTTP redirects to HTTPS for the domain;
  www preserves the path while redirecting to the apex. Config validation passes.
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

## DNS and HTTPS verification

The authoritative DNS zone uses ns1.reg.ru / ns2.reg.ru. Both now return
151.241.155.138 for the apex and www. The user's screenshot confirms the matching
records. Google DNS also returns the new address. No further DNS edits are needed.

The initial default-network HTTPS check still reached the previous host and failed
with ERR_SSL_VERSION_OR_CIPHER_MISMATCH; HTTP showed OpenResty rather than Caddy.
A bounded VPS resolver-cache flush did not remove the upstream stale answer.
Do not treat that as a game/TLS configuration failure or repeatedly flush/reload.

A direct public-IP connection using the real domain names passes normal Chrome
certificate validation: TLS1.3, issuer YE1, subject pastalapizza.site, secure context.
New Game/fire, actual export, exact Continue, HTTPS iframe Continue, HTTP-to-HTTPS,
www-to-apex and root-to-/elona/ redirects all pass without script/request errors.
The parent embed HTML is a client-side fixture; game files come from the public
HTTPS server. This check maps both names to151.241.155.138 only inside the isolated
browser and bypasses its proxy; it does not disable TLS checks or alter system DNS.
It does not establish that every recursive DNS cache has refreshed.

Evidence: .build/deployment/https-verification.json; the default-DNS failure is
retained separately as https-default-dns-failure.json. Next continuation should
check the ordinary HTTPS URL once. When that path reaches Caddy, perform a focused
default-network browser confirmation; reuse the passing gameplay evidence. Do not
rebuild or reissue certificates while waiting for cached DNS. Caddy documents
renewal in its [automatic HTTPS guide](https://caddyserver.com/docs/automatic-https).

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
