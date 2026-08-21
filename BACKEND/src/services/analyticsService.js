// services/analyticsService.js
// ─────────────────────────────────────────────────────────────────────────────
// Historical analytics queries for machines.
// Returns data shaped for Recharts.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../config/supabase.js';

/**
 * Fetch sensor history for a machine within a time window.
 *
 * @param {string} machineId
 * @param {number} hours     - look-back window in hours (default 24)
 * @returns {object}         - data shaped for Recharts line charts
 */
export async function getMachineAnalytics(machineId, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  // Sensor readings
  const { data: readings, error: rErr } = await supabase
    .from('sensor_readings')
    .select('temperature, vibration, current, rpm, timestamp')
    .eq('machine_id', machineId)
    .gte('timestamp', since)
    .order('timestamp', { ascending: true });

  if (rErr) throw new Error(rErr.message);

  // Predictions (for anomaly score, failure prob, health score)
  const { data: predictions, error: pErr } = await supabase
    .from('predictions')
    .select('anomaly_score, failure_probability, risk_level, created_at')
    .eq('machine_id', machineId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (pErr) throw new Error(pErr.message);

  // Alerts summary
  const { data: alerts, error: aErr } = await supabase
    .from('alerts')
    .select('severity, status, created_at')
    .eq('machine_id', machineId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (aErr) throw new Error(aErr.message);

  // Shape for Recharts
  const sensorSeries = (readings || []).map(r => ({
    time:        r.timestamp,
    temperature: r.temperature,
    vibration:   r.vibration,
    current:     r.current,
    rpm:         r.rpm,
  }));

  const predictionSeries = (predictions || []).map(p => ({
    time:               p.created_at,
    anomalyScore:       p.anomaly_score,
    failureProbability: p.failure_probability,
    riskLevel:          p.risk_level,
  }));

  // Summary statistics
  const summary = {
    totalReadings:    readings?.length  || 0,
    totalPredictions: predictions?.length || 0,
    totalAlerts:      alerts?.length    || 0,
    criticalAlerts:   alerts?.filter(a => a.severity === 'critical').length || 0,
    avgTemperature:   average(readings, 'temperature'),
    avgVibration:     average(readings, 'vibration'),
    avgCurrent:       average(readings, 'current'),
    avgRpm:           average(readings, 'rpm'),
    maxFailureProb:   Math.max(...(predictions?.map(p => p.failure_probability) || [0])),
  };

  return { sensorSeries, predictionSeries, alerts, summary };
}

function average(arr, key) {
  if (!arr || arr.length === 0) return 0;
  return parseFloat((arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length).toFixed(2));
}
