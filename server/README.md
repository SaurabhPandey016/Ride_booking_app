# RideX Server

The RideX server is an Express API and Socket.io server. It owns authentication, validation, ride and payment business logic, geocoding/routing proxies, and PostgreSQL access.

## Stack

- Node.js, Express 4, TypeScript, ESM (`NodeNext`)
- Prisma 6 and PostgreSQL (Supabase-compatible)
- Socket.io, Stripe, Zod
- JWT in an httpOnly cookie, bcryptjs password hashing
- Nominatim geocoding and OSRM routing

## MVC structure

```text
src/
├── config/       # Environment, Prisma singleton, Stripe client
├── controllers/  # Request validation and HTTP responses
├── middlewares/  # Auth, auth rate limiter, centralized errors
├── routes/       # API route registration
├── services/     # Auth, fares, maps, rides, payments, reviews, receipts
├── sockets/      # Socket.io initialization and event types
├── utils/        # AppError, asyncHandler, cookies, JWT, socket helpers
└── validators/   # Zod request schemas
prisma/
├── migrations/
├── schema.prisma
└── seed.ts
scripts/
└── smoke.ts
```

Controllers are thin: parse and validate request input, call a service, and send a response. Business rules and database operations live in services. Relative ESM imports include the `.js` extension.

## Environment

Put server variables in `server/.env`. The root `.env.example` is the server template; never commit actual environment files.

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `4000` | HTTP and Socket.io listener port |
| `NODE_ENV` | `development` | Controls production-only secure cookie behavior |
| `JWT_SECRET` | Development fallback exists | Production requires at least 32 random characters |
| `CLIENT_URL` | `http://localhost:3000` | Exact browser origin allowed by credentialed CORS and Socket.io |
| `DATABASE_URL` | — | PostgreSQL connection URL used by Prisma Client |
| `DIRECT_URL` | — | Direct PostgreSQL URL used for Prisma migrations |
| `USD_INR_RATE` | `83` | Server fare conversion and USD payment calculation |
| `NOMINATIM_BASE_URL` | `https://nominatim.openstreetmap.org` | Nominatim base URL |
| `NOMINATIM_USER_AGENT` | RideX example User-Agent in development | Production requires an identifying User-Agent with a real contact |
| `NOMINATIM_COUNTRYCODES` | — | Optional Nominatim country filter |
| `OSRM_BASE_URL` | `https://router.project-osrm.org` | OSRM routing base URL |
| `STRIPE_SECRET_KEY` | Empty | Required; this app currently accepts Stripe test-mode keys only |
| `STRIPE_WEBHOOK_SECRET` | Empty | Required in production for signed Stripe webhooks |

