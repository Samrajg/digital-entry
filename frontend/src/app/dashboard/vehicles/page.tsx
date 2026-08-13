'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Loader2, Truck } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/apiClient';

export default function VehiclesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    fetchVehicles();
  }, [router]);

  const fetchVehicles = async () => {
    try {
      const res = await apiClient.get(`/api/vehicles/`);
      setVehicles(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <Navbar currentUser={currentUser} />

      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Vehicle Logs</h3>
              <p className="text-slate-500 text-xs">All successful check-ins from vehicle entry passes.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-blue-950 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">{error}</div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-20 text-slate-500 space-y-4">
              <Truck className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h4 className="text-slate-800 font-bold">No Vehicle Logs</h4>
                <p className="text-slate-500 text-sm mt-1">No vehicles have checked in yet.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Date/Time</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4">Entry Point</th>
                    <th className="px-6 py-4 text-right">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {vehicles.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">#{log.id.toString().padStart(5, '0')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <ul className="text-xs space-y-1">
                          {Object.entries(log.form_data).map(([k, v]) => (
                            <li key={k}><span className="font-semibold">{k}:</span> {String(v)}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{log.campus_name}</p>
                        <p className="text-xs text-slate-500">{log.gate_name} ({log.qr_name})</p>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">
                        {log.security_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
