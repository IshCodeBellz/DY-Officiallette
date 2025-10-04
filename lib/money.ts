import { currencyService } from "./currency";

export function formatPriceCents(
  cents: number,
  options: { currency?: string; locale?: string } = {}
) {
  const { currency = "GBP", locale = "en-GB" } = options;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
    maximumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
  }).format(cents / 100);
}

/**
 * Convert USD cents to target currency using currency service
 */
export function convertPriceCents(
  usdCents: number,
  targetCurrency: string
): number {
  return currencyService.convertPrice(usdCents, targetCurrency);
}

/**
 * Format price with automatic currency conversion
 */
export function formatPriceWithCurrency(
  usdCents: number,
  targetCurrency: string,
  locale?: string
): string {
  const convertedCents = convertPriceCents(usdCents, targetCurrency);
  return formatPriceCents(convertedCents, { currency: targetCurrency, locale });
}
