# eBay Integration Checklist

## Accounts

Use two environments:

- Sandbox: fake seller and buyer accounts for test listings and mock purchases.
- Production: the real seller account after OAuth consent.

The production seller can be Michaela/CREATORS or Strongvision, depending on who should legally sell and receive payouts.

## Required eBay Setup

1. eBay Developer Program account
2. Application keys for Sandbox and Production
3. Sandbox seller test user
4. Sandbox buyer test user if end-to-end purchase tests are needed
5. OAuth authorization code flow for the seller account
6. Business Policies enabled for the seller
7. At least one payment policy
8. At least one fulfillment/shipping policy
9. At least one return policy
10. At least one inventory location

## Required Environment Variables

```text
EBAY_ENV=sandbox
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
EBAY_REDIRECT_URI=
EBAY_OAUTH_USER_TOKEN=
EBAY_AUTH_N_AUTH_TOKEN=
EBAY_MARKETPLACE_ID=EBAY_DE
EBAY_PAYMENT_POLICY_ID=
EBAY_FULFILLMENT_POLICY_ID=
EBAY_RETURN_POLICY_ID=
EBAY_MERCHANT_LOCATION_KEY=creators-warehouse-01
```

## Token Types

eBay exposes two token families that are easy to confuse:

- OAuth access tokens: required for the modern REST/Sell APIs RAMROD should use for Inventory, Offers, Fulfillment and Orders.
- Auth'n'Auth user tokens: legacy tokens for traditional APIs such as Trading API.

The developer portal's "User Tokens" page can produce Auth'n'Auth tokens. They are useful for legacy Trading API tests, but they are not the primary path for RAMROD's planned connector.

Use:

```bash
npm run ebay:token
```

to classify the locally configured token without sending it to eBay.

For the Sell API connector, generate an OAuth User Access Token in Sandbox with at least the scopes needed by Inventory and Fulfillment calls.

## API Flow

For each approved item:

1. Create or replace inventory item by SKU.
2. Upload or reference images.
3. Resolve category ID with Taxonomy API.
4. Create offer with marketplace, price, category, quantity, policies, and location.
5. Keep offer as draft until human approval.
6. Publish offer only after explicit approval.
7. Poll or subscribe to orders.
8. When sold, lock master item and delist other active listings.

## Safety Guardrails

- Never auto-publish high-value or low-confidence items.
- First implementation must create drafts/payloads only.
- Production publish requires a separate explicit switch.
- Store OAuth tokens outside git.
- Keep SKU as the cross-platform identity.
