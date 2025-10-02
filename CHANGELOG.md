## Unreleased

### Documentation Consolidation

- Split monolithic README into concise public `README.md` + deep-dive `ARCHITECTURE.md`.
- Archived 20+ historical phase/fix/status markdown files under `docs/archive/` for audit.
- Added badges placeholder (build/coverage) and clarified deferred feature activation path.
- No functional code changes; documentation restructure only.
- Root directory cleaned: legacy phase/report markdown files removed (duplicates now only referenced via `docs/archive/`).
### Added
- Rich order confirmation email (line items, pricing breakdown, shipping & billing addresses, estimated delivery) sent on checkout creation instead of minimal summary.

### Admin Product Management Enhancements (Phase 2)

- Added soft delete (products now have `deletedAt`); admin list can optionally show deleted items with a toggle and visual badge.
- Implemented product restore endpoint & UI (Restore button on deleted product edit page).
- Added brand & category filters plus deleted toggle to `/admin/products` listing.
- Enhanced admin search API & UI to respect brand, category, and deleted filters.
- Implemented drag-and-drop image reordering in edit form with debounced auto-save.
- Added inline SKU availability check (debounced) and badge feedback while editing products.
- Enforced unique size labels client-side and server-side (duplicate size labels rejected with `duplicate_sizes` error).
- Added visual indicators for deleted state in list and edit views.

Migration / Notes:

- No schema change required beyond previously introduced `deletedAt` on Product.
- Existing integrations unaffected; soft-deleted products are excluded by default from admin list & search unless `deleted=1` query param provided.
- Auto-save of image order uses debounced PUT; manual Save still performs full update.

### Pricing Model Migration

- Removed legacy float `price` fields from all product/search API responses.
- Introduced and enforced integer cent values via `priceCents` & `priceCentsSnapshot`.
- Added `formatPriceCents(cents)` helper for display formatting; discouraged direct `toFixed(2)` usage.
- Updated cart, wishlist, search suggestions, category and product pages to rely exclusively on `priceCents`.
- Added ESLint restriction preventing accidental `toFixed(2)` formatting on price-like identifiers.

No external breaking changes unless a consumer relied on the removed `price` float property. Such clients must now derive display from `priceCents / 100` or call the formatter.
