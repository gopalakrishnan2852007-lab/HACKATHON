import { Machine, Alert, Maintenance, Prediction, SensorReading, TelemetryPoint, MachineAnalytics } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  INITIAL_MACHINES,
  INITIAL_ALERTS,
  INITIAL_MAINTENANCE,
  INITIAL_PREDICTIONS,
  generateHistoricalTelemetry,
  evaluateMachinePhysicsAI,
} from './mockData';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

// Normalization utilities to guarantee consistent type contracts across UI
export function normalizeMachine(raw: any): Machine {
  if (!raw) return INITIAL_MACHINES[0];

  const statusRaw = (raw.status || 'healthy').toString().toLowerCase();
  const status: 'healthy' | 'warning' | 'high' | 'critical' = 
    statusRaw === 'critical' ? 'critical' :
    statusRaw === 'high' ? 'high' :
    statusRaw === 'warning' ? 'warning' : 'healthy';

  const healthScore = typeof raw.health_score === 'number' ? raw.health_score :
    typeof raw.healthScore === 'number' ? raw.healthScore : 90;

  let failureProb = typeof raw.failure_probability === 'number' ? raw.failure_probability :
    typeof raw.failureProbability === 'number' ? raw.failureProbability : 0.05;
  if (failureProb > 1) failureProb = failureProb / 100;

  return {
    id: raw.id || raw.machine_id || 'MCH-101',
    name: raw.name || raw.machine_name || `Machine ${raw.id || '101'}`,
    type: raw.type || raw.machine_type || 'Industrial Asset',
    location: raw.location || 'Factory Floor',
    status,
    health_score: Math.round(healthScore),
    failure_probability: Number(failureProb.toFixed(3)),
    temperature: Number(Number(raw.temperature ?? 40).toFixed(1)),
    vibration: Number(Number(raw.vibration ?? 1.2).toFixed(2)),
    current: Number(Number(raw.current ?? 12.0).toFixed(1)),
    rpm: Math.round(Number(raw.rpm ?? 3000)),
    updated_at: raw.updated_at || raw.last_updated || new Date().toISOString(),
    thresholds: raw.thresholds || {
      temp_warn: 65,
      temp_crit: 85,
      vib_warn: 3.5,
      vib_crit: 6.0,
      current_warn: 25,
      current_crit: 35,
      rpm_min: 1000,
      rpm_max: 3600,
    },
    operational_hours: raw.operational_hours || raw.uptime_hours,
    model_number: raw.model_number,
    last_maintenance: raw.last_maintenance,
  };
}

export function normalizeAlert(raw: any): Alert {
  const sevRaw = (raw.severity || 'WARNING').toString().toUpperCase();
  const severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO' =
    sevRaw === 'CRITICAL' ? 'CRITICAL' :
    sevRaw === 'HIGH' ? 'HIGH' :
    sevRaw === 'INFO' ? 'INFO' : 'WARNING';

  const statRaw = (raw.status || 'ACTIVE').toString().toUpperCase();
  const status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' =
    statRaw === 'RESOLVED' ? 'RESOLVED' :
    statRaw === 'ACKNOWLEDGED' ? 'ACKNOWLEDGED' : 'ACTIVE';

  let failureProb = typeof raw.failure_probability === 'number' ? raw.failure_probability : undefined;
  if (failureProb !== undefined && failureProb > 1) failureProb = failureProb / 100;

  return {
    id: raw.id || `ALT-${Date.now().toString().slice(-4)}`,
    machine_id: raw.machine_id || raw.machineId || 'MCH-101',
    machine_name: raw.machine_name || raw.machineName,
    severity,
    title: raw.title || raw.name || 'System Alert',
    message: raw.message || raw.description || 'Abnormal sensor reading detected.',
    status,
    failure_probability: failureProb,
    recommended_action: raw.recommended_action || raw.recommendation,
    created_at: raw.created_at || raw.timestamp || new Date().toISOString(),
    acknowledged_at: raw.acknowledged_at || null,
    resolved_at: raw.resolved_at || null,
  };
}

