'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Shield, Plus, Loader2, AlertCircle, CheckCircle, Edit, Search } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import { useRouter } from 'next/navigation';

interface SecurityPersonnel {
  security_id: number;
  security_name: string;
  security_pin: string;
  is_active: boolean;
  created_at: string;
}

function SecurityPageContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [personnel, setPersonnel] = useState<SecurityPersonnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingSecurity, setEditingSecurity] = useState<SecurityPersonnel | null>(null);
  const [formData, setFormData] = useState({ security_name: '', security_pin: '' });
  const [saving, setSaving] = useState(false);
  
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    setCurrentUser(user);
    if (user.user_role !== 'admin') {
      triggerAlert('error', 'Unauthorized access.');
      return;
    }
    fetchPersonnel();
  }, [router]);

  const fetchPersonnel = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/security`);
      if (res.ok) {
        const data = await res.json();
        setPersonnel(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const url = editingSecurity 
        ? `${API_URL}/api/security/${editingSecurity.security_id}`
        : `${API_URL}/api/security`;
        
      const method = editingSecurity ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to save security personnel');
      }

      triggerAlert('success', `Security guard successfully ${editingSecurity ? 'updated' : 'added'}.`);
      setShowModal(false);
      fetchPersonnel();
    } catch (err: any) {
      triggerAlert('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (guard: SecurityPersonnel) => {
    try {
      const res = await fetch(`${API_URL}/api/security/${guard.security_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !guard.is_active })
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchPersonnel();
      triggerAlert('success', 'Status updated.');
    } catch (e: any) {
      triggerAlert('error', e.message);
    }
  };

  const filtered = personnel.filter(p => 
    p.security_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.security_pin.includes(searchQuery)
  );

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 flex flex-col">
      <Navbar currentUser={currentUser} />

      {alert && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
          <div className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 ${
            alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            {alert.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <p className="font-semibold text-sm">{alert.message}</p>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 mt-8 animate-fade-in flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-900" />
              Security Personnel
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Manage authorized security guards and their access PINs.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search guards..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setEditingSecurity(null);
                setFormData({ security_name: '', security_pin: '' });
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-900 to-blue-950 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Guard
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-blue-900 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-slate-500">No security personnel found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">PIN Code</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(guard => (
                    <tr key={guard.security_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-black text-xs">
                          {guard.security_name.charAt(0)}
                        </div>
                        {guard.security_name}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold tracking-widest text-slate-600">
                        {guard.security_pin}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(guard)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                            guard.is_active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                          }`}
                        >
                          {guard.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditingSecurity(guard);
                            setFormData({ security_name: guard.security_name, security_pin: guard.security_pin });
                            setShowModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-blue-950 text-white flex justify-between items-center">
              <h3 className="font-bold">{editingSecurity ? 'Edit Guard' : 'Add Security Guard'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.security_name}
                  onChange={(e) => setFormData({ ...formData, security_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">4-Digit PIN</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  value={formData.security_pin}
                  onChange={(e) => setFormData({ ...formData, security_pin: e.target.value.replace(/\D/g, '') })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm font-mono tracking-[0.5em] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-blue-950 rounded-xl flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SecurityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-900" /></div>}>
      <SecurityPageContent />
    </Suspense>
  );
}
