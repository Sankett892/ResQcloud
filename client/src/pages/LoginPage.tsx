import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { ShieldAlert, Lock, Mail, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      if (user.role === 'RESCUE_OPERATOR' || user.role === 'ADMIN') {
        navigate('/rescue/dashboard');
      } else {
        navigate('/citizen');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Faculty Demo Credentials
  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 mx-auto flex items-center justify-center shadow-lg shadow-red-900/40 text-white">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign in to ResQCloud
          </h1>
          <p className="text-xs text-slate-500">
            Access citizen emergency dispatch or rescue operational command desk.
          </p>
        </div>

        {/* 1-Click Demo Evaluation Autofill Panel */}
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-md space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              Faculty Review Demo Accounts
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">1-CLICK LOGIN</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillDemoAccount('operator@resqcloud.org', 'Operator@123')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition"
            >
              <div className="font-bold text-white text-[11px]">Rescue Operator</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">operator@resqcloud.org</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('citizen@resqcloud.org', 'Citizen@123')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-left border border-slate-700 transition"
            >
              <div className="font-bold text-white text-[11px]">Citizen Reporter</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">citizen@resqcloud.org</div>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 active:scale-[0.99] transition shadow-md shadow-red-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Need a citizen account?{' '}
            <Link to="/register" className="font-bold text-red-600 hover:text-red-700">
              Create citizen registration &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
