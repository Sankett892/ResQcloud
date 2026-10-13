import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useOffline } from '../../context/OfflineContext.js';
import {
  ShieldAlert,
  Radio,
  MapPin,
  BarChart3,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Wifi,
  WifiOff,
  Compass,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isOnline, pendingCount } = useOffline();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isRescueOperator = user?.role === 'RESCUE_OPERATOR' || user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-900/40 group-hover:scale-105 transition">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight flex items-center gap-1.5">
                <span>ResQCloud</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-600/30 text-red-400 border border-red-500/30">
                  DISASTER OPS
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono tracking-wider">
                RESILIENT EMERGENCY PLATFORM
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                location.pathname === '/'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-850 hover:text-white'
              }`}
            >
              Home
            </Link>

            <Link
              to="/citizen"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                location.pathname.startsWith('/citizen')
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-850 hover:text-white'
              }`}
            >
              Citizen SOS Portal
            </Link>

            {isRescueOperator && (
              <>
                <Link
                  to="/rescue/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/rescue/dashboard'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                  }`}
                >
                  Command Dashboard
                </Link>

                <Link
                  to="/rescue/map"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/rescue/map'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                  }`}
                >
                  Disaster Map
                </Link>
              </>
            )}

            <Link
              to="/rescue/relay-simulator"
              className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                location.pathname === '/rescue/relay-simulator'
                  ? 'bg-slate-800 text-cyan-400'
                  : 'text-cyan-300 hover:bg-slate-850 hover:text-cyan-200'
              }`}
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Relay Simulator</span>
            </Link>
          </nav>

          {/* Right Header Status & User Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Online / Offline status badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isOnline
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950/60 text-amber-400 border-amber-800'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-200 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-900/60 text-purple-300 border border-purple-700'
                          : user.role === 'RESCUE_OPERATOR'
                          ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-md text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-900/50 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Home
          </Link>
          <Link
            to="/citizen"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Citizen SOS Portal
          </Link>
          {isRescueOperator && (
            <>
              <Link
                to="/rescue/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800"
              >
                Command Dashboard
              </Link>
              <Link
                to="/rescue/map"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:bg-slate-800"
              >
                Disaster Map
              </Link>
            </>
          )}
          <Link
            to="/rescue/relay-simulator"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-cyan-300 hover:bg-slate-800"
          >
            Relay Simulator
          </Link>

          <div className="pt-3 border-t border-slate-800">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{user.name}</div>
                  <div className="text-xs text-slate-400">{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded bg-slate-800 text-xs font-semibold text-rose-400"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded bg-slate-800 text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded bg-red-600 text-sm font-bold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
