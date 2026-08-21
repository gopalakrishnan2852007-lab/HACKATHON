import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from 'recharts';
import { Machine } from '../../types';
import { cn } from '../../lib/utils';

interface FleetComparisonChartProps {
  machines: Machine[];
  onSelectMachine: (machineId: string) => void;
}

export const FleetComparisonChart: React.FC<FleetComparisonChartProps> = ({
  machines,
  onSelectMachine,
}) => {
  const chartData = machines.map((m) => ({
    id: m.id,
    name: m.id,
    fullName: m.name,
    health: m.health_score,
    failureRisk: Math.round(m.failure_probability * 100),
    temperature: m.temperature,
    vibration: m.vibration,
    current: m.current,
    status: m.status,
  }));

  const getBarColor = (health: number) => {
    if (health >= 80) return '#10b981';
    if (health >= 60) return '#f59e0b';
    if (health >= 40) return '#f97316';
    return '#f43f5e';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs font-mono-data">
          <p className="text-cyan-400 font-bold mb-1">{data.id} - {data.fullName}</p>
          <p className="text-slate-300">Health Index: <strong className="text-emerald-400">{data.health}%</strong></p>
          <p className="text-slate-300">Failure Risk: <strong className="text-rose-400">{data.failureRisk}%</strong></p>
          <p className="text-slate-400 mt-1">Temp: {data.temperature}°C | Vib: {data.vibration} mm/s | Curr: {data.current} A</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-industrial text-sm font-bold uppercase tracking-wider text-slate-100">
            Fleet Comparative Health vs Failure Risk Matrix
          </h3>
          <p className="text-xs text-slate-400">
            Cross-machine health score vs failure probability distribution
          </p>
        </div>
        <span className="text-xs font-mono-data text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          6 Industrial Cells
        </span>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis dataKey="id" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
            />
            <Bar dataKey="health" name="Health Score (%)" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.health)} />
              ))}
            </Bar>
            <Bar dataKey="failureRisk" name="Failure Risk (%)" fill="#64748b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-6 gap-2">
        {machines.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelectMachine(m.id)}
            className="p-2 rounded bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/60 text-left transition-colors"
          >
            <span className="text-[10px] font-mono-data text-cyan-400 font-bold block truncate">
              {m.id}
            </span>
            <span className="text-[11px] font-bold text-slate-200 block truncate">
              {m.name.split(' ')[0]}
            </span>
            <span className="text-[10px] text-slate-400 font-mono-data">
              {m.health_score}% Health
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
