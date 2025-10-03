// Dynamic tax & shipping calculation framework.
// This initial implementation provides pluggable strategy objects and a simple
// rules-based fallback so we can evolve toward external provider integration later.
//
// Contract:
//  calculate(orderDraft) => { taxCents, shippingCents, breakdown }
//  - orderDraft includes: subtotalCents, items[{priceCents, qty, productId}], destination {country, region, postalCode}
//  - breakdown is a serializable object (safe for logging / debugging) with rule matches etc.

export interface OrderDraftItem {
  productId: string;
  unitPriceCents: number;
  qty: number;
}

export interface OrderDestination {
  country: string; // ISO country code
  region?: string | null; // state / province
  postalCode?: string | null;
}

export interface OrderDraftForRates {
  subtotalCents: number;
  items: OrderDraftItem[];
  destination: OrderDestination;
}

export interface RateResultBreakdown {
  taxRateApplied?: number; // percentage * 100 (e.g., 725 => 7.25%)
  taxRule?: string;
  shippingRule?: string;
  baseShippingCents?: number;
  weightTotalGrams?: number;
  adjustments?: Array<{ reason: string; amountCents: number }>;
}

export interface RateResult {
  taxCents: number;
  shippingCents: number;
  breakdown: RateResultBreakdown;
}

export interface RateStrategy {
  calculate(draft: OrderDraftForRates): Promise<RateResult> | RateResult;
}

// Simple rule tables (could load from DB in future)
const TAX_RULES: Array<{
  match: (d: OrderDraftForRates) => boolean;
  rate: number; // decimal e.g. 0.07 => 7%
  label: string;
}> = [
  {
    match: (d) =>
      d.destination.country === "US" && d.destination.region === "CA",
    rate: 0.0725,
    label: "US-CA",
  },
  {
    match: (d) =>
      d.destination.country === "US" && d.destination.region === "NY",
    rate: 0.08875,
    label: "US-NY",
  },
  { match: (d) => d.destination.country === "GB", rate: 0.2, label: "UK-VAT" },
];

const SHIPPING_RULES: Array<{
  match: (d: OrderDraftForRates) => boolean;
  baseCents: number;
  perItemCents?: number;
  label: string;
}> = [
  {
    match: (d) => d.destination.country === "US",
    baseCents: 599,
    perItemCents: 100,
    label: "US_STANDARD",
  },
  {
    match: (d) => d.destination.country === "GB",
    baseCents: 499,
    perItemCents: 75,
    label: "UK_STANDARD",
  },
];

export class RuleBasedRateStrategy implements RateStrategy {
  calculate(draft: OrderDraftForRates): RateResult {
    // Tax
    let taxRate = 0;
    let taxRule: string | undefined;
    for (const r of TAX_RULES) {
      if (r.match(draft)) {
        taxRate = r.rate;
        taxRule = r.label;
        break;
      }
    }
    const taxCents = Math.round(draft.subtotalCents * taxRate);

    // Shipping
    let shippingBase = 0;
    let perItem = 0;
    let shippingRule: string | undefined;
    for (const r of SHIPPING_RULES) {
      if (r.match(draft)) {
        shippingBase = r.baseCents;
        perItem = r.perItemCents || 0;
        shippingRule = r.label;
        break;
      }
    }
    // Free shipping promotion example: subtotal >= $75 (7500 cents)
    let shippingCents =
      shippingBase + perItem * draft.items.reduce((s, i) => s + i.qty, 0);
    const adjustments: RateResultBreakdown["adjustments"] = [];
    if (draft.subtotalCents >= 7500 && shippingCents > 0) {
      adjustments.push({
        reason: "FREE_SHIPPING_THRESHOLD",
        amountCents: -shippingCents,
      });
      shippingCents = 0;
    }

    return {
      taxCents,
      shippingCents,
      breakdown: {
        taxRateApplied: taxRate ? Math.round(taxRate * 10000) : undefined,
        taxRule,
        shippingRule,
        baseShippingCents: shippingBase,
        adjustments,
      },
    };
  }
}

let _strategy: RateStrategy | null = null;
export function getRateStrategy(): RateStrategy {
  if (!_strategy) _strategy = new RuleBasedRateStrategy();
  return _strategy;
}

export async function calculateRates(
  draft: OrderDraftForRates
): Promise<RateResult> {
  return getRateStrategy().calculate(draft);
}

// Helper to build draft from raw cart/order construction input
export function buildDraftFromCart(params: {
  lines: Array<{ priceCentsSnapshot: number; qty: number; productId: string }>;
  destination: {
    country: string;
    region?: string | null;
    postalCode?: string | null;
  };
}): OrderDraftForRates {
  const subtotalCents = params.lines.reduce(
    (s, l) => s + l.priceCentsSnapshot * l.qty,
    0
  );
  return {
    subtotalCents,
    items: params.lines.map((l) => ({
      productId: l.productId,
      unitPriceCents: l.priceCentsSnapshot,
      qty: l.qty,
    })),
    destination: params.destination,
  };
}
