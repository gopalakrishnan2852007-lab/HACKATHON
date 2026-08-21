import React from 'react';
import { ShieldAlert, Clock, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Alert } from '../../types';
import { useFactoryData } from '../../hooks/useFactoryData';
import { getSeverityBadge, getAlertStatusBadge, timeAgo, cn } from '../../lib/utils';

interface MachineAlertTimelineProps {
  machineId: string;
}

export const MachineAlertTimeline: React.FC<MachineAlertTimelineProps> = ({ machineId }) => {
  const { alerts, acknowledgeAlert, resolveAlert } = useFactoryData();
  const machineAlerts = alerts.filter(a => a.machine_id === machineId);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <h3 className="font-industrial text-xs font-bold uppercase tracking-wider text-slate-100">
            Machine Alarm & Event Timeline
          </h3>
        </div>
        <span className="text-xs font-mono-data text-slate-400">
          Total Logs: {machineAlerts.length}
        </span>
      </div>

      {machineAlerts.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs">
          <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-emerald-400 opacity-60" />
          No historical alarms logged for this machine cell.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {machineAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isActive = alert.status === 'ACTIVE';

            return (
              <div key={alert.id} className="relative group">
                {/* Timeline Dot */}
                <div className={cn(
                  "absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border border-slate-900",
                  isCritical ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" :
                  alert.severity === 'HIGH' ? "bg-orange-500" :
                  alert.severity === 'WARNING' ? "bg-amber-400" : "bg-cyan-400"
                )} />

                <div className={cn(
                  "p-3 rounded-lg border text-xs",
                  isActive && isCritical
                    ? "bg-rose-950/30 border-rose-500/50"
                    : "bg-slate-950/60 border-slate-800"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className={cn("px-1.5 py-0.2 rounded text-[10px] font-mono-data font-semibold", getSeverityBadge(alert.severity))}>
                        {alert.severity}
                      </span>
                      <span className={cn("px-1.5 py-0.2 rounded text-[10px] font-mono-data", getAlertStatusBadge(alert.status))}>
                        {alert.status}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono-data flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {timeAgo(alert.created_at)}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-200 text-xs mb-1">
                    {alert.title}
                  </h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed mb-2">
                    {alert.message}
                  </p>

                  {/* Actions */}
                  {alert.status !== 'RESOLVED' && (
                    <div className="flex items-center space-x-2 pt-1 border-t border-slate-800/80">
                      {alert.status === 'ACTIVE' && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-semibold transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold transition-colors"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
