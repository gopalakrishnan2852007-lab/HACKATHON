import { Machine, Alert, Maintenance, Prediction, SensorReading, FactoryHealthMetrics } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { apiService, normalizeMachine, normalizeAlert, normalizeMaintenance, normalizePrediction } from './api';
import {
  INITIAL_MACHINES,
  INITIAL_ALERTS,
  INITIAL_MAINTENANCE,
  INITIAL_PREDICTIONS,
} from './mockData';

type Listener = () => void;

class DataService {
  private machines: Machine[] = [...INITIAL_MACHINES];
  private alerts: Alert[] = [...INITIAL_ALERTS];
  private maintenance: Maintenance[] = [...INITIAL_MAINTENANCE];
  private predictions: Record<string, Prediction> = { ...INITIAL_PREDICTIONS };
  private listeners: Set<Listener> = new Set();
  private liveSensorInterval: any = null;
  private backendSyncInterval: any = null;
  private isLiveStreaming = true;
  private isRealBackendConnected = false;
  private supabaseChannels: any[] = [];
  private ingestRatePerSec = 14.2;

  constructor() {
    this.init();
  }

  private async init() {
    // 1. Initial health check & data fetch from backend
    await this.syncFromBackend();

    // 2. Setup Supabase Realtime if configured
    this.setupSupabaseRealtime();

    // 3. Start background live sync
    this.startBackgroundSync();
  }

  public async syncFromBackend() {
    try {
      const isOnline = await apiService.checkBackendHealth();
      this.isRealBackendConnected = isOnline;

      if (isOnline) {
        // Fetch all primary resources in parallel from real backend
        const [remoteMachines, remoteAlerts, remoteMaintenance] = await Promise.all([
          apiService.getMachines(),
          apiService.getAlerts(),
          apiService.getMaintenance(),
        ]);

        if (remoteMachines && remoteMachines.length > 0) {
          this.machines = remoteMachines;
          // Optionally preload predictions for connected machines
          for (const m of remoteMachines) {
            apiService.getPrediction(m.id).then((p) => {
              if (p) {
                this.predictions[m.id] = p;
                this.notify();
              }
            });
          }
        }

        if (remoteAlerts) {
          this.alerts = remoteAlerts;
        }

        if (remoteMaintenance) {
          this.maintenance = remoteMaintenance;
        }

        // When real backend is connected, clear synthetic random fluctuation interval
        if (this.liveSensorInterval) {
          clearInterval(this.liveSensorInterval);
          this.liveSensorInterval = null;
        }
      } else {
        // Fallback mode when backend is offline
        if (!this.liveSensorInterval && this.isLiveStreaming) {
          this.startLocalFallbackStream();
        }
      }
    } catch (e) {
      console.warn('Backend sync failed, maintaining local fallback state', e);
      this.isRealBackendConnected = false;
      if (!this.liveSensorInterval && this.isLiveStreaming) {
        this.startLocalFallbackStream();
      }
    } finally {
      this.notify();
    }
  }

