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

### Security & Data Integrity

<!-- Consolidated README: All previous *.md documentation condensed here -->

# DYOFFICIAL (Formerly "ASOS Clone")

Modern, educational fashion e‑commerce platform demonstrating production-grade architecture: Next.js App Router, server + client composition, search & discovery, analytics events pipeline, resilient checkout → payment → webhook lifecycle, social commerce foundations, and an admin & analytics ecosystem.

---

## 1. Executive Snapshot

| Area | Status | Notes |
|------|--------|-------|
| Core Commerce (browse → checkout) | ✅ Production-ready | 210 products, variants, discounts, order flow verified |
| Admin Suite | ✅ 100% coverage | Products, orders, brands, categories, discounts, inventory, social, analytics |
| Search & Trending | ✅ Implemented | Weighted relevance + time-decay trending, synonyms, facets |
| Events & Metrics | ✅ Active | VIEW / DETAIL / WISHLIST / ATC / PURCHASE instrumentation feeding ProductMetrics |
| Payments | ✅ Simulated + Stripe-ready | Idempotent checkout, webhook finalization, future real keys drop-in |
| Social Commerce | ✅ Foundation | Wishlist (public/private), review moderation scaffolding, analytics stubs |
| Personalization | ✅ Baseline | Recently viewed, trending, relationships seed (future ML hooks) |
| Observability | ✅ | Health, metrics, structured logging, Sentry (optional) |
| Deployment Readiness | ✅ High | Dockerfile, CI, checklist compiled |
| Deferred Advanced Features | 🚧 Stubbed | Variants mgmt enhancements, bundles, review create/vote/report, product relations, inventory alerts |

---

## 2. Feature Overview

### 2.1 User & Storefront
- Responsive Next.js 14 (RSC) UI with Tailwind
- Home: Hero, Trending Now (time-decay score), New In, Recently Viewed
- Category & search pages: client filters (size, price), relevance sorting, plural & synonym expansion
- Product Detail: multi-image gallery, structured data JSON-LD, size variant enforcement, wishlist toggle
- Cart & Wishlist: local-first → sync strategy, optimistic updates, enforced size selection (fixed across pages)
- Checkout: validation (stock, deleted, size), discount codes (fixed/percent, limits, windows), idempotent order creation
- Payment: simulated flow + webhook mimic; Stripe endpoints ready for live keys

### 2.2 Admin & Operations
- Dashboard: overview KPIs
- Products / Brands / Categories CRUD with soft-delete & SKU uniqueness
- Orders: status transitions & event log (OrderEvent model)
- Discount Codes: validation engine (thresholds, caps, temporal windows)
- Inventory: low stock alerts, movement log, summary stats
- Social: review moderation queue (stubbed methods), wishlist analytics
- Users: behavior segmentation & engagement metrics
- Security (framework groundwork): rate limiting & MFA infrastructure foundations

### 2.3 Data & Intelligence
- ProductMetrics counters (views, detailViews, wishlists, addToCart, purchases)
- Trending score: weighted activities × time decay (72h half-life)
- Search facets & analytics (term frequency, trending queries foundation)
- UserBehavior events: future personalization expansion point
- Review & Wishlist analytics (baseline; advanced aggregation deferred)

### 2.4 Engineering Foundations
- Strict TypeScript & Prisma schema (SQLite dev, Postgres-ready)
- Event ingestion API batching
- Health endpoint + metrics placeholders
- Structured environment validation with grouped one-time logs
- Integration + unit tests (search expansion, trending decay, full checkout flow)
- CI pipeline (install → migrate → test → build)

---

## 3. Data Model Highlights
Key Prisma models: Product, ProductVariant, SizeVariant, ProductImage, ProductMetrics, Wishlist(+Items +Followers +Analytics), ProductReview, Order / OrderItem / PaymentRecord, DiscountCode, InventoryAlert, ProductRelation, UserBehavior, Recommendation, ReviewAnalytics.

Advanced (Phase 3/4) models present but some service layers intentionally stubbed.

---

## 4. Product Catalog & Content
- 210 products across 7+ categories
- 20 brands populated (fast-fashion → athletic → heritage)
- Complete size matrices (Women, Men, Sportswear, Footwear) with per-size stock
- SEO metadata fields (title, description, materials, care instructions, tags)
- Product relationships seeded (foundation for "Customers also viewed")

Expansion impact: ~5× initial assortment; supports realistic discovery & load testing.

---

## 5. Algorithms & Scoring
Trending score = Σ(weighted interactions) × decay(Δhours, halfLife=72). Weights: views 0.5, detail 1.0, wishlist 1.3, addToCart 2.2, purchases 4.0.
Fallback strategy: If no meaningful score → newest products list (guaranteed visual continuity).

Search relevance: field weighting + simple term normalization + plural & synonym expansion. Facets pre-aggregated with scoped counts.

---

## 6. Social & Engagement (Current vs Deferred)
Implemented: Public/private wishlists, wishlist sharing token, basic review moderation queries (pending/unhelpful heuristics), social stats (counts, ratios).
Deferred (stubbed methods in `ReviewService` & `ProductManagementService`): review creation, helpfulness voting, reporting, product bundles, variant CRUD enhancements, product relations ranking, inventory alert automation.

---

## 7. Testing & Quality
Automated:
- `__tests__/checkoutFlow.int.test.ts` end‑to‑end order pipeline
- `__tests__/searchExpansion.test.ts` synonyms/plurals
- `__tests__/trendingDecay.test.ts` time decay correctness

Manual Journey (validated): anonymous browse → register/login → search/filter → size selection enforcement → cart → discount → checkout → order state → admin visibility.

Key Fixes Incorporated:
- Trending SSR fetch removed → direct DB access (faster & resilient)
- Size selection enforced globally (New In parity with categories)
- Corrupted service file replaced by hardened stubs (compile stability)

