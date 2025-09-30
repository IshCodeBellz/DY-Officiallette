import Stripe from "stripe";
import { validateEnv } from "@/lib/server/env";

let _stripe: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!_stripe) {
    validateEnv(); // one-time side effect
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    _stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  }
  return _stripe;
}
