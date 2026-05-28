import type { Metadata } from "next";
import { getBookingDetail } from "@/lib/booking/booking-service";
import { SITE } from "@/lib/site";
import { PaymentClient } from "./PaymentClient";

export const metadata: Metadata = { title: "Secure payment" };

type Params = Promise<{ bookingId: string }>;

export default async function PaymentPage({ params }: { params: Params }) {
  const { bookingId } = await params;
  const booking = await getBookingDetail(bookingId);
  return <PaymentClient booking={booking} hotelName={SITE.name} />;
}
