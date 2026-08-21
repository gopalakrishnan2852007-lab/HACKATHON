import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MachineStatus, RiskLevel, AlertSeverity, AlertStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(val: number | undefined | null, decimals = 1): string {
  if (val === undefined || val === null || isNaN(val)) return '--';
  return Number(val).toFixed(decimals);
}

export function formatPercentage(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0%';
  // If probability is 0 to 1, multiply by 100
  const normalized = val <= 1 && val > 0 ? val * 100 : val;
  return `${Math.round(normalized)}%`;
}

export function getStatusTheme(status: MachineStatus | string) {
  switch (status?.toLowerCase()) {
    case 'healthy':
      return {
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
        glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
        label: 'HEALTHY',
      };
    case 'warning':
      return {
        bg: 'bg-amber-950/40',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
        glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
        label: 'WARNING',
      };
    case 'high':
      return {
        bg: 'bg-orange-950/40',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
        dot: 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]',
        glow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]',
        label: 'HIGH RISK',
      };
    case 'critical':
      return {
        bg: 'bg-rose-950/40',
        border: 'border-rose-500/40',
        text: 'text-rose-400',
        badge: 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse',
        dot: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)] animate-ping',
        glow: 'hover:shadow-[0_0_25px_rgba(225,29,72,0.25)]',
        label: 'CRITICAL',
      };
    default:
      return {
        bg: 'bg-slate-900/40',
        border: 'border-slate-700/30',
        text: 'text-slate-400',
        badge: 'bg-slate-800 text-slate-300 border-slate-700',
        dot: 'bg-slate-400',
        glow: '',
        label: 'UNKNOWN',
      };
  }
}

export function getRiskLevelBadge(level: RiskLevel | string) {
  switch (level?.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-rose-500/20 text-rose-400 border border-rose-500/40';
    case 'HIGH':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/40';
    case 'MEDIUM':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
    case 'LOW':
    default:
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
  }
}

export function getSeverityBadge(severity: AlertSeverity | string) {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-rose-900/50 text-rose-300 border border-rose-600/50 font-semibold';
    case 'HIGH':
      return 'bg-orange-900/50 text-orange-300 border border-orange-600/50';
    case 'WARNING':
      return 'bg-amber-900/50 text-amber-300 border border-amber-600/50';
    case 'INFO':
    default:
      return 'bg-cyan-900/50 text-cyan-300 border border-cyan-600/50';
  }
}

export function getAlertStatusBadge(status: AlertStatus | string) {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse';
    case 'ACKNOWLEDGED':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'RESOLVED':
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    default:
      return 'bg-slate-800 text-slate-400 border border-slate-700';
  }
}

export function timeAgo(isoDateString: string | undefined): string {
  if (!isoDateString) return 'Just now';
  const date = new Date(isoDateString);
  const now = new Date();
  const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSec < 5) return 'just now';
  if (diffInSec < 60) return `${diffInSec}s ago`;
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return date.toLocaleDateString();
}
