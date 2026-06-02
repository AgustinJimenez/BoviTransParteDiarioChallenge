# BACKLOG — BoviTrans MVP

> Generado con Claude (claude-sonnet-4-6) actuando como Analista de Negocios y Arquitecto de Software.
> El árbol de conversación y los prompts utilizados se documentan al final de este archivo.

---

## Índice de Épicas

| ID | Épica | Historias |
|---|---|---|
| EP-01 | Administración de Flotas | US-01, US-02, US-03 |
| EP-02 | Gestión de Solicitudes de Transporte | US-04, US-05, US-06 |
| EP-03 | Inteligencia de Rutas y Costos | US-07, US-08, US-09 |
| EP-04 | Panel de Operaciones y Asignación | US-10, US-11, US-12 |
| EP-05 | Configuración e Infraestructura | US-13, US-14 |

---

## EP-01: Administración de Flotas

> El operador necesita registrar y gestionar su flota de camiones para que puedan ser asignados a solicitudes de transporte. Cada vehículo tiene características técnicas fijas que determinan su capacidad y eficiencia.

---

### US-01: Registro de Camión

**Como** operador logístico, **quiero** registrar un nuevo camión con su patente, capacidad máxima de ganado y consumo de combustible, **para** tenerlo disponible como opción de asignación en las solicitudes de transporte.

#### Criterios de Aceptación

- **Dado que** estoy en el módulo de Flotas
  **Cuando** completo el formulario con patente, capacidad (cabezas) y consumo (L/km) y confirmo
  **Entonces** el camión aparece en el listado de flota activa con sus datos correctos

- **Dado que** intento registrar un camión con una patente que ya existe en el sistema
  **Cuando** envío el formulario
  **Entonces** el sistema muestra un error claro indicando que la patente ya está registrada y no crea el duplicado

- **Dado que** dejo algún campo obligatorio vacío o ingreso un valor negativo en capacidad o consumo
  **Cuando** intento enviar el formulario
  **Entonces** el sistema muestra validaciones inline por campo antes de llegar al servidor

#### Tareas Técnicas

- [ ] TASK-01: Diseñar y crear tabla `trucks` en PostgreSQL
  - [ ] Campos: `id` (UUID PK), `plate` (VARCHAR, UNIQUE, NOT NULL), `max_capacity` (INTEGER, NOT NULL, CHECK > 0), `fuel_consumption` (DECIMAL(5,2), NOT NULL, CHECK > 0), `is_active` (BOOLEAN, DEFAULT true), `created_at`, `updated_at`
  - [ ] Índice único sobre `plate`
  - [ ] Datos semilla: 4 camiones con capacidades y consumos realistas (ej. 20-40 cabezas, 0.35-0.55 L/km)

- [ ] TASK-02: Crear endpoint `POST /api/trucks`
  - [ ] Validación de body con Zod: patente formato regex, capacity entero positivo, fuel_consumption decimal positivo
  - [ ] Manejo de error 409 si patente duplicada
  - [ ] Retorna 201 con el recurso creado

- [ ] TASK-03: Crear formulario de registro de camión en `/fleet/new`
  - [ ] Campos: Patente, Capacidad (cabezas), Consumo (L/km)
  - [ ] Validación client-side con react-hook-form + Zod
  - [ ] Feedback visual de éxito/error post-submit
  - [ ] Redirige al listado tras registro exitoso

---

### US-02: Visualización de Flota

**Como** operador logístico, **quiero** ver el listado completo de camiones registrados con sus características técnicas, **para** conocer los recursos disponibles al momento de asignar un transporte.

#### Criterios de Aceptación

- **Dado que** hay camiones registrados en el sistema
  **Cuando** accedo al módulo de Flotas
  **Entonces** veo una tabla/grilla con todos los camiones activos mostrando patente, capacidad y consumo

- **Dado que** no hay camiones registrados
  **Cuando** accedo al módulo de Flotas
  **Entonces** veo un estado vacío con un llamado a la acción para registrar el primer camión

- **Dado que** hay camiones tanto activos como inactivos
  **Cuando** visualizo el listado
  **Entonces** los camiones inactivos se diferencian visualmente (ej. opacidad reducida, badge "Inactivo") pero siguen siendo visibles

#### Tareas Técnicas

- [ ] TASK-04: Crear endpoint `GET /api/trucks`
  - [ ] Retorna lista completa con todos los campos no sensibles
  - [ ] Soporte para query param `?active=true` para filtrar solo activos
  - [ ] Respuesta 200 con array (vacío si no hay registros)

- [ ] TASK-05: Crear página `/fleet` con listado de camiones
  - [ ] Tabla responsiva con columnas: Patente, Capacidad, Consumo, Estado, Acciones
  - [ ] Estado vacío con ilustración y CTA
  - [ ] Botón "Registrar camión" que navega a `/fleet/new`
  - [ ] Indicador visual de estado activo/inactivo

