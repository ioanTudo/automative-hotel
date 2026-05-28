import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email/email-service";
import { formatCurrency, formatDate } from "@/lib/booking-utils";
import {
  toolError,
  toolOk,
  type BookingSummaryCard,
  type ToolDefinition,
} from "@/lib/ai/types";
import { bookingReference, toBookingSummaryCard } from "@/lib/ai/tools/_shared";

const confirmationSchema = z.object({
  bookingId: z.string().min(1),
  guestEmail: z.string().email().optional(),
});

export type SendBookingConfirmationInput = z.infer<typeof confirmationSchema>;

// Represents the post-payment step: marks the booking paid + confirmed and
// emails the guest their confirmation.
export const sendBookingConfirmationEmailTool: ToolDefinition<
  SendBookingConfirmationInput,
  BookingSummaryCard
> = {
  name: "sendBookingConfirmationEmail",
  description:
    "Confirm a paid booking and email the guest their confirmation. Marks the booking as confirmed and payment as paid. Use after the guest indicates they have paid.",
  parameters: confirmationSchema,
  async execute(input) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { room: true },
    });
    if (!booking) return toolError("Booking not found.");

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED", paymentStatus: "paid" },
      include: { room: true },
    });

    const to = input.guestEmail ?? booking.guestEmail;
    await emailService.send({
      to,
      subject: `Booking confirmed — ${bookingReference(booking.id)}`,
      html: `<p>Dear ${booking.guestName},</p><p>Your booking at the ${
        booking.room.name
      } is confirmed for ${formatDate(booking.checkIn)} – ${formatDate(
        booking.checkOut,
      )}. Total paid: ${formatCurrency(booking.totalPrice, booking.currency)}.</p>`,
    });

    const card = toBookingSummaryCard(
      updated,
      updated.room.name,
      "Confirmation email sent.",
    );
    return toolOk(`Confirmation email sent to ${to}; booking confirmed.`, card, card);
  },
};

const invoiceEmailSchema = z.object({
  bookingId: z.string().min(1),
  guestEmail: z.string().email().optional(),
});

export type SendInvoiceEmailInput = z.infer<typeof invoiceEmailSchema>;

export const sendInvoiceEmailTool: ToolDefinition<SendInvoiceEmailInput, { invoiceNumber: string }> =
  {
    name: "sendInvoiceEmail",
    description:
      "Email the most recent invoice for a booking to the guest. Requires that an invoice has already been generated.",
    parameters: invoiceEmailSchema,
    async execute(input) {
      const invoice = await prisma.invoice.findFirst({
        where: { bookingId: input.bookingId },
        orderBy: { createdAt: "desc" },
      });
      if (!invoice) return toolError("No invoice has been generated for this booking yet.");

      const to = input.guestEmail ?? invoice.recipientEmail;
      await emailService.send({
        to,
        subject: `Invoice ${invoice.invoiceNumber}`,
        html: `<p>Dear ${invoice.recipientName},</p><p>Please find your invoice ${invoice.invoiceNumber} attached: <a href="${invoice.invoiceUrl}">${invoice.invoiceUrl}</a>.</p>`,
      });

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "sent" },
      });

      return toolOk(`Invoice ${invoice.invoiceNumber} emailed to ${to}.`, {
        invoiceNumber: invoice.invoiceNumber,
      });
    },
  };
