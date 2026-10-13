import React from 'react';
import { SeverityLevel } from '../../types/index.js';
import { Flame, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const isSm = size === 'sm';
  const padding = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (severity) {
    case 'CRITICAL':
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-md bg-red-600 text-white shadow-sm shadow-red-200 beacon-critical ${padding}`}>
          <Flame className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          CRITICAL
        </span>
      );
    case 'HIGH':
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-md bg-orange-500 text-white shadow-sm shadow-orange-100 ${padding}`}>
          <AlertTriangle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          HIGH
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-amber-400 text-amber-950 shadow-sm shadow-amber-100 ${padding}`}>
          <AlertCircle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          MEDIUM
        </span>
      );
    case 'LOW':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-blue-500 text-white shadow-sm shadow-blue-100 ${padding}`}>
          <Info className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          LOW
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-md bg-slate-200 text-slate-800 ${padding}`}>
          {severity}
        </span>
      );
  }
};
