import {
  getMailer,
  sendOrderConfirmation,
  sendPaymentReceipt,
} from "@/lib/server/mailer";
import { prisma } from "@/lib/server/prisma";

describe("mailer branch coverage", () => {
  test("sendOrderConfirmation + sendPaymentReceipt invoke underlying mailer", async () => {
    const user = await prisma.user.create({
      data: {
        id: "mail-u-" + Date.now(),
        email:
          "mail-" + Math.random().toString(36).slice(2, 8) + "@example.com",
        passwordHash: "x",
        isAdmin: false,
      },
    });
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        email: user.email,
        subtotalCents: 1000,
        discountCents: 0,
        taxCents: 0,
        shippingCents: 0,
        totalCents: 1000,
        status: "PENDING",
      },
    });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {
      /* swallow log */
    });
    await sendOrderConfirmation(user as any, order as any);
    await sendPaymentReceipt(user as any, order as any);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
