import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Play, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  ShieldAlert, 
  Thermometer, 
  Waves, 
  Zap, 
  RotateCw,
  Cpu,
  ArrowRight,
  TrendingUp,
  Activity,
  Check
} from 'lucide-react';
import { Machine, Prediction, Alert } from '../../types';
import { useFactoryData } from '../../hooks/useFactoryData';
import { apiService } from '../../services/api';
import { cn, formatNumber, formatPercentage, getStatusTheme, getRiskLevelBadge } from '../../lib/utils';
import { evaluateMachinePhysicsAI } from '../../services/mockData';

interface SimulatorControlPanelProps {
  selectedMachineId?: string;
  onNavigateToMachine?: (id: string) => void;
  onNavigateToAlerts?: () => void;
}

export const SimulatorControlPanel: React.FC<SimulatorControlPanelProps> = ({
  selectedMachineId,
  onNavigateToMachine,
  onNavigateToAlerts,
}) => {
  const { machines, injectSimulatedTelemetry, resetMachine, getPrediction, alerts } = useFactoryData();
  const [activeMachineId, setActiveMachineId] = useState<string>(selectedMachineId || machines[0]?.id || 'MCH-101');

  const currentMachine = machines.find(m => m.id === activeMachineId) || machines[0];

  // Sliders Telemetry State
  const [temperature, setTemperature] = useState<number>(currentMachine?.temperature || 42);
  const [vibration, setVibration] = useState<number>(currentMachine?.vibration || 1.2);
  const [currentVal, setCurrentVal] = useState<number>(currentMachine?.current || 14.5);
  const [rpm, setRpm] = useState<number>(currentMachine?.rpm || 3000);

  // Live Simulated State Preview
  const [simPrediction, setSimPrediction] = useState<Prediction | null>(null);
  const [simAlert, setSimAlert] = useState<Alert | null>(null);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);
  const [injectionSuccess, setInjectionSuccess] = useState<boolean>(false);

  // Automated Hackathon Demo Sequence State
  const [isAutoSequenceRunning, setIsAutoSequenceRunning] = useState<boolean>(false);
  const [sequenceStep, setSequenceStep] = useState<number>(0);

  // Sync sliders when machine selector changes
  useEffect(() => {
    if (currentMachine) {
      setTemperature(currentMachine.temperature);
      setVibration(currentMachine.vibration);
      setCurrentVal(currentMachine.current);
      setRpm(currentMachine.rpm);
    }
  }, [activeMachineId, currentMachine?.id]);

  // Real-time Physics AI calculation for preview
  const localAI = currentMachine ? evaluateMachinePhysicsAI(currentMachine, temperature, vibration, currentVal, rpm) : null;
  const [backendPred, setBackendPred] = useState<Prediction | null>(null);

  // Debounced query to backend POST /api/simulator/predict when sliders move
  useEffect(() => {
    let isCurrent = true;
    const timer = setTimeout(async () => {
      try {
        const pred = await apiService.predictSimulator({
          machine_id: activeMachineId,
          temperature,
          vibration,
          current: currentVal,
          rpm,
        });
        if (isCurrent && pred) {
          setBackendPred(pred);
        }
      } catch {
        // Fallback to local
      }
    }, 150);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [activeMachineId, temperature, vibration, currentVal, rpm]);

  const liveAI = backendPred ? {
    status: backendPred.risk_level === 'CRITICAL' ? 'critical' as const :
            backendPred.risk_level === 'HIGH' ? 'high' as const :
            backendPred.risk_level === 'MEDIUM' ? 'warning' as const : 'healthy' as const,
    health_score: localAI ? localAI.health_score : 85,
    anomaly_score: backendPred.anomaly_score,
    failure_probability: backendPred.failure_probability,
    risk_level: backendPred.risk_level,
    possible_cause: backendPred.possible_cause,
    explanation: backendPred.explanation,
    recommendation: backendPred.recommendation,
    confidence: backendPred.confidence,
  } : localAI;

  const theme = liveAI ? getStatusTheme(liveAI.status) : getStatusTheme('healthy');

  // Trigger Injection into Global Engine / Backend
  const handleApplyTelemetry = async (override?: { temp?: number; vib?: number; curr?: number; speed?: number; scenario?: string }) => {
    setIsInjecting(true);
    const targetTemp = override?.temp ?? temperature;
    const targetVib = override?.vib ?? vibration;
    const targetCurr = override?.curr ?? currentVal;
    const targetRpm = override?.speed ?? rpm;

    try {
      const res = await injectSimulatedTelemetry(activeMachineId, {
        temperature: targetTemp,
        vibration: targetVib,
        current: targetCurr,
        rpm: targetRpm,
        scenarioName: override?.scenario,
      });

      setSimPrediction(res.prediction);
      if (res.alert) setSimAlert(res.alert);
      setInjectionSuccess(true);
      setTimeout(() => setInjectionSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInjecting(false);
    }
  };

  // Preset Scenario Handlers
  const handlePresetNormal = () => {
    const t = 42.0;
    const v = 1.2;
    const c = 14.0;
    const r = currentMachine.thresholds ? (currentMachine.thresholds.rpm_min + currentMachine.thresholds.rpm_max) / 2 : 3000;
    setTemperature(t);
    setVibration(v);
    setCurrentVal(c);
    setRpm(r);
    handleApplyTelemetry({ temp: t, vib: v, curr: c, speed: r, scenario: 'Normal Operational State' });
    resetMachine(activeMachineId);
  };

  const handlePresetWarning = () => {
    const warnTemp = (currentMachine.thresholds?.temp_warn || 65) + 2;
    const warnVib = (currentMachine.thresholds?.vib_warn || 3.5) + 0.3;
    const warnCurr = (currentMachine.thresholds?.current_warn || 24) + 1.5;
    const warnRpm = Math.round(rpm * 0.95);

    setTemperature(warnTemp);
    setVibration(warnVib);
    setCurrentVal(warnCurr);
    setRpm(warnRpm);
    handleApplyTelemetry({ temp: warnTemp, vib: warnVib, curr: warnCurr, speed: warnRpm, scenario: 'Warning - Bearing Wear Onset' });
  };

  const handlePresetCritical = () => {
    const critTemp = (currentMachine.thresholds?.temp_crit || 85) + 6.5;
    const critVib = (currentMachine.thresholds?.vib_crit || 6.0) + 1.8;
    const critCurr = (currentMachine.thresholds?.current_crit || 35) + 10.2;
    const critRpm = Math.round(rpm * 0.82);

    setTemperature(critTemp);
    setVibration(critVib);
    setCurrentVal(critCurr);
    setRpm(critRpm);
    handleApplyTelemetry({ temp: critTemp, vib: critVib, curr: critCurr, speed: critRpm, scenario: 'Critical - Bearing Seizure & Thermal Runaway' });
  };

  // 1-Click Automated Dramatic Sequence
  const handleStartAutoDemoSequence = () => {
    if (isAutoSequenceRunning) return;
    setIsAutoSequenceRunning(true);
    setSequenceStep(1);

    // Step 1: Normal
    handlePresetNormal();

    // Step 2: Rising Telemetry / Warning after 2.5s
    setTimeout(() => {
      setSequenceStep(2);
      handlePresetWarning();
    }, 2800);

    // Step 3: Critical Anomaly Spike after 5.8s
    setTimeout(() => {
      setSequenceStep(3);
      handlePresetCritical();
    }, 6000);

    // Step 4: AI Diagnosis Locked after 9s
    setTimeout(() => {
      setSequenceStep(4);
      setIsAutoSequenceRunning(false);
    }, 9000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Scenario Engine */}
      <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-950 p-5 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-industrial text-base font-bold uppercase tracking-wider text-slate-100">
                  AIoT Machine Anomaly & Failure Injection Simulator
                </h2>
                <span className="text-[10px] font-mono-data px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  HACKATHON DEMO
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Inject custom physical telemetry parameters (Temperature, Vibration harmonics, Phase current, RPM) to trigger real-time AI anomaly detection, risk escalation, and automated emergency alarm creation.
              </p>
            </div>
          </div>

          {/* 1-Click Automated Dramatic Presentation Mode */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleStartAutoDemoSequence}
              disabled={isAutoSequenceRunning}
              className={cn(
                "px-4 py-2.5 rounded-xl font-industrial font-bold uppercase tracking-wider text-xs flex items-center space-x-2 transition-all border shadow-lg",
                isAutoSequenceRunning
                  ? "bg-amber-600 text-white border-amber-400 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                  : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              )}
            >
              <Play className="w-4 h-4" />
              <span>{isAutoSequenceRunning ? `RUNNING STEP ${sequenceStep}/4...` : 'START 4-STAGE DEMO SEQUENCE'}</span>
            </button>
          </div>

        </div>

        {/* 4-Stage Visual Progress Bar */}
        <div className="mt-4 pt-3 border-t border-amber-500/20 grid grid-cols-4 gap-2 text-center text-xs font-mono-data">
          {[
            { step: 1, label: '1. NORMAL BASELINE', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30' },
            { step: 2, label: '2. SENSOR DRIFT (WARN)', color: 'text-amber-400 border-amber-500/40 bg-amber-950/30' },
            { step: 3, label: '3. CRITICAL FAILURE SPIKE', color: 'text-rose-400 border-rose-500/40 bg-rose-950/30' },
            { step: 4, label: '4. AI DIAGNOSIS & ALARM', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30' },
          ].map((s) => (
            <div
              key={s.step}
              className={cn(
                "p-2 rounded-lg border text-[11px] font-bold transition-all",
                sequenceStep === s.step
                  ? `${s.color} ring-2 ring-amber-400 shadow-md animate-pulse`
                  : "bg-slate-950/60 border-slate-800 text-slate-500"
              )}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Controls & Sliders, Right Live AI Diagnostic Reaction */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Machine Selector & Precision Sensor Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            
            {/* Target Machine Selector */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <label className="text-xs font-industrial uppercase font-bold text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Target Industrial Machine:
              </label>

              <select
                value={activeMachineId}
                onChange={(e) => setActiveMachineId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono-data font-bold focus:outline-none focus:border-cyan-500"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} - {m.name} ({m.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Demo Scenario Buttons */}
            <div className="mb-6">
              <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 tracking-wider block mb-2">
                1-CLICK INJECTION PRESETS
              </span>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={handlePresetNormal}
                  className="p-2.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-industrial font-bold uppercase tracking-wider flex flex-col items-center justify-center text-center transition-all shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 mb-1 text-emerald-400" />
                  <span>Normal State</span>
                  <span className="text-[9px] text-emerald-400 font-mono-data font-normal">&lt; 5% Risk</span>
                </button>

                <button
                  onClick={handlePresetWarning}
                  className="p-2.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs font-industrial font-bold uppercase tracking-wider flex flex-col items-center justify-center text-center transition-all shadow-sm"
                >
                  <AlertTriangle className="w-4 h-4 mb-1 text-amber-400" />
                  <span>Inject Warning</span>
                  <span className="text-[9px] text-amber-400 font-mono-data font-normal">~45% Risk</span>
                </button>

                <button
                  onClick={handlePresetCritical}
                  className="p-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/60 text-rose-300 text-xs font-industrial font-bold uppercase tracking-wider flex flex-col items-center justify-center text-center transition-all shadow-[0_0_15px_rgba(244,63,94,0.25)]"
                >
                  <AlertOctagon className="w-4 h-4 mb-1 text-rose-400 animate-pulse" />
                  <span>Inject Critical</span>
                  <span className="text-[9px] text-rose-400 font-mono-data font-normal">&gt; 85% Risk</span>
                </button>
              </div>
            </div>

            {/* Precision Parameter Sliders */}
            <div className="space-y-4">
              
              {/* Temperature Slider */}
              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-industrial uppercase font-bold text-slate-200">
                      Temperature
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-data">
                      (Crit: {currentMachine?.thresholds?.temp_crit || 85}°C)
                    </span>
                  </div>
                  <span className={cn(
                    "font-mono-data text-sm font-bold",
                    temperature >= (currentMachine?.thresholds?.temp_crit || 85) ? "text-rose-400" :
                    temperature >= (currentMachine?.thresholds?.temp_warn || 65) ? "text-amber-400" : "text-slate-200"
                  )}>
                    {formatNumber(temperature)} °C
                  </span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="120"
                  step="0.5"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[9px] font-mono-data text-slate-500 mt-1">
                  <span>25°C Nominal</span>
                  <span>65°C Warn</span>
                  <span>85°C Crit</span>
                  <span>120°C Max</span>
                </div>
              </div>

              {/* Vibration Slider */}
              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <Waves className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-industrial uppercase font-bold text-slate-200">
                      Vibration Amplitude (RMS)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-data">
                      (Crit: {currentMachine?.thresholds?.vib_crit || 6.0} mm/s)
                    </span>
                  </div>
                  <span className={cn(
                    "font-mono-data text-sm font-bold",
                    vibration >= (currentMachine?.thresholds?.vib_crit || 6.0) ? "text-rose-400" :
                    vibration >= (currentMachine?.thresholds?.vib_warn || 3.5) ? "text-amber-400" : "text-slate-200"
                  )}>
                    {formatNumber(vibration, 2)} mm/s
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="15.0"
                  step="0.1"
                  value={vibration}
                  onChange={(e) => setVibration(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <div className="flex justify-between text-[9px] font-mono-data text-slate-500 mt-1">
                  <span>0.5 mm/s Smooth</span>
                  <span>3.5 mm/s Warn</span>
                  <span>6.0 mm/s Critical</span>
                  <span>15.0 mm/s Danger</span>
                </div>
              </div>

              {/* Current Slider */}
              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-industrial uppercase font-bold text-slate-200">
                      Phase Current Draw
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-data">
                      (Crit: {currentMachine?.thresholds?.current_crit || 35} A)
                    </span>
                  </div>
                  <span className={cn(
                    "font-mono-data text-sm font-bold",
                    currentVal >= (currentMachine?.thresholds?.current_crit || 35) ? "text-rose-400" :
                    currentVal >= (currentMachine?.thresholds?.current_warn || 25) ? "text-amber-400" : "text-slate-200"
                  )}>
                    {formatNumber(currentVal)} A
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="0.5"
                  value={currentVal}
                  onChange={(e) => setCurrentVal(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[9px] font-mono-data text-slate-500 mt-1">
                  <span>5 A Idle</span>
                  <span>25 A Warn</span>
                  <span>35 A Trip</span>
                  <span>60 A Overload</span>
                </div>
              </div>

              {/* RPM Slider */}
              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <RotateCw className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-industrial uppercase font-bold text-slate-200">
                      Rotational Speed (RPM)
                    </span>
                  </div>
                  <span className="font-mono-data text-sm font-bold text-slate-200">
                    {Math.round(rpm)} RPM
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="4500"
                  step="25"
                  value={rpm}
                  onChange={(e) => setRpm(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[9px] font-mono-data text-slate-500 mt-1">
                  <span>500 RPM Low</span>
                  <span>2500 RPM Rating</span>
                  <span>4500 RPM High</span>
                </div>
              </div>

            </div>

            {/* Apply Injection Button */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => resetMachine(activeMachineId)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-industrial uppercase flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Baseline</span>
              </button>

              <button
                onClick={() => handleApplyTelemetry()}
                disabled={isInjecting}
                className={cn(
                  "px-5 py-2 rounded-lg font-industrial font-bold uppercase tracking-wider text-xs flex items-center space-x-2 transition-all border",
                  liveAI?.status === 'critical'
                    ? "bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                    : liveAI?.status === 'warning'
                    ? "bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400"
                )}
              >
                {injectionSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>APPLIED & SYNCED!</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    <span>{isInjecting ? 'INJECTING...' : 'APPLY TELEMETRY INJECTION'}</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

        {/* Right Column: Real-Time Dynamic AI Diagnostic & Alarm Output (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className={cn(
            "rounded-xl border p-5 transition-all duration-500 backdrop-blur-sm",
            liveAI?.status === 'critical'
              ? "bg-rose-950/40 border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/40"
              : liveAI?.status === 'high'
              ? "bg-orange-950/30 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
              : liveAI?.status === 'warning'
              ? "bg-amber-950/30 border-amber-500/40"
              : "bg-slate-900/60 border-slate-800"
          )}>
            
            {/* Header / Dynamic State Level Indicator */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="font-industrial text-xs font-bold uppercase tracking-wider text-slate-100">
                  Real-Time AI Response Matrix
                </h3>
              </div>

              <div className={cn("px-2.5 py-0.5 rounded-full text-xs font-industrial font-bold uppercase border", theme.badge)}>
                <span className={cn("w-1.5 h-1.5 rounded-full inline-block mr-1.5", theme.dot)} />
                {theme.label}
              </div>
            </div>

            {/* Health vs Anomaly vs Failure Gauges */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 block mb-1">
                  PREDICTED HEALTH SCORE
                </span>
                <span className={cn("text-2xl font-mono-data font-bold", theme.text)}>
                  {liveAI?.health_score}%
                </span>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-300", 
                      (liveAI?.health_score || 0) >= 80 ? "bg-emerald-500" :
                      (liveAI?.health_score || 0) >= 60 ? "bg-amber-500" : "bg-rose-500"
                    )}
                    style={{ width: `${liveAI?.health_score || 0}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 block mb-1">
                  FAILURE PROBABILITY
                </span>
                <span className={cn(
                  "text-2xl font-mono-data font-bold",
                  (liveAI?.failure_probability || 0) >= 0.7 ? "text-rose-400 font-extrabold" :
                  (liveAI?.failure_probability || 0) >= 0.35 ? "text-amber-400" : "text-emerald-400"
                )}>
                  {formatPercentage(liveAI?.failure_probability)}
                </span>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-300", 
                      (liveAI?.failure_probability || 0) >= 0.7 ? "bg-rose-500" :
                      (liveAI?.failure_probability || 0) >= 0.35 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(100, (liveAI?.failure_probability || 0) * 100)}%` }}
                  />
                </div>
              </div>

            </div>

            {/* AI Diagnosis Cause */}
            <div className="mb-3">
              <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 tracking-wider block mb-1">
                AI ROOT CAUSE DIAGNOSIS:
              </span>
              <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-xs font-bold text-slate-100 flex items-start space-x-2">
                <AlertTriangle className={cn("w-4 h-4 flex-shrink-0 mt-0.5", theme.text)} />
                <span>{liveAI?.possible_cause}</span>
              </div>
            </div>

            {/* AI Explanation */}
            <div className="mb-3">
              <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 tracking-wider block mb-1">
                AI EXPLANATION:
              </span>
              <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
                {liveAI?.explanation}
              </p>
            </div>

            {/* Maintenance Recommendation */}
            <div className="mb-4">
              <span className="text-[10px] font-industrial uppercase font-bold text-cyan-400 tracking-wider block mb-1">
                ACTIONABLE RECOMMENDATION:
              </span>
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-200 leading-relaxed font-medium">
                {liveAI?.recommendation}
              </div>
            </div>

            {/* Auto Alert Generated Banner */}
            {liveAI?.status === 'critical' && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500 text-xs text-rose-200 flex items-center justify-between mb-3 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="font-bold font-industrial uppercase">EMERGENCY ALARM ACTIVE IN SYSTEM</span>
                </div>
                {onNavigateToAlerts && (
                  <button
                    onClick={onNavigateToAlerts}
                    className="px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-bold text-[10px] uppercase font-industrial"
                  >
                    View Alert
                  </button>
                )}
              </div>
            )}

            {/* Navigation links */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono-data text-[11px]">
                Confidence: <strong className="text-cyan-300">{liveAI?.confidence}%</strong>
              </span>

              {onNavigateToMachine && (
                <button
                  onClick={() => onNavigateToMachine(activeMachineId)}
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                >
                  <span>Open Full Machine Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
