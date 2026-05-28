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
    amenities: [
      "Free Wi-Fi",
      "Smart TV",
      "Air conditioning",
      "En-suite bathroom",
      "Tea & coffee",
    ],
    imageUrl: "/images/rooms/single.svg",
  },
  {
    name: "Double Room",
    slug: "double-room",
    description:
      "Our most popular room featuring a plush double bed, warm furnishings and a spacious bathroom — ideal for couples or business guests who like a little extra room.",
    pricePerNight: 95,
    capacity: 2,
    amenities: [
      "Free Wi-Fi",
      "Smart TV",
      "Air conditioning",
      "Mini-fridge",
      "Work desk",
      "Tea & coffee",
    ],
    imageUrl: "/images/rooms/double.svg",
  },
  {
    name: "Twin Room",
    slug: "twin-room",
    description:
      "Two comfortable single beds, perfect for friends or colleagues travelling together. Bright, practical and well-equipped for a good night's sleep.",
    pricePerNight: 99,
    capacity: 2,
    amenities: [
      "Free Wi-Fi",
      "Smart TV",
      "Air conditioning",
      "En-suite bathroom",
      "Work desk",
    ],
    imageUrl: "/images/rooms/twin.svg",
  },
  {
    name: "Family Room",
    slug: "family-room",
    description:
      "Generous space for the whole family with a double bed and two singles, plus thoughtful touches for children. The relaxed choice for a family city break.",
    pricePerNight: 145,
    capacity: 4,
    amenities: [
      "Free Wi-Fi",
      "Smart TV",
      "Air conditioning",
      "Mini-fridge",
      "Family bathroom",
      "Extra bedding",
    ],
    imageUrl: "/images/rooms/family.svg",
  },
  {
    name: "Deluxe Room",
    slug: "deluxe-room",
    description:
      "Our top-tier room with a king-size bed, upgraded linens, a seating area and a rainfall shower. A touch of comfort above the everyday for a special stay.",
    pricePerNight: 175,
    capacity: 2,
    amenities: [
      "Free Wi-Fi",
      "Smart TV",
      "Air conditioning",
      "Mini-bar",
      "Rainfall shower",
      "City view",
      "Bathrobes",
    ],
    imageUrl: "/images/rooms/deluxe.svg",
  },
];

