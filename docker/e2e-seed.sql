-- BoviTrans E2E seed — minimal dataset for browser tests
-- Schema (DDL) + original 4 trucks + 5 requests + fuel price
-- Does NOT include the 500-record bulk insert from init.sql

CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ASSIGNED', 'COMPLETED', 'CANCELLED');

CREATE TABLE trucks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate            VARCHAR(20)    NOT NULL UNIQUE,
  max_capacity     INTEGER        NOT NULL CHECK (max_capacity > 0),
  fuel_consumption DECIMAL(5, 2)  NOT NULL CHECK (fuel_consumption > 0),
  is_active        BOOLEAN        NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

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

CREATE TABLE system_config (
  key        VARCHAR(100) PRIMARY KEY,
  value      VARCHAR(500) NOT NULL,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transport_requests_status         ON transport_requests(status);
CREATE INDEX idx_transport_requests_assigned_truck ON transport_requests(assigned_truck_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trucks_updated_at
  BEFORE UPDATE ON trucks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER transport_requests_updated_at
  BEFORE UPDATE ON transport_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER system_config_updated_at
  BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trucks
INSERT INTO trucks (id, plate, max_capacity, fuel_consumption, is_active) VALUES
  ('3d6f8a2c-e1b4-4c9d-87f5-a2e3b4c5d6e7', 'AB-123-CD', 30, 0.45, true),
  ('7a1c5f3e-29b0-4d8a-b627-c4e8d9f01234', 'EF-456-GH', 20, 0.38, true),
  ('9b2e4a6c-8d1f-4e3b-a594-f7c2e1d0b8a6', 'IJ-789-KL', 40, 0.55, true),
  ('1c3a5e7f-0b2d-4c6e-8a0b-d1f3e5c7a9b2', 'MN-012-OP', 25, 0.42, false);

-- Transport requests
INSERT INTO transport_requests (
  id, requester_name, requester_phone, cattle_count,
  origin, destination,
  origin_lat, origin_lng, destination_lat, destination_lng,
  status, assigned_truck_id, distance_km, fuel_cost
) VALUES
  ('4e7a2b5c-9f1d-4a3e-8b6c-0d2f4a6e8c0d',
   'Carlos Benítez', '+595 981 555-1234', 25,
   'Asunción', 'Encarnación',
   -25.2867, -57.6478, -27.3364, -55.8675,
   'PENDING', NULL, NULL, NULL),
  ('8c1f3a5e-7b9d-4c2f-b8e0-1d3a5c7f9b1d',
   'María Rodríguez', '+595 985 555-5678', 45,
   'Ciudad del Este', 'Villarrica',
   -25.5097, -54.6116, -25.7508, -56.4343,
   'PENDING', NULL, NULL, NULL),
  ('2a4c6e8f-0b1d-4a3e-9c5f-7b9d1a3e5c7f',
   'José González', '+595 971 555-9012', 18,
   'Concepción', 'Asunción',
   -23.4070, -57.4340, -25.2867, -57.6478,
   'ASSIGNED', '3d6f8a2c-e1b4-4c9d-87f5-a2e3b4c5d6e7', 310.50, 1047937.50),
  ('6f8b0d2e-4a7c-4f9b-8d1e-3c5a7f9b1d3c',
   'Ana Martínez', '+595 991 555-3456', 15,
   'Encarnación', 'Ciudad del Este',
   -27.3364, -55.8675, -25.5097, -54.6116,
   'ASSIGNED', '7a1c5f3e-29b0-4d8a-b627-c4e8d9f01234', 290.40, 827640.00),
  ('0d2a4c6e-8f1b-4d3a-b5e7-9c1f3a5e7b9d',
   'Roberto Silva', '+595 961 555-7890', 35,
   'Villarrica', 'Asunción',
   -25.7508, -56.4343, -25.2867, -57.6478,
   'COMPLETED', '9b2e4a6c-8d1f-4e3b-a594-f7c2e1d0b8a6', 162.30, 669487.50);

INSERT INTO system_config (key, value) VALUES ('fuel_price_per_liter', '7500');

-- Extra records so the first page (24 items) doesn't exhaust the list,
-- allowing the infinite scroll test to trigger a second page load.
DO $$
DECLARE
  cities TEXT[] := ARRAY[
    'Asunción', 'Encarnación', 'Ciudad del Este', 'Concepción',
    'Villarrica', 'Pilar', 'Coronel Oviedo', 'Caacupé'
  ];
  names TEXT[] := ARRAY[
    'Carlos Benítez', 'Lucía Fernández', 'Diego Torres', 'Valeria Romero',
    'Pablo Gómez', 'Claudia Herrera', 'Sergio Díaz', 'Natalia Ruiz'
  ];
  n INTEGER := array_length(cities, 1);
  i INTEGER;
BEGIN
  FOR i IN 1..25 LOOP
    INSERT INTO transport_requests (
      id, requester_name, cattle_count, origin, destination, status
    ) VALUES (
      gen_random_uuid(),
      names[((i - 1) % array_length(names, 1)) + 1],
      (i * 3),
      cities[((i - 1) % n) + 1],
      cities[(i % n) + 1],
      'PENDING'
    );
  END LOOP;
END $$;
