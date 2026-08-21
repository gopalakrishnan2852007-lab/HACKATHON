import React from 'react';
import { Filter, Search, ShieldAlert } from 'lucide-react';
import { AlertSeverity, AlertStatus } from '../../types';
import { cn } from '../../lib/utils';

interface AlertFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedSeverity: string;
  onSeverityChange: (s: string) => void;
  selectedStatus: string;
  onStatusChange: (st: string) => void;
  selectedMachine: string;
  onMachineChange: (m: string) => void;
  machinesList: { id: string; name: string }[];
  activeCount: number;
}

export const AlertFilters: React.FC<AlertFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedSeverity,
  onSeverityChange,
  selectedStatus,
  onStatusChange,
  selectedMachine,
  onMachineChange,
  machinesList,
  activeCount,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alarm title or cause..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono-data"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[11px] font-industrial uppercase font-bold text-slate-400 whitespace-nowrap">
            Status:
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono-data"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE ({activeCount})</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[11px] font-industrial uppercase font-bold text-slate-400 whitespace-nowrap">
            Severity:
          </label>
          <select
            value={selectedSeverity}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono-data"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>
        </div>

        {/* Machine Filter */}
        <div className="flex items-center space-x-1.5">
          <label className="text-[11px] font-industrial uppercase font-bold text-slate-400 whitespace-nowrap">
            Machine:
          </label>
          <select
            value={selectedMachine}
            onChange={(e) => onMachineChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono-data"
          >
            <option value="ALL">All Fleet Units</option>
            {machinesList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} - {m.name}
              </option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
};
