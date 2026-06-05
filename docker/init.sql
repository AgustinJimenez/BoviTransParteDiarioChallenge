-- BoviTrans MVP — Database initialization
-- This file runs automatically when the PostgreSQL container starts for the first time.
-- It mirrors the Prisma schema and seeds the DB with realistic sample data.

-- Enum type for transport request status
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ASSIGNED', 'COMPLETED', 'CANCELLED');

-- Trucks table
CREATE TABLE trucks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate            VARCHAR(20)    NOT NULL UNIQUE,
  max_capacity     INTEGER        NOT NULL CHECK (max_capacity > 0),
  fuel_consumption DECIMAL(5, 2)  NOT NULL CHECK (fuel_consumption > 0),
  is_active        BOOLEAN        NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Transport requests table
CREATE TABLE transport_requests (
  id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_name   VARCHAR(100)    NOT NULL,
  requester_phone  VARCHAR(20),
  cattle_count     INTEGER         NOT NULL CHECK (cattle_count > 0),
  origin           VARCHAR(200)    NOT NULL,
  destination      VARCHAR(200)    NOT NULL,
  origin_lat       DECIMAL(10, 7),
  origin_lng       DECIMAL(10, 7),
  destination_lat  DECIMAL(10, 7),
  destination_lng  DECIMAL(10, 7),
  status           "RequestStatus" NOT NULL DEFAULT 'PENDING',
  assigned_truck_id UUID           REFERENCES trucks(id) ON DELETE SET NULL,
  distance_km      DECIMAL(10, 2),
  fuel_cost        DECIMAL(10, 2),
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- System config table (key-value store for app settings)
CREATE TABLE system_config (
  key        VARCHAR(100) PRIMARY KEY,
  value      VARCHAR(500) NOT NULL,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transport_requests_status           ON transport_requests(status);
CREATE INDEX idx_transport_requests_assigned_truck   ON transport_requests(assigned_truck_id);

-- Trigger to auto-update updated_at on trucks
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trucks_updated_at
  BEFORE UPDATE ON trucks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER transport_requests_updated_at
  BEFORE UPDATE ON transport_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Fleet: 4 trucks (3 active, 1 inactive)
INSERT INTO trucks (id, plate, max_capacity, fuel_consumption, is_active) VALUES
  ('3d6f8a2c-e1b4-4c9d-87f5-a2e3b4c5d6e7', 'AB-123-CD', 30, 0.45, true),
  ('7a1c5f3e-29b0-4d8a-b627-c4e8d9f01234', 'EF-456-GH', 20, 0.38, true),
  ('9b2e4a6c-8d1f-4e3b-a594-f7c2e1d0b8a6', 'IJ-789-KL', 40, 0.55, true),
  ('1c3a5e7f-0b2d-4c6e-8a0b-d1f3e5c7a9b2', 'MN-012-OP', 25, 0.42, false);

-- Transport requests: 5 requests in mixed states
INSERT INTO transport_requests (
  id, requester_name, requester_phone, cattle_count,
  origin, destination,
  origin_lat, origin_lng, destination_lat, destination_lng,
  status, assigned_truck_id, distance_km, fuel_cost
) VALUES
  (
    '4e7a2b5c-9f1d-4a3e-8b6c-0d2f4a6e8c0d',
    'Juan Pérez', '+54 9 341 555-1234', 25,
    'Rosario, Santa Fe', 'Córdoba Capital',
    -32.9442, -60.6505, -31.4201, -64.1888,
    'PENDING', NULL, NULL, NULL
  ),
  (
    '8c1f3a5e-7b9d-4c2f-b8e0-1d3a5c7f9b1d',
    'María González', '+54 9 11 555-5678', 45,
    'Buenos Aires', 'Mar del Plata, Buenos Aires',
    -34.6037, -58.3816, -38.0023, -57.5575,
    'PENDING', NULL, NULL, NULL
  ),
  (
    '2a4c6e8f-0b1d-4a3e-9c5f-7b9d1a3e5c7f',
    'Carlos Rodríguez', '+54 9 351 555-9012', 18,
    'Córdoba Capital', 'Mendoza Capital',
    -31.4201, -64.1888, -32.8908, -68.8272,
    'ASSIGNED',
    '3d6f8a2c-e1b4-4c9d-87f5-a2e3b4c5d6e7',
    680.50, 138.70
  ),
  (
    '6f8b0d2e-4a7c-4f9b-8d1e-3c5a7f9b1d3c',
    'Ana Martínez', '+54 9 221 555-3456', 15,
    'La Plata, Buenos Aires', 'Bahía Blanca, Buenos Aires',
    -34.9215, -57.9545, -38.7183, -62.2663,
    'ASSIGNED',
    '7a1c5f3e-29b0-4d8a-b627-c4e8d9f01234',
    650.20, 93.63
  ),
  (
    '0d2a4c6e-8f1b-4d3a-b5e7-9c1f3a5e7b9d',
    'Roberto Silva', '+54 9 387 555-7890', 35,
    'Salta Capital', 'Tucumán Capital',
    -24.7859, -65.4117, -26.8083, -65.2176,
    'COMPLETED',
    '9b2e4a6c-8d1f-4e3b-a594-f7c2e1d0b8a6',
    310.80, 171.44
  );

-- System config: fuel price in Argentine pesos per liter
INSERT INTO system_config (key, value) VALUES
  ('fuel_price_per_liter', '1250');

-- =============================================================================
-- BULK SEED — 500 additional transport requests for load testing
-- =============================================================================
DO $$
DECLARE
  truck_ids    UUID[]  := ARRAY[
    '3d6f8a2c-e1b4-4c9d-87f5-a2e3b4c5d6e7',
    '7a1c5f3e-29b0-4d8a-b627-c4e8d9f01234',
    '9b2e4a6c-8d1f-4e3b-a594-f7c2e1d0b8a6'
  ];
  first_names  TEXT[]  := ARRAY[
    'Juan', 'Carlos', 'Roberto', 'Diego', 'Fernando', 'Martín', 'Pablo', 'Alejandro',
    'Miguel', 'Ricardo', 'José', 'Eduardo', 'Gabriel', 'Sergio', 'Luis',
    'María', 'Ana', 'Laura', 'Sofía', 'Valeria', 'Claudia', 'Patricia', 'Carolina',
    'Natalia', 'Gabriela', 'Florencia', 'Silvana', 'Daniela', 'Verónica', 'Sandra'
  ];
  last_names   TEXT[]  := ARRAY[
    'Pérez', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'García',
    'Sánchez', 'Romero', 'Torres', 'Álvarez', 'Flores', 'Ruiz', 'Díaz', 'Morales',
    'Herrera', 'Medina', 'Aguilar', 'Castro', 'Ortiz', 'Vargas', 'Delgado', 'Ramos'
  ];
  city_names   TEXT[]  := ARRAY[
    'Rosario, Santa Fe', 'Córdoba Capital', 'Buenos Aires', 'Mendoza Capital',
    'La Plata, Buenos Aires', 'Mar del Plata, Buenos Aires', 'Bahía Blanca, Buenos Aires',
    'Salta Capital', 'Tucumán Capital', 'Santa Fe Capital', 'Santiago del Estero',
    'Neuquén Capital', 'Río Cuarto, Córdoba', 'San Luis Capital', 'Paraná, Entre Ríos',
    'Resistencia, Chaco', 'Posadas, Misiones', 'Formosa Capital', 'San Juan Capital',
    'Catamarca Capital'
  ];
  city_lats    FLOAT[] := ARRAY[
    -32.9442, -31.4201, -34.6037, -32.8908, -34.9215, -38.0023, -38.7183,
    -24.7859, -26.8083, -31.6333, -27.7951, -38.9516, -33.1307, -33.2950, -31.7333,
    -27.4514, -27.3671, -26.1775, -31.5375, -28.4696
  ];
  city_lngs    FLOAT[] := ARRAY[
    -60.6505, -64.1888, -58.3816, -68.8272, -57.9545, -57.5575, -62.2663,
    -65.4117, -65.2176, -60.7000, -64.2615, -68.0591, -64.3499, -66.3356, -60.5333,
    -58.9867, -55.8962, -58.1781, -68.5364, -65.7795
  ];
  -- Weighted toward PENDING so the dashboard has interesting data
  statuses     TEXT[]  := ARRAY[
    'PENDING', 'PENDING', 'PENDING', 'ASSIGNED', 'ASSIGNED', 'COMPLETED', 'CANCELLED'
  ];

  i            INTEGER;
  orig_idx     INTEGER;
  dest_idx     INTEGER;
  status_val   TEXT;
  truck_id     UUID;
  dist_km      NUMERIC;
  fuel_cost_val NUMERIC;
  n_cities     INTEGER := 20;
  n_first      INTEGER := 30;
  n_last       INTEGER := 23;
  n_statuses   INTEGER := 7;
BEGIN
  FOR i IN 1..500 LOOP
    orig_idx   := floor(random() * n_cities + 1)::int;
    dest_idx   := orig_idx;
    WHILE dest_idx = orig_idx LOOP
      dest_idx := floor(random() * n_cities + 1)::int;
    END LOOP;

    status_val := statuses[floor(random() * n_statuses + 1)::int];

    IF status_val IN ('ASSIGNED', 'COMPLETED') THEN
      truck_id     := truck_ids[floor(random() * 3 + 1)::int];
      dist_km      := round((random() * 900 + 100)::numeric, 2);
      -- Use average fuel consumption ~0.45 L/km at $1250/L
      fuel_cost_val := round((dist_km * 0.45 * 1250)::numeric, 2);
    ELSE
      truck_id      := NULL;
      dist_km       := NULL;
      fuel_cost_val := NULL;
    END IF;

    INSERT INTO transport_requests (
      id, requester_name, requester_phone, cattle_count,
      origin, destination,
      origin_lat, origin_lng, destination_lat, destination_lng,
      status, assigned_truck_id, distance_km, fuel_cost
    ) VALUES (
      gen_random_uuid(),
      first_names[floor(random() * n_first + 1)::int] || ' ' || last_names[floor(random() * n_last + 1)::int],
      '+54 9 ' || (floor(random() * 900 + 100)::int)::text || ' ' || (floor(random() * 900 + 100)::int)::text || '-' || lpad((floor(random() * 9000 + 1000)::int)::text, 4, '0'),
      floor(random() * 79 + 1)::int,
      city_names[orig_idx],
      city_names[dest_idx],
      city_lats[orig_idx],
      city_lngs[orig_idx],
      city_lats[dest_idx],
      city_lngs[dest_idx],
      status_val::"RequestStatus",
      truck_id,
      dist_km,
      fuel_cost_val
    );
  END LOOP;
END $$;
