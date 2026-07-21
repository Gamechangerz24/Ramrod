# RAMROD Agent Control Layer

RAMROD uses autonomous agents for research, preparation, monitoring, and repetitive sales work. Agents do not receive unrestricted browser access or blanket permission to publish, spend money, grant OAuth rights, solve identity checks, or change contractual account data.

## First Production Slice

The migration `20260722100000_agent_control_layer.sql` adds:

- durable agent missions and ordered steps
- explicit risk levels and approval checkpoints
- organization-scoped marketplace accounts
- approval requests with an audit trail
- publication attempts and connector events
- links from background jobs to their originating agent run and step

The first playbooks cover:

- onboarding a marketplace account
- publishing an approved item
- distributing inventory across channels
- creating a demand campaign
- reconciling a sale and removing parallel listings

Missions begin with their safe preparation steps. A human approval is created only when the preceding research and draft work is complete. The approved external step can then be leased by a capability-compatible runner.

## Durable Step Executor

The migration `20260722143000_agent_step_executor.sql` adds atomic step claiming, leases, heartbeats, retries, attempt limits, and stale-runner recovery.

- The VPS safe runner executes only allowlisted `ramrod` and `agent` preparation steps.
- A runner can never skip an unfinished predecessor.
- Approval-required steps can only be claimed with status `approved`.
- Each leased step belongs to exactly one registered worker until completion or lease expiry.
- Results, failures, attempts, and the responsible runner remain visible in Agent Control.
- Connector and browser actions require a separate executor with an explicit capability allowlist.

## Security Boundary

1. The agent token can read Agent Control, create a mission, and request an approval.
2. The agent token cannot approve or reject an action.
3. A signed-in RAMROD user or an allowed Telegram chat makes the decision.
4. Passwords, API keys, cookies, bank data, 2FA codes, and OAuth tokens never belong in agent payloads or Supabase business tables.
5. `organization_channel_accounts.secret_ref` contains only a reference to a dedicated vault.
6. CAPTCHA, KYC, payment confirmation, bank changes, and terms acceptance are always human handoffs.
7. API connectors are preferred. Browser automation is an isolated, replaceable adapter for platforms without a suitable API.

## Server Configuration

Add these values to the VPS environment, never to browser code or Git:

```text
RAMROD_AGENT_TOKEN=<long random service token>
RAMROD_TELEGRAM_BOT_TOKEN=<BotFather token>
RAMROD_TELEGRAM_WEBHOOK_SECRET=<long random webhook secret>
RAMROD_TELEGRAM_APPROVAL_CHAT_ID=<private chat or approval group id>
RAMROD_TELEGRAM_ALLOWED_CHAT_IDS=<comma-separated allowed chat ids>
```

Configure the Telegram webhook after deployment:

```bash
curl -X POST "https://api.telegram.org/bot<token>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://admin.ramrod.live/api/telegram/webhook",
    "secret_token": "<same webhook secret>",
    "allowed_updates": ["callback_query"]
  }'
```

Telegram sends the webhook secret in `X-Telegram-Bot-Api-Secret-Token`. RAMROD also verifies that the callback came from an explicitly allowed chat.

## Hermes MCP Adapter

The stdio adapter exposes:

- `ramrod_get_agent_control`
- `ramrod_create_mission`
- `ramrod_request_approval`
- `ramrod_claim_step`
- `ramrod_heartbeat_step`
- `ramrod_complete_step`
- `ramrod_fail_step`

Example Hermes MCP configuration:

```yaml
mcp_servers:
  ramrod:
    command: npm
    args:
      - run
      - mcp
      - --prefix
      - /absolute/path/to/Scanapp
    env:
      RAMROD_CONTROL_PLANE_URL: https://admin.ramrod.live
      RAMROD_AGENT_TOKEN: <agent-service-token>
      RAMROD_ORGANIZATION_ID: <organization-uuid>
      RAMROD_AGENT_WORKER_KEY: macmini-hermes
      RAMROD_AGENT_WORKER_NAME: Mac Mini Hermes Runner
      RAMROD_AGENT_EXECUTION_MODES: browser,api,connector
      RAMROD_AGENT_ACTION_TYPES: read,research,prepare
      RAMROD_AGENT_STEP_KEYS: inspect_requirements,prepare_account_data,verify_connector,prepare_listing,verify_listing,prepare_channel_drafts,monitor_distribution,measure_campaign,verify_order
      RAMROD_AGENT_LEASE_SECONDS: "900"
```

There is intentionally no MCP tool for approval, direct publication, credential export, or arbitrary browser execution. External writes remain excluded from the default Hermes allowlist. They can only be added deliberately after the matching connector is tested and the database approval gate remains authoritative.

## Runtime Shape

```text
Hermes / future specialist agents
              |
              | restricted MCP tools
              v
RAMROD Agent Control on VPS ---- Telegram approval
              |
              v
Supabase: missions, steps, approvals, evidence, audit
              |
              v
API connector or isolated browser worker
```

The VPS remains the always-on control plane. The Mac mini may run Hermes, local vision, research, and isolated browser workers, but no unique business state lives there.

## Current Delivery State

1. Agent Control and the step executor migrations are active.
2. The always-on VPS safe runner prepares inventory selection, channel plans, clusters, content drafts, and item validation.
3. The Agenten view shows runners, leases, attempts, progress, and approvals.
4. The isolated Mac Mini Hermes profile can claim browser, research, and preparation steps through four restricted MCP tools.

### Mac Mini Hermes Scheduler

The RAMROD Hermes profile runs independently from the existing CREATORS profile. The launch agent in `deploy/live.ramrod.hermes-cron.plist` invokes one scheduler tick every minute; the configured job claims at most one RAMROD step per run. Long browser research uses a bounded lease plus `ramrod_heartbeat_step` to prevent duplicate execution. `HERMES_MAX_ITERATIONS=15` provides a hard per-run tool-loop budget in addition to the prompt policy.

Install it for the signed-in `link` user:

```bash
mkdir -p "$HOME/Library/Logs/RAMROD"
cp deploy/live.ramrod.hermes-cron.plist "$HOME/Library/LaunchAgents/"
launchctl bootout "gui/$(id -u)/live.ramrod.hermes-cron" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/live.ramrod.hermes-cron.plist"
launchctl kickstart -k "gui/$(id -u)/live.ramrod.hermes-cron"
```

Do not install a second Hermes Telegram gateway with cloned credentials. RAMROD approvals use the control-plane Telegram webhook; the scheduler only runs the isolated cron profile.

## Next Delivery Phase

1. Configure the dedicated RAMROD Telegram approval bot and allowed chat IDs.
2. Build an eBay draft executor that consumes only the allowlisted connector step.
3. Store every external attempt and verify the returned listing URL and ID.
4. Add order webhooks, atomic inventory reservation, and cross-channel delisting.
5. Add content and browser adapters one channel at a time, each with a capability allowlist and kill switch.
