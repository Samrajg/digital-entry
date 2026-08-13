'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, Loader2, Plus, QrCode, Search, X } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/apiClient';

export default function SchedulesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown data
  const [campuses, setCampuses] = useState<any[]>([]);
  const [gates, setGates] = useState<any[]>([]);
  const [filteredGates, setFilteredGates] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Schedule Form
  const [visitorName, setVisitorName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [selectedGateId, setSelectedGateId] = useState('');
  
  // Success state for QR
  const [generatedPass, setGeneratedPass] = useState<{qr_pass_value: string, name: string} | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(storedUser));
    fetchSchedules();
    fetchFiltersData();
  }, [router]);

  useEffect(() => {
    if (selectedCampusId) {
      setFilteredGates(gates.filter(g => g.campus_id === parseInt(selectedCampusId)));
    } else {
      setFilteredGates([]);
    }
    setSelectedGateId('');
  }, [selectedCampusId, gates]);

  const fetchFiltersData = async () => {
    try {
      const [campRes, gateRes] = await Promise.all([
        apiClient.get('/api/campuses/'),
        apiClient.get('/api/gates/')
      ]);
      setCampuses(campRes.data);
      setGates(gateRes.data);
    } catch (err) {
      console.error("Failed to load filter options", err);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/schedules/');
      setSchedules(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        visitor_name: visitorName,
        purpose,
        expected_date: expectedDate,
        time_slot: timeSlot,
        campus_id: parseInt(selectedCampusId),
        gate_id: parseInt(selectedGateId)
      };
      const res = await apiClient.post('/api/schedules/', payload);
      setGeneratedPass({ qr_pass_value: res.data.qr_pass_value, name: res.data.visitor_name });
      fetchSchedules();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeForm = () => {
    setIsModalOpen(false);
    setGeneratedPass(null);
    setVisitorName('');
    setPurpose('');
    setExpectedDate('');
    setTimeSlot('');
    setSelectedCampusId('');
    setSelectedGateId('');
  };

  const copyQrLink = (passValue: string) => {
    navigator.clipboard.writeText(passValue);
    alert('Pass code copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 md:pb-12 transition-colors duration-300">
      <Navbar currentUser={currentUser} />

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
          
          {/* Header */}
          <div className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-500" /> Pre-Registered Visits
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Expected visitors & scheduled arrivals</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" /> New Pre-Registration
            </button>
          </div>

          {/* Results Area */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">{error}</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400 space-y-4">
              <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <div>
                <h4 className="text-slate-800 dark:text-slate-200 font-bold">No Scheduled Visits</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Click "New Pre-Registration" to add an expected visitor.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">Expected Date/Time</th>
                    <th className="px-6 py-4">Visitor</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Pass Code</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                  {schedules.map((s) => (
                    <tr key={s.scheduled_visit_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{new Date(s.expected_date).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{s.time_slot || 'Anytime'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{s.visitor_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.purpose || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{s.campus_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.gate_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => copyQrLink(s.qr_pass_value)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          {s.qr_pass_value}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {s.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Pending Arrival
                          </span>
                        ) : s.status === 'CHECKED_IN' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                            {s.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                {generatedPass ? 'Pass Generated' : 'New Pre-Registration'}
              </h3>
              <button onClick={closeForm} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 py-6">
              {generatedPass ? (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Pass Created for {generatedPass.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Share this pass code or link with the visitor. They can scan it at the gate for rapid check-in.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pass Code</p>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-widest">{generatedPass.qr_pass_value}</p>
                  </div>
                  
                  <button 
                    onClick={() => copyQrLink(generatedPass.qr_pass_value)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
                  >
                    Copy Pass Code
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateSchedule} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Visitor Full Name *</label>
                    <input 
                      required
                      type="text" 
                      value={visitorName}
                      onChange={e => setVisitorName(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Purpose of Visit</label>
                    <input 
                      type="text" 
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      placeholder="e.g. Meeting with HR"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Expected Date *</label>
                      <input 
                        required
                        type="date" 
                        value={expectedDate}
                        onChange={e => setExpectedDate(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Time Slot</label>
                      <input 
                        type="time" 
                        value={timeSlot}
                        onChange={e => setTimeSlot(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Expected Campus *</label>
                    <select 
                      required
                      value={selectedCampusId}
                      onChange={e => setSelectedCampusId(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                    >
                      <option value="">Select Campus</option>
                      {campuses.map(c => (
                        <option key={c.campus_id} value={c.campus_id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Expected Gate *</label>
                    <select 
                      required
                      disabled={!selectedCampusId}
                      value={selectedGateId}
                      onChange={e => setSelectedGateId(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="">Select Gate</option>
                      {filteredGates.map(g => (
                        <option key={g.gate_id} value={g.gate_id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-70 flex justify-center items-center"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Pass'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
