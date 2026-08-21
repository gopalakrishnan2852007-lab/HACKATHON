// simulator/sensorSimulator.js
// ─────────────────────────────────────────────────────────────────────────────
// Realistic continuous sensor simulator for 8 machines.
//
// Design:
//  - Each machine has deterministic baselines.
//  - Every tick adds smooth Gaussian-like jitter around the baseline.
//  - Anomaly injection creates a gradual multi-sensor deterioration.
//  - The simulator calls the full ingestion pipeline on every tick.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../config/supabase.js';
import { ingestSensorReading } from '../services/sensorService.js';
import { resetAlertCooldown } from '../services/alertService.js';
import { ENV } from '../config/env.js';

// ── Machine definitions ───────────────────────────────────────────────────────
// These UUIDs must match the seed.sql rows.
export const MACHINE_CONFIGS = [
  { id: 'a1b2c3d4-0001-0001-0001-000000000001', name: 'CNC Mill M-01',        type: 'CNC Machine',      location: 'Zone A', baseline: { temperature: 62, vibration: 3.2, current: 18, rpm: 2400 } },
  { id: 'a1b2c3d4-0002-0002-0002-000000000002', name: 'Hydraulic Press M-02', type: 'Hydraulic Press',  location: 'Zone A', baseline: { temperature: 55, vibration: 4.5, current: 22, rpm: 1200 } },
  { id: 'a1b2c3d4-0003-0003-0003-000000000003', name: 'Conveyor Belt M-03',   type: 'Conveyor',         location: 'Zone B', baseline: { temperature: 45, vibration: 2.1, current: 12, rpm: 850  } },
  { id: 'a1b2c3d4-0004-0004-0004-000000000004', name: 'Air Compressor M-04',  type: 'Compressor',       location: 'Zone B', baseline: { temperature: 70, vibration: 5.0, current: 28, rpm: 1800 } },
  { id: 'a1b2c3d4-0005-0005-0005-000000000005', name: 'Pump Station M-05',    type: 'Centrifugal Pump', location: 'Zone C', baseline: { temperature: 52, vibration: 2.8, current: 15, rpm: 3000 } },
  { id: 'a1b2c3d4-0006-0006-0006-000000000006', name: 'Lathe Machine M-06',   type: 'Lathe',            location: 'Zone C', baseline: { temperature: 58, vibration: 3.6, current: 20, rpm: 1600 } },
  { id: 'a1b2c3d4-0007-0007-0007-000000000007', name: 'Industrial Fan M-07',  type: 'Fan/Blower',       location: 'Zone D', baseline: { temperature: 42, vibration: 2.0, current: 10, rpm: 2800 } },
  { id: 'a1b2c3d4-0008-0008-0008-000000000008', name: 'Injection Molder M-08',type: 'Injection Molder', location: 'Zone D', baseline: { temperature: 75, vibration: 4.2, current: 32, rpm: 960  } },
];

// ── Anomaly state ─────────────────────────────────────────────────────────────
// machineId → { active: bool, step: number, maxSteps: number, startedAt: Date }
const anomalyState = new Map();

let simulatorInterval = null;

/**
 * Small random Gaussian-like noise (Box-Muller light).
 */
function jitter(std) {
  return (Math.random() + Math.random() + Math.random() - 1.5) * std;
}

/**
 * Generate one sensor reading for a machine.
 */
function generateReading(config) {
  const { id, baseline } = config;
  const anomaly = anomalyState.get(id);

  let tempMult = 1, vibMult = 1, currMult = 1, rpmMult = 1;

  if (anomaly?.active) {
    // Gradual deterioration over `maxSteps` ticks
    const progress = Math.min(1, anomaly.step / anomaly.maxSteps);
    const curve = progress * progress; // quadratic ramp-up for realism

    tempMult  = 1 + curve * 0.80;  // up to +80%
    vibMult   = 1 + curve * 1.20;  // up to +120%
    currMult  = 1 + curve * 0.60;  // up to +60%
    rpmMult   = 1 - curve * 0.25;  // drop up to -25%

    anomaly.step++;

    // Auto-deactivate after duration
    if (Date.now() - anomaly.startedAt >= ENV.ANOMALY_DURATION_MS) {
      anomalyState.set(id, { active: false, step: 0, maxSteps: 0 });
      console.log(`[SIMULATOR] Anomaly ended for machine ${id}`);
    }
  }

  return {
    machine_id:  id,
    temperature: parseFloat((baseline.temperature  * tempMult  + jitter(0.8)).toFixed(2)),
    vibration:   parseFloat((baseline.vibration    * vibMult   + jitter(0.1)).toFixed(3)),
    current:     parseFloat((baseline.current      * currMult  + jitter(0.5)).toFixed(2)),
    rpm:         parseFloat((baseline.rpm          * rpmMult   + jitter(10)).toFixed(0)),
    timestamp:   new Date().toISOString(),
  };
}

/**
 * One simulator tick: generate + ingest for every machine.
 */
async function tick() {
  for (const config of MACHINE_CONFIGS) {
    try {
      const reading = generateReading(config);
      await ingestSensorReading(reading);
    } catch (err) {
      // Never let one machine error kill the whole simulator
      console.error(`[SIMULATOR] Error for machine ${config.id}:`, err.message);
    }
  }
}

/**
 * Start the continuous simulator loop.
 */
export function startSimulator() {
  if (simulatorInterval) return; // already running
  console.log(`[SIMULATOR] Starting – interval ${ENV.SIMULATOR_INTERVAL_MS}ms, ${MACHINE_CONFIGS.length} machines`);
  simulatorInterval = setInterval(tick, ENV.SIMULATOR_INTERVAL_MS);
  // Fire first tick immediately (don't wait for first interval)
  tick();
}

/**
 * Stop the simulator (used in tests).
 */
export function stopSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
  }
}

/**
 * Inject an anomaly for a specific machine.
 *
 * @param {string} machineId
 * @param {number} durationMs - how long the anomaly lasts (default from env)
 */
export function injectAnomaly(machineId, durationMs) {
  const duration = durationMs || ENV.ANOMALY_DURATION_MS;
  const maxSteps = Math.floor(duration / ENV.SIMULATOR_INTERVAL_MS);

  anomalyState.set(machineId, {
    active:     true,
    step:       0,
    maxSteps,
    startedAt:  Date.now(),
  });

  // Reset alert cooldown so the demo creates fresh alerts
  resetAlertCooldown(machineId);

  console.log(`[SIMULATOR] ⚠️  Anomaly INJECTED for machine ${machineId} (${duration}ms, ${maxSteps} steps)`);
}

/**
 * Get current anomaly state for all machines.
 */
export function getAnomalyStates() {
  const result = {};
  for (const config of MACHINE_CONFIGS) {
    const s = anomalyState.get(config.id);
    result[config.id] = {
      active:    s?.active || false,
      progress:  s?.active ? Math.min(1, s.step / s.maxSteps) : 0,
    };
  }
  return result;
}