---

### US-03: Desactivación de Camión

**Como** operador logístico, **quiero** desactivar un camión de la flota, **para** que no esté disponible para nuevas asignaciones sin perder su historial de viajes.

> ⚠️ **Decisión de diseño:** La especificación indica que las características del vehículo son "inalterables". Se opta por soft-delete (campo `is_active`) en lugar de eliminación física, preservando integridad referencial con solicitudes históricas. No se permite edición de datos técnicos del camión una vez registrado.

#### Criterios de Aceptación

- **Dado que** un camión está activo en el listado de flota
  **Cuando** el operador selecciona "Desactivar" y confirma el diálogo
  **Entonces** el camión pasa a estado inactivo y no aparece como opción en el selector de camiones del dashboard

- **Dado que** un camión está activo y tiene solicitudes de transporte pendientes asignadas
  **Cuando** el operador intenta desactivarlo
  **Entonces** el sistema muestra una advertencia indicando los viajes pendientes afectados y solicita confirmación explícita

#### Tareas Técnicas

- [ ] TASK-06: Crear endpoint `PATCH /api/trucks/:id` para toggle de estado
  - [ ] Actualiza campo `is_active`
  - [ ] Verifica si hay solicitudes pendientes asignadas al camión (estado `pending` o `assigned`)
  - [ ] Retorna 200 con el recurso actualizado o 409 con detalle si hay conflictos activos

- [ ] TASK-07: Agregar acción de desactivar en el listado de flota
  - [ ] Botón/ícono de desactivar por fila
  - [ ] Modal de confirmación con mensaje contextual (menciona viajes pendientes si los hay)
  - [ ] Actualización optimista del estado en UI

---

## EP-02: Gestión de Solicitudes de Transporte

> El sistema debe permitir registrar y visualizar solicitudes de traslado de ganado. Cada solicitud contiene datos del cliente, cantidad de animales y puntos geográficos de origen y destino.

---

### US-04: Creación de Solicitud de Transporte

**Como** operador logístico, **quiero** registrar una nueva solicitud de transporte con los datos del cliente, la cantidad de ganado y las localidades de origen y destino, **para** tener un registro formal del pedido y poder asignarle un camión.

#### Criterios de Aceptación

- **Dado que** estoy en el dashboard o en la sección de solicitudes
  **Cuando** completo el formulario con nombre del solicitante, teléfono, cantidad de cabezas, origen y destino, y lo confirmo
  **Entonces** la solicitud aparece en el dashboard con estado "Pendiente" y todos sus datos visibles

- **Dado que** ingreso 0 o un número negativo en la cantidad de cabezas
  **Cuando** intento enviar el formulario
  **Entonces** el sistema valida y muestra un error antes de llegar al servidor

- **Dado que** ingreso texto libre en los campos de origen y destino
  **Cuando** el sistema recibe la solicitud
  **Entonces** los valores se almacenan como strings de localidad/dirección (sin geocodificación obligatoria en creación — la geocodificación ocurre al visualizar en mapa)

#### Tareas Técnicas

- [ ] TASK-08: Diseñar y crear tabla `transport_requests` en PostgreSQL
  - [ ] Campos: `id` (UUID PK), `requester_name` (VARCHAR, NOT NULL), `requester_phone` (VARCHAR), `cattle_count` (INTEGER, NOT NULL, CHECK > 0), `origin` (VARCHAR, NOT NULL), `destination` (VARCHAR, NOT NULL), `origin_lat` (DECIMAL, NULLABLE), `origin_lng` (DECIMAL, NULLABLE), `destination_lat` (DECIMAL, NULLABLE), `destination_lng` (DECIMAL, NULLABLE), `status` (ENUM: `pending`, `assigned`, `completed`, `cancelled`), `assigned_truck_id` (UUID FK NULLABLE → trucks.id), `distance_km` (DECIMAL, NULLABLE), `fuel_cost` (DECIMAL, NULLABLE), `created_at`, `updated_at`
  - [ ] FK con ON DELETE SET NULL hacia trucks
  - [ ] Índice sobre `status` y `assigned_truck_id`
  - [ ] Datos semilla: 5 solicitudes en distintos estados

- [ ] TASK-09: Crear endpoint `POST /api/transport-requests`
  - [ ] Validación con Zod: campos requeridos, cattle_count > 0
  - [ ] Estado inicial: `pending`, sin camión asignado
  - [ ] Retorna 201 con el recurso creado

- [ ] TASK-10: Crear modal/formulario de nueva solicitud
  - [ ] Campos: Nombre solicitante, Teléfono, Cabezas de ganado, Origen (text), Destino (text)
  - [ ] Validación client-side
  - [ ] Accesible desde el dashboard con botón "Nueva Solicitud"

---

### US-05: Visualización de Solicitudes en el Dashboard

