'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import { useRouter } from 'next/navigation';
import { AuditLogTable } from '../components/AuditLogTable';

export default function VisitorsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(storedUser));
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 md:pb-12 transition-colors duration-300">
      <Navbar currentUser={currentUser} />
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-8">
        <AuditLogTable type="visitor" currentUser={currentUser} />
      </main>
    </div>
  );
}
