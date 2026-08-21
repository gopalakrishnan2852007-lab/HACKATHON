// routes/alertRoutes.js
import { Router } from 'express';
import { z } from 'zod';
import { listAlerts, updateAlertStatus } from '../services/alertService.js';

const router = Router();

const StatusSchema = z.object({
  status: z.enum(['active', 'acknowledged', 'resolved']),
});

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.status)     filters.status     = req.query.status;
    if (req.query.severity)   filters.severity   = req.query.severity;
    if (req.query.machine_id) filters.machine_id = req.query.machine_id;

    const data = await listAlerts(filters);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/alerts/:id
router.patch('/:id', async (req, res) => {
  try {
    const parsed = StatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const data = await updateAlertStatus(req.params.id, parsed.data.status);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
