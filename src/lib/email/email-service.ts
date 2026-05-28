// Email service seam. The MVP uses a mock provider that logs instead of
// sending. To go live, implement EmailProvider with Resend / SES / Postmark
// and swap the `emailService` export — call sites do not change.

import { randomUUID } from "node:crypto";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type EmailResult = {
  id: string;
  provider: string;
  to: string;
  subject: string;
  sentAt: string;
};

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailResult>;
}

class MockEmailProvider implements EmailProvider {
  readonly name = "mock";

  async send(message: EmailMessage): Promise<EmailResult> {
    const result: EmailResult = {
      id: `email_${randomUUID()}`,
      provider: this.name,
      to: message.to,
      subject: message.subject,
      sentAt: new Date().toISOString(),
    };
    // Mock delivery — in production this is a network call.
    console.log(`[email:mock] → ${message.to} | ${message.subject}`);
    return result;
  }
}

// --- Swap point: replace with a real provider for production. ---
// e.g. export const emailService: EmailProvider = new ResendEmailProvider(process.env.RESEND_API_KEY!);
export const emailService: EmailProvider = new MockEmailProvider();
