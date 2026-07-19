# RAMROD Multi-Tenant Architecture

Stand: 2026-07-19

## Context hierarchy

1. One Supabase Auth identity per person.
2. One or more organization memberships per identity.
3. One active organization for every operator request.
4. Locations, boxes, seller profiles, items, jobs, and contracts belong to that organization.

The legacy `customers` table is the physical organization table for now. This
keeps all existing foreign keys and production data intact while the API exposes
the records as `organizations`.

## Organization types

- `internal`: CREATORS and the RAMROD-owned sales operation
- `customer`: Strongvision and future external clients
- `personal`: private inventory, separated from RAMROD branding and accounts
- `demo`: training and demonstration data, never mixed with production stock

## Access model

- `platform_admin`: cross-organization control center
- `owner`: billing, people, seller accounts, and all operations for one organization
- `admin`: organization configuration and operations
- `operator`: intake, review, listing preparation, and shipping
- `viewer`: read-only reporting

Supabase RLS enforces membership on the organization and all dependent records.
The Node control plane uses the service role, but resolves and validates the
active organization before every data read or write.

## Consignment model

An item can distinguish:

- inventory organization (`customer_id`)
- legal owner (`owner_organization_id`)
- operational processor (`operator_organization_id`)
- seller of record (`seller_profile_id`)
- commercial agreement (`consignment_contract_id`)

This supports Strongvision-owned stock processed by CREATORS and sold through
either a Strongvision or CREATORS seller account without duplicating the item.

## Public surfaces

- `ramrod.live`: public shop, restricted to `SHOP_ORGANIZATION_SLUG=creators`
- `app.ramrod.live`: operator and customer application
- `admin.ramrod.live`: CREATORS platform control center

## Deployment order

1. Apply `20260719120000_multi_tenant_foundation.sql`.
2. Promote at least one existing Auth user to `platform_admins`.
3. Set `RAMROD_PLATFORM_ADMIN_EMAILS` during the pilot if needed.
4. Deploy the updated control plane and static app together.
5. Confirm Strongvision contains the existing items.
6. Confirm CREATORS, Privat, and RAMROD Demo start empty.
7. Invite customer users only to their own organization.