export function normalizeMaintenance(raw: any): Maintenance {
  const prioRaw = (raw.priority || 'MEDIUM').toString().toUpperCase();
  const priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' =
    prioRaw === 'CRITICAL' ? 'CRITICAL' :
    prioRaw === 'HIGH' ? 'HIGH' :
    prioRaw === 'LOW' ? 'LOW' : 'MEDIUM';

  const statRaw = (raw.status || 'PENDING').toString().toUpperCase();
  const status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' =
    statRaw === 'COMPLETED' ? 'COMPLETED' :
    statRaw === 'IN_PROGRESS' || statRaw === 'INPROGRESS' ? 'IN_PROGRESS' : 'PENDING';

  const issueText = raw.detected_issue || raw.issue || raw.title || 'Preventive Maintenance Inspection';

  return {
    id: raw.id || `WO-${Date.now().toString().slice(-4)}`,
    machine_id: raw.machine_id || raw.machineId || 'MCH-101',
    machine_name: raw.machine_name || raw.machineName,
    detected_issue: issueText,
    issue: issueText,
    possible_cause: raw.possible_cause || raw.cause || 'Operating cycle wear',
    priority,
    recommendation: raw.recommendation || raw.action_plan || 'Perform routine inspection and lubrication.',
    status,
    assigned_to: raw.assigned_to || raw.technician || 'Maintenance Team',
    created_at: raw.created_at || new Date().toISOString(),
    completed_at: raw.completed_at || null,
    technician_notes: raw.technician_notes || raw.notes,
  };
}

export function normalizePrediction(raw: any, fallbackMachineId = 'MCH-101'): Prediction {
  if (!raw) return INITIAL_PREDICTIONS[fallbackMachineId] || INITIAL_PREDICTIONS['MCH-101'];

  const riskRaw = (raw.risk_level || raw.riskLevel || 'LOW').toString().toUpperCase();
  const risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
    riskRaw === 'CRITICAL' ? 'CRITICAL' :
    riskRaw === 'HIGH' ? 'HIGH' :
    riskRaw === 'MEDIUM' ? 'MEDIUM' : 'LOW';

  let failureProb = typeof raw.failure_probability === 'number' ? raw.failure_probability :
    typeof raw.failureProbability === 'number' ? raw.failureProbability : 0.05;
  if (failureProb > 1) failureProb = failureProb / 100;

  return {
    id: raw.id || `PRED-${Date.now().toString().slice(-5)}`,
    machine_id: raw.machine_id || raw.machineId || fallbackMachineId,
    anomaly_score: typeof raw.anomaly_score === 'number' ? raw.anomaly_score : Math.round(failureProb * 100),
    failure_probability: Number(failureProb.toFixed(3)),
    risk_level,
    possible_cause: raw.possible_cause || raw.cause || 'Nominal operations verified',
    explanation: raw.explanation || raw.diagnosis || 'Sensor readings within standard threshold envelopes.',
    recommendation: raw.recommendation || raw.suggested_action || 'Continue standard monitoring.',
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 95.0,
    created_at: raw.created_at || new Date().toISOString(),
    component_affected: raw.component_affected || raw.component || 'Mechanical Subassembly',
    estimated_time_to_failure: raw.estimated_time_to_failure || raw.ttf || (risk_level === 'CRITICAL' ? '< 6 hours' : '> 1,000 hours'),
  };
}

class ApiService {
  private isBackendAvailable = false;
  private backendChecked = false;

  constructor() {
    this.checkBackendHealth();
  }

