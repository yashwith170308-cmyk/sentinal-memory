import React from 'react';
import { AlertCircle, AlertTriangle, ShieldCheck, Info, ShieldAlert } from 'lucide-react';

interface SeverityBadgeProps {
  severity: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const sev = (severity || 'HIGH').toUpperCase();

  const getStyle = () => {
    switch (sev) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/60',
          border: 'border-rose-500/50',
          text: 'text-rose-300',
          icon: ShieldAlert,
          glow: 'shadow-rose-900/30'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-950/60',
          border: 'border-orange-500/50',
          text: 'text-orange-300',
          icon: AlertCircle,
          glow: 'shadow-orange-900/30'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-950/60',
          border: 'border-amber-500/50',
          text: 'text-amber-300',
          icon: AlertTriangle,
          glow: 'shadow-amber-900/30'
        };
      case 'LOW':
        return {
          bg: 'bg-emerald-950/60',
          border: 'border-emerald-500/50',
          text: 'text-emerald-300',
          icon: ShieldCheck,
          glow: 'shadow-emerald-900/30'
        };
      case 'INFORMATIONAL':
      default:
        return {
          bg: 'bg-sky-950/60',
          border: 'border-sky-500/50',
          text: 'text-sky-300',
          icon: Info,
          glow: 'shadow-sky-900/30'
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm font-bold gap-2'
  }[size];

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${style.bg} ${style.border} ${style.text} ${style.glow} ${sizeClasses}`}
    >
      <Icon size={iconSizes} />
      <span>{sev}</span>
    </span>
  );
};
