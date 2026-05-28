// Invoice provider seam. The MVP returns a mock invoice/PDF URL and computes
// the total locally. To go live, implement InvoiceProvider with SmartBill /
// Oblio / FGO and swap the `invoiceProvider` export — the generateInvoice tool
// does not change.

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type GenerateInvoiceInput = {
  bookingId: string;
  invoiceNumber: string;
  recipientName: string;
  recipientEmail: string;
  companyName?: string;
  vatNumber?: string;
  billingAddress?: string;
  currency: string;
  lineItems: InvoiceLineItem[];
};

export type InvoiceResult = {
  provider: string;
  url: string;
  total: number;
};

export interface InvoiceProvider {
  readonly name: string;
  generate(input: GenerateInvoiceInput): Promise<InvoiceResult>;
}

function appBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

class MockInvoiceProvider implements InvoiceProvider {
  readonly name = "mock";

  async generate(input: GenerateInvoiceInput): Promise<InvoiceResult> {
    const total = input.lineItems.reduce(
      (sum, li) => sum + li.quantity * li.unitPrice,
      0,
    );
    // A fake but routable-looking document URL.
    const url = `${appBaseUrl()}/invoices/${encodeURIComponent(input.invoiceNumber)}.pdf`;
    return { provider: this.name, url, total: Math.round(total * 100) / 100 };
  }
}

// --- Swap point: replace with a real provider for production. ---
// e.g. export const invoiceProvider: InvoiceProvider = new SmartBillInvoiceProvider(...);
export const invoiceProvider: InvoiceProvider = new MockInvoiceProvider();
