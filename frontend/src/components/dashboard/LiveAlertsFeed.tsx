import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, AlertOctagon, Clock, ExternalLink } from 'lucide-react';
import { useFactoryData } from '../../hooks/useFactoryData';
import { getSeverityBadge, timeAgo, cn, formatPercentage } from '../../lib/utils';

interface LiveAlertsFeedProps {
  onViewAllAlerts: () => void;
  onSelectMachine: (machineId: string) => void;
}

export const LiveAlertsFeed: React.FC<LiveAlertsFeedProps> = ({
  onViewAllAlerts,
  onSelectMachine,
}) => {
  const { alerts, acknowledgeAlert, resolveAlert } = useFactoryData();
  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h3 className="font-industrial text-xs font-bold uppercase tracking-wider text-slate-100">
            Live Alarm Stream
          </h3>
        </div>
        <button
          onClick={onViewAllAlerts}
          className="text-xs font-mono-data text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          <span>View All ({alerts.length})</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {recentAlerts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No active alarms in system.
          </div>
        ) : (
          recentAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isActive = alert.status === 'ACTIVE';

            return (
              <div
                key={alert.id}
                className={cn(
                  "p-3 rounded-lg border text-xs transition-all",
                  isCritical && isActive
                    ? "bg-rose-950/30 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                    : alert.severity === 'HIGH' && isActive
                    ? "bg-orange-950/20 border-orange-500/40"
                    : "bg-slate-950/60 border-slate-800"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className={cn("px-1.5 py-0.2 rounded text-[10px] font-mono-data font-semibold uppercase", getSeverityBadge(alert.severity))}>
                      {alert.severity}
                    </span>
                    <button
                      onClick={() => onSelectMachine(alert.machine_id)}
                      className="font-mono-data text-cyan-400 hover:underline font-bold text-[11px]"
                    >
                      {alert.machine_id}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono-data flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(alert.created_at)}
                  </span>
                </div>

                <h4 className="font-bold text-slate-200 text-xs mb-1">
                  {alert.title}
                </h4>
                <p className="text-slate-400 text-[11px] line-clamp-2 mb-2 leading-relaxed">
                  {alert.message}
                </p>

                {alert.recommended_action && (
                  <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] text-amber-300/90 mb-2 font-medium">
                    <span className="font-bold uppercase text-amber-400">Action:</span> {alert.recommended_action}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className={cn(
                    "text-[10px] font-mono-data font-semibold",
                    isActive ? "text-rose-400" : alert.status === 'ACKNOWLEDGED' ? "text-amber-400" : "text-emerald-400"
                  )}>
                    ● {alert.status}
                  </span>

                  <div className="flex items-center space-x-1">
                    {isActive && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-semibold transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.status !== 'RESOLVED' && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