**Como** operador logístico, **quiero** ver todas las solicitudes de transporte en el Panel Principal organizadas por estado, **para** tener visibilidad completa de mi operación y priorizar asignaciones.

#### Criterios de Aceptación

- **Dado que** existen solicitudes en el sistema
  **Cuando** accedo al dashboard
  **Entonces** veo tarjetas para cada solicitud mostrando: nombre del solicitante, cabezas de ganado, origen → destino, estado actual y camión asignado (si aplica)

- **Dado que** hay solicitudes en múltiples estados
  **Cuando** visualizo el dashboard
  **Entonces** las solicitudes están diferenciadas visualmente por estado (pendiente, asignado, completado)

- **Dado que** el sistema tiene muchas solicitudes
  **Cuando** visualizo el dashboard
  **Entonces** las solicitudes pendientes aparecen primero (ordenadas por fecha de creación descendente)

#### Tareas Técnicas

- [ ] TASK-11: Crear endpoint `GET /api/transport-requests`
  - [ ] Retorna solicitudes con datos del camión asignado (JOIN)
  - [ ] Soporte para filtrado por `?status=pending`
  - [ ] Ordenamiento: pendientes primero, luego por `created_at` DESC

- [ ] TASK-12: Diseñar e implementar tarjeta de solicitud (componente `RequestCard`)
  - [ ] Layout: badge de estado, datos del solicitante, ruta origen→destino, conteo de ganado, camión asignado
  - [ ] Colores semánticos por estado: amarillo/pendiente, azul/asignado, verde/completado
  - [ ] Acción "Ver detalle / Asignar" que abre el panel de detalle

- [ ] TASK-13: Implementar vista de dashboard `/` con grid de tarjetas
  - [ ] Layout responsivo (1 col mobile, 2 col tablet, 3 col desktop)
  - [ ] Header con estadísticas rápidas: total pendientes, asignados, completados
  - [ ] Estado vacío si no hay solicitudes

---

### US-06: Detalle de Solicitud

**Como** operador logístico, **quiero** ver el detalle completo de una solicitud de transporte, **para** revisar toda la información antes de asignar un camión.

#### Criterios de Aceptación

- **Dado que** estoy en el dashboard
  **Cuando** hago click en una tarjeta de solicitud
  **Entonces** veo un panel de detalle (modal o página) con todos los datos: solicitante, ganado, ruta en mapa, distancia calculada y el selector de camión

- **Dado que** la solicitud ya tiene un camión asignado
  **Cuando** abro el detalle
  **Entonces** veo el costo de combustible calculado y el estado de capacidad

#### Tareas Técnicas

- [ ] TASK-14: Crear endpoint `GET /api/transport-requests/:id`
  - [ ] Retorna solicitud completa con datos del camión asignado
  - [ ] 404 si no existe

- [ ] TASK-15: Crear panel de detalle de solicitud (slide-over o modal)
  - [ ] Secciones: Info del solicitante | Datos del traslado | Mapa | Asignación de camión
  - [ ] Carga el mapa al abrir el detalle

---

## EP-03: Inteligencia de Rutas y Costos

> El corazón analítico del sistema. Combina geolocalización, cálculo de distancias y lógica financiera para dar al operador información precisa para decidir.

---

### US-07: Visualización de Ruta en Mapa

**Como** operador logístico, **quiero** ver la ruta entre el origen y destino de una solicitud trazada sobre un mapa interactivo, **para** evaluar visualmente el trayecto antes de confirmar la asignación.

#### Criterios de Aceptación

- **Dado que** abro el detalle de una solicitud con origen y destino especificados
  **Cuando** el mapa carga
  **Entonces** veo los marcadores de origen (verde) y destino (rojo) posicionados correctamente sobre el mapa

- **Dado que** el sistema puede obtener las coordenadas de origen y destino
  **Cuando** el mapa carga
  **Entonces** se traza una polilínea entre ambos puntos representando la ruta aproximada

- **Dado que** el geocoding de una localidad falla (nombre ambiguo o no encontrado)
  **Cuando** intento visualizar el mapa
  **Entonces** el sistema muestra un mensaje claro indicando que no pudo resolver la ubicación, sin romper la UI

#### Tareas Técnicas

- [ ] TASK-16: Integrar Leaflet + OpenStreetMap en Next.js
  - [ ] Instalar `leaflet` y `react-leaflet`
  - [ ] Resolver problema de SSR (importación dinámica con `dynamic(() => import(...), { ssr: false })`)
  - [ ] Configurar tile layer de OpenStreetMap

- [ ] TASK-17: Implementar servicio de geocodificación con Nominatim (OpenStreetMap)
  - [ ] Función `geocode(address: string): Promise<{lat, lng} | null>`
  - [ ] Rate limiting awareness (Nominatim tiene límite de 1 req/seg)
  - [ ] Cache de geocodificación en DB (guardar lat/lng en la solicitud al primera vez que se resuelve)

