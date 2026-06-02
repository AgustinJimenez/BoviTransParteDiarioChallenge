# Plan de Pruebas — BoviTrans MVP

> Documento de casos de prueba manual para la validación funcional de la plataforma BoviTrans.
> Cubre flujos felices, validaciones de negocio y casos borde relevantes para cada módulo.

---

## Índice

| Sección | Área |
|---|---|
| [TP-01](#tp-01-dashboard--listado-de-solicitudes) | Dashboard — Listado de solicitudes |
| [TP-02](#tp-02-creación-de-solicitud-de-transporte) | Creación de solicitud de transporte |
| [TP-03](#tp-03-detalle-de-solicitud--mapa) | Detalle de solicitud y mapa |
| [TP-04](#tp-04-asignación-de-camión) | Asignación de camión |
| [TP-05](#tp-05-alerta-de-capacidad) | Alerta de capacidad |
| [TP-06](#tp-06-verificación-de-fórmula-de-combustible) | Verificación de fórmula de combustible |
| [TP-07](#tp-07-gestión-de-flota--crud-de-camiones) | Gestión de flota — CRUD de camiones |
| [TP-08](#tp-08-configuración--precio-de-combustible) | Configuración — Precio de combustible |

---

## Datos de Referencia (Semilla)

El sistema arranca con los siguientes datos cargados automáticamente en `docker/init.sql`.

### Camiones

| Patente | Capacidad | Consumo | Estado |
|---|---|---|---|
| AB-123-CD | 30 cabezas | 0.45 L/km | Activo |
| EF-456-GH | 20 cabezas | 0.38 L/km | Activo |
| IJ-789-KL | 40 cabezas | 0.55 L/km | Activo |
| MN-012-OP | 25 cabezas | 0.42 L/km | **Inactivo** |

### Solicitudes

| Solicitante | Cabezas | Origen | Destino | Estado | Camión |
|---|---|---|---|---|---|
| Juan Pérez | 25 | Rosario, Santa Fe | Córdoba Capital | PENDING | — |
| María González | 45 | Buenos Aires | Mar del Plata | PENDING | — |
| Carlos Rodríguez | 18 | Córdoba Capital | Mendoza Capital | ASSIGNED | AB-123-CD |
| Ana Martínez | 15 | La Plata | Bahía Blanca | ASSIGNED | EF-456-GH |
| Roberto Silva | 35 | Salta Capital | Tucumán Capital | COMPLETED | IJ-789-KL |

### Configuración

| Clave | Valor |
|---|---|
| fuel_price_per_liter | $1.250 ARS/litro |

---

## TP-01: Dashboard — Listado de Solicitudes

### TC-101 — Carga inicial del dashboard

**Precondición:** Aplicación corriendo con datos semilla cargados.

**Pasos:**
1. Navegar a `http://localhost:3000`

**Resultado esperado:**
- Se muestran las 5 solicitudes semilla
- Cada solicitud muestra: nombre del solicitante, cantidad de cabezas, origen, destino y badge de estado
- Los badges tienen el color correcto: PENDING (amarillo), ASSIGNED (azul), COMPLETED (verde)
- No hay errores en consola del navegador

---

### TC-102 — Ordenamiento por fecha de creación

**Pasos:**
1. Navegar a `http://localhost:3000`

**Resultado esperado:**
- La solicitud más reciente aparece primero (orden descendente por `created_at`)
- El orden no cambia al recargar la página

---

### TC-103 — Estado vacío (sin solicitudes)

**Precondición:** Base de datos limpia sin solicitudes (o filtro aplicado que no retorna resultados).

**Resultado esperado:**
- Se muestra un mensaje de estado vacío claro
- No se muestra un listado en blanco ni errores

---

### TC-104 — Persistencia tras recarga

**Pasos:**
1. Recargar la página (`Ctrl+R` / `Cmd+R`)

**Resultado esperado:**
- El estado de las solicitudes persiste (sin regresión a estado semilla)
- Los datos reflejan el estado actual de la base de datos

---

## TP-02: Creación de Solicitud de Transporte

### TC-201 — Creación exitosa con todos los campos

**Pasos:**
1. Desde el dashboard, abrir el modal/formulario de nueva solicitud
2. Completar: Nombre = "Pedro López", Teléfono = "+54 9 11 555-0000", Cabezas = 10, Origen = "Rosario, Santa Fe", Destino = "Buenos Aires"
3. Confirmar envío

**Resultado esperado:**
- La solicitud aparece en el listado con estado PENDING
- Los datos guardados coinciden exactamente con los ingresados
- HTTP 201 retornado por la API

---

### TC-202 — Creación sin teléfono (campo opcional)

**Pasos:**
1. Completar formulario sin ingresar teléfono
2. Completar el resto de campos obligatorios
3. Confirmar envío

**Resultado esperado:**
- La solicitud se crea sin error
- El campo teléfono aparece como nulo/vacío en el detalle

---

### TC-203 — Validación: nombre vacío

**Pasos:**
1. Dejar el campo "Nombre del solicitante" vacío
2. Intentar enviar el formulario

**Resultado esperado:**
- Validación client-side impide el envío
- Se muestra el mensaje: "El nombre es requerido" (u equivalente)
- No se realiza ninguna llamada a la API

---

### TC-204 — Validación: cantidad de cabezas = 0

**Pasos:**
1. Ingresar 0 en el campo "Cantidad de cabezas"
2. Intentar enviar

**Resultado esperado:**
- Validación rechaza el valor
- Mensaje: "La cantidad de ganado debe ser mayor a 0"
- La API tampoco acepta este valor si se llama directamente (400)

---

### TC-205 — Validación: cantidad de cabezas negativa

**Pasos:**
1. Ingresar -5 en el campo "Cantidad de cabezas"
2. Intentar enviar

**Resultado esperado:**
- Misma validación que TC-204, rechazado por `z.number().int().min(1)`

---

### TC-206 — Validación: origen vacío

**Pasos:**
1. Dejar el campo "Origen" vacío
2. Intentar enviar

**Resultado esperado:**
- Validación impide el envío con mensaje de campo requerido

---

### TC-207 — Validación: destino vacío

**Pasos:**
1. Dejar el campo "Destino" vacío
2. Intentar enviar

**Resultado esperado:**
- Validación impide el envío con mensaje de campo requerido

---

### TC-208 — Origen y destino idénticos

**Pasos:**
1. Ingresar "Buenos Aires" tanto en Origen como en Destino
2. Enviar el formulario

**Resultado esperado:**
- La solicitud se crea (la API no valida esto a nivel de negocio)
- La distancia calculada al asignar será ~0 km o muy pequeña (OSRM puede devolver 0)
- El costo de combustible resultante será ~$0
- **Nota:** Este es un caso borde de datos; la UI no lo bloquea

---

### TC-209 — Nombre con caracteres especiales

**Pasos:**
1. Ingresar nombre con acentos, ñ y caracteres especiales: "José García Ñoño"
2. Enviar formulario

**Resultado esperado:**
- El nombre se guarda y muestra correctamente (soporte UTF-8)

---

### TC-210 — Cantidad de cabezas muy alta

**Pasos:**
1. Ingresar 9999 cabezas
2. Enviar formulario

**Resultado esperado:**
- La solicitud se crea sin error (no hay límite superior definido)
- Al asignar cualquier camión, la alerta de capacidad se activará inmediatamente

---

## TP-03: Detalle de Solicitud y Mapa

### TC-301 — Abrir detalle de solicitud PENDING

**Pasos:**
1. Hacer clic en la solicitud de Juan Pérez (PENDING, sin coordenadas precargadas)

**Resultado esperado:**
- Panel de detalle se abre con los datos de la solicitud
- El mapa se carga con dos marcadores: origen (verde) y destino (rojo)
- Si las coordenadas no estaban en DB, el sistema las geocodifica vía Nominatim y las guarda para uso futuro

---

### TC-302 — Mapa con coordenadas precargadas (caché)

**Pasos:**
1. Abrir el detalle de Carlos Rodríguez (ASSIGNED — tiene coordenadas en DB)
2. Observar velocidad de carga del mapa

**Resultado esperado:**
- El mapa carga sin llamada a Nominatim (coordenadas vienen directamente de DB)
- Carga perceptiblemente más rápida que TC-301

---

### TC-303 — Marcadores visibles en el mapa

**Pasos:**
1. Abrir cualquier solicitud con ambas coordenadas disponibles

**Resultado esperado:**
- Marcador verde en el punto de origen
- Marcador rojo en el punto de destino
- El mapa auto-ajusta el zoom para que ambos marcadores sean visibles (fitBounds)
- No aparece el icono de Leaflet por defecto (se usa L.divIcon con SVG inline)

---

### TC-304 — Visualización de distancia y costo (solicitud ASSIGNED)

**Pasos:**
1. Abrir el detalle de Carlos Rodríguez

**Resultado esperado:**
- Se muestra la distancia en km
- Se muestra el costo de combustible calculado
- El camión asignado (AB-123-CD) es visible
- La capacidad alert está en estado correcto (18 cabezas en camión de 30 = OK)

---

### TC-305 — Localidad inexistente en geocodificación

**Pasos:**
1. Crear una solicitud con origen "Zzzzxxx Ciudad Falsa, Argentina"
2. Abrir el detalle

**Resultado esperado:**
- El mapa maneja el error graciosamente (sin crash)
- Si Nominatim no encuentra la ubicación, los marcadores no se muestran o solo se muestra el que sí fue geocodificado
- No se rompe la UI

---

## TP-04: Asignación de Camión

### TC-401 — Asignación exitosa a solicitud PENDING

**Pasos:**
1. Abrir el detalle de Juan Pérez (PENDING, 25 cabezas)
2. Seleccionar camión EF-456-GH (capacidad 20) — **NOTA:** este caso excede capacidad, ver TC-501
3. Seleccionar camión AB-123-CD (capacidad 30)
4. Confirmar asignación

**Resultado esperado:**
- El estado cambia a ASSIGNED
- Se muestra la distancia calculada vía OSRM (Rosario → Córdoba, aprox. 400 km)
- Se muestra el costo de combustible calculado
- El camión AB-123-CD queda reflejado en el detalle
- HTTP 200 retornado

---

### TC-402 — Reasignación de camión (solicitud ya ASSIGNED)

**Pasos:**
1. Abrir el detalle de Carlos Rodríguez (ASSIGNED a AB-123-CD)
2. Seleccionar un camión diferente, p. ej. IJ-789-KL
3. Confirmar reasignación

**Resultado esperado:**
- La solicitud permanece en estado ASSIGNED con el nuevo camión
- El costo de combustible se recalcula con el consumo del nuevo camión
- La asignación anterior (AB-123-CD) queda liberada implícitamente

---

### TC-403 — Intentar asignar camión inactivo

**Pasos:**
1. Intentar asignar MN-012-OP (camión inactivo) a cualquier solicitud PENDING

**Resultado esperado:**
- La API retorna HTTP 422 con error: "El camión está inactivo"
- La UI muestra el error al usuario
- La solicitud permanece sin cambios

**Nota:** En la UI, los camiones inactivos no deberían aparecer en el selector (el endpoint `GET /api/trucks?active=true` los filtra). Este caso es verificable directamente vía API.

---

### TC-404 — Intentar asignar a solicitud COMPLETED

**Pasos:**
1. Intentar hacer PATCH a `/api/transport-requests/{id}/assign` donde la solicitud está COMPLETED

**Resultado esperado:**
- HTTP 422: "No se puede modificar una solicitud completada"
- Verificable vía API directamente (la UI puede no exponer este flujo)

---

### TC-405 — Solicitud no encontrada

**Pasos:**
1. Llamar a `PATCH /api/transport-requests/uuid-inexistente/assign` con `{ truckId: "..." }`

**Resultado esperado:**
- HTTP 404: "Solicitud no encontrada"

---

### TC-406 — Camión no encontrado

**Pasos:**
1. Llamar a `PATCH /api/transport-requests/{id-válido}/assign` con `{ truckId: "uuid-inexistente" }`

**Resultado esperado:**
- HTTP 404: "Camión no encontrado"

---

### TC-407 — Body inválido en asignación

**Pasos:**
1. Llamar a `PATCH /api/transport-requests/{id}/assign` con body `{}` o `{ truckId: "" }`

**Resultado esperado:**
- HTTP 400: "ID de camión inválido"

---

## TP-05: Alerta de Capacidad

> El componente `CapacityAlert` tiene 3 estados según la ocupación del camión seleccionado.

### Reglas de negocio

| Condición | Estado | Color |
|---|---|---|
| `cattleCount / capacity < 0.9` | OK — hay espacio disponible | Verde |
| `cattleCount / capacity >= 0.9` y `cattleCount <= capacity` | AJUSTADO — casi lleno | Ámbar |
| `cattleCount > capacity` | EXCEDIDO — múltiples viajes necesarios | Rojo |

### TC-501 — Estado OK: camión con capacidad suficiente

**Escenario:** 18 cabezas en camión de 30 (ocupación 60%)

**Resultado esperado:**
- Alerta verde: "Capacidad disponible"
- No se muestra advertencia de capacidad en la API (`capacityWarning: null`)

---

### TC-502 — Estado AJUSTADO: 90% o más de ocupación

**Escenario:** 27 cabezas en camión de 30 (ocupación 90%)

**Resultado esperado:**
- Alerta ámbar indicando que el camión está casi lleno
- Se puede asignar sin restricción, pero con advertencia visual

**Caso límite:** 29 de 30 (96.6%) → debe mostrar ámbar, NO rojo (aún cabe)

---

### TC-503 — Estado EXCEDIDO: cattle > capacity

**Escenario:** 45 cabezas (solicitud de María González) asignada a EF-456-GH (capacidad 20)

**Resultado esperado:**
- Alerta roja: capacidad excedida
- `tripsNeeded = Math.ceil(45 / 20) = 3`
- Se informa que se necesitan **3 viajes**
- La API retorna `capacityWarning: { exceeded: true, tripsNeeded: 3 }`
- La asignación **sí se realiza** (la app no bloquea, solo advierte)

---

### TC-504 — Caso límite: exactamente en capacidad

**Escenario:** 30 cabezas en camión de 30 (100% de ocupación, 0 excedente)

**Resultado esperado:**
- `isCapacityExceeded(30, 30)` → `false` (30 > 30 es false)
- `tripsNeeded = Math.ceil(30 / 30) = 1`
- Estado: AJUSTADO (>=90%) pero NO excedido
- No se muestra `capacityWarning` en la API

---

### TC-505 — Caso límite: un animal por encima de la capacidad

**Escenario:** 31 cabezas en camión de 30

**Resultado esperado:**
- `isCapacityExceeded(31, 30)` → `true`
- `tripsNeeded = Math.ceil(31 / 30) = 2`
- Estado: EXCEDIDO, se necesitan 2 viajes

---

### TC-506 — Sugerencia de camión alternativo

**Escenario:** Solicitud con 45 cabezas. Camiones activos: EF-456-GH (20), AB-123-CD (30), IJ-789-KL (40). Ninguno tiene capacidad suficiente excepto IJ-789-KL que aún excede (40 < 45).

**Resultado esperado:**
- La UI sugiere el camión con mayor capacidad disponible (IJ-789-KL) como mejor alternativa
- Si ningún camión tiene capacidad suficiente, la sugerencia señala el de mayor capacidad disponible

---

## TP-06: Verificación de Fórmula de Combustible

> Fórmula: `Costo = Distancia (km) × Consumo (L/km) × Precio/Litro`
> Fuente única: `src/lib/calculations.ts`

### TC-601 — Verificación matemática directa

**Escenario de referencia:**

| Variable | Valor |
|---|---|
| Distancia | 100 km |
| Consumo (camión AB-123-CD) | 0.45 L/km |
| Precio combustible | $1.250 ARS/litro |

**Cálculo esperado:**

```
Costo = 100 × 0.45 × 1.250
Costo = 45 × 1.250
Costo = $56.250 ARS
```

**Cómo verificar:** Crear una solicitud con origen y destino a aprox. 100 km de distancia, asignar AB-123-CD, y confirmar que el costo mostrado coincide con la fórmula.

---

### TC-602 — El precio de combustible afecta el costo

**Pasos:**
1. Anotar el costo de combustible de una asignación existente
2. Ir a Configuración y cambiar el precio de $1.250 a $2.500 (doble)
3. Crear una nueva solicitud con la misma ruta y asignar el mismo camión

**Resultado esperado:**
- El costo de la nueva asignación es exactamente el doble del original
- La fórmula escala linealmente con el precio

---

### TC-603 — Distancia cero (mismo punto origen-destino)

**Escenario:** Solicitud con coordenadas de origen y destino idénticas

**Resultado esperado:**
- Distancia: 0 km (o valor muy pequeño por error de redondeo de OSRM)
- Costo calculado: $0 (o valor despreciable)
- No hay división por cero ni error en la aplicación

---

### TC-604 — Ruta larga intercity

**Escenario:** Buenos Aires → Mendoza (aprox. 1.050 km por ruta)

Con camión IJ-789-KL (0.55 L/km) a $1.250/litro:
```
Esperado ≈ 1.050 × 0.55 × 1.250 ≈ $721.875 ARS
```

**Resultado esperado:**
- El valor mostrado debe ser consistente con este rango (±5% por variación de OSRM en la ruta real)

---

### TC-605 — Costo no se recalcula si precio de combustible cambia retroactivamente

**Pasos:**
1. Asignar un camión a una solicitud → se guarda el costo calculado en DB
2. Ir a Configuración y cambiar el precio de combustible
3. Volver a ver la solicitud ya asignada

**Resultado esperado:**
- El costo mostrado **no cambia** para asignaciones previas (está guardado en `fuel_cost`)
- Solo las nuevas asignaciones usan el precio actualizado
- Esto es comportamiento correcto: el costo se fija en el momento de la asignación

---

## TP-07: Gestión de Flota — CRUD de Camiones

### TC-701 — Listado de camiones

**Pasos:**
1. Navegar a `/fleet`

**Resultado esperado:**
- Se muestran los 4 camiones semilla (3 activos + 1 inactivo)
- Cada camión muestra: patente, capacidad, consumo, estado
- El camión inactivo (MN-012-OP) está visualmente diferenciado (badge, opacidad)

---

### TC-702 — Registro de nuevo camión válido

**Pasos:**
1. Navegar a `/fleet/new`
2. Ingresar: Patente = "XY-999-ZA", Capacidad = 25, Consumo = 0.40
3. Confirmar

**Resultado esperado:**
- HTTP 201 retornado
- El camión aparece en el listado de flota con estado Activo
- La patente se guarda en mayúsculas (la API aplica `.toUpperCase()`)

---

### TC-703 — Patente duplicada

**Pasos:**
1. Intentar registrar un camión con patente "AB-123-CD" (ya existe en semilla)

**Resultado esperado:**
- HTTP 409: "Ya existe un camión con esa patente"
- La UI muestra el error
- No se crea el registro duplicado

---

### TC-704 — Patente en minúsculas

**Pasos:**
1. Ingresar patente "ab-123-cd" (minúsculas)
2. Enviar formulario

**Resultado esperado:**
- La API normaliza a "AB-123-CD" automáticamente (`.toUpperCase()`)
- Si "AB-123-CD" ya existe → 409
- Si no existe → se crea con la patente en mayúsculas

---

### TC-705 — Capacidad = 0

**Pasos:**
1. Ingresar Capacidad = 0 en el formulario de nuevo camión

**Resultado esperado:**
- Validación rechaza el valor
- Mensaje: "La capacidad debe ser mayor a 0"

---

### TC-706 — Consumo = 0

**Pasos:**
1. Ingresar Consumo = 0

**Resultado esperado:**
- Validación rechaza el valor (mínimo es 0.01)

---

### TC-707 — Consumo mayor al máximo permitido (> 10)

**Pasos:**
1. Ingresar Consumo = 15

**Resultado esperado:**
- Validación rechaza el valor (máximo es 10 L/km)
- Mensaje de error de rango

---

### TC-708 — Desactivar camión sin solicitudes activas

**Pasos:**
1. Buscar un camión activo que no tenga solicitudes en estado PENDING o ASSIGNED
2. Hacer clic en "Desactivar"

**Resultado esperado:**
- El camión cambia a estado Inactivo
- No se muestra ninguna advertencia adicional
- El camión desaparece del selector de asignación (el endpoint `?active=true` lo excluye)

---

### TC-709 — Desactivar camión CON solicitudes activas

**Pasos:**
1. Desactivar AB-123-CD (tiene solicitud de Carlos Rodríguez en estado ASSIGNED)

**Resultado esperado:**
- **La desactivación procede** (no está bloqueada)
- La API retorna un campo `warning`: "Este camión tiene 1 solicitud(es) activa(s) asignada(s)"
- La UI muestra la advertencia al operador
- La solicitud de Carlos Rodríguez sigue en estado ASSIGNED, pero el camión asignado ahora está inactivo

---

### TC-710 — Reactivar camión inactivo

**Pasos:**
1. Hacer clic en "Activar" sobre MN-012-OP (inactivo en semilla)

**Resultado esperado:**
- El camión cambia a estado Activo
- Vuelve a estar disponible en el selector de asignación

---

### TC-711 — Camión con patente máxima (20 caracteres)

**Pasos:**
1. Ingresar patente de exactamente 20 caracteres

**Resultado esperado:**
- El camión se registra correctamente

**Pasos (variante):**
1. Ingresar patente de 21 caracteres

**Resultado esperado:**
- Validación rechaza por exceso de longitud

---

## TP-08: Configuración — Precio de Combustible

### TC-801 — Visualizar precio actual

**Pasos:**
1. Navegar a `/settings`

**Resultado esperado:**
- Se muestra el precio actual: $1.250/litro (valor semilla)
- Se muestra la fecha de última modificación

---

### TC-802 — Actualizar precio válido

**Pasos:**
1. Cambiar el precio a $1.500
2. Confirmar

**Resultado esperado:**
- HTTP 200, el precio guardado es $1.500
- La página refleja el nuevo valor inmediatamente

---

### TC-803 — Precio = 0

**Pasos:**
1. Ingresar 0 en el campo de precio
2. Confirmar

**Resultado esperado:**
- HTTP 400: "El precio debe ser mayor a 0"
- El precio no se modifica

---

### TC-804 — Precio negativo

**Pasos:**
1. Ingresar -100

**Resultado esperado:**
- Misma validación que TC-803 (el schema Zod usa `z.number().min(0.01)`)

---

### TC-805 — Valor no numérico

**Pasos:**
1. Ingresar "abc" en el campo de precio

**Resultado esperado:**
- Validación client-side rechaza el input (el campo es de tipo numérico)
- Si se llama a la API directamente con `{ price: "abc" }`, retorna HTTP 400

---

### TC-806 — Precio muy alto (sin límite superior)

**Pasos:**
1. Ingresar $999.999

**Resultado esperado:**
- La API acepta el valor (no hay límite superior definido)
- Las nuevas asignaciones calcularán el costo con este precio

---

### TC-807 — Primera configuración (upsert)

**Precondición:** La clave `fuel_price_per_liter` no existe en `system_config` (base de datos limpia).

**Resultado esperado:**
- La API crea la clave con `upsert` (CREATE en primera vez, UPDATE en siguientes)
- El GET retorna el valor por defecto de $1.250 si no existe la clave en DB

---

## Matriz de Riesgo

| Área | Riesgo | Severidad | CTs asociados |
|---|---|---|---|
| Geocodificación | Nominatim no responde o devuelve resultado incorrecto | Alta | TC-301, TC-305 |
| OSRM | Distancia calculada difiere significativamente de la realidad | Media | TC-601, TC-604 |
| Capacidad | Alerta no se activa en el límite exacto | Alta | TC-504, TC-505 |
| Combustible | Costo calculado con precio desactualizado | Media | TC-605 |
| Flota | Camión inactivo aparece disponible para asignar | Alta | TC-403, TC-708 |
| Fórmula | Cambio en `calculations.ts` no propagado a UI | Alta | TC-601 a TC-605 |
| Prisma | Campos Decimal no convertidos a Number antes de JSON | Alta | TC-301, TC-401 |

---

## Criterios de Aceptación Global

Para considerar el MVP listo para entrega, todos los siguientes deben estar en verde:

- [ ] TC-201: Se puede crear una solicitud nueva
- [ ] TC-401: Se puede asignar un camión a una solicitud PENDING
- [ ] TC-503: La alerta de capacidad excedida funciona correctamente
- [ ] TC-601: La fórmula de combustible produce el resultado matemático correcto
- [ ] TC-702: Se puede registrar un nuevo camión
- [ ] TC-709: La desactivación de camión con solicitudes activas genera advertencia (sin bloquear)
- [ ] TC-802: El precio de combustible se actualiza correctamente
- [ ] TC-301: El mapa carga con marcadores en origen y destino
