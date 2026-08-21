import { Machine, SensorReading, Prediction, Alert, Maintenance, TelemetryPoint } from '../types';

export const INITIAL_MACHINES: Machine[] = [
  {
    id: 'MCH-101',
    name: '5-Axis CNC Milling Center',
    type: 'Machining Center',
    location: 'Bay A - Precision Cell 1',
    status: 'healthy',
    health_score: 96,
    failure_probability: 0.04,
    temperature: 42.5,
    vibration: 1.4,
    current: 14.8,
    rpm: 3200,
    updated_at: new Date().toISOString(),
    operational_hours: 4120,
    model_number: 'DMG-MORI DMU 50',
    last_maintenance: '2026-07-15',
    thresholds: {
      temp_warn: 65,
      temp_crit: 85,
      vib_warn: 3.5,
      vib_crit: 6.0,
      current_warn: 24,
      current_crit: 32,
      rpm_min: 800,
      rpm_max: 4500,
    },
  },
  {
    id: 'MCH-102',
    name: 'High-Pressure Centrifugal Pump',
    type: 'Hydraulic Pumping Unit',
    location: 'Bay B - Fluid Handling',
    status: 'warning',
    health_score: 72,
    failure_probability: 0.38,
    temperature: 68.2,
    vibration: 3.9,
    current: 26.4,
    rpm: 1780,
    updated_at: new Date().toISOString(),
    operational_hours: 8340,
    model_number: 'GRUNDFOS CRN-95',
    last_maintenance: '2026-05-20',
    thresholds: {
      temp_warn: 65,
      temp_crit: 88,
      vib_warn: 3.2,
      vib_crit: 5.5,
      current_warn: 25,
      current_crit: 35,
      rpm_min: 1200,
      rpm_max: 2200,
    },
  },
  {
    id: 'MCH-103',
    name: 'Rotary Screw Air Compressor',
    type: 'Pneumatic Power Unit',
    location: 'Utility Room 3',
    status: 'healthy',
    health_score: 91,
    failure_probability: 0.09,
    temperature: 54.0,
    vibration: 1.8,
    current: 18.2,
    rpm: 2950,
    updated_at: new Date().toISOString(),
    operational_hours: 12450,
    model_number: 'ATLAS-COPCO GA37',
    last_maintenance: '2026-06-10',
    thresholds: {
      temp_warn: 75,
      temp_crit: 95,
      vib_warn: 3.8,
      vib_crit: 6.2,
      current_warn: 28,
      current_crit: 38,
      rpm_min: 1500,
      rpm_max: 3600,
    },
  },
  {
    id: 'MCH-104',
    name: '500-Ton Hydraulic Stamping Press',
    type: 'Forming & Stamping',
    location: 'Bay C - Heavy Fabrication',
    status: 'high',
    health_score: 58,
    failure_probability: 0.65,
    temperature: 78.4,
    vibration: 4.8,
    current: 38.6,
    rpm: 1150,
    updated_at: new Date().toISOString(),
    operational_hours: 6720,
    model_number: 'SCHULER HP-500',
    last_maintenance: '2026-04-12',
    thresholds: {
      temp_warn: 70,
      temp_crit: 90,
      vib_warn: 4.0,
      vib_crit: 6.5,
      current_warn: 35,
      current_crit: 48,
      rpm_min: 600,
      rpm_max: 1600,
    },
  },
  {
    id: 'MCH-105',
    name: '6-DOF Articulated Robotic Arm',
    type: 'Robotics & Automation',
    location: 'Bay A - Assembly Cell 4',
    status: 'healthy',
    health_score: 98,
    failure_probability: 0.02,
    temperature: 38.1,
    vibration: 0.9,
    current: 9.4,
    rpm: 2400,
    updated_at: new Date().toISOString(),
    operational_hours: 3180,
    model_number: 'KUKA KR-210 R2700',
    last_maintenance: '2026-08-01',
    thresholds: {
      temp_warn: 58,
      temp_crit: 78,
      vib_warn: 2.8,
      vib_crit: 4.8,
      current_warn: 18,
      current_crit: 26,
      rpm_min: 500,
      rpm_max: 3200,
    },
  },
  {
    id: 'MCH-106',
    name: 'High-Speed Logistics Conveyor Drive',
    type: 'Material Handling Motor',
    location: 'Warehouse Dock Line 2',
    status: 'critical',
    health_score: 34,
    failure_probability: 0.89,
    temperature: 89.5,
    vibration: 6.7,
    current: 44.2,
    rpm: 1420,
    updated_at: new Date().toISOString(),
    operational_hours: 15890,
    model_number: 'SEW-EURODRIVE MOVITRAC',
    last_maintenance: '2026-03-05',
    thresholds: {
      temp_warn: 68,
      temp_crit: 85,
      vib_warn: 3.5,
      vib_crit: 5.8,
      current_warn: 30,
      current_crit: 42,
      rpm_min: 900,
      rpm_max: 1800,
    },
  },
];

