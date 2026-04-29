# Marketplace Analysis

Stand: 2026-04-29

## Executive Summary

RAMROD should not try to automate every marketplace equally. The scalable model is a central master inventory plus a small set of high-quality connectors.

Recommended first stack:

1. eBay direct API for searchable collectibles, retro games, toys and higher-value one-off items.
2. Shopify or WooCommerce as owned shop and inventory hub, depending on Strongvision's website stack.
3. Whatnot via Shopify sync where possible, plus show scripts and batch planning inside RAMROD.
4. Kaufland, Amazon and Hood only for suitable EAN/sealed/catalog goods.
5. Specialist channels only when category volume justifies them: BrickLink for LEGO, Cardmarket for TCG, Discogs for music media, Reverb for instruments/music gear.
6. Browser-assisted workflows only for channels without stable APIs, and only as human-reviewed drafts.

## Capability Matrix

| Platform | Fit for Strongvision inventory | Automation path | Sale sync | Delist sync | Priority |
| --- | --- | --- | --- | --- | --- |
| eBay | Very high | Public Sell APIs for inventory, offers, orders and fulfillment | API polling/webhooks pattern | API quantity/update/end listing | 1 |
| Shopify | High as hub/owned shop | Admin API, products, inventory, orders, webhooks | Webhooks | API inventory/product status | 1 |
| Whatnot | High for live-friendly collectibles | Seller API exists but access is restricted; Shopify integration is currently the best practical path | Shopify sync or Seller API if access is granted | Shopify sync or API | 1 |
| Strongvision website | High for client transparency | Depends on stack: Shopify, WooCommerce, custom CMS | Depends on stack | Depends on stack | 1 |
| WooCommerce | High if Strongvision runs WordPress/Woo | REST API and webhooks | Webhooks | API product stock/status | 2 |
| Kaufland | Medium | Seller API 2.0 and CSV feeds | API orders | API inventory units | 2 |
| Hood.de | Medium | API for Platinum shops and partner/CSV imports | API/partner | API/partner | 2 |
| Amazon | Medium-low for used loose collectibles, high for catalog/EAN goods | SP-API listings, feeds, orders | API | API | 3 |
| Etsy | Medium for vintage/collectible items, policy-sensitive | Open API draft listings and images | API/orders possible | API listing state | 3 |
| BrickLink | High for LEGO only | Store API for inventory, orders, price guide | API/push notifications | API inventory | 3 |
| Cardmarket | High for TCG only | API exists, but currently not accepting new access applications | API for existing approved users | API stock | 3 |
| Discogs | High for vinyl/CD/music media only | API and CSV-style inventory workflows | API/CSV/manual | API/CSV/manual | 4 |
| Reverb | High for instruments/audio gear only | API for listings and orders | API polling | API listing updates | 4 |
| Kleinanzeigen | Good for bulky/local bundles | No reliable public API found; browser/manual assist only | Manual | Manual | 4 |
| Facebook Marketplace | Good reach, bad automation fit | No recommended public listing API route; avoid botting | Manual | Manual | 5 |
| Vinted | Low-medium, mostly fashion | Avoid private API/bot workflows; browser text assistant only | Manual | Manual | 5 |
| Catawiki | Medium for curated rare items | Manual/curated seller workflow | Manual | Manual | 5 |
| Momox/reBuy-style buyback | Good liquidation floor for media | Barcode quote workflow, likely semi-manual | Not a listing channel | Not needed | 5 |

## Recommended Implementation Order

### Phase 1: eBay + owned inventory

Build a stable listing pipeline around eBay first:

- `createDraftListing`
- `publishListing`
- `updateInventory`
- `fetchOrders`
- `markShipped`
- `delistOrSetUnavailable`

Keep RAMROD's SKU as the master key. Every external listing keeps `platform`, `externalListingId`, `externalOrderId`, `status`, `lastSyncedAt`.

### Phase 2: Shopify/Strongvision hub

If Strongvision's site is Shopify, use it as the cleanest shared source of truth. If it is WooCommerce, build Woo instead. If it is custom, expose a small Strongvision API endpoint later.

Shopify is strategically important because Whatnot now has a direct Shopify integration. That can reduce Whatnot work from custom API access to product/order sync through Shopify.

### Phase 3: Whatnot selling desk

Do not start with full Whatnot automation. Start with:

- show batch generator
- run order
- start prices
- seller script
- per-item talking points
- export/sync through Shopify where possible

If Whatnot Seller API access becomes available, then add direct GraphQL integration.

### Phase 4: Category-specific connectors

Add only where inventory volume supports it:

- BrickLink for LEGO sets/parts/minifigures.
- Cardmarket for TCG singles/sealed product, if API access is available.
- Discogs for records/CDs.
- Reverb for music instruments/audio gear.
- Kaufland/Hood/Amazon for sealed catalog goods with EAN/ISBN/ASIN-like identifiers.

## Browser Automation Rule

Browser automation should be a productivity layer, not the main integration strategy.

Allowed/useful:

- open a prepared listing form
- pre-fill non-sensitive listing fields when platform rules allow it
- generate copy, category suggestions and image order
- pause before final publish for human review

Avoid:

- stealth posting bots
- private/internal APIs
- scraping behind login
- auto-reposting to manipulate marketplace ranking
- high-volume actions that risk account flags

Browser automation is economically sensible only when:

- item value is high enough,
- platform has no API,
- volume is low,
- a human is already reviewing the listing,
- account risk is acceptable and documented.

## Channel Routing Rules

Use these first routing heuristics:

- `eBay`: clear identifiable item, searchable demand, value above 10 EUR.
- `Whatnot`: pop culture/live-friendly, bundleable, story helps conversion.
- `Shopify/Strongvision`: good SEO inventory, own-margin, slower liquidation.
- `Kaufland/Amazon/Hood`: sealed/catalog goods with barcode/EAN and standardized condition.
- `BrickLink`: LEGO only.
- `Cardmarket`: TCG only.
- `Discogs`: music media only.
- `Kleinanzeigen`: bulky, local pickup, mixed boxes, console bundles.
- `Liquidation`: below labor threshold, damaged, unknown, or too cheap to list.

## Sources Checked

- eBay Inventory API: https://developer.ebay.com/api-docs/sell/inventory/overview.html
- eBay Fulfillment API: https://developer.ebay.com/api-docs/sell/fulfillment/overview.html
- Shopify Admin API: https://shopify.dev/docs/api/admin-graphql
- Whatnot Seller API: https://developers.whatnot.com/docs/getting-started/introduction
- Whatnot Shopify integration: https://help.whatnot.com/hc/en-us/articles/44650692889997-Shopify-x-Whatnot-Integration
- Whatnot Shopify app: https://apps.shopify.com/whatnot
- Kaufland Seller API 2.0: https://sellerapi.kaufland.com/
- Amazon SP-API Listings Items: https://developer-docs.amazon.com/sp-api/reference/listings-items-v2021-08-01
- Etsy Open API: https://developers.etsy.com/documentation/reference/
- BrickLink Store API: https://www.bricklink.com/v2/api/welcome.page
- Cardmarket API status: https://help.cardmarket.com/es/cardmarket-api
- Cardmarket API 2.0: https://api.cardmarket.com/ws/documentation
- WooCommerce webhooks: https://woocommerce.com/document/webhooks/
