'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Building, 
  DoorOpen, 
  QrCode, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Shield, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Download, 
  RefreshCw,
  Info,
  Building2
} from 'lucide-react';
import { campusService, Campus, CampusDetail, GateShort } from '@/services/campusService';
import { gateService, Gate, GateDetail, QRCodeShort } from '@/services/gateService';
import { qrCodeService, QRCode } from '@/services/qrCodeService';
import { User } from '@/services/authService';
import Navbar from '@/app/components/Navbar';

type ViewMode = 'list' | 'details' | 'gate';

function CampusesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'campuses' | 'gates' | 'qrs'>('campuses');

  // Data states
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<CampusDetail | null>(null);
  const [selectedGate, setSelectedGate] = useState<GateDetail | null>(null);
  const [allGates, setAllGates] = useState<GateDetail[]>([]);
  const [allQRs, setAllQRs] = useState<QRCode[]>([]);

  // Search query states
  const [gateSearchQuery, setGateSearchQuery] = useState('');
  const [qrSearchQuery, setQrSearchQuery] = useState('');

  // Modal states
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [campusForm, setCampusForm] = useState({ name: '', code: '', address: '', city: '' });

  const [showGateModal, setShowGateModal] = useState(false);
  const [editingGate, setEditingGate] = useState<Gate | null>(null);
  const [gateForm, setGateForm] = useState({ name: '', code: '', description: '', location: '', campus_id: '' });

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrForm, setQrForm] = useState({ name: 'Primary Gate Access QR', gate_id: '' });

  // Security configuration
  const isAdmin = currentUser?.user_role === 'admin';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    try {
      const user = JSON.parse(storedUser) as User;
      setCurrentUser(user);
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  // Handle Tab synchronizations and API calls dynamically
  useEffect(() => {
    if (!currentUser) return;

    const tab = (searchParams ? searchParams.get('tab') : 'campuses') as 'campuses' | 'gates' | 'qrs' || 'campuses';
    setActiveTab(tab);

    if (tab === 'gates') {
      setIsLoading(true);
      Promise.all([
        gateService.getAllGates()
          .then(setAllGates)
          .catch(err => triggerAlert('error', err.response?.data?.detail || 'Failed to load gates.')),
        campusService.getCampuses()
          .then(setCampuses)
          .catch(err => triggerAlert('error', err.response?.data?.detail || 'Failed to load campuses.'))
      ]).finally(() => setIsLoading(false));
    } else if (tab === 'qrs') {
      setIsLoading(true);
      Promise.all([
        qrCodeService.getAllQRCodes()
          .then(setAllQRs)
          .catch(err => triggerAlert('error', err.response?.data?.detail || 'Failed to load QR codes.')),
        gateService.getAllGates()
          .then(setAllGates)
          .catch(err => triggerAlert('error', err.response?.data?.detail || 'Failed to load gates.'))
      ]).finally(() => setIsLoading(false));
    } else {
      fetchCampuses();
    }
  }, [searchParams, currentUser]);

  // Flash alert helper
  const triggerAlert = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const fetchCampuses = async () => {
    setIsLoading(true);
    try {
      const data = await campusService.getCampuses();
      setCampuses(data);
    } catch (err: any) {
      triggerAlert('error', err.response?.data?.detail || 'Failed to load campuses.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllGates = async () => {
    setIsLoading(true);
    try {
      const data = await gateService.getAllGates();
      setAllGates(data);
    } catch (err: any) {
      triggerAlert('error', err.response?.data?.detail || 'Failed to load gates.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllQRs = async () => {
    setIsLoading(true);
    try {
      const data = await qrCodeService.getAllQRCodes();
      setAllQRs(data);
    } catch (err: any) {
      triggerAlert('error', err.response?.data?.detail || 'Failed to load QR codes.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampusDetails = async (campusId: number) => {
    setIsLoading(true);
    try {
      const data = await campusService.getCampusDetails(campusId);
      setSelectedCampus(data);
      setViewMode('details');
    } catch (err: any) {
      triggerAlert('error', err.response?.data?.detail || 'Failed to load campus details.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGateDetails = async (gateId: number) => {
    setIsLoading(true);
    try {
      const data = await gateService.getGateDetails(gateId);
      setSelectedGate(data);
      setViewMode('gate');
    } catch (err: any) {
      triggerAlert('error', err.response?.data?.detail || 'Failed to load gate details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Campus CRUD handlers
  const handleOpenCampusModal = (campus: Campus | null = null) => {
    if (!isAdmin) return;
    setEditingCampus(campus);
    if (campus) {
      setCampusForm({
        name: campus.name,
        code: campus.code,
        address: campus.address || '',
        city: campus.city || ''
      });
    } else {
      setCampusForm({ name: '', code: '', address: '', city: '' });
    }
    setShowCampusModal(true);
  };

  const handleSaveCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campusForm.name || !campusForm.code) {
      triggerAlert('error', 'Name and Code are required.');
      return;
    }

    setIsLoading(true);
    try {
      if (editingCampus) {
        await campusService.updateCampus(editingCampus.campus_id, campusForm);
        triggerAlert('success', 'Campus updated successfully.');
        if (selectedCampus && selectedCampus.campus_id === editingCampus.campus_id) {
          fetchCampusDetails(editingCampus.campus_id);
        }
      } else {
        await campusService.createCampus(campusForm);
        triggerAlert('success', 'Campus created successfully.');
      }
      setShowCampusModal(false);
      fetchCampuses();
    } catch (err: any) {
      triggerAlert('error', err.response?.data?.detail || 'Failed to save campus.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCampusStatus = async (campus: Campus) => {
    if (!isAdmin) return;
    try {
      const newStatus = !campus.is_active;
      await campusService.toggleCampusStatus(campus.campus_id, newStatus);
      triggerAlert('success', `Campus ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      fetchCampuses();
      if (selectedCampus && selectedCampus.campus_id === campus.campus_id) {
        fetchCampusDetails(campus.campus_id);
      }
    } catch (err: any) {
      triggerAlert('error', err.response?.data?.detail || 'Failed to change campus status.');
    }
  };

  // Gate CRUD handlers
  const handleOpenGateModal = (gate: Gate | null = null) => {
    if (!isAdmin) return;
    setEditingGate(gate);
    if (gate) {
      setGateForm({
        name: gate.name,
        code: gate.code,
        description: gate.description || '',
        location: gate.location || '',
        campus_id: gate.campus_id.toString()
      });
    } else {
      setGateForm({ 
        name: '', 
        code: '', 
        description: '', 
        location: '', 
        campus_id: selectedCampus ? selectedCampus.campus_id.toString() : (campuses[0]?.campus_id?.toString() || '') 
      });
    }
    setShowGateModal(true);
  };

  const handleSaveGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGate && !selectedCampus && !gateForm.campus_id) {
      triggerAlert('error', 'Campus selection is required.');
      return;
    }
    if (!gateForm.name || !gateForm.code) {
      triggerAlert('error', 'Name and Code are required.');
      return;
    }

    setIsLoading(true);
    try {
      if (editingGate) {
        await gateService.updateGate(editingGate.gate_id, {
          name: gateForm.name,
          code: gateForm.code,
          description: gateForm.description,
          location: gateForm.location
        });
        triggerAlert('success', 'Gate updated successfully.');
        if (selectedGate && selectedGate.gate_id === editingGate.gate_id) {
          fetchGateDetails(editingGate.gate_id);
        }
      } else {
        const targetCampusId = selectedCampus ? selectedCampus.campus_id : parseInt(gateForm.campus_id);
        await gateService.createGate(targetCampusId, {
          name: gateForm.name,
          code: gateForm.code,
          description: gateForm.description,
          location: gateForm.location
        });
        triggerAlert('success', 'Gate entry added successfully.');
      }
      setShowGateModal(false);
      if (selectedCampus) {
        fetchCampusDetails(selectedCampus.campus_id);
      }
      if (activeTab === 'gates') {
        fetchAllGates();
      }
    } catch (err: any) {
      triggerAlert('error', err.response?.data?.detail || 'Failed to save gate.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleGateStatus = async (gate: Gate | GateShort) => {
    if (!isAdmin) return;
    try {
      const newStatus = !gate.is_active;
      await gateService.toggleGateStatus(gate.gate_id, newStatus);
      triggerAlert('success', `Gate ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      if (selectedCampus) {
        fetchCampusDetails(selectedCampus.campus_id);
      }
      if (selectedGate && selectedGate.gate_id === gate.gate_id) {
        fetchGateDetails(gate.gate_id);
      }
      if (activeTab === 'gates') {
        fetchAllGates();
      }
    } catch (err: any) {
      triggerAlert('error', err.response?.data?.detail || 'Failed to change gate status.');
    }
  };

  const handleGenerateQRCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGate && !qrForm.gate_id) {
      triggerAlert('error', 'Gate selection is required.');
      return;
    }
    if (!qrForm.name) {
      triggerAlert('error', 'QR Name is required.');
      return;
    }

    setIsLoading(true);
    try {
      const targetGateId = selectedGate ? selectedGate.gate_id : parseInt(qrForm.gate_id);
      await qrCodeService.createQRCode(targetGateId, { name: qrForm.name });
      triggerAlert('success', 'QR Code generated successfully.');
      setShowQRModal(false);
      if (selectedGate) {
        fetchGateDetails(selectedGate.gate_id);
      }
      if (activeTab === 'qrs') {
        fetchAllQRs();
      }
    } catch (err: any) {
      triggerAlert('error', err.response?.data?.detail || 'Failed to generate QR Code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleQRStatus = async (qr: QRCode | QRCodeShort) => {
    if (!isAdmin) return;
    try {
      const newStatus = !qr.is_active;
      await qrCodeService.toggleQRCodeStatus(qr.qr_code_id, newStatus);
      triggerAlert('success', `QR Code ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      if (selectedGate) {
        fetchGateDetails(selectedGate.gate_id);
      }
      if (activeTab === 'qrs') {
        fetchAllQRs();
      }
    } catch (err: any) {
      triggerAlert('error', err.response?.data?.detail || 'Failed to toggle QR status.');
    }
  };

  const handleViewGateFromList = async (gateId: number) => {
    setIsLoading(true);
    try {
      const detail = await gateService.getGateDetails(gateId);
      setSelectedGate(detail);
      // Pre-load campus details so back nav operates cleanly
      try {
        const campusDetail = await campusService.getCampusDetails(detail.campus_id);
        setSelectedCampus(campusDetail);
      } catch (e) {
        console.error('Failed to pre-load campus details:', e);
      }
      setViewMode('gate');
      router.push('/dashboard/campuses?tab=campuses');
    } catch (err: any) {
      triggerAlert('error', 'Failed to load gate details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stats calculation
  const totalCampuses = campuses.length;
  const activeCampuses = campuses.filter(c => c.is_active).length;
  // Dynamic summation of gates counts for summary stats
  const totalGates = selectedCampus ? selectedCampus.gates.length : campuses.reduce((sum, c) => sum + (c.is_active ? 1 : 0), 0); // Simplified overview representation

  // Dynamic filtering of gates and QR codes for search option
  const filteredGates = allGates.filter(gate => 
    gate.name.toLowerCase().includes(gateSearchQuery.toLowerCase()) ||
    gate.code.toLowerCase().includes(gateSearchQuery.toLowerCase()) ||
    gate.campus_name.toLowerCase().includes(gateSearchQuery.toLowerCase()) ||
    (gate.location && gate.location.toLowerCase().includes(gateSearchQuery.toLowerCase()))
  );

  const filteredQRs = allQRs.filter(qr => 
    qr.name.toLowerCase().includes(qrSearchQuery.toLowerCase()) ||
    qr.code.toLowerCase().includes(qrSearchQuery.toLowerCase()) ||
    qr.gate_name.toLowerCase().includes(qrSearchQuery.toLowerCase()) ||
    qr.campus_name.toLowerCase().includes(qrSearchQuery.toLowerCase()) ||
    qr.destination_url.toLowerCase().includes(qrSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <Navbar currentUser={currentUser} />

      {/* Main content body */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {/* Permission Banner for Non-Admins */}
        {!isAdmin && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3 text-blue-800 text-sm">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span><strong>Read-Only Mode:</strong> Your role ({currentUser?.user_role}) allows you to view campuses, gates, and QR passes, but you cannot make modifications.</span>
          </div>
        )}

        {/* Global Errors/Success alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-700 text-sm font-semibold flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-700 text-sm font-semibold flex items-center gap-3 animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* STATS OVERVIEW SECTION (Only shown in main list) */}
        {activeTab === 'campuses' && viewMode === 'list' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Campuses</p>
                <Building className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-3xl font-extrabold text-slate-800">{totalCampuses}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Campuses</p>
                <Building className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-800">{activeCampuses}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Access Gates</p>
                <DoorOpen className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-3xl font-extrabold text-slate-800">{campuses.length > 0 ? 'Configured' : 0}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">System State</p>
                <RefreshCw className={`w-5 h-5 text-blue-900 ${isLoading ? 'animate-spin' : ''}`} />
              </div>
              <p className="text-sm font-bold text-blue-900 uppercase tracking-wider mt-2.5">Operational</p>
            </div>
          </div>
        )}

        {/* -------------------- VIEW 1: CAMPUS LIST -------------------- */}
        {activeTab === 'campuses' && viewMode === 'list' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Campuses Directory</h3>
                <p className="text-slate-500 text-xs">A listing of all campus facilities and properties.</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleOpenCampusModal()}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 border border-blue-800/50 text-white font-medium px-4 py-2.5 rounded-xl text-sm shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Campus</span>
                </button>
              )}
            </div>

            {isLoading && campuses.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-blue-950 animate-spin" />
              </div>
            ) : campuses.length === 0 ? (
              <div className="text-center py-20 text-slate-500 space-y-4">
                <Building className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h4 className="text-slate-800 font-bold">No Campuses Configured</h4>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">Create your first campus property to begin mapping gates and generating entries.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Campus Name</th>
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Address / Location</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {campuses.map((campus) => (
                      <tr key={campus.campus_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">{campus.name}</td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs px-2 py-1 bg-slate-100 rounded-md border border-slate-200 font-bold text-slate-700">
                            {campus.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {campus.address || campus.city ? (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{[campus.address, campus.city].filter(Boolean).join(', ')}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No location provided</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleCampusStatus(campus)}
                            disabled={!isAdmin}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                              campus.is_active 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                : 'bg-red-50 border-red-200 text-red-700'
                            } disabled:cursor-default`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${campus.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span>{campus.is_active ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => fetchCampusDetails(campus.campus_id)}
                              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                            >
                              View Gates
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleOpenCampusModal(campus)}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
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
        )}

        {/* -------------------- VIEW 2: CAMPUS DETAILS -------------------- */}
        {activeTab === 'campuses' && viewMode === 'details' && selectedCampus && (
          <div className="space-y-6 animate-fade-in">
            {/* Campus Info Header Details Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-gradient-to-tr from-blue-900 to-blue-950 border border-blue-800/80 rounded-2xl shadow-md text-white">
                  <Building className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-800">{selectedCampus.name}</h2>
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 font-bold text-slate-700">
                      {selectedCampus.code}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">
                    {selectedCampus.address ? `${selectedCampus.address}, ` : ''}{selectedCampus.city || 'No Location specified'}
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-50 border-slate-200 text-slate-700">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedCampus.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span>Campus: {selectedCampus.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    fetchCampuses();
                    setViewMode('list');
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Back to Directory
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleOpenCampusModal(selectedCampus)}
                    className="px-4 py-2 border border-blue-800/20 rounded-xl text-sm font-semibold bg-blue-900/10 hover:bg-blue-900/20 text-blue-900 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Campus</span>
                  </button>
                )}
              </div>
            </div>

            {/* Gates List Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Entry & Exit Gates</h3>
                  <p className="text-slate-500 text-xs">The security access points registered under this campus property.</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleOpenGateModal()}
                    disabled={!selectedCampus.is_active}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 border border-blue-800/50 text-white font-medium px-4 py-2.5 rounded-xl text-sm shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Gate</span>
                  </button>
                )}
              </div>

              {selectedCampus.gates.length === 0 ? (
                <div className="text-center py-20 text-slate-500 space-y-4">
                  <DoorOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <div>
                    <h4 className="text-slate-800 font-bold">No Gates Configured</h4>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">This campus has no access gates. Add a gate entry to establish security check-in routes.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4">Gate Name</th>
                        <th className="px-6 py-4">Gate Code</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {selectedCampus.gates.map((gate) => (
                        <tr key={gate.gate_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{gate.name}</td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs px-2 py-1 bg-slate-100 rounded-md border border-slate-200 font-bold text-slate-700">
                              {gate.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleToggleGateStatus(gate)}
                              disabled={!isAdmin || !selectedCampus.is_active}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                                gate.is_active 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                  : 'bg-red-50 border-red-200 text-red-700'
                              } disabled:opacity-50`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${gate.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <span>{gate.is_active ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => fetchGateDetails(gate.gate_id)}
                                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                              >
                                View QR Codes
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleOpenGateModal(gate as Gate)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
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
          </div>
        )}

        {/* -------------------- VIEW 3: GATE DETAILS & QR CODES -------------------- */}
        {activeTab === 'campuses' && viewMode === 'gate' && selectedGate && (
          <div className="space-y-6 animate-fade-in">
            {/* Gate Information Header */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-gradient-to-tr from-blue-900 to-blue-950 border border-blue-800/80 rounded-2xl shadow-md text-white">
                  <DoorOpen className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-800">{selectedGate.name}</h2>
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 font-bold text-slate-700">
                      {selectedGate.code}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">
                    Campus: <span className="font-semibold text-slate-700">{selectedGate.campus_name}</span> 
                    {selectedGate.location ? ` | Location: ${selectedGate.location}` : ''}
                  </p>
                  <p className="text-slate-400 text-xs mt-1 italic">{selectedGate.description || 'No description provided'}</p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-50 border-slate-200 text-slate-700">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedGate.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span>Gate Status: {selectedGate.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (selectedCampus) fetchCampusDetails(selectedCampus.campus_id);
                    else setViewMode('list');
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Back to Campus
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleOpenGateModal(selectedGate as unknown as Gate)}
                    className="px-4 py-2 border border-blue-800/20 rounded-xl text-sm font-semibold bg-blue-900/10 hover:bg-blue-900/20 text-blue-900 transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Gate</span>
                  </button>
                )}
              </div>
            </div>

            {/* QR Codes Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Entry Point QR Codes</h3>
                  <p className="text-slate-500 text-xs">QR codes linked to this gate for visitor check-in routing.</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (!selectedGate.is_active) return;
                      setQrForm({ 
                        name: `${selectedGate.name} Scan Pass`, 
                        gate_id: selectedGate.gate_id.toString() 
                      });
                      setShowQRModal(true);
                    }}
                    disabled={!selectedGate.is_active}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 border border-blue-800/50 text-white font-medium px-4 py-2.5 rounded-xl text-sm shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Generate QR Code</span>
                  </button>
                )}
              </div>

              {selectedGate.qr_codes.length === 0 ? (
                <div className="text-center py-20 text-slate-500 space-y-4">
                  <QrCode className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
                  <div>
                    <h4 className="text-slate-800 font-bold">No QR Codes Generated</h4>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">Generate a QR code scanning pass to establish a tracking entry point for visitor verification.</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedGate.qr_codes.map((qrShort) => {
                    // Fetch full QR detail matching the short list
                    return (
                      <QRCodeCard 
                        key={qrShort.qr_code_id}
                        qrId={qrShort.qr_code_id}
                        isAdmin={isAdmin}
                        onToggleStatus={handleToggleQRStatus}
                        triggerAlert={triggerAlert}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------- VIEW 4: ALL GATES LIST -------------------- */}
        {activeTab === 'gates' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50/50 gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Gates Directory</h3>
                <p className="text-slate-500 text-xs">A comprehensive listing of all entry gates across all campuses.</p>
              </div>
              <div className="flex items-center gap-3 self-stretch sm:self-auto">
                <input
                  type="text"
                  placeholder="Search gates..."
                  value={gateSearchQuery}
                  onChange={(e) => setGateSearchQuery(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors w-full sm:w-48 text-slate-700 font-medium"
                />
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingGate(null);
                      setGateForm({ 
                        name: '', 
                        code: '', 
                        description: '', 
                        location: '', 
                        campus_id: campuses[0]?.campus_id?.toString() || '' 
                      });
                      setShowGateModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-blue-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 border border-blue-800/50 text-white font-medium px-4 py-2 rounded-xl text-xs shadow-md active:scale-95 transition-all whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Gate</span>
                  </button>
                )}
              </div>
            </div>

            {isLoading && allGates.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-blue-950 animate-spin" />
              </div>
            ) : allGates.length === 0 ? (
              <div className="text-center py-20 text-slate-500 space-y-4">
                <DoorOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h4 className="text-slate-800 font-bold">No Gates Configured</h4>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">Configure gates by selecting a campus directory and clicking "Add Gate".</p>
                </div>
              </div>
            ) : filteredGates.length === 0 ? (
              <div className="text-center py-20 text-slate-500 space-y-3">
                <DoorOpen className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
                <div>
                  <h4 className="text-slate-800 font-semibold">No Matching Gates Found</h4>
                  <p className="text-slate-400 text-xs">Try adjusting your search keywords.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-6 py-4">Gate Name</th>
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Campus Name</th>
                      <th className="px-6 py-4">Location / Details</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredGates.map((gate) => (
                      <tr key={gate.gate_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">{gate.name}</td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs px-2 py-1 bg-slate-100 rounded-md border border-slate-200 font-bold text-slate-700">
                            {gate.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">{gate.campus_name}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {gate.location || gate.description ? (
                            <div>
                              {gate.location && <p className="text-slate-700">{gate.location}</p>}
                              {gate.description && <p className="text-xs text-slate-400 italic">{gate.description}</p>}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No location details</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleGateStatus(gate)}
                            disabled={!isAdmin}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                              gate.is_active 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                : 'bg-red-50 border-red-200 text-red-700'
                            } disabled:cursor-default`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${gate.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span>{gate.is_active ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewGateFromList(gate.gate_id)}
                              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                            >
                              <QrCode className="w-3.5 h-3.5 text-slate-500" />
                              <span>View QR Codes</span>
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleOpenGateModal(gate as unknown as Gate)}
                                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
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
        )}

        {/* -------------------- VIEW 5: ALL QR CODES LIST -------------------- */}
        {activeTab === 'qrs' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50/50 gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">System-wide QR Passes</h3>
                  <p className="text-slate-500 text-xs">All active generated scanning passes across all gates and properties.</p>
                </div>
                <div className="flex items-center gap-3 self-stretch sm:self-auto">
                  <input
                    type="text"
                    placeholder="Search QR codes..."
                    value={qrSearchQuery}
                    onChange={(e) => setQrSearchQuery(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors w-full sm:w-48 text-slate-700 font-medium"
                  />
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setQrForm({ 
                          name: 'Primary Gate Access QR', 
                          gate_id: allGates[0]?.gate_id?.toString() || '' 
                        });
                        setShowQRModal(true);
                      }}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-blue-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 border border-blue-800/50 text-white font-medium px-4 py-2 rounded-xl text-xs shadow-md active:scale-95 transition-all whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add QR</span>
                    </button>
                  )}
                </div>
              </div>

              {isLoading && allQRs.length === 0 ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-8 h-8 text-blue-950 animate-spin" />
                </div>
              ) : allQRs.length === 0 ? (
                <div className="text-center py-20 text-slate-500 space-y-4">
                  <QrCode className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
                  <div>
                    <h4 className="text-slate-800 font-bold">No QR Codes Found</h4>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">QR passes can be generated inside the details view of active gates.</p>
                  </div>
                </div>
              ) : filteredQRs.length === 0 ? (
                <div className="text-center py-20 text-slate-500 space-y-3">
                  <QrCode className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
                  <div>
                    <h4 className="text-slate-800 font-semibold">No Matching QR Codes Found</h4>
                    <p className="text-slate-400 text-xs">Try adjusting your search keywords.</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredQRs.map((qr) => (
                    <QRCodeCard 
                      key={qr.qr_code_id}
                      qrId={qr.qr_code_id}
                      isAdmin={isAdmin}
                      onToggleStatus={handleToggleQRStatus}
                      triggerAlert={triggerAlert}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* -------------------- MODAL: CAMPUS FORM -------------------- */}
      {showCampusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-blue-950 border-b border-blue-900/30 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">{editingCampus ? 'Edit Campus Property' : 'Create Campus Property'}</h3>
              <button 
                onClick={() => setShowCampusModal(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCampus} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Campus Name *</label>
                <input
                  type="text"
                  required
                  value={campusForm.name}
                  onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                  placeholder="e.g. Headquarters Campus"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Campus Code * (Unique)</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={campusForm.code}
                  onChange={(e) => setCampusForm({ ...campusForm, code: e.target.value })}
                  placeholder="e.g. HQ"
                  disabled={!!editingCampus}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors disabled:opacity-50 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Street Address</label>
                <input
                  type="text"
                  value={campusForm.address}
                  onChange={(e) => setCampusForm({ ...campusForm, address: e.target.value })}
                  placeholder="e.g. 100 Technology Parkway"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">City</label>
                <input
                  type="text"
                  value={campusForm.city}
                  onChange={(e) => setCampusForm({ ...campusForm, city: e.target.value })}
                  placeholder="e.g. Boston"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCampusModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-gradient-to-r from-blue-900 to-blue-950 border border-blue-800/50 text-white font-medium rounded-xl text-sm shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Campus</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: GATE FORM -------------------- */}
      {showGateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-blue-950 border-b border-blue-900/30 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">{editingGate ? 'Edit Gate Entrance' : 'Add Gate Entrance'}</h3>
              <button 
                onClick={() => setShowGateModal(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGate} className="p-6 space-y-4">
              {!editingGate && !selectedCampus && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Campus *</label>
                  {campuses.length === 0 ? (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex flex-col gap-1.5">
                      <p className="font-bold flex items-center gap-1">⚠️ No Campuses Configured</p>
                      <p className="text-[11px] leading-relaxed text-amber-700">You must create at least one campus property before adding entry gates. Please configure a campus directory first.</p>
                    </div>
                  ) : (
                    <select
                      value={gateForm.campus_id}
                      onChange={(e) => setGateForm({ ...gateForm, campus_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors text-slate-700 font-medium"
                    >
                      {campuses.map((c) => (
                        <option key={c.campus_id} value={c.campus_id.toString()}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Gate Name *</label>
                <input
                  type="text"
                  required
                  value={gateForm.name}
                  onChange={(e) => setGateForm({ ...gateForm, name: e.target.value })}
                  placeholder="e.g. North Staff Gate"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Gate Code * (Unique)</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={gateForm.code}
                  onChange={(e) => setGateForm({ ...gateForm, code: e.target.value })}
                  placeholder="e.g. GATE-N"
                  disabled={!!editingGate}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors disabled:opacity-50 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Location/Placement Description</label>
                <input
                  type="text"
                  value={gateForm.location}
                  onChange={(e) => setGateForm({ ...gateForm, location: e.target.value })}
                  placeholder="e.g. Floor 1 North Lobby entrance"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Notes/Description</label>
                <textarea
                  value={gateForm.description}
                  onChange={(e) => setGateForm({ ...gateForm, description: e.target.value })}
                  placeholder="Additional operational instructions..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowGateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || (!editingGate && !selectedCampus && campuses.length === 0)}
                  className="px-5 py-2 bg-gradient-to-r from-blue-900 to-blue-950 border border-blue-800/50 text-white font-medium rounded-xl text-sm shadow-md flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Gate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODAL: GENERATE QR FORM -------------------- */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-blue-950 border-b border-blue-900/30 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">Generate Scanning QR Pass</h3>
              <button 
                onClick={() => setShowQRModal(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateQRCode} className="p-6 space-y-4">
              {!selectedGate && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Gate / Entrance *</label>
                  {allGates.length === 0 ? (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex flex-col gap-1.5">
                      <p className="font-bold flex items-center gap-1">⚠️ No Access Gates Configured</p>
                      <p className="text-[11px] leading-relaxed text-amber-700">You must configure at least one active entry gate before generating QR passes. Please go to the Gates tab to add a gate first.</p>
                    </div>
                  ) : (
                    <select
                      value={qrForm.gate_id}
                      onChange={(e) => setQrForm({ ...qrForm, gate_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors text-slate-700 font-medium"
                    >
                      {allGates.map((g) => (
                        <option key={g.gate_id} value={g.gate_id.toString()}>
                          {g.name} ({g.code}) - {g.campus_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">QR Identifier Name *</label>
                <input
                  type="text"
                  required
                  value={qrForm.name}
                  onChange={(e) => setQrForm({ ...qrForm, name: e.target.value })}
                  placeholder="e.g. Main Gate QR"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowQRModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || (!selectedGate && allGates.length === 0)}
                  className="px-5 py-2 bg-gradient-to-r from-blue-900 to-blue-950 border border-blue-800/50 text-white font-medium rounded-xl text-sm shadow-md flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Generate Pass</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------- DYNAMIC CHILD COMPONENT: QR CODE CARD --------------------
interface QRCodeCardProps {
  qrId: number;
  isAdmin: boolean;
  onToggleStatus: (qr: QRCode) => Promise<void>;
  triggerAlert: (type: 'success' | 'error', message: string) => void;
}

function QRCodeCard({ qrId, isAdmin, onToggleStatus, triggerAlert }: QRCodeCardProps) {
  const [qrDetail, setQrDetail] = useState<QRCode | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

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
          <span className="font-mono text-[10px] text-slate-500">{qrDetail.code}</span>
        </div>

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

      {/* Base64 Image Render */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mb-4 select-none relative group">
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
    </div>
  );
}

export default function CampusesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-950 animate-spin" />
      </div>
    }>
      <CampusesPageContent />
    </Suspense>
  );
}