The client also requires `NEXT_PUBLIC_API_URL` to target this server; see [client environment setup](../client/README.md#environment).
In production, the server validates required values at startup, including an exact HTTPS `CLIENT_URL`, both database URLs, a random JWT secret of at least 32 characters, contactable Nominatim User-Agent, and Stripe test-mode keys. If startup reports a short JWT secret, replace the `JWT_SECRET` value in Render's Environment settings with a newly generated random value of at least 32 characters and redeploy; do not weaken this check. Changing the key invalidates existing login cookies. Production auth cookies use `SameSite=None; Secure` for separate Vercel and Render origins, and state-changing API requests are restricted to the configured `CLIENT_URL` origin. Set that value to the exact Vercel origin (scheme and host only). Some browsers block third-party cookies regardless; if that affects your users, use HTTPS custom domains under the same registrable domain for the client and API.

## Scripts

Run from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev --workspace @ridex/server` | Run API and Socket.io with `tsx watch` |
| `npm run build --workspace @ridex/server` | Compile the server TypeScript |
| `npm run start --workspace @ridex/server` | Start the compiled server |
| `npm run typecheck --workspace @ridex/server` | Check application and script types |
| `npm run db:seed --workspace @ridex/server` | Upsert the seed rider and driver |
| `npm run smoke --workspace @ridex/server` | Run the API, socket, map, ride, payment, review, and receipt smoke flow |

Prisma commands run from `server/`:

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma studio
```

## REST endpoint reference

Paths below are relative to `/api`. Unless marked **Public**, routes require the `token` auth cookie. Inputs are validated by Zod. Responses use `{ success, message, data?, errors? }`.

### Auth

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register a rider or driver; auth rate-limited |
| `POST` | `/auth/login` | Public | Sign in; auth rate-limited |
| `POST` | `/auth/logout` | Public | Clear the auth cookie |
| `GET` | `/auth/me` | Any authenticated user | Return current user |
| `PATCH` | `/auth/me` | Any authenticated user | Update profile and optional driver vehicle fields |

### Maps and rides

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| `GET` | `/maps/search?q=` | Any authenticated user | Nominatim place search |
| `GET` | `/maps/reverse?lat=&lng=` | Any authenticated user | Nominatim reverse geocoding |
| `POST` | `/maps/route` | Any authenticated user | OSRM driving route and GeoJSON geometry |
| `POST` | `/rides/estimate` | Any authenticated user | Route plus fares for all vehicle classes |
| `POST` | `/rides` | Rider | Create a ride; route and fare are recalculated server-side |
| `GET` | `/rides/active` | Any authenticated user | Active ride for the current user |
| `GET` | `/rides/history?page=&limit=&status=&from=&to=` | Any authenticated user | Paginated/filterable history; includes payment/review summary |
| `GET` | `/rides/:id` | Ride participant | Ride details |
| `POST` | `/rides/:id/accept` | Driver | Atomically accept an open ride |
| `POST` | `/rides/:id/decline` | Driver | Decline an open ride for this driver |
| `POST` | `/rides/:id/arrived` | Assigned driver | Mark arrival |
| `POST` | `/rides/:id/start` | Assigned driver | Begin ride |
| `POST` | `/rides/:id/complete` | Assigned driver | Complete ride |
| `POST` | `/rides/:id/cancel` | Rider or assigned driver | Cancel before `IN_PROGRESS`; requires a reason |

### Driver

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| `GET` | `/driver/requests` | Driver | Nearby `REQUESTED` rides; driver must be online |
| `POST` | `/driver/status` | Driver | Set availability and current coordinates |
| `GET` | `/driver/earnings` | Driver | Today, this week, all-time totals, and trip count |

### Payments, reviews, receipts

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| `POST` | `/payments/intent` | Rider | Create/resume intent for the rider's completed ride |
| `POST` | `/payments/confirm` | Rider | Retrieve and confirm payment status server-side |
| `GET` | `/payments/:rideId` | Rider | Retrieve payment on the rider's ride |
| `POST` | `/payments/webhook` | Public; valid Stripe signature required | Handle Stripe payment success/failure events |
| `POST` | `/reviews` | Rider | Review a completed, paid ride once |
| `GET` | `/reviews/driver/:driverId` | Any authenticated user | Paginated driver reviews |
| `GET` | `/reviews/ride/:rideId` | Any authenticated user | Review for one ride |
| `GET` | `/receipts/:rideId` | Ride participant | Structured receipt |
| `GET` | `/health` | Public | Readiness check; executes a database probe and returns 503 when unavailable |

Ride status transitions are `REQUESTED → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED`; cancellation is available from `REQUESTED`, `ACCEPTED`, and `ARRIVED`. Invalid transitions return HTTP 409.

`GET /healthz` is a lightweight process liveness check for the Render health monitor and does not depend on PostgreSQL. Use `/api/health` from the app to check database readiness; do not configure a platform liveness probe to restart the API whenever Supabase is temporarily unavailable.

## Socket.io events

The handshake is authenticated with the `token` cookie. Socket room access is checked against the ride participant before joining `ride:{id}`.

| Direction | Event | Data / behavior |
| --- | --- | --- |
| Client → server | `ride:join` | `{ rideId }`; participant-only room join |
| Client → server | `ride:leave` | `{ rideId }`; leave ride room |
| Client → server | `driver:location` | `{ lat, lng, rideId? }`; update driver coordinates, at most one update/second |
| Server → client | `ride:new` | New ride request to `drivers:online` |
| Server → client | `ride:accepted` | Ride accepted |
| Server → client | `ride:status` | `{ ride, previousStatus }` transition update |
| Server → client | `ride:cancelled` | Ride cancellation update |
| Server → client | `driver:location` | `{ driverId, lat, lng }` to the ride room |
| Server → client | `socket:error` | `{ message }` socket error |

## Error and response format

Successful and error responses follow:

```json
{
  "success": false,
  "message": "A safe, user-facing message",
  "errors": {}
}
```

`errors` is optional. Expected `AppError` messages and validation details are returned to the caller; unexpected failures use a generic internal-server message. Common status codes include `400` for invalid input, `401` for unauthenticated requests, `403` for role/access restrictions, `404` for missing resources, `409` for conflicting state, and `429` for rate limits.

## Prisma schema summary

The schema uses PostgreSQL with `DATABASE_URL` and `DIRECT_URL`.

| Model | Purpose |
| --- | --- |
| `User` | Rider or driver identity, contact fields, role, and password hash |
| `DriverProfile` | Vehicle details, online location, rating, and integer-paise earnings |
| `Ride` | Participants, vehicle, coordinates, route geometry, integer-paise fare, lifecycle timestamps |
| `Payment` | Unique ride/payment-intent association, minor-unit amount, status, receipt number |
| `Review` | One review per ride, with rider, driver, rating, and optional comment |

Enums: `Role` (`RIDER`, `DRIVER`), `RideStatus`, `PaymentStatus`, and `VehicleType` (`BIKE`, `AUTO`, `CAB`, `PREMIUM`). Password hashes are never returned by auth responses.

## Security measures

- Helmet security headers, credentialed CORS restricted to `CLIENT_URL`, and a general API rate limit.
- A stricter limit on registration and login attempts.
- JWT session in an httpOnly cookie; `SameSite=None; Secure` in production and `SameSite=Lax` in development.
- bcryptjs password hashing with 12 rounds.
- Zod validation for request inputs and coordinate ranges.
- Role checks and participant ownership checks on protected operations.
- Ride acceptance uses an atomic conditional database update.
- Stripe webhook verification uses the raw request body and Stripe signature; payment settlement/payout is idempotent.
- Nominatim and OSRM are called by the server, not directly by the browser.

## Testing

Run the smoke test from the repository root:

```bash
npm run smoke
```

The script starts an ephemeral HTTP/Socket.io server and exercises account registration/login, map search and reverse geocoding, route/fare estimation, ride creation and state transitions, race-safe acceptance, live events, Stripe test PaymentIntent confirmation, reviews, and receipts. It requires the configured database, Stripe test credentials, and access to the external map services. It creates test data in that database. Webhook replay is skipped if `STRIPE_WEBHOOK_SECRET` is unset.

Seed credentials: `rider@example.com` and `driver@example.com`, both with password `Password@123`. The seeded driver is initially offline. Use Stripe test-mode credentials only; see the root [payment testing notes](../README.md#payment-testing).
