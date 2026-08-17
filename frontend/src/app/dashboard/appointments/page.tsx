'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, Loader2, Plus, QrCode, X, Search, CheckCircle, Clock, XCircle, Share2, Copy } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import { useRouter } from 'next/navigation';
import { appointmentService, Appointment } from '@/services/appointmentService';

export default function AppointmentsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState<Appointment | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_email: '',
    visitor_phone: '',
    visitor_company: '',
    appointment_date: '',
    time_slot_start: '',
    time_slot_end: '',
    purpose: '',
    campus_id: 1,
    meeting_location: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(storedUser));
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      fetchAppointments();
    }
  }, [currentUser]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const newAppt = await appointmentService.createAppointment(formData);
      setAppointments([newAppt, ...appointments]);
      setIsModalOpen(false);
      setQrModalData(newAppt); // Show QR immediately after creation
      // Reset form
      setFormData({
        visitor_name: '', visitor_email: '', visitor_phone: '', visitor_company: '',
        appointment_date: '', time_slot_start: '', time_slot_end: '', purpose: '',
        campus_id: 1, meeting_location: ''
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        alert("Validation Error: " + detail.map((d: any) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(", "));
      } else {
        alert(detail || "Failed to create appointment");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentService.cancelAppointment(id);
      setAppointments(appointments.map(a => a.appointment_id === id ? { ...a, status: 'CANCELLED' } : a));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to cancel appointment");
    }
  };

  const copyUrl = (code: string) => {
    const url = `${window.location.origin}/appointment/${code}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><Clock className="w-3.5 h-3.5" /> Scheduled</span>;
      case 'CHECKED_IN':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3.5 h-3.5" /> Checked In</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Completed</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>;
      case 'EXPIRED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Expired</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 md:pb-12 transition-colors duration-300">
      <Navbar currentUser={currentUser} />

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
          
          <div className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Appointments</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Manage scheduled visits</p>
            </div>
            {currentUser?.user_role !== 'security' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Appointment
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">{error}</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400 space-y-4">
              <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <div>
                <h4 className="text-slate-800 dark:text-slate-200 font-bold">No Appointments Found</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Schedule a visit to see it here.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">Visitor</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Purpose</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                  {appointments.map((appt) => (
                    <tr key={appt.appointment_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{appt.visitor_name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{appt.visitor_company || '--'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{appt.appointment_date}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {appt.time_slot_start} - {appt.time_slot_end}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate" title={appt.purpose}>
                        {appt.purpose}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(appt.status || '')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {appt.status === 'SCHEDULED' && currentUser?.user_role !== 'security' && (
                            <>
                              <button
                                onClick={() => setQrModalData(appt)}
                                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Show QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(appt.appointment_id!)}
                                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Cancel Appointment"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <h3 className="font-bold text-slate-900 dark:text-white">New Appointment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form id="appt-form" onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Visitor Name *</label>
                    <input 
                      required type="text" 
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:outline-none focus:border-blue-500"
                      value={formData.visitor_name} onChange={e => setFormData({...formData, visitor_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    <input 
                      type="email" 
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:outline-none focus:border-blue-500"
                      value={formData.visitor_email} onChange={e => setFormData({...formData, visitor_email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:outline-none focus:border-blue-500"
                      value={formData.visitor_phone} onChange={e => setFormData({...formData, visitor_phone: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company / Org</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:outline-none focus:border-blue-500"
                      value={formData.visitor_company} onChange={e => setFormData({...formData, visitor_company: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date *</label>
                    <input 
                      required type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:outline-none focus:border-blue-500"
                      value={formData.appointment_date} onChange={e => setFormData({...formData, appointment_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Time</label>
                    <input 
                      type="time" 
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:outline-none focus:border-blue-500"
                      value={formData.time_slot_start} onChange={e => setFormData({...formData, time_slot_start: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Time</label>
                    <input 
                      type="time" 
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:outline-none focus:border-blue-500"
                      value={formData.time_slot_end} onChange={e => setFormData({...formData, time_slot_end: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purpose *</label>
                    <textarea 
                      required rows={3}
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:outline-none focus:border-blue-500 resize-none"
                      value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Meeting Location *</label>
                    <input 
                      required type="text" 
                      placeholder="e.g. Conference Room A, Lobby, Floor 3"
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:outline-none focus:border-blue-500"
                      value={formData.meeting_location} onChange={e => setFormData({...formData, meeting_location: e.target.value})}
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
              <button 
                type="button" onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" form="appt-form" disabled={formLoading}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {formLoading ? 'Creating...' : 'Create Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Share Modal */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <h3 className="font-bold text-slate-900 dark:text-white">Digital Pass</h3>
              <button onClick={() => setQrModalData(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
                {qrModalData.qr_image_base64 ? (
                  <img src={`data:image/png;base64,${qrModalData.qr_image_base64}`} alt="QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 flex items-center justify-center rounded-xl text-slate-400">
                    <QrCode className="w-12 h-12" />
                  </div>
                )}
              </div>
              
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">{qrModalData.visitor_name}</h4>
              <p className="text-sm text-slate-500 mt-1">{qrModalData.appointment_date} {qrModalData.time_slot_start ? `at ${qrModalData.time_slot_start}` : ''}</p>
              
              <div className="mt-8 w-full space-y-3">
                <button 
                  onClick={() => copyUrl(qrModalData.appointment_code!)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                >
                  <Copy className="w-4 h-4" /> Copy Check-in Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
