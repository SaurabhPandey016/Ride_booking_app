<div align="center">

<a href="https://readme-typing-svg.demolab.com">
  <img src="https://readme-typing-svg.demolab.com?font=Space+Grotesk&weight=700&size=32&duration=2800&pause=900&color=EF4444&center=true&vCenter=true&width=820&lines=RideX+-+Ride-hailing%2C+reimagined" alt="RideX - Ride-hailing, reimagined" />
</a>

<p><strong>A real-time ride-hailing experience built with Next.js, Express, Prisma, Socket.io, Stripe, and OpenStreetMap.</strong></p>

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io)](https://socket.io/)
[![Stripe](https://img.shields.io/badge/Stripe-test_payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

<a href="https://example.com/ridex-live-demo">Live demo (placeholder)</a>
&nbsp; · &nbsp;
<a href="https://example.com/ridex-demo-video">Product video (placeholder)</a>

</div>

## Overview

RideX is a full-stack ride-hailing demo for riders and drivers. Riders can search for places, estimate a route and fare, request a trip, follow ride status in real time, pay with Stripe, review their driver, and view a printable receipt. Drivers can go online, receive nearby ride requests, manage trip status, broadcast location, and view earnings.

The application is organized as an npm-workspaces monorepo: a Next.js App Router client and an Express API with Socket.io, Prisma, and PostgreSQL. Map searches and routing are requested through the API, which uses Nominatim and OSRM. Prices are calculated in integer paise; the app also displays USD conversions using a configured exchange-rate value.

> **Demo links:** The live demo and video URLs above are placeholders. Replace them with published links when available.

## Screenshots

Add captures to `docs/screenshots/` using the filenames below, then the table can be updated to embed the images.

| Surface | Screenshot placeholder |
| --- | --- |
| Landing page | `docs/screenshots/landing.png` |
| Rider booking and map | `docs/screenshots/booking.png` |
| Driver dashboard | `docs/screenshots/driver-dashboard.png` |
| Live ride and payment | `docs/screenshots/live-ride.png` |
| History and printable receipt | `docs/screenshots/history-receipt.png` |

## Features

### 🧍 Rider
- Cookie-based account registration and sign-in, with rider or driver roles.
- Place search, reverse geocoding, route preview, and fare estimates for four vehicle classes.
- Ride request, live status updates, driver details, and trip history.
- Stripe test-mode payment, post-payment driver review, and participant-only receipts.

### 🚘 Driver
- Online/offline status and location-based nearby requests.
- Race-safe ride acceptance, decline handling, and trip lifecycle actions.
- Earnings summaries and driver rating/profile details.
- Live location updates for an accepted ride.

### 🗺️ Platform
- Socket.io rooms and authenticated real-time events.
- Nominatim geocoding and OSRM routing proxied through Express.
- INR/USD display and Stripe payment currency selection.
- Responsive dark UI, accessible controls, skeletons, and printable receipt styling.

## Tech stack

| Area | Technology |
| --- | --- |
| Web application | Next.js 14 App Router, React 18, TypeScript |
| UI | Tailwind CSS, Radix primitives, shadcn-style components, lucide-react, Framer Motion |
| Client data and forms | Axios, Zustand, React Hook Form, Zod |
| Maps | Leaflet, React Leaflet, OpenStreetMap tiles, Nominatim, OSRM |
| API | Node.js, Express 4, TypeScript (ESM) |
| Real time | Socket.io |
| Persistence | PostgreSQL, Prisma |
| Payments | Stripe test-mode PaymentIntents and webhooks |
| Validation | Zod |

## Architecture

```mermaid
flowchart LR
  RiderDriver["Rider / Driver browser"]
  Client["Next.js client"]
  API["Express REST API"]
  Socket["Socket.io"]
  Prisma["Prisma Client"]
  DB[("Supabase PostgreSQL")]
  Stripe["Stripe"]
  Geo["Nominatim geocoding"]
  Route["OSRM routing"]

  RiderDriver --> Client
  Client -->|"HTTP + httpOnly cookie"| API
  Client <-->|"authenticated events"| Socket
  API <--> Socket
  API --> Prisma --> DB
  API -->|"PaymentIntent + webhook"| Stripe
  API -->|"cached, queued geocoding"| Geo
  API -->|"route geometry and estimates"| Route
```

The Prisma datasource uses `DATABASE_URL` for pooled connections and `DIRECT_URL` for direct database operations such as migrations. Keep both values private.

## Ride lifecycle

```mermaid
stateDiagram-v2
  [*] --> REQUESTED
  REQUESTED --> ACCEPTED
  REQUESTED --> CANCELLED
  ACCEPTED --> ARRIVED
  ACCEPTED --> CANCELLED
  ARRIVED --> IN_PROGRESS
  ARRIVED --> CANCELLED
  IN_PROGRESS --> COMPLETED
  COMPLETED --> [*]
  CANCELLED --> [*]
```

## Repository structure

```text
ridex/
├── client/
│   ├── src/app/                 # App Router pages and route-level UI
│   ├── src/components/          # UI, layout, booking, ride, driver, and shared features
│   ├── src/hooks/               # Auth and currency hooks
│   ├── src/lib/                 # API, formatting, sockets, and utilities
│   ├── src/store/               # Zustand auth state
│   └── README.md
├── server/
│   ├── prisma/                  # Schema, migrations, and seed
│   ├── scripts/                 # API/socket/payment smoke test
│   ├── src/config/              # Environment, Prisma, and Stripe clients
│   ├── src/controllers/         # HTTP request handlers
│   ├── src/middlewares/         # Authentication, rate limits, and errors
│   ├── src/routes/              # REST route registration
│   ├── src/services/            # Business logic and integrations
│   ├── src/sockets/             # Socket.io server and event types
│   ├── src/validators/          # Zod schemas
│   └── README.md
├── .env.example                 # Server environment template
├── package.json                 # npm workspaces and root scripts
└── README.md
```

## Getting started

### Prerequisites

- Node.js 20 or newer and npm.
- A PostgreSQL database. Supabase is supported; local PostgreSQL also works.
- A Stripe test-mode secret key for payment and smoke-test flows.
- Network access to Nominatim and OSRM for geocoding and routing.

### Configure environment

Copy the root `.env.example` to `server/.env` and `client/.env.example` to `client/.env.local`. Set real database credentials and Stripe test keys in `server/.env`; do not commit secrets. Configure `CLIENT_URL` to the exact client origin used by the browser.

**Server** (`server/.env`):

| Variable | Required | Default / purpose |
| --- | --- | --- |
| `PORT` | No | `4000`; Express and Socket.io port |
| `NODE_ENV` | No | `development`; set `production` for production cookie security |
| `JWT_SECRET` | Yes for deployment | Development fallback exists; use a long, random secret outside local development |
| `CLIENT_URL` | Yes for browser use | `http://localhost:3000`; exact CORS origin, credentials enabled |
| `DATABASE_URL` | Yes | PostgreSQL connection URL, usually the pooled Supabase URL |
| `DIRECT_URL` | Yes | Direct PostgreSQL URL used by Prisma migrations |
| `USD_INR_RATE` | No | `83`; conversion value used for displayed USD and USD payments |
| `NOMINATIM_BASE_URL` | No | `https://nominatim.openstreetmap.org` |
| `NOMINATIM_USER_AGENT` | Recommended | Identifying User-Agent for Nominatim requests |
| `NOMINATIM_COUNTRYCODES` | No | Optional country-code filter, for example `in` |
| `OSRM_BASE_URL` | No | `https://router.project-osrm.org` |
| `STRIPE_SECRET_KEY` | Required for payments | Stripe test secret key, such as an `sk_test_...` key |
| `STRIPE_WEBHOOK_SECRET` | Required for webhook verification | Signing secret from Stripe CLI or the configured webhook endpoint |

**Client** (`client/.env.local`):

| Variable | Required | Default / purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:4000/api`; REST base URL. Socket.io uses this origin with `/api` removed. |
| `NEXT_PUBLIC_USD_INR_RATE` | No | `83`; client-side currency formatting conversion |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For card checkout | Stripe publishable test key, such as a `pk_test_...` key |

### Install, migrate, seed, and run

From the repository root:

```bash
npm install
```

From the `server/` directory, generate Prisma Client, create/apply the initial migration, and seed the test accounts:

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

Start the client and server together from the repository root:

```bash
npm run dev
```

The client defaults to `http://localhost:3000`; the API defaults to `http://localhost:4000`. Prisma Studio can be started from `server/` with `npx prisma studio`.

## Test credentials

The seed script upserts the following local test accounts. Both use `Password@123`.

| Role | Email | Password | Seeded details |
| --- | --- | --- | --- |
| Rider | `rider@example.com` | `Password@123` | Test Rider |
| Driver | `driver@example.com` | `Password@123` | Test Driver, CAB, Test Sedan, `TEST-001` |

The seeded driver starts **offline**. Set the driver online from the dashboard before testing nearby ride requests.

## API overview

All endpoints are under `/api`. Except the health check and Stripe webhook, the endpoints below require the authenticated `token` cookie. The API responds using `{ "success": boolean, "message": string, "data"?: ..., "errors"?: ... }`.

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Health check |
| `POST` | `/auth/register` | Public | Create rider or driver account; sets auth cookie |
| `POST` | `/auth/login` | Public | Sign in; sets auth cookie |
| `POST` | `/auth/logout` | Public | Clear auth cookie |
| `GET` | `/auth/me` | Any signed-in user | Current profile |
| `PATCH` | `/auth/me` | Any signed-in user | Update profile and, for drivers, vehicle details |
| `GET` | `/maps/search?q=` | Any signed-in user | Search places through Nominatim |
| `GET` | `/maps/reverse?lat=&lng=` | Any signed-in user | Reverse-geocode coordinates |
| `POST` | `/maps/route` | Any signed-in user | Return OSRM route, distance, duration, and geometry |
| `POST` | `/rides/estimate` | Any signed-in user | Return route and fares for all vehicle types |
| `POST` | `/rides` | Rider | Create a ride; server recalculates route and fare |
| `GET` | `/rides/active` | Any signed-in user | Current active ride |
| `GET` | `/rides/history?page=&limit=&status=&from=&to=` | Any signed-in user | Paginated ride history with optional filters |
| `GET` | `/rides/:id` | Ride participant | Ride details |
| `POST` | `/rides/:id/accept` | Driver | Accept a requested ride atomically |
| `POST` | `/rides/:id/decline` | Driver | Decline a ride for this driver |
| `POST` | `/rides/:id/arrived` | Assigned driver | Mark driver arrived |
| `POST` | `/rides/:id/start` | Assigned driver | Start trip |
| `POST` | `/rides/:id/complete` | Assigned driver | Complete trip |
| `POST` | `/rides/:id/cancel` | Rider or assigned driver | Cancel before the trip starts; provide a reason |
| `GET` | `/driver/requests` | Driver | Nearby open requests; driver must be online |
| `POST` | `/driver/status` | Driver | Set online/offline state and current coordinates |
| `GET` | `/driver/earnings` | Driver | Today, week, all-time earnings, and trip counts |
| `POST` | `/payments/intent` | Rider | Create or resume a payment intent for a completed ride |
| `POST` | `/payments/confirm` | Rider | Confirm a Stripe payment server-side |
| `GET` | `/payments/:rideId` | Rider | Get payment for the rider's ride |
| `POST` | `/payments/webhook` | Public, Stripe signature required | Process signed Stripe webhook events |
| `POST` | `/reviews` | Rider | Review a completed, paid ride |
| `GET` | `/reviews/driver/:driverId` | Any signed-in user | Paginated driver reviews |
| `GET` | `/reviews/ride/:rideId` | Any signed-in user | Review for a ride |
| `GET` | `/receipts/:rideId` | Ride participant | Structured receipt |

Coordinate request bodies use `{ "pickup": { "lat": ..., "lng": ... }, "drop": { "lat": ..., "lng": ... } }`. Ride creation additionally requires `vehicleType` (`BIKE`, `AUTO`, `CAB`, or `PREMIUM`). Use the endpoint validators for exact input rules.

## Real-time events

Socket.io shares the API origin and authenticates using the `token` cookie. Authenticated users join `user:{id}`; online drivers join `drivers:online`; participants may join `ride:{id}`.

| Direction | Event | Payload / purpose |
| --- | --- | --- |
| Client → server | `ride:join` | `{ rideId }`; joins a ride room after participant check |
| Client → server | `ride:leave` | `{ rideId }`; leaves a ride room |
| Client → server | `driver:location` | `{ lat, lng, rideId? }`; driver location update, throttled to one per second server-side |
| Server → client | `ride:new` | New nearby ride request sent to online drivers |
| Server → client | `ride:accepted` | Accepted ride details |
| Server → client | `ride:status` | `{ ride, previousStatus }` for a transition |
| Server → client | `ride:cancelled` | Cancelled ride details |
| Server → client | `driver:location` | `{ driverId, lat, lng }` forwarded to the ride room |
| Server → client | `socket:error` | `{ message }` for socket validation/access/update errors |

## Payment testing

Use Stripe test-mode API keys only. The client payment form uses Stripe Elements; `server/scripts/smoke.ts` confirms a test PaymentIntent with Stripe's `pm_card_visa` test payment method, then checks that the driver's payout is credited. The configured test card for manual checkout is:

| Card number | Expiry | CVC |
| --- | --- | --- |
| `4242 4242 4242 4242` | Any future date | Any 3 digits |

Stripe amounts are sent in the selected currency's minor units. INR ride fares are stored in paise; the driver is credited 85% of the fare after successful payment. Configure a Stripe webhook endpoint for `/api/payments/webhook`; the handler requires a valid `Stripe-Signature`.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm run smoke
```

The smoke test uses the configured database, Stripe test account, and external geocoding/routing services. It starts a temporary local HTTP server and exercises auth, maps, fares, ride lifecycle, Socket.io, payment, and review/receipt flows; it can create test records in the configured database.

## Deployment notes

- Set production secrets through your hosting provider's secret manager; never commit `.env` files.
- Configure the client origin in `CLIENT_URL` exactly, and set `NEXT_PUBLIC_API_URL` to the deployed API base URL.
- Deploy Prisma migrations with the direct database URL; use the pooled URL for application traffic where appropriate.
- Configure both Stripe test/live keys consistently for the chosen environment and register the webhook URL with Stripe.
- Supply an identifying Nominatim User-Agent and comply with the usage policies of Nominatim, OSRM, OpenStreetMap tile providers, and Stripe.
- The default OSRM endpoint is a public demo service, not a production SLA. Use a production routing provider or self-hosted service for production workloads.
- Deploy client and API with HTTPS so the production auth cookie can use `Secure`.

## Roadmap

- Replace placeholder demo and video links with published project media.
- Add deployment-specific operational monitoring and production-grade routing infrastructure.
- Add automated component and end-to-end browser test suites.
- Add deployment documentation for the selected hosting and database providers.

## Contributing

1. Fork the repository and create a focused branch.
2. Install dependencies with `npm install`.
3. Configure local client, server, PostgreSQL, and Stripe test environments.
4. Make a focused change and run typecheck, lint, build, and relevant smoke tests.
5. Open a pull request with a clear description and screenshots for UI changes.

Please do not include secrets, real customer data, or production payment information in issues, logs, or pull requests.

## License

Distributed under the [MIT License](./LICENSE).

## Author

**Saurabh Pandey**  
[LinkedIn](https://www.linkedin.com/in/saurabhpandey-/) · [GitHub](https://github.com/SaurabhPandey016) · [Email](mailto:developersaurabh001@gmail.com)

<div align="center">

Made with ❤️ by [Saurabh Pandey](https://www.linkedin.com/in/saurabhpandey-/)

</div>
