# DYOFFICIAL (Next.js 14 + Tailwind CSS)

Educational fashion e‑commerce demo (formerly "ASOS Clone") showcasing modern commerce patterns: App Router, server + client composition, search relevance, analytics events, and a full checkout → payment → webhook lifecycle.

## Current Feature Set

### Platform & UI

- Next.js 14 App Router (RSC + edge-friendly patterns where practical)
- Tailwind CSS utility-first styling
- Global layout (sticky header, navigation, footer, dark mode persistence)
- Home landing sections: Hero, Trending Now, Category grid, New In
- Category pages with client filtering (search within page, size, price range)
- Product gallery with:
  - Multi-image thumbnails + keyboard & swipe navigation
  - Zoom modal, preload of adjacent images, image index overlays
  - Structured data (JSON-LD Product + ItemList for categories)
- Wishlist & Cart UI (local → server sync strategy)
- Quick-add button with size enforcement popover (cannot add size-tracked item without picking a size)

### Data & Domain

- Prisma schema: Products, Brands, Categories, Images, SizeVariants, Users, Cart/CartLines, Wishlist, Orders, OrderItems, PaymentRecords, DiscountCodes, ProductMetrics
- SQLite for development (easy file reset); compatible with Postgres in production
- Admin endpoints + pages for Brands, Categories, Products (SKU uniqueness, soft-delete / restore for products)
- Random seed script for catalog variety (`prisma/seed-random.ts`)

### Search & Discovery

- `/api/search` relevance scoring (term frequency + field weighting)
- Synonym & plural expansion (e.g. "hat" -> "hats", synonyms list)
- Facets (category & brand counts) with scoped totals
- Sorting: relevance, newest, price asc/desc, trending
- Pagination with total counts & pages
- Trending endpoint using time-decay on engagement metrics (views, detail views, wishlist, add-to-cart, purchases)
- Raw SQL fallback path for resilience if complex query returns zero (defensive search robustness)

### Analytics & Events

- Lightweight event ingestion `/api/events` batching VIEW / DETAIL_VIEW / WISHLIST / ADD_TO_CART / PURCHASE
- Aggregation into `ProductMetrics` via raw upsert (efficient increment patterns for SQLite/Postgres)
- Purchase metrics incremented on payment webhook (plus optional events emission) powering Trending Now

### Checkout & Payments

- Checkout endpoint `/api/checkout`:
  - Validates cart (stock, deleted items, size existence)
  - Rebuild fallback from client-provided lines to avoid race where server cart not synced
  - Discount code validation (fixed or percent + min subtotal + usage limits + temporal windows)
  - Creates Order + snapshot OrderItems + address records (shipping / billing)
  - Idempotency via optional `idempotencyKey`
- Payment intent endpoint `/api/payments/intent` (Stripe or simulated when keys absent)
- Stripe webhook `/api/webhooks/stripe` finalizes order (PAID) + metrics increment
- Simulated payment mode UI when publishable key not configured (Confirm Payment button triggers webhook)
- Success page + basic order status handling

### Discounts
- Centralized env validation (`lib/server/env.ts`) logging grouped WARN/ERROR only once
- Debug logging helper `debug(tag, event, payload)` sprinkled through checkout & search layers
- Purchase/order flow integration test + unit tests for search expansion & trending decay

- Health probe: `GET /api/health` returns `{ ok: boolean, db: 'up'|'down', ms }` (200 when healthy, 503 if DB unavailable).
- GitHub Actions workflow (`.github/workflows/ci.yml`) runs install → migrate → tests → build on pushes & PRs to `main`.
- Added a production-oriented multi-stage `Dockerfile` (Node 20 alpine). Usage:


For Postgres in production, override `DATABASE_URL` at runtime; mount a volume or use an external DB instead of the bundled SQLite file.

#### Local Postgres (docker-compose)

Spin up Postgres + the production build image:

```bash
docker compose up --build
```

Run migrations if needed inside the container:

```bash
docker compose exec app npx prisma migrate deploy
```

Override your local `.env` when developing against Postgres:

```
DATABASE_URL=postgresql://dy:dysecret@localhost:5432/dyofficial?schema=public
```

### Testing

```
__tests__/searchExpansion.test.ts      # synonym & plural logic
__tests__/trendingDecay.test.ts        # decay math correctness
__tests__/checkoutFlow.int.test.ts     # full checkout → payment intent → webhook flow
```

Run with:

```bash
npm test
```

### Security & Data Integrity

- Size & stock validation on checkout and cart API (clamps quantity, prevents over-selling in dev model)
- Order + payment idempotency safeguards
- Optional Stripe signature verification when `STRIPE_WEBHOOK_SECRET` configured
- Rate limiting on checkout endpoint (simple token bucket)

### SEO

- Structured data: Product JSON-LD on PDP; ItemList / Collection context on category pages
- Canonical product URL patterns prepared for future sitemap integration

## Roadmap / Potential Enhancements

- Full fuzzy search (typo tolerance) & brand boosting
- Move cart & wishlist persistence fully server-side (DB) + SSR badges
- Email templating (HTML) & retry / queue for transactional mail
- Payment failure / refund events + PaymentRecord status transitions
- Advanced analytics export (batch events to queue / worker)
- Automated Lighthouse & a11y test pipeline
- Graph-based recommendation ("Customers also viewed")

---

## Getting Started

Install dependencies and run the dev server:

```bash
pnpm install # or yarn / npm install
pnpm dev
```

Open http://localhost:3000

### Database (Product Catalog)

The app now uses Prisma with a local SQLite database for products, brands, categories, images & size variants.

1. Copy `.env.example` to `.env` (adjust `DATABASE_URL` if desired)
2. Generate client & run initial migration / seed:

```bash
npm install # or pnpm / yarn
npx prisma migrate dev --name init
npm run prisma:seed
```

3. (Optional) Open Prisma Studio:

```bash
npx prisma studio
```

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
