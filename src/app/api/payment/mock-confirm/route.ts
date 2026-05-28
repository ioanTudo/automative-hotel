import { NextResponse } from "next/server";
import { z } from "zod";
import { processMockPayment } from "@/lib/payment/mock-payment-service";

// POST /api/payment/mock-confirm  { bookingId }
// Simulates a successful payment: confirms the booking, generates the invoice,
// sends the (mock) emails, and records a confirmation on the linked chat.

const schema = z.object({ bookingId: z.string().min(1) });

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "bookingId is required." }, { status: 400 });
  }

  const result = await processMockPayment(parsed.data.bookingId);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 409;
    return NextResponse.json({ ok: false, reason: result.reason }, { status });
  }

  return NextResponse.json({
    ok: true,
    alreadyPaid: result.alreadyPaid,
    card: result.card,
    invoiceUrl: result.invoiceUrl,
  });
}
