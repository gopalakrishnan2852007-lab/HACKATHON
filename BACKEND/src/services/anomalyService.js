// services/anomalyService.js
// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC anomaly detection. No LLM is used here.
//
// Logic:
//   1. Absolute threshold check  – is the raw value dangerously high/low?
//   2. Baseline deviation check  – how far is it from this machine's norm?
//   3. Rate-of-change check      – is the value spiking quickly?
//   4. Combination score         – penalise for multiple sensors being off
// ─────────────────────────────────────────────────────────────────────────────

// Absolute limits (independent of machine baseline)
const ABSOLUTE_LIMITS = {
  temperature: { min: 10, max: 120 },   // °C
  vibration:   { min: 0,  max: 20  },   // mm/s
  current:     { min: 0,  max: 50  },   // A
  rpm:         { min: 100, max: 4000 }, // RPM
};

// Per-sensor weight when building the combined score
const SENSOR_WEIGHT = {
  temperature: 0.30,
  vibration:   0.35,
  current:     0.20,
  rpm:         0.15,
};

// Baseline-deviation multipliers
const DEVIATION_FACTOR = {
  temperature: 0.25,  // 25 % of baseline triggers full score
  vibration:   0.40,
  current:     0.30,
  rpm:         0.20,
};

/**
 * Calculate a 0-1 anomaly sub-score for a single sensor.
 *
 * @param {string}  sensor   - sensor name
 * @param {number}  value    - current reading
 * @param {number}  baseline - machine's normal value
 * @param {number}  prev     - previous reading (for rate of change)
 * @returns {number} 0-1 score
 */
function sensorAnomalyScore(sensor, value, baseline, prev) {
  const limits = ABSOLUTE_LIMITS[sensor];
  const deviationFactor = DEVIATION_FACTOR[sensor];
  let score = 0;

  // 1. Absolute threshold – clamp to 1
  const absRange = limits.max - limits.min;
  if (value > limits.max) {
    score = Math.min(1, (value - limits.max) / (absRange * 0.2));
  } else if (value < limits.min) {
    score = Math.min(1, (limits.min - value) / (absRange * 0.2));
  }

  // 2. Baseline deviation (normalised)
  if (baseline > 0) {
    const deviation = Math.abs(value - baseline) / baseline;
    const devScore  = Math.min(1, deviation / deviationFactor);
    score = Math.max(score, devScore);
  }

  // 3. Rate of change (spike detection)
  if (prev !== null && prev !== undefined && baseline > 0) {
    const roc = Math.abs(value - prev) / baseline;
    const rocScore = Math.min(1, roc / 0.15); // 15 % swing in one tick = max
    score = Math.max(score, rocScore * 0.7);  // dampened contribution
  }

  return Math.min(1, score);
}

/**
 * Full anomaly detection for a sensor reading.
 *
 * @param {object} reading  - { temperature, vibration, current, rpm }
 * @param {object} baseline - { baseline_temperature, baseline_vibration, baseline_current, baseline_rpm }
 * @param {object} previous - previous reading object (may be null)
 * @returns {{ anomalyScore: number, status: string, sensorScores: object }}
 */
export function detectAnomaly(reading, baseline, previous = null) {
  const sensors = ['temperature', 'vibration', 'current', 'rpm'];

  const sensorScores = {};
  let weightedSum = 0;

  for (const sensor of sensors) {
    const baselineKey = `baseline_${sensor}`;
    const val  = reading[sensor];
    const base = baseline[baselineKey];
    const prev = previous ? previous[sensor] : null;

    const s = sensorAnomalyScore(sensor, val, base, prev);
    sensorScores[sensor] = parseFloat(s.toFixed(4));
    weightedSum += s * SENSOR_WEIGHT[sensor];
  }

  // Combination penalty: each extra anomalous sensor adds 10 %
  const anomalousSensors = Object.values(sensorScores).filter(s => s > 0.3).length;
  const combinationPenalty = Math.min(0.15, (anomalousSensors - 1) * 0.05);

  const rawScore   = Math.min(1, weightedSum + Math.max(0, combinationPenalty));
  const anomalyScore = parseFloat(rawScore.toFixed(4));

  const status = anomalyScore >= 0.85 ? 'CRITICAL'
               : anomalyScore >= 0.70 ? 'HIGH'
               : anomalyScore >= 0.40 ? 'WARNING'
               : 'NORMAL';

  return { anomalyScore, status, sensorScores };
}
