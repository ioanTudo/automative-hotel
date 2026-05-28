// Central hotel/site metadata reused across header, footer, contact, etc.

export const SITE = {
  name: "Automative Hotel",
  shortName: "Automative",
  rating: 3,
  tagline: "Warm, easy comfort in the heart of the city",
  description:
    "A friendly 3-star hotel and restaurant offering comfortable rooms, honest prices and genuine hospitality — perfect for business trips, weekend breaks and family stays.",
  address: "12 Garden Avenue, Cluj-Napoca 400001, Romania",
  phone: "+40 264 555 100",
  email: "stay@automative-hotel.test",
  checkInTime: "3:00 PM",
  checkOutTime: "11:00 AM",
  restaurant: {
    name: "The Garden Table",
    phone: "+40 264 555 120",
    hours: [
      { day: "Breakfast", time: "07:00 – 10:30" },
      { day: "Lunch", time: "12:00 – 15:00" },
      { day: "Dinner", time: "18:00 – 22:30" },
    ],
  },
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Rooms" },
  { href: "/restaurant", label: "Restaurant" },
  { href: "/booking", label: "Booking" },
  { href: "/contact", label: "Contact" },
] as const;
