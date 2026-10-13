import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { RescueSidebar } from '../components/rescue/RescueSidebar.js';
import { ShieldAlert, Lock, ArrowRight, UserCheck } from 'lucide-react';

export const RescueLayout: React.FC = () => {
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-semibold text-slate-500">Authenticating Tactical Command...</div>
        </div>
      </div>
    );
  }

  const isOperator = user?.role === 'RESCUE_OPERATOR' || user?.role === 'ADMIN';

  if (!user || !isOperator) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              Rescue Command Access Restricted
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {user
                ? `You are currently authenticated as "${user.name}" with CITIZEN permissions. Rescue coordination and incident state management require RESCUE_OPERATOR or ADMIN authorization.`
                : 'Authentication required. Please log in with authorized rescue operator credentials to access the tactical incident management console.'}
            </p>
          </div>

          {/* Quick Faculty Switch Button */}
          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 text-xs space-y-3">
            <div className="flex items-center justify-center gap-1.5 font-bold text-cyan-300">
              <UserCheck className="w-4 h-4" />
              <span>Faculty Demonstration Mode</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-normal">
              Click below to switch immediately into the seeded demonstration Rescue Operator session:
            </p>
            <button
              onClick={async () => {
                await login('operator@resqcloud.org', 'Operator@123');
              }}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-sm"
            >
              Log In as Demo Rescue Operator
            </button>
          </div>

          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <span>Or sign in manually with custom credentials &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-100">
      <RescueSidebar />
      <div className="flex-1 p-6 overflow-y-auto max-w-7xl">
        <Outlet />
      </div>
    </div>
  );
};
