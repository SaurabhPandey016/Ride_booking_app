# RideX project rules (always follow)

- Monorepo: /client (Next.js App Router, TypeScript) and /server (Express, TypeScript, ESM).
- Server uses ESM only: package.json has "type": "module", tsconfig uses "module": "NodeNext" and "moduleResolution": "NodeNext". Relative imports MUST end in .js (e.g. import x from "./x.js"). Never use require or module.exports.
- Server follows MVC: src/config, src/models (Prisma access helpers), src/controllers, src/services, src/routes, src/middlewares, src/validators (zod), src/sockets, src/utils, src/types.
- Controllers stay thin: validate -> call service -> send response. Business logic lives in services.
- Every async controller is wrapped with asyncHandler. Errors use a custom AppError class and one central errorHandler middleware. API response shape: { success: boolean, message: string, data?: T, errors?: unknown }.
- Auth: JWT stored in httpOnly, sameSite=lax, secure-in-production cookie named "token". Never return the token in JSON and never store it in localStorage.
- Validate all input with zod. Hash passwords with bcryptjs (12 rounds). Never return passwordHash.
- Money is stored as integer paise (INR) in the database. USD is derived using env USD_INR_RATE. Never use floats for money.
- Maps: Leaflet via react-leaflet, OpenStreetMap tiles, Nominatim for geocoding, OSRM for routing. All Nominatim/OSRM calls go through the Express server (cached, rate-limited, with a proper User-Agent). No Google APIs.
- Client: Tailwind + shadcn/ui + lucide-react. Dark theme with red accent (see globals.css tokens). Fixed navbar, enterprise footer. Mobile-first, accessible, with loading skeletons, empty states, and error states on every data view.
- Code style: strict TypeScript, no "any", small files, descriptive names, short comments only where logic is non-obvious, Prettier formatting (2 spaces, double quotes, semicolons).
- After finishing any task: run typecheck and build for the part you touched, and fix every error before stopping.