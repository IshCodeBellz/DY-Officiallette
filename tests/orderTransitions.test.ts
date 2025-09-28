import { describe, it, expect } from "@jest/globals";

const transitions: Record<string, string[]> = {
  PENDING: ["AWAITING_PAYMENT", "CANCELLED"],
  AWAITING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["FULFILLING", "CANCELLED", "REFUNDED"],
  FULFILLING: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

function canTransition(from: string, to: string) {
  if (from === to) return true; // idempotent update
  return (transitions[from] || []).includes(to);
}

describe("order status transitions", () => {
  it("allows valid path", () => {
    expect(canTransition("PENDING", "AWAITING_PAYMENT")).toBe(true);
  });
  it("rejects invalid path", () => {
    expect(canTransition("PENDING", "SHIPPED")).toBe(false);
  });
  it("is idempotent", () => {
    expect(canTransition("PAID", "PAID")).toBe(true);
  });
});
