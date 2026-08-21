// routes/maintenanceRoutes.js
import { Router } from 'express';
import { z } from 'zod';
import { listMaintenance, updateMaintenanceStatus } from '../services/maintenanceService.js';

const router = Router();

const StatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
});

// GET /api/maintenance
router.get('/', async (req, res) => {
  try {
    const filters = {};
    if (req.query.status)     filters.status     = req.query.status;
    if (req.query.priority)   filters.priority   = req.query.priority;
    if (req.query.machine_id) filters.machine_id = req.query.machine_id;

    const data = await listMaintenance(filters);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/maintenance/:id
router.patch('/:id', async (req, res) => {
  try {
    const parsed = StatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }

    const data = await updateMaintenanceStatus(req.params.id, parsed.data.status);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
