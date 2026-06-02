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
  ('a1b2c3d4-0001-0001-0001-000000000001', 'AB-123-CD', 30, 0.45, true),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'EF-456-GH', 20, 0.38, true),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'IJ-789-KL', 40, 0.55, true),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'MN-012-OP', 25, 0.42, false);

-- Transport requests: 5 requests in mixed states
INSERT INTO transport_requests (
  id, requester_name, requester_phone, cattle_count,
  origin, destination,
  origin_lat, origin_lng, destination_lat, destination_lng,
  status, assigned_truck_id, distance_km, fuel_cost
) VALUES
  (
    'b2c3d4e5-0001-0001-0001-000000000001',
    'Juan Pérez', '+54 9 341 555-1234', 25,
    'Rosario, Santa Fe', 'Córdoba Capital',
    -32.9442, -60.6505, -31.4201, -64.1888,
    'PENDING', NULL, NULL, NULL
  ),
  (
    'b2c3d4e5-0002-0002-0002-000000000002',
    'María González', '+54 9 11 555-5678', 45,
    'Buenos Aires', 'Mar del Plata, Buenos Aires',
    -34.6037, -58.3816, -38.0023, -57.5575,
    'PENDING', NULL, NULL, NULL
  ),
  (
    'b2c3d4e5-0003-0003-0003-000000000003',
    'Carlos Rodríguez', '+54 9 351 555-9012', 18,
    'Córdoba Capital', 'Mendoza Capital',
    -31.4201, -64.1888, -32.8908, -68.8272,
    'ASSIGNED',
    'a1b2c3d4-0001-0001-0001-000000000001',
    680.50, 138.70
  ),
  (
    'b2c3d4e5-0004-0004-0004-000000000004',
    'Ana Martínez', '+54 9 221 555-3456', 15,
    'La Plata, Buenos Aires', 'Bahía Blanca, Buenos Aires',
    -34.9215, -57.9545, -38.7183, -62.2663,
    'ASSIGNED',
    'a1b2c3d4-0002-0002-0002-000000000002',
    650.20, 93.63
  ),
  (
    'b2c3d4e5-0005-0005-0005-000000000005',
    'Roberto Silva', '+54 9 387 555-7890', 35,
    'Salta Capital', 'Tucumán Capital',
    -24.7859, -65.4117, -26.8083, -65.2176,
    'COMPLETED',
    'a1b2c3d4-0003-0003-0003-000000000003',
    310.80, 171.44
  );

-- System config: fuel price in Argentine pesos per liter
INSERT INTO system_config (key, value) VALUES
  ('fuel_price_per_liter', '1250');
