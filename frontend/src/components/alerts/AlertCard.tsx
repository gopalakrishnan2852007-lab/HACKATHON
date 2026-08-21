import React from 'react';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Check, 
  ExternalLink,
  Wrench,
  Cpu
} from 'lucide-react';
import { Alert } from '../../types';
import { getSeverityBadge, getAlertStatusBadge, timeAgo, formatPercentage, cn } from '../../lib/utils';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onSelectMachine: (machineId: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onResolve,
  onSelectMachine,
}) => {
  const isCritical = alert.severity === 'CRITICAL';
  const isHigh = alert.severity === 'HIGH';
  const isActive = alert.status === 'ACTIVE';

  return (
    <div
      className={cn(
        "rounded-xl border p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between",
        isActive && isCritical
          ? "bg-rose-950/30 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
          : isActive && isHigh
          ? "bg-orange-950/20 border-orange-500/40"
          : "bg-slate-900/60 border-slate-800"
      )}
    >
      <div>
        {/* Header: ID, Severity, Status, Timestamp */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono-data text-xs font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {alert.id}
            </span>
            <span className={cn("px-2 py-0.5 rounded text-[11px] font-mono-data font-bold uppercase", getSeverityBadge(alert.severity))}>
              {alert.severity}
            </span>
            <span className={cn("px-2 py-0.5 rounded text-[11px] font-mono-data", getAlertStatusBadge(alert.status))}>
              {alert.status}
            </span>
          </div>

          <div className="flex items-center text-xs text-slate-400 font-mono-data">
            <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span>{timeAgo(alert.created_at)}</span>
          </div>
        </div>

        {/* Machine info */}
        <div className="flex items-center space-x-2 mb-2">
          <button
            onClick={() => onSelectMachine(alert.machine_id)}
            className="text-xs font-mono-data font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40"
          >
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>{alert.machine_id}</span>
            {alert.machine_name && <span className="text-slate-400 font-normal">({alert.machine_name})</span>}
          </button>

          {alert.failure_probability !== undefined && (
            <span className="text-xs font-mono-data text-rose-400 font-semibold">
              Risk: {formatPercentage(alert.failure_probability)}
            </span>
          )}
        </div>

        {/* Title & Message */}
        <h3 className="text-sm font-bold text-slate-100 mb-1.5 leading-snug">
          {alert.title}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          {alert.message}
        </p>

        {/* Recommended Action */}
        {alert.recommended_action && (
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-amber-300/90 font-medium mb-3">
            <span className="font-industrial uppercase font-bold text-amber-400 block text-[10px] mb-0.5">
              RECOMMENDED MAINTENANCE ACTION:
            </span>
            {alert.recommended_action}
          </div>
        )}
      </div>

      {/* Footer / Action Controls */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-slate-400 font-mono-data">
          {alert.acknowledged_at && (
            <span>Ack: {timeAgo(alert.acknowledged_at)}</span>
          )}
          {alert.resolved_at && (
            <span className="ml-2 text-emerald-400">Resolved: {timeAgo(alert.resolved_at)}</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isActive && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-industrial font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Acknowledge</span>
            </button>
          )}

          {alert.status !== 'RESOLVED' && (
            <button
              onClick={() => onResolve(alert.id)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-industrial font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolve Alert</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
