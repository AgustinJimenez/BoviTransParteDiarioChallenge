# DOCUMENTACIÓN TÉCNICA — BoviTrans MVP

> Generado y mantenido con asistencia de Claude (claude-sonnet-4-6) como parte del proceso de desarrollo asistido por IA.

---

## Índice

1. [Visión General de la Arquitectura](#1-visión-general-de-la-arquitectura)
2. [Decisiones de Diseño](#2-decisiones-de-diseño)
3. [Modelo de Datos](#3-modelo-de-datos)
4. [API REST](#4-api-rest)
5. [Frontend y UI/UX](#5-frontend-y-uiux)
6. [Infraestructura y Docker](#6-infraestructura-y-docker)
7. [Cómo Correr el Proyecto](#7-cómo-correr-el-proyecto)

---

## 1. Visión General de la Arquitectura

BoviTrans es una aplicación web fullstack construida sobre **Next.js 16 con App Router**. El mismo repositorio aloja tanto el frontend (React Server Components + Client Components) como el backend (API Route Handlers de Next.js), eliminando la necesidad de un servidor de API separado para el MVP.

```
┌─────────────────────────────────────────────┐
│                   Cliente                    │
│         (Browser — React + Leaflet)          │
└──────────────────┬──────────────────────────┘
                   │ HTTP
┌──────────────────▼──────────────────────────┐
│              Next.js 16 App                  │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Server          │  │  API Route       │  │
│  │  Components      │  │  Handlers        │  │
│  │  (data fetching) │  │  /api/**         │  │
│  └─────────────────┘  └────────┬─────────┘  │
└───────────────────────────────-┼────────────┘
                                 │ Prisma ORM (pg adapter)
┌────────────────────────────────▼────────────┐
│              PostgreSQL 15                   │
│         (Docker container)                   │
└─────────────────────────────────────────────┘

Servicios externos (sin API key, gratuitos):
  - OpenStreetMap tiles  → renderizado de mapas
  - Nominatim            → geocodificación de localidades
  - OSRM                 → distancias reales de ruta
```

### Por qué Next.js fullstack en lugar de backend separado

Para un MVP de esta escala, mantener frontend y backend en el mismo proyecto reduce la fricción operativa: un repositorio, un Dockerfile, un proceso de deploy. Los API Route Handlers de Next.js cubren todos los endpoints requeridos. Si el proyecto escala, los handlers pueden extraerse a un microservicio sin cambiar los contratos de API.

### Separación Server / Client Components

El App Router de Next.js permite mezclar Server Components (renderizan en servidor, acceden a DB directamente) con Client Components (interactivos, corren en browser). La regla aplicada:

- **Server Components** → páginas que solo muestran datos (fetching via Prisma directamente)
- **Client Components** → todo lo que requiere estado reactivo, formularios, mapas o efectos

---

## 2. Decisiones de Diseño

### 2.1 Stack Frontend

| Decisión | Alternativas consideradas | Justificación |
|---|---|---|
| **Tailwind CSS v4** | CSS Modules, Styled Components | Sin cambio de contexto entre CSS y JSX. Config en CSS puro (no JS), más simple en v4. |
| **Componentes propios** | shadcn/ui CLI, MUI, Chakra | La CLI de shadcn v4 es completamente interactiva (sin flags no-prompt). Se construyeron los componentes directamente con Tailwind para control total del diseño y sin dependencias externas de UI. |
| **react-hook-form v7 + Zod v4** | Formik, validación manual | Type-safety end-to-end: el mismo schema Zod valida en cliente y en servidor. Con Zod v4 y `valueAsNumber` en los inputs numéricos se evita el problema de tipos en `z.coerce`. |
| **react-leaflet v5 + OSM** | Mapbox GL JS, Google Maps | Gratuito, sin API key, suficiente para trazado de rutas en Argentina. |
| **lucide-react** | Heroicons, Font Awesome | Consistente con el ecosistema React, tree-shakeable. |
| **next-intl v4** | react-i18next, strings hardcodeados | Centraliza todos los strings de UI en `messages/es.json`. Integración nativa con App Router (RSC + Client). Doble validación: ESLint detecta strings hardcodeados en JSX, TypeScript detecta keys inexistentes en el JSON. |

### 2.2 Stack de Calidad

| Decisión | Alternativas consideradas | Justificación |
|---|---|---|
| **Vitest** | Jest, Mocha | Nativo a Vite/ESM, sin config de Babel, 10× más rápido que Jest en proyectos TypeScript. |
| **Tests solo en `src/lib/`** | Tests de integración, E2E | La lógica de negocio pura (fórmulas matemáticas) es el único lugar donde los tests unitarios detectan regresiones antes que la ejecución. Las integraciones externas (Prisma v7, Leaflet, OSRM) se validan en el smoke test manual. |
| **eslint-plugin-i18next** | Revisión manual de strings | Detecta strings hardcodeados en JSX en tiempo de lint, antes de que lleguen a producción. |
| **TypeScript strict + AppConfig** | Ninguna verificación de i18n | Usar una key inexistente en `messages/es.json` es un error de compilación, no un runtime error. |

### 2.3 Stack Backend y Datos

| Decisión | Alternativas consideradas | Justificación |
|---|---|---|
| **PostgreSQL 15** | MySQL, SQLite | Mejor soporte de tipos complejos, enums nativos, imagen Alpine oficial pequeña. |
| **Prisma ORM v7** | Drizzle, raw SQL, Sequelize | Type-safety automático desde el schema, migraciones declarativas. |
| **@prisma/adapter-pg** | Prisma v5/v6 estilo clásico | Prisma v7 eliminó la URL del `datasource db` en `schema.prisma`. La configuración vive en `prisma.config.ts` y el cliente recibe un adapter explícito. |
| **OSRM (distancias)** | Google Directions API, Mapbox | Completamente gratuito, open source, retorna distancias reales de ruta (no línea recta). |
| **Nominatim (geocodificación)** | Google Geocoding API | Gratuito, sin API key, cubre localidades argentinas. Rate limit: 1 req/seg — por eso se persisten las coordenadas en DB tras el primer cálculo. |

### 2.3 Decisiones de Negocio / Producto

| Ambigüedad | Decisión | Justificación |
|---|---|---|
| **¿Se pueden editar datos de un camión?** | No. Solo soft-delete (`is_active`). | Las características técnicas son "inalterables" según el dominio. Editarlas invalidaría costos históricos ya calculados. |
| **¿La alerta de capacidad bloquea la asignación?** | No. Solo advierte. | El operador puede asignar intencionalmente para múltiples viajes. Bloquear sería incorrecto de negocio. |
| **¿Geocodificación al crear o al visualizar?** | Al visualizar, con cache en DB. | Nominatim tiene rate limit. Se geocodifica una vez (al abrir el detalle) y se persiste en `origin_lat/lng`. |
| **¿Distancia: línea recta o ruta real?** | OSRM (ruta real), fallback a Haversine. | OSRM es gratuito y da kilómetros reales de carretera. La fórmula Haversine actúa de respaldo si OSRM no responde. |
| **¿Precio de combustible global o por solicitud?** | Global, en tabla `system_config`. | Para el MVP es suficiente. El precio se actualiza desde `/settings`. Los costos ya persistidos no se recalculan retroactivamente. |

### 2.4 Hallazgo crítico: Prisma v7 y el mapeo de columnas

**Problema encontrado durante el smoke test:** Prisma v7 con el nuevo generator `prisma-client` no realiza conversión automática de `camelCase` → `snake_case` en nombres de columna. En versiones anteriores (≤ v5), `requesterName` se mapeaba automáticamente a `requester_name`. En v7, el campo se busca tal cual en la DB.

**Solución aplicada:** Se agregaron anotaciones `@map("snake_case")` explícitas en todos los campos camelCase del schema. Esto mantiene las convenciones de naming de PostgreSQL (snake_case) mientras Prisma sigue usando camelCase en el código TypeScript.

```prisma
model TransportRequest {
  requesterName   String   @map("requester_name")
  cattleCount     Int      @map("cattle_count")
  assignedTruckId String?  @map("assigned_truck_id")
  // ...
}
```

### 2.5 Estructura de Componentes

Implementa Atomic Design con tres niveles:

```
src/components/
├── atoms/       → Primitivos sin lógica de negocio
│                  Button, Badge/StatusBadge, Input
├── molecules/   → Composites simples de dominio
│                  RequestCard, TruckCard,
│                  CapacityAlert, RouteMap
└── organisms/   → Componentes complejos con estado y lógica de negocio
                   DashboardClient, RequestDetailPanel,
                   NewRequestModal, NewTruckForm,
                   TruckSelector, MapInner, Navbar
```

Las páginas en `app/` actúan como templates — componen organismos sin lógica propia.

---

## 3. Modelo de Datos

### Diagrama de relaciones

```
┌──────────────┐         ┌───────────────────────┐
│    trucks    │         │  transport_requests    │
├──────────────┤    0..* ├───────────────────────┤
│ id (PK)      │◄────────│ id (PK)               │
│ plate UNIQUE │         │ requester_name         │
│ max_capacity │         │ requester_phone        │
│fuel_consump. │         │ cattle_count           │
│ is_active    │         │ origin                 │
│ created_at   │         │ destination            │
│ updated_at   │         │ origin_lat/lng         │
└──────────────┘         │ destination_lat/lng    │
                         │ status (ENUM)          │
                         │ assigned_truck_id (FK) │
                         │ distance_km            │
                         │ fuel_cost              │
                         │ created_at / updated_at│
                         └───────────────────────┘

┌───────────────┐
│ system_config │
├───────────────┤
│ key (PK)      │   Registro inicial:
│ value         │   fuel_price_per_liter = '1250'
│ updated_at    │
└───────────────┘
```

### Tabla: `trucks`

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK | Identificador único |
| `plate` | VARCHAR(20) | UNIQUE, NOT NULL | Patente del vehículo (inmutable post-registro) |
| `max_capacity` | INTEGER | NOT NULL, CHECK > 0 | Capacidad máxima en cabezas de ganado |
| `fuel_consumption` | DECIMAL(5,2) | NOT NULL, CHECK > 0 | Consumo en L/km |
| `is_active` | BOOLEAN | DEFAULT true | Soft-delete: false = excluido de asignaciones |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-actualizado por trigger |

**Decisión:** No se permite editar datos técnicos post-registro. Solo se puede desactivar el camión (`is_active = false`), preservando integridad referencial con solicitudes históricas.

### Tabla: `transport_requests`

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `id` | UUID | PK | |
| `requester_name` | VARCHAR(100) | NOT NULL | Nombre del solicitante |
| `requester_phone` | VARCHAR(20) | NULLABLE | Teléfono de contacto |
| `cattle_count` | INTEGER | NOT NULL, CHECK > 0 | Cabezas de ganado a transportar |
| `origin` | VARCHAR(200) | NOT NULL | Localidad de origen (texto libre) |
| `destination` | VARCHAR(200) | NOT NULL | Localidad de destino (texto libre) |
| `origin_lat/lng` | DECIMAL(10,7) | NULLABLE | Coordenadas cacheadas tras geocodificación |
| `destination_lat/lng` | DECIMAL(10,7) | NULLABLE | Coordenadas cacheadas tras geocodificación |
| `status` | ENUM | NOT NULL, DEFAULT 'PENDING' | `PENDING`, `ASSIGNED`, `COMPLETED`, `CANCELLED` |
| `assigned_truck_id` | UUID | FK → trucks.id, ON DELETE SET NULL | Nulo hasta asignación |
| `distance_km` | DECIMAL(10,2) | NULLABLE | Cacheado post-cálculo OSRM |
| `fuel_cost` | DECIMAL(10,2) | NULLABLE | Calculado y persistido al asignar |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Índices:** `status`, `assigned_truck_id`

**Decisión clave:** `origin_lat/lng` y `destination_lat/lng` son NULLABLE. Se geocodifican la primera vez que se abre el detalle de la solicitud y se cachean en la misma fila para no llamar a Nominatim en requests subsiguientes.

### Tabla: `system_config`

| Campo | Tipo | Constraints | Descripción |
|---|---|---|---|
| `key` | VARCHAR(100) | PK | Clave de configuración |
| `value` | VARCHAR(500) | NOT NULL | Valor como string (parseado en la app) |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

Registro inicial: `fuel_price_per_liter = '1250'`

### Fórmula de costo de combustible

```
Costo ($) = Distancia (km) × Consumo (L/km) × Precio por Litro ($)
```

Implementada como función pura en `src/lib/calculations.ts`:

```typescript
export function calculateFuelCost(
  distanceKm: number,
  fuelConsumptionLPerKm: number,
  fuelPricePerLiter: number
): number {
  return distanceKm * fuelConsumptionLPerKm * fuelPricePerLiter;
}
```

Esta función es la única fuente de verdad del cálculo — la usan tanto los endpoints del backend como el selector de camión en el frontend.

---

## 4. API REST

### Convenciones

- Base URL: `/api`
- Formato de respuesta uniforme:
  ```json
  { "data": {...}, "error": null }
  { "data": null, "error": "mensaje legible" }
  ```
- Campos `Decimal` de Prisma siempre convertidos a `Number` antes de serializar
- Validación de body con Zod en todos los endpoints que reciben datos
- Errores de Prisma mapeados a códigos HTTP apropiados (`P2002` → 409, etc.)

### Trucks

#### `GET /api/trucks`

Lista todos los camiones. Acepta `?active=true` para filtrar solo activos.

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "plate": "AB-123-CD",
      "maxCapacity": 30,
      "fuelConsumption": 0.45,
      "isActive": true,
      "createdAt": "2026-06-02T...",
      "updatedAt": "2026-06-02T..."
    }
  ],
  "error": null
}
```

#### `POST /api/trucks`

Registra un nuevo camión.

**Body:**
```json
{ "plate": "XY-999-ZZ", "maxCapacity": 35, "fuelConsumption": 0.48 }
```

**Responses:** `201` creado · `400` validación · `409` patente duplicada

#### `PATCH /api/trucks/:id`

Alterna el estado `isActive` del camión. Si se desactiva un camión con solicitudes activas asignadas, el cambio procede pero la respuesta incluye un campo `warning` con el detalle.

**Response 200:**
```json
{
  "data": { ...truck, "isActive": false },
  "error": null,
  "warning": "Este camión tiene 2 solicitud(es) activa(s) asignada(s)"
}
```

---

### Transport Requests

#### `GET /api/transport-requests`

Lista todas las solicitudes con el camión asignado (JOIN). Acepta `?status=PENDING|ASSIGNED|COMPLETED|CANCELLED`.

#### `POST /api/transport-requests`

Crea una nueva solicitud en estado `PENDING`.

**Body:**
```json
{
  "requesterName": "Juan Pérez",
  "requesterPhone": "+54 9 341 555-1234",
  "cattleCount": 25,
  "origin": "Rosario, Santa Fe",
  "destination": "Córdoba Capital"
}
```

**Responses:** `201` creada · `400` validación

#### `GET /api/transport-requests/:id`

Retorna una solicitud con su camión asignado. **Efecto secundario inteligente:** si las coordenadas de origen/destino son nulas, las geocodifica via Nominatim y las persiste antes de responder. Si `distance_km` es nulo y hay coordenadas, calcula la distancia via OSRM y la persiste también.

Esto garantiza que la primera llamada enriquece los datos y las siguientes son instantáneas (datos ya cacheados).

**Responses:** `200` · `404`

#### `PATCH /api/transport-requests/:id/assign`

Asigna un camión a una solicitud. Realiza:
1. Validación de que el camión existe y está activo
2. Geocodificación de coordenadas si faltan
3. Cálculo de distancia via OSRM si falta
4. Cálculo del costo de combustible con el precio actual de `system_config`
5. Actualización del estado a `ASSIGNED`
6. Verificación de capacidad (no bloquea, informa)

**Body:** `{ "truckId": "uuid" }`

**Response 200:**
```json
{
  "data": { ...request, "status": "ASSIGNED", "fuelCost": 228043 },
  "error": null,
  "capacityWarning": {
    "exceeded": true,
    "tripsNeeded": 3
  }
}
```

**Responses:** `200` · `400` · `404` · `422` (camión inactivo o solicitud completada)

---

### Config

#### `GET /api/config/fuel-price`

Retorna el precio actual de combustible.

```json
{ "data": { "price": 1250, "updatedAt": "2026-06-02T..." }, "error": null }
```

#### `PUT /api/config/fuel-price`

Actualiza el precio. Usa `upsert` por si el registro no existe aún.

**Body:** `{ "price": 1350 }`

---

## 5. Frontend y UI/UX

### Páginas

| Ruta | Tipo | Descripción |
|---|---|---|
| `/` | Server Component + Client shell | Dashboard con estadísticas, grilla de solicitudes y panel de detalle |
| `/fleet` | Client Component | Listado de camiones activos/inactivos con toggle de estado |
| `/fleet/new` | Server + Client form | Formulario de registro de camión |
| `/settings` | Client Component | Configuración de precio de combustible |

### Flujo del Dashboard

```
DashboardPage (Server)
  → fetcha solicitudes via Prisma directamente
  → serializa Decimal → number (Prisma v7 quirk)
  └── DashboardClient (Client)
       ├── Stats bar (pendientes / asignados / completados)
       ├── RequestCard[] → onClick → setSelectedId
       ├── NewRequestModal (formulario react-hook-form)
       └── RequestDetailPanel (cuando hay selectedId)
            ├── fetch GET /api/transport-requests/:id
            │     (geocodifica + calcula distancia si faltan)
            ├── fetch GET /api/trucks?active=true
            ├── fetch GET /api/config/fuel-price
            ├── RouteMap (Leaflet, dynamic import ssr:false)
            │     → MapInner.tsx con marcadores SVG custom
            ├── TruckSelector → cálculo de costo client-side reactivo
            ├── CapacityAlert (ok / tight / exceeded + tripsNeeded)
            └── PATCH /api/.../assign → refresh via router.refresh()
```

### Integración de Mapas (Leaflet)

Leaflet no funciona en SSR porque requiere acceso al DOM. Solución aplicada:

```typescript
// RouteMap.tsx
const MapInner = dynamic(() => import("./MapInner"), { ssr: false });
```

`MapInner.tsx` importa Leaflet y sus CSS directamente. Los marcadores son `L.divIcon` con SVG inline (verde para origen, rojo para destino), evitando el problema clásico de los íconos por defecto de Leaflet en Next.js.

La polilínea entre origen y destino es una línea recta (no sigue carreteras). La distancia real sí es de OSRM — la polilínea es visual/orientativa.

### Cálculo de Costo en Tiempo Real

El costo de combustible se actualiza instantáneamente al seleccionar un camión sin hacer ningún request al servidor. Todos los datos necesarios (distancia, consumo, precio) están disponibles en el cliente al momento de abrir el panel. La fórmula se ejecuta en `lib/calculations.ts` y el resultado se muestra con su desglose:

```
405.4 km × 0.45 L/km × $1.250/L = $228.043
```

### Alerta de Capacidad

Tres estados visuales:

| Estado | Condición | Color |
|---|---|---|
| OK | `cattleCount ≤ maxCapacity × 0.9` | Verde |
| Tight | `cattleCount > maxCapacity × 0.9` | Ámbar |
| Exceeded | `cattleCount > maxCapacity` | Rojo |

En estado `Exceeded` se muestra: número de viajes necesarios (`Math.ceil(cattleCount / maxCapacity)`) y el camión alternativo con mayor capacidad disponible en la flota activa.

---

## 6. Infraestructura y Docker

### Servicios

| Servicio | Imagen | Puerto | Descripción |
|---|---|---|---|
| `db` | `postgres:15-alpine` | 5432 | Base de datos PostgreSQL |
| `app` | Build local (Dockerfile) | 3000 | Aplicación Next.js |

### Dockerfile — Multi-stage build

```
Stage 1 (deps):    node:20-alpine → npm install
Stage 2 (builder): deps + código fuente → prisma generate + next build
Stage 3 (runner):  Alpine mínimo → solo artefactos de .next/standalone
```

El stage `runner` usa `output: "standalone"` de Next.js, que bundlea todas las dependencias necesarias para correr el servidor sin `node_modules`. La imagen final pesa significativamente menos que una imagen que incluye node_modules completo.

**Nota:** Se usa `npm install` en lugar de `npm ci` para mayor tolerancia ante diferencias en el lock file entre el ambiente de desarrollo y el contenedor.

### docker-compose.yml

- El servicio `db` monta `./docker/init.sql` en `/docker-entrypoint-initdb.d/` → se ejecuta automáticamente en el primer arranque
- El servicio `app` tiene `depends_on: db: condition: service_healthy` → el app no arranca hasta que Postgres pasa el healthcheck (`pg_isready`)
- El volumen `postgres_data` persiste los datos entre reinicios del contenedor
- Variables de entorno con defaults (`${VAR:-default}`) para funcionar sin `.env` con valores de desarrollo

### Variables de entorno

| Variable | Descripción | Default en docker-compose |
|---|---|---|
| `DATABASE_URL` | Connection string de Prisma | Construida desde las vars de Postgres |
| `POSTGRES_USER` | Usuario de PostgreSQL | `bovitrans` |
| `POSTGRES_PASSWORD` | Contraseña | `bovitrans_pass` |
| `POSTGRES_DB` | Nombre de la base | `bovitrans` |

---

## 7. Cómo Correr el Proyecto

### Requisitos

- **Para el modo híbrido (recomendado):** Node.js 20+ y OrbStack o Docker Desktop
- **Para Docker completo:** solo OrbStack o Docker Desktop (no requiere Node.js local)

### Desarrollo híbrido — DB en Docker + hot reload (recomendado para desarrollo activo)

El modo más cómodo para desarrollo: PostgreSQL corre en Docker, Next.js corre localmente con hot reload. Cualquier cambio de código se refleja instantáneamente sin rebuild.

**Requisitos:** Node.js 20+ y OrbStack (o Docker Desktop).

```bash
# 1. Solo la base de datos en Docker
docker compose up db -d

# 2. Variables de entorno apuntando a localhost
cp .env.example .env.local
# DATABASE_URL ya viene configurado con los valores por defecto:
# postgresql://bovitrans:bovitrans_pass@localhost:5432/bovitrans

# 3. Generar Prisma Client localmente
npx prisma generate

# 4. Servidor con hot reload
npm run dev
# → http://localhost:3000
```

**Datos semilla:** `docker/init.sql` se ejecuta automáticamente en el primer inicio del contenedor de DB. Incluye 4 camiones, 5 solicitudes y el precio de combustible.

---

### Con Docker completo (para validar el build de producción)

```bash
# Levantar app + DB en contenedores
docker compose up --build

# La app estará disponible en http://localhost:3000
```

El comando `docker compose up --build`:
- Construye la imagen de Next.js (multi-stage, standalone output)
- Descarga la imagen de PostgreSQL 15
- Inicializa la DB con `docker/init.sql` (schema + datos semilla)
- Espera a que la DB esté healthy antes de arrancar la app

---

### Desarrollo local sin Docker

Requiere Node.js 20+ y PostgreSQL instalado localmente.

```bash
npm install
cp .env.example .env.local
# Editar DATABASE_URL con tu conexión local

psql -U postgres -c "CREATE DATABASE bovitrans;"
psql -U postgres -d bovitrans -f docker/init.sql

npx prisma generate
npm run dev
```

### Comandos útiles

```bash
# Detener y eliminar contenedores (mantiene datos del volumen)
docker compose down

# Detener y eliminar TODO (contenedores + volumen + datos)
docker compose down -v

# Ver logs en tiempo real
docker compose logs -f app
docker compose logs -f db

# Acceder a la DB directamente
docker compose exec db psql -U bovitrans -d bovitrans

# Type-check
npm run type-check

# Lint (incluye verificación de strings hardcodeados en JSX)
npm run lint

# Verificar keys de i18n inexistentes (TypeScript)
npm run type-check

# Tests unitarios
npm test

# Tests con coverage
npm run test:coverage
```

### Colima (macOS sin Docker Desktop)

Si no tenés Docker Desktop instalado, podés usar Colima:

```bash
brew install colima docker docker-compose
colima start
mkdir -p ~/.docker && echo '{"cliPluginsExtraDirs":["/opt/homebrew/lib/docker/cli-plugins"]}' > ~/.docker/config.json
docker compose up --build
```
