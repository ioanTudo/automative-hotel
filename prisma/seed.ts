import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(14, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function nightsBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

const rooms = [
  {
    name: "Single Room",
    slug: "single-room",
    description:
      "A cosy room for the solo traveller, with a comfortable single bed, a compact work desk and everything you need for a restful stay close to the city centre.",
    pricePerNight: 69,
    capacity: 1,
    amenities: ["Free Wi-Fi", "Smart TV", "Air conditioning", "En-suite bathroom", "Tea & coffee"],
    imageUrl: "/images/rooms/single.svg",
  },
  {
    name: "Double Room",
    slug: "double-room",
    description:
      "Our most popular room featuring a plush double bed, warm furnishings and a spacious bathroom — ideal for couples or business guests who like a little extra room.",
    pricePerNight: 95,
    capacity: 2,
    amenities: ["Free Wi-Fi", "Smart TV", "Air conditioning", "Mini-fridge", "Work desk", "Tea & coffee"],
    imageUrl: "/images/rooms/double.svg",
  },
  {
    name: "Twin Room",
    slug: "twin-room",
    description:
      "Two comfortable single beds, perfect for friends or colleagues travelling together. Bright, practical and well-equipped for a good night's sleep.",
    pricePerNight: 99,
    capacity: 2,
    amenities: ["Free Wi-Fi", "Smart TV", "Air conditioning", "En-suite bathroom", "Work desk"],
    imageUrl: "/images/rooms/twin.svg",
  },
  {
    name: "Family Room",
    slug: "family-room",
    description:
      "Generous space for the whole family with a double bed and two singles, plus thoughtful touches for children. The relaxed choice for a family city break.",
    pricePerNight: 145,
    capacity: 4,
    amenities: ["Free Wi-Fi", "Smart TV", "Air conditioning", "Mini-fridge", "Family bathroom", "Extra bedding"],
    imageUrl: "/images/rooms/family.svg",
  },
  {
    name: "Deluxe Room",
    slug: "deluxe-room",
    description:
      "Our top-tier room with a king-size bed, upgraded linens, a seating area and a rainfall shower. A touch of comfort above the everyday for a special stay.",
    pricePerNight: 175,
    capacity: 2,
    amenities: ["Free Wi-Fi", "Smart TV", "Air conditioning", "Mini-bar", "Rainfall shower", "City view", "Bathrobes"],
    imageUrl: "/images/rooms/deluxe.svg",
  },
];

async function main() {
  console.log("Seeding database...");

  // Idempotent reset (order matters due to FKs).
  await prisma.restaurantReservation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  const [adminHash, userHash] = await Promise.all([
    bcrypt.hash("Admin123!", 10),
    bcrypt.hash("Guest123!", 10),
  ]);

  const admin = await prisma.user.create({
    data: {
      name: "Hotel Administrator",
      email: "admin@automative-hotel.test",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const guest = await prisma.user.create({
    data: {
      name: "Jordan Guest",
      email: "guest@automative-hotel.test",
      passwordHash: userHash,
      role: "USER",
    },
  });

  const createdRooms = await Promise.all(
    rooms.map((room) =>
      prisma.room.create({
        data: {
          name: room.name,
          slug: room.slug,
          description: room.description,
          pricePerNight: room.pricePerNight,
          capacity: room.capacity,
          amenities: JSON.stringify(room.amenities),
          imageUrl: room.imageUrl,
          isActive: true,
        },
      }),
    ),
  );

  const bySlug = (slug: string) => createdRooms.find((r) => r.slug === slug)!;

  const exampleBookings = [
    {
      room: bySlug("double-room"),
      userId: guest.id,
      guestName: guest.name,
      guestEmail: guest.email,
      guestPhone: "+40 720 000 111",
      checkIn: daysFromNow(7),
      checkOut: daysFromNow(10),
      guests: 2,
      status: "CONFIRMED",
      specialRequests: "High floor if possible, please.",
    },
    {
      room: bySlug("family-room"),
      userId: guest.id,
      guestName: guest.name,
      guestEmail: guest.email,
      guestPhone: "+40 720 000 111",
      checkIn: daysFromNow(21),
      checkOut: daysFromNow(25),
      guests: 4,
      status: "PENDING",
      specialRequests: "Travelling with two young children.",
    },
    {
      room: bySlug("single-room"),
      userId: guest.id,
      guestName: guest.name,
      guestEmail: guest.email,
      guestPhone: "+40 720 000 111",
      checkIn: daysFromNow(40),
      checkOut: daysFromNow(42),
      guests: 1,
      status: "CANCELLED",
      specialRequests: null,
    },
    {
      room: bySlug("deluxe-room"),
      userId: null,
      guestName: "Walk-in Visitor",
      guestEmail: "visitor@example.com",
      guestPhone: "+40 730 555 222",
      checkIn: daysFromNow(14),
      checkOut: daysFromNow(16),
      guests: 2,
      status: "CONFIRMED",
      specialRequests: null,
    },
  ];

  for (const b of exampleBookings) {
    await prisma.booking.create({
      data: {
        userId: b.userId,
        roomId: b.room.id,
        guestName: b.guestName,
        guestEmail: b.guestEmail,
        guestPhone: b.guestPhone,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        guests: b.guests,
        totalPrice: nightsBetween(b.checkIn, b.checkOut) * b.room.pricePerNight,
        status: b.status,
        specialRequests: b.specialRequests,
      },
    });
  }

  await prisma.restaurantReservation.create({
    data: {
      userId: guest.id,
      name: guest.name,
      email: guest.email,
      phone: "+40 720 000 111",
      date: daysFromNow(5),
      time: "19:30",
      guests: 2,
      message: "Window table if available.",
      status: "CONFIRMED",
    },
  });

  console.log(
    `Seeded: 2 users (admin: ${admin.email}, user: ${guest.email}), ${createdRooms.length} rooms, ${exampleBookings.length} bookings, 1 restaurant reservation.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
