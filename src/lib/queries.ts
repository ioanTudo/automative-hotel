import { prisma } from "@/lib/prisma";
import { parseAmenities } from "@/lib/booking-utils";

// Read helpers used by Server Components. Not server actions — plain async
// functions that query Prisma and shape the data for the UI.

export type RoomView = {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  imageUrl: string;
  isActive: boolean;
};

type RoomRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  amenities: string;
  imageUrl: string;
  isActive: boolean;
};

function toRoomView(room: RoomRecord): RoomView {
  return {
    id: room.id,
    name: room.name,
    slug: room.slug,
    description: room.description,
    pricePerNight: room.pricePerNight,
    capacity: room.capacity,
    amenities: parseAmenities(room.amenities),
    imageUrl: room.imageUrl,
    isActive: room.isActive,
  };
}

export async function getActiveRooms(): Promise<RoomView[]> {
  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    orderBy: { pricePerNight: "asc" },
  });
  return rooms.map(toRoomView);
}

export async function getAllRooms(): Promise<RoomView[]> {
  const rooms = await prisma.room.findMany({ orderBy: { createdAt: "asc" } });
  return rooms.map(toRoomView);
}

export async function getFeaturedRooms(limit = 3): Promise<RoomView[]> {
  const rooms = await getActiveRooms();
  return rooms.slice(0, limit);
}

export async function getRoomBySlug(slug: string): Promise<RoomView | null> {
  const room = await prisma.room.findUnique({ where: { slug } });
  return room ? toRoomView(room) : null;
}

export async function getRoomById(id: string): Promise<RoomView | null> {
  const room = await prisma.room.findUnique({ where: { id } });
  return room ? toRoomView(room) : null;
}

export async function getUserBookings(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    include: { room: true },
    orderBy: { checkIn: "asc" },
  });
}

export async function getAllBookings() {
  return prisma.booking.findMany({
    include: { room: true, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAllReservations() {
  return prisma.restaurantReservation.findMany({
    orderBy: { date: "asc" },
  });
}

// --- AI Front Desk admin reads ---

export async function getAllTickets() {
  return prisma.supportTicket.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function getAllConversations() {
  return prisma.aIConversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getConversationById(id: string) {
  return prisma.aIConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function getAllKnowledgeBase() {
  return prisma.knowledgeBaseItem.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
}

/** Non-cancelled future bookings for a room — used for availability checks. */
export async function getRoomBookedRanges(roomId: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      status: { not: "CANCELLED" },
      checkOut: { gte: new Date() },
    },
    select: { checkIn: true, checkOut: true },
    orderBy: { checkIn: "asc" },
  });
  return bookings;
}