- [ ] TASK-18: Componente `RouteMap`
  - [ ] Props: `origin: {lat, lng, label}`, `destination: {lat, lng, label}`
  - [ ] Marcadores con popups (nombre de la localidad)
  - [ ] Polilínea entre puntos
  - [ ] Auto-fit bounds para mostrar ambos puntos completos
  - [ ] Estado de carga mientras geocodifica

---

### US-08: Cálculo de Distancia

**Como** operador logístico, **quiero** que el sistema calcule automáticamente la distancia en kilómetros entre origen y destino, **para** tener una base objetiva para el cálculo de costos.

> ⚠️ **Decisión de diseño:** Para el MVP se usa distancia de línea recta (Haversine formula) o la distancia provista por OSRM (Open Source Routing Machine, gratuito). OSRM provee distancia real de ruta; Haversine es una aproximación. Se implementa con OSRM para mayor precisión sin costos de API.

#### Criterios de Aceptación

- **Dado que** tengo el origen y destino geocodificados
  **Cuando** el sistema calcula la distancia
  **Entonces** se muestra la distancia en km con un decimal de precisión (ej. "342.5 km")

- **Dado que** la distancia fue calculada previamente
  **Cuando** vuelvo a abrir el detalle de la misma solicitud
  **Entonces** la distancia se lee desde la DB (campo `distance_km`) sin recalcular

#### Tareas Técnicas

- [ ] TASK-19: Implementar servicio de cálculo de distancia
  - [ ] Función `calculateDistance(origin: Coords, destination: Coords): Promise<number>`
  - [ ] Integrar con OSRM public API (`router.project-osrm.org`) para distancia real de ruta
  - [ ] Fallback a Haversine si OSRM falla
  - [ ] Persistir resultado en `transport_requests.distance_km`

- [ ] TASK-20: Mostrar distancia calculada en el panel de detalle
  - [ ] Sección de estadísticas: distancia en km, con ícono de ruta

---

### US-09: Proyección Dinámica de Costo de Combustible

**Como** operador logístico, **quiero** que el sistema calcule y muestre el costo estimado de combustible en tiempo real al seleccionar un camión para una solicitud, **para** tomar decisiones de asignación informadas financieramente.

#### Criterios de Aceptación

- **Dado que** tengo una solicitud con distancia calculada y selecciono un camión del listado
  **Cuando** el selector de camión cambia
  **Entonces** el costo proyectado se actualiza instantáneamente sin recargar la página usando la fórmula: `Distancia × Consumo × Precio/Litro`

- **Dado que** el precio de combustible está configurado en el sistema
  **Cuando** calculo el costo
  **Entonces** el valor usa ese precio y lo muestra junto a la fórmula desglosada (ej. "342 km × 0.45 L/km × $1.20/L = $184.68")

- **Dado que** el precio de combustible NO está configurado
  **Cuando** intento ver la proyección
  **Entonces** el sistema muestra un aviso con link a la configuración de precio

#### Tareas Técnicas

- [ ] TASK-21: Diseñar tabla `system_config` en PostgreSQL
  - [ ] Campos: `key` (VARCHAR PK), `value` (VARCHAR), `updated_at`
  - [ ] Registro inicial: `fuel_price_per_liter` con valor por defecto (ej. `1200` en pesos argentinos)

- [ ] TASK-22: Crear endpoints de configuración
  - [ ] `GET /api/config/fuel-price` → retorna precio actual
  - [ ] `PUT /api/config/fuel-price` → actualiza precio (body: `{ price: number }`)

- [ ] TASK-23: Implementar lógica de cálculo de combustible en el backend
  - [ ] Función pura `calculateFuelCost(distanceKm, fuelConsumption, fuelPrice): number`
  - [ ] Usada tanto en el endpoint de asignación como accesible para preview

- [ ] TASK-24: Implementar selector de camión con preview de costo en UI
  - [ ] Dropdown/select de camiones disponibles (activos)
  - [ ] Al cambiar selección: llamada a función de cálculo local (todos los datos disponibles en cliente)
  - [ ] Panel de desglose del costo con la fórmula visible
  - [ ] Indicador de precio de combustible usado con link a configuración

---

## EP-04: Panel de Operaciones y Asignación

> La interacción crítica del sistema: asignar un camión a una solicitud, con todas las validaciones de negocio activas.

---

### US-10: Asignación de Camión a Solicitud

**Como** operador logístico, **quiero** asignar un camión disponible a una solicitud de transporte pendiente, **para** confirmar el viaje y registrar el costo proyectado.

#### Criterios de Aceptación

- **Dado que** seleccioné un camión con capacidad suficiente para la solicitud
  **Cuando** confirmo la asignación
  **Entonces** la solicitud cambia a estado "Asignado", queda vinculada al camión y el costo de combustible calculado se persiste en la DB

