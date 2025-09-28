import {
  buildOrderConfirmationHtml,
  buildPaymentReceiptHtml,
} from "@/lib/server/mailer";

describe("email templates", () => {
  const baseOrder: any = {
    id: "order_12345",
    totalCents: 2599,
  };

  test("order confirmation html snapshot", () => {
    const html = buildOrderConfirmationHtml(baseOrder);
    expect(html).toMatchSnapshot();
  });

  test("payment receipt html snapshot", () => {
    const html = buildPaymentReceiptHtml(baseOrder);
    expect(html).toMatchSnapshot();
  });
});
