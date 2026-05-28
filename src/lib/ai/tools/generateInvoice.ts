import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { invoiceProvider } from "@/lib/invoices/invoice-provider";
import { calculateNights } from "@/lib/booking-utils";
import {
  toolError,
  toolOk,
  type InvoiceCard,
  type ToolDefinition,
} from "@/lib/ai/types";
import { invoiceNumber } from "@/lib/ai/tools/_shared";

const schema = z.object({
  bookingId: z.string().min(1),
  companyName: z.string().optional(),
  vatNumber: z.string().optional(),
  billingAddress: z.string().optional(),
});

export type GenerateInvoiceInput = z.infer<typeof schema>;

export const generateInvoiceTool: ToolDefinition<GenerateInvoiceInput, InvoiceCard> = {
  name: "generateInvoice",
  description:
    "Generate a proforma/VAT invoice for a booking. Optionally include company name, VAT number and billing address. Returns a downloadable invoice URL.",
  parameters: schema,
  async execute(input) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { room: true },
    });
    if (!booking) return toolError("Booking not found.");

    const nights = calculateNights(booking.checkIn, booking.checkOut);
    const number = invoiceNumber();

    const result = await invoiceProvider.generate({
      bookingId: booking.id,
      invoiceNumber: number,
      recipientName: booking.guestName,
      recipientEmail: booking.guestEmail,
      companyName: input.companyName,
      vatNumber: input.vatNumber,
      billingAddress: input.billingAddress,
      currency: booking.currency,
      lineItems: [
        {
          description: `${booking.room.name} — ${nights} night(s)`,
          quantity: nights,
          unitPrice: booking.room.pricePerNight,
        },
      ],
    });

    await prisma.invoice.create({
      data: {
        bookingId: booking.id,
        invoiceNumber: number,
        invoiceUrl: result.url,
        status: "issued",
        recipientName: booking.guestName,
        recipientEmail: booking.guestEmail,
        companyName: input.companyName ?? null,
        vatNumber: input.vatNumber ?? null,
        billingAddress: input.billingAddress ?? null,
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { invoiceUrl: result.url },
    });

    const card: InvoiceCard = {
      type: "invoice",
      invoiceNumber: number,
      url: result.url,
      total: result.total,
      currency: booking.currency,
      recipientName: booking.guestName,
      recipientEmail: booking.guestEmail,
    };

    return toolOk(`Invoice ${number} generated for ${result.total} ${booking.currency}.`, card, card);
  },
};