export const INITIAL_PREDICTIONS: Record<string, Prediction> = {
  'MCH-101': {
    id: 'PRED-101-01',
    machine_id: 'MCH-101',
    anomaly_score: 4,
    failure_probability: 0.04,
    risk_level: 'LOW',
    possible_cause: 'Nominal Operations',
    explanation: 'Harmonic vibration spectral density and stator temperatures are well within baseline tolerance limits. Hydrodynamic spindle bearings show healthy lubrication film.',
    recommendation: 'Continue standard preventive inspection schedule. No immediate action required.',
    confidence: 97.4,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    component_affected: 'Main Spindle Bearing',
    estimated_time_to_failure: '> 4,200 operating hours',
  },
  'MCH-102': {
    id: 'PRED-102-01',
    machine_id: 'MCH-102',
    anomaly_score: 42,
    failure_probability: 0.38,
    risk_level: 'MEDIUM',
    possible_cause: 'Mild Impeller Cavitation & Bearing Cage Degradation',
    explanation: 'AI frequency decomposition detected high-frequency modulation (2.8x shaft rate) alongside a 12°C thermal rise in the non-drive end bearing housing, indicating cavitation onset.',
    recommendation: 'Check inlet suction pressure, purge fluid line to eliminate vapor bubbles, and re-grease outboard bearing within 72 hours.',
    confidence: 91.8,
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    component_affected: 'Suction Impeller & Outboard Bearing',
    estimated_time_to_failure: '160 - 240 operating hours',
  },
  'MCH-103': {
    id: 'PRED-103-01',
    machine_id: 'MCH-103',
    anomaly_score: 9,
    failure_probability: 0.09,
    risk_level: 'LOW',
    possible_cause: 'Normal Compression Load Cycle',
    explanation: 'Thermal signatures reflect expected duty cycle fluctuations. Screw rotor clearance is stable with zero metal-to-metal acoustic emissions.',
    recommendation: 'Inspect oil filter differential pressure during next scheduled 500h round.',
    confidence: 95.0,
    created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    component_affected: 'Male/Female Screw Rotors',
    estimated_time_to_failure: '> 3,500 operating hours',
  },
  'MCH-104': {
    id: 'PRED-104-01',
    machine_id: 'MCH-104',
    anomaly_score: 68,
    failure_probability: 0.65,
    risk_level: 'HIGH',
    possible_cause: 'Hydraulic Valve Spool Stiction & Main Seal Leakage',
    explanation: 'Recurrent peak current draws (+28% above baseline) during return strokes combined with localized hydraulic manifold temperature of 78.4°C indicate hydraulic fluid blow-by and valve resistance.',
    recommendation: 'Perform immediate hydraulic relief valve calibration, inspect cylinder piston rod seals for particulate contamination, and replace hydraulic return filter.',
    confidence: 89.2,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    component_affected: 'Proportional Directional Valve & Piston Seals',
    estimated_time_to_failure: '36 - 60 operating hours',
  },
  'MCH-105': {
    id: 'PRED-105-01',
    machine_id: 'MCH-105',
    anomaly_score: 2,
    failure_probability: 0.02,
    risk_level: 'LOW',
    possible_cause: 'Optimal Kinematic Balance',
    explanation: 'Harmonic drives on all 6 axes report zero backlash deviation. Thermal dissipation across servomotor heat sinks is optimal.',
    recommendation: 'Maintain current path trajectory profiles. Calibrate tool center point next month.',
    confidence: 98.9,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    component_affected: 'Axis 3 Harmonic Drive',
    estimated_time_to_failure: '> 5,000 operating hours',
  },
  'MCH-106': {
    id: 'PRED-106-01',
    machine_id: 'MCH-106',
    anomaly_score: 92,
    failure_probability: 0.89,
    risk_level: 'CRITICAL',
    possible_cause: 'Severe Rotor Misalignment & Drive End Bearing Spalling',
    explanation: 'Vibration amplitude crossed ISO 10816-3 Class IV Critical threshold (6.7 mm/s) with extreme 1X/2X shaft harmonics. Motor winding temperature at 89.5°C with severe phase current imbalance (44.2A). Imminent catastrophic lockup risk.',
    recommendation: 'INITIATE CONTROLLED SHUTDOWN IMMEDIATELY. Lockout/Tagout machine, replace DE ball bearing assembly, perform laser shaft realignment, and inspect gearbox input coupler.',
    confidence: 96.7,
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    component_affected: 'Drive End Bearing & Flexible Shaft Coupler',
    estimated_time_to_failure: '< 6 operating hours (CRITICAL)',
  },
};

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-901',
    machine_id: 'MCH-106',
    machine_name: 'High-Speed Logistics Conveyor Drive',
    severity: 'CRITICAL',
    title: 'Severe Vibration & Motor Thermal Runaway',
    message: 'Vibration reached 6.7 mm/s (critical limit: 5.8 mm/s). Winding temp spiked to 89.5°C with 44.2A current overload.',
    status: 'ACTIVE',
    failure_probability: 0.89,
    recommended_action: 'Emergency shutdown. Disconnect load and dispatch mechanical specialist for bearing overhaul.',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    acknowledged_at: null,
    resolved_at: null,
  },
  {
    id: 'ALT-902',
    machine_id: 'MCH-104',
    machine_name: '500-Ton Hydraulic Stamping Press',
    severity: 'HIGH',
    title: 'Hydraulic Manifold Overheating & Pressure Drop',
    message: 'Current surge detected during high-load compression cycle. Oil reservoir temp exceeds 78°C with intermittent valve lag.',
    status: 'ACTIVE',
    failure_probability: 0.65,
    recommended_action: 'Inspect proportional flow valve and replace hydraulic filter cartridge.',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    acknowledged_at: null,
    resolved_at: null,
  },
  {
    id: 'ALT-903',
    machine_id: 'MCH-102',
    machine_name: 'High-Pressure Centrifugal Pump',
    severity: 'WARNING',
    title: 'Impeller Cavitation Vibration Signature',
    message: 'Vibration harmonics show elevated 3.9 mm/s. AI model predicts 38% probability of suction side cavitation damage.',
    status: 'ACKNOWLEDGED',
    failure_probability: 0.38,
    recommended_action: 'Verify pump intake line pressure and inspect check valves.',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    acknowledged_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    resolved_at: null,
  },
  {
    id: 'ALT-904',
    machine_id: 'MCH-103',
    machine_name: 'Rotary Screw Air Compressor',
    severity: 'INFO',
    title: '5,000h Routine Filter Inspection Due',
    message: 'Compressor performance nominal. Scheduled AI preventive maintenance reminder triggered.',
    status: 'RESOLVED',
    failure_probability: 0.09,
    recommended_action: 'Inspect air intake filter and moisture drain trap.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    acknowledged_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
];

