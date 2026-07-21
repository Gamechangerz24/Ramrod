# CREATORS Scanapp

AI-assisted, multi-tenant inventory intake and sales orchestration for CREATORS,
Strongvision, private inventories, and future customer organizations.

## Current Prototype

- Static local web app
- Drive image import
- EXIF/orientation normalization
- OpenAI image analysis
- AI article export
- Channel router and listing plan
- eBay/Whatnot/Strongvision connector strategy docs
- Supabase-backed durable automation queue
- Replaceable VPS and Mac mini workers with leases and retries
- Organization switcher with isolated inventories
- CREATORS platform-admin overview
- Separate public RAMROD shop organization
- Agent missions with explicit risk and human approval checkpoints
- Restricted Hermes MCP adapter and optional Telegram approvals

## Local Run

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:3001
```

For another device on the same Wi-Fi, use the Mac hostname:

```text
http://MacBook-Pro-von-MICHAEL.local:3001
```

If that does not resolve on iPhone, use the Mac's local network IP:

```text
http://172.16.100.14:3001
```

The local server exposes `/api/recognize-image` for fast, conservative identity
and OCR extraction and `/api/analyze-image` for the richer sales strategy.
Live scan uploads are resized in the browser, checked for image quality, and
automatically rotated when the recognizer detects a sideways product.

## Hybrid Worker

The first production architecture keeps the public control plane on the VPS and runs optional local jobs on the CREATORS Mac mini. Supabase stores the queue and all results.

Apply `supabase/migrations/20260716103000_worker_job_queue.sql` and
`supabase/migrations/20260717164500_price_check_job_link.sql`, then start a worker with:

```bash
npm run worker
```

With the app server running, verify the complete queue round trip using:

```bash
npm run worker:smoke
```

New `live_openai` and `batch_openai` items automatically receive one idempotent
`price_check` job. The app shows queued, running, succeeded, and failed states;
successful worker results replace the initial estimate and remain linked through
`price_checks.source_job_id`.

See `docs/HYBRID_WORKER_ARCHITECTURE.md` for deployment order and Mac mini guardrails.

## Customer Organizations

Apply `supabase/migrations/20260719120000_multi_tenant_foundation.sql` after the
initial schema and worker migrations. It adds memberships, platform admins,
locations, seller profiles, consignment contracts, organization-scoped SKUs,
and tenant-aware RLS policies.

One login can belong to several organizations. The active organization is sent
with every API request and controls inventory reads, item writes, jobs, and
seller context. The public shop reads only `SHOP_ORGANIZATION_SLUG` (default:
`creators`) so customer and private stock cannot leak into the RAMROD storefront.

Set platform admins either through Supabase app metadata (`ramrod_role=admin`),
the `platform_admins` table, or during the pilot through
`RAMROD_PLATFORM_ADMIN_EMAILS`.

## Agent Control

Apply `supabase/migrations/20260722100000_agent_control_layer.sql` after the
multi-tenant migration. It adds durable missions, ordered steps, marketplace
account references, approval requests, publication attempts, and connector
events. The Agenten area then becomes available in RAMROD.

Hermes can use `npm run mcp` to read the control state, create missions, and
request approval. It cannot approve its own actions. Telegram and the signed-in
RAMROD interface are separate human control channels. See
`docs/AGENT_CONTROL_LAYER.md` for the threat boundary and configuration.

## Sensitive Data

Do not commit:

- `.env.local`
- imported client photos
- Drive folder HTML
- OpenAI analysis output for real client inventory
- generated channel plans containing client item data

## Mobile Direction

The current app can be tested on iPhone in Safari as a mobile web app. Expo Go is the next step when we need native capabilities:

- camera capture
- barcode scanning
- offline scan queue
- haptics
- better photo handling
- device-level upload retries

Recommended rollout:

1. Keep web app for backoffice and orchestration.
2. Add Expo scanner app for intake workers.
3. Share the same backend API, SKU model, and image pipeline.
