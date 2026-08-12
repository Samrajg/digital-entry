'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogOut, User as UserIcon, Calendar, Activity, Database } from 'lucide-react';
import { User } from '@/services/authService';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setCurrentUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('user');
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (isChecking || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-slate-400 space-y-3">
          <Activity className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
          <p className="text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Get capitalized role name for dashboard header
  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin Dashboard';
      case 'security':
        return 'Security Dashboard';
      case 'supervisor':
        return 'Supervisor Dashboard';
      case 'manager':
        return 'Manager Dashboard';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Digital Entry</h1>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Visitor System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-xl text-xs">
            <UserIcon className="w-3.5 h-3.5 text-cyan-500" />
            <span className="font-medium text-slate-300">{currentUser.username}</span>
            <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-md text-[10px] uppercase font-bold">
              {currentUser.user_role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Banner Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-8 shadow-xl mb-8">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-1">Authenticated Portal</p>
              <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                {getRoleTitle(currentUser.user_role)}
              </h2>
              <p className="text-slate-400 max-w-xl text-sm">
                Welcome back, {currentUser.username}! You are signed in with the system role permission of <span className="text-slate-300 font-semibold">{currentUser.user_role}</span>.
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center gap-3">
                <Database className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">User ID</p>
                  <p className="text-sm font-bold text-slate-200">#{currentUser.user_id}</p>
                </div>
              </div>
              <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">System Date</p>
                  <p className="text-sm font-bold text-slate-200">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section Placeholder */}
        <section className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-400 min-h-[300px] flex flex-col justify-center items-center">
          <Shield className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-300 mb-1">Ready for Feature Deployment</h3>
          <p className="text-sm text-slate-500 max-w-md">
            This is the initial authenticated portal shell. Next phases will deploy core workflows, logging databases, and visual modules corresponding to your role permissions.
          </p>
        </section>

      </main>
    </div>
  );
}
