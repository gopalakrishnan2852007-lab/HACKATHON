// services/alertService.js
// ─────────────────────────────────────────────────────────────────────────────
// Alert engine with cooldown/state-change logic.
// Prevents flooding the alerts table with a new row every 3 seconds.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../config/supabase.js';

// In-memory cooldown tracker: machineId → { riskLevel, lastCreatedAt }
const alertCooldown = new Map();
const COOLDOWN_MS   = 5 * 60 * 1000; // 5 minutes between alerts for same machine+level

/**
 * Build alert title/message from risk data.
 */
function buildAlertContent(machine, failureProbability, riskLevel, aiResult) {
  const severity = riskLevel;
  const fp       = (failureProbability * 100).toFixed(1);

  const titles = {
    critical: '🚨 Critical Failure Risk Detected',
    high:     '⚠️ High Failure Risk Detected',
    medium:   '📊 Elevated Machine Risk',
    low:      '✅ Machine Health Notice',
  };

  const title = titles[riskLevel] || 'Machine Alert';
  const aiText = aiResult?.possibleCause
    ? ` AI Assessment: ${aiResult.possibleCause}`
    : '';

  const message = `Machine "${machine.name}" (${machine.location}) has a failure probability of ${fp}%.${aiText}`;

  return { severity, title, message };
}

/**
 * Create a new alert or skip if cooldown is active for same risk level.
 */
export async function createOrUpdateAlert({ machine, failureProbability, riskLevel, aiResult }) {
  const cooldownKey = machine.id;
  const now         = Date.now();
  const cached      = alertCooldown.get(cooldownKey);

  // Skip if same or lower risk within cooldown window
  const riskOrder = { low: 1, medium: 2, high: 3, critical: 4 };
  if (cached) {
    const sameOrLower  = riskOrder[riskLevel] <= riskOrder[cached.riskLevel];
    const withinWindow = (now - cached.lastCreatedAt) < COOLDOWN_MS;
    if (sameOrLower && withinWindow) return null;
  }

  const { severity, title, message } = buildAlertContent(machine, failureProbability, riskLevel, aiResult);

  const { data: alert, error } = await supabase
    .from('alerts')
    .insert({
      machine_id:  machine.id,
      severity,
      title,
      message,
      status:      'active',
      created_at:  new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[ALERT SERVICE] Failed to create alert:', error.message);
    return null;
  }

  // Update cooldown
  alertCooldown.set(cooldownKey, { riskLevel, lastCreatedAt: now });
  return alert;
}

/**
 * List all alerts (optionally filtered by status).
 */
export async function listAlerts(filters = {}) {
  let query = supabase
    .from('alerts')
    .select(`
      *,
      machines(id, name, location)
    `)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.severity) query = query.eq('severity', filters.severity);
  if (filters.machine_id) query = query.eq('machine_id', filters.machine_id);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update alert status (acknowledge / resolve).
 */
export async function updateAlertStatus(alertId, status) {
  const now = new Date().toISOString();
  const update = { status };
  if (status === 'acknowledged') update.acknowledged_at = now;
  if (status === 'resolved')     update.resolved_at     = now;

  const { data, error } = await supabase
    .from('alerts')
    .update(update)
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Reset cooldown for a machine (used when anomaly is injected for demo).
 */
export function resetAlertCooldown(machineId) {
  alertCooldown.delete(machineId);
}
