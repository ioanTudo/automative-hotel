import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// GET /api/auth/session — the current signed-in user, or null.
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}
