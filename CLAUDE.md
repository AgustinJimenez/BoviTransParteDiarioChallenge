BoviTrans MVP — logistics platform for cattle transport. Two modules: Dashboard (transport request management + truck assignment) and Fleet Management (truck CRUD). Core formula: Fuel Cost = Distance (km) × Consumption (L/km) × Price/Liter — lives in src/lib/calculations.ts, nowhere else.

STACK: Next.js 16 App Router, TypeScript strict, Tailwind CSS v4, PostgreSQL 15, Prisma v7 + @prisma/adapter-pg, react-leaflet v5 + OpenStreetMap, Nominatim geocoding, OSRM routing, react-hook-form v7 + Zod v4, next-intl v4 (i18n), lucide-react, OrbStack for Docker on macOS.

GIT: Conventional commits (feat/fix/chore/docs/refactor). Branch: feature/bovitrans-mvp → PR to main.

API RESPONSES: always { data: T | null, error: string | null }. HTTP codes: 200, 201, 400, 404, 409, 422, 500. Always convert Prisma Decimal fields to Number() before returning JSON.

COMPONENTS: Atomic Design — components/atoms/ = pure presentational primitives (Button, Badge, Input). components/molecules/ = simple domain composites without direct API calls (RequestCard, TruckCard, CapacityAlert, RouteMap, FilterBar). components/organisms/ = complex stateful components with business logic (DashboardClient, NewRequestModal, NewTruckForm, TruckSelector, MapInner, Sidebar). Client-side fetching goes inside useEffect in the component that needs it. Navigation is a collapsible Sidebar (not a top navbar). Detail view is a server page at /requests/[id], not a panel.

COMPONENT STYLE RULES (enforced by ESLint in .tsx files):
- All components and internal functions must be arrow functions (const X = () => ...). No function declarations. Rule: react/function-component-definition + func-style expression.
- No render*() helper functions. Every JSX branch is a named sub-component (e.g. FleetLoadingState, DashboardEmptyState). Conditional branches in a return are fine; render functions that return JSX are not. There is no ESLint rule for this — enforce via code review.
- Every component's props must be declared as a named interface (ComponentNameProps). No inline object types in function parameters: `({ a, b }: { a: string })` is wrong; `({ a, b }: FooProps)` is correct. Rule: @typescript-eslint/consistent-type-definitions enforces interface over type. No ESLint rule catches the inline pattern — enforce via code review.
- All interfaces in a file are grouped together at the top, right after the import block (before any constants or components). File structure: imports → interfaces → constants/helpers → components.
- Component prop interfaces stay co-located in the same file (not in a separate types file). Shared domain types (Truck, TransportRequest, etc.) live in src/types/index.ts.

DOCKER: OrbStack auto-patches the Docker socket — no DOCKER_HOST needed. Use "docker compose" (v2, no hyphen). docker/init.sql runs automatically on first container start.

PRISMA V7 GOTCHAS — READ BEFORE TOUCHING SCHEMA:
1. No auto camelCase→snake_case. Every camelCase field needs explicit @map("snake_case") or Prisma will look for the camelCase column name in the DB and fail.
2. No url in datasource db. DB URL goes in prisma.config.ts. Client requires the pg adapter: new PrismaClient({ adapter: new PrismaPg({ connectionString }) }).
3. Generated client has no index.ts. Import from the specific file: import { PrismaClient } from "@/generated/prisma/client".

ZOD V4 + REACT-HOOK-FORM: do not use z.coerce.number() — type mismatch with the resolver. Use z.number() and add { valueAsNumber: true } to register() for number inputs.

TESTS — three layers:
- Unit (npm test): pure functions in src/lib/__tests__/ — calculations.ts, phoneFormat.ts
- Integration (npm run test:integration): API route handlers against bovitrans_test DB — src/integration/
- E2E (npm run test:e2e): Playwright browser tests against bovitrans_e2e DB — tests/e2e/
E2E uses `next build && next start -p 3001` because Next.js 16 locks against two concurrent `next dev` instances. Playwright rule: no raw CSS selectors — use getByTestId(), getByRole(), getByLabel(). Structural elements have data-testid (e.g. data-testid="request-card", data-testid="search-input").

ESLINT GOTCHA: react-hooks/set-state-in-effect does call-graph analysis — it flags any function called from useEffect that transitively calls setState, even after awaits. Legitimate data-fetching patterns need // eslint-disable-line react-hooks/set-state-in-effect with a comment explaining why.

I18N: all UI strings live in messages/es.json, organized by namespace (nav, dashboard, fleet, etc.). Client components use useTranslations("namespace"), server components use await getTranslations("namespace"). Adding a hardcoded string in JSX is a lint error (eslint-plugin-i18next). Using a key that doesn't exist in es.json is a TypeScript error (AppConfig augmentation in src/types/next-intl.d.ts).

ACCESSIBILITY: axe-core runs in dev mode and logs violations to the browser console. After any UI change, if the app is open in the browser, check the console for axe errors before committing. Structural HTML elements must be landmarks (<header>, <nav>, <main>, <aside>) — plain <div> containers with visible text content will trigger the "content must be in a landmark" rule.

LEAFLET: always dynamic import with ssr:false. Import leaflet CSS inside MapInner.tsx, not in layout. Use L.divIcon with inline SVG for markers — avoids the default icon path issue in Next.js.

KEY FILES:
- src/lib/calculations.ts — fuel cost formula, single source of truth
- src/lib/phoneFormat.ts — Argentine phone formatter (+54 9 XXX XXX-XXXX)
- prisma/schema.prisma — all models have explicit @map annotations
- docker/init.sql — schema DDL + 500-record bulk seed for load testing
- docker/e2e-seed.sql — minimal 30-record seed for E2E tests
- vitest.integration.config.ts — integration test config (bovitrans_test DB, hardcoded)
- playwright.config.ts — E2E config (bovitrans_e2e DB, port 3001, next start)
- BACKLOG.md — epics, user stories, acceptance criteria, prompts used (graded)
- DOCUMENTACION.md — architecture decisions, API reference, how to run