- **Dado que** la solicitud ya fue asignada previamente
  **Cuando** intento asignarla nuevamente
  **Entonces** el sistema permite reasignar (cambiar de camión) mientras el estado sea "Asignado" (no "Completado")

- **Dado que** confirmo la asignación
  **Cuando** vuelvo al dashboard
  **Entonces** la tarjeta de la solicitud refleja el nuevo estado y el camión asignado inmediatamente

#### Tareas Técnicas

- [ ] TASK-25: Crear endpoint `PATCH /api/transport-requests/:id/assign`
  - [ ] Body: `{ truckId: string }`
  - [ ] Valida que el camión existe y está activo
  - [ ] Calcula y persiste `fuel_cost` y `distance_km` si no estaban calculados
  - [ ] Actualiza `status` a `assigned` y `assigned_truck_id`
  - [ ] Retorna 200 con la solicitud actualizada o 422 con detalle si capacidad excedida (sin bloquear — solo informa)

- [ ] TASK-26: Botón "Confirmar Asignación" en el panel de detalle
  - [ ] Habilitado solo cuando hay un camión seleccionado
  - [ ] Estado de carga durante el request
  - [ ] Actualiza la UI optimistamente tras éxito
  - [ ] Muestra error si el request falla

---

### US-11: Alerta de Capacidad Excedida

**Como** operador logístico, **quiero** recibir una alerta clara cuando la cantidad de ganado de una solicitud supera la capacidad del camión seleccionado, **para** evitar asignaciones físicamente imposibles o peligrosas.

#### Criterios de Aceptación

- **Dado que** selecciono un camión cuya capacidad máxima es menor a la cantidad de ganado solicitada
  **Cuando** el selector de camión cambia
  **Entonces** aparece inmediatamente una alerta visual (sin requerir click en "Confirmar") indicando la capacidad excedida

- **Dado que** la capacidad es excedida
  **Cuando** veo la alerta
  **Entonces** el sistema calcula y sugiere el número mínimo de viajes necesarios: `Math.ceil(cattle_count / max_capacity)` y lo muestra de forma legible (ej. "Se necesitan 3 viajes con este camión")

- **Dado que** hay un camión con mayor capacidad disponible en la flota
  **Cuando** veo la alerta de capacidad excedida
  **Entonces** el sistema sugiere el camión de mayor capacidad disponible como alternativa

#### Tareas Técnicas

- [ ] TASK-27: Implementar lógica de validación de capacidad en el frontend
  - [ ] Función `getCapacityStatus(cattleCount, truck): { exceeded: boolean, tripsNeeded: number, suggestion: Truck | null }`
  - [ ] Se ejecuta reactivamente al cambiar el camión seleccionado
  - [ ] `tripsNeeded = Math.ceil(cattleCount / truck.maxCapacity)`

- [ ] TASK-28: Diseñar componente de alerta de capacidad `CapacityAlert`
  - [ ] Variantes: `ok` (verde, capacidad suficiente con espacio disponible), `tight` (amarillo, ≤ 10% de espacio libre), `exceeded` (rojo, capacidad insuficiente)
  - [ ] En estado `exceeded`: muestra número de viajes sugeridos y nombre del camión alternativo
  - [ ] Animación de entrada suave para no pasar desapercibida

- [ ] TASK-29: Validación de capacidad también en el backend (endpoint de asignación)
  - [ ] No bloquea la asignación pero incluye en la respuesta: `{ capacityWarning: { exceeded: boolean, tripsNeeded: number } }`
  - [ ] El frontend usa esta info para mostrar confirmación secundaria si hay exceso

---

### US-12: Configuración de Precio de Combustible

**Como** operador logístico, **quiero** poder actualizar el precio del combustible en el sistema, **para** que todos los cálculos de costo reflejen el precio de mercado actual.

#### Criterios de Aceptación

- **Dado que** accedo a la sección de configuración
  **Cuando** veo la pantalla
  **Entonces** veo el precio de combustible actual y un campo para actualizarlo

- **Dado que** actualizo el precio de combustible
  **Cuando** confirmo el cambio
  **Entonces** el nuevo precio se aplica inmediatamente a todos los cálculos futuros (no retroactivo a solicitudes ya completadas)

#### Tareas Técnicas

- [ ] TASK-30: Crear página `/settings` con configuración de precio de combustible
  - [ ] Input numérico con unidad ($/litro)
  - [ ] Muestra fecha de última actualización
  - [ ] Botón "Guardar" que llama a `PUT /api/config/fuel-price`
  - [ ] Toast de confirmación tras actualizar

---

## EP-05: Configuración e Infraestructura

> Base técnica que permite que la aplicación corra de forma consistente en cualquier entorno.

---

### US-13: Contenedorización con Docker

**Como** desarrollador, **quiero** que la aplicación completa pueda levantarse con un único comando (`docker-compose up --build`), **para** garantizar que el entorno sea reproducible y sin dependencias locales externas.

#### Criterios de Aceptación

