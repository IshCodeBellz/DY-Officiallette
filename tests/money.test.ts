import { formatPriceCents } from "@/lib/money";

describe("formatPriceCents", () => {
  it("formats basic USD values", () => {
    expect(formatPriceCents(1999)).toMatch(/19\.99/);
    expect(formatPriceCents(0)).toMatch(/0\.00/);
  });

  it("respects custom currency", () => {
    const eur = formatPriceCents(1234, { currency: "EUR", locale: "en-GB" });
    expect(eur).toMatch(/12\.34/);
  });
});
