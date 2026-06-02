# BoviTrans — Plataforma de Gestión de Transporte Ganadero

MVP de logística para el transporte terrestre de ganado vacuno. Permite gestionar solicitudes de transporte, asignar camiones, visualizar rutas en un mapa interactivo y calcular costos de combustible en tiempo real.

## Stack

- **Frontend:** Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4, react-leaflet + OpenStreetMap
- **Backend:** API Routes de Next.js, Prisma v7 + PostgreSQL 15
- **Mapas y geocodificación:** Nominatim (gratuito, sin API key), OSRM (distancias reales por ruta)
- **i18n:** next-intl v4 — strings centralizados en `messages/es.json`
- **Calidad:** Vitest (tests unitarios), eslint-plugin-i18next, eslint-plugin-jsx-a11y, @axe-core/react

## Inicio rápido (modo híbrido — recomendado)

DB en Docker + Next.js con hot reload local. Requiere Node.js 20+ y OrbStack (o Docker Desktop).

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar solo la base de datos
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

La DB se inicializa automáticamente con datos semilla: 4 camiones, 5 solicitudes y precio de combustible configurado.

## Comandos

```bash
npm run dev          # Servidor de desarrollo con hot reload
npm test             # Tests unitarios (Vitest, 27 tests)
npm run test:coverage # Tests con reporte de cobertura
npm run lint         # ESLint (incluye reglas i18n y a11y)
npm run type-check   # TypeScript sin emitir archivos
npm run build        # Build de producción
```

## Docker completo (para validar el build de producción)

```bash
docker compose up --build
# → http://localhost:3000
```

## Documentación

Ver [`DOCUMENTACION.md`](./DOCUMENTACION.md) para:
- Arquitectura y decisiones de diseño
- Modelo de datos y API reference
- Configuración de Docker y variables de entorno
- Guía de troubleshooting

Ver [`BACKLOG.md`](./BACKLOG.md) para:
- Épicas, historias de usuario y criterios de aceptación
- Árbol de conversación con Claude (decisiones técnicas y de producto)

Ver [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md) para el plan de pruebas manual con casos de borde.
