export function formatPriceCents(
  cents: number,
  options: { currency?: string; locale?: string } = {}
) {
  const { currency = "USD", locale = "en-US" } = options;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
