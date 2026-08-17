import React, { useEffect, useState } from 'react';
import { Loader2, QrCode, Edit, Download } from 'lucide-react';
import { qrCodeService, QRCode } from '@/services/qrCodeService';

export interface QRCodeCardProps {
  qrId: string;
  isAdmin: boolean;
  onToggleStatus: (qr: QRCode) => Promise<void>;
  onEditQR?: (qr: QRCode) => void;
  triggerAlert: (type: 'success' | 'error', message: string) => void;
}

export function QRCodeCard({ qrId, isAdmin, onToggleStatus, onEditQR, triggerAlert }: QRCodeCardProps) {
  const [qrDetail, setQrDetail] = useState<any>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchQR = async () => {
    setLocalLoading(true);
    try {
      const data = await qrCodeService.getQRCodeDetails(qrId);
      setQrDetail(data);
    } catch (e) {
      console.error('Failed to load QR details for id:', qrId, e);
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    fetchQR();
  }, [qrId]);

  const handleDownload = () => {
    if (!qrDetail?.qr_image_base64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${qrDetail.qr_image_base64}`;
    link.download = `${qrDetail.code}_pass.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerAlert('success', 'QR code downloaded successfully.');
  };

  if (localLoading && !qrDetail) {
    return (
      <div className="border border-slate-200 rounded-2xl p-6 flex flex-col justify-center items-center h-[340px] bg-slate-50/30">
        <Loader2 className="w-6 h-6 text-blue-950 animate-spin" />
      </div>
    );
  }

  if (!qrDetail) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-between text-center relative hover:shadow-md transition-all">
      <div className="w-full flex justify-between items-start mb-4">
        <div className="text-left">
          <h4 className="font-bold text-slate-800 text-sm max-w-[140px] truncate">{qrDetail.name}</h4>
          <div className="flex flex-col gap-1 mt-1">
            <span className="font-mono text-[10px] text-slate-500">{qrDetail.code}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit ${
              qrDetail.qr_type.includes('vehicle') ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
            }`}>
              {qrDetail.qr_type.includes('exit') ? 'Exit' : 'Entry'} {qrDetail.qr_type.includes('vehicle') ? 'Vehicle Pass' : 'Visitor Pass'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {isAdmin && onEditQR && (
            <button
              onClick={() => onEditQR(qrDetail)}
              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onToggleStatus(qrDetail).then(() => fetchQR())}
            disabled={!isAdmin}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
              qrDetail.is_active 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            } disabled:opacity-75`}
          >
            {qrDetail.is_active ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      {/* Base64 Image Render */}
      <div 
        className="bg-slate-100 p-4 rounded-xl border border-slate-200 mb-4 select-none relative group cursor-pointer hover:bg-slate-200 transition-colors"
        onClick={() => setIsFullscreen(true)}
        title="Click to enlarge"
      >
        {qrDetail.qr_image_base64 ? (
          <img 
            src={`data:image/png;base64,${qrDetail.qr_image_base64}`} 
            alt={qrDetail.code} 
            className="w-36 h-36 object-contain"
          />
        ) : (
          <div className="w-36 h-36 flex items-center justify-center bg-slate-200 text-slate-400">
            <QrCode className="w-8 h-8" />
          </div>
        )}
      </div>

      <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-4">Scanner route: {qrDetail.destination_url}</p>

      {/* Download action button */}
      <button
        onClick={handleDownload}
        disabled={!qrDetail.qr_image_base64}
        className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:text-blue-900 text-slate-700 rounded-xl text-xs font-semibold active:scale-95 transition-all disabled:opacity-50"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Download QR Code</span>
      </button>

      {/* Fullscreen QR Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="bg-white p-8 rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{qrDetail.name}</h3>
              <button onClick={() => setIsFullscreen(false)} className="text-slate-400 hover:text-slate-800">✕</button>
            </div>
            {qrDetail.qr_image_base64 ? (
              <img 
                src={`data:image/png;base64,${qrDetail.qr_image_base64}`} 
                alt={qrDetail.code} 
                className="w-full max-w-md h-auto object-contain"
              />
            ) : (
              <div className="w-full max-w-md aspect-square flex items-center justify-center bg-slate-100">
                <QrCode className="w-16 h-16 text-slate-300" />
              </div>
            )}
            <p className="text-center mt-6 font-mono text-sm text-slate-500">{qrDetail.code}</p>
          </div>
        </div>
      )}
    </div>
  );
}
