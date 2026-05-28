// Payment provider seam. The MVP returns a mock hosted-checkout link. To go
// live, implement PaymentProvider with Stripe / Netopia / PayU and swap the
// `paymentProvider` export — the createPaymentLink tool does not change.

import { randomUUID } from "node:crypto";

export type CreatePaymentLinkInput = {
  bookingId: string;
  amount: number;
  currency: string;
  description?: string;
  customerEmail?: string;
};

export type PaymentLinkResult = {
  provider: string;
  providerPaymentId: string;
  url: string;
  amount: number;
  currency: string;
};

export interface PaymentProvider {
  readonly name: string;
  createPaymentLink(input: CreatePaymentLinkInput): Promise<PaymentLinkResult>;
}

function appBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createPaymentLink(input: CreatePaymentLinkInput): Promise<PaymentLinkResult> {
    const providerPaymentId = `pay_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
    // A fake but routable-looking hosted checkout URL.
    const url = `${appBaseUrl()}/checkout/${providerPaymentId}?booking=${encodeURIComponent(
      input.bookingId,
    )}`;
    return {
      provider: this.name,
      providerPaymentId,
      url,
      amount: input.amount,
      currency: input.currency,
    };
  }
}

// --- Swap point: replace with a real provider for production. ---
// e.g. export const paymentProvider: PaymentProvider = new StripePaymentProvider(process.env.STRIPE_SECRET_KEY!);
export const paymentProvider: PaymentProvider = new MockPaymentProvider();
