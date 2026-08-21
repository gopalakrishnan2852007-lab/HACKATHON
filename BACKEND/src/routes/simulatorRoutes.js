// routes/simulatorRoutes.js
import { Router } from 'express';
import { z } from 'zod';
import { injectAnomaly, getAnomalyStates, MACHINE_CONFIGS } from '../simulator/sensorSimulator.js';
import { detectAnomaly } from '../services/anomalyService.js';
import { calculateFailureProbability } from '../services/predictionService.js';
import { getAIAnalysis } from '../services/aiService.js';
import { supabase } from '../config/supabase.js';

const router = Router();

const InjectSchema = z.object({
  durationMs: z.number().int().min(5000).max(300_000).optional(),
});

const PredictSchema = z.object({
  machine_id:  z.string().uuid(),
  temperature: z.number(),
  vibration:   z.number(),
  current:     z.number(),
  rpm:         z.number(),
});

// POST /api/simulator/inject-anomaly/:machineId
router.post('/inject-anomaly/:machineId', async (req, res) => {
  try {
    const { machineId } = req.params;

    // Verify machine exists
    const config = MACHINE_CONFIGS.find(m => m.id === machineId);
    if (!config) {
      // Also try by matching last 4 chars for convenience (e.g. "M-07")
      return res.status(404).json({ success: false, error: `Machine ${machineId} not found in simulator` });
    }

    const parsed = InjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    injectAnomaly(machineId, parsed.data.durationMs);

    res.json({
      success: true,
      data: {
        machineId,
        machineName: config.name,
        message: `Anomaly injection started for ${config.name}`,
        durationMs: parsed.data.durationMs || parseInt(process.env.ANOMALY_DURATION_MS || '60000'),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/simulator/predict – one-shot prediction without storing
router.post('/predict', async (req, res) => {
  try {
    const parsed = PredictSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const { machine_id, ...sensorValues } = parsed.data;

    // Fetch machine baseline
    const { data: machine, error: mErr } = await supabase
      .from('machines')
      .select('*')
      .eq('id', machine_id)
      .single();

    if (mErr || !machine) {
      return res.status(404).json({ success: false, error: 'Machine not found' });
    }

    const { anomalyScore, status: anomalyStatus, sensorScores } = detectAnomaly(sensorValues, machine, null);
    const { failureProbability, riskLevel, healthScore } = calculateFailureProbability(
      sensorValues, machine, anomalyScore, sensorScores, null
    );

    // AI reasoning only for significant risk
    let aiResult = null;
    if (failureProbability >= 0.40) {
      aiResult = await getAIAnalysis({
        machine, reading: sensorValues, baseline: machine,
        anomalyScore, failureProbability, riskLevel, sensorScores,
      });
    }

    res.json({
      success: true,
      data: {
        anomalyScore,
        anomalyStatus,
        sensorScores,
        failureProbability,
        riskLevel,
        healthScore,
        ai: aiResult,
        stored: false,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/simulator/status – current anomaly states (useful for frontend demo)
router.get('/status', (req, res) => {
  res.json({ success: true, data: getAnomalyStates() });
});

export default router;
