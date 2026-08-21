import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Check, 
  RefreshCw,
  BellRing
} from 'lucide-react';
import { useFactoryData } from '../hooks/useFactoryData';
import { AlertFilters } from '../components/alerts/AlertFilters';
import { AlertCard } from '../components/alerts/AlertCard';
import { AlertSeverity } from '../types';

interface AlertsPageProps {
  onSelectMachine: (machineId: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onSelectMachine }) => {
  const { alerts, machines, acknowledgeAlert, resolveAlert } = useFactoryData();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMachine, setSelectedMachine] = useState<string>('ALL');

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH' && a.status === 'ACTIVE').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING' && a.status === 'ACTIVE').length;

  const filteredAlerts = alerts.filter((a) => {
    if (selectedStatus !== 'ALL' && a.status !== selectedStatus) return false;
    if (selectedSeverity !== 'ALL' && a.severity !== selectedSeverity) return false;
    if (selectedMachine !== 'ALL' && a.machine_id !== selectedMachine) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q) ||
        a.machine_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAcknowledgeAll = async () => {
    for (const a of activeAlerts) {
      await acknowledgeAlert(a.id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Stats */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-industrial text-base font-bold uppercase tracking-wider text-slate-100">
                Central Plant Alarm & Emergency Center
              </h1>
              <p className="text-xs text-slate-400">
                Real-time alert dispatch, acknowledgment workflow, and corrective action logs
              </p>
            </div>
          </div>

          {/* Quick Severity Counters */}
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono-data text-xs font-bold">
              {criticalCount} Critical
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-orange-950/60 border border-orange-500/40 text-orange-300 font-mono-data text-xs font-bold">
              {highCount} High
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono-data text-xs font-bold">
              {warningCount} Warning
            </div>
          </div>

        </div>
      </div>

      {/* Filters Bar */}
      <AlertFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSeverity={selectedSeverity}
        onSeverityChange={setSelectedSeverity}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedMachine={selectedMachine}
        onMachineChange={setSelectedMachine}
        machinesList={machines.map(m => ({ id: m.id, name: m.name }))}
        activeCount={activeAlerts.length}
      />

      {/* Header and Bulk Action */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono-data text-slate-400">
          Showing {filteredAlerts.length} of {alerts.length} Total Records
        </span>

        {activeAlerts.length > 0 && (
          <button
            onClick={handleAcknowledgeAll}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-industrial font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Acknowledge All Active ({activeAlerts.length})</span>
          </button>
        )}
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-2 text-center py-16 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
            No alarms match the selected filter criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={acknowledgeAlert}
              onResolve={resolveAlert}
              onSelectMachine={onSelectMachine}
            />
          ))
        )}
      </div>

    </div>
  );
};
