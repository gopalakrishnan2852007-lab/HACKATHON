-- ============================================================
-- AIoT Machine Health Monitoring – Seed Data
-- ============================================================
-- Run AFTER schema.sql
-- UUIDs match MACHINE_CONFIGS in sensorSimulator.js exactly
-- ============================================================

-- Clear existing data (safe to re-run)
TRUNCATE TABLE maintenance     CASCADE;
TRUNCATE TABLE alerts          CASCADE;
TRUNCATE TABLE predictions     CASCADE;
TRUNCATE TABLE sensor_readings CASCADE;
TRUNCATE TABLE machines        CASCADE;

-- ─────────────────────────────────────────────────────────────
-- 8 Industrial Machines
-- ─────────────────────────────────────────────────────────────
INSERT INTO machines (
  id, name, type, location, status,
  health_score, failure_probability,
  baseline_temperature, baseline_vibration, baseline_current, baseline_rpm,
  created_at, updated_at
) VALUES
  (
    'a1b2c3d4-0001-0001-0001-000000000001',
    'CNC Mill M-01', 'CNC Machine', 'Zone A', 'normal',
    96.5, 0.0120,
    62.0, 3.200, 18.0, 2400.0,
    NOW() - INTERVAL '30 days', NOW()
  ),
  (
    'a1b2c3d4-0002-0002-0002-000000000002',
    'Hydraulic Press M-02', 'Hydraulic Press', 'Zone A', 'normal',
    94.2, 0.0180,
    55.0, 4.500, 22.0, 1200.0,
    NOW() - INTERVAL '30 days', NOW()
  ),
  (
    'a1b2c3d4-0003-0003-0003-000000000003',
    'Conveyor Belt M-03', 'Conveyor', 'Zone B', 'normal',
    98.1, 0.0050,
    45.0, 2.100, 12.0, 850.0,
    NOW() - INTERVAL '30 days', NOW()
  ),
  (
    'a1b2c3d4-0004-0004-0004-000000000004',
    'Air Compressor M-04', 'Compressor', 'Zone B', 'warning',
    78.4, 0.1500,
    70.0, 5.000, 28.0, 1800.0,
    NOW() - INTERVAL '30 days', NOW()
  ),
  (
    'a1b2c3d4-0005-0005-0005-000000000005',
    'Pump Station M-05', 'Centrifugal Pump', 'Zone C', 'normal',
    91.7, 0.0420,
    52.0, 2.800, 15.0, 3000.0,
    NOW() - INTERVAL '30 days', NOW()
  ),
  (
    'a1b2c3d4-0006-0006-0006-000000000006',
    'Lathe Machine M-06', 'Lathe', 'Zone C', 'normal',
    95.3, 0.0230,
    58.0, 3.600, 20.0, 1600.0,
    NOW() - INTERVAL '30 days', NOW()
  ),
  (
    'a1b2c3d4-0007-0007-0007-000000000007',
    'Industrial Fan M-07', 'Fan/Blower', 'Zone D', 'normal',
    99.0, 0.0030,
    42.0, 2.000, 10.0, 2800.0,
    NOW() - INTERVAL '30 days', NOW()
  ),
  (
    'a1b2c3d4-0008-0008-0008-000000000008',
    'Injection Molder M-08', 'Injection Molder', 'Zone D', 'normal',
    93.8, 0.0310,
    75.0, 4.200, 32.0, 960.0,
    NOW() - INTERVAL '30 days', NOW()
  );

-- ─────────────────────────────────────────────────────────────
-- 24 hours of historical sensor readings
-- 480 readings per machine (every 3 minutes over 24h)
-- Realistic jitter around baseline so charts look natural
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  machines_arr UUID[] := ARRAY[
    'a1b2c3d4-0001-0001-0001-000000000001'::UUID,
    'a1b2c3d4-0002-0002-0002-000000000002'::UUID,
    'a1b2c3d4-0003-0003-0003-000000000003'::UUID,
    'a1b2c3d4-0004-0004-0004-000000000004'::UUID,
    'a1b2c3d4-0005-0005-0005-000000000005'::UUID,
    'a1b2c3d4-0006-0006-0006-000000000006'::UUID,
    'a1b2c3d4-0007-0007-0007-000000000007'::UUID,
    'a1b2c3d4-0008-0008-0008-000000000008'::UUID
  ];

  base_temps   NUMERIC[] := ARRAY[62.0, 55.0, 45.0, 70.0, 52.0, 58.0, 42.0, 75.0];
  base_vibs    NUMERIC[] := ARRAY[3.2,  4.5,  2.1,  5.0,  2.8,  3.6,  2.0,  4.2 ];
  base_currs   NUMERIC[] := ARRAY[18.0, 22.0, 12.0, 28.0, 15.0, 20.0, 10.0, 32.0];
  base_rpms    NUMERIC[] := ARRAY[2400, 1200, 850,  1800, 3000, 1600, 2800, 960  ];

  -- Air Compressor M-04 (index 4) gets a slight warming trend over 24h
  temp_drift   NUMERIC;

  i   INTEGER;
  j   INTEGER;
  mid UUID;
  ts  TIMESTAMPTZ;

  -- Total points: 480 = 24h * 20 readings/hour (every 3 min)
  total_points CONSTANT INTEGER := 480;
