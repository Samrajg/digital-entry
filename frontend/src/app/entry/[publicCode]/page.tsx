'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Shield, Loader2, Search, ArrowRight, Building2, MapPin } from 'lucide-react';

interface FormFieldSchema {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

interface PublicContext {
  campusName: string;
  gateName: string;
  active: boolean;
  form_id: number;
  form_name: string;
  form_schema: FormFieldSchema[];
}

export default function PublicEntryPage() {
  const params = useParams();
  const publicCode = params?.publicCode as string;
  const router = useRouter();

  const [context, setContext] = useState<PublicContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dynamic form state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [securityPin, setSecurityPin] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passData, setPassData] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!publicCode) return;
    
    // Fetch public context config based on the scanned QR string
    fetch(`${API_URL}/api/public/entry/${publicCode}`)
      .then(res => {
        if (!res.ok) throw new Error('Invalid or Inactive QR Code');
        return res.json();
      })
      .then((data: PublicContext) => {
        if (!data.active) {
          throw new Error('This entrance point is currently inactive.');
        }
        setContext(data);
        
        // Initialize form data state with empty values
        const initialData: Record<string, any> = {};
        if (data.form_schema) {
          data.form_schema.forEach(field => {
            initialData[field.id] = field.type === 'select' && field.options ? field.options[0] : '';
          });
        }
        setFormData(initialData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [publicCode, API_URL]);

  const handleFieldChange = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/public/entry/${publicCode}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          security_pin: securityPin,
          response_data: formData 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to submit registration');
      }

      const pass = await res.json();
      setPassData(pass);
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
        <Loader2 className="w-10 h-10 text-blue-950 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Verifying Security Access...</h2>
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

  if (success && passData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-3 bg-emerald-500" />
          
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          
          <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Entry Authorized</h2>
          <p className="text-slate-500 mb-8 font-medium">Your visitor pass has been generated securely.</p>
          
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-8 text-left space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pass ID</p>
              <p className="font-mono font-bold text-slate-700 bg-white border border-slate-200 py-1.5 px-3 rounded-lg inline-block">
                #{passData.response_id.toString().padStart(6, '0')}
              </p>
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location Access</p>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-blue-900" />
                <p className="font-bold text-slate-800">{context?.campusName}</p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-900" />
                <p className="text-sm font-semibold text-slate-600">{context?.gateName}</p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 font-medium">Please present this screen to security personnel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-md">
        
        {/* Header/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-950 rounded-2xl shadow-lg mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Visitor Check-In</h1>
          <p className="text-slate-500 mt-2 font-medium flex items-center justify-center gap-1.5 text-sm">
            <MapPin className="w-4 h-4" /> {context?.campusName} - {context?.gateName}
          </p>
        </div>

        {/* Dynamic Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
            <h2 className="text-white font-bold text-lg">{context?.form_name || 'Registration'}</h2>
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-800/50">
              <Shield className="w-3 h-3" /> Secure
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl text-center">
                {error}
              </div>
            )}

            {context?.form_schema?.map(field => (
              <div key={field.id} className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'textarea' ? (
                  <textarea
                    required={field.required}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800"
                    rows={3}
                  />
                ) : field.type === 'select' ? (
                  <select
                    required={field.required}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800"
                  >
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.label.toLowerCase().includes('email') ? 'email' : 'text'}
                    required={field.required}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800"
                  />
                )}
              </div>
            ))}

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
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-mono font-bold text-slate-900 tracking-[0.5em] text-center"
                />
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-1">To be entered by authorized personnel only.</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-8 bg-gradient-to-r from-blue-900 to-blue-950 text-white font-bold text-sm sm:text-base py-4 rounded-xl shadow-[0_8px_16px_-6px_rgba(30,58,138,0.4)] hover:shadow-[0_12px_20px_-8px_rgba(30,58,138,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_4px_10px_-4px_rgba(30,58,138,0.4)] transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Complete Check-In <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <p className="text-center text-[10px] text-slate-400 font-medium pt-4 mt-6 border-t border-slate-100">
              Your information is securely encrypted and stored temporarily for access authorization purposes only.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
