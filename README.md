# BoviTrans — Plataforma de Gestión de Transporte Ganadero

MVP de logística para digitalizar el transporte terrestre de ganado vacuno en Paraguay. Permite gestionar solicitudes de transporte, asignar camiones de la flota, visualizar rutas en un mapa interactivo y calcular costos de combustible en tiempo real.

---

## Características principales

- **Dashboard con infinite scroll** — grilla paginada de solicitudes, filtros por estado y búsqueda en tiempo real
- **Mapa interactivo (Leaflet + OSM)** — marcadores de origen/destino, distancia real via OSRM, geocodificación via Nominatim con caché en DB
- **Asignación de camiones** — selector con cálculo de costo client-side reactivo (sin round-trips al servidor)
- **Alerta de capacidad** — tres estados (OK / ajustado / excedido) con sugerencia del camión mínimo suficiente y cantidad de viajes necesarios
- **Transiciones de estado** — botones para marcar solicitudes como completadas o canceladas, con máquina de estados estricta en el backend
- **Gestión de flota** — registro y soft-delete de camiones con advertencia si hay solicitudes activas asignadas
- **Configuración de precio de combustible** — precio global parametrizable en Gs. (Guaraníes), los costos ya persistidos no se recalculan retroactivamente
- **i18n** — todos los strings en `messages/es.json`, validados en tiempo de lint y compilación

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 — App Router, React Server Components + Client Components |
| Lenguaje | TypeScript strict |
| Estilos | Tailwind CSS v4 |
| ORM | Prisma v7 + `@prisma/adapter-pg` |
| Base de datos | PostgreSQL 15 |
| Mapas | react-leaflet v5 + OpenStreetMap (sin API key) |
| Geocodificación | Nominatim (gratuito, rate limit: 1 req/s) |
| Distancias | OSRM (rutas reales, gratuito, fallback Haversine) |
| Formularios | react-hook-form v7 + Zod v4 |
| i18n | next-intl v4 |
| Tests | Vitest (unitarios + integración), Playwright (E2E) |
| Infraestructura | Docker + docker-compose, OrbStack en macOS |

---

## Inicio rápido

### Opción A — DB en Docker + hot reload local (recomendado para desarrollo)

Requiere Node.js 20+ y OrbStack o Docker Desktop.

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar solo la base de datos en Docker
docker compose up db -d

# 3. Variables de entorno para desarrollo local
cp .env.example .env.local
# DATABASE_URL ya apunta a localhost:5432 con los valores por defecto

# 4. Generar Prisma Client
npx prisma generate

# 5. Servidor con hot reload
npm run dev
# → http://localhost:3000
```

La DB se inicializa automáticamente con datos semilla: 4 camiones, 5 solicitudes en distintos estados y precio de combustible configurado en Gs. 7.500/litro.

### Opción B — Docker completo (para validar el build de producción)

```bash
docker compose up --build
# → http://localhost:3000
```

---

## Comandos útiles

```bash
npm run dev              # Servidor de desarrollo con hot reload
npm test                 # Tests unitarios — 87 tests (Vitest, sin DB)
npm run test:coverage    # Tests con reporte de cobertura HTML
npm run test:integration # Tests de integración API contra bovitrans_test DB
npm run test:e2e         # Tests E2E Playwright contra bovitrans_e2e DB
npm run lint             # ESLint — incluye reglas i18n, a11y y arrow-function
npm run type-check       # TypeScript sin emitir archivos
npm run build            # Build de producción (Next.js standalone)
```

---

## Arquitectura

```
Next.js 16 (monorepo fullstack)
│
├── app/                     # App Router — páginas y API routes
│   ├── api/
│   │   ├── transport-requests/     # GET (paginado+filtros), POST
│   │   │   ├── [id]/assign/        # PATCH — asignación de camión
│   │   │   └── [id]/status/        # PATCH — transiciones de estado
│   │   ├── trucks/                 # GET, POST, PATCH (toggle activo)
│   │   └── config/fuel-price/      # GET, PUT
│   ├── requests/[id]/              # Detalle de solicitud (Server + Client)
│   ├── fleet/                      # Gestión de flota
│   └── settings/                   # Configuración de precio
│
├── src/components/
│   ├── atoms/      # Button, Badge/StatusBadge, Input
│   ├── molecules/  # RequestCard, TruckCard, CapacityAlert, RouteMap, FilterBar
│   └── organisms/  # DashboardClient, NewRequestModal, TruckSelector, Sidebar
│
├── src/lib/
│   ├── calculations.ts   # Fórmula de combustible — única fuente de verdad
│   ├── format.ts         # Formateo numérico es-AR — única fuente de verdad
│   └── phoneFormat.ts    # Formateador internacional (+595 Paraguay, +54 Argentina, etc.)
│
└── src/integration/      # Tests de integración API (Vitest + DB real)
```

**Fórmula de costo de combustible:**
```
Costo (Gs.) = Distancia (km) × Consumo (L/km) × Precio por Litro (Gs.)
```
Implementada exclusivamente en `src/lib/calculations.ts`. Tanto el backend como el frontend usan esta misma función.

---

## Tests

| Capa | Herramienta | Tests | Comando |
|---|---|---|---|
| Unitaria | Vitest | 87 | `npm test` |
| Integración API | Vitest + bovitrans_test DB | 31 | `npm run test:integration` |
| E2E browser | Playwright + bovitrans_e2e DB | — | `npm run test:e2e` |

Los tests de integración llaman a los route handlers de Next.js directamente (sin servidor HTTP). Cada test trunca las tablas antes de ejecutarse para garantizar aislamiento.

---

## Proceso de desarrollo asistido por IA

Este proyecto fue construido usando **Claude** en cada fase del ciclo de desarrollo:

1. **Ingeniería de requerimientos** — Claude actuó como analista de negocios y arquitecto, descomponiendo la descripción conceptual en épicas, historias de usuario, criterios de aceptación y tareas técnicas (ver [`BACKLOG.md`](./BACKLOG.md) con el árbol de conversaciones completo)

2. **Diseño de arquitectura** — decisiones de stack, modelo de datos, API contracts y estructura de componentes validadas con Claude antes de implementar

3. **Codificación asistida** — generación de route handlers, componentes React, schema Prisma y configuración Docker con revisión humana en cada paso

4. **Calidad** — detección de bugs (Prisma v7 camelCase sin `@map`, Decimal no convertido a Number, contrast WCAG AA), generación de casos de prueba y análisis de edge cases de negocio

5. **Documentación** — [`DOCUMENTACION.md`](./DOCUMENTACION.md) generado y mantenido con asistencia de Claude, incluyendo decisiones de diseño y justificaciones

El archivo [`.claude/custom_instructions.md`](./.claude/custom_instructions.md) define el rol de Claude como analista/arquitecto del dominio logístico ganadero y establece las convenciones de formato de requerimientos usadas a lo largo del proyecto.

---

## Documentación

| Archivo | Contenido |
|---|---|
| [`DOCUMENTACION.md`](./DOCUMENTACION.md) | Arquitectura, modelo de datos, API reference, Docker, decisiones de diseño |
| [`BACKLOG.md`](./BACKLOG.md) | Épicas, historias de usuario, criterios de aceptación, prompts usados con Claude |
| [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md) | Plan de pruebas manual con casos de borde y matriz de riesgo |
