'use client';

import { useAuth } from '../../context/AuthContext';
import AuthGuard from '../../components/AuthGuard';
import { LogOut, User, Mail, ShieldCheck, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500 mt-1">Welcome back to your secure portal</p>
            </div>
            <button 
              onClick={handleLogout}
              className="group flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
            >
              <LogOut size={18} className="group-hover:text-red-500 transition-colors" />
              Sign out
            </button>
          </div>

          {/* User Profile Card */}
          <div className="glass-card mb-8">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                  <ShieldCheck size={16} className="text-green-500" />
                  Authenticated User
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Mail size={16} /> Email Address
                </div>
                <div className="font-medium text-slate-900">{user?.email}</div>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <User size={16} /> User ID
                </div>
                <div className="font-medium text-slate-900 font-mono text-sm truncate" title={user?.id}>
                  {user?.id}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Clock size={16} /> Account Created
                </div>
                <div className="font-medium text-slate-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Security Info Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary-500" />
              Active Security Features
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                <p className="text-sm text-slate-600"><strong>JWT Access Token</strong> (short-lived in memory, auto-refreshes seamlessly behind the scenes)</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                <p className="text-sm text-slate-600"><strong>HttpOnly Cookie</strong> (securely stores refresh token, invisible to JavaScript)</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                <p className="text-sm text-slate-600"><strong>Route Guards</strong> (redirects unauthenticated users automatically)</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                <p className="text-sm text-slate-600"><strong>Redis Token Blacklist</strong> (logging out instantly revokes all active tokens)</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