---

## 8. Deployment & Operations Summary
Essentials:
```
DATABASE_URL=postgresql://user:pass@host/db
NEXTAUTH_SECRET=... (strong random)
NEXTAUTH_URL=https://yourdomain
STRIPE_SECRET_KEY=sk_live_... (when live)
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=... (optional emails)
SENTRY_DSN=... (optional monitoring)
```
Build: `npm run build` → start or deploy (Dockerfile multi-stage ready). Health endpoint for LB probes; optional Sentry for tracing. See prior Deployment Checklist (now superseded by this consolidated README) for advanced hardening.

Key Production Concerns:
- Switch SQLite → Postgres before scale
- Enable real Stripe + webhook signature validation
- Add Redis / external cache for search & personalization (future)

---

## 9. Admin Interface Map
```
/admin
  products/  brands/  categories/  orders/  discount-codes/
  inventory/ analytics/ personalization/ social/ users/analytics/
  security/ settings/
```
Coverage: 13 sections, 60+ purposeful components, 100% feature visibility.

---

## 10. Accounts (Demo)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dyofficial.com | admin123 |
| User  | john@example.com | user123 |
| User  | jane@example.com | user123 |

Seeded wishlists, orders, and behaviors accelerate demo realism.

---

## 11. Development Workflow
1. `cp .env.example .env` & adjust
2. `npm install` (or pnpm/yarn)
3. `npx prisma migrate dev --name init`
4. `npm run prisma:seed` (randomized catalog)
5. `npm run dev`
6. Run tests: `npm test`

Optional Postgres (docker-compose): `docker compose up --build` then `npx prisma migrate deploy`.

---

## 12. Pricing & Money Handling
All monetary values stored as integer minor units (`priceCents`). Display via shared formatter to avoid float drift. Never perform logic on formatted strings.

---

## 13. Observability & Health
- `/api/health` (lightweight probe)
- Structured debug helper `debug(tag,event,payload)`
- Optional Sentry DSN enables error + perf tracing
- Rate limiting scaffold & security event logging foundation

---

## 14. Deferred / Stubbed Features (Activation Plan)
| Feature | Stub Location | Unlock Steps |
|---------|---------------|--------------|
| Review create/vote/report | `ReviewService` static stubs | Implement CRUD + per-user vote table + analytics update job |
| Product variants mgmt 2.0 | `ProductManagementService` | Replace stubs, add admin UI for variant CRUD + price overrides |
| Bundles & collections | `ProductManagementService` | Model linking + discount application logic + bundle PDP surfaces |
| Inventory alerts engine | Same | Schedule cron / on-write checks + alert persistence + UI surfacing |
| Product relations scoring | Same | Generate similarity graph (views, co-purchase) + caching layer |
| Bulk product generation | Same | Replace seed reliance with CLI ingest + validations |

Suggested Order: Reviews → Variants → Relations → Inventory Alerts → Bundles → Bulk Tools.

---

## 15. Roadmap (Forward Looking)
Short Term:
- Enable real Stripe + webhooks signature
- Migrate to Postgres + connection pooling
- Activate review creation & moderation workflow

Mid Term:
- Fuzzy search & typo tolerance
- Recommendation refinement (collaborative + content hybrid scoring)
- PWA + offline & push notifications

Long Term:
- Multi-vendor marketplace & commission engine
- ML-driven dynamic pricing & fraud signals
- Internationalization (currencies, locale formatting)

---

## 16. Security Snapshot
- Idempotent checkout & payment flow
- Planned MFA scaffolding (models present)
- Environment validation gates risky misconfiguration
- Future: CSP, CSRF tokens, advanced session hardening

---

## 17. Testing Matrix (Condensed)
| Layer | Representative Tests | Status |
|-------|----------------------|--------|
| Unit | price formatting, decay math | ✅ |
| Integration | checkoutFlow.int.test | ✅ |
| Search Logic | synonym & plural expansion | ✅ |
| Manual UX | full user journey (report) | ✅ |
| Pending | review flows, variant admin | 🚧 (deferred) |

---

## 18. Known Gaps / Technical Debt (Intentional)
- ReviewService business methods disabled (stubs return "Disabled")
- ProductManagementService advanced operations deferred
- No persistent cache layer (in-memory/DB only)
- Stripe fully simulated unless keys provided

All gaps documented; no silent failures.

---

## 19. Contribution Guidelines (Lightweight)
1. Add/modify Prisma model → run migration → document change rationale.
2. For new service: include interface, error modes, minimal tests.
3. Avoid reintroducing floating currency types.
4. Keep stubs clearly marked until replaced; remove "Disabled" wording on activation.

---

## 20. Quick Commands (Reference)
```
# Reset dev DB (DANGER)
rm -f prisma/dev.db && npx prisma migrate dev --name init && npm run prisma:seed

# Run targeted test
npm test -- cartSubtotal

# Open Prisma Studio
npx prisma studio
```

---

## 21. Glossary
| Term | Meaning |
|------|---------|
| RSC | React Server Components (App Router) |
| ATC | Add To Cart event |
| Decay | Time weighting reducing historic engagement influence |
| Idempotency Key | Client-provided unique token preventing duplicate checkout side effects |

---

## 22. Status
Platform: ✅ Production-quality core
Advanced Social / Bundles: 🚧 Planned
Ready for: Real payment enablement, load & A/B experimentation.

---

## 23. License / Attribution
Educational demonstration project. Not affiliated with or endorsed by ASOS. Use commercially at your own risk; validate security & compliance layers before launch.

---

**Build Something Great.**

---
_This consolidated README supersedes individual historical *.md reports (kept for audit/history)._ 

<!-- End Consolidated README -->

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