export const INITIAL_MAINTENANCE: Maintenance[] = [
  {
    id: 'WO-8801',
    machine_id: 'MCH-106',
    machine_name: 'High-Speed Logistics Conveyor Drive',
    detected_issue: 'Critical Bearing Spalling & Shaft Misalignment',
    possible_cause: 'Drive End Bearing mechanical wear + flexible coupling fatigue',
    priority: 'CRITICAL',
    recommendation: 'Replace DE 6208 ball bearing, re-align motor-to-gearbox axis using optical laser kit, refill synthetic polyurea grease.',
    status: 'PENDING',
    assigned_to: 'Marcus Vance (Senior Mech Tech)',
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    completed_at: null,
    technician_notes: 'Urgent: Part requested from Central Tool Crib #4.',
  },
  {
    id: 'WO-8802',
    machine_id: 'MCH-104',
    machine_name: '500-Ton Hydraulic Stamping Press',
    detected_issue: 'Hydraulic Spool Stiction & Seal Bypass',
    possible_cause: 'Particulate contamination in proportional valve manifold',
    priority: 'HIGH',
    recommendation: 'Flush valve block with ISO VG 46 mineral oil, replace 10-micron return filter, calibrate servo amplifier.',
    status: 'IN_PROGRESS',
    assigned_to: 'Elena Rostova (Fluid Power Specialist)',
    created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    completed_at: null,
    technician_notes: 'Flushing in progress. Fluid clarity testing ongoing.',
  },
  {
    id: 'WO-8803',
    machine_id: 'MCH-102',
    machine_name: 'High-Pressure Centrifugal Pump',
    detected_issue: 'Impeller Cavitation & Suction Imbalance',
    possible_cause: 'Inlet strainer partial clogging',
    priority: 'MEDIUM',
    recommendation: 'Clean suction pipe Y-strainer and inspect impeller vanes for pitting.',
    status: 'PENDING',
    assigned_to: 'Dave Miller (Plant Mechanic)',
    created_at: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
    completed_at: null,
    technician_notes: 'Scheduled for next maintenance window at shift change.',
  },
  {
    id: 'WO-8799',
    machine_id: 'MCH-101',
    machine_name: '5-Axis CNC Milling Center',
    detected_issue: 'Spindle Chiller Fluid Low',
    possible_cause: 'Evaporative loss over 90 days',
    priority: 'LOW',
    recommendation: 'Top off closed-loop glycol chiller reservoir and inspect radiator fins.',
    status: 'COMPLETED',
    assigned_to: 'Marcus Vance (Senior Mech Tech)',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    technician_notes: 'Added 1.5L distilled glycol blend. Temperature delta verified within 0.3°C.',
  },
];

