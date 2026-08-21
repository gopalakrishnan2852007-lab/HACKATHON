// routes/machineRoutes.js
import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// GET /api/machines
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/machines/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'Machine not found' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/machines/:id/history?hours=24
router.get('/:id/history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours || '24', 10);
    const since = new Date(Date.now() - hours * 3_600_000).toISOString();

    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('machine_id', req.params.id)
      .gte('timestamp', since)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data, meta: { machineId: req.params.id, hours } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
