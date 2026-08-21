import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Cpu, 
  ShieldAlert, 
  TrendingUp, 
  Activity 
} from 'lucide-react';
import { useFactoryData } from '../../hooks/useFactoryData';
import { cn, formatPercentage } from '../../lib/utils';

export const FactoryMetricsBar: React.FC = () => {
  const { metrics, machines } = useFactoryData();

  const cards = [
    {
      id: 'total',
      label: 'TOTAL MACHINES',
      value: metrics.totalMachines,
      subValue: '6 Connected Cells',
      icon: Cpu,
      color: 'text-slate-100',
      bg: 'bg-slate-900/60 border-slate-800',
      iconColor: 'text-cyan-400',
    },
    {
      id: 'healthy',
      label: 'HEALTHY STATUS',
      value: metrics.healthyCount,
      subValue: `${Math.round((metrics.healthyCount / Math.max(1, metrics.totalMachines)) * 100)}% of fleet`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/20 border-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      id: 'warning',
      label: 'WARNING / DEGRADED',
      value: metrics.warningCount,
      subValue: 'Requires check in 72h',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-950/20 border-amber-500/20',
      iconColor: 'text-amber-400',
    },
    {
      id: 'critical',
      label: 'HIGH / CRITICAL RISK',
      value: metrics.criticalCount,
      subValue: metrics.criticalCount > 0 ? 'Immediate action needed' : 'Zero critical units',
      icon: AlertOctagon,
      color: 'text-rose-400',
      bg: metrics.criticalCount > 0 ? 'bg-rose-950/30 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'bg-slate-900/40 border-slate-800',
      iconColor: 'text-rose-400',
      isAlert: metrics.criticalCount > 0,
    },
    {
      id: 'active_alerts',
      label: 'ACTIVE ALERTS',
      value: metrics.activeAlerts,
      subValue: 'Unresolved alarms',
      icon: ShieldAlert,
      color: metrics.activeAlerts > 0 ? 'text-amber-300' : 'text-slate-300',
      bg: 'bg-slate-900/60 border-slate-800',
      iconColor: 'text-amber-400',
    },
    {
      id: 'health_score',
      label: 'FACTORY HEALTH INDEX',
      value: `${metrics.overallHealthScore}%`,
      subValue: `Avg Risk: ${formatPercentage(metrics.avgFailureRisk)}`,
      icon: TrendingUp,
      color: metrics.overallHealthScore >= 80 ? 'text-emerald-400' : metrics.overallHealthScore >= 60 ? 'text-amber-400' : 'text-rose-400',
      bg: 'bg-cyan-950/20 border-cyan-500/20',
      iconColor: 'text-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={cn(
              "relative p-4 rounded-xl border backdrop-blur-sm transition-all duration-300",
              card.bg,
              card.isAlert && "animate-pulse"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 tracking-wider">
                {card.label}
              </span>
              <Icon className={cn("w-4 h-4", card.iconColor)} />
            </div>

            <div className="flex items-baseline space-x-2">
              <span className={cn("text-2xl font-mono-data font-bold tracking-tight", card.color)}>
                {card.value}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-medium truncate mt-1">
              {card.subValue}
            </p>
          </div>
        );
      })}
    </div>
  );
};
