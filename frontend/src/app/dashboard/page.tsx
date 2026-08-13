'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Calendar, Activity, Database, Users, Truck, LogIn, ChevronRight, PieChart as PieChartIcon, Loader2 } from 'lucide-react';
import { User } from '@/services/authService';
import Navbar from '@/app/components/Navbar';
import { apiClient } from '@/services/apiClient';
import { useTheme } from '@/app/components/ThemeProvider';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (currentUser) {
      fetchAnalytics();
    }
  }, [currentUser]);

  const fetchAnalytics = async () => {
    try {
      const res = await apiClient.get('/api/analytics/overview');
      setAnalytics(res.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load analytics.');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  if (isChecking || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center text-slate-500 dark:text-slate-400 space-y-3">
          <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto" />
          <p className="text-sm font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin Dashboard';
      case 'security': return 'Security Dashboard';
      case 'supervisor': return 'Supervisor Dashboard';
      case 'manager': return 'Manager Dashboard';
      default: return 'Dashboard';
    }
  };

  // Dynamic Chart Colors
  const chartTextColor = isDark ? '#94a3b8' : '#64748b'; // slate-400 vs slate-500
  const gridColor = isDark ? '#334155' : '#e2e8f0'; // slate-700 vs slate-200
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'; // slate-800 vs white
  const tooltipBorder = isDark ? 'none' : 'none';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a'; // slate-50 vs slate-900

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 md:pb-12 transition-colors duration-300">
      <Navbar currentUser={currentUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
        
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-blue-800/40 dark:border-slate-800 p-6 sm:p-8 shadow-lg text-white transition-colors duration-300">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-cyan-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-cyan-300 dark:text-blue-400 text-xs font-semibold uppercase tracking-widest mb-1">Authenticated Portal</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                {getRoleTitle(currentUser.user_role)}
              </h2>
              <p className="text-blue-100 dark:text-slate-300 max-w-xl text-sm leading-relaxed">
                Welcome back, {currentUser.username}! You are signed in with the system role permission of <span className="text-white font-semibold">{currentUser.user_role}</span>.
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="p-3 sm:p-4 bg-black/20 border border-white/10 rounded-xl flex items-center gap-3 backdrop-blur-sm">
                <Calendar className="w-5 h-5 text-blue-200 hidden sm:block" />
                <div>
                  <p className="text-[10px] text-blue-200/80 uppercase font-semibold">System Date</p>
                  <p className="text-sm font-bold text-white">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loadingAnalytics ? (
          <div className="flex justify-center items-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        ) : error || !analytics ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-red-500 font-medium shadow-sm transition-colors duration-300">
            {error || 'No data available'}
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4 transition-colors duration-300">
                <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-1">Active Visitors</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {analytics.stats.active_visitors}
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      / {analytics.stats.today_visitors} Today
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4 transition-colors duration-300">
                <div className="p-2 sm:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-1">Active Vehicles</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    {analytics.stats.active_vehicles}
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      / {analytics.stats.today_vehicles} Today
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4 transition-colors duration-300">
                <div className="p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-1">Active Gates</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{analytics.stats.active_gates}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4 transition-colors duration-300">
                <div className="p-2 sm:p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-xl">
                  <Database className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider line-clamp-1">Campuses</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{analytics.stats.active_campuses}</p>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Line Chart */}
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 transition-colors duration-300">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  7-Day Entry Trends
                </h3>
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.trends} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTextColor }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTextColor }} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: tooltipBg, color: tooltipText, borderRadius: '12px', border: tooltipBorder, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                        cursor={{ stroke: gridColor, strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px', color: chartTextColor }} />
                      <Line type="monotone" dataKey="visitors" name="Visitors" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="vehicles" name="Vehicles" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donut Chart */}
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors duration-300">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-indigo-500" />
                  Total Entry Distribution
                </h3>
                <div className="h-56 sm:h-64 w-full flex-grow flex flex-col justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.split}
                        cx="50%"
                        cy="50%"
                        innerRadius={isDark ? 65 : 60}
                        outerRadius={isDark ? 85 : 80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {analytics.split.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#8b5cf6'} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: tooltipBg, color: tooltipText, borderRadius: '8px', border: tooltipBorder, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
                      {analytics.split.reduce((a: any, b: any) => a + b.value, 0)}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Total</span>
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {analytics.split.map((entry: any, index: number) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: index === 0 ? '#3b82f6' : '#8b5cf6' }}></div>
                      <span className="font-medium text-slate-600 dark:text-slate-300">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Bar Chart: Campus Traffic */}
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-500" />
                  Traffic by Campus
                </h3>
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.campus_breakdown} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTextColor }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTextColor }} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: tooltipBg, color: tooltipText, borderRadius: '12px', border: tooltipBorder, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px', color: chartTextColor }} />
                      <Bar dataKey="visitors" name="Visitors" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={isDark ? 16 : 20} />
                      <Bar dataKey="vehicles" name="Vehicles" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={isDark ? 16 : 20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <LogIn className="w-5 h-5 text-amber-500" />
                    Recent Activity
                  </h3>
                  <Link href="/dashboard/visitors" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center transition-colors">
                    View All <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
                
                <div className="flex-grow space-y-3 sm:space-y-4">
                  {analytics.recent_activity.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                      No recent activity recorded.
                    </div>
                  ) : (
                    analytics.recent_activity.map((act: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 sm:gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                        <div className={`p-2 rounded-lg ${act.type === 'Visitor' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                          {act.type === 'Visitor' ? <Users className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{act.id}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{act.details}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            {new Date(act.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}
