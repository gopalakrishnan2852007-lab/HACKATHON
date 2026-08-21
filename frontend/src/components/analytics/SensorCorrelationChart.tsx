import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { ShieldCheck, Activity, Cpu, AlertTriangle } from 'lucide-react';
import { Machine } from '../../types';

interface SensorCorrelationChartProps {
  machine: Machine;
}

export const SensorCorrelationChart: React.FC<SensorCorrelationChartProps> = ({ machine }) => {
  // Normalize parameters to 0-100 scale for radar stress representation
  const t = machine.thresholds || {
    temp_warn: 65,
    temp_crit: 85,
    vib_warn: 3.5,
    vib_crit: 6.0,
    current_warn: 25,
    current_crit: 35,
    rpm_min: 1000,
    rpm_max: 3600,
  };

  const tempStress = Math.min(100, Math.round((machine.temperature / t.temp_crit) * 100));
  const vibStress = Math.min(100, Math.round((machine.vibration / t.vib_crit) * 100));
  const currStress = Math.min(100, Math.round((machine.current / t.current_crit) * 100));
  const rpmStress = Math.min(100, Math.round((machine.rpm / t.rpm_max) * 100));
  const riskIndex = Math.min(100, Math.round(machine.failure_probability * 100));

  const radarData = [
    { subject: 'Thermal Stress', A: tempStress, fullMark: 100 },
    { subject: 'Vib Amplitude', A: vibStress, fullMark: 100 },
    { subject: 'Phase Current', A: currStress, fullMark: 100 },
    { subject: 'Shaft Speed', A: rpmStress, fullMark: 100 },
    { subject: 'Failure Risk', A: riskIndex, fullMark: 100 },
    { subject: 'Degradation', A: 100 - machine.health_score, fullMark: 100 },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-industrial text-sm font-bold uppercase tracking-wider text-slate-100">
            Multi-Variable Physical Stress Polygon
          </h3>
          <p className="text-xs text-slate-400">
            Normalized sensor stress vector ({machine.id})
          </p>
        </div>
        <span className="text-xs font-mono-data text-cyan-400">
          Stress: {Math.max(tempStress, vibStress, currStress)}% Max
        </span>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 9 }} />
            <Radar
              name={machine.id}
              dataKey="A"
              stroke={machine.status === 'critical' ? '#f43f5e' : machine.status === 'high' ? '#f97316' : '#06b6d4'}
              fill={machine.status === 'critical' ? '#f43f5e' : machine.status === 'high' ? '#f97316' : '#06b6d4'}
              fillOpacity={0.4}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs font-mono-data">
        <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">MTBF EST</span>
          <span className="text-slate-200 font-bold">
            {machine.status === 'critical' ? '6.2 hrs' : '3,840 hrs'}
          </span>
        </div>
        <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">AVAILABILITY</span>
          <span className="text-emerald-400 font-bold">98.4%</span>
        </div>
        <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">ANOMALY FREQ</span>
          <span className="text-cyan-400 font-bold">0.04 /day</span>
        </div>
      </div>
    </div>
  );
};
