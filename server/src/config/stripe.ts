import Stripe from "stripe";
import { env } from "./env.js";

if (!env.STRIPE_SECRET_KEY.startsWith("sk_test_")) {
  throw new Error("STRIPE_SECRET_KEY must be a Stripe test-mode secret key");
}

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);
