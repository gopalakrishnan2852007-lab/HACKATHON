// services/maintenanceService.js
// ─────────────────────────────────────────────────────────────────────────────
// Creates and manages maintenance records.
// Also avoids duplicate open records for the same machine.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../config/supabase.js';

/**
 * Create a maintenance record only if none is already pending for this machine.
 */
export async function createMaintenanceRecord({ machine, riskLevel, aiResult }) {
  // Check for existing open record
  const { data: existing } = await supabase
    .from('maintenance')
    .select('id')
    .eq('machine_id', machine.id)
    .in('status', ['pending', 'in_progress'])
    .limit(1);

  if (existing && existing.length > 0) return null; // already tracked

  const issue = riskLevel === 'critical'
    ? 'Critical failure risk – immediate attention required'
    : 'High failure risk – urgent maintenance required';

  const { data, error } = await supabase
    .from('maintenance')
    .insert({
      machine_id:     machine.id,
      issue,
      possible_cause: aiResult?.possibleCause  || 'Sensor anomaly detected – cause under investigation',
      recommendation: aiResult?.recommendation || 'Inspect machine components and sensor readings manually',
      priority:       riskLevel,
      status:         'pending',
      created_at:     new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[MAINTENANCE] Failed to create record:', error.message);
    return null;
  }
  return data;
}

/**
 * List all maintenance records.
 */
export async function listMaintenance(filters = {}) {
  let query = supabase
    .from('maintenance')
    .select(`
      *,
      machines(id, name, location, type)
    `)
    .order('created_at', { ascending: false });

  if (filters.status)     query = query.eq('status', filters.status);
  if (filters.priority)   query = query.eq('priority', filters.priority);
  if (filters.machine_id) query = query.eq('machine_id', filters.machine_id);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update maintenance record status.
 */
export async function updateMaintenanceStatus(recordId, status) {
  const update = { status };
  if (status === 'completed') update.completed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('maintenance')
    .update(update)
    .eq('id', recordId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
