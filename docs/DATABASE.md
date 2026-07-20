# UniNest — Database Schema

PostgreSQL is the source of truth. Models live in [`server/app/models`](../server/app/models)
and the complete, generated DDL is in [`schema.sql`](schema.sql).

> Regenerate DDL any time with:
> ```bash
> cd server && python -c "from sqlalchemy.schema import CreateTable; from sqlalchemy.dialects import postgresql; from app.models import Base; [print(str(CreateTable(t).compile(dialect=postgresql.dialect())).strip()+';\n') for t in Base.metadata.sorted_tables]"
> ```
> In production, migrations are managed by Alembic (`alembic revision --autogenerate`, `alembic upgrade head`).

## Table Groups

### Identity & Trust (Module 6, 7, 11, 15)
| Table | Purpose |
|-------|---------|
| `users` | All accounts (student/host/admin/support), auth, loyalty, referral |
| `host_profiles` | Host company info, response metrics, quality score |
| `documents` | KYC / verification document uploads with review status |
| `referrals` | Referral tracking & rewards |
| `audit_logs` | Immutable trail of sensitive actions |

### Catalog (Module 1, 2, 3, 4, 12)
| Table | Purpose |
|-------|---------|
| `cities`, `universities` | Locations with lat/lng for maps & proximity |
| `properties` | Listings; denormalised `min_price`, `avg_rating`, `view_count` for fast search |
| `property_images` | Gallery + cover |
| `amenities`, `property_amenities` | Filterable amenities (WiFi, gym, CCTV, …) |
| `property_universities` | Precomputed distance & commute times per university |
| `nearby_pois` | Metro, grocery, hospital, restaurants with distance/walk time |
| `offers`, `policies`, `property_faqs` | Deals, cancellation/deposit/house rules, FAQs |
| `verifications` | Property verification + quality score |
| `rooms`, `room_availability`, `room_pricing` | Room types, per-date live inventory, duration tiers |

### Transactions (Module 5)
| Table | Purpose |
|-------|---------|
| `bookings` | Booking lifecycle, price breakdown, idempotency key |
| `payments` | Gateway intents & status |
| `invoices`, `refunds` | Billing artefacts and refund tracking |
| `coupons`, `coupon_redemptions` | Discounts and per-user redemption caps |
| `rental_agreements` | e-sign status for student & host |

### Engagement (Module 6, 8, 9, 10, 14)
| Table | Purpose |
|-------|---------|
| `wishlist_items`, `saved_searches`, `recently_viewed` | Personalisation |
| `conversations`, `messages`, `conversation_participants` | Chat with read receipts |
| `reviews`, `review_photos`, `review_replies` | Verified reviews with host replies |
| `notifications`, `push_subscriptions` | Multi-channel notification center |
| `support_tickets` | Helpdesk |
| `blog_posts`, `testimonials`, `faqs` | CMS content for the landing page |

### Future (Module 17, scaffolded)
`roommate_profiles`, `split_rents`, `marketplace_items`, `maintenance_requests`, `loyalty_transactions`.

## Key Design Choices

- **UUID string PKs** everywhere for shardability and safe client exposure.
- **Denormalised search columns** on `properties` (`min_price`, `avg_rating`, `view_count`) keep list/sort queries index-only fast (Module 16).
- **`room_availability` per date** gives true live inventory and enables row-level locking during booking to prevent overselling (Module 5).
- **`property_universities`** stores precomputed distances/commute minutes so proximity filters and "closest" sort avoid runtime geo math.
- **JSONB** for flexible payloads (`saved_searches.filters`, `notifications.data`, `roommate_profiles.lifestyle`).
- **Indexes** on every filter/sort/foreign-key column (see `index=True` in models).

## Recommended Additional Indexes (production)

```sql
-- Composite index for the common "city + price + rating" search
CREATE INDEX ix_prop_city_price_rating ON properties (city_id, min_price, avg_rating DESC)
    WHERE status = 'active';

-- Trigram index for fuzzy name/city search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX ix_prop_name_trgm ON properties USING gin (lower(name) gin_trgm_ops);

-- Geo proximity (if PostGIS is enabled)
-- CREATE EXTENSION postgis;  ALTER TABLE properties ADD COLUMN geom geography(Point,4326);
-- CREATE INDEX ix_prop_geom ON properties USING gist (geom);
```
