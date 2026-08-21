import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Thermometer, Waves, Zap, RotateCw, Activity, Heart, ShieldAlert } from 'lucide-react';
import { Machine, TelemetryPoint } from '../../types';
import { apiService } from '../../services/api';
import { cn } from '../../lib/utils';

interface MachineTelemetryChartsProps {
  machine: Machine;
}

type ChartMetric = 'temperature' | 'vibration' | 'current' | 'rpm' | 'health_risk';

export const MachineTelemetryCharts: React.FC<MachineTelemetryChartsProps> = ({ machine }) => {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>('temperature');
  const [timeRange, setTimeRange] = useState<number>(24);
  const [data, setData] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    apiService.getMachineHistory(machine.id, timeRange).then((history) => {
      if (isMounted) {
        // Ensure last data point matches latest live telemetry of machine
        if (history.length > 0) {
          const last = history[history.length - 1];
          last.temperature = machine.temperature;
          last.vibration = machine.vibration;
          last.current = machine.current;
          last.rpm = machine.rpm;
          last.health_score = machine.health_score;
          last.failure_probability = Math.round(machine.failure_probability * 100);
        }
        setData(history);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [machine.id, machine.temperature, machine.vibration, machine.current, machine.rpm, timeRange]);

  const metricsConfig = {
    temperature: {
      label: 'Temperature',
      unit: '°C',
      icon: Thermometer,
      stroke: '#f59e0b',
      fill: 'rgba(245, 158, 11, 0.15)',
      dataKey: 'temperature',
      warnThreshold: machine.thresholds?.temp_warn || 65,
      critThreshold: machine.thresholds?.temp_crit || 85,
    },
    vibration: {
      label: 'Vibration RMS',
      unit: 'mm/s',
      icon: Waves,
      stroke: '#ec4899',
      fill: 'rgba(236, 72, 153, 0.15)',
      dataKey: 'vibration',
      warnThreshold: machine.thresholds?.vib_warn || 3.5,
      critThreshold: machine.thresholds?.vib_crit || 6.0,
    },
    current: {
      label: 'Phase Current',
      unit: 'A',
      icon: Zap,
      stroke: '#06b6d4',
      fill: 'rgba(6, 182, 212, 0.15)',
      dataKey: 'current',
      warnThreshold: machine.thresholds?.current_warn || 25,
      critThreshold: machine.thresholds?.current_crit || 35,
    },
    rpm: {
      label: 'Shaft Speed',
      unit: 'RPM',
      icon: RotateCw,
      stroke: '#8b5cf6',
      fill: 'rgba(139, 92, 246, 0.15)',
      dataKey: 'rpm',
      warnThreshold: machine.thresholds?.rpm_max || 3600,
      critThreshold: (machine.thresholds?.rpm_max || 3600) * 1.15,
    },
    health_risk: {
      label: 'Health & Risk Index',
      unit: '%',
      icon: Heart,
      stroke: '#10b981',
      fill: 'rgba(16, 185, 129, 0.15)',
      dataKey: 'health_score',
      warnThreshold: 60,
      critThreshold: 40,
    },
  };

  const currentConfig = metricsConfig[activeMetric];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono-data">
          <p className="text-slate-400 font-semibold mb-1">{payload[0].payload.timeLabel || label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={`item-${index}`} style={{ color: entry.color }} className="font-bold">
                {entry.name}: {entry.value} {entry.name === 'Health Score' || entry.name === 'Failure Probability' ? '%' : currentConfig.unit}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
      
      {/* Chart Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
        
        {/* Metric Selector Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {(Object.keys(metricsConfig) as ChartMetric[]).map((key) => {
            const cfg = metricsConfig[key];
            const Icon = cfg.icon;
            const isSelected = activeMetric === key;

            return (
              <button
                key={key}
                onClick={() => setActiveMetric(key)}
                className={cn(
                  "flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border",
                  isSelected
                    ? "bg-slate-800 text-slate-100 border-slate-600 shadow-sm"
                    : "bg-slate-950/40 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:bg-slate-900"
                )}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.stroke }} />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-1 self-end sm:self-auto bg-slate-950 p-1 rounded-lg border border-slate-800">
          {[
            { label: '1H', value: 1 },
            { label: '6H', value: 6 },
            { label: '24H', value: 24 },
            { label: '7D', value: 168 },
          ].map((range) => (
            <button
              key={range.label}
              onClick={() => setTimeRange(range.value)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-mono-data font-bold rounded transition-colors",
                timeRange === range.value
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {range.label}
            </button>
          ))}
        </div>

      </div>

      {/* Main Chart Area */}
      <div className="h-[280px] w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500 font-mono-data text-xs">
            Ingesting historical telemetry points...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeMetric === 'health_risk' ? (
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Healthy Baseline', fill: '#10b981', fontSize: 10 }} />
                <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical Threshold', fill: '#ef4444', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="health_score"
                  name="Health Score"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="failure_probability"
                  name="Failure Probability"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2 }}
                />
              </LineChart>
            ) : (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentConfig.stroke} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={currentConfig.stroke} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Warning & Critical Reference Threshold Lines */}
                {currentConfig.warnThreshold && (
                  <ReferenceLine
                    y={currentConfig.warnThreshold}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: `Warning (${currentConfig.warnThreshold}${currentConfig.unit})`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
                  />
                )}
                {currentConfig.critThreshold && (
                  <ReferenceLine
                    y={currentConfig.critThreshold}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    label={{ value: `Critical (${currentConfig.critThreshold}${currentConfig.unit})`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                  />
                )}

                <Area
                  type="monotone"
                  dataKey={currentConfig.dataKey}
                  name={currentConfig.label}
                  stroke={currentConfig.stroke}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#gradient-${activeMetric})`}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Threshold and Safety Band Status Banner */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400 font-mono-data">Normal Band</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400 font-mono-data">Warning Band ({currentConfig.warnThreshold}{currentConfig.unit})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-400 font-mono-data">Critical Trip ({currentConfig.critThreshold}{currentConfig.unit})</span>
          </div>
        </div>

        <span className="font-mono-data text-cyan-400 font-semibold text-[11px]">
          Supabase IoT Pipeline: 30-Point Moving Avg
        </span>
      </div>

    </div>
  );
};