export function generateHistoricalTelemetry(machineId: string, hours = 24, pointsCount = 30): TelemetryPoint[] {
  const machine = INITIAL_MACHINES.find(m => m.id === machineId) || INITIAL_MACHINES[0];
  const points: TelemetryPoint[] = [];
  const now = Date.now();
  const intervalMs = (hours * 3600 * 1000) / pointsCount;

  const baseTemp = machine.temperature;
  const baseVib = machine.vibration;
  const baseCurr = machine.current;
  const baseRpm = machine.rpm;
  const baseHealth = machine.health_score;
  const baseRisk = machine.failure_probability * 100;

  for (let i = pointsCount - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * intervalMs);
    const progress = 1 - (i / pointsCount); // 0 at start, 1 at present

    // Trend simulation: if machine is high or critical, trend upwards towards the end
    const trendFactor = machine.status === 'critical' 
      ? Math.pow(progress, 2) * 1.5 
      : machine.status === 'high' 
      ? Math.pow(progress, 1.5) * 1.2
      : machine.status === 'warning'
      ? progress * 0.8
      : 0;

    const noise = () => (Math.random() - 0.5);

    const temp = Math.max(25, Number((baseTemp - (1 - progress) * (trendFactor * 15) + noise() * 2.5).toFixed(1)));
    const vib = Math.max(0.2, Number((baseVib - (1 - progress) * (trendFactor * 2.8) + noise() * 0.4).toFixed(2)));
    const curr = Math.max(2, Number((baseCurr - (1 - progress) * (trendFactor * 12) + noise() * 1.8).toFixed(1)));
    const rpm = Math.round(baseRpm + noise() * 45 - (trendFactor * 80));

    // Health degrades if trendFactor is high
    const health = Math.min(100, Math.max(15, Math.round(baseHealth + (1 - progress) * (trendFactor * 35) + noise() * 3)));
    const failureRisk = Math.min(99, Math.max(1, Math.round(baseRisk - (1 - progress) * (trendFactor * 40) + noise() * 2)));

    const hoursAgo = Math.round((i * intervalMs) / (3600 * 1000));
    const timeLabel = hoursAgo === 0 
      ? 'Now' 
      : hoursAgo < 24 
      ? `${hoursAgo}h ago`
      : `${Math.round(hoursAgo / 24)}d ago`;

    points.push({
      timestamp: timestamp.toISOString(),
      timeLabel,
      temperature: temp,
      vibration: vib,
      current: curr,
      rpm: rpm,
      health_score: health,
      failure_probability: failureRisk,
      anomaly_score: Math.round(failureRisk * 1.05),
    });
  }

  return points;
}

