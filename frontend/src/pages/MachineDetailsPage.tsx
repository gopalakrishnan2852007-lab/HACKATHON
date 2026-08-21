import React from 'react';
import { 
  Cpu, 
  ArrowLeft, 
  Flame, 
  Clock, 
  MapPin, 
  Sliders, 
  ShieldCheck, 
  RotateCcw,
  Activity
} from 'lucide-react';
import { useFactoryData } from '../hooks/useFactoryData';
import { MachineTelemetryCharts } from '../components/machines/MachineTelemetryCharts';
import { AIDiagnosticPanel } from '../components/machines/AIDiagnosticPanel';
import { MachineAlertTimeline } from '../components/machines/MachineAlertTimeline';
import { SensorCorrelationChart } from '../components/analytics/SensorCorrelationChart';
import { getStatusTheme, formatNumber, formatPercentage, cn } from '../lib/utils';

interface MachineDetailsPageProps {
  machineId: string;
  onBack: () => void;
  onSimulate: (machineId: string) => void;
  onNavigateToMaintenance: () => void;
  onSelectMachine: (machineId: string) => void;
}

export const MachineDetailsPage: React.FC<MachineDetailsPageProps> = ({
  machineId,
  onBack,
  onSimulate,
  onNavigateToMaintenance,
  onSelectMachine,
}) => {
  const { machines, getPrediction, resetMachine } = useFactoryData();
  const machine = machines.find(m => m.id === machineId) || machines[0];
  const prediction = getPrediction(machine.id);
  const theme = getStatusTheme(machine.status);

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar & Machine Selector */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Return to Command Center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center space-x-2.5">
                <span className="font-mono-data text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/60">
                  {machine.id}
                </span>
                <h1 className="text-lg font-bold text-slate-100 truncate">
                  {machine.name}
                </h1>
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-industrial font-bold border", theme.badge)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full inline-block mr-1.5", theme.dot)} />
                  {theme.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  {machine.location}
                </span>
                <span>•</span>
                <span>Type: {machine.type}</span>
                {machine.model_number && (
                  <>
                    <span>•</span>
                    <span className="font-mono-data">Model: {machine.model_number}</span>
                  </>
                )}
                {machine.operational_hours && (
                  <>
                    <span>•</span>
                    <span className="font-mono-data">Uptime: {machine.operational_hours.toLocaleString()} hrs</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Machine Switcher & Actions */}
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <select
              value={machine.id}
              onChange={(e) => onSelectMachine(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono-data focus:outline-none focus:border-cyan-500"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} - {m.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => onSimulate(machine.id)}
              className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-xs font-industrial font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate</span>
            </button>

            <button
              onClick={() => resetMachine(machine.id)}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset machine telemetry"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Sensor Metric Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        
        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 block mb-1">
            HEALTH SCORE
          </span>
          <span className={cn("text-xl font-mono-data font-bold", theme.text)}>
            {machine.health_score}%
          </span>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div className={cn("h-full", machine.health_score >= 80 ? "bg-emerald-500" : machine.health_score >= 60 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${machine.health_score}%` }} />
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 block mb-1">
            FAILURE RISK
          </span>
          <span className={cn(
            "text-xl font-mono-data font-bold",
            machine.failure_probability >= 0.7 ? "text-rose-400" :
            machine.failure_probability >= 0.35 ? "text-amber-400" : "text-emerald-400"
          )}>
            {formatPercentage(machine.failure_probability)}
          </span>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div className={cn("h-full", machine.failure_probability >= 0.7 ? "bg-rose-500" : machine.failure_probability >= 0.35 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, machine.failure_probability * 100)}%` }} />
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 block mb-1">
            TEMPERATURE
          </span>
          <span className="text-xl font-mono-data font-bold text-amber-300">
            {formatNumber(machine.temperature)}°C
          </span>
          <span className="text-[10px] text-slate-500 font-mono-data block mt-1">
            Limit: {machine.thresholds?.temp_crit || 85}°C
          </span>
        </div>

        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 block mb-1">
            VIBRATION (RMS)
          </span>
          <span className="text-xl font-mono-data font-bold text-pink-400">
            {formatNumber(machine.vibration, 2)} mm/s
          </span>
          <span className="text-[10px] text-slate-500 font-mono-data block mt-1">
            Limit: {machine.thresholds?.vib_crit || 6.0} mm/s
          </span>
        </div>

        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 block mb-1">
            CURRENT DRAW
          </span>
          <span className="text-xl font-mono-data font-bold text-cyan-300">
            {formatNumber(machine.current)} A
          </span>
          <span className="text-[10px] text-slate-500 font-mono-data block mt-1">
            Limit: {machine.thresholds?.current_crit || 35} A
          </span>
        </div>

        <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 block mb-1">
            ROTATIONAL SPEED
          </span>
          <span className="text-xl font-mono-data font-bold text-purple-300">
            {Math.round(machine.rpm)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono-data block mt-1">
            RPM Target
          </span>
        </div>

      </div>

      {/* Main Row: Historical Telemetry Charts (7 Cols) & AI Diagnostic Engine (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-7 space-y-6">
          <MachineTelemetryCharts machine={machine} />
          <SensorCorrelationChart machine={machine} />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <AIDiagnosticPanel
            machine={machine}
            prediction={prediction}
            onNavigateToMaintenance={onNavigateToMaintenance}
          />
          <MachineAlertTimeline machineId={machine.id} />
        </div>

      </div>

    </div>
  );
};
