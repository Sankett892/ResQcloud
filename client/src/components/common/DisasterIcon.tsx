import React from 'react';
import { DisasterType } from '../../types/index.js';
import {
  Waves,
  Activity,
  Flame,
  MountainSnow,
  HeartPulse,
  Building2,
  CloudLightning,
  AlertOctagon,
} from 'lucide-react';

interface DisasterIconProps {
  type: DisasterType | string;
  className?: string;
}

export const DisasterIcon: React.FC<DisasterIconProps> = ({ type, className = 'w-5 h-5' }) => {
  switch (type) {
    case 'FLOOD':
      return <Waves className={`${className} text-blue-500`} />;
    case 'EARTHQUAKE':
      return <Activity className={`${className} text-amber-600`} />;
    case 'FIRE':
      return <Flame className={`${className} text-red-500`} />;
    case 'LANDSLIDE':
      return <MountainSnow className={`${className} text-amber-800`} />;
    case 'MEDICAL_EMERGENCY':
      return <HeartPulse className={`${className} text-rose-500`} />;
    case 'BUILDING_COLLAPSE':
      return <Building2 className={`${className} text-stone-700`} />;
    case 'SEVERE_WEATHER':
      return <CloudLightning className={`${className} text-sky-600`} />;
    case 'OTHER':
    default:
      return <AlertOctagon className={`${className} text-slate-500`} />;
  }
};
