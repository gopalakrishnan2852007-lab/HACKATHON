import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  ShieldAlert, 
  LineChart, 
  Wrench, 
  Flame 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFactoryData } from '../../hooks/useFactoryData';

export type NavTab = 'dashboard' | 'machine-details' | 'alerts' | 'analytics' | 'maintenance' | 'simulator';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedMachineId?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  selectedMachineId,
}) => {
  const { alerts, maintenance } = useFactoryData();
  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const pendingMaintenanceCount = maintenance.filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS').length;

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Command Center',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'machine-details' as NavTab,
      label: selectedMachineId ? `Machine (${selectedMachineId})` : 'Machine Telemetry',
      icon: Cpu,
      badge: null,
    },
    {
      id: 'alerts' as NavTab,
      label: 'Alert Center',
      icon: ShieldAlert,
      badge: activeAlertsCount > 0 ? activeAlertsCount : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      id: 'analytics' as NavTab,
      label: 'Historical Analytics',
      icon: LineChart,
      badge: null,
    },
    {
      id: 'maintenance' as NavTab,
      label: 'Maintenance Orders',
      icon: Wrench,
      badge: pendingMaintenanceCount > 0 ? pendingMaintenanceCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'simulator' as NavTab,
      label: 'Failure Simulator',
      icon: Flame,
      badge: 'LIVE DEMO',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold animate-pulse',
      isHighlight: true,
    },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/60 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={cn(
                  "flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border",
                  isActive
                    ? item.isHighlight
                      ? "bg-amber-500/20 text-amber-200 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                      : "bg-cyan-950/60 text-cyan-200 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : item.isHighlight
                    ? "bg-slate-900/80 text-amber-400/90 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-950/30"
                    : "bg-slate-950/40 text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-800 hover:bg-slate-900/50"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4",
                  isActive 
                    ? item.isHighlight ? "text-amber-400" : "text-cyan-400" 
                    : item.isHighlight ? "text-amber-500" : "text-slate-400"
                )} />
                <span className="font-industrial tracking-wide uppercase">{item.label}</span>
                {item.badge !== null && (
                  <span className={cn(
                    "text-[10px] font-mono-data px-1.5 py-0.2 rounded-full border",
                    item.badgeColor || "bg-slate-800 text-slate-300 border-slate-700"
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
