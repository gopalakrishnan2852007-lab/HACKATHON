// routes/analyticsRoutes.js
import { Router } from 'express';
import { getMachineAnalytics } from '../services/analyticsService.js';

const router = Router();

// GET /api/analytics/:machineId?hours=24
router.get('/:machineId', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours || '24', 10);
    if (isNaN(hours) || hours < 1 || hours > 168) {
      return res.status(400).json({ success: false, error: 'hours must be between 1 and 168' });
    }

    const data = await getMachineAnalytics(req.params.machineId, hours);
    res.json({ success: true, data, meta: { machineId: req.params.machineId, hours } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
