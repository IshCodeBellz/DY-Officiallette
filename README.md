# ASOS Clone (Next.js 14 + Tailwind CSS)

An educational ASOS style fashion e‑commerce front-end clone built with the Next.js App Router, Tailwind CSS, TypeScript and modern tooling.

## Features

- Next.js 14 App Router
- Tailwind CSS + utility components
- Layout with sticky header + navigation + footer
- Home page sections: Hero, Trending grid, Category grid
  - Categories include Clothing, Shoes, Accessories, Sportswear, Face + Body, Brands, New In (with badge)
- Basic global providers (React Query)
- Client-side Cart & Wishlist (localStorage persistence)
- Category quick add & wishlist toggle
- Product page: size select, add to bag, save/remove
- Bag page: quantity edit, remove, clear, subtotal summary
- Saved items page: remove or move to bag
- Image optimization domains configured
- Live search suggestions & API (`/api/search`)
- In-page category filtering (query/size/price)
- Dark mode with persistent toggle
- Real product data layer (Prisma + SQLite dev DB)

## Planned Enhancements

- Faceted filtering + search suggestions (server driven)
- Server rendered category filters & pagination
- Dedicated /search results page
- Account area & extended profile management
- Checkout flow (Server Actions + payment provider)
- SEO metadata (next-seo) & structured data
- Move cart/wishlist persistence to server session / database
- Accessibility pass & keyboard navigation audit

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

API routes:

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

Limitations:

- No inventory or stock validation yet
- Counts hydrate client-side (no SSR hydration state yet)

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

## Disclaimer

This is an educational clone, not affiliated with or endorsed by ASOS.

## Admin Product API

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
