'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Calendar, Activity, Database } from 'lucide-react';
import { User } from '@/services/authService';
import Navbar from '@/app/components/Navbar';

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
      <Navbar currentUser={currentUser} />

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
          <Shield className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Gate & Campus Operations</h3>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Access the campus directory to manage buildings, entrances, and print visitor check-in QR passes.
          </p>
          <Link
            href="/dashboard/campuses"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 border border-blue-800/50 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all active:scale-95"
          >
            <span>Manage Campuses & Gates</span>
          </Link>
        </section>

      </main>
    </div>
  );
}
