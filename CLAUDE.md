@AGENTS.md

# BoviTrans — Claude Code Project Context

## What This Is

MVP logístico para digitalizar el transporte terrestre de ganado vacuno. Dos módulos centrales:
1. **Dashboard** — gestión y asignación de solicitudes de transporte entrantes
2. **Administración de Flotas** — CRUD de camiones con capacidad y consumo de combustible

Fórmula crítica del negocio: `Costo = Distancia (km) × Consumo (L/km) × Precio por Litro`  
Implementada en `src/lib/calculations.ts` — única fuente de verdad, usada por API y frontend.

## Stack Real (como quedó implementado)

- **Framework:** Next.js 16, App Router, TypeScript strict
- **Estilos:** Tailwind CSS v4 (config en CSS, no tailwind.config.js) + componentes propios
- **DB:** PostgreSQL 15 via Prisma v7 + `@prisma/adapter-pg`
- **Mapas:** react-leaflet v5 + OpenStreetMap tiles (sin API key)
- **Geocodificación:** Nominatim (OSM) — rate limit 1 req/seg, cachear en DB
- **Distancias:** OSRM public API, fallback a Haversine
- **Formularios:** react-hook-form v7 + Zod v4 + `@hookform/resolvers` v5
- **Iconos:** lucide-react
- **Docker:** OrbStack (macOS) — no requiere `DOCKER_HOST`, parchea el socket automáticamente

## Estructura de Carpetas

```
src/
├── app/
│   ├── page.tsx             # Dashboard (Server Component)
│   ├── fleet/               # Módulo de flotas
│   ├── settings/            # Configuración precio combustible
│   └── api/
│       ├── trucks/
│       ├── transport-requests/
│       └── config/
├── components/
│   ├── ui/                  # Button, Badge/StatusBadge, Input
│   └── domain/              # RequestCard, RequestDetailPanel, RouteMap,
│                            # CapacityAlert, TruckSelector, DashboardClient,
│                            # TruckCard, NewTruckForm, NewRequestModal, MapInner
├── lib/
│   ├── calculations.ts      # Funciones puras: fuelCost, tripsNeeded, haversine
│   ├── geocoding.ts         # Nominatim geocoding
│   ├── routing.ts           # OSRM + fallback Haversine
│   ├── prisma.ts            # Singleton PrismaClient con pg adapter
│   └── utils.ts             # cn() para Tailwind class merging
└── types/
    └── index.ts             # Truck, TransportRequest, ApiResponse, RequestStatus
```

## Convenciones de Desarrollo

### Git
- **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- **Rama activa:** `feature/bovitrans-mvp` → PR a `main`

### TypeScript
- Strict mode — no `any`, no `as unknown`
- Tipos en `src/types/index.ts` — las interfaces son plain JS objects (Decimal ya convertido a number)
- Zod schemas son fuente de verdad para validación; tipos se infieren con `z.infer<>`

### Next.js App Router
- **Server Components por defecto** — el dashboard fetcha via Prisma directamente, sin API call
- **`"use client"`** solo para: formularios, mapas, estado reactivo, hooks de router
- Variables de entorno del cliente: prefijo `NEXT_PUBLIC_`

### API REST
- Respuestas consistentes: `{ data: T | null, error: string | null }`
- Códigos HTTP: 200, 201, 400, 404, 409, 422, 500
- Campos `Decimal` de Prisma siempre convertir a `Number()` antes de serializar a JSON
- Validación de body con Zod en todos los endpoints que reciben datos

### Componentes
- `components/ui/` — sin lógica de negocio, solo presentación y estilos
- `components/domain/` — pueden tener lógica de dominio, no llaman a API directamente
- El fetch de datos desde el cliente va en `useEffect` dentro del componente que lo necesita

## Archivos Clave

| Archivo | Propósito |
|---|---|
| `prisma/schema.prisma` | Fuente de verdad del modelo de datos |
| `docker-compose.yml` | Levanta app + DB con un comando |
| `docker/init.sql` | Schema DDL + seed — se ejecuta automáticamente al primer arranque |
| `.env.example` | Variables de entorno necesarias con defaults |
| `BACKLOG.md` | Épicas, historias de usuario, criterios de aceptación y prompts usados |
| `DOCUMENTACION.md` | Decisiones de arquitectura, API reference, guía Docker |

## Comandos Frecuentes

```bash
# Docker (entorno completo — OrbStack no necesita DOCKER_HOST)
docker compose up --build
docker compose down
docker compose logs -f app

# Desarrollo local (requiere PostgreSQL local)
npm run dev

# Prisma
npx prisma generate     # Regenerar cliente tras cambiar schema.prisma
npx prisma db seed      # Cargar datos semilla
npx prisma studio       # GUI de la DB

# Calidad de código
npm run type-check
npm run lint
```

## ⚠️ Gotchas Críticos — Leer Antes de Tocar Código

### Prisma v7 — @map obligatorio
El nuevo generator `prisma-client` de Prisma v7 **NO convierte automáticamente** camelCase a snake_case.
`requesterName` busca la columna `requesterName` en la DB, no `requester_name`.
**Todos los campos camelCase necesitan `@map("snake_case")` explícito:**
```prisma
requesterName   String  @map("requester_name")
assignedTruckId String? @map("assigned_truck_id")
```

### Prisma v7 — no hay `url` en datasource
La URL de la DB va en `prisma.config.ts`, no en `schema.prisma`.
El cliente se instancia con el adapter:
```typescript
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
```

### Prisma v7 — Decimal no es number
Los campos `Decimal` de Prisma son objetos, no numbers nativos.
Siempre convertir antes de devolver en la API: `Number(truck.fuelConsumption)`

### Zod v4 + react-hook-form — no usar z.coerce para números
`z.coerce.number()` causa mismatch de tipos con el resolver.
Usar `z.number()` y agregar `{ valueAsNumber: true }` en `register()`:
```typescript
<input {...register("maxCapacity", { valueAsNumber: true })} />
```

### Leaflet — SSR rompe la app
Leaflet requiere DOM. Importar siempre con dynamic + ssr:false:
```typescript
const MapInner = dynamic(() => import("./MapInner"), { ssr: false })
```
El CSS de Leaflet se importa dentro de `MapInner.tsx`, no en el layout.

### Prisma generated client — path correcto
El cliente generado está en `src/generated/prisma/` sin `index.ts`.
Importar desde el archivo específico:
```typescript
import { PrismaClient } from "@/generated/prisma/client"
```

### Docker — usar `docker compose` (v2), no `docker-compose` (v1)
OrbStack incluye Compose v2 como plugin. El comando es `docker compose` (sin guión).
