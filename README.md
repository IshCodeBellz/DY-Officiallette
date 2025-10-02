<div align="center">

# DYOFFICIAL

Modern fashion e‑commerce demo (Next.js 14 + Tailwind). Production‑style architecture: storefront, admin, checkout → payment simulation, analytics, and trending discovery.

<p>
<a href="#"><img alt="Build" src="https://img.shields.io/badge/build-passing-brightgreen" /></a>
<a href="#"><img alt="Coverage" src="https://img.shields.io/badge/coverage-~%20tests-green" /></a>
<a href="./ARCHITECTURE.md"><img alt="Docs" src="https://img.shields.io/badge/docs-architecture-blue" /></a>
</p>

</div>

## ✨ Highlights

- Next.js App Router (RSC) + Tailwind UI
- 210 seeded products / 20 brands / size variants
- Search relevance + time‑decay trending algorithm
- Wishlist + cart (local → server sync) & discount engine
- Admin suite (products, orders, categories, discounts, inventory overview)
- Simulated Stripe-ready checkout (idempotent + webhook finalization)

## 🚀 Quick Start

```
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Visit: http://localhost:3000 | Admin: /admin (see demo accounts below)

## 👤 Demo Accounts

| Role  | Email                | Password |
| ----- | -------------------- | -------- |
| Admin | admin@dyofficial.com | admin123 |
| User  | john@example.com     | user123  |
| User  | jane@example.com     | user123  |

## 🧱 Stack

Next.js 14, TypeScript, Prisma, NextAuth, Tailwind, Stripe (simulated), Jest.

## 📊 Core Features

- Browse → filter → product detail (structured data + gallery)
- Cart + wishlist with enforced size selection
- Discount codes (fixed / percent / limits / windows)
- Trending & recently viewed personalization slices
- Order lifecycle + metrics instrumentation

## 🔍 Search & Trending

Weighted relevance (synonyms/plurals) + event-driven metrics feed a time‑decay trending list (72h half‑life). Falls back to “newest” when cold.

## 🛠 Admin Overview

Products, brands, categories, orders, discount codes, basic inventory + social moderation scaffolding.

## 🧪 Tests

Key coverage: checkout flow, search expansion, trending decay, money formatting, order transitions.

## 🧬 Deferred (Stubbed) Features

Reviews (create/vote/report), advanced variant management, bundles, product relations scoring, inventory alert automation. See `ARCHITECTURE.md` for activation plan.

## 📄 Full Technical Documentation

See `ARCHITECTURE.md` (deep data models, algorithms, roadmap, activation steps).

## ⚖️ License / Attribution

Educational project (not affiliated with ASOS). Validate security & compliance before production use.

---

`ARCHITECTURE.md` contains the previous in‑depth consolidated documentation. Historical phase / fix reports now live under `docs/archive/`.

4. Start the dev server:

```bash
npm run dev
```

API routes (selected):

- `GET /api/products` list (filters: q, category, size, min, max, page, pageSize)
- `GET /api/products/:id` detail

Prisma helper singleton: `lib/server/prisma.ts`.

## Project Structure

```
app/          # Next.js App Router entrypoints
components/   # Reusable UI + layout pieces
lib/          # Utilities
```

## Cart & Wishlist Architecture

Providers implemented in `components/providers/CartProvider.tsx`.

Cart:

- Add / merge by product + selected size
- Update quantity (1..99), remove line, clear bag
- Derived subtotal & total count

Wishlist:

- Toggle save (keyed by product + size if any)
- Move to cart (removes from wishlist)
- Quick toggle hearts in category grid

Persistence: `localStorage` keys `app.cart.v1` & `app.wishlist.v1`.
Graceful JSON parse failure fallback to empty arrays.

Limitations / Notes:

- Local cart is authoritative until first authenticated sync; server rebuild fallback handles race for checkout
- Stock logic is simplistic (no reservations / optimistic locking yet)
- Counts hydrate client-side (no SSR hydration of bag count yet)

### Pricing Model

All pricing now uses integer minor units (`priceCents`) everywhere (database, APIs, cart, wishlist). Floating point `price` fields have been removed from API responses to prevent rounding issues. Use the shared helper `formatPriceCents` in `lib/money.ts` for all display formatting (supports locale + currency overrides). Never derive business logic from a formatted string or floating value—always keep calculations in cents until the final render step.

## Authentication

- NextAuth Credentials provider (demo user: `demo@example.com` / `demo123`)
- Optional GitHub OAuth via `GITHUB_ID` / `GITHUB_SECRET`
- Session provided via `SessionProvider`; header buttons reflect state

## Server Cart Persistence (Prototype)

- In-memory cart store: `lib/server/cartStore.ts` (resets on restart)
- API endpoints: `GET /api/cart`, `POST /api/cart` (replace), `PATCH /api/cart` (merge)
- `CartSync` component merges local cart to server on first authenticated mount
- Merge strategy accumulates quantities per composite line id (product + size)

Planned improvements:

- Replace in-memory store with database (Postgres/Prisma or Redis)
- Server Actions for granular add/update/remove
- SSR hydration of cart badge
- Authenticated wishlist persistence

## Tailwind

Utilities live in `app/globals.css`. Add component classes in `@layer components`.

## Events & Metrics

Endpoint: `POST /api/events` accepts JSON array of `{ productId, type }`.

Accumulated counters in `ProductMetrics`:

- views, detailViews, wishlists, addToCart, purchases

Used by Trending algorithm (time decay + weight factors) and for purchase popularity.

## Environment Variables

Copy `.env.example` → `.env` and adjust. Key variables:

| Variable                           | Purpose                                              |
| ---------------------------------- | ---------------------------------------------------- |
| NEXTAUTH_SECRET                    | Session encryption secret                            |
| DATABASE_URL                       | Prisma connection (SQLite file or Postgres URL)      |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Enables real PaymentElement UI                       |
| STRIPE_SECRET_KEY                  | Server-side Stripe API calls                         |
| STRIPE_WEBHOOK_SECRET              | Verifies incoming Stripe webhooks                    |
| RESEND_API_KEY                     | Email provider (optional; logs to console if absent) |
| SENTRY_DSN                         | Enables Sentry error & performance monitoring        |
| SENTRY_TRACES_SAMPLE_RATE          | (Optional) Sample rate for performance traces        |

`lib/server/env.ts` logs grouped warnings once on first Stripe usage / webhook request.

## Stripe Setup

1. Add keys to `.env`.
2. Run dev server, ensure publishable key presence removes simulated payment message.
3. Start listener:

```bash
stripe listen --events payment_intent.succeeded --forward-to http://localhost:3000/api/webhooks/stripe
```

4. Copy the `whsec_...` secret to `STRIPE_WEBHOOK_SECRET` and restart.
5. Use test card `4242 4242 4242 4242` in checkout.

## Simulated Payment Mode

If `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is missing, checkout falls back to a simulated payment confirmation screen (no external network call); a synthetic webhook payload finalizes the order & metrics.

