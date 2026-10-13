import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Radio,
  WifiOff,
  MapPin,
  Flame,
  Activity,
  HeartPulse,
  Waves,
  Building2,
  MountainSnow,
  CloudLightning,
  AlertOctagon,
  ArrowRight,
  Database,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const disasterCategories = [
    { type: 'FLOOD', title: 'Flood & Inundation', icon: Waves, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200' },
    { type: 'EARTHQUAKE', title: 'Earthquake Tremors', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { type: 'FIRE', title: 'Urban & Wildfire', icon: Flame, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
    { type: 'LANDSLIDE', title: 'Landslide & Rockfall', icon: MountainSnow, color: 'text-amber-800', bg: 'bg-stone-50 border-stone-200' },
    { type: 'MEDICAL_EMERGENCY', title: 'Medical Crisis', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50 border-rose-200' },
    { type: 'BUILDING_COLLAPSE', title: 'Structural Collapse', icon: Building2, color: 'text-stone-700', bg: 'bg-stone-50 border-stone-200' },
    { type: 'SEVERE_WEATHER', title: 'Severe Cyclone/Storm', icon: CloudLightning, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
    { type: 'OTHER', title: 'General Hazard', icon: AlertOctagon, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(239,68,68,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-600/20 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-4 h-4" />
            <span>DISASTER MANAGEMENT & RESILIENT COMMUNICATION PLATFORM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            When Every Second Matters, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-amber-300">
              Every Emergency Report Counts.
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            ResQCloud connects emergency reporting, tactical disaster mapping, and rescue coordination through a centralized platform architected to maintain data integrity across unreliable network conditions.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/citizen"
              className="px-6 py-3.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50 hover:shadow-red-600/40 active:scale-95 transition flex items-center gap-2"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Report an Emergency (Citizen SOS)</span>
            </Link>

            <Link
              to="/rescue/dashboard"
              className="px-6 py-3.5 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600 active:scale-95 transition flex items-center gap-2"
            >
              <span>Rescue Team Command Desk</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/rescue/relay-simulator"
              className="px-6 py-3.5 rounded-xl text-sm font-bold bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800 transition flex items-center gap-2"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Launch Relay Simulator</span>
            </Link>
          </div>

          {/* Key capability tags */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>IndexedDB Offline Persistence</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Idempotent Synchronization</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Socket.IO Real-Time Dispatch</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pune Region Demonstration GIS</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Core Challenge Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-sm">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
              The Disaster Communication Dilemma
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 mb-4">
              Why Traditional Emergency Reporting Fails During Disasters
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              During massive floods, severe storms, landslides, or earthquakes, primary cellular towers lose power and internet routing collapses. Conventional web portals drop data when the user loses connection during form submission. ResQCloud was built from the ground up to solve this single fatal bottleneck.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <WifiOff className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Zero-Loss Offline Buffering</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If the citizen loses cellular signal, their emergency report is encrypted and saved into browser IndexedDB with a unique client UUID. Nothing is discarded.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Idempotent Synchronization</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                As soon as any connection returns, bounded retry logic pushes pending reports to the backend. Duplicate transmissions are recognized without creating duplicate tickets.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Real-Time Rescue GIS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rescue operators immediately see incoming incidents plotted on an interactive map with severity coding, people trapped indicators, and rapid dispatch workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Disaster Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
            Standardized Incident Triage
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Supported Disaster Categories
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Each category is mapped to dedicated response protocols, medical flags, and rescue assignment pipelines.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {disasterCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.type}
                className={`p-4 rounded-xl border ${cat.bg} hover:shadow-md transition text-left flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-7 h-7 ${cat.color}`} />
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {cat.type}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{cat.title}</h3>
                  <Link
                    to={`/citizen?type=${cat.type}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-red-600 mt-2 transition"
                  >
                    <span>Report this &rarr;</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Technical Transparency & Relay Simulation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-8 md:p-10 border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                <Radio className="w-3.5 h-3.5" />
                <span>TECHNICAL TRANSPARENCY & RELAY SIMULATOR</span>
              </div>
              <h2 className="text-2xl font-bold text-white">
                Genuine Offline Storage + Multi-Hop Forwarding Simulator
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                A browser cannot magically transmit packets over the air to a cloud server without an actual communication link. ResQCloud implements <strong>actual, verified browser IndexedDB persistence</strong> for the disconnected user.
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Separately, we provide an interactive <strong>Multi-Hop Message-Relay Simulator</strong> that visually models how peer-to-peer delay-tolerant store-and-forward hops (via volunteer mobile devices or rescue vehicles) transport an SOS to the nearest internet gateway.
              </p>
              <div className="pt-2">
                <Link
                  to="/rescue/relay-simulator"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-md shadow-cyan-900/50"
                >
                  <Radio className="w-4 h-4" />
                  <span>Open Interactive Relay Simulator</span>
                </Link>
              </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="text-slate-400 text-[11px] border-b border-slate-800 pb-2 flex justify-between">
                <span>SIMULATION PARAMETERS</span>
                <span className="text-cyan-400">DEMO MODE</span>
              </div>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span>Client Storage:</span>
                  <span className="text-emerald-400">IndexedDB (Active)</span>
                </div>
                <div className="flex justify-between">
                  <span>Sync Policy:</span>
                  <span className="text-emerald-400">Bounded Exponential Backoff</span>
                </div>
                <div className="flex justify-between">
                  <span>Server Receipts:</span>
                  <span className="text-emerald-400">Idempotent UUID Check</span>
                </div>
                <div className="flex justify-between">
                  <span>DTN Topology:</span>
                  <span className="text-cyan-400">Synthetic 4-Hop Graph</span>
                </div>
              </div>
              <div className="p-3 rounded bg-slate-900 text-[11px] text-slate-400 leading-normal border border-slate-800">
                Note: In production hardware deployments, physical BLE or Wi-Fi Aware ad-hoc daemon layers would manage neighbor discovery. The simulation models this protocol visually.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
