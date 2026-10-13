import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  AlertCircle,
  Map,
  History,
  BarChart3,
  Radio,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';

export const RescueSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', to: '/rescue/dashboard', icon: LayoutDashboard },
    { name: 'Live Incidents', to: '/rescue/incidents', icon: AlertCircle },
    { name: 'Disaster Map', to: '/rescue/map', icon: Map },
    { name: 'Incident History', to: '/rescue/history', icon: History },
    { name: 'Emergency Analytics', to: '/rescue/analytics', icon: BarChart3 },
    { name: 'Offline Relay Simulator', to: '/rescue/relay-simulator', icon: Radio },
    { name: 'System Settings', to: '/rescue/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center font-bold">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-white tracking-wide uppercase">
            Rescue Command
          </div>
          <div className="text-[11px] text-slate-400">Tactical Control Desk</div>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-red-600/15 text-red-400 border border-red-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User profile footer in sidebar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <div className="truncate mr-2">
            <div className="text-xs font-bold text-white truncate">{user?.name}</div>
            <div className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</div>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-900/50 text-blue-300 border border-blue-800">
            {user?.role}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/60 transition border border-rose-900/30"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
};
