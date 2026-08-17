'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Shield, Loader2, ArrowRight, Building2, MapPin, LogOut } from 'lucide-react';

interface PublicContext {
  campusName: string;
  gateName: string;
  active: boolean;
  qr_type: string;
}

export default function PublicExitPage() {
  const params = useParams();
  const publicCode = params?.publicCode as string;
  
  const [context, setContext] = useState<PublicContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [passId, setPassId] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!publicCode) return;
    
    fetch(`${API_URL}/api/public/exit/${publicCode}`)
      .then(res => {
        if (!res.ok) throw new Error('Invalid or Inactive Exit QR Code');
        return res.json();
      })
      .then((data: PublicContext) => {
        if (!data.active) {
          throw new Error('This exit point is currently inactive.');
        }
        setContext(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [publicCode, API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passId || !securityPin) return;
    
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/public/exit/${publicCode}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          pass_id: parseInt(passId, 10),
          security_pin: securityPin
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to submit checkout');
      }

      const data = await res.json();
      setCheckoutData(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-amber-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Verifying Exit Point...</h2>
        <p className="text-slate-500 mt-2 text-sm">Please wait while we establish a secure connection.</p>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border-t-4 border-red-500">
          <Shield className="w-16 h-16 text-red-100 fill-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (success && checkoutData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-900 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-3 bg-emerald-500" />
          
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          
          <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Exit Confirmed ✅</h2>
          <p className="text-slate-500 mb-8 font-medium">Your visit has been successfully completed.</p>
          
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-8 text-left space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pass ID</p>
              <p className="font-mono font-bold text-slate-700 bg-white border border-slate-200 py-1.5 px-3 rounded-lg inline-block">
                #{checkoutData.pass_id.toString().padStart(6, '0')}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Check-out Time</p>
              <p className="font-bold text-slate-800">
                {new Date(checkoutData.checked_out_at).toLocaleString()}
              </p>
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visit Duration</p>
              <p className="font-bold text-amber-600 bg-amber-50 inline-block px-2 py-1 rounded">
                {Math.floor(checkoutData.visit_duration_minutes / 60)} hours {checkoutData.visit_duration_minutes % 60} minutes
              </p>
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location Departed</p>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-amber-700" />
                <p className="font-bold text-slate-800">{checkoutData.campus_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-700" />
                <p className="text-sm font-semibold text-slate-600">{checkoutData.gate_name}</p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 font-medium">Thank you for visiting. Have a safe journey!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-md">
        
        {/* Header/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 rounded-2xl shadow-lg mb-4">
            <LogOut className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Visitor Check-Out</h1>
          <p className="text-slate-500 mt-2 font-medium flex items-center justify-center gap-1.5 text-sm">
            <MapPin className="w-4 h-4" /> {context?.campusName} - {context?.gateName}
          </p>
        </div>

        {/* Dynamic Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
            <h2 className="text-white font-bold text-lg">Departure Validation</h2>
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold bg-amber-900/50 px-2.5 py-1 rounded-full border border-amber-800/50">
              <Shield className="w-3 h-3" /> Secure Exit
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pass ID <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 font-mono font-bold text-slate-400">#</span>
                <input
                  type="number"
                  required
                  value={passId}
                  onChange={(e) => setPassId(e.target.value)}
                  placeholder="e.g. 000123"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all font-mono font-bold text-slate-800"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Enter the 6-digit ID you received when checking in.</p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-1.5 mt-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Security Authorization PIN <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-digit PIN"
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all font-mono font-bold text-slate-900 tracking-[0.5em] text-center"
                />
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-1">To be entered by authorized security personnel.</p>
            </div>

            <button
              type="submit"
              disabled={submitting || !passId || !securityPin}
              className="w-full mt-8 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-sm sm:text-base py-4 rounded-xl shadow-[0_8px_16px_-6px_rgba(217,119,6,0.4)] hover:shadow-[0_12px_20px_-8px_rgba(217,119,6,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_10px_-4px_rgba(217,119,6,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm Check-Out <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
