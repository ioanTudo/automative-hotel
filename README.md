# Automative Hotel

A premium-but-realistic website and booking system for a **3-star hotel with a restaurant**, built with the Next.js App Router. This is an MVP, structured cleanly so it can grow into a production app (payments, real AI, email, hosted DB).

## Features

- **Homepage** — hero, availability search, featured rooms, restaurant preview, facilities, testimonials, contact CTA.
- **Rooms** — listing (`/rooms`) and detail pages (`/rooms/[slug]`) with gallery placeholders, amenities and an availability calendar.
- **Booking system** — date validation, capacity checks, overlap (double-booking) prevention, automatic price calculation and a review-before-confirm flow.
- **User accounts** — register, login, logout (credentials auth with hashed passwords + signed session cookie).
- **My bookings** (`/account/bookings`) — protected page to view and cancel bookings.
- **Restaurant** (`/restaurant`) — about, opening hours, menu preview, offers and a table reservation form.
- **Contact** (`/contact`) — details, opening hours, map placeholder and a contact form.
- **Admin dashboard** (`/admin`) — admin-only: manage bookings (update status), full room CRUD, view users and restaurant reservations.
- **AI assistant bubble** — floating bottom-right chat on every page with mocked, keyword-based replies (modular, ready to wire to a real API).

## Tech stack

- **Next.js 16** (App Router, React Server Components, Server Actions) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Prisma 7** ORM with **SQLite** (via the `better-sqlite3` driver adapter) for local development
- **Zod** for validation, **React Hook Form** for forms
- **date-fns** for date handling
- **bcryptjs** + **jose** (JWT) for the credentials-based auth

## Project structure

```text
src/
  app/                     # routes (pages + API route handlers)
    api/
      auth/session/        # GET current session user
      bookings/availability/ # GET booked ranges / availability check
      rooms/               # GET active rooms
    rooms/[slug]/          # room detail
    account/bookings/      # protected "my bookings"
    admin/                 # admin dashboard
    ...
  components/
    layout/  hotel/  booking/  restaurant/  contact/  account/  admin/  ai/  ui/
  lib/
    prisma.ts              # Prisma client singleton (better-sqlite3 adapter)
    auth.ts                # password hashing + session cookie helpers
    booking-utils.ts       # nights, total price, date validation, overlap
    validations.ts         # Zod schemas
    queries.ts             # read helpers for Server Components
    actions/               # server actions (auth, bookings, admin, restaurant, contact)
  generated/prisma/        # generated Prisma client (gitignored)
prisma/
  schema.prisma            # data models
  seed.ts                  # seed data
prisma.config.ts           # Prisma 7 config (schema, migrations, seed)
```

## Data models

`User` (role `USER` | `ADMIN`), `Room`, `Booking` (status `PENDING` | `CONFIRMED` | `CANCELLED`) and `RestaurantReservation`. SQLite has no native enums/arrays, so roles/statuses are stored as strings (validated in app code) and room `amenities` is a JSON-encoded string.

### Booking rules

Implemented in `src/lib/booking-utils.ts` and enforced in `src/lib/actions/bookings.ts`:
- check-out must be after check-in and check-in cannot be in the past
- guests cannot exceed room capacity
- no overlapping bookings — a new booking conflicts when `newCheckIn < existingCheckOut && newCheckOut > existingCheckIn` (cancelled bookings ignored)
- total price = nights × nightly rate

## Getting started

### 1. Requirements

- Node.js 20+ (developed on Node 24)
- npm

### 2. Environment
Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="replace-me"   # generate one: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Install, set up the database, and run

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Then open <http://localhost:3000>.

> Notes for Prisma 7: configuration lives in `prisma.config.ts` (not `package.json`), the client is generated to `src/generated/prisma`, and the SQLite connection uses the `better-sqlite3` driver adapter. `prisma migrate dev` also generates the client, and `prisma db seed` runs `prisma/seed.ts` via `tsx`.

## Test credentials

After seeding:

| Role  | Email                          | Password    |
| ----- | ------------------------------ | ----------- |
| Admin | `admin@automative-hotel.test`  | `Admin123!` |
| User  | `guest@automative-hotel.test`  | `Guest123!` |

The seed also creates 5 room types (Single, Double, Twin, Family, Deluxe), several example bookings and a restaurant reservation.

## API routes

- `GET /api/rooms` — list active rooms
- `GET /api/bookings/availability?roomId=&checkIn=&checkOut=` — booked ranges and, when dates are given, availability for those dates
- `GET /api/auth/session` — the current signed-in user (or `null`)

Mutations (register, login, logout, create/cancel booking, admin actions, reservations) are implemented as **server actions** in `src/lib/actions/`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint with ESLint |
| `npx prisma studio` | Browse the database |
| `npx prisma migrate dev` | Apply schema changes |
| `npx prisma db seed` | Seed the database |

## Built for the future

The MVP is intentionally structured so you can add, without rework:

- **Payments** — booking total is already computed; add a checkout step in the booking action.
- **Real AI** — replace `getMockReply` in `src/lib/ai-mock.ts` with a call to your AI endpoint; the chat UI is unchanged.
- **Email notifications** — hook into the booking / reservation / contact server actions.
- **Production database** — swap the SQLite datasource + driver adapter (e.g. Postgres) in `schema.prisma` and `src/lib/prisma.ts`.
- **Auth.js** — the small `lib/auth.ts` surface can be replaced with Auth.js without touching call sites.
