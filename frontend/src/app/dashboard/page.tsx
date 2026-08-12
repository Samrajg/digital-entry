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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-500 space-y-3">
          <Activity className="w-8 h-8 text-blue-950 animate-spin mx-auto" />
          <p className="text-sm font-medium">Verifying session...</p>
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Dark Blue Header Navbar */}
      <header className="border-b border-blue-900/30 bg-blue-950 text-white sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="mr-1">
            <img
              src="/digilogo.png"
              alt="Digital Entry Logo"
              className="h-10 w-auto object-contain filter drop-shadow-sm"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Digital Entry</h1>
            <p className="text-blue-300 text-xs uppercase tracking-wider">Visitor System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-900/50 border border-blue-800/40 rounded-xl text-xs text-white">
            <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">{currentUser.username}</span>
            <span className="px-1.5 py-0.5 bg-cyan-400/20 text-cyan-300 rounded-md text-[10px] uppercase font-bold">
              {currentUser.user_role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-200 border border-red-800/20 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Dark Blue Banner Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border border-blue-900/40 p-8 shadow-lg mb-8 text-white">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-1">Authenticated Portal</p>
              <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                {getRoleTitle(currentUser.user_role)}
              </h2>
              <p className="text-slate-300 max-w-xl text-sm">
                Welcome back, {currentUser.username}! You are signed in with the system role permission of <span className="text-white font-semibold">{currentUser.user_role}</span>.
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="p-4 bg-slate-950/40 border border-slate-800/40 rounded-xl flex items-center gap-3">
                <Database className="w-5 h-5 text-slate-300" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">User ID</p>
                  <p className="text-sm font-bold text-slate-100">#{currentUser.user_id}</p>
                </div>
              </div>
              <div className="p-4 bg-slate-950/40 border border-slate-800/40 rounded-xl flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-300" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">System Date</p>
                  <p className="text-sm font-bold text-slate-100">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Light Gray Panel Container */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600 min-h-[300px] flex flex-col justify-center items-center shadow-sm">
          <Shield className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Ready for Feature Deployment</h3>
          <p className="text-sm text-slate-500 max-w-md">
            This is the initial authenticated portal shell. Next phases will deploy core workflows, logging databases, and visual modules corresponding to your role permissions.
          </p>
        </section>

      </main>
    </div>
  );
}
