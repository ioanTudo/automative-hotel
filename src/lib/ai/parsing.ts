// Lightweight natural-language parsing for the mock agent: dates, guest counts,
// contact details, budget, sentiment and ticket classification. A real LLM
// integration would replace most of this with model understanding, but the same
// extracted slots feed the same tools.

import { addDays, format, isValid, nextDay, parse } from "date-fns";

function iso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseGuests(text: string): number | undefined {
  const t = text.toLowerCase();
  const adults = t.match(/(\d+)\s*adult/);
  const children = t.match(/(\d+)\s*(?:child|children|kid|kids)/);
  if (adults || children) {
    return (adults ? Number(adults[1]) : 0) + (children ? Number(children[1]) : 0);
  }
  const generic = t.match(/(\d+)\s*(?:guest|guests|people|persons|person|pax|adults?)/);
  if (generic) return Number(generic[1]);
  // "for 2" but not "for 2 nights"
  const forN = t.match(/\bfor\s+(\d+)\b(?!\s*night)/);
  if (forN) return Number(forN[1]);
  return undefined;
}

export function parseNights(text: string): number | undefined {
  const m = text.toLowerCase().match(/(\d+)\s*night/);
  return m ? Number(m[1]) : undefined;
}

function tryParseExplicitDate(token: string): Date | undefined {
  const formats = ["yyyy-MM-dd", "dd/MM/yyyy", "dd.MM.yyyy", "dd-MM-yyyy", "d/M/yyyy"];
  for (const f of formats) {
    const d = parse(token, f, new Date());
    if (isValid(d)) return d;
  }
  return undefined;
}

export type ParsedDates = { checkIn?: string; checkOut?: string };

export function parseDates(text: string): ParsedDates {
  const t = text.toLowerCase();
  const now = new Date();

  // Explicit date tokens (ISO or dd/mm/yyyy style).
  const tokens = text.match(/\d{4}-\d{2}-\d{2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/g) ?? [];
  const dates = tokens
    .map(tryParseExplicitDate)
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime());

  const nights = parseNights(text);

  if (dates.length >= 2) return { checkIn: iso(dates[0]), checkOut: iso(dates[1]) };
  if (dates.length === 1) {
    const checkIn = dates[0];
    const checkOut = nights ? addDays(checkIn, nights) : undefined;
    return { checkIn: iso(checkIn), checkOut: checkOut ? iso(checkOut) : undefined };
  }

  // Relative phrases.
  if (/\btomorrow\b/.test(t)) {
    const checkIn = addDays(now, 1);
    return { checkIn: iso(checkIn), checkOut: iso(addDays(checkIn, nights ?? 1)) };
  }
  if (/\btonight\b|\btoday\b/.test(t)) {
    return { checkIn: iso(now), checkOut: iso(addDays(now, nights ?? 1)) };
  }
  if (/\bnext weekend\b/.test(t)) {
    const sat = addDays(nextDay(now, 6), 7);
    return { checkIn: iso(sat), checkOut: iso(addDays(sat, 2)) };
  }
  if (/\bweekend\b/.test(t)) {
    const sat = nextDay(now, 6);
    return { checkIn: iso(sat), checkOut: iso(addDays(sat, 2)) };
  }

  return {};
}

export function parseEmail(text: string): string | undefined {
  const m = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  return m ? m[0] : undefined;
}

export function parsePhone(text: string): string | undefined {
  const m = text.match(/\+?\d[\d\s().-]{6,}\d/);
  return m ? m[0].trim() : undefined;
}

export function parseTime(text: string): string | undefined {
  const m = text.match(/\b(\d{1,2})[:.](\d{2})\s*(am|pm)?\b/i);
  if (m) {
    let h = Number(m[1]);
    const min = m[2];
    const ap = m[3]?.toLowerCase();
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${min}`;
  }
  const ampm = text.match(/\b(\d{1,2})\s*(am|pm)\b/i);
  if (ampm) {
    let h = Number(ampm[1]);
    const ap = ampm[2].toLowerCase();
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:00`;
  }
  return undefined;
}

export function parseBudget(text: string): number | undefined {
  const m =
    text.match(/(?:under|below|max|maximum|budget|less than|up to)\s*[€$£]?\s*(\d+)/i) ??
    text.match(/[€$£]\s?(\d+)/);
  return m ? Number(m[1]) : undefined;
}

const STRONG_NEGATIVE = [
  "angry", "furious", "terrible", "awful", "unacceptable", "disgusting", "worst",
  "ridiculous", "horrible", "rude", "appalling", "never again", "disappointed",
  "disappointing", "complaint", "complain", "outrageous", "filthy", "scam",
];

export function isNegativeSentiment(text: string): boolean {
  const t = text.toLowerCase();
  return STRONG_NEGATIVE.some((w) => t.includes(w)) || /!{2,}/.test(text);
}

export type TicketType =
  | "housekeeping"
  | "maintenance"
  | "restaurant"
  | "billing"
  | "complaint"
  | "general";

export function classifyTicketType(text: string): TicketType {
  const t = text.toLowerCase();
  const has = (...w: string[]) => w.some((x) => t.includes(x));

  if (isNegativeSentiment(text) || has("noise", "noisy", "dirty", "smell")) {
    if (has("noise", "noisy", "rude", "dirty", "smell", "unhappy")) return "complaint";
  }
  if (
    has("ac", "air conditioning", "air-con", "aircon", "tv", "television", "heating",
      "broken", "not working", "doesn't work", "does not work", "leak", "light",
      "bulb", "repair", "fix", "remote", "shower", "hot water", "cold")
  ) {
    return "maintenance";
  }
  if (
    has("towel", "towels", "clean", "cleaning", "pillow", "blanket", "sheet", "soap",
      "toiletries", "iron", "hair dryer", "hairdryer", "make up", "housekeeping",
      "amenities", "water bottle")
  ) {
    return "housekeeping";
  }
  if (has("room service", "menu", "food", "breakfast", "dinner", "meal", "restaurant")) {
    return "restaurant";
  }
  if (has("invoice", "bill", "charge", "charged", "payment", "refund", "receipt")) {
    return "billing";
  }
  if (has("complaint", "complain")) return "complaint";
  return "general";
}

export function parsePriority(text: string): "low" | "medium" | "high" | "urgent" {
  const t = text.toLowerCase();
  if (isNegativeSentiment(text) || /\b(urgent|emergency|asap|immediately|now)\b/.test(t)) {
    return "urgent";
  }
  if (/\b(soon|today|quickly)\b/.test(t)) return "high";
  return "medium";
}