  private setupSupabaseRealtime() {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      // 1. Subscribe to machines table
      const machinesChannel = supabase
        .channel('public:machines')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updated = normalizeMachine(payload.new);
            this.machines = this.machines.map(m => m.id === updated.id ? { ...m, ...updated } : m);
            this.notify();
          }
        })
        .subscribe();

      // 2. Subscribe to sensor_readings table
      const sensorChannel = supabase
        .channel('public:sensor_readings')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, (payload) => {
          if (payload.new) {
            const r = payload.new as SensorReading;
            this.machines = this.machines.map(m => {
              if (m.id === r.machine_id) {
                return {
                  ...m,
                  temperature: Number(r.temperature),
                  vibration: Number(r.vibration),
                  current: Number(r.current),
                  rpm: Math.round(Number(r.rpm)),
                  updated_at: r.timestamp || new Date().toISOString(),
                };
              }
              return m;
            });
            this.notify();
          }
        })
        .subscribe();

      // 3. Subscribe to alerts table
      const alertsChannel = supabase
        .channel('public:alerts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newAlert = normalizeAlert(payload.new);
            this.alerts = [newAlert, ...this.alerts.filter(a => a.id !== newAlert.id)];
            this.notify();
          } else if (payload.eventType === 'UPDATE') {
            const updatedAlert = normalizeAlert(payload.new);
            this.alerts = this.alerts.map(a => a.id === updatedAlert.id ? updatedAlert : a);
            this.notify();
          }
        })
        .subscribe();

      // 4. Subscribe to predictions
      const predictionsChannel = supabase
        .channel('public:predictions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, (payload) => {
          if (payload.new) {
            const newPred = normalizePrediction(payload.new);
            this.predictions[newPred.machine_id] = newPred;
            this.notify();
          }
        })
        .subscribe();

      // 5. Subscribe to maintenance
      const maintenanceChannel = supabase
        .channel('public:maintenance')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = normalizeMaintenance(payload.new);
            this.maintenance = [newTask, ...this.maintenance.filter(m => m.id !== newTask.id)];
            this.notify();
          } else if (payload.eventType === 'UPDATE') {
            const updated = normalizeMaintenance(payload.new);
            this.maintenance = this.maintenance.map(m => m.id === updated.id ? updated : m);
            this.notify();
          }
        })
        .subscribe();

      this.supabaseChannels = [machinesChannel, sensorChannel, alertsChannel, predictionsChannel, maintenanceChannel];
    } catch (err) {
      console.warn('Supabase Realtime subscription error', err);
    }
  }

  // Automatic polling sync when backend is online without Supabase WebSockets
  private startBackgroundSync() {
    if (this.backendSyncInterval) clearInterval(this.backendSyncInterval);

    this.backendSyncInterval = setInterval(async () => {
      if (!this.isLiveStreaming) return;

      const isOnline = await apiService.checkBackendHealth();
      this.isRealBackendConnected = isOnline;

      if (isOnline) {
        // Fast lightweight sync of machines & alerts from backend
        try {
          const [remoteMachines, remoteAlerts, remoteMaintenance] = await Promise.all([
            apiService.getMachines(),
            apiService.getAlerts(),
            apiService.getMaintenance(),
          ]);

          if (remoteMachines && remoteMachines.length > 0) {
            this.machines = remoteMachines;
          }
          if (remoteAlerts) {
            this.alerts = remoteAlerts;
          }
          if (remoteMaintenance) {
            this.maintenance = remoteMaintenance;
          }
          this.ingestRatePerSec = Number((14 + Math.random() * 4).toFixed(1));
          this.notify();
        } catch {
          // Ignore transient fetch hiccup
        }
      } else {
        // Backend is offline, run fallback generator if not already active
        if (!this.liveSensorInterval) {
          this.startLocalFallbackStream();
        }
      }
    }, 3000);
  }

  // Local fallback sensor fluctuation generator only active if backend is disconnected
  private startLocalFallbackStream() {
    if (this.liveSensorInterval) clearInterval(this.liveSensorInterval);

    this.liveSensorInterval = setInterval(() => {
      if (!this.isLiveStreaming || this.isRealBackendConnected) return;

      this.machines = this.machines.map((m) => {
        if (m.status === 'healthy') {
          const tempDelta = (Math.random() - 0.5) * 0.3;
          const vibDelta = (Math.random() - 0.5) * 0.04;
          const currDelta = (Math.random() - 0.5) * 0.15;
          const rpmDelta = Math.round((Math.random() - 0.5) * 8);

          return {
            ...m,
            temperature: Number(Math.max(30, m.temperature + tempDelta).toFixed(1)),
            vibration: Number(Math.max(0.4, m.vibration + vibDelta).toFixed(2)),
            current: Number(Math.max(5, m.current + currDelta).toFixed(1)),
            rpm: Math.max(500, m.rpm + rpmDelta),
            updated_at: new Date().toISOString(),
          };
        } else {
          const tempDelta = (Math.random() - 0.48) * 0.2;
          const vibDelta = (Math.random() - 0.48) * 0.06;
          return {
            ...m,
            temperature: Number(Math.max(35, m.temperature + tempDelta).toFixed(1)),
            vibration: Number(Math.max(1.0, m.vibration + vibDelta).toFixed(2)),
            updated_at: new Date().toISOString(),
          };
        }
      });

      this.ingestRatePerSec = Number((10 + Math.random() * 3).toFixed(1));
      this.notify();
    }, 2500);
  }

  public toggleLiveStream(enable?: boolean) {
    this.isLiveStreaming = enable !== undefined ? enable : !this.isLiveStreaming;
    this.notify();
  }

  public getIsLiveStreaming(): boolean {
    return this.isLiveStreaming;
  }

  public getIsBackendConnected(): boolean {
    return this.isRealBackendConnected;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // Getters
  public getMachines(): Machine[] {
    return this.machines;
  }

  public getMachine(id: string): Machine | undefined {
    return this.machines.find(m => m.id === id);
  }

  public getAlerts(): Alert[] {
    return this.alerts;
  }

  public getMaintenance(): Maintenance[] {
    return this.maintenance;
  }

  public getPrediction(machineId: string): Prediction | undefined {
    return this.predictions[machineId];
  }

  public getFactoryMetrics(): FactoryHealthMetrics {
    const total = this.machines.length;
    const healthy = this.machines.filter(m => m.status === 'healthy').length;
    const warning = this.machines.filter(m => m.status === 'warning').length;
    const critical = this.machines.filter(m => m.status === 'critical' || m.status === 'high').length;
    const activeAlerts = this.alerts.filter(a => a.status === 'ACTIVE').length;

    const totalHealthScore = this.machines.reduce((acc, m) => acc + (m.health_score || 0), 0);
    const overallHealthScore = total > 0 ? Math.round(totalHealthScore / total) : 85;

    const totalRisk = this.machines.reduce((acc, m) => acc + (m.failure_probability || 0), 0);
    const avgFailureRisk = total > 0 ? Number((totalRisk / total).toFixed(2)) : 0.15;

    return {
      totalMachines: total,
      healthyCount: healthy,
      warningCount: warning,
      criticalCount: critical,
      activeAlerts,
      overallHealthScore,
      ingestRatePerSec: this.ingestRatePerSec,
      avgFailureRisk,
    };
  }

  // Actions
  public async acknowledgeAlert(id: string): Promise<void> {
    const target = this.alerts.find(a => a.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    const updatedAlert: Alert = {
      ...target,
      status: 'ACKNOWLEDGED',
      acknowledged_at: now,
    };

    this.alerts = this.alerts.map(a => a.id === id ? updatedAlert : a);
    this.notify();

    await apiService.updateAlert(id, { status: 'ACKNOWLEDGED', acknowledged_at: now });
  }

  public async resolveAlert(id: string): Promise<void> {
    const target = this.alerts.find(a => a.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    const updatedAlert: Alert = {
      ...target,
      status: 'RESOLVED',
      resolved_at: now,
    };

    this.alerts = this.alerts.map(a => a.id === id ? updatedAlert : a);
    this.notify();

    await apiService.updateAlert(id, { status: 'RESOLVED', resolved_at: now });
  }

  public async updateMaintenanceStatus(id: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED', notes?: string): Promise<void> {
    const target = this.maintenance.find(m => m.id === id);
    if (!target) return;

    const updated: Maintenance = {
      ...target,
      status,
      completed_at: status === 'COMPLETED' ? new Date().toISOString() : target.completed_at,
      technician_notes: notes || target.technician_notes,
    };

    this.maintenance = this.maintenance.map(m => m.id === id ? updated : m);
    this.notify();

    await apiService.updateMaintenance(id, {
      status,
      completed_at: updated.completed_at,
      technician_notes: updated.technician_notes,
    });
  }

  public async createMaintenanceTask(task: Omit<Maintenance, 'id' | 'created_at'>): Promise<Maintenance> {
    const newTask: Maintenance = {
      ...task,
      id: `WO-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };

    this.maintenance = [newTask, ...this.maintenance];
    this.notify();
    return newTask;
  }

  // Inject Anomaly in Simulator (calls backend POST /api/simulator/inject-anomaly/:id)
  public async injectSimulatedTelemetry(
    machineId: string,
    telemetry: {
      temperature: number;
      vibration: number;
      current: number;
      rpm: number;
      scenarioName?: string;
    }
  ): Promise<{ machine: Machine; prediction: Prediction; alert?: Alert }> {
    const result = await apiService.injectAnomaly(machineId, telemetry);

    // Update in-memory machine with real backend deterioration values
    this.machines = this.machines.map(m => m.id === machineId ? result.machine : m);
    // Update prediction
    this.predictions[machineId] = result.prediction;

    // If alert was generated, add to alerts list
    if (result.alert) {
      this.alerts = [result.alert, ...this.alerts.filter(a => a.id !== result.alert!.id)];
    }

    this.notify();

    // Trigger an immediate background sync so any backend-created events are loaded
    setTimeout(() => this.syncFromBackend(), 1000);

    return result;
  }

  // Reset machine to healthy state
  public resetMachine(machineId: string) {
    const original = INITIAL_MACHINES.find(m => m.id === machineId);
    if (!original) return;

    const resetMachine: Machine = {
      ...original,
      status: 'healthy',
      health_score: 95,
      failure_probability: 0.03,
      temperature: 42.0,
      vibration: 1.2,
      current: 12.5,
      rpm: original.thresholds ? (original.thresholds.rpm_min + original.thresholds.rpm_max) / 2 : 2800,
      updated_at: new Date().toISOString(),
    };

    this.machines = this.machines.map(m => m.id === machineId ? resetMachine : m);
    
    this.predictions[machineId] = {
      id: `PRED-${machineId}-NORM`,
      machine_id: machineId,
      anomaly_score: 3,
      failure_probability: 0.03,
      risk_level: 'LOW',
      possible_cause: 'Nominal Operations Restored',
      explanation: 'Telemetry parameters returned to baseline envelope. Harmonic vibration and thermal balance restored.',
      recommendation: 'Continue regular monitoring.',
      confidence: 98.5,
      created_at: new Date().toISOString(),
      component_affected: 'All Subassemblies',
      estimated_time_to_failure: '> 4,000 operating hours',
    };

    this.notify();
  }
}

export const dataService = new DataService();