  // GET /api/health
  public async checkBackendHealth(): Promise<boolean> {
    if (!API_URL) {
      this.isBackendAvailable = false;
      this.backendChecked = true;
      return false;
    }
    try {
      const res = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(2500),
      });
      this.isBackendAvailable = res.ok;
      this.backendChecked = true;
      return res.ok;
    } catch {
      this.isBackendAvailable = false;
      this.backendChecked = true;
      return false;
    }
  }

  public getBackendStatus() {
    return {
      configured: Boolean(API_URL),
      available: this.isBackendAvailable,
      checked: this.backendChecked,
      url: API_URL || 'http://localhost:5000',
    };
  }

  // GET /api/machines
  public async getMachines(): Promise<Machine[]> {
    if (this.isBackendAvailable || !this.backendChecked) {
      try {
        const res = await fetch(`${API_URL}/api/machines`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          this.isBackendAvailable = true;
          if (Array.isArray(data) && data.length > 0) {
            return data.map(normalizeMachine);
          }
        }
      } catch (err) {
        console.warn('Backend GET /api/machines unreachable, fallback to Supabase/Mock', err);
        this.isBackendAvailable = false;
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('machines').select('*').order('id');
        if (!error && data && data.length > 0) return data.map(normalizeMachine);
      } catch (err) {
        console.warn('Supabase getMachines fallback error', err);
      }
    }

    return INITIAL_MACHINES;
  }

  // GET /api/machines/:id
  public async getMachineById(id: string): Promise<Machine | null> {
    if (this.isBackendAvailable || !this.backendChecked) {
      try {
        const res = await fetch(`${API_URL}/api/machines/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          this.isBackendAvailable = true;
          return normalizeMachine(data);
        }
      } catch (err) {
        console.warn(`Backend GET /api/machines/${id} error`, err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('machines').select('*').eq('id', id).single();
        if (!error && data) return normalizeMachine(data);
      } catch (err) {
        console.warn('Supabase getMachineById error', err);
      }
    }

    const found = INITIAL_MACHINES.find(m => m.id === id);
    return found ? normalizeMachine(found) : null;
  }

  // GET /api/machines/:id/history
  public async getMachineHistory(id: string, hours = 24): Promise<TelemetryPoint[]> {
    if (this.isBackendAvailable || !this.backendChecked) {
      try {
        const res = await fetch(`${API_URL}/api/machines/${encodeURIComponent(id)}/history?hours=${hours}`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          this.isBackendAvailable = true;
          if (Array.isArray(data) && data.length > 0) {
            return data.map((d: any) => ({
              timestamp: d.timestamp || new Date().toISOString(),
              timeLabel: d.timeLabel || d.time || new Date(d.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              temperature: Number(Number(d.temperature ?? 40).toFixed(1)),
              vibration: Number(Number(d.vibration ?? 1.2).toFixed(2)),
              current: Number(Number(d.current ?? 12.0).toFixed(1)),
              rpm: Math.round(Number(d.rpm ?? 3000)),
              health_score: d.health_score ?? d.healthScore,
              failure_probability: typeof d.failure_probability === 'number' ? (d.failure_probability <= 1 ? Math.round(d.failure_probability * 100) : d.failure_probability) : undefined,
              anomaly_score: d.anomaly_score ?? d.anomalyScore,
            }));
          }
        }
      } catch (err) {
        console.warn(`Backend GET /api/machines/${id}/history error`, err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('sensor_readings')
          .select('*')
          .eq('machine_id', id)
          .order('timestamp', { ascending: true })
          .limit(40);
        
        if (!error && data && data.length > 0) {
          return (data as SensorReading[]).map((d) => ({
            timestamp: d.timestamp,
            timeLabel: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            temperature: Number(d.temperature),
            vibration: Number(d.vibration),
            current: Number(d.current),
            rpm: Number(d.rpm),
          }));
        }
      } catch (err) {
        console.warn('Supabase getMachineHistory fallback error', err);
      }
    }

    return generateHistoricalTelemetry(id, hours);
  }

  // GET /api/alerts
  public async getAlerts(): Promise<Alert[]> {
    if (this.isBackendAvailable || !this.backendChecked) {
      try {
        const res = await fetch(`${API_URL}/api/alerts`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          this.isBackendAvailable = true;
          if (Array.isArray(data)) {
            return data.map(normalizeAlert);
          }
        }
      } catch (err) {
        console.warn('Backend GET /api/alerts error', err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('alerts').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data.map(normalizeAlert);
      } catch (err) {
        console.warn('Supabase getAlerts fallback error', err);
      }
    }

    return INITIAL_ALERTS;
  }

  // PATCH /api/alerts/:id
  public async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null> {
    if (this.isBackendAvailable || !this.backendChecked) {
      try {
        const res = await fetch(`${API_URL}/api/alerts/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const data = await res.json();
          this.isBackendAvailable = true;
          return normalizeAlert(data);
        }
      } catch (err) {
        console.warn(`Backend PATCH /api/alerts/${id} error`, err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('alerts').update(updates).eq('id', id).select().single();
        if (!error && data) return normalizeAlert(data);
      } catch (err) {
        console.warn('Supabase updateAlert error', err);
      }
    }

    return null;
  }

  // GET /api/maintenance
  public async getMaintenance(): Promise<Maintenance[]> {
    if (this.isBackendAvailable || !this.backendChecked) {
      try {
        const res = await fetch(`${API_URL}/api/maintenance`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          this.isBackendAvailable = true;
          if (Array.isArray(data)) {
            return data.map(normalizeMaintenance);
          }
        }
      } catch (err) {
        console.warn('Backend GET /api/maintenance error', err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('maintenance').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data.map(normalizeMaintenance);
      } catch (err) {
        console.warn('Supabase getMaintenance error', err);
      }
    }

    return INITIAL_MAINTENANCE;
  }

  // PATCH /api/maintenance/:id
  public async updateMaintenance(id: string, updates: Partial<Maintenance>): Promise<Maintenance | null> {
    if (this.isBackendAvailable || !this.backendChecked) {
      try {
        const res = await fetch(`${API_URL}/api/maintenance/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const data = await res.json();
          this.isBackendAvailable = true;
          return normalizeMaintenance(data);
        }
      } catch (err) {
        console.warn(`Backend PATCH /api/maintenance/${id} error`, err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('maintenance').update(updates).eq('id', id).select().single();
        if (!error && data) return normalizeMaintenance(data);
      } catch (err) {
        console.warn('Supabase updateMaintenance error', err);
      }
    }

    return null;
  }

  // GET /api/analytics/:machineId
  public async getAnalytics(machineId: string): Promise<MachineAnalytics | null> {
    if (this.isBackendAvailable || !this.backendChecked) {
      try {
        const res = await fetch(`${API_URL}/api/analytics/${encodeURIComponent(machineId)}`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          this.isBackendAvailable = true;
          return data;
        }
      } catch (err) {
        console.warn(`Backend GET /api/analytics/${machineId} error`, err);
      }
    }

    return null;
  }

  // GET /api/predictions/:machineId
  public async getPrediction(machineId: string): Promise<Prediction | null> {
    if (this.isBackendAvailable || !this.backendChecked) {
      try {
        const res = await fetch(`${API_URL}/api/predictions/${encodeURIComponent(machineId)}`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json();
          this.isBackendAvailable = true;
          return normalizePrediction(data, machineId);
        }
      } catch (err) {
        console.warn(`Backend GET /api/predictions/${machineId} error`, err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('predictions')
          .select('*')
          .eq('machine_id', machineId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (!error && data) return normalizePrediction(data, machineId);
      } catch (err) {
        console.warn('Supabase getPrediction fallback error', err);
      }
    }

    return INITIAL_PREDICTIONS[machineId] || null;
  }

  // POST /api/predictions/analyze
  public async analyzeTelemetry(params: {
    machine_id: string;
    temperature: number;
    vibration: number;
    current: number;
    rpm: number;
  }): Promise<Prediction> {
    if (this.isBackendAvailable || !this.backendChecked) {
      try {
        const res = await fetch(`${API_URL}/api/predictions/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const data = await res.json();
          this.isBackendAvailable = true;
          return normalizePrediction(data, params.machine_id);
        }
      } catch (err) {
        console.warn('Backend POST /api/predictions/analyze error', err);
      }
    }

    const machine = INITIAL_MACHINES.find(m => m.id === params.machine_id) || INITIAL_MACHINES[0];
    const physicsResult = evaluateMachinePhysicsAI(
      machine,
      params.temperature,
      params.vibration,
      params.current,
      params.rpm
    );

    return {
      id: `PRED-AI-${Date.now().toString().slice(-6)}`,
      machine_id: params.machine_id,
      anomaly_score: physicsResult.anomaly_score,
      failure_probability: physicsResult.failure_probability,
      risk_level: physicsResult.risk_level,
      possible_cause: physicsResult.possible_cause,
      explanation: physicsResult.explanation,
      recommendation: physicsResult.recommendation,
      confidence: physicsResult.confidence,
      created_at: new Date().toISOString(),
      component_affected: 'Dynamic Ingestion Telemetry Bus',
      estimated_time_to_failure: physicsResult.status === 'critical' ? '< 6 hours' : '> 500 hours',
    };
  }

  // POST /api/simulator/predict
  public async predictSimulator(params: {
    machine_id?: string;
    temperature: number;
    vibration: number;
    current: number;
    rpm: number;
  }): Promise<Prediction> {
    if (this.isBackendAvailable || !this.backendChecked) {
      try {
        const res = await fetch(`${API_URL}/api/simulator/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const data = await res.json();
          this.isBackendAvailable = true;
          return normalizePrediction(data, params.machine_id || 'MCH-101');
        }
      } catch (err) {
        console.warn('Backend POST /api/simulator/predict error', err);
      }
    }

    return this.analyzeTelemetry({
      machine_id: params.machine_id || 'MCH-101',
      temperature: params.temperature,
      vibration: params.vibration,
      current: params.current,
      rpm: params.rpm,
    });
  }

  // POST /api/simulator/inject-anomaly/:machineId
  public async injectAnomaly(
    machineId: string,
    telemetry: {
      temperature: number;
      vibration: number;
      current: number;
      rpm: number;
      scenarioName?: string;
    }
  ): Promise<{ machine: Machine; prediction: Prediction; alert?: Alert }> {
    if (this.isBackendAvailable || !this.backendChecked) {
      try {
        const res = await fetch(`${API_URL}/api/simulator/inject-anomaly/${encodeURIComponent(machineId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telemetry),
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const data = await res.json();
          this.isBackendAvailable = true;
          return {
            machine: normalizeMachine(data.machine || data),
            prediction: normalizePrediction(data.prediction, machineId),
            alert: data.alert ? normalizeAlert(data.alert) : undefined,
          };
        }
      } catch (err) {
        console.warn(`Backend POST /api/simulator/inject-anomaly/${machineId} error`, err);
      }
    }

    // Fallback simulation engine when backend is offline
    const machine = INITIAL_MACHINES.find(m => m.id === machineId) || INITIAL_MACHINES[0];
    const aiResult = evaluateMachinePhysicsAI(
      machine,
      telemetry.temperature,
      telemetry.vibration,
      telemetry.current,
      telemetry.rpm
    );

    const updatedMachine: Machine = {
      ...machine,
      temperature: telemetry.temperature,
      vibration: telemetry.vibration,
      current: telemetry.current,
      rpm: telemetry.rpm,
      status: aiResult.status,
      health_score: aiResult.health_score,
      failure_probability: aiResult.failure_probability,
      updated_at: new Date().toISOString(),
    };

    const prediction: Prediction = {
      id: `PRED-SIM-${Date.now().toString().slice(-6)}`,
      machine_id: machineId,
      anomaly_score: aiResult.anomaly_score,
      failure_probability: aiResult.failure_probability,
      risk_level: aiResult.risk_level,
      possible_cause: aiResult.possible_cause,
      explanation: aiResult.explanation,
      recommendation: aiResult.recommendation,
      confidence: aiResult.confidence,
      created_at: new Date().toISOString(),
      component_affected: 'Harmonic Drive & Mechanical Subassembly',
      estimated_time_to_failure: aiResult.status === 'critical' ? '< 4 operating hours' : aiResult.status === 'high' ? '24-48 hours' : '> 1,000 hours',
    };

    let alert: Alert | undefined = undefined;
    if (aiResult.status === 'critical' || aiResult.status === 'high' || aiResult.status === 'warning') {
      alert = {
        id: `ALT-SIM-${Date.now().toString().slice(-5)}`,
        machine_id: machineId,
        machine_name: machine.name,
        severity: aiResult.status === 'critical' ? 'CRITICAL' : aiResult.status === 'high' ? 'HIGH' : 'WARNING',
        title: `Simulated Anomaly: ${aiResult.possible_cause.split('&')[0].trim()}`,
        message: aiResult.explanation,
        status: 'ACTIVE',
        failure_probability: aiResult.failure_probability,
        recommended_action: aiResult.recommendation,
        created_at: new Date().toISOString(),
        acknowledged_at: null,
        resolved_at: null,
      };
    }

    return { machine: updatedMachine, prediction, alert };
  }
}

export const apiService = new ApiService();
