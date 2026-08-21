import React from 'react';
import { Wrench, ShieldCheck, Clock, CheckCircle2, UserCheck } from 'lucide-react';
import { useFactoryData } from '../hooks/useFactoryData';
import { MaintenanceTable } from '../components/maintenance/MaintenanceTable';

interface MaintenancePageProps {
  onSelectMachine: (machineId: string) => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ onSelectMachine }) => {
  const { maintenance } = useFactoryData();
  const pendingCount = maintenance.filter(m => m.status === 'PENDING').length;
  const inProgressCount = maintenance.filter(m => m.status === 'IN_PROGRESS').length;
  const completedCount = maintenance.filter(m => m.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-industrial text-base font-bold uppercase tracking-wider text-slate-100">
                Plant Maintenance & Work Order Management
              </h1>
              <p className="text-xs text-slate-400">
                AI-recommended corrective procedures, technician assignments, and repair execution logs
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono-data text-xs font-bold">
              {pendingCount} Pending
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono-data text-xs font-bold">
              {inProgressCount} In Progress
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono-data text-xs font-bold">
              {completedCount} Completed
            </div>
          </div>

        </div>
      </div>

      {/* Main Table & Dispatcher */}
      <MaintenanceTable onSelectMachine={onSelectMachine} />

    </div>
  );
};
