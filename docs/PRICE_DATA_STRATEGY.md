# Price Data Strategy

Stand: 2026-04-29

## Goal

RAMROD should build price confidence from several signals instead of trusting one model guess.

Target flow:

1. Vision model identifies the item and generates search candidates.
2. Price workers collect comparable listings and sold-price signals.
3. A scoring layer removes weak matches.
4. The app stores evidence with each price estimate.
5. Human review is required when confidence, variance or item identity is weak.

## Best Sources

| Source | Use | Access | Notes |
| --- | --- | --- | --- |
| eBay Browse API | Active comparable listings | Official API after developer access | Good first live signal, supports keyword/GTIN/category/image-style search patterns depending endpoint. |
| eBay Marketplace Insights API | Sold items up to 90 days | Limited-release official API | Best source for sold comps if we get approved. |
| eBay Seller Hub/Terapeak | Manual validation | Browser assist only | Useful for humans; do not build fragile stealth scraping around it. |
| SerpApi eBay Search API | Fallback active listings | Paid third-party API | Fast JSON fallback when official access is missing or rate-limited. |
| Apify eBay actors | Fallback scraping jobs | Paid third-party actors | Useful for batch research; actor quality varies, test before relying on it. |
| Oxylabs/Bright Data | Large-scale scraping infrastructure | Paid enterprise APIs/proxies | Only worth it at volume; stronger compliance and ops burden. |
| PriceCharting | Games/consoles/cards | API/feed/manual depending plan | Valuable for retro games and TCG, but not enough for loose collectibles alone. |
| BrickLink Price Guide | LEGO | Official BrickLink API | Best LEGO-specific price signal. |
| Cardmarket | TCG | API only if access exists | Good for cards, but new API access may be restricted. |
| Discogs | Vinyl/CDs | API/marketplace data | Use for music media only. |

## MacMini Worker

The MacMini can be our local always-on worker, but it should not be the public source of truth.

Recommended jobs:

- nightly price refresh for scanned items
- image normalization and OCR
- local duplicate detection
- queue processing for API calls
- browser-assisted manual research sessions
- local LLM classification and extraction when privacy/cost matters

Recommended local model:

- Start with a small local text model through Ollama or LM Studio for cleanup, title normalization and matching.
- Do not use local vision as the main identifier yet unless we benchmark it against OpenAI on real Strongvision photos.
- Keep OpenAI or another strong vision model for item identification until local vision quality is proven.

## Browser Automation Policy

Use Browser Use for:

- opening evidence links,
- helping a human compare listings,
- copying public listing attributes into RAMROD,
- filling draft forms that require review before publishing.

Do not use Browser Use for:

- bypassing marketplace protections,
- scraping logged-in pages at high volume,
- auto-posting final listings without human or API approval,
- collecting personal buyer/seller data.

## Price Confidence Formula

First version:

- `identityScore`: how sure we are that the item is correctly identified.
- `conditionScore`: whether visible state matches comparables.
- `compCount`: number of usable comparable listings.
- `soldWeight`: sold comps count more than active listings.
- `variancePenalty`: wide price spread lowers confidence.
- `categoryReliability`: games/LEGO/TCG higher, loose figures lower.

Output:

- `low`: quick-sale/liquidation price
- `fair`: likely fixed-price/listing price
- `aggressive`: upper anchor for rare or live-show hype
- `confidence`: evidence quality, not model certainty alone

## Implementation Order

1. Build `priceResearchQueue` table/object in RAMROD.
2. Add eBay Browse adapter for active comps once developer access arrives.
3. Add SerpApi or Apify fallback for early testing before eBay approval.
4. Add evidence cards in the app: source, title, price, sold/active, age, match score.
5. Add MacMini worker that processes queued research jobs overnight.
6. Add category-specific adapters only after we see enough inventory volume.

## Current Prototype

The local app can already generate:

- a local price evidence card from RAMROD's existing research hints,
- a safe eBay draft payload for the selected item,
- Inventory API shaped data,
- Offer API shaped data,
- warnings for missing category, policies and media upload.

This does not publish anything and does not transmit item data to eBay.

Set `EBAY_PRICE_PROVIDER=ebay-browse` only when a real eBay price-check test is intended. In that mode RAMROD sends the generated search query to the configured eBay environment and reads active listing summaries through the Browse API.

Optional web research can be enabled with `SERPAPI_API_KEY`. RAMROD then adds SerpApi eBay search evidence to the same price calculation:

- `show_only=Sold` for sold/completed eBay web results when available,
- standard eBay web search as secondary active-listing evidence,
- `ebay_domain=ebay.de` for German marketplace context.

When both official eBay Browse and SerpApi evidence are available, the price check method becomes `multi-source`. The UI shows active eBay hits, web hits, sold hits, outliers, and the formula used for the applied price.

Sandbox limitation: eBay Sandbox can verify the OAuth/client-credentials and Browse API plumbing, but it should not be treated as a real price dataset. In our first AI-import test, Sandbox Browse was reachable but returned no usable active listing results, so RAMROD correctly fell back to local evidence. Real price validation needs Production Browse API access or a third-party search provider.

## What We Need For Real Price Tests

Minimum useful test:

- eBay Sandbox client ID and client secret,
- eBay Browse API app access token flow,
- 5-10 real scanned items with known expected identities,
- permission to send item title/category/franchise to eBay for comparable search.

Better test:

- access to eBay Marketplace Insights or Terapeak-style sold data,
- SerpApi key as temporary fallback,
- PriceCharting key/feed for retro games,
- BrickLink credentials for LEGO-specific checks.

Without those keys, RAMROD can still test the full UI and draft flow using local evidence only.

## Sources Checked

- eBay Browse API search: https://developer.ebay.com/api-docs/buy/browse/resources/item_summary/methods/search
- eBay Browse API resources: https://developer.ebay.com/api-docs/buy/browse/resources/methods
- eBay Marketplace Insights API overview: https://www.edp.ebay.com/api-docs/buy/marketplace-insights/static/overview.html
- Whatnot Seller API: https://developers.whatnot.com/docs/getting-started/introduction
- Whatnot Shopify integration: https://help.whatnot.com/hc/en-us/articles/44650692889997-Shopify-x-Whatnot-Integration
- PriceCharting API documentation: https://www.pricecharting.com/api-documentation
- BrickLink API: https://www.bricklink.com/v2/api/welcome.page
- SerpApi eBay Search API: https://serpapi.com/ebay-search-api
- Apify eBay actors: https://apify.com/store?search=ebay
