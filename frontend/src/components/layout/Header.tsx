import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Radio, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Info
} from 'lucide-react';
import { useFactoryData } from '../../hooks/useFactoryData';
import { cn, formatPercentage } from '../../lib/utils';

interface HeaderProps {
  onNavigateToAlerts?: () => void;
  onNavigateToSimulator?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateToAlerts, onNavigateToSimulator }) => {
  const { metrics, isLiveStreaming, toggleLiveStream, supabaseStatus, backendStatus, alerts } = useFactoryData();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const criticalAlertsCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Industrial Title */}
          <div className="flex items-center space-x-3.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-industrial text-lg font-bold tracking-wider text-slate-100 uppercase">
                  AIoT Command Center
                </span>
                <span className="text-[10px] font-mono-data px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold">
                  v2.4-PROD
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <span>Autonomous Machine Health & Predictive Analytics</span>
              </p>
            </div>
          </div>

          {/* Center: Live Stream & Factory Health Telemetry Gauge */}
          <div className="hidden lg:flex items-center space-x-6 border-x border-slate-800/60 px-6">
            
            {/* Live Indicator */}
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => toggleLiveStream()}
                className={cn(
                  "flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono-data font-semibold transition-all border",
                  isLiveStreaming 
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200"
                )}
                title="Toggle Realtime Sensor Ingestion Stream"
              >
                {isLiveStreaming ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>LIVE STREAM</span>
                    <Radio className="w-3 h-3 ml-0.5 text-emerald-400" />
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-slate-400" />
                    <span>STREAM PAUSED</span>
                  </>
                )}
              </button>
            </div>

            {/* Ingestion Rate */}
            <div className="text-left">
              <span className="text-[10px] uppercase font-mono-data text-slate-400 tracking-wider block">
                INGESTION RATE
              </span>
              <span className="text-xs font-mono-data font-semibold text-cyan-300 flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                {metrics.ingestRatePerSec} msg/sec
              </span>
            </div>

            {/* Overall Plant Health Score */}
            <div className="text-left flex items-center space-x-2.5">
              <div>
                <span className="text-[10px] uppercase font-mono-data text-slate-400 tracking-wider block">
                  PLANT HEALTH
                </span>
                <span className={cn(
                  "text-sm font-mono-data font-bold",
                  metrics.overallHealthScore >= 80 ? "text-emerald-400" :
                  metrics.overallHealthScore >= 60 ? "text-amber-400" : "text-rose-400"
                )}>
                  {metrics.overallHealthScore}%
                </span>
              </div>
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    metrics.overallHealthScore >= 80 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" :
                    metrics.overallHealthScore >= 60 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" :
                    "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                  )}
                  style={{ width: `${metrics.overallHealthScore}%` }}
                />
              </div>
            </div>

          </div>

          {/* Right: Alarms Badge, System Status, Clock */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Demo Simulator CTA */}
            {onNavigateToSimulator && (
              <button
                onClick={onNavigateToSimulator}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold font-industrial tracking-wider transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)]"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>INJECT ANOMALY</span>
              </button>
            )}

            {/* Active Alarms Button */}
            <button
              onClick={onNavigateToAlerts}
              className={cn(
                "relative flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border",
                criticalAlertsCount > 0
                  ? "bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse"
                  : metrics.activeAlerts > 0
                  ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600"
              )}
            >
              <ShieldAlert className={cn("w-4 h-4", criticalAlertsCount > 0 ? "text-rose-400" : "text-amber-400")} />
              <span className="font-mono-data">{metrics.activeAlerts}</span>
              <span className="hidden md:inline">ALERTS</span>
            </button>

            {/* Connection Status Button */}
            <button
              onClick={() => setShowStatusModal(!showStatusModal)}
              className={cn(
                "flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors",
                backendStatus.available
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-900/90 text-amber-300 border-amber-500/40"
              )}
              title="System Connectivity Info"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono-data hidden xl:inline text-[11px]">
                {backendStatus.available ? "CONNECTED" : "BACKEND OFFLINE"}
              </span>
              <span className={cn(
                "w-2 h-2 rounded-full",
                backendStatus.available ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              )} />
            </button>

            {/* Realtime UTC Clock */}
            <div className="hidden sm:flex flex-col text-right font-mono-data text-xs border-l border-slate-800 pl-3">
              <span className="text-slate-200 font-semibold">{currentTime}</span>
              <span className="text-[10px] text-slate-500">SYSTEM TIME</span>
            </div>

          </div>

        </div>
      </div>

      {/* System Status Dropdown Modal */}
      {showStatusModal && (
        <div className="absolute right-4 top-16 w-80 bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-industrial flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              System Architecture Status
            </h4>
            <button 
              onClick={() => setShowStatusModal(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Backend API:</span>
              <span className={cn(
                "font-mono-data font-semibold px-1.5 py-0.5 rounded text-[10px]",
                backendStatus.available 
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800" 
                  : "bg-amber-950 text-amber-400 border border-amber-800"
              )}>
                {backendStatus.available ? `CONNECTED (${backendStatus.url})` : `OFFLINE (${backendStatus.url})`}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Supabase Realtime:</span>
              <span className={cn(
                "font-mono-data font-semibold px-1.5 py-0.5 rounded text-[10px]",
                supabaseStatus.configured 
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800" 
                  : "bg-cyan-950 text-cyan-400 border border-cyan-800"
              )}>
                {supabaseStatus.configured ? "CONNECTED (REALTIME)" : "STANDALONE (HTTP POLLING)"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">IoT Telemetry Rate:</span>
              <span className="font-mono-data text-cyan-300 font-semibold">
                {metrics.ingestRatePerSec} reads/s
              </span>
            </div>
            
            <p className="text-[10px] text-slate-400 italic pt-1">
              Supports live database streaming via Supabase and REST API endpoints at http://localhost:5000. Real-time failure prediction model active.
            </p>
          </div>
        </div>
      )}
    </header>
  );
};
