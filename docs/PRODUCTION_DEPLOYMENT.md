# RAMROD Production Deployment

RAMROD is deployed as an installable PWA. The VPS is the public control plane; Supabase remains the source of truth. The Mac mini is optional and never required for normal operation.

## Target

- Shop: `https://ramrod.live`
- Operator-Konsole: `https://admin.ramrod.live`
- Übergangs- und Notfallpfad: `https://ramrod.live/admin`
- HTTPS and reverse proxy: the VPS host nginx with Certbot
- Runtime: Node.js container
- Database, authentication, and storage: Supabase
- Vision and first strategy pass: local Qwen through the optional Mac mini worker
- Cloud escalation for difficult or high-value items: OpenAI when billing is available
- Market research: eBay and SerpApi

## One-time setup

1. Point DNS `A @` and `A admin` to `217.154.160.215`, add `CNAME www -> ramrod.live`, and do not publish an `AAAA` record until IPv6 is configured on the VPS.
2. Copy the repository to `/opt/ramrod` on the VPS.
3. Copy `deploy/.env.production.example` to `deploy/.env.production` on the VPS and fill every required secret.
4. Create the first operator in Supabase Authentication and set `app_metadata.ramrod_role` to `operator` or `admin`. `AUTH_ALLOWED_EMAILS` remains the bootstrap fallback.
5. Start the app with `docker compose -f compose.prod.yaml up -d --build`.
6. Install `deploy/nginx-ramrod.live.conf` as `/etc/nginx/sites-available/ramrod.live`, enable it, test nginx, and reload nginx.
7. Issue the certificate with `certbot --nginx -d ramrod.live -d www.ramrod.live -d admin.ramrod.live --redirect`.
8. Verify `https://ramrod.live/api/health`, open the shop, then log in at `https://admin.ramrod.live` and install the operator PWA from the browser or iOS Share menu.

## Security rules

- `AUTH_REQUIRED=true` is mandatory on the public VPS.
- Keep `SHOP_HOST_ROUTING=true` once `admin.ramrod.live` resolves and has a valid certificate. Then `ramrod.live` serves the shop and `admin.ramrod.live` serves the operator console; `/admin` remains the emergency path.
- Production access is granted through `app_metadata.ramrod_role` (`operator` or `admin`); the email allowlist remains a fallback for initial setup.
- The Supabase service-role key exists only in the VPS environment and optional trusted workers.
- Never commit `deploy/.env.production`.
- Host nginx exposes ports 80 and 443. The container port is bound only to `127.0.0.1:3001`.
- Use the initial email allowlist until organization and role management is implemented.
- `RAMROD_WORKER_TOKEN` is a separate random secret shared only by the VPS and
  trusted workers. It authorizes the three worker-only control-plane actions and
  is not a user login token.

## Updates

```bash
git pull
docker compose -f compose.prod.yaml up -d --build
docker compose -f compose.prod.yaml ps
```

## Rollback

Deploy immutable Git tags once the first production version is live. Until then, keep the previous container image before rebuilding and test `/api/health` after every update.