## Sentry

Optional error monitoring: set `SENTRY_DSN` and (optionally) `SENTRY_TRACES_SAMPLE_RATE` (default 0.05). Errors inside API route handlers wrapped with `withRequest` are forwarded with request metadata (path, method, latency, request id). When unset, Sentry code is inert with minimal overhead.

## Disclaimer

This is an educational demo, not affiliated with or endorsed by ASOS.

## Admin / Management APIs

### Products

An admin-only endpoint allows creating products.

### Enable Admin

1. Add `isAdmin` field (already in schema).
2. Open Prisma Studio: `npx prisma studio`.
3. Set `isAdmin` to `true` for your user.

### Create Product

`POST /api/admin/products`

Payload example:

```json
{
  "sku": "TEE-BASIC-BLK-M",
  "name": "Basic Black Tee",
  "description": "Soft cotton crew neck",
  "priceCents": 1999,
  "images": [
    { "url": "https://picsum.photos/seed/tee1/600/800", "alt": "Front" }
  ],
  "sizes": [
    { "label": "M", "stock": 40 },
    { "label": "L", "stock": 30 }
  ]
}
```

Errors: `unauthorized`, `forbidden`, `sku_exists`, `invalid_payload`.

### Brands / Categories

`POST /api/admin/brands` & `POST /api/admin/categories` simple CRUD (name/slug uniqueness). Admin pages exist for quick management.

### Discount Codes

`POST /api/discount-codes` (admin) & `GET /api/discount-codes/validate?code=XYZ` (client validation). Supports fixed or percent, usage limit, min subtotal, start/end windows.

## Orders & Payments

Lifecycle:

1. Local cart sync → `/api/checkout` (creates PENDING order)
2. `/api/payments/intent` returns Stripe PaymentIntent (moves order → AWAITING_PAYMENT) or simulated intent
3. Stripe (or simulated) webhook marks order PAID + increments purchase metrics
4. Future: fulfillment states (FULFILLING, SHIPPED, DELIVERED) & refunds

## Tests

Run all tests:

```bash
npm test
```

Add focused test with watch mode (Jest default; see `jest.config.js`).

## Quick-Add Size Enforcement

Grid “+” now opens a size popover if the product has size variants. This ensures orders always include a size for size-governed products. PDP add-to-bag already enforced selection via client alert.

## Contributing / Local Development Tips

- Reset DB: delete `prisma/dev.db` then run `npx prisma migrate dev --name init && ts-node prisma/seed-random.ts` (or npm script variant)
- Inspect metrics: `sqlite3 prisma/dev.db "SELECT * FROM ProductMetrics ORDER BY purchases DESC LIMIT 10;"`
- Update env and restart dev server to ensure Next.js picks changes.

---

## New Additions (Phase 1 Enhancements)

### Email Provider & Templates

- Unified HTML template with base layout (header, footer, consistent typography).
- Auto-selects Resend when `RESEND_API_KEY` is present; otherwise logs email payloads to console.
- Templates: Order Confirmation, Payment Receipt, Password Reset.

### Order Timeline / Audit

- `OrderEvent` model captures: CREATED, STATUS_CHANGE, PAYMENT_UPDATE (extensible for DISCOUNT_APPLIED, NOTE, REFUND).
- Timeline visible on order detail page.
- API: `GET /api/orders/:id/events`.

### Payment Retry Endpoint

- `POST /api/payments/retry { orderId }` creates a new simulated payment attempt (pending) and logs an event.

### Legal Pages

- Static routes: `/privacy`, `/terms`, `/returns` as placeholders for production content.

### Backup Script

- `scripts/backup-db.ts`: copies SQLite DB or prints a `pg_dump` template for Postgres.

### Dynamic Tax & Shipping

- Rule-based engine with region rates + free shipping threshold; easy future swap to external API.

### Inventory Race Hardening

- Centralized `decrementSizeStock` abstraction; conditional UPDATE guard ready for Postgres semantics.

### Password Reset

- Token model with TTL + unified email template + consumption endpoint.
