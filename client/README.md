# RideX Client

The RideX client is a responsive Next.js App Router application for riders and drivers. It provides account screens, ride booking and tracking, driver operations, payment/review flows, trip history, and printable receipts.

## Stack

- Next.js 14 App Router, React 18, TypeScript
- Tailwind CSS, Radix UI primitives, shadcn-style components, lucide-react
- Framer Motion, Sonner, React Hook Form, Zod
- Axios, Zustand, Socket.io Client
- Leaflet and React Leaflet, Stripe Elements

## Structure

```text
src/
├── app/             # Route pages, shared layout, loading/error/not-found UI
├── components/
│   ├── auth/        # Auth introduction
│   ├── booking/     # Booking panel and Leaflet ride map
│   ├── driver/      # Driver dashboard
│   ├── history/     # History list and empty states
│   ├── info/        # Shared informational page content
│   ├── landing/     # Landing-page sections
│   ├── layout/      # Navbar, footer, brand mark
│   ├── receipt/     # Receipt display and print layout
│   ├── ride/        # Ride tracking, status, Stripe form
│   ├── shared/      # Providers, route guards, skeletons
│   └── ui/          # Reusable Radix-based UI primitives
├── hooks/           # Auth and currency hooks
├── lib/             # API client, formatting, socket, utility functions
├── store/           # Zustand auth store
└── types/           # Client API and domain types
```

## Environment

Create `client/.env.local`:

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Required on Vercel; local fallback `http://localhost:4000/api` | Express REST base URL. The Socket.io client derives the server origin by removing `/api`. |
| `NEXT_PUBLIC_SOCKET_URL` | Optional; derived from `NEXT_PUBLIC_API_URL` | One Socket.io server origin, e.g. `http://localhost:4000` locally or `https://api.example.com` in production. Do not comma-separate local and production URLs; configure each environment separately. |
| `NEXT_PUBLIC_USD_INR_RATE` | `83` | Rate used by client fare formatting. Keep aligned with server `USD_INR_RATE`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Required for card checkout | Stripe test-mode publishable key (`pk_test_...`); must match the server test-mode secret key. |

The API uses cookie credentials; configure the server's `CLIENT_URL` to the exact client origin. In production, `NEXT_PUBLIC_API_URL` must use HTTPS and be set before the Vercel build. Public `NEXT_PUBLIC_*` values are included in the browser bundle and must never contain secrets. Production auth cookies use `SameSite=None; Secure` for separate Vercel and Render origins, and the API validates origins on state-changing requests. Some browsers block third-party cookies regardless; for the most reliable auth, use HTTPS client/API subdomains under the same registrable domain (for example `app.example.com` and `api.example.com`).

For Stripe test checkout, use a `pk_test_...` key from the same Stripe account as the server's `sk_test_...` key. Put the publishable key in this client environment and the secret key only in `server/.env` or the server host's secret settings. After changing a client key, restart Next.js locally or rebuild/redeploy Vercel; never send secret keys through chat or commit them.

## Scripts

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev --workspace @ridex/client` | Start the Next.js development server |
| `npm run build --workspace @ridex/client` | Create a production build |
| `npm run start --workspace @ridex/client` | Serve the production build |
| `npm run typecheck --workspace @ridex/client` | Run TypeScript checks |
| `npm run lint --workspace @ridex/client` | Run Next.js ESLint checks |

## Design system

The interface is dark-first, with global tokens defined in `src/app/globals.css`.

| Token | Value / use |
| --- | --- |
| Background | `#09090b` |
| Card | Near `#111114` |
| Foreground | Near-white |
| Muted text | Zinc gray |
| Primary / focus | Red `#ef4444`; hover red `#dc2626` |
| Accent | Deep red |
| Border | Translucent white |

Shared visual utilities include `.gradient-text`, `.gradient-red`, `.glass`, and `.glow-red`. Components in `components/ui` provide buttons, cards, forms, dialogs, menus, tabs, sheets, skeletons, and toasts. Keyboard focus uses a visible red focus ring; the common interactive controls have a 44px minimum target.

## Key pages

| Route | Purpose |
| --- | --- |
| `/` | Marketing landing page and booking entry |
| `/auth` | Login and role-aware rider/driver registration |
| `/book` | Rider place search, route preview, estimate, and ride request |
| `/driver` | Driver availability, nearby requests, and earnings overview |
| `/driver/earnings` | Driver payout summaries |
| `/ride/[id]` | Participant ride status, tracking, payment, review, and receipt actions |
| `/history` | Paginated trip history for signed-in users |
| `/history/[id]` | Trip details |
| `/receipt/[rideId]` | Participant-only printable receipt |
| `/profile` | Profile and driver vehicle information |
| `/about`, `/drive`, `/pricing`, `/safety`, `/help`, `/contact`, `/terms`, `/privacy`, `/cookies` | Informational pages |

## State and API

- `shared/auth-provider.tsx` checks `/auth/me` on app load. Protected pages use `ProtectedRoute`; auth state is held in the Zustand store.
- `shared/currency-provider.tsx` keeps the INR/USD display choice in local storage. Server fare/payment amounts remain server-authoritative.
- `lib/api.ts` configures Axios with `withCredentials: true` and normalizes API errors.
- `lib/socket.ts` creates a cookie-authenticated Socket.io connection using `NEXT_PUBLIC_SOCKET_URL` or the origin derived from `NEXT_PUBLIC_API_URL`. URL settings reject comma-separated values.
- The landing page probes `/health` immediately. Its service status distinguishes an API cold start from a database readiness failure and retries automatically; a paused Supabase project may still need manual resume.

## Maps and live rides

The Leaflet booking map is dynamically imported with server-side rendering disabled. It uses OpenStreetMap tiles and attribution, custom pickup/drop/driver markers, and route geometry returned from the API. Search, reverse geocoding, and route requests go through the Express API; the browser does not call Nominatim or OSRM directly. The current-location control samples fresh high-accuracy browser fixes and chooses the best reported accuracy; it keeps those device coordinates for the pickup rather than substituting the nearest reverse-geocoded address. Laptop location may still be estimated from Wi-Fi/network data; the UI reports coarse accuracy and lets riders drag the pickup pin or search for a known address such as Bela, Satna.

Ride pages join the participant-authorized `ride:{id}` socket room and listen for ride status and driver location events. The server validates room membership and throttles driver location updates. The driver dashboard refreshes requests on socket connection/reconnection and every 10 seconds as a fallback; only matching vehicle requests within 15 km are shown. Stripe Elements is loaded dynamically only when the payment flow is active.

For API endpoints and socket event payloads, see the [root README](../README.md#api-overview) and [server README](../server/README.md).
