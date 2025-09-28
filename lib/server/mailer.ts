// Simple email abstraction placeholder. Replace with real provider (e.g., Resend, SendGrid, SES)
import type { Order, User } from "@prisma/client";

export interface Mailer {
  send(opts: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void>;
}

class ConsoleMailer implements Mailer {
  async send(opts: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }) {
    console.log("[MAIL:send]", JSON.stringify(opts, null, 2));
  }
}

let _mailer: Mailer | null = null;
export function getMailer(): Mailer {
  if (!_mailer) _mailer = new ConsoleMailer();
  return _mailer;
}

// --- HTML Template Helpers (simple inline styles for snapshot safety) ---
function currency(amountCents: number) {
  return "$" + (amountCents / 100).toFixed(2);
}

export function buildOrderConfirmationHtml(order: Order) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.4;color:#222;">
  <h1 style="font-size:20px;margin:0 0 12px;">Thanks for your order!</h1>
  <p style="margin:0 0 12px;">Order <strong>#${
    order.id
  }</strong> has been received.</p>
  <p style="margin:0 0 12px;">Total: <strong>${currency(
    order.totalCents
  )}</strong></p>
  <p style="font-size:12px;color:#666;">You will receive another email when payment is confirmed.</p>
  </body></html>`;
}

export function buildPaymentReceiptHtml(order: Order) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.4;color:#222;">
  <h1 style="font-size:20px;margin:0 0 12px;">Payment received</h1>
  <p style="margin:0 0 12px;">We've captured payment for order <strong>#${
    order.id
  }</strong>.</p>
  <p style="margin:0 0 12px;">Amount: <strong>${currency(
    order.totalCents
  )}</strong></p>
  <p style="font-size:12px;color:#666;">We'll start fulfilling your order shortly.</p>
  </body></html>`;
}

export async function sendOrderConfirmation(user: User, order: Order) {
  const mailer = getMailer();
  const html = buildOrderConfirmationHtml(order);
  await mailer.send({
    to: user.email,
    subject: `Order #${order.id} confirmation`,
    text: `We received your order totaling ${(order.totalCents / 100).toFixed(
      2
    )}. Thank you!`,
    html,
  });
}

export async function sendPaymentReceipt(user: User, order: Order) {
  const mailer = getMailer();
  const html = buildPaymentReceiptHtml(order);
  await mailer.send({
    to: user.email,
    subject: `Payment received for order #${order.id}`,
    text: `Your payment for ${(order.totalCents / 100).toFixed(
      2
    )} has been captured. We'll start processing your order.`,
    html,
  });
}