async function main() {
  console.log("Seeding database...");

  // Idempotent reset (order matters due to FKs).
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.restaurantReservation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();
  await prisma.knowledgeBaseItem.deleteMany();
  await prisma.hotel.deleteMany();

  const hotel = await prisma.hotel.create({
    data: {
      name: "Automative Hotel",
      address: "12 Garden Avenue, Cluj-Napoca 400001, Romania",
      phone: "+40 264 555 100",
      email: "stay@automative-hotel.test",
      checkInTime: "3:00 PM",
      checkOutTime: "11:00 AM",
      parkingInfo:
        "Free on-site parking is available for all guests on a first-come, first-served basis. There is no need to reserve a space in advance.",
      wifiInfo:
        "Complimentary high-speed Wi-Fi is available throughout the hotel, including all rooms and public areas. The network name and password are provided at check-in.",
      breakfastInfo:
        "Breakfast is served in The Garden Table restaurant from 07:00 to 10:30 each morning. A continental and hot buffet is included with most rates.",
      petPolicy:
        "We are a pet-friendly hotel. Well-behaved dogs are welcome for a small additional cleaning fee of €15 per night. Please let us know in advance.",
      childrenPolicy:
        "Children of all ages are welcome. Children under 6 stay free when sharing existing bedding. Cots and extra beds are available on request.",
      cancellationPolicy:
        "Free cancellation up to 48 hours before check-in. Cancellations made within 48 hours of arrival are charged the first night. No-shows are charged the full stay.",
      paymentPolicy:
        "We accept all major credit and debit cards, as well as secure online payment links. A payment link is sent after booking; the balance can also be settled at the property.",
      invoiceInfo:
        "VAT invoices and proforma invoices can be issued on request. Please provide the company name, VAT number and billing address and we will email the invoice after payment.",
    },
  });

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
        paymentStatus: b.status === "CONFIRMED" ? "paid" : "unpaid",
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

  const knowledgeBase = [
    {
      title: "Location & directions",
      category: "location",
      content:
        "Automative Hotel is at 12 Garden Avenue, Cluj-Napoca 400001, Romania — a 10-minute walk from the old town and 20 minutes by car from Cluj-Napoca International Airport. The nearest tram stop is Garden Square (2 minutes on foot).",
    },
    {
      title: "Check-in & check-out times",
      category: "policies",
      content:
        "Check-in is from 3:00 PM and check-out is until 11:00 AM. Early check-in and late check-out can be arranged on request, subject to availability and a possible fee. Luggage storage is free before check-in and after check-out.",
    },
    {
      title: "Parking",
      category: "facilities",
      content:
        "Free on-site parking is available to all guests on a first-come, first-served basis. No advance reservation is required. There are two accessible spaces near the main entrance.",
    },
    {
      title: "Wi-Fi",
      category: "facilities",
      content:
        "Complimentary high-speed Wi-Fi covers every room and all public areas. The network name and password are printed on your key card holder at check-in.",
    },
    {
      title: "Breakfast",
      category: "restaurant",
      content:
        "Breakfast is served in The Garden Table from 07:00 to 10:30. It includes a continental spread plus hot dishes cooked to order, and is included with most room rates.",
    },
    {
      title: "Restaurant hours",
      category: "restaurant",
      content:
        "The Garden Table serves breakfast 07:00–10:30, lunch 12:00–15:00 and dinner 18:00–22:30. Room service is available during these hours. Vegetarian, vegan and children's menus are available, and allergens can be catered for with notice.",
    },
    {
      title: "Pets policy",
      category: "policies",
      content:
        "We are pet-friendly. Well-behaved dogs are welcome for a €15 per night cleaning fee. Please tell us in advance so we can prepare your room.",
    },
    {
      title: "Children policy",
      category: "policies",
      content:
        "Children of all ages are welcome. Under 6s stay free using existing bedding. Cots and extra beds are available on request, and the Family Room sleeps up to four.",
    },
    {
      title: "Cancellation policy",
      category: "policies",
      content:
        "Free cancellation up to 48 hours before check-in. Within 48 hours the first night is charged; no-shows are charged the full stay. Refunds for prepaid bookings are processed to the original payment method within 5–10 business days.",
    },
    {
      title: "Payment methods & invoices",
      category: "billing",
      content:
        "We accept all major credit and debit cards and secure online payment links. After booking you receive a payment link by email. VAT and proforma invoices are available — provide your company name, VAT number and billing address and we will email the invoice after payment.",
    },
    {
      title: "Local attractions",
      category: "location",
      content:
        "Within walking distance you'll find Cluj's old town, the Botanical Garden, St. Michael's Church and Central Park. The reception team is happy to recommend restaurants, day trips and book taxis or tours.",
    },
    {
      title: "Hotel rules",
      category: "policies",
      content:
        "Quiet hours are 22:00–07:00. The whole hotel is non-smoking; a designated smoking area is in the garden. Please treat staff and other guests with respect — we want everyone to feel at home.",
    },
  ];

  await Promise.all(
    knowledgeBase.map((item) =>
      prisma.knowledgeBaseItem.create({
        data: { hotelId: hotel.id, isActive: true, ...item },
      }),
    ),
  );

  // A sample escalated conversation + urgent ticket so the admin dashboard has data.
  const conversation = await prisma.aIConversation.create({
    data: {
      hotelId: hotel.id,
      guestEmail: "visitor@example.com",
      status: "escalated",
      messages: {
        create: [
          {
            role: "user",
            content:
              "The air conditioning in room 204 has stopped working and it's really hot.",
          },
          {
            role: "assistant",
            content:
              "I'm very sorry about that. I've logged an urgent maintenance request for room 204 and notified our team — someone will be with you shortly.",
          },
        ],
      },
    },
  });

  await prisma.supportTicket.create({
    data: {
      hotelId: hotel.id,
      conversationId: conversation.id,
      type: "maintenance",
      priority: "urgent",
      status: "open",
      roomNumber: "204",
      guestName: "Visitor",
      message:
        "Air conditioning not working in room 204 — guest reports the room is very hot.",
    },
  });

  console.log(
    `Seeded: hotel "${hotel.name}", 2 users (admin: ${admin.email}, user: ${guest.email}), ${createdRooms.length} rooms, ${exampleBookings.length} bookings, 1 restaurant reservation, ${knowledgeBase.length} knowledge base items, 1 escalated conversation + urgent ticket.`,
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
