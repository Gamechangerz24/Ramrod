# RAMROD Supabase Setup

Stand: 2026-05-02

## Projekt

- Supabase URL: `https://gtncepdkoviqczetmurz.supabase.co`
- REST API Base: `https://gtncepdkoviqczetmurz.supabase.co/rest/v1/`
- Project ID: `gtncepdkoviqczetmurz`

Der Public/Anon Key gehoert in `.env.local` und in die spaeteren Railway Environment Variables. Der Service Role Key darf nur serverseitig verwendet werden und gehoert nie ins Frontend oder Git.

## Lokale Variablen

```bash
SUPABASE_URL=https://gtncepdkoviqczetmurz.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=ramrod-item-images
```

## Schema einspielen

In Supabase:

1. Project `RAMROD` oeffnen.
2. `SQL Editor` oeffnen.
3. Inhalt aus `supabase/migrations/20260502090000_initial_ramrod_schema.sql` einfuegen.
4. `Run` ausfuehren.

Die Migration legt an:

- `customers`
- `boxes`
- `items`
- `item_images`
- `price_checks`
- `channels`
- `campaigns`
- `campaign_items`
- `listings`
- `sales`
- `shipments`
- `audit_events`
- Storage Bucket `ramrod-item-images`

RLS ist aktiv. Die initialen Policies erlauben Zugriff fuer `authenticated`; serverseitige Jobs koennen spaeter den Service Role Key nutzen.

## Warum nicht direkt Anon Write?

Der Anon Key ist oeffentlich. Ohne Login duerfte sonst jeder, der die URL kennt, Artikel schreiben oder veraendern. Deshalb bauen wir fuer echte Persistenz entweder:

- Supabase Auth mit Login/Rollen, oder
- serverseitige API-Endpunkte mit Service Role Key.

Empfohlen fuer RAMROD: serverseitige API zuerst, danach Rollen/Login.
