-- ============================================================
-- AIoT Machine Health Monitoring Platform – Supabase Schema
-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Table: machines
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS machines (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT          NOT NULL,
  type                  TEXT          NOT NULL,
  location              TEXT          NOT NULL,
  status                TEXT          NOT NULL DEFAULT 'normal'
                          CHECK (status IN ('normal', 'warning', 'high', 'critical', 'offline')),
  health_score          NUMERIC(5,2)  NOT NULL DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  failure_probability   NUMERIC(6,4)  NOT NULL DEFAULT 0   CHECK (failure_probability BETWEEN 0 AND 1),
  baseline_temperature  NUMERIC(6,2)  NOT NULL,
  baseline_vibration    NUMERIC(6,3)  NOT NULL,
  baseline_current      NUMERIC(6,2)  NOT NULL,
  baseline_rpm          NUMERIC(7,2)  NOT NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Table: sensor_readings
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sensor_readings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id  UUID        NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  temperature NUMERIC(7,2) NOT NULL,
  vibration   NUMERIC(7,3) NOT NULL,
  current     NUMERIC(7,2) NOT NULL,
  rpm         NUMERIC(8,2) NOT NULL,
  timestamp   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_machine_id ON sensor_readings(machine_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp  ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_machine_ts ON sensor_readings(machine_id, timestamp DESC);

-- ─────────────────────────────────────────────────────────────
-- Table: predictions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS predictions (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id          UUID          NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  anomaly_score       NUMERIC(6,4)  NOT NULL CHECK (anomaly_score BETWEEN 0 AND 1),
  failure_probability NUMERIC(6,4)  NOT NULL CHECK (failure_probability BETWEEN 0 AND 1),
  risk_level          TEXT          NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  possible_cause      TEXT,
  explanation         TEXT,
  recommendation      TEXT,
  confidence          NUMERIC(5,3)  CHECK (confidence BETWEEN 0 AND 1),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_machine_id  ON predictions(machine_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at  ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_risk_level  ON predictions(risk_level);

-- ─────────────────────────────────────────────────────────────
-- Table: alerts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id       UUID         NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  severity         TEXT         NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title            TEXT         NOT NULL,
  message          TEXT         NOT NULL,
  status           TEXT         NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  acknowledged_at  TIMESTAMPTZ,
  resolved_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_machine_id  ON alerts(machine_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status      ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity    ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at  ON alerts(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- Table: maintenance
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id      UUID         NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  issue           TEXT         NOT NULL,
  possible_cause  TEXT,
  recommendation  TEXT,
  priority        TEXT         NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status          TEXT         NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_maintenance_machine_id  ON maintenance(machine_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status      ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority    ON maintenance(priority);

-- ─────────────────────────────────────────────────────────────
-- Auto-update updated_at on machines
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_machines_updated_at ON machines;
CREATE TRIGGER trg_machines_updated_at
  BEFORE UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- Enable Supabase Realtime for all tables
-- Run in SQL Editor (Supabase allows this with service role)
-- ─────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE machines;
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance;

