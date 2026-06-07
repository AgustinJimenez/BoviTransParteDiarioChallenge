# Preguntas probables — Entrevista técnica BoviTrans

---

## Sobre el proceso con Claude (25% de la rúbrica — el más pesado)

**¿Cómo usaste Claude en este proyecto?**
Lo usé en todas las fases: primero como analista de negocios para descomponer la descripción conceptual en épicas, historias de usuario y criterios de aceptación (eso está en `BACKLOG.md`). Después como arquitecto para definir el modelo de datos, los contratos de API y la estructura de componentes antes de escribir código. Durante el desarrollo lo usé como pair programmer para generar route handlers, componentes y configuración Docker. También me ayudó a detectar bugs que yo no había visto — el más importante fue el de Prisma v7 con los campos `@map`.

**¿Qué es el archivo `.claude/custom_instructions.md`?**
Es el "system prompt" que le da contexto a Claude sobre el proyecto. Le define su rol (analista/arquitecto del dominio logístico ganadero paraguayo), el stack técnico, el formato en que tiene que responder los requerimientos (Dado/Cuando/Entonces), y principios de negocio como que la lógica de cálculo siempre vive en el backend. Eso hace que las respuestas sean consistentes a lo largo de toda la sesión.

**¿Cómo te aseguraste que el código generado por Claude era correcto?**
Revisión en cada paso — Claude propone, yo valido. Algunas cosas las corrijo directamente, otras las rechazo y pido una alternativa. El árbol de conversación en `BACKLOG.md` muestra eso: hay intercambios donde detectamos un problema juntos y corregimos el approach. Los tests también actúan como red de seguridad — si Claude genera código que rompe un test, lo vemos inmediatamente.

---

## Sobre la arquitectura

**¿Por qué Next.js fullstack en lugar de un backend separado?**
Para un MVP de esta escala no tiene sentido la complejidad operativa de dos repositorios, dos Dockerfiles y dos procesos de deploy. Los API Route Handlers de Next.js cubren todos los endpoints necesarios. Si el proyecto escala, los handlers se pueden extraer a un microservicio sin cambiar los contratos de API — son funciones puras que reciben un `Request` y devuelven un `Response`.

**¿Cómo separás Server Components de Client Components?**
La regla es simple: si el componente solo muestra datos (sin estado reactivo, sin eventos del browser), es Server Component y fetchea directamente con Prisma. Si necesita `useState`, `useEffect`, formularios o mapas, es Client Component. Las páginas de detalle por ejemplo son Server Components que fetchean la solicitud y los camiones, y pasan los datos a un Client Component (`RequestAssignmentClient`) que maneja la interactividad.

**¿Por qué Atomic Design?**
Para evitar que los componentes crezcan sin límite. `atoms/` son primitivos sin lógica de negocio (Button, Badge). `molecules/` son composites de dominio sin llamadas a API (RequestCard, TruckCard). `organisms/` tienen estado y lógica compleja (DashboardClient, TruckSelector). Cuando un componente empieza a crecer demasiado, la estructura te dice exactamente dónde dividirlo.

---

## Sobre el modelo de datos y Prisma

**¿Cuál fue el problema más importante que encontraste con Prisma v7?**
Que en v7 eliminaron la conversión automática de `camelCase` a `snake_case`. En versiones anteriores, si definías `requesterName` en el schema, Prisma lo mapeaba automáticamente a `requester_name` en la DB. En v7 lo busca tal cual — `requesterName` — que no existe en PostgreSQL, y el query falla silenciosamente o tira un error críptico. La solución es agregar `@map("requester_name")` explícito en cada campo. Lo detectamos durante el primer smoke test.

**¿Por qué `fuel_cost` se persiste en la DB en lugar de calcularse on-the-fly?**
Porque el precio de combustible puede cambiar. Si lo calculara on-the-fly, una solicitud asignada ayer con Gs. 7.500/litro mostraría un costo diferente mañana si el precio sube a Gs. 8.000. El costo se congela en el momento de la asignación — eso refleja la realidad del negocio: el operador cotizó un precio y ese precio no cambia retroactivamente.

