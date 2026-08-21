// routes/healthRoutes.js
import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    // Quick ping to Supabase
    const { error } = await supabase.from('machines').select('id').limit(1);
    const dbStatus  = error ? 'degraded' : 'ok';

    res.json({
      success: true,
      data: {
        status:    'ok',
        db:        dbStatus,
        timestamp: new Date().toISOString(),
        version:   '1.0.0',
        service:   'AIoT Machine Health Monitoring Backend',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
