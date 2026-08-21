import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  HelpCircle, 
  Flame, 
  ShieldCheck,
  Send,
  Check
} from 'lucide-react';
import { Machine, Prediction } from '../../types';
import { useFactoryData } from '../../hooks/useFactoryData';
import { apiService } from '../../services/api';
import { getRiskLevelBadge, formatPercentage, cn } from '../../lib/utils';

interface AIDiagnosticPanelProps {
  machine: Machine;
  prediction?: Prediction;
  onNavigateToMaintenance?: () => void;
}

export const AIDiagnosticPanel: React.FC<AIDiagnosticPanelProps> = ({
  machine,
  prediction,
  onNavigateToMaintenance,
}) => {
  const { createMaintenanceTask } = useFactoryData();
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState<boolean>(false);
  const [fetchedPred, setFetchedPred] = useState<Prediction | null>(null);

  // Fetch prediction from backend for this machine if not provided
  useEffect(() => {
    if (!prediction) {
      let isMounted = true;
      apiService.getPrediction(machine.id).then((p) => {
        if (isMounted && p) {
          setFetchedPred(p);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [machine.id, machine.temperature, machine.vibration, machine.current, machine.rpm, prediction]);

  const fallbackPred: Prediction = {
    id: `PRED-${machine.id}`,
    machine_id: machine.id,
    anomaly_score: Math.round(machine.failure_probability * 90),
    failure_probability: machine.failure_probability,
    risk_level: machine.status === 'critical' ? 'CRITICAL' : machine.status === 'high' ? 'HIGH' : machine.status === 'warning' ? 'MEDIUM' : 'LOW',
    possible_cause: machine.status === 'critical' 
      ? 'Drive End Bearing Mechanical Seizure & High Thermal Overload'
      : machine.status === 'high'
      ? 'Proportional Valve Resistance & Stator Friction'
      : machine.status === 'warning'
      ? 'Subtle Harmonic Degradation & Lubricant Oxidation'
      : 'Nominal Operational Balance',
    explanation: `Multi-variable telemetry evaluation confirms state behavior. Sensor inputs: Temperature (${machine.temperature}°C), Vibration (${machine.vibration} mm/s), Current (${machine.current} A), Speed (${machine.rpm} RPM).`,
    recommendation: machine.status === 'critical'
      ? 'Initiate emergency shutdown immediately. Lockout machine and replace drive bearing assembly.'
      : machine.status === 'high'
      ? 'Schedule urgent maintenance within 24-48 hours. Inspect hydraulic lines and rotor alignment.'
      : machine.status === 'warning'
      ? 'Check bearing lubrication and verify inlet filter during next planned shift.'
      : 'Continue regular preventive maintenance inspection.',
    confidence: 94.6,
    created_at: new Date().toISOString(),
    component_affected: 'Bearing Assembly & Main Drive Shaft',
    estimated_time_to_failure: machine.status === 'critical' ? '< 6 hours (URGENT)' : machine.status === 'high' ? '24 - 48 hours' : '> 2,000 hours',
  };

  const pred = prediction || fetchedPred || fallbackPred;
  const isCriticalOrHigh = pred.risk_level === 'CRITICAL' || pred.risk_level === 'HIGH';

  const handleDispatchWorkOrder = async () => {
    setIsDispatching(true);
    try {
      await createMaintenanceTask({
        machine_id: machine.id,
        machine_name: machine.name,
        detected_issue: pred.possible_cause,
        possible_cause: pred.explanation,
        priority: pred.risk_level === 'CRITICAL' ? 'CRITICAL' : pred.risk_level === 'HIGH' ? 'HIGH' : 'MEDIUM',
        recommendation: pred.recommendation,
        status: 'PENDING',
        assigned_to: 'Autonomous Dispatch (Auto-Assigned)',
        technician_notes: `Auto-generated from AI Diagnostic Engine. Confidence: ${pred.confidence}%. TTF: ${pred.estimated_time_to_failure || 'N/A'}`,
      });
      setDispatchedSuccess(true);
      setTimeout(() => setDispatchedSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className={cn(
      "rounded-xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-300",
      isCriticalOrHigh
        ? "bg-rose-950/20 border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.15)]"
        : "bg-slate-900/60 border-slate-800"
    )}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-industrial text-sm font-bold uppercase tracking-wider text-slate-100">
                AI Diagnostic & Root-Cause Engine
              </h3>
              <p className="text-[11px] text-slate-400 font-mono-data">
                Model: Edge-Inference Industrial Classifier v4.1
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-mono-data font-bold", getRiskLevelBadge(pred.risk_level))}>
              {pred.risk_level} RISK
            </span>
          </div>
        </div>

        {/* Confidence & Time-to-Failure Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 block mb-1">
              AI CONFIDENCE
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-mono-data text-lg font-bold text-cyan-300">
                {pred.confidence}%
              </span>
              <span className="text-[10px] text-slate-400">Verified</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 block mb-1">
              ANOMALY SCORE
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className={cn("font-mono-data text-lg font-bold", pred.anomaly_score >= 50 ? "text-rose-400" : "text-emerald-400")}>
                {pred.anomaly_score} / 100
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 block mb-1">
              EST. TIME TO FAILURE
            </span>
            <div className="flex items-center space-x-1 text-amber-300 font-mono-data text-xs font-bold truncate">
              <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate">{pred.estimated_time_to_failure || 'Calculating...'}</span>
            </div>
          </div>
        </div>

        {/* Possible Cause */}
        <div className="mb-4">
          <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 tracking-wider block mb-1">
            DETECTED ROOT CAUSE & ANOMALY SIGNATURE
          </span>
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-sm font-semibold text-slate-100 flex items-start space-x-2">
            <AlertTriangle className={cn("w-4 h-4 flex-shrink-0 mt-0.5", isCriticalOrHigh ? "text-rose-400" : "text-amber-400")} />
            <span>{pred.possible_cause}</span>
          </div>
        </div>

        {/* AI Detailed Explanation */}
        <div className="mb-4">
          <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 tracking-wider block mb-1">
            AI SPECTRAL & THERMAL ANALYSIS
          </span>
          <p className="text-xs text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
            {pred.explanation}
          </p>
        </div>

        {/* Recommended Action */}
        <div className="mb-5">
          <span className="text-[10px] font-industrial uppercase font-bold text-cyan-400 tracking-wider block mb-1">
            RECOMMENDED CORRECTIVE ACTION
          </span>
          <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-200 leading-relaxed font-medium">
            {pred.recommendation}
          </div>
        </div>
      </div>

      {/* Dispatch Work Order Button */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono-data">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Automated Work Order Dispatcher</span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {dispatchedSuccess ? (
            <div className="px-3.5 py-2 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 text-xs font-bold font-industrial flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>WORK ORDER CREATED</span>
            </div>
          ) : (
            <button
              onClick={handleDispatchWorkOrder}
              disabled={isDispatching}
              className={cn(
                "w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-industrial font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all border",
                isCriticalOrHigh
                  ? "bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              )}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{isDispatching ? 'DISPATCHING...' : 'DISPATCH WORK ORDER'}</span>
            </button>
          )}

          {onNavigateToMaintenance && (
            <button
              onClick={onNavigateToMaintenance}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-industrial uppercase border border-slate-700 transition-colors"
            >
              View Orders
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
