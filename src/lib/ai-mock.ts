// Mock AI assistant. Pure keyword matching for the MVP — no network calls.
// Swap `getMockReply` for a real API call (e.g. POST /api/ai) later without
// changing the chat UI components.

import { SITE } from "@/lib/site";

export const AI_GREETING =
  "Hi! I'm your hotel assistant. I can help you with rooms, bookings, restaurant hours, and hotel facilities.";

export const AI_SUGGESTIONS = [
  "What rooms do you have?",
  "What are the restaurant hours?",
  "When is check-in?",
  "Do you have parking and Wi-Fi?",
];

export function getMockReply(message: string): string {
  const text = message.toLowerCase();
  const has = (...words: string[]) => words.some((w) => text.includes(w));

  if (has("hello", "hi ", "hey", "good morning", "good evening")) {
    return "Hello! How can I help with your stay today? You can ask me about rooms, bookings, the restaurant or hotel facilities.";
  }

  if (
    has("room", "book", "booking", "availab", "reserve a room", "stay", "night", "suite")
  ) {
    return "We offer Single, Double, Twin, Family and Deluxe rooms from €69/night. You can browse them on the Rooms page and check availability, then book in just a minute on the Booking page.";
  }

  if (has("restaurant", "menu", "food", "dinner", "lunch", "breakfast", "dining", "eat")) {
    const hours = SITE.restaurant.hours.map((h) => `${h.day} ${h.time}`).join(", ");
    return `Our restaurant, ${SITE.restaurant.name}, serves ${hours}. Take a look at the Restaurant page for the menu preview, or reserve a table there.`;
  }

  if (has("check-in", "checkin", "check in", "check-out", "checkout", "check out", "arrival")) {
    return `Check-in is from ${SITE.checkInTime} and check-out is until ${SITE.checkOutTime}. Early check-in or late check-out can be arranged on request, subject to availability.`;
  }

  if (
    has("parking", "wifi", "wi-fi", "facilit", "amenit", "gym", "pool", "breakfast included", "luggage")
  ) {
    return "Yes — we offer free Wi-Fi throughout the hotel, on-site parking, 24-hour reception, daily housekeeping and luggage storage. Breakfast is available in the restaurant each morning.";
  }

  if (has("price", "cost", "how much", "rate", "cheap", "expensive")) {
    return "Room rates start at €69/night for a Single and go up to €175/night for our Deluxe Room. The total for your stay is calculated automatically as nights × nightly rate when you book.";
  }

  if (has("contact", "phone", "address", "location", "where", "map", "directions")) {
    return `You'll find us at ${SITE.address}. Call us on ${SITE.phone} or visit the Contact page for the map and opening hours.`;
  }

  if (has("cancel", "refund", "change my booking")) {
    return "You can cancel a pending or confirmed booking from the My Bookings page once you're signed in. Need anything else?";
  }

  return "I can help with rooms and bookings, restaurant hours, check-in/check-out times, and facilities like parking and Wi-Fi. What would you like to know?";
}