BEGIN
  FOR i IN 1..8 LOOP
    mid := machines_arr[i];
    FOR j IN 1..total_points LOOP
      ts := NOW() - (INTERVAL '3 minutes' * (total_points - j));

      -- Drift: machine 4 gradually warms over the day
      temp_drift := CASE WHEN i = 4 THEN (j::NUMERIC / total_points) * 8 ELSE 0 END;

      INSERT INTO sensor_readings (machine_id, temperature, vibration, current, rpm, timestamp)
      VALUES (
        mid,
        ROUND((base_temps[i] + temp_drift + (random() * 2 - 1) * 2.0)::NUMERIC, 2),
        ROUND((base_vibs[i]             + (random() * 2 - 1) * 0.3)::NUMERIC, 3),
        ROUND((base_currs[i]            + (random() * 2 - 1) * 1.2)::NUMERIC, 2),
        ROUND((base_rpms[i]             + (random() * 2 - 1) * 25 )::NUMERIC, 0),
        ts
      );
    END LOOP;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- Historical predictions (spread over 24 hours)
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  machines_arr UUID[] := ARRAY[
    'a1b2c3d4-0001-0001-0001-000000000001'::UUID,
    'a1b2c3d4-0002-0002-0002-000000000002'::UUID,
    'a1b2c3d4-0003-0003-0003-000000000003'::UUID,
    'a1b2c3d4-0004-0004-0004-000000000004'::UUID,
    'a1b2c3d4-0005-0005-0005-000000000005'::UUID,
    'a1b2c3d4-0006-0006-0006-000000000006'::UUID,
    'a1b2c3d4-0007-0007-0007-000000000007'::UUID,
    'a1b2c3d4-0008-0008-0008-000000000008'::UUID
  ];

  base_anomaly NUMERIC[] := ARRAY[0.042, 0.061, 0.018, 0.220, 0.088, 0.054, 0.012, 0.072];
  base_fp      NUMERIC[] := ARRAY[0.028, 0.038, 0.009, 0.145, 0.052, 0.031, 0.004, 0.044];

  i   INTEGER;
  j   INTEGER;
  mid UUID;
  ts  TIMESTAMPTZ;
  drift NUMERIC;
  score NUMERIC;
  fp    NUMERIC;
  rl    TEXT;

  total_points CONSTANT INTEGER := 48; -- one prediction per 30min over 24h
BEGIN
  FOR i IN 1..8 LOOP
    mid := machines_arr[i];
    FOR j IN 1..total_points LOOP
      ts := NOW() - (INTERVAL '30 minutes' * (total_points - j));
      -- M-04 slowly worsens
      drift := CASE WHEN i = 4 THEN (j::NUMERIC / total_points) * 0.15 ELSE 0 END;
      score := LEAST(1.0, base_anomaly[i] + drift + (random() * 0.02 - 0.01));
      fp    := LEAST(1.0, base_fp[i]      + drift + (random() * 0.01));
      rl    := CASE
                 WHEN fp >= 0.85 THEN 'critical'
                 WHEN fp >= 0.70 THEN 'high'
                 WHEN fp >= 0.40 THEN 'medium'
                 ELSE 'low'
               END;

      INSERT INTO predictions (machine_id, anomaly_score, failure_probability, risk_level, created_at)
      VALUES (mid, ROUND(score, 4), ROUND(fp, 4), rl, ts);
    END LOOP;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- Sample alerts (M-04 warning, realistic history)
-- ─────────────────────────────────────────────────────────────
INSERT INTO alerts (machine_id, severity, title, message, status, created_at)
VALUES
  (
    'a1b2c3d4-0004-0004-0004-000000000004',
    'medium',
    '📊 Elevated Machine Risk',
    'Machine "Air Compressor M-04" (Zone B) has a failure probability of 15.0%. AI Assessment: Possible bearing wear or insufficient lubrication based on elevated temperature trend.',
    'active',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'a1b2c3d4-0004-0004-0004-000000000004',
    'medium',
    '📊 Elevated Machine Risk',
    'Machine "Air Compressor M-04" (Zone B) — temperature rising trend detected over last 12 hours.',
    'acknowledged',
    NOW() - INTERVAL '8 hours'
  );

-- ─────────────────────────────────────────────────────────────
-- Sample maintenance records
-- ─────────────────────────────────────────────────────────────
INSERT INTO maintenance (machine_id, issue, possible_cause, recommendation, priority, status, created_at)
VALUES
  (
    'a1b2c3d4-0004-0004-0004-000000000004',
    'Elevated temperature and vibration detected',
    'Possible bearing wear or inadequate lubrication based on elevated vibration and rising temperature readings',
    'Inspect compressor bearings and check lubrication levels. Schedule full maintenance within 48 hours. Monitor temperature trend closely.',
    'medium',
    'pending',
    NOW() - INTERVAL '1 hour 50 minutes'
  );
