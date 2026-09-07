import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, User as UserIcon, Shield, AlertCircle, ArrowRight, HelpCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useApp();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password) {
      setError('Please provide both User ID and Password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSupportMessage(null);

    const success = await login(userId.trim(), password);
    setLoading(false);

    if (!success) {
      setError('Authentication failed. Please verify your User ID and Password.');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] flex flex-col justify-between text-slate-800 p-4 sm:p-8 font-sans">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between max-w-5xl mx-auto w-full pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center text-white font-bold text-xs tracking-wider">
            OPS
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
              ServiceOps Enterprise
            </h1>
            <p className="text-[11px] text-slate-500">Enterprise Field Operations Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>System Operational</span>
        </div>
      </header>

      {/* Center Auth Container */}
      <main className="max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your enterprise credentials to access your authorized service workspace.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {supportMessage && (
            <div className="mb-5 p-3 rounded-md bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-800">
              <HelpCircle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span>{supportMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="input-login-userid"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="input-login-userid"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enterprise User ID or System ID"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 font-mono transition-colors"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="input-login-password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In to Service Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* IT Help & Security Notice */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2.5 text-[11px] text-slate-500">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Role-Based Access Control</span>
              </span>
              <span className="text-slate-400 font-mono text-[10px]">INTERNAL USE ONLY</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Account locked or need assistance?</span>
              <button
                type="button"
                onClick={() =>
                  setSupportMessage(
                    'For credential assistance or account activation, contact your designated Operations Administrator or IT Support Desk.'
                  )
                }
                className="text-blue-600 hover:underline cursor-pointer bg-transparent border-none p-0 text-[11px]"
              >
                IT Support
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-400 py-4 border-t border-slate-200 max-w-5xl mx-auto w-full">
        ServiceOps Enterprise • Internal Service Operations System • Authorized Corporate Personnel Only
      </footer>
    </div>
  );
};
