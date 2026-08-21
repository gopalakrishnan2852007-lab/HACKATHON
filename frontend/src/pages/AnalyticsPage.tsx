import React, { useState, useEffect } from 'react';
import { 
  LineChart as LineChartIcon, 
  BarChart3, 
  TrendingUp, 
  Cpu, 
  Activity, 
  ShieldAlert, 
  Calendar,
  Layers
} from 'lucide-react';
import { useFactoryData } from '../hooks/useFactoryData';
import { apiService } from '../services/api';
import { FleetComparisonChart } from '../components/analytics/FleetComparisonChart';
import { MachineTelemetryCharts } from '../components/machines/MachineTelemetryCharts';
import { SensorCorrelationChart } from '../components/analytics/SensorCorrelationChart';

interface AnalyticsPageProps {
  onSelectMachine: (machineId: string) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onSelectMachine }) => {
  const { machines, alerts } = useFactoryData();
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || 'MCH-101');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const selectedMachine = machines.find(m => m.id === selectedMachineId) || machines[0];

  useEffect(() => {
    let isMounted = true;
    if (selectedMachine?.id) {
      apiService.getAnalytics(selectedMachine.id).then((res) => {
        if (isMounted && res) {
          setAnalyticsData(res);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [selectedMachine?.id]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <LineChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-industrial text-base font-bold uppercase tracking-wider text-slate-100">
                Historical Machine Analytics & Performance Trends
              </h1>
              <p className="text-xs text-slate-400">
                Cross-fleet physical sensor telemetry regression and predictive degradation curves
              </p>
            </div>
          </div>

          {/* Machine selector */}
          <div className="flex items-center space-x-2">
            <label className="text-xs font-industrial uppercase font-bold text-slate-400">
              Select Cell:
            </label>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono-data font-bold focus:outline-none focus:border-cyan-500"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} - {m.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Fleet Comparison Bar Chart */}
      <FleetComparisonChart
        machines={machines}
        onSelectMachine={(id) => {
          setSelectedMachineId(id);
          onSelectMachine(id);
        }}
      />

      {/* Single Machine Historical Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <MachineTelemetryCharts machine={selectedMachine} />
        </div>
        <div className="lg:col-span-5">
          <SensorCorrelationChart machine={selectedMachine} />
        </div>
      </div>

    </div>
  );
};
