import React, { useState } from 'react';
import { 
  Activity, 
  Cpu, 
  ShieldAlert, 
  Sparkles, 
  Radio, 
  Flame, 
  SlidersHorizontal,
  Search,
  Filter
} from 'lucide-react';
import { useFactoryData } from '../hooks/useFactoryData';
import { FactoryMetricsBar } from '../components/dashboard/FactoryMetricsBar';
import { MachineCard } from '../components/dashboard/MachineCard';
import { LiveAlertsFeed } from '../components/dashboard/LiveAlertsFeed';
import { LiveAIInsights } from '../components/dashboard/LiveAIInsights';
import { MachineStatus } from '../types';

interface DashboardPageProps {
  onSelectMachine: (machineId: string) => void;
  onSimulateMachine: (machineId: string) => void;
  onViewAllAlerts: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectMachine,
  onSimulateMachine,
  onViewAllAlerts,
}) => {
  const { machines, metrics, isLiveStreaming } = useFactoryData();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredMachines = machines.filter((m) => {
    if (filterStatus !== 'ALL' && m.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Metrics Bar */}
      <FactoryMetricsBar />

      {/* Main Grid: Left 8 cols for Machine Grid, Right 4 cols for Live Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Live Machine Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Machine Grid Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-industrial text-sm font-bold uppercase tracking-wider text-slate-100">
                  Live Machine Fleet Telemetry Grid
                </h2>
                <span className="text-[11px] text-slate-400 font-mono-data">
                  {filteredMachines.length} of {machines.length} Units Active
                </span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter machines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono-data w-36 sm:w-44"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono-data focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Status</option>
                <option value="HEALTHY">Healthy ({metrics.healthyCount})</option>
                <option value="WARNING">Warning ({metrics.warningCount})</option>
                <option value="CRITICAL">Critical ({metrics.criticalCount})</option>
              </select>
            </div>
          </div>

          {/* Machine Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMachines.map((machine) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                onSelect={onSelectMachine}
                onSimulate={onSimulateMachine}
              />
            ))}
          </div>

        </div>

        {/* Right Section: Real-time Alarms & AI Insights (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <LiveAlertsFeed
            onViewAllAlerts={onViewAllAlerts}
            onSelectMachine={onSelectMachine}
          />
          <LiveAIInsights
            onSelectMachine={onSelectMachine}
          />
        </div>

      </div>

    </div>
  );
};
