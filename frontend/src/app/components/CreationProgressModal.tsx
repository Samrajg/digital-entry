import React from 'react';
import { Loader2 } from 'lucide-react';

interface CreationProgressModalProps {
  isOpen: boolean;
  progress: number;
  title: string;
  message: string;
}

export default function CreationProgressModal({ isOpen, progress, title, message }: CreationProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center animate-scale-up">
        <div className="relative mb-6">
          <Loader2 className="w-16 h-16 text-blue-100 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-blue-900 font-black text-sm">{progress}%</span>
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm font-medium">{message}</p>
        
        <div className="w-full bg-slate-100 h-2.5 rounded-full mt-6 overflow-hidden">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