**¿Para qué sirven `origin_lat/lng` y `destination_lat/lng` siendo nullable?**
Para el caché de geocodificación. Nominatim tiene un rate limit de 1 request por segundo. Si geocodificara en el momento de crear la solicitud, con 500 solicitudes simultáneas colapsaría la API. Lo que hacemos es geocodificar lazy: la primera vez que alguien abre el detalle de la solicitud, el server geocodifica y persiste las coordenadas. Las siguientes veces ya están en la DB y la respuesta es instantánea.

---

## Sobre la fórmula y los cálculos

**¿Dónde vive la fórmula de costo de combustible y por qué?**
En `src/lib/calculations.ts`, y es la única fuente de verdad. Tanto el backend (al asignar un camión) como el frontend (el cálculo reactivo en el TruckSelector) importan la misma función `calculateFuelCost`. Si la fórmula cambia, el cambio se propaga a ambos lados automáticamente. Nunca hay divergencia entre lo que muestra el frontend y lo que guarda el backend.

**¿Cómo funciona el cálculo client-side en el TruckSelector?**
Cuando el usuario selecciona un camión, el costo se calcula instantáneamente en el browser sin ningún request al servidor. Todos los datos que necesita ya están disponibles en el cliente cuando se abre la página: la distancia está en el objeto `request`, el consumo está en cada objeto `truck`, y el precio vino con el fetch inicial de la página. La función `calculateFuelCost` se ejecuta en el handler del `onChange` del selector.

**¿Cómo se obtiene la distancia?**
Primero intentamos OSRM — un servicio open source de routing que devuelve kilómetros reales de carretera entre dos coordenadas. Si OSRM no responde, caemos a Haversine, que calcula la distancia en línea recta entre las coordenadas. La distancia real de ruta siempre va a ser mayor que la línea recta, así que el fallback sub-estima el costo, pero es mejor que romper la experiencia.

---

## Sobre la UI y el mapa

**¿Leaflet es gratis? ¿Por qué no Mapbox o Google Maps?**
Leaflet es open source (licencia BSD-2), gratis sin límites y sin API key. Pero Leaflet es solo la librería de renderizado — por sí sola no muestra nada. Necesita un proveedor de *tiles* (las imágenes del mapa divididas en cuadrados). Acá usamos **OpenStreetMap (OSM)**, que también es gratuito y open source, mantenido por la comunidad.

La decisión completa fue: Leaflet (renderizado) + OSM tiles (mapa base) + Nominatim (geocodificación) + OSRM (distancias) — todo gratuito, todo sin API key.

| Alternativa | Costo | Límite gratuito |
|---|---|---|
| Mapbox GL JS | Pago a partir de cierto volumen | 50.000 loads/mes gratis |
| Google Maps JS API | Pago por request | USD 200 de crédito/mes |
| Leaflet + OSM | Gratis | Sin límite de requests* |

**Limitaciones reales de este stack gratuito:**

