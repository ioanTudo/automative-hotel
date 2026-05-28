import { NextResponse } from "next/server";
import { getActiveRooms } from "@/lib/queries";

// GET /api/rooms — list active, bookable rooms.
export async function GET() {
  const rooms = await getActiveRooms();
  return NextResponse.json({ rooms });
}
