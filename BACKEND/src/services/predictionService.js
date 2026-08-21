// services/predictionService.js
// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC failure probability calculation.
//
// Inputs : anomaly score, per-sensor deviations, rate-of-change trend
// Output : failureProbability (0-1) + riskLevel + healthScore
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute temperature deviation ratio (0-1).
 */
function deviationRatio(value, baseline) {
  if (!baseline || baseline === 0) return 0;
  return Math.min(1, Math.abs(value - baseline) / baseline);
}

/**
 * Calculate failure probability and derived metrics.
 *
 * @param {object} reading    - { temperature, vibration, current, rpm }
 * @param {object} baseline   - { baseline_temperature, ... }
 * @param {number} anomalyScore - 0-1 from anomalyService
 * @param {object} sensorScores - per-sensor sub-scores
 * @param {object} previous   - previous reading (may be null)
 * @returns {{ failureProbability, riskLevel, healthScore }}
 */
export function calculateFailureProbability(reading, baseline, anomalyScore, sensorScores, previous = null) {
  // Base probability = anomaly score (heavy weight)
  let prob = anomalyScore * 0.55;

  // Per-sensor deviation contributions
  prob += deviationRatio(reading.temperature, baseline.baseline_temperature) * 0.15;
  prob += deviationRatio(reading.vibration,   baseline.baseline_vibration)   * 0.15;
  prob += deviationRatio(reading.current,     baseline.baseline_current)     * 0.10;
  prob += deviationRatio(reading.rpm,         baseline.baseline_rpm)         * 0.05;

  // Trend bonus – if multiple sensors are worsening (rising roc)
  if (previous) {
    const tempRoc = (reading.temperature - previous.temperature) / Math.max(1, baseline.baseline_temperature);
    const vibRoc  = (reading.vibration   - previous.vibration)   / Math.max(1, baseline.baseline_vibration);
    if (tempRoc > 0.05 && vibRoc > 0.05) prob += 0.05; // both rising together
  }

  // Clamp to [0, 1]
  const failureProbability = parseFloat(Math.min(1, Math.max(0, prob)).toFixed(4));

  const riskLevel =
    failureProbability >= 0.85 ? 'critical'
    : failureProbability >= 0.70 ? 'high'
    : failureProbability >= 0.40 ? 'medium'
    : 'low';

  // Health score: inverted, weighted towards failure prob
  const rawHealth = 100 - (failureProbability * 70 + anomalyScore * 30);
  const healthScore = parseFloat(Math.min(100, Math.max(0, rawHealth)).toFixed(1));

  return { failureProbability, riskLevel, healthScore };
}

/**
 * Map riskLevel to machine status string.
 */
export function riskToStatus(riskLevel) {
  const map = { low: 'normal', medium: 'warning', high: 'high', critical: 'critical' };
  return map[riskLevel] || 'normal';
}
