BoviTrans MVP — logistics platform for cattle transport. Two modules: Dashboard (transport request management + truck assignment) and Fleet Management (truck CRUD). Core formula: Fuel Cost = Distance (km) × Consumption (L/km) × Price/Liter — lives in src/lib/calculations.ts, nowhere else.

STACK: Next.js 16 App Router, TypeScript strict, Tailwind CSS v4, PostgreSQL 15, Prisma v7 + @prisma/adapter-pg, react-leaflet v5 + OpenStreetMap, Nominatim geocoding, OSRM routing, react-hook-form v7 + Zod v4, next-intl v4 (i18n), lucide-react, OrbStack for Docker on macOS.

GIT: Conventional commits (feat/fix/chore/docs/refactor). Branch: feature/bovitrans-mvp → PR to main.

API RESPONSES: always { data: T | null, error: string | null }. HTTP codes: 200, 201, 400, 404, 409, 422, 500. Always convert Prisma Decimal fields to Number() before returning JSON.

COMPONENTS: Atomic Design — components/atoms/ = pure presentational primitives (Button, Badge, Input). components/molecules/ = simple domain composites without direct API calls (RequestCard, TruckCard, CapacityAlert, RouteMap). components/organisms/ = complex stateful components with business logic (DashboardClient, RequestDetailPanel, NewRequestModal, NewTruckForm, TruckSelector, MapInner, Navbar). Client-side fetching goes inside useEffect in the component that needs it.

DOCKER: OrbStack auto-patches the Docker socket — no DOCKER_HOST needed. Use "docker compose" (v2, no hyphen). docker/init.sql runs automatically on first container start.

PRISMA V7 GOTCHAS — READ BEFORE TOUCHING SCHEMA:
1. No auto camelCase→snake_case. Every camelCase field needs explicit @map("snake_case") or Prisma will look for the camelCase column name in the DB and fail.
2. No url in datasource db. DB URL goes in prisma.config.ts. Client requires the pg adapter: new PrismaClient({ adapter: new PrismaPg({ connectionString }) }).
3. Generated client has no index.ts. Import from the specific file: import { PrismaClient } from "@/generated/prisma/client".

ZOD V4 + REACT-HOOK-FORM: do not use z.coerce.number() — type mismatch with the resolver. Use z.number() and add { valueAsNumber: true } to register() for number inputs.

TESTS: unit tests with Vitest in src/lib/__tests__/. Run with npm test. Coverage with npm run test:coverage. Only pure functions are tested (calculations.ts). No integration or component tests — the risk surface is in external integrations (Prisma v7, Leaflet, OSRM), not in business logic.

I18N: all UI strings live in messages/es.json, organized by namespace (nav, dashboard, fleet, etc.). Client components use useTranslations("namespace"), server components use await getTranslations("namespace"). Adding a hardcoded string in JSX is a lint error (eslint-plugin-i18next). Using a key that doesn't exist in es.json is a TypeScript error (AppConfig augmentation in src/types/next-intl.d.ts).

LEAFLET: always dynamic import with ssr:false. Import leaflet CSS inside MapInner.tsx, not in layout. Use L.divIcon with inline SVG for markers — avoids the default icon path issue in Next.js.

KEY FILES:
- src/lib/calculations.ts — fuel cost formula, single source of truth
- prisma/schema.prisma — all models have explicit @map annotations
- docker/init.sql — schema DDL + seed data (4 trucks, 5 requests, fuel price)
- BACKLOG.md — epics, user stories, acceptance criteria, prompts used (graded)
- DOCUMENTACION.md — architecture decisions, API reference, how to run
