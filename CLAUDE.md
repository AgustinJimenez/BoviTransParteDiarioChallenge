@AGENTS.md

# BoviTrans — Claude Code Project Context

## What This Is

MVP logístico para digitalizar el transporte terrestre de ganado vacuno. Dos módulos centrales:
1. **Dashboard** — gestión y asignación de solicitudes de transporte
2. **Administración de Flotas** — CRUD de camiones con capacidad y consumo de combustible

Fórmula crítica: `Costo = Distancia (km) × Consumo (L/km) × Precio por Litro`

## Stack

- **Framework:** Next.js 14, App Router, TypeScript strict
- **Estilos:** Tailwind CSS + shadcn/ui (componentes propios, no dependencia de diseño)
- **DB:** PostgreSQL 15 via Prisma ORM
- **Mapas:** react-leaflet + OpenStreetMap (sin API key)
- **Geocodificación:** Nominatim (OSM)
- **Distancias:** OSRM public API, fallback a Haversine
- **Formularios:** react-hook-form + Zod
- **Contenedorización:** Docker + docker-compose

## Estructura de Carpetas

```
src/
├── app/
│   ├── (dashboard)/         # Rutas del dashboard principal
│   ├── fleet/               # Módulo de flotas
│   ├── settings/            # Configuración (precio combustible)
│   └── api/                 # Route handlers de Next.js
│       ├── trucks/
│       ├── transport-requests/
│       └── config/
├── components/
│   ├── ui/                  # Primitivos: Button, Badge, Input, Modal, Toast
│   └── domain/              # Componentes de dominio: RequestCard, RouteMap, CapacityAlert
├── lib/
│   ├── api/                 # Fetch wrappers — nunca fetch inline en componentes
│   ├── calculations.ts      # Funciones puras: fuelCost, tripsNeeded, haversine
│   └── prisma.ts            # Singleton de PrismaClient
└── types/                   # Tipos TypeScript compartidos
```

## Convenciones de Desarrollo

### Git
- **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- **Rama de trabajo:** `feature/bovitrans-mvp`
- Todo el desarrollo va en PR hacia `main`

### TypeScript
- Strict mode activado — no `any`, no `as unknown`
- Tipos en `src/types/` para entidades de dominio compartidas (Truck, TransportRequest, etc.)
- Zod schemas son la fuente de verdad para validación; los tipos se infieren de ellos

### Next.js App Router
- **Server Components por defecto** — data fetching en el servidor cuando sea posible
- **`"use client"`** solo cuando sea necesario: formularios, mapas, estado reactivo
- **Leaflet requiere importación dinámica** con `ssr: false` — no funciona en SSR
- Variables de entorno del cliente deben tener prefijo `NEXT_PUBLIC_`

### API REST
- Respuestas consistentes: `{ data, error, message }`
- Códigos HTTP correctos: 200, 201, 400, 404, 409, 422, 500
- Validación de body con Zod en todos los endpoints que reciben datos
- Errores de Prisma (`P2002` unique constraint, etc.) mapeados a respuestas HTTP legibles

### Componentes
- `components/ui/` — sin lógica de negocio, solo presentación
- `components/domain/` — pueden tener lógica de dominio pero no llamadas a API directas
- Las llamadas a API van en `lib/api/` y se usan desde Server Components o handlers de formulario

## Archivos Clave

| Archivo | Propósito |
|---|---|
| `prisma/schema.prisma` | Fuente de verdad del modelo de datos |
| `docker-compose.yml` | Levanta app + DB con un comando |
| `init.sql` | Schema + seed para inicialización de DB en Docker |
| `.env.example` | Referencia de todas las variables de entorno necesarias |
| `BACKLOG.md` | Épicas, historias de usuario y tareas técnicas del MVP |
| `DOCUMENTACION.md` | Decisiones de arquitectura y guía de instalación |

## Comandos Frecuentes

```bash
# Desarrollo local
npm run dev

# Docker (entorno completo)
docker-compose up --build

# Prisma
npx prisma migrate dev      # Aplicar migraciones
npx prisma studio           # GUI de la DB
npx prisma db seed          # Cargar datos semilla

# Calidad de código
npm run lint
npm run type-check
```

## Notas para Claude

- La lógica de cálculo de combustible vive en `lib/calculations.ts` — nunca duplicarla en componentes o endpoints
- El precio de combustible se lee de `SystemConfig` en DB — no hardcodearlo
- Los camiones inactivos (`is_active: false`) no deben aparecer en selectores de asignación
- Leaflet necesita `dynamic import` con `{ ssr: false }` — recordar esto al crear RouteMap
- Nominatim tiene rate limit de 1 req/seg — usar el campo `origin_lat/lng` de la DB como cache
