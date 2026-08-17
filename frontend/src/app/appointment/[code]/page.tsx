'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, QrCode, CalendarDays, Building2, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { appointmentService, Appointment } from '@/services/appointmentService';
import { useRouter } from 'next/navigation';

export default function PublicAppointmentCheckin({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const code = resolvedParams.code;
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [pin, setPin] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);
  const [passData, setPassData] = useState<any>(null);

  useEffect(() => {
    if (code) {
      fetchAppointment();
    }
  }, [code]);

  const fetchAppointment = async () => {
    try {
      const data = await appointmentService.getAppointmentByCode(code);
      setAppointment(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid or expired appointment link.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    
    setCheckingIn(true);
    try {
      const result = await appointmentService.checkinAppointment(code, pin);
      setPassData(result);
      setCheckinSuccess(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        alert("Validation Error: " + detail.map((d: any) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(", "));
      } else {
        alert(detail || "Check-in failed. Invalid PIN?");
      }
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-slate-100">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (checkinSuccess && passData) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center">
        <div className="mb-8 text-center">
          <img src="/digilogo.png" alt="Logo" className="h-10 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">You're Checked In!</h1>
        </div>
        
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
          
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Digital Pass</h2>
          <p className="text-slate-500 font-medium mb-6">ID: {passData.pass_id || 'PASS-XXX'}</p>
          
          <div className="bg-slate-50 rounded-2xl p-5 text-left space-y-4 mb-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visitor</p>
              <p className="font-semibold text-slate-800">{appointment.visitor_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Meeting Details</p>
              <p className="text-sm text-slate-600 font-medium">{appointment.purpose}</p>
            </div>
          </div>
          
          <p className="text-xs text-slate-400">Please keep this page open or save a screenshot. You will need to show this pass when exiting.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 flex flex-col items-center">
      <div className="mb-6 text-center">
        <img src="/digilogo.png" alt="Logo" className="h-8 w-auto mx-auto mb-3" />
        <h1 className="text-xl font-bold text-slate-800">Visitor Check-in</h1>
      </div>
      
      <div className="bg-white rounded-3xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Pass Header */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <QrCode className="w-12 h-12 mx-auto mb-3 opacity-90" />
          <h2 className="text-2xl font-bold">{appointment.visitor_name}</h2>
          <p className="text-blue-200 text-sm font-medium mt-1">{appointment.visitor_company || 'Guest'}</p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</p>
                <p className="font-semibold text-slate-800 text-sm">{appointment.appointment_date}</p>
              </div>
            </div>
            {appointment.time_slot_start && (
              <div className="flex items-start gap-3">
                <CalendarDays className="w-5 h-5 text-slate-400 shrink-0 mt-0.5 opacity-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</p>
                  <p className="font-semibold text-slate-800 text-sm">{appointment.time_slot_start}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 col-span-2">
              <Building2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Purpose</p>
                <p className="font-medium text-slate-700 text-sm">{appointment.purpose}</p>
              </div>
            </div>
          </div>
          
          <hr className="border-slate-100" />
          
          {/* Guard Action Area */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Security Check-in
            </h3>
            <p className="text-xs text-slate-500 mb-4">Please present this screen to the security guard at the gate to complete your check-in.</p>
            
            <form onSubmit={handleCheckin} className="flex gap-2">
              <input 
                type="password" 
                placeholder="Guard PIN" 
                className="flex-1 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-center font-mono text-lg tracking-widest"
                value={pin}
                onChange={e => setPin(e.target.value)}
                required
              />
              <button 
                type="submit" 
                disabled={checkingIn}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {checkingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
