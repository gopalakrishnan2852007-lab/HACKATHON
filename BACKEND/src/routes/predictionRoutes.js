// routes/predictionRoutes.js
import { Router } from 'express';
import { z } from 'zod';
import { detectAnomaly } from '../services/anomalyService.js';
import { calculateFailureProbability } from '../services/predictionService.js';
import { getAIAnalysis } from '../services/aiService.js';
import { ingestSensorReading } from '../services/sensorService.js';
import { supabase } from '../config/supabase.js';

const router = Router();

const ReadingSchema = z.object({
  machine_id:  z.string().uuid(),
  temperature: z.number().min(-50).max(300),
  vibration:   z.number().min(0).max(100),
  current:     z.number().min(0).max(200),
  rpm:         z.number().min(0).max(10000),
  timestamp:   z.string().optional(),
});

// POST /api/predictions/analyze – full pipeline ingest
router.post('/analyze', async (req, res) => {
  try {
    const parsed = ReadingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const result = await ingestSensorReading(parsed.data);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
