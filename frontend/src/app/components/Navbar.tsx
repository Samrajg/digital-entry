'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Shield, LogOut, User as UserIcon, Building2, DoorOpen, QrCode, LayoutDashboard, Users, Truck } from 'lucide-react';
import { User } from '@/services/authService';

interface NavbarProps {
  currentUser: User | null;
}

export default function Navbar({ currentUser }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => setSessionExpired(true);
    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('sessionExpired', handleSessionExpired);
  }, []);

  // Safe extraction of query parameters
  const currentTab = searchParams ? searchParams.get('tab') : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!currentUser) return null;

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      name: 'Forms',
      href: '/dashboard/forms',
      icon: LayoutDashboard, // Will import FileText next if needed, using LayoutDashboard temporarily or we can just import FileText
      active: pathname.startsWith('/dashboard/forms'),
    },
    {
      name: 'Campuses',
      href: '/dashboard/campuses?tab=campuses',
      icon: Building2,
      active: pathname.startsWith('/dashboard/campuses') && (currentTab === 'campuses' || !currentTab),
    },
    {
      name: 'Gates',
      href: '/dashboard/campuses?tab=gates',
      icon: DoorOpen,
      active: pathname.startsWith('/dashboard/campuses') && currentTab === 'gates',
    },
    {
      name: 'QR Codes',
      href: '/dashboard/campuses?tab=qrs',
      icon: QrCode,
      active: pathname.startsWith('/dashboard/campuses') && currentTab === 'qrs',
    },
    {
      name: 'Visitors',
      href: '/dashboard/visitors',
      icon: Users,
      active: pathname.startsWith('/dashboard/visitors'),
    },
    {
      name: 'Vehicles',
      href: '/dashboard/vehicles',
      icon: Truck,
      active: pathname.startsWith('/dashboard/vehicles'),
    },
    {
      name: 'Security',
      href: '/dashboard/security',
      icon: Shield,
      active: pathname.startsWith('/dashboard/security'),
    },
  ];

  return (
    <header className="border-b border-blue-900/30 bg-blue-950 text-white sticky top-0 z-50 px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between shadow-md gap-4">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3 justify-between md:justify-start">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="mr-1 transition-transform group-hover:scale-105 duration-300">
            <img
              src="/digilogo.png"
              alt="Digital Entry Logo"
              className="h-10 w-auto object-contain filter drop-shadow-sm"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              Digital Entry
            </h1>
            <p className="text-blue-300 text-[10px] font-semibold uppercase tracking-wider">Visitor System</p>
          </div>
        </Link>
      </div>

      {/* Unified Center Navigation Link Tabs */}
      <nav className="flex items-center gap-1 bg-blue-900/30 p-1 rounded-xl border border-blue-900/40 w-full md:w-auto overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap active:scale-95 ${
                item.active
                  ? 'bg-blue-900 text-cyan-400 border border-blue-800/60 shadow-inner'
                  : 'text-blue-200 hover:text-white hover:bg-blue-900/20 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${item.active ? 'text-cyan-400' : 'text-blue-300 group-hover:text-white'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Side Controls */}
      <div className="flex items-center gap-3 justify-end">
        {/* User Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-blue-900/40 border border-blue-800/40 rounded-xl text-xs text-white">
          <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold tracking-wide">{currentUser.username}</span>
          <span className="px-2 py-0.5 bg-cyan-400/20 text-cyan-300 rounded-md text-[9px] uppercase font-black tracking-widest border border-cyan-400/10">
            {currentUser.user_role}
          </span>
        </div>

        {/* Log Out button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-200 border border-red-800/20 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {sessionExpired && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white border border-red-200 rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center text-center animate-scale-up">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <LogOut className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Session Expired</h2>
            <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">
              Your security session has expired or is invalid. For your protection, please log out and authenticate again to continue.
            </p>
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>Secure Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