- **Dado que** tengo Docker y docker-compose instalados
  **Cuando** ejecuto `docker-compose up --build` desde la raíz del proyecto
  **Entonces** la aplicación Next.js está disponible en `localhost:3000` y la DB en `localhost:5432` sin configuración adicional

- **Dado que** el contenedor de la DB arranca por primera vez
  **Cuando** se inicializa
  **Entonces** las tablas se crean y los datos semilla se cargan automáticamente desde `init.sql`

- **Dado que** reinicio los contenedores sin `--build`
  **Cuando** la DB ya tiene datos
  **Entonces** los datos persisten gracias al volumen de Docker

#### Tareas Técnicas

- [ ] TASK-31: Crear `Dockerfile` para la aplicación Next.js
  - [ ] Multi-stage build: `builder` (instalación de deps + build) y `runner` (imagen mínima)
  - [ ] Imagen base: `node:20-alpine`
  - [ ] Variables de entorno via `ARG` y `ENV`

- [ ] TASK-32: Crear `docker-compose.yml`
  - [ ] Servicio `app` (Next.js): build desde Dockerfile, puerto 3000:3000, depends_on db
  - [ ] Servicio `db` (PostgreSQL 15): imagen oficial, volumen persistente, variables de entorno
  - [ ] Red interna compartida entre servicios
  - [ ] Variables sensibles en `.env` (no commiteado) con `.env.example` como referencia

- [ ] TASK-33: Crear `init.sql` con schema completo y seed data
  - [ ] CREATE TABLE para todas las tablas con constraints
  - [ ] INSERT de datos semilla: 4 camiones, 5 solicitudes de transporte en distintos estados, precio de combustible inicial