// AI Anomaly Physics Engine for Live Simulation
export function evaluateMachinePhysicsAI(
  machine: Machine,
  temp: number,
  vib: number,
  curr: number,
  rpm: number
): {
  health_score: number;
  anomaly_score: number;
  failure_probability: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'healthy' | 'warning' | 'high' | 'critical';
  possible_cause: string;
  explanation: string;
  recommendation: string;
  confidence: number;
} {
  const t = machine.thresholds || {
    temp_warn: 65,
    temp_crit: 85,
    vib_warn: 3.5,
    vib_crit: 6.0,
    current_warn: 25,
    current_crit: 35,
    rpm_min: 1000,
    rpm_max: 3600,
  };

  // Severity index calculation
  const tempRatio = Math.max(0, (temp - 35) / (t.temp_crit - 35));
  const vibRatio = Math.max(0, vib / t.vib_crit);
  const currRatio = Math.max(0, curr / t.current_crit);
  
  // Weighted anomaly index (0 to 1+)
  const anomalyIndex = (tempRatio * 0.35) + (vibRatio * 0.40) + (currRatio * 0.25);
  
  let failure_probability = Math.min(0.99, Math.max(0.01, anomalyIndex * 0.85));
  let anomaly_score = Math.min(100, Math.max(1, Math.round(anomalyIndex * 88)));
  let health_score = Math.max(5, Math.min(100, Math.round(100 - anomalyIndex * 80)));

  let risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let status: 'healthy' | 'warning' | 'high' | 'critical' = 'healthy';
  let possible_cause = 'Nominal Physical Operational State';
  let explanation = 'All telemetry variables (temperature, vibration harmonics, current draw, and rotational speed) are securely within standard operating envelope.';
  let recommendation = 'Standard preventive maintenance schedule is in effect. Continue live sensor monitoring.';
  let confidence = 96.5;

  if (temp >= t.temp_crit || vib >= t.vib_crit || curr >= t.current_crit || failure_probability >= 0.75) {
    status = 'critical';
    risk_level = 'CRITICAL';
    failure_probability = Math.max(0.82, failure_probability);
    anomaly_score = Math.max(88, anomaly_score);
    health_score = Math.min(35, health_score);
    confidence = 97.8;

    if (vib >= t.vib_crit && temp >= t.temp_crit) {
      possible_cause = 'Catastrophic Bearing Cage Seizure & Severe Rotor Rub';
      explanation = `Vibration level (${vib.toFixed(1)} mm/s) crossed critical safety threshold (${t.vib_crit} mm/s) with simultaneous thermal spike (${temp.toFixed(1)}°C). Acoustic energy suggests metal-on-metal friction in drive-end bearing race.`;
      recommendation = 'EMERGENCY SHUTDOWN REQUIRED. Initiate Lockout/Tagout protocol, halt production line, and replace bearing assembly before restarting.';
    } else if (curr >= t.current_crit) {
      possible_cause = 'Stator Phase Short-Circuit / Severe Mechanical Overload';
      explanation = `Current draw (${curr.toFixed(1)} A) exceeded rated overload threshold (${t.current_crit} A). Motor winding thermal dissipation is failing rapidly.`;
      recommendation = 'Isolate electrical feed, check phase-to-phase insulation resistance with megohmmeter, and inspect driven load for physical jamming.';
    } else {
      possible_cause = 'Critical Dynamic Unbalance & Thermal Runaway';
      explanation = `Critical multi-variable failure signature detected: Vibration (${vib.toFixed(1)} mm/s), Temp (${temp.toFixed(1)}°C), Current (${curr.toFixed(1)} A). System degradation is exponential.`;
      recommendation = 'Shut down machine within 15 minutes. Dispatch senior mechanical specialist for comprehensive drive rebuild.';
    }
  } else if (temp >= t.temp_warn || vib >= t.vib_warn || curr >= t.current_warn || failure_probability >= 0.45) {
    status = 'high';
    risk_level = 'HIGH';
    failure_probability = Math.max(0.50, failure_probability);
    anomaly_score = Math.max(60, anomaly_score);
    health_score = Math.min(62, health_score);
    confidence = 92.4;

    possible_cause = 'Accelerated Mechanical Wear & Impending Component Fatigue';
    explanation = `Telemetry indicates elevated stress: Vibration is at ${vib.toFixed(1)} mm/s (warning: ${t.vib_warn}), Temperature is at ${temp.toFixed(1)}°C. Machine is operating outside optimal efficiency envelope.`;
    recommendation = 'Schedule prioritized maintenance inspection within 24-48 hours. Check alignment, re-lubricate bearings, and verify balance.';
  } else if (temp >= t.temp_warn * 0.85 || vib >= t.vib_warn * 0.85 || curr >= t.current_warn * 0.85 || failure_probability >= 0.20) {
    status = 'warning';
    risk_level = 'MEDIUM';
    failure_probability = Math.max(0.22, failure_probability);
    anomaly_score = Math.max(35, anomaly_score);
    health_score = Math.min(80, health_score);
    confidence = 88.0;

    possible_cause = 'Subtle Harmonic Drift & Initial Lubrication Degradation';
    explanation = `Minor telemetry variance detected: Temperature (${temp.toFixed(1)}°C) and Vibration (${vib.toFixed(1)} mm/s) exhibit gradual drift above baseline.`;
    recommendation = 'Monitor vibration spectral trends during next shift. Inspect oil level and intake filters.';
  }

  return {
    health_score,
    anomaly_score,
    failure_probability: Number(failure_probability.toFixed(3)),
    risk_level,
    status,
    possible_cause,
    explanation,
    recommendation,
    confidence: Number(confidence.toFixed(1)),
  };
}
