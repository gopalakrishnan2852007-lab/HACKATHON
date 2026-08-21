// services/sensorService.js
// ─────────────────────────────────────────────────────────────────────────────
// Full prediction pipeline triggered on each sensor ingestion.
//
//  1. Validate reading
//  2. Persist sensor_reading
//  3. Anomaly detection
//  4. Failure probability
//  5. Update machine health / status
//  6. (if significant) AI reasoning
//  7. Persist prediction
//  8. Create/update alert
//  9. Create maintenance record if high/critical
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../config/supabase.js';
import { detectAnomaly } from './anomalyService.js';
import { calculateFailureProbability, riskToStatus } from './predictionService.js';
import { getAIAnalysis } from './aiService.js';
import { createOrUpdateAlert } from './alertService.js';
import { createMaintenanceRecord } from './maintenanceService.js';

// Threshold above which we call Gemini (saves API quota on trivial readings)
const AI_CALL_THRESHOLD = 0.40;

/**
 * Full pipeline: ingest a single sensor reading.
 *
 * @param {object} reading - { machine_id, temperature, vibration, current, rpm }
 * @returns {Promise<object>} pipeline result
 */
export async function ingestSensorReading(reading) {
  const { machine_id } = reading;

  // ── 1. Fetch machine details (baseline + current state) ────────────────────
  const { data: machine, error: machineErr } = await supabase
    .from('machines')
    .select('*')
    .eq('id', machine_id)
    .single();

  if (machineErr || !machine) {
    throw new Error(`Machine ${machine_id} not found: ${machineErr?.message}`);
  }

  // ── 2. Fetch most recent previous reading (for rate-of-change) ─────────────
  const { data: prevReadings } = await supabase
    .from('sensor_readings')
    .select('temperature, vibration, current, rpm')
    .eq('machine_id', machine_id)
    .order('timestamp', { ascending: false })
    .limit(1);

  const previous = prevReadings?.[0] || null;

  // ── 3. Persist sensor reading ──────────────────────────────────────────────
  const { data: savedReading, error: saveErr } = await supabase
    .from('sensor_readings')
    .insert({
      machine_id,
      temperature: reading.temperature,
      vibration:   reading.vibration,
      current:     reading.current,
      rpm:         reading.rpm,
      timestamp:   reading.timestamp || new Date().toISOString(),
    })
    .select()
    .single();

  if (saveErr) throw new Error(`Failed to save reading: ${saveErr.message}`);

  // ── 4. Anomaly detection ───────────────────────────────────────────────────
  const { anomalyScore, status: anomalyStatus, sensorScores } = detectAnomaly(
    reading, machine, previous
  );

  // ── 5. Failure probability ─────────────────────────────────────────────────
  const { failureProbability, riskLevel, healthScore } = calculateFailureProbability(
    reading, machine, anomalyScore, sensorScores, previous
  );

  // ── 6. Update machine health + status ─────────────────────────────────────
  const machineStatus = riskToStatus(riskLevel);
  await supabase
    .from('machines')
    .update({
      health_score:        healthScore,
      failure_probability: failureProbability,
      status:              machineStatus,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', machine_id);

  // ── 7. AI reasoning (only if risk is meaningful) ──────────────────────────
  let aiResult = null;
  if (failureProbability >= AI_CALL_THRESHOLD) {
    aiResult = await getAIAnalysis({
      machine,
      reading,
      baseline: machine,
      anomalyScore,
      failureProbability,
      riskLevel,
      sensorScores,
      previous,
    });
  }

  // ── 8. Persist prediction ─────────────────────────────────────────────────
  const predictionPayload = {
    machine_id,
    anomaly_score:       anomalyScore,
    failure_probability: failureProbability,
    risk_level:          riskLevel,
    possible_cause:      aiResult?.possibleCause   || null,
    explanation:         aiResult?.explanation      || null,
    recommendation:      aiResult?.recommendation   || null,
    confidence:          aiResult?.confidence       || null,
    created_at:          new Date().toISOString(),
  };

  const { data: prediction } = await supabase
    .from('predictions')
    .insert(predictionPayload)
    .select()
    .single();

  // ── 9. Alerts ──────────────────────────────────────────────────────────────
  let alert = null;
  if (failureProbability >= 0.40) {
    alert = await createOrUpdateAlert({ machine, failureProbability, riskLevel, aiResult });
  }

  // ── 10. Maintenance ───────────────────────────────────────────────────────
  let maintenance = null;
  if (failureProbability >= 0.70) {
    maintenance = await createMaintenanceRecord({ machine, riskLevel, aiResult });
  }

  return {
    reading: savedReading,
    anomalyScore,
    anomalyStatus,
    sensorScores,
    failureProbability,
    riskLevel,
    healthScore,
    prediction,
    alert,
    maintenance,
    aiUsed: !!aiResult,
  };
}
