import { getStripe } from "@/lib/server/stripe";

describe("stripe init", () => {
  test("returns Stripe instance when key is set", () => {
    const s = getStripe();
    expect(s).not.toBeNull();
    expect(s).toHaveProperty("paymentIntents");
    expect(s).toHaveProperty("customers");
  });
});
