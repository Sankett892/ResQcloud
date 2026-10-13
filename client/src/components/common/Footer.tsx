import React from 'react';
import { Shield, Info, AlertTriangle, Radio } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Shield className="w-5 h-5 text-red-500" />
              <span>ResQCloud — Disaster Management & Resilient Emergency Platform</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
              Designed to bridge critical communication gaps during catastrophic natural disasters when cellular networks experience partial or total outages. Built with client-side offline storage, bounded exponential retry synchronization, and conceptual multi-hop store-and-forward delay-tolerant relay models.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Academic Prototype: For educational review & demonstration only. In a real life-threatening emergency, dial 112 immediately.</span>
            </div>
          </div>

          <div>
            <h4 className="text-slate-200 font-semibold mb-2.5 uppercase tracking-wider text-[11px]">
              System Components
            </h4>
            <ul className="space-y-1.5">
              <li>Citizen SOS Dispatch Portal</li>
              <li>IndexedDB Resilient Offline Store</li>
              <li>Rescue Team Tactical Command</li>
              <li>Interactive Pune GIS Disaster Map</li>
              <li>Multi-Hop DTN Relay Simulator</li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-semibold mb-2.5 uppercase tracking-wider text-[11px]">
              Demonstration Scope
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Sample incidents are mapped across Pune Metropolitan Region (Hinjawadi, Kharadi, Hadapsar, Sinhagad Road, Kothrud, Pimpri). All demonstration accounts are seeded for evaluator testing.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} ResQCloud Project. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-cyan-500" />
              Store-and-Forward Capable
            </span>
            <span>PostgreSQL & SQLite Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