- [ ] TASK-34: Crear `.env.example` con todas las variables necesarias documentadas
  - [ ] `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
  - [ ] `NEXT_PUBLIC_OSRM_URL` (opcional, con fallback a instancia pública)

---

### US-14: Migraciones y Schema de Base de Datos con Prisma

**Como** desarrollador, **quiero** gestionar el schema de la base de datos con Prisma ORM, **para** tener type-safety en las queries y un flujo de migraciones controlado.

#### Criterios de Aceptación

- **Dado que** el schema de Prisma está definido
  **Cuando** ejecuto `prisma migrate dev`
  **Entonces** las tablas se crean en la DB con todas las constraints definidas

- **Dado que** uso Prisma Client en el código
  **Cuando** escribo queries
  **Entonces** tengo autocompletado y type-checking sobre todos los modelos

#### Tareas Técnicas

- [ ] TASK-35: Configurar Prisma en el proyecto Next.js
  - [ ] Instalar `@prisma/client` y `prisma`
  - [ ] Inicializar con `prisma init`
  - [ ] Singleton de PrismaClient para evitar múltiples conexiones en desarrollo

- [ ] TASK-36: Definir schema completo en `prisma/schema.prisma`
  - [ ] Modelos: `Truck`, `TransportRequest`, `SystemConfig`
  - [ ] Relaciones, enums de estado, campos opcionales correctamente tipados

- [ ] TASK-37: Crear script de seed en `prisma/seed.ts`
  - [ ] Datos coherentes con los del `init.sql`
  - [ ] Configurable para entornos de test

---

## Resumen de Tareas por Fase de Desarrollo

| Prioridad | Tareas | Descripción |
|---|---|---|
| 🔴 P0 - Fundación | TASK-31 a 37 | Docker, DB schema, Prisma |
| 🟠 P1 - Core Data | TASK-01 a 03, 08 a 10 | Tablas trucks y requests, endpoints base |
| 🟡 P2 - Dashboard | TASK-11 a 15 | Visualización de solicitudes y flota |
| 🟢 P3 - Inteligencia | TASK-16 a 24 | Mapas, geocodificación, cálculo de costos |
| 🔵 P4 - Operaciones | TASK-25 a 30 | Asignación, alertas, configuración |

---

## Árbol de Conversación con Claude

> Esta sección documenta la interacción real con Claude Code (claude-sonnet-4-6) durante el desarrollo del proyecto. Refleja los intercambios que dieron forma a las decisiones técnicas y de producto más relevantes.

**Herramienta:** Claude Code (claude-sonnet-4-6) — CLI interactivo con MCP Chrome DevTools  
**Modalidad:** Agente autónomo — el desarrollador da dirección de alto nivel, Claude ejecuta y propone

---

### Intercambio 1 — Lectura inicial de requerimientos

**Desarrollador:**
> "we need to start this project given the only file here, make a docs folder, move that file there, read it and let me know what you think"

**Claude** leyó el PDF `Pauta de Prueba Tecnica_ MVP BoviTrans - Parte Diario.pdf`, lo convirtió a Markdown para facilitar la lectura, e identificó los cuatro entregables evaluados: BACKLOG.md, implementación, DOCUMENTACION.md, y el uso documentado de IA.

**Decisión derivada:** Antes de escribir una línea de código, crear el BACKLOG completo con épicas, historias y criterios de aceptación — es un entregable independiente y la base de todo lo demás.

---

### Intercambio 2 — Configuración del contexto de IA

**Desarrollador:**
> "ok, let's proceed then, phase 1"

**Claude** propuso crear `.claude/custom_instructions.md` para que Claude actuara como Analista de Negocios y Arquitecto de Software con contexto completo del dominio (transporte ganadero, fórmula de combustible, módulos requeridos). El objetivo fue evitar repetir contexto en cada mensaje y que todas las decisiones de diseño fuesen coherentes entre sí.

**Lo que se incluyó en las instrucciones:**
- Stack tecnológico completo con justificaciones
- La fórmula de combustible textualmente: `Costo = Distancia × Consumo × Precio/Litro`
- Formato de salida esperado: Épica → US → AC (Dado/Cuando/Entonces) → Tasks técnicas
- Instrucción de marcar ambigüedades explícitamente antes de tomar decisiones de diseño

**Decisión derivada:** Las instrucciones se convirtieron en el "contrato" entre el desarrollador y el agente — cualquier decisión tomada por Claude sin input explícito debía estar justificada en ese archivo.

---

### Intercambio 3 — Elección de librerías de mapas y geocodificación

**Desarrollador:**
> "ok, and what libraries we gonna use on the frontend side? is that specified?"

**Claude** propuso las opciones y las evaluó:

| Opción | Pros | Contras |
|---|---|---|
| Google Maps API | Familiar, completo | Requiere API key, costo en producción |
| Mapbox | Bello, moderno | También requiere API key |
| **Leaflet + OpenStreetMap** | **Gratuito, sin API key, open source** | Más manual que las otras |

**Desarrollador:** Aceptó Leaflet + OSM sin objeciones.

**Claude** agregó Nominatim (geocodificación, gratuito) y OSRM (distancia real por ruta, gratuito) como servicios complementarios — ambos sin requerir registro ni API key. Se documentó que OSRM da distancia real por ruta en lugar de línea recta (Haversine), con Haversine como fallback.

**Decisión derivada:** Toda la capa de mapas es 100% open source y gratuita. Nominatim tiene rate limiting, por lo que se definió geocodificar de forma lazy (solo al visualizar) y cachear el resultado en DB.

---

### Intercambio 4 — Estructura de componentes

**Desarrollador:**
> "sounds good, and additional considerations? like having atomic design structure?"

**Claude** evaluó Atomic Design completo (atoms/molecules/organisms/templates/pages) vs una estructura orientada al dominio:

- Atomic Design completo: introduce una jerarquía de cinco niveles que cobra sentido en design systems compartidos entre múltiples productos o equipos. Para una aplicación de dominio acotado con dos módulos y un solo equipo, genera abstracciones sin destinatario real.
**Decisión implementada:** Atomic Design completo con tres niveles:
- `components/atoms/` — Button, Badge, Input
- `components/molecules/` — RequestCard, TruckCard, CapacityAlert, RouteMap
- `components/organisms/` — DashboardClient, RequestDetailPanel, NewRequestModal, NewTruckForm, TruckSelector, MapInner, Navbar

**Desarrollador:** Decidió implementar Atomic Design completo para demostrar arquitectura escalable.

**Decisión derivada:** La jerarquía atoms → molecules → organisms refleja el nivel de composición y complejidad de cada componente. Los átomos no conocen el dominio, las moléculas lo representan de forma simple, los organismos encapsulan estado y lógica de negocio. Las páginas en `app/` actúan como templates que componen organismos.

---

### Intercambio 5 — Tests unitarios e integración

**Desarrollador:**
> "do we need unit tests and integration tests?"

**Claude** analizó el valor real de cada tipo de test para este sistema:

- **Tests unitarios:** la única lógica de negocio pura es la fórmula de combustible y los cálculos de capacidad — ambas son funciones matemáticas deterministas de 3-4 líneas. Testearlas aporta poco sobre leerlas directamente.
- **Tests de integración:** los endpoints dependen de Prisma + PostgreSQL + servicios externos (Nominatim, OSRM). Un test de integración real requeriría una base de datos de test, mocks de los servicios externos, y mantenimiento continuo del setup — complejidad desproporcionada para 6 endpoints con lógica lineal.
- **El riesgo real** en este sistema no está en la lógica de negocio sino en la integración con Prisma v7 (breaking changes), Leaflet SSR, y Zod v4 — todos problemas que los tests no habrían detectado antes de la ejecución real.

**Propuesta de Claude:** No incluir tests automatizados. En cambio:
- Aislar la fórmula de combustible en `src/lib/calculations.ts` como función pura (testeable cuando el proyecto lo justifique)
- Documentar un plan de pruebas manual en `docs/TEST_PLAN.md` con casos de borde explícitos

**Desarrollador:** Aceptó.

**Decisión derivada:** Zero tests automatizados en el MVP. La lógica de negocio está aislada como funciones puras para facilitar tests futuros sin refactoring.

---

### Intercambio 6 — Docker y entorno de desarrollo

**Desarrollador:**
> "oh, docker is not installed, can you install it?"

**Claude** detectó que Docker no estaba disponible en el sistema. Evaluó las opciones para macOS:

| Opción | Espacio en disco | RAM | Notas |
|---|---|---|---|
| Docker Desktop | ~4 GB | ~2-4 GB | Licencia comercial para empresas |
| Colima | ~1 GB base | ~2 GB | VM Linux, requiere configuración manual |
| **OrbStack** | **~200 MB** | **~300 MB** | Comparte kernel macOS, mucho más liviano |
| Rancher Desktop | ~1.5 GB | ~1.5 GB | Similar a Colima |

**Desarrollador:**
> "what i care is, which one will end up using less space"

**Claude** recomendó OrbStack por footprint mínimo y porque no necesita configurar `DOCKER_HOST` — parchea el socket de Docker automáticamente.

**Desarrollador:** Aprobó la instalación de OrbStack.

**Problema encontrado durante desarrollo:** Colima (instalado previamente) estaba usando 7+ GB en disco con una imagen de 100 GB virtual. Se eliminó Colima y se migró completamente a OrbStack, reduciendo el uso a ~1-2 GB.

**Decisión derivada:** OrbStack como runtime Docker. Nota en `CLAUDE.md`: "OrbStack auto-patches the Docker socket — no DOCKER_HOST needed. Use `docker compose` (v2, no hyphen)."

---

### Intercambio 7 — Librerías de accesibilidad

**Desarrollador:**
> "is having libraries for accessibility in the dev pipeline required?"

**Claude** evaluó el encaje real de herramientas como `@axe-core/react` o `eslint-plugin-jsx-a11y` en este proyecto: son linters y detectores de problemas comunes (contraste, atributos aria faltantes, orden de focus), pero su valor escala con la cantidad de componentes interactivos y la diversidad de usuarios. Un sistema operativo interno con un único perfil de usuario no es el contexto donde estas herramientas generan mayor retorno.

Lo que sí se incluyó como práctica base: semántica HTML correcta (`<label>` asociado a cada input, roles implícitos, navegación por teclado funcional en formularios).

**Decisión derivada:** No se agregan librerías de accesibilidad. La semántica HTML correcta cubre los requisitos de usabilidad para el perfil de usuario del sistema.

---

### Intercambio 8 — Internacionalización

**Desarrollador:**
> "ok, now, we have a lot of time to refine this system, what you think if we use a lang library to avoid using hardcoded strings on labels?"

**Claude** evaluó la propuesta: `next-intl` o `react-i18next` resuelven el problema de strings dispersos en componentes, pero introducen una indirección (claves → traducciones) que solo justifica su complejidad cuando existe más de un idioma destino o un equipo de traducción separado.

El argumento real en contra no es el esfuerzo de implementación — agregar i18n es mecánico y Claude puede hacerlo — sino que un sistema de logística operativa para el mercado argentino no tiene un caso de uso multi-idioma concreto. Agregar la infraestructura sin el caso de uso es over-engineering: el sistema quedaría más complejo de leer sin ningún usuario que se beneficie de la segunda lengua.

**Propuesta de Claude:** Mantener strings en español directamente en los componentes. Si el producto evolucionara hacia multi-idioma, la migración es incremental — se extrae un key por componente a medida que se necesita.

**Desarrollador:** Aceptó.

**Decisión derivada:** Sin i18n. Los strings en español hardcodeados son la decisión correcta para el dominio y audiencia de este sistema.

---

### Reflexión sobre la Modalidad de Uso

El patrón de interacción dominante en este proyecto fue **dirección de alto nivel → ejecución autónoma**: el desarrollador indicaba qué fase o módulo encarar, Claude analizaba las opciones, proponía una dirección, y el desarrollador aprobaba o redirigía.

Este modo de trabajo tiene implicancias concretas:

1. **Lo que Claude aportó:** velocidad de ejecución, detección proactiva de problemas (Prisma v7 breaking changes, rate limiting de Nominatim, footprint de Docker), y consistencia entre módulos.

2. **Lo que el desarrollador aportó:** criterio de priorización, decisiones de scope ("no necesitamos tests", "no necesitamos i18n"), y validación de que las propuestas eran apropiadas para el contexto del negocio.

3. **Lo que ninguno puede reemplazar al otro:** las decisiones como "la alerta de capacidad advierte pero no bloquea" requieren entender tanto el dominio de negocio (el operador puede planificar múltiples viajes) como las implicancias técnicas (bloquear en UI vs bloquear en API). Ese juicio emergió de la conversación, no de ninguno de los dos de forma aislada.
