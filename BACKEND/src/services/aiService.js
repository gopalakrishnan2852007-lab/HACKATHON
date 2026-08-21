// services/aiService.js
// ─────────────────────────────────────────────────────────────────────────────
// Gemini-powered AI reasoning layer.
//
// Gemini is ONLY used for:
//   • natural-language explanation of the anomaly
//   • possible cause
//   • maintenance recommendation
//   • confidence / priority
//
// Gemini is NOT used for numerical detection/scoring.
//
// Fallback: if Gemini fails/times-out, deterministic fallback text is used
//           so the monitoring pipeline is NEVER broken.
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../config/env.js';

const genAI  = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
const MODEL  = 'gemini-3.6-flash';      // current model — fast, low-cost, sufficient for JSON reasoning
const TIMEOUT_MS = 15_000;

/**
 * Build a deterministic fallback when Gemini is unavailable.
 */
function buildFallback(machine, failureProbability, riskLevel) {
  const cause = failureProbability >= 0.85
    ? 'Multiple sensors showing simultaneous deviation — possible mechanical overload or coolant failure'
    : failureProbability >= 0.70
    ? 'Elevated temperature and vibration suggest bearing degradation or lubrication issue'
    : 'Sensor deviation detected — possible early-stage wear or operational stress';

  const recommendation = riskLevel === 'critical'
    ? 'Immediate shutdown and inspection recommended. Check bearings, coolant levels, and electrical connections.'
    : riskLevel === 'high'
    ? 'Schedule urgent maintenance within 4 hours. Inspect lubrication, seals, and motor windings.'
    : 'Monitor closely. Schedule preventive inspection within 24 hours.';

  return {
    possibleCause: cause,
    explanation: `[Fallback – AI unavailable] Deterministic analysis indicates ${riskLevel} risk based on sensor deviations.`,
    recommendation,
    confidence: 0.60,
    priority: riskLevel,
  };
}

/**
 * Request AI reasoning from Gemini.
 *
 * @param {object} params
 * @param {object} params.machine
 * @param {object} params.reading
 * @param {object} params.baseline
 * @param {number} params.anomalyScore
 * @param {number} params.failureProbability
 * @param {string} params.riskLevel
 * @param {object} params.sensorScores
 * @param {object} params.previous  - optional previous reading for trend context
 * @returns {Promise<object>}  { possibleCause, explanation, recommendation, confidence, priority }
 */
export async function getAIAnalysis({
  machine,
  reading,
  baseline,
  anomalyScore,
  failureProbability,
  riskLevel,
  sensorScores,
  previous = null,
}) {
  const prompt = `
You are an industrial IoT machine-health analyst. 
Analyse the following real-time sensor data and provide a structured assessment.

## Machine Details
- ID     : ${machine.id}
- Name   : ${machine.name}
- Type   : ${machine.type}
- Location: ${machine.location}

## Current Sensor Readings
- Temperature : ${reading.temperature} °C  (baseline: ${baseline.baseline_temperature} °C)
- Vibration   : ${reading.vibration} mm/s  (baseline: ${baseline.baseline_vibration} mm/s)
- Current     : ${reading.current} A       (baseline: ${baseline.baseline_current} A)
- RPM         : ${reading.rpm}             (baseline: ${baseline.baseline_rpm})

${previous ? `## Previous Readings (trend context)
- Temperature : ${previous.temperature} °C
- Vibration   : ${previous.vibration} mm/s
- Current     : ${previous.current} A
- RPM         : ${previous.rpm}` : ''}

## Statistical Analysis Results
- Anomaly Score       : ${anomalyScore.toFixed(3)} / 1.000
- Failure Probability : ${failureProbability.toFixed(3)} / 1.000
- Risk Level          : ${riskLevel.toUpperCase()}
- Per-sensor scores   : ${JSON.stringify(sensorScores)}

## Instructions
1. Do NOT claim certainty. Use language like "possible", "likely", "AI assessment", "suggested inspection".
2. Be specific about what the sensor values indicate mechanically.
3. Return ONLY valid JSON, no markdown, no extra text.

Return EXACTLY this JSON structure:
{
  "possibleCause": "...",
  "explanation": "...",
  "recommendation": "...",
  "confidence": 0.0,
  "priority": "low|medium|high|critical"
}
`.trim();

  try {
    const model    = genAI.getGenerativeModel({ model: MODEL });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini timeout')), TIMEOUT_MS)
    );
    const genPromise = model.generateContent(prompt);
    const result   = await Promise.race([genPromise, timeoutPromise]);
    const text     = result.response.text().trim();

    // Strip markdown code fences if present
    const jsonStr  = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed   = JSON.parse(jsonStr);

    // Validate required fields
    const required = ['possibleCause', 'explanation', 'recommendation', 'confidence', 'priority'];
    for (const field of required) {
      if (parsed[field] === undefined) throw new Error(`Missing field: ${field}`);
    }

    // Normalise confidence to 0-1
    if (parsed.confidence > 1) parsed.confidence = parsed.confidence / 100;
    parsed.confidence = parseFloat(Math.min(1, Math.max(0, parsed.confidence)).toFixed(3));

    // Normalise priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(parsed.priority)) parsed.priority = riskLevel;

    return parsed;
  } catch (err) {
    console.warn('[AI SERVICE] Gemini unavailable, using deterministic fallback:', err.message);
    return buildFallback(machine, failureProbability, riskLevel);
  }
}
