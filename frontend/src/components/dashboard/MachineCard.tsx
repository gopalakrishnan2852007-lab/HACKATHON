import React from 'react';
import { 
  Activity, 
  Thermometer, 
  Waves, 
  Zap, 
  RotateCw, 
  AlertOctagon, 
  CheckCircle2, 
  ChevronRight, 
  Flame,
  Clock
} from 'lucide-react';
import { Machine } from '../../types';
import { getStatusTheme, formatNumber, formatPercentage, timeAgo, cn } from '../../lib/utils';

interface MachineCardProps {
  machine: Machine;
  onSelect: (machineId: string) => void;
  onSimulate: (machineId: string) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  onSelect,
  onSimulate,
}) => {
  const theme = getStatusTheme(machine.status);
  const failureProb = machine.failure_probability <= 1 ? machine.failure_probability * 100 : machine.failure_probability;

  // Threshold alerts
  const isTempHigh = machine.thresholds && machine.temperature >= machine.thresholds.temp_warn;
  const isVibHigh = machine.thresholds && machine.vibration >= machine.thresholds.vib_warn;
  const isCurrHigh = machine.thresholds && machine.current >= machine.thresholds.current_warn;

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-slate-900/70 p-4 transition-all duration-300 flex flex-col justify-between group",
        theme.border,
        theme.glow,
        machine.status === 'critical' && "border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.2)] bg-rose-950/20"
      )}
    >
      {/* Top Bar: ID, Type, Status Pill */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono-data text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
              {machine.id}
            </span>
            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
              {machine.type}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-industrial font-bold border", theme.badge)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", theme.dot)} />
              {theme.label}
            </span>
          </div>
        </div>

        {/* Machine Name & Location */}
        <div className="mb-3.5">
          <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
            {machine.name}
          </h3>
          <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            {machine.location}
          </p>
        </div>

        {/* Health Index & Failure Probability Gauges */}
        <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 mb-4">
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-industrial font-semibold mb-1">
              <span>HEALTH SCORE</span>
              <span className={cn("font-mono-data font-bold", theme.text)}>
                {machine.health_score}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  machine.health_score >= 80 ? "bg-emerald-500" :
                  machine.health_score >= 60 ? "bg-amber-500" :
                  machine.health_score >= 40 ? "bg-orange-500" : "bg-rose-500"
                )}
                style={{ width: `${machine.health_score}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-industrial font-semibold mb-1">
              <span>FAILURE RISK</span>
              <span className={cn(
                "font-mono-data font-bold",
                failureProb >= 70 ? "text-rose-400" :
                failureProb >= 40 ? "text-orange-400" :
                failureProb >= 20 ? "text-amber-400" : "text-emerald-400"
              )}>
                {formatPercentage(machine.failure_probability)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  failureProb >= 70 ? "bg-rose-500" :
                  failureProb >= 40 ? "bg-orange-500" :
                  failureProb >= 20 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, failureProb)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Real-time 4-Sensor Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          
          {/* Temperature */}
          <div className={cn(
            "p-2 rounded-lg bg-slate-950/40 border text-center transition-colors",
            isTempHigh ? "border-amber-500/50 bg-amber-950/20" : "border-slate-800/80"
          )}>
            <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px] uppercase font-mono-data mb-0.5">
              <Thermometer className={cn("w-3 h-3", isTempHigh ? "text-amber-400" : "text-slate-400")} />
              <span>TEMP</span>
            </div>
            <span className={cn("font-mono-data text-xs font-bold", isTempHigh ? "text-amber-300 font-extrabold" : "text-slate-200")}>
              {formatNumber(machine.temperature)}°C
            </span>
          </div>

          {/* Vibration */}
          <div className={cn(
            "p-2 rounded-lg bg-slate-950/40 border text-center transition-colors",
            isVibHigh ? "border-rose-500/50 bg-rose-950/20" : "border-slate-800/80"
          )}>
            <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px] uppercase font-mono-data mb-0.5">
              <Waves className={cn("w-3 h-3", isVibHigh ? "text-rose-400" : "text-slate-400")} />
              <span>VIB</span>
            </div>
            <span className={cn("font-mono-data text-xs font-bold", isVibHigh ? "text-rose-300 font-extrabold" : "text-slate-200")}>
              {formatNumber(machine.vibration, 2)}
            </span>
          </div>

          {/* Current */}
          <div className={cn(
            "p-2 rounded-lg bg-slate-950/40 border text-center transition-colors",
            isCurrHigh ? "border-orange-500/50 bg-orange-950/20" : "border-slate-800/80"
          )}>
            <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px] uppercase font-mono-data mb-0.5">
              <Zap className={cn("w-3 h-3", isCurrHigh ? "text-orange-400" : "text-slate-400")} />
              <span>CURR</span>
            </div>
            <span className={cn("font-mono-data text-xs font-bold", isCurrHigh ? "text-orange-300 font-extrabold" : "text-slate-200")}>
              {formatNumber(machine.current)}A
            </span>
          </div>

          {/* RPM */}
          <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 text-center">
            <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px] uppercase font-mono-data mb-0.5">
              <RotateCw className="w-3 h-3 text-cyan-400" />
              <span>RPM</span>
            </div>
            <span className="font-mono-data text-xs font-bold text-slate-200">
              {Math.round(machine.rpm)}
            </span>
          </div>

        </div>
      </div>

      {/* Card Footer: Timestamp & Action Buttons */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center text-[10px] text-slate-400 font-mono-data">
          <Clock className="w-3 h-3 mr-1 text-slate-400" />
          <span>{timeAgo(machine.updated_at)}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => onSimulate(machine.id)}
            className="px-2 py-1 rounded text-[10px] font-industrial font-semibold bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-colors"
            title="Inject Anomaly in Simulator"
          >
            <Flame className="w-2.5 h-2.5 text-amber-400" />
            <span>Simulate</span>
          </button>

          <button
            onClick={() => onSelect(machine.id)}
            className="px-2.5 py-1 rounded text-[10px] font-industrial font-bold bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 transition-colors"
          >
            <span>Telemetry</span>
            <ChevronRight className="w-3 h-3 text-cyan-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
