export type MachineStatus = 'healthy' | 'warning' | 'high' | 'critical';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type MaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type MaintenancePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Machine {
  id: string;
  name: string;
  type: string;
  location: string;
  status: MachineStatus;
  health_score: number; // 0-100
  failure_probability: number; // 0-1 (or percentage 0-100)
  temperature: number; // in °C
  vibration: number; // in mm/s or g
  current: number; // in Amperes
  rpm: number; // Revolutions per minute
  updated_at: string;
  // Threshold specifications
  thresholds?: {
    temp_warn: number;
    temp_crit: number;
    vib_warn: number;
    vib_crit: number;
    current_warn: number;
    current_crit: number;
    rpm_min: number;
    rpm_max: number;
  };
  operational_hours?: number;
  model_number?: string;
  last_maintenance?: string;
}

export interface SensorReading {
  id?: string;
  machine_id: string;
  temperature: number;
  vibration: number;
  current: number;
  rpm: number;
  timestamp: string;
}

export interface Prediction {
  id: string;
  machine_id: string;
  anomaly_score: number; // 0 - 100
  failure_probability: number; // 0 - 1 (or 0 - 100%)
  risk_level: RiskLevel;
  possible_cause: string;
  explanation: string;
  recommendation: string;
  confidence: number; // 0 - 100%
  created_at: string;
  component_affected?: string;
  estimated_time_to_failure?: string;
}

export interface Alert {
  id: string;
  machine_id: string;
  machine_name?: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  failure_probability?: number;
  recommended_action?: string;
  created_at: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
}

export interface Maintenance {
  id: string;
  machine_id: string;
  machine_name?: string;
  detected_issue: string;
  issue?: string;
  possible_cause: string;
  priority: MaintenancePriority;
  recommendation: string;
  status: MaintenanceStatus;
  assigned_to?: string;
  created_at: string;
  completed_at?: string | null;
  technician_notes?: string;
}

export interface FactoryHealthMetrics {
  totalMachines: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  activeAlerts: number;
  overallHealthScore: number;
  ingestRatePerSec: number;
  avgFailureRisk: number;
}

export interface TelemetryPoint {
  timestamp: string;
  timeLabel: string;
  temperature: number;
  vibration: number;
  current: number;
  rpm: number;
  health_score?: number;
  failure_probability?: number;
  anomaly_score?: number;
}

export interface MachineAnalytics {
  machine_id: string;
  history?: TelemetryPoint[];
  mtbf_hours?: number;
  availability_pct?: number;
  anomaly_frequency?: number;
  current_stress_vector?: {
    thermal_stress: number;
    vibration_stress: number;
    current_stress: number;
    speed_stress: number;
    failure_risk: number;
    degradation: number;
  };
  metrics?: Record<string, any>;
}
