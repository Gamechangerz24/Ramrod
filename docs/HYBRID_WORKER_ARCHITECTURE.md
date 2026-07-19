# RAMROD Hybrid Worker Architecture

RAMROD separates the public sales control plane from optional edge workers. A worker can disappear without losing inventory, orders, or queued work.

## Production Decision

The core platform must run without the Mac mini. For the first reliable production version, use:

- a small VPS for the public web app, API, OAuth callbacks, marketplace webhooks, and scheduled jobs
- Supabase for inventory, authentication, storage, job state, and the audit trail
- cloud APIs for image understanding and difficult product identification
- the Mac mini only as an optional worker for cheap batch work, OCR, local models, browser-assisted research, and access to local hardware

Using only the VPS is a valid and simpler first deployment. Using only the Mac mini is not recommended for production because office internet, maintenance, reboots, NAT, and the existing CREATORS workload would all become availability risks. The Mac mini must never be on the critical path for scanning, approval, publishing, order sync, shipping, or the interactive sales-strategy response.

Production therefore uses `RAMROD_IMAGE_ANALYSIS_MODE=openai` for the interactive path. The Mac mini handles background enrichment, batch audits, embeddings, re-checks, and experiments where latency does not block an operator.

## Runtime Split

```text
Operator App
    |
    v
VPS Control Plane ---- eBay / shops / webhooks
    |
    v
Supabase: inventory, jobs, results, audit trail
    ^
    |
Mac mini Worker ---- OCR / local AI / browser research
```

## Source Of Truth

Supabase remains the source of truth for:

- master inventory and item state
- price evidence and calculated prices
- channel listings and external IDs
- sales, reservations, and shipping tasks
- durable automation jobs and worker health

The Mac mini stores no unique business state. It claims jobs, writes results, and can be replaced at any time.

## Queue Guarantees

The migration `20260716103000_worker_job_queue.sql` adds:

- atomic job claiming with `FOR UPDATE SKIP LOCKED`
- capabilities per worker
- priorities and delayed execution
- bounded retries with exponential worker backoff
- renewable leases for long-running jobs
- automatic recovery of abandoned jobs
- idempotency keys to prevent duplicate work

Supported first-step jobs:

- `health_check`
- `price_check`
- `ebay_draft`
- `recognize_image`
- `analyze_image`

The Mac mini defaults to the first three. Image analysis should be enabled only after the controlled load test.
Image jobs store only an HTTPS Storage URL in the queue. Base64 image data is downloaded temporarily by the worker and omitted from the persisted result.

The local vision path uses two models through Ollama. `qwen3-vl:2b-instruct`
performs the immediate identity and OCR pass; `qwen3-vl:8b-instruct` performs
the slower strategy pass when cloud analysis is unavailable. On the 24 GB Apple
M4 Mac mini the worker concurrency stays at `1`; RAMROD does not load
the installed 22 GB or 31 GB chat models alongside it. Ollama stays on
`127.0.0.1:11434`. The worker, not the VPS, calls Ollama, so no model endpoint is
exposed to the public internet or the office network.

## Recognition And Release Gates

RAMROD does not interpret "nearly 100 percent" as one model claiming high
confidence. It reaches high operational precision by refusing automatic release
until independent evidence agrees.

1. The browser measures brightness, contrast, and sharpness before upload.
2. The fast recognizer extracts identity, OCR, identifiers, and required image rotation.
3. The browser applies 90-degree corrections to the actual image used downstream.
4. Missing platform, model, edition, region, label, or contents trigger a targeted photo request.
5. Barcode/catalog data and live market sources must match the identity candidate.
6. Price, repair economics, channel, and sales format are calculated only after identification.
7. Publishing remains blocked until mandatory evidence and marketplace fields are present.

Measured on the Apple M4 Mac mini with a 1280 px smartphone image, the warm
local recognizer takes about 4-9 seconds of model time. Cloud recognition is the
preferred low-latency path. Local Qwen remains the privacy/offline fallback, and
the larger strategy or web-research jobs continue in the background.

Local vision produces identification, OCR, condition observations, search
queries, and a preliminary sales strategy. It does not provide current market
prices. The separate `price_check` job remains responsible for eBay, SerpApi,
and category-specific evidence.

## Automatic Price Flow

1. The operator saves a live scan or batch-imported item.
2. The control plane creates one idempotent `price_check` job without image data.
3. The UI shows whether the job is waiting, running, complete, or failed.
4. An available worker on the VPS or Mac mini combines eBay Browse, SerpApi sold results, and local evidence.
5. The worker writes low, fair, and aggressive prices back to the item.
6. The evidence is stored once in `price_checks`, linked by `source_job_id`.
7. Reloading the app restores the latest job, evidence, and calculated price.

Manual price checks remain available as an operator-controlled retry path.

## Mac Mini Guardrails

The July 2026 audit found sufficient CPU and disk capacity, but limited RAM headroom under the current desktop workload.

- worker concurrency stays at `1`
- do not run ComfyUI and a local LLM batch at the same time
- prefer 3B to 7B quantized local models
- use cloud vision for difficult identification and high-value items
- stop or delay local work when memory pressure rises or swap grows continuously
- keep the worker behind Tailscale; do not expose it publicly

## Control API

The app server exposes:

- `POST /api/jobs` to enqueue a job
- `GET /api/jobs` to inspect queue state
- `GET /api/workers` to inspect worker health

Example health job:

```bash
curl -X POST http://127.0.0.1:3001/api/jobs \
  -H 'Content-Type: application/json' \
  -d '{"jobType":"health_check","idempotencyKey":"health-check-001"}'
```

## Deployment Order

1. Apply the worker queue migration to Supabase.
2. Deploy the control plane on the VPS.
3. Configure the Mac mini worker with the Supabase service-role key.
4. Start one `health_check` job and verify the full round trip.
5. Run a 100-item price and image test while CREATORS is in normal use.
6. Enable additional job capabilities only after the load test passes.

Never place `SUPABASE_SERVICE_ROLE_KEY` in browser code, Git, screenshots, or public logs.
