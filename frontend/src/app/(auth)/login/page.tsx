'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { LoginResponse } from '@/types';
import toast from 'react-hot-toast';
import { Loader2, Lock, Mail } from 'lucide-react';
import { ThemePicker } from '@/components/shared/ThemePicker';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('admin@acme-telecom.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const response = (await authApi.login(email, password)) as { data: LoginResponse };
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.firstName}!`);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid credentials. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const demoCredentials = [
    { role: 'Debasu Mukhopadhyay (Admin)', email: 'admin@acme-telecom.com', password: 'Admin@123' },
    { role: 'Program Manager', email: 'pm@acme-telecom.com', password: 'Password@123' },
    { role: 'Project Manager', email: 'pjm@acme-telecom.com', password: 'Password@123' },
    { role: 'Finance', email: 'finance@acme-telecom.com', password: 'Password@123' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── PoC Banner ── */}
      <div className="w-full bg-amber-500 text-amber-950 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold tracking-wide z-50 shrink-0">
        <span>⚠️</span>
        <span>
          INTERNAL DEMONSTRATION ONLY — Proof of Concept (PoC) Build. Not for production or external use.
        </span>
        <span>⚠️</span>
      </div>

      {/* ── Main content row ── */}
      <div className="flex flex-1">

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar-bg flex-col justify-between p-12 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-600/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-xl leading-none">B</span>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">BEATS</p>
            <p className="text-gray-400 text-xs">Business Enablement And Advisory Team</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <div className="inline-block bg-brand-600/20 border border-brand-600/30 rounded-full px-3 py-1 mb-6">
            <span className="text-brand-400 text-xs font-semibold tracking-wide uppercase">PoC Build</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Enterprise Project<br />&amp; Program<br />Management
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            AI-powered platform for BEATS to manage portfolios, programs, and projects with intelligent insights and real-time analytics.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Projects Tracked', value: '2,400+' },
              { label: 'Cost Savings', value: '£48M' },
              { label: 'On-Time Delivery', value: '94%' },
              { label: 'AI Accuracy', value: '99.2%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-xs relative z-10">
          © 2025 BEATS — Business Enablement And Advisory Team. Internal Use Only.
        </p>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">

          {/* Theme picker row */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-400 font-medium">UI Theme</span>
            <ThemePicker variant="dropdown" />
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center">
              <span className="text-white font-black text-lg leading-none">B</span>
            </div>
            <div>
              <p className="text-gray-900 font-bold text-base leading-tight">BEATS</p>
              <p className="text-gray-500 text-xs">PPM Portal · PoC</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
            <p className="text-gray-500 text-sm mb-8">Access your BEATS PPM workspace</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    className="input pl-10"
                    placeholder="you@beats.internal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    className="input pl-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-3 font-medium">Demo accounts (click to fill)</p>
              <div className="space-y-1.5">
                {demoCredentials.map((c) => (
                  <button
                    key={c.email}
                    type="button"
                    onClick={() => { setEmail(c.email); setPassword(c.password); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-gray-50 border border-gray-100 flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-700">{c.role}</span>
                    <span className="text-gray-400">{c.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PoC notice card */}
          <div className="mt-4 flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-amber-500 shrink-0 mt-0.5">⚠️</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-semibold">Internal PoC — Not for external distribution.</span>{' '}
              This platform is a Proof of Concept built for internal demonstration purposes only.
              Data is synthetic. Do not enter real credentials or sensitive information.
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">
            AI PPM Platform · PoC v1.0 · Internal Demonstration Only
          </p>
        </div>
      </div>

      </div>
    </div>
  );
}
