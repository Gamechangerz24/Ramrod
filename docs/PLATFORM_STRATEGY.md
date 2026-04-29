# Platform Strategy

The app should treat every scanned item as a master inventory record first. Platform listings are derived records.

## Core Rule

One physical item has one `item.sku`. Every external portal gets its own `listing.id`.

When a listing sells anywhere:

1. Mark the master item as `reserved`.
2. Stop new listing attempts.
3. Delist all other active listings.
4. Create a shipping task.
5. Sync the state back to the client system, including Strongvision.

## Recommended Rollout

### Phase 1: eBay + Strongvision Mirror

eBay is the first real listing connector because it has strong marketplace fit and the best API path. Strongvision gets a mirror of every scanned item for transparency.

Use eBay for:

- Retro games
- Action figures
- Collectibles with searchable demand
- Higher-value items
- Items with condition details that need fixed-price listing text

### Phase 2: Whatnot Show Batching

Whatnot should start as a semi-automatic export. The app should create show runs, seller scripts, start prices, and SKU order. Actual publication can be manual until API access is confirmed.

Use Whatnot for:

- Low to mid value items
- Bundles
- Live-friendly pop culture items
- Items where storytelling matters more than SEO

### Phase 3: Owned Shop

Add CREATORS or Strongvision shop sync once the shop stack is known. Shopify, WooCommerce, custom CMS, and headless commerce need different connectors, but the internal item model stays the same.

### Phase 4: Specialized Channels

Add channels only when inventory volume justifies them:

- Cardmarket for TCG
- Discogs for music media
- Kleinanzeigen for bulky/local/bundle inventory
- Liquidation buyers for low-value bulk

## Auto-Listing Guardrails

Auto-list only when:

- AI confidence is at least 85
- Fair value is below 40 EUR
- Item is not marked `Pruefen`
- Required photos exist
- Condition wording is explicit
- No high-risk flags are present

Everything else should become a draft requiring human approval.

## Sale Reconciliation

Each connector needs two capabilities:

- `publishDraft`: create or update a listing draft
- `syncOrders`: detect sold/reserved/cancelled states

The system should poll where webhooks are not available. A sold item triggers central inventory locking before any delisting calls.
