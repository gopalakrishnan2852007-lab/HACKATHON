import React, { useState } from 'react';
import { 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Plus, 
  User, 
  FileText,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { Maintenance, MaintenancePriority, MaintenanceStatus } from '../../types';
import { useFactoryData } from '../../hooks/useFactoryData';
import { timeAgo, cn } from '../../lib/utils';

interface MaintenanceTableProps {
  onSelectMachine: (machineId: string) => void;
}

export const MaintenanceTable: React.FC<MaintenanceTableProps> = ({ onSelectMachine }) => {
  const { maintenance, updateMaintenanceStatus, createMaintenanceTask, machines } = useFactoryData();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Work Order Form State
  const [newMachineId, setNewMachineId] = useState<string>(machines[0]?.id || 'MCH-101');
  const [newIssue, setNewIssue] = useState<string>('');
  const [newPriority, setNewPriority] = useState<MaintenancePriority>('MEDIUM');
  const [newRecommendation, setNewRecommendation] = useState<string>('');
  const [newAssignedTo, setNewAssignedTo] = useState<string>('Marcus Vance');

  const filteredOrders = maintenance.filter((m) => {
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && m.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (m.machine_id || '').toLowerCase().includes(q) ||
        (m.detected_issue || m.issue || '').toLowerCase().includes(q) ||
        (m.possible_cause || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getPriorityPill = (p: MaintenancePriority) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-500/50';
      case 'HIGH':
        return 'bg-orange-950 text-orange-300 border-orange-500/50';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border-amber-500/50';
      case 'LOW':
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getStatusPill = (s: MaintenanceStatus) => {
    switch (s) {
      case 'PENDING':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'IN_PROGRESS':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 animate-pulse';
      case 'COMPLETED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssue.trim()) return;

    const machineObj = machines.find(m => m.id === newMachineId);
    await createMaintenanceTask({
      machine_id: newMachineId,
      machine_name: machineObj?.name || newMachineId,
      detected_issue: newIssue,
      possible_cause: 'Manual Inspection & Operator Flag',
      priority: newPriority,
      recommendation: newRecommendation || 'Perform preventive overhaul per standard operating procedure.',
      status: 'PENDING',
      assigned_to: newAssignedTo,
    });

    setNewIssue('');
    setNewRecommendation('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Filter & Action Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders, issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono-data"
              />
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono-data focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono-data focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-industrial font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Work Order</span>
          </button>

        </div>
      </div>

      {/* Orders List / Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            <h3 className="font-industrial text-sm font-bold uppercase tracking-wider text-slate-100">
              Maintenance Dispatch & Work Order Queue
            </h3>
          </div>
          <span className="text-xs font-mono-data text-slate-400">
            {filteredOrders.length} Records
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No maintenance work orders match the current filter.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="p-4 sm:p-5 hover:bg-slate-950/40 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-data text-xs font-bold text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {order.id}
                      </span>

                      <button
                        onClick={() => onSelectMachine(order.machine_id)}
                        className="font-mono-data text-xs font-bold text-cyan-400 hover:underline bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40"
                      >
                        {order.machine_id} {order.machine_name && `- ${order.machine_name}`}
                      </button>

                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono-data font-bold border", getPriorityPill(order.priority))}>
                        {order.priority}
                      </span>

                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono-data font-semibold border", getStatusPill(order.status))}>
                        ● {order.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100">
                      {order.detected_issue || order.issue}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="text-slate-400 font-semibold font-industrial text-[10px] uppercase">Possible Cause: </span>
                      {order.possible_cause}
                    </p>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 mt-1 font-medium">
                      <span className="text-cyan-400 font-bold font-industrial text-[10px] uppercase block mb-0.5">
                        Action Plan:
                      </span>
                      {order.recommendation}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono-data pt-1">
                      {order.assigned_to && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {order.assigned_to}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Created: {timeAgo(order.created_at)}
                      </span>
                      {order.completed_at && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed: {timeAgo(order.completed_at)}
                        </span>
                      )}
                      {order.technician_notes && (
                        <span className="text-slate-400 italic">
                          Notes: {order.technician_notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: State Transition Buttons */}
                  <div className="flex lg:flex-col items-center gap-2 self-end lg:self-center">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => updateMaintenanceStatus(order.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-industrial font-bold uppercase tracking-wider transition-colors"
                      >
                        Start Work
                      </button>
                    )}

                    {order.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateMaintenanceStatus(order.id, 'COMPLETED', 'Part replaced and laser alignment verified nominal.')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-industrial font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Complete Order</span>
                      </button>
                    )}

                    {order.status === 'COMPLETED' && (
                      <span className="px-3 py-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800 text-xs font-mono-data font-bold">
                        CLOSED
                      </span>
                    )}
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <h3 className="font-industrial text-sm font-bold uppercase tracking-wider text-slate-100">
                  New Maintenance Dispatch
                </h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-industrial uppercase font-bold mb-1">
                  Target Machine
                </label>
                <select
                  value={newMachineId}
                  onChange={(e) => setNewMachineId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono-data"
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} - {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-industrial uppercase font-bold mb-1">
                  Detected Issue / Symptoms
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spindle bearing overheating, vibration audible"
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-industrial uppercase font-bold mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as MaintenancePriority)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono-data"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-industrial uppercase font-bold mb-1">
                    Assigned Technician
                  </label>
                  <input
                    type="text"
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-industrial uppercase font-bold mb-1">
                  Action Recommendation
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Inspect bearing cage, replenish lubrication, check laser alignment"
                  value={newRecommendation}
                  onChange={(e) => setNewRecommendation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-industrial uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-industrial font-bold uppercase"
                >
                  Dispatch Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