- **OSM tiles en producción con alto tráfico**: el servidor de tiles de OSM tiene una [política de uso](https://operations.osmfoundation.org/policies/tiles/) que desaconseja usarlo para apps comerciales con mucho tráfico. Para producción real habría que hostear tiles propios (ej. con Maptiler Cloud, que tiene tier gratuito generoso) o usar un CDN de tiles pago. Para un MVP de demostración como este está perfectamente bien.
- **Nominatim rate limit**: máximo 1 request por segundo, y también desaconseja uso masivo sin hostear la instancia propia. Por eso el sistema cachea las coordenadas en la DB después del primer geocoding — en práctica Nominatim se llama una sola vez por solicitud.
- **OSRM público**: el servidor demo de OSRM (`router.project-osrm.org`) es para desarrollo/demo, no para producción. Puede estar caído o lento. Por eso existe el fallback a Haversine — si OSRM no responde en tiempo razonable, calculamos la distancia en línea recta.
- **Leaflet vs Mapbox GL**: Leaflet usa tiles rasterizados (imágenes PNG/JPG). Mapbox GL usa tiles vectoriales — más suaves al hacer zoom, más configurables visualmente, mejor en mobile. Para trazado de rutas ganaderas esto no es un problema práctico.

**Resumiendo:** para un MVP sin presupuesto es la decisión correcta. Para escalar a producción con tráfico real, el primer cambio sería reemplazar el servidor de tiles público de OSM por una solución hosteada, manteniendo Leaflet como librería (que sigue siendo gratis).

**¿Se puede eliminar completamente la dependencia de servicios externos de mapas?**
Sí, todo el stack de mapas se puede auto-hostear en el mismo `docker-compose.yml`, sin ninguna dependencia externa, sin rate limits, funcionando offline.

Los tres servicios externos que usa la app actualmente son:

| Servicio actual | Qué hace | Reemplazo auto-hosteado | Docker image |
|---|---|---|---|
| OSM tile servers | Imágenes del mapa base | `maptiler/tileserver-gl` | ~200MB imagen + tileset |
| Nominatim público | Convierte texto → coordenadas | `mediagis/nominatim` | ~200MB imagen + dump OSM |
| OSRM público | Calcula distancia real por ruta | `osrm/osrm-backend` | ~100MB imagen + datos de ruta |

**¿Qué archivos de datos necesitás?**

Todo viene de [Geofabrik](https://download.geofabrik.de/), que distribuye extractos de OpenStreetMap por país y región:

- **Paraguay** (`paraguay-latest.osm.pbf`) — ~90MB. Se usa para Nominatim y OSRM.
- **Tileset** — el archivo `.mbtiles` con las imágenes del mapa. Paraguay solo pesa ~500MB. Sudamérica completa ~70GB. Podés elegir la granularidad que necesitás.

**¿Cómo quedaría el docker-compose?**

```yaml
services:
  tiles:
    image: maptiler/tileserver-gl
    volumes:
      - ./map-data/paraguay.mbtiles:/data/paraguay.mbtiles
    ports:
      - "8080:8080"

  nominatim:
    image: mediagis/nominatim:4.4
    environment:
      PBF_URL: file:///data/paraguay.osm.pbf
      POSTGRES_PASSWORD: nominatim
    volumes:
      - ./map-data/paraguay.osm.pbf:/data/paraguay.osm.pbf
      - nominatim_data:/var/lib/postgresql/14/main
    ports:
      - "8081:8080"

  osrm:
    image: osrm/osrm-backend
    volumes:
      - ./map-data:/data
    command: osrm-routed --algorithm mld /data/paraguay.osrm
    ports:
      - "5000:5000"
```

Y en la app, cambiarías las URLs de los servicios de variables de entorno:
```
NOMINATIM_URL=http://nominatim:8081
OSRM_URL=http://osrm:5000
TILES_URL=http://tiles:8080
```

**Tiempo de setup:**
- Descargar el `.osm.pbf` de Paraguay: ~2 minutos
- Preprocesar OSRM (`osrm-extract` + `osrm-partition` + `osrm-customize`): ~2-3 minutos para Paraguay
- Nominatim primera importación: ~10-15 minutos (indexa todos los lugares del país)
- Tileserver: arranca en segundos, solo necesita el `.mbtiles`

**¿Por qué no lo implementamos así desde el principio?**
Para el MVP priorizamos que cualquier evaluador pueda levantar el proyecto con un solo `docker compose up --build` sin tener que descargar archivos de datos externos de cientos de MB. Los servidores públicos de OSM/Nominatim/OSRM son perfectos para demo y desarrollo. Para un deploy de producción real, el siguiente paso natural sería migrar a esta arquitectura auto-hosteada.

**¿Por qué Leaflet con `dynamic import` y `ssr: false`?**
Leaflet usa `window` y `document` directamente — objetos que no existen en el servidor de Node.js. Si intentás importarlo en un Server Component o sin el guard de SSR, el build falla. Con `dynamic(() => import("./MapInner"), { ssr: false })` Next.js solo carga Leaflet en el browser, nunca en el servidor.

**¿Por qué `L.divIcon` con SVG inline en lugar de los íconos por defecto de Leaflet?**
Los íconos por defecto de Leaflet referencian archivos de imagen con rutas relativas que asumen una estructura de carpetas específica. En Next.js esas rutas no resuelven correctamente después del build. Con `L.divIcon` y SVG inline, el ícono es un string HTML puro — no hay rutas de archivo que resolver.

**¿Cómo funciona la alerta de capacidad?**
Tiene tres estados: OK (ocupación < 90%), Ajustado (90-100%), Excedido (> 100%). Cuando está excedido muestra los viajes necesarios (`Math.ceil(cattleCount / maxCapacity)`) y sugiere el camión alternativo. La lógica de sugerencia busca el camión de **menor capacidad que pueda atender el pedido completo** — no el más grande, sino el mínimo suficiente. Si ninguno puede, sugiere el de mayor capacidad como mejor alternativa.

---

## Sobre los tests

**¿Cuáles son las tres capas de tests y qué cubre cada una?**
Unitarios: funciones puras sin dependencias externas — `calculations.ts` (la fórmula), `phoneFormat.ts` (formateador internacional), `format.ts` (formateo numérico locale es-AR). Son 87 tests, corren en 100ms sin DB ni red.

Integración: llaman a los route handlers de Next.js directamente construyendo un `NextRequest` — sin servidor HTTP, sin mocks, con una DB real (`bovitrans_test`). Cubren paginación, filtros, validaciones, transiciones de estado. Son 31 tests.

E2E con Playwright: flujos completos en un browser real contra un servidor Next.js en producción (puerto 3001) con una DB dedicada (`bovitrans_e2e`). Cubren el golden path completo.

**¿Por qué los tests de integración llaman handlers directamente en lugar de hacer HTTP?**
Es más rápido y más preciso. Con HTTP necesitarías levantar un servidor, esperar que esté healthy, y tener una capa de red en el medio. Llamando al handler directamente (`GET(new NextRequest(...))`) el test ejecuta exactamente el mismo código que ejecutaría un request real, sin overhead. La única diferencia es que no pasa por el middleware de Next.js, pero para probar la lógica de negocio no hace falta.

---

## Sobre Docker

**¿Qué hace el multi-stage build en el Dockerfile?**
Tres stages: `deps` instala `node_modules`, `builder` copia el código y corre `next build`, `runner` toma solo los artefactos del `.next/standalone` — sin `node_modules`, sin código fuente, sin herramientas de build. La imagen final es significativamente más pequeña porque no incluye todo lo que solo se necesita en tiempo de build.

**¿Por qué `depends_on: condition: service_healthy` en lugar de solo `depends_on`?**
Con solo `depends_on`, Docker arranca el contenedor de la app apenas el contenedor de la DB existe — pero PostgreSQL tarda unos segundos en inicializarse. Sin el healthcheck, la app intenta conectarse antes de que Postgres esté listo y falla. Con `service_healthy`, Docker espera a que `pg_isready` retorne OK antes de arrancar la app.

**¿Cómo manejás las credenciales sin hardcodearlas?**
El `docker-compose.yml` usa `env_file` con dos entradas: `.env` (si existe, ignorado por git) y `.env.example` (fallback para desarrollo, commiteado). Las credenciales solo aparecen en el `.env.example` — que es reconocido como archivo de plantilla, no como secret real. Para producción, el operador crea un `.env` con credenciales reales y ese archivo nunca llega al repositorio.

---

## Sobre i18n y calidad de código

**¿Por qué i18n si la app es solo en español?**
Principalmente por el ESLint rule `eslint-plugin-i18next` que detecta strings hardcodeados en JSX. Te obliga a centralizar todos los textos de la UI en `messages/es.json`. El beneficio inmediato no es la traducción — es que tenés un inventario completo de toda la copy de la app en un solo lugar, y TypeScript valida que cada key que usás existe. Si borrás una key del JSON, el build falla.

**¿Qué son las arrow functions obligatorias y por qué?**
Una regla de ESLint (`react/function-component-definition`) que rechaza `function Component()` y solo acepta `const Component = () =>`. La razón es consistencia — un componente y una función utilitaria tienen exactamente la misma sintaxis, lo que hace más fácil moverlos, extraerlos o reorganizarlos sin cambiar su forma.
