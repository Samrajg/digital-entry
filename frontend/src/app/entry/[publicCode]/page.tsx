"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Types for public entry context
interface PublicEntryContext {
  campusName: string;
  gateName: string;
  active: boolean;
  // Add other fields as needed
}

// Types for registration form
const registrationSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  mobileNumber: z.string().min(1, 'Mobile number is required'),
  email: z.string().email('Invalid email'),
  company: z.string().optional(),
  purpose: z.string().min(1, 'Purpose is required'),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function PublicEntryPage({ params }: { params: { publicCode: string } }) {
  const { publicCode } = params;
  const router = useRouter();
  const [context, setContext] = useState<PublicEntryContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationForm>({ resolver: zodResolver(registrationSchema) });

  useEffect(() => {
    // Fetch public entry context from backend
    const fetchContext = async () => {
      try {
        const resp = await fetch(`/api/public/entry/${publicCode}`);
        if (!resp.ok) {
          throw new Error(`Failed to load entry context (status ${resp.status})`);
        }
        const data = await resp.json();
        setContext(data);
      } catch (e: any) {
        setError(e.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, [publicCode]);

  const onSubmit = async (data: RegistrationForm) => {
    try {
      const resp = await fetch(`/api/public/entry/${publicCode}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || `Submission failed (status ${resp.status})`);
      }
      const result = await resp.json();
      setSubmitResult('Registration successful!');
      reset();
    } catch (e: any) {
      setSubmitResult(`Error: ${e.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <span className="text-xl text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-lg font-bold text-red-700">Error</h2>
          <p className="mt-2 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (context && !context.active) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-yellow-50">
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-lg font-bold text-yellow-700">Inactive Entry Point</h2>
          <p className="mt-2 text-yellow-600">This QR code, its gate, or its campus is currently inactive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-4">
      <header className="w-full max-w-lg text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome to {context?.campusName}</h1>
        <p className="text-gray-600">Gate: {context?.gateName}</p>
      </header>

      <form className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md" onSubmit={handleSubmit(onSubmit)}>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Visitor Registration</h2>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1" htmlFor="fullName">Full Name</label>
          <input id="fullName" {...register('fullName')} className={`w-full border rounded px-3 py-2 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`} />
          {errors.fullName && <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1" htmlFor="mobileNumber">Mobile Number</label>
          <input id="mobileNumber" {...register('mobileNumber')} className={`w-full border rounded px-3 py-2 ${errors.mobileNumber ? 'border-red-500' : 'border-gray-300'}`} />
          {errors.mobileNumber && <p className="text-sm text-red-600 mt-1">{errors.mobileNumber.message}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1" htmlFor="email">Email</label>
          <input id="email" type="email" {...register('email')} className={`w-full border rounded px-3 py-2 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1" htmlFor="company">Company (optional)</label>
          <input id="company" {...register('company')} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1" htmlFor="purpose">Purpose of Visit</label>
          <textarea id="purpose" {...register('purpose')} className={`w-full border rounded px-3 py-2 ${errors.purpose ? 'border-red-500' : 'border-gray-300'}`} />
          {errors.purpose && <p className="text-sm text-red-600 mt-1">{errors.purpose.message}</p>}
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">
          Submit
        </button>

        {submitResult && (
          <p className="mt-4 text-center text-sm" style={{ color: submitResult.startsWith('Error') ? '#dc2626' : '#16a34a' }}>
            {submitResult}
          </p>
        )}
      </form>
    </div>
  );
}
