'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  Shield, LogOut, User as UserIcon, Building2, DoorOpen, QrCode, 
  LayoutDashboard, Users, Truck, Bell, X, Menu, Sun, Moon, Monitor, CalendarDays
} from 'lucide-react';
import { User } from '@/services/authService';
import { useTheme } from './ThemeProvider';

interface NavbarProps {
  currentUser: User | null;
}

interface Notification {
  id: string;
  type: string;
  entity_type: string;
  details: string;
  timestamp: string;
}

export default function Navbar({ currentUser }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, setTheme, isDark } = useTheme();
  
  const [sessionExpired, setSessionExpired] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const handleSessionExpired = () => setSessionExpired(true);
    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('sessionExpired', handleSessionExpired);
  }, []);

  // WebSocket Connection for Notifications
  useEffect(() => {
    if (!currentUser) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace(/^https?:\/\//, '') 
      : 'localhost:8000';
      
    const wsUrl = `${protocol}//${host}/api/notifications/ws?token=${token}`;
    
    const connectWs = () => {
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_ENTRY') {
            const newNotif: Notification = { id: Date.now().toString(), ...data };
            setNotifications(prev => [newNotif, ...prev].slice(0, 50));
            setUnreadCount(prev => prev + 1);
            setActiveToast(newNotif);
            
            try {
              const audio = new Audio('/ping.mp3');
              audio.play().catch(e => {});
            } catch (e) {}
            
            setTimeout(() => setActiveToast(null), 5000);
          }
        } catch (err) {}
      };
      
      ws.onclose = () => setTimeout(connectWs, 5000);
      wsRef.current = ws;
    };
    
    connectWs();
    return () => wsRef.current?.close();
  }, [currentUser]);

  const currentTab = searchParams ? searchParams.get('tab') : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) setUnreadCount(0);
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else setTheme('light');
  };

  if (!currentUser) return null;

  const standaloneItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, active: pathname === '/dashboard' },
    { name: 'Visitors', href: '/dashboard/visitors', icon: Users, active: pathname.startsWith('/dashboard/visitors') },
    { name: 'Vehicles', href: '/dashboard/vehicles', icon: Truck, active: pathname.startsWith('/dashboard/vehicles') },
  ];

  const menuGroups = [
    {
      label: 'ACCESS',
      active: currentTab === 'gates' || pathname.startsWith('/dashboard/schedules') || pathname.startsWith('/dashboard/security'),
      items: [
        { name: 'Gates', href: '/dashboard/campuses?tab=gates', icon: DoorOpen, active: pathname.startsWith('/dashboard/campuses') && currentTab === 'gates' },
        { name: 'Schedules', href: '/dashboard/schedules', icon: CalendarDays, active: pathname.startsWith('/dashboard/schedules') },
        { name: 'Security', href: '/dashboard/security', icon: Shield, active: pathname.startsWith('/dashboard/security') },
      ]
    },
    {
      label: 'MANAGEMENT',
      active: pathname.startsWith('/dashboard/campuses') && (currentTab === 'campuses' || !currentTab || currentTab === 'qrs') || pathname.startsWith('/dashboard/forms'),
      items: [
        { name: 'Campuses', href: '/dashboard/campuses?tab=campuses', icon: Building2, active: pathname.startsWith('/dashboard/campuses') && (currentTab === 'campuses' || !currentTab) },
        { name: 'Forms', href: '/dashboard/forms', icon: LayoutDashboard, active: pathname.startsWith('/dashboard/forms') },
        { name: 'QR Codes', href: '/dashboard/campuses?tab=qrs', icon: QrCode, active: pathname.startsWith('/dashboard/campuses') && currentTab === 'qrs' },
      ]
    }
  ];

  // Mobile bottom nav subset
  const bottomNavItems = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard, active: pathname === '/dashboard' },
    { name: 'Visitors', href: '/dashboard/visitors', icon: Users, active: pathname.startsWith('/dashboard/visitors') },
    { name: 'Vehicles', href: '/dashboard/vehicles', icon: Truck, active: pathname.startsWith('/dashboard/vehicles') },
    { name: 'Scan QR', href: '/dashboard/campuses?tab=qrs', icon: QrCode, active: pathname.startsWith('/dashboard/campuses') && currentTab === 'qrs' },
  ];

  return (
    <>
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white sticky top-0 z-50 px-4 md:px-6 py-3 md:py-3.5 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm transition-colors duration-300">
        
        {/* Top Bar (Mobile + Desktop) */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="mr-1 transition-transform group-hover:scale-105 duration-300">
              <img src="/digilogo.png" alt="Digital Entry Logo" className="h-8 w-auto object-contain filter drop-shadow-sm" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Digital Entry
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Visitor System</p>
            </div>
          </Link>
          
          {/* Mobile Right Controls (Hamburger & Notifications) */}
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={toggleDropdown} className="relative p-2 text-slate-600 dark:text-slate-300 focus:outline-none">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse border border-white dark:border-slate-950">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600 dark:text-slate-300 focus:outline-none">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full md:w-auto my-3 md:my-0 relative">
          {standaloneItems.map(item => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all whitespace-nowrap active:scale-95 ${
                item.active
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {item.name}
            </Link>
          ))}
          
          {menuGroups.map((group) => (
            <div key={group.label} className="relative group">
              <button
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all whitespace-nowrap cursor-default ${
                  group.active
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                {group.label}
                <svg className="w-4 h-4 opacity-70 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu - Added a small invisible bridge padTop to prevent mouse-leave gaps */}
              <div className="absolute left-0 top-full pt-1 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors ${
                          item.active
                            ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800/50'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </nav>

        {/* Desktop Right Side Controls */}
        <div className="hidden md:flex items-center gap-3 justify-end relative">
          
          {/* Theme Toggle */}
          <button 
            onClick={cycleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all focus:outline-none flex items-center justify-center"
            title={`Theme: ${theme === 'dark' ? 'dark' : 'light'}`}
          >
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Notifications Bell */}
          <button 
            onClick={toggleDropdown}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all focus:outline-none"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Admin Profile Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-none cursor-default">
              <UserIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold tracking-wide">{currentUser.username}</span>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-md text-[9px] uppercase font-black tracking-widest">
                {currentUser.user_role}
              </span>
              <svg className="w-3.5 h-3.5 ml-0.5 opacity-70 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full pt-1 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white capitalize">{currentUser.username}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-6 capitalize">{currentUser.user_role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notifications Dropdown (Desktop & Mobile share this for now, positioned absolutely) */}
        {showDropdown && (
          <div className="absolute top-16 right-4 md:top-14 md:right-auto md:left-0 lg:left-auto lg:right-32 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[100] origin-top-right animate-scale-up">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Notifications</h3>
              <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                {notifications.length} New
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400 dark:text-slate-500 flex flex-col items-center">
                  <Bell className="w-8 h-8 mb-2 opacity-50" />
                  No recent notifications.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.map(notif => (
                    <div key={notif.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-default">
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg shrink-0 ${notif.entity_type === 'Visitor' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                          {notif.entity_type === 'Visitor' ? <Users className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight mb-1">{notif.details}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{new Date(notif.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 max-w-full bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col animate-slide-right">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div>
                  <img src="/digilogo.png" alt="Logo" className="h-6 w-auto" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-white">Menu</h2>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full">
                  <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.username}</p>
                  <p className="text-xs text-slate-500">{currentUser.user_role}</p>
                </div>
              </div>
              
              <button 
                onClick={cycleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
              >
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
              <div className="space-y-1">
                {standaloneItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        item.active
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {menuGroups.map((group) => (
                <div key={group.label} className="space-y-1">
                  <h3 className="px-4 py-1.5 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {group.label}
                  </h3>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                          item.active
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 z-40 pb-safe">
        <nav className="flex items-center justify-around">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex flex-col items-center justify-center w-full py-2 ${item.active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Icon className={`w-6 h-6 mb-1 ${item.active ? 'fill-blue-100 dark:fill-blue-900/50' : ''}`} />
                <span className="text-[10px] font-semibold">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Floating Toast Notification */}
      {activeToast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[100] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 pr-12 animate-slide-up max-w-sm flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${activeToast.entity_type === 'Visitor' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
            {activeToast.entity_type === 'Visitor' ? <Users className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">New Check-In</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeToast.details}</p>
          </div>
          <button 
            onClick={() => setActiveToast(null)}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-700 rounded-md p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Session Expired Modal */}
      {sessionExpired && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center text-center animate-scale-up">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Session Expired</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium text-sm leading-relaxed">
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
    </>
  );
}
