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

An approved mission is marked `ready`. The browser/API executor that performs the approved step is the next delivery phase. It must write evidence and external IDs back into `publication_runs`, `listings`, and `connector_events`.

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

The stdio adapter exposes only:

- `ramrod_get_agent_control`
- `ramrod_create_mission`
- `ramrod_request_approval`

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
```

There is intentionally no MCP tool for approval, direct publication, credential export, or arbitrary browser execution.

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

## Next Delivery Phase

1. Apply the migration and verify the Agenten view.
2. Configure Telegram and the Hermes MCP adapter.
3. Build an eBay executor that consumes only approved `ready` runs.
4. Store every external attempt and verify the returned listing URL and ID.
5. Add order webhooks, atomic inventory reservation, and cross-channel delisting.
6. Add content and browser adapters one channel at a time, each with a capability allowlist and kill switch.
