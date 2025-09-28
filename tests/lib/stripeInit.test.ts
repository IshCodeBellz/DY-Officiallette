import { getStripe } from "@/lib/server/stripe";

describe("stripe init", () => {
  test("returns null when no key set", () => {
    const s = getStripe();
    expect(s).toBeNull();
  });
});
