import React from 'react';
import { Cpu, Sparkles, AlertCircle, ArrowUpRight, CheckCircle } from 'lucide-react';
import { useFactoryData } from '../../hooks/useFactoryData';
import { cn, formatPercentage, getRiskLevelBadge } from '../../lib/utils';

interface LiveAIInsightsProps {
  onSelectMachine: (machineId: string) => void;
}

export const LiveAIInsights: React.FC<LiveAIInsightsProps> = ({ onSelectMachine }) => {
  const { machines, getPrediction } = useFactoryData();

  // Find machines with high or warning risk first
  const highRiskMachines = [...machines]
    .sort((a, b) => (b.failure_probability || 0) - (a.failure_probability || 0))
    .slice(0, 3);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <h3 className="font-industrial text-xs font-bold uppercase tracking-wider text-slate-100">
            AI Anomaly & Risk Insights
          </h3>
        </div>
        <span className="text-[10px] font-mono-data text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
          NEURAL ENGINE LIVE
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {highRiskMachines.map((machine) => {
          const pred = getPrediction(machine.id);
          const failurePercent = Math.round(machine.failure_probability * 100);

          return (
            <div
              key={machine.id}
              className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono-data text-xs font-bold text-slate-200">
                    {machine.id}
                  </span>
                  <span className="text-xs text-slate-400 font-medium truncate max-w-[120px]">
                    {machine.name}
                  </span>
                </div>

                <span className={cn("px-1.5 py-0.2 rounded text-[10px] font-mono-data font-bold", getRiskLevelBadge(pred?.risk_level || 'LOW'))}>
                  {pred?.risk_level || 'LOW'} RISK
                </span>
              </div>

              {/* Diagnosis Cause */}
              <div className="mb-2">
                <span className="text-[10px] font-industrial uppercase font-bold text-slate-400 tracking-wide block">
                  AI ROOT CAUSE
                </span>
                <p className="text-xs font-semibold text-slate-200 mt-0.5">
                  {pred?.possible_cause || 'Nominal operating equilibrium'}
                </p>
              </div>

              {/* Recommendation */}
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 mb-2.5">
                <span className="font-bold text-cyan-400 font-industrial text-[10px] uppercase block mb-0.5">
                  AI RECOMMENDATION
                </span>
                <p className="line-clamp-2 leading-relaxed text-slate-400">
                  {pred?.recommendation || 'Maintain standard operational parameters.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono-data">
                <span className="text-slate-400">
                  Confidence: <strong className="text-cyan-300">{pred?.confidence || 96.5}%</strong>
                </span>

                <button
                  onClick={() => onSelectMachine(machine.id)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5 group"
                >
                  <span>Detailed Telemetry</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
