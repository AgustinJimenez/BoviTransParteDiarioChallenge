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
    'Carlos Benítez', '+595 981 555-1234', 25,
    'Asunción', 'Encarnación',
    -25.2867, -57.6478, -27.3364, -55.8675,
    'PENDING', NULL, NULL, NULL
  ),
  (
    '8c1f3a5e-7b9d-4c2f-b8e0-1d3a5c7f9b1d',
    'María Rodríguez', '+595 985 555-5678', 45,
    'Ciudad del Este', 'Villarrica',
    -25.5097, -54.6116, -25.7508, -56.4343,
    'PENDING', NULL, NULL, NULL
  ),
  (
    '2a4c6e8f-0b1d-4a3e-9c5f-7b9d1a3e5c7f',
    'José González', '+595 971 555-9012', 18,
    'Concepción', 'Asunción',
    -23.4070, -57.4340, -25.2867, -57.6478,
    'ASSIGNED',
    '3d6f8a2c-e1b4-4c9d-87f5-a2e3b4c5d6e7',
    310.50, 1047937.50
  ),
  (
    '6f8b0d2e-4a7c-4f9b-8d1e-3c5a7f9b1d3c',
    'Ana Martínez', '+595 991 555-3456', 15,
    'Encarnación', 'Ciudad del Este',
    -27.3364, -55.8675, -25.5097, -54.6116,
    'ASSIGNED',
    '7a1c5f3e-29b0-4d8a-b627-c4e8d9f01234',
    290.40, 827640.00
  ),
  (
    '0d2a4c6e-8f1b-4d3a-b5e7-9c1f3a5e7b9d',
    'Roberto Silva', '+595 961 555-7890', 35,
    'Villarrica', 'Asunción',
    -25.7508, -56.4343, -25.2867, -57.6478,
    'COMPLETED',
    '9b2e4a6c-8d1f-4e3b-a594-f7c2e1d0b8a6',
    162.30, 669487.50
  );

-- System config: fuel price in Guaraníes per liter (~7500 Gs/L diesel Paraguay 2025)
INSERT INTO system_config (key, value) VALUES
  ('fuel_price_per_liter', '7500');

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
    'Carlos', 'José', 'Roberto', 'Diego', 'Fernando', 'Miguel', 'Pablo', 'Alejandro',
    'Ricardo', 'Jorge', 'Luis', 'Eduardo', 'Gabriel', 'Sergio', 'Ramón',
    'María', 'Ana', 'Laura', 'Sofía', 'Valeria', 'Claudia', 'Patricia', 'Carolina',
    'Natalia', 'Gabriela', 'Rosa', 'Silvana', 'Daniela', 'Verónica', 'Sandra'
  ];
  last_names   TEXT[]  := ARRAY[
    'Benítez', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'García',
    'Sánchez', 'Romero', 'Torres', 'Álvarez', 'Flores', 'Ruiz', 'Díaz', 'Morales',
    'Herrera', 'Medina', 'Aguilar', 'Castro', 'Ortiz', 'Vargas', 'Delgado', 'Ramos'
  ];
  city_names   TEXT[]  := ARRAY[
    'Asunción', 'Encarnación', 'Ciudad del Este', 'Concepción', 'Villarrica',
    'Pilar', 'San Pedro', 'Coronel Oviedo', 'Caacupé', 'Pedro Juan Caballero',
    'Carapeguá', 'San Juan Bautista', 'Luque', 'Lambaré', 'Fernando de la Mora',
    'Capiatá', 'Itauguá', 'San Ignacio', 'Ayolas', 'Filadelfia'
  ];
  city_lats    FLOAT[] := ARRAY[
    -25.2867, -27.3364, -25.5097, -23.4070, -25.7508,
    -26.8667, -24.0977, -25.4450, -25.3844, -22.5399,
    -25.9808, -26.6717, -25.2370, -25.3496, -25.3366,
    -25.3569, -25.3938, -26.8836, -27.3771, -22.3438
  ];
  city_lngs    FLOAT[] := ARRAY[
    -57.6478, -55.8675, -54.6116, -57.4340, -56.4343,
    -58.3000, -57.0836, -56.4391, -57.1429, -55.7330,
    -57.0269, -57.1514, -57.4494, -57.5950, -57.5214,
    -57.4447, -57.3493, -57.0233, -56.8835, -60.0289
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
      dist_km      := round((random() * 350 + 50)::numeric, 2);
      -- Use average fuel consumption ~0.45 L/km at Gs. 7500/L
      fuel_cost_val := round((dist_km * 0.45 * 7500)::numeric, 2);
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
      '+595 9' || (floor(random() * 90 + 10)::int)::text || ' ' || (floor(random() * 900 + 100)::int)::text || '-' || lpad((floor(random() * 9000 + 1000)::int)::text, 4, '0'),
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
