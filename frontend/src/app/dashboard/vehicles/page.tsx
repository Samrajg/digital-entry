'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Loader2, Download, Search, ChevronLeft, ChevronRight, ArrowUpDown, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Navbar from '@/app/components/Navbar';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/services/apiClient';

export default function VehiclesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingOutId, setCheckingOutId] = useState<number | null>(null);

  // Dropdown data
  const [campuses, setCampuses] = useState<any[]>([]);
  const [securityGuards, setSecurityGuards] = useState<any[]>([]);

  // Filters
  const [skip, setSkip] = useState(0);
  const limit = 20;
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [campusId, setCampusId] = useState('');
  const [securityId, setSecurityId] = useState('');
  
  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(storedUser));
    fetchFiltersData();
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      fetchVehicles();
    }
  }, [currentUser, skip, startDate, endDate, campusId, securityId, sortBy, sortOrder]);

  const fetchFiltersData = async () => {
    try {
      const [campRes, secRes] = await Promise.all([
        apiClient.get('/api/campuses/'),
        apiClient.get('/api/security/')
      ]);
      setCampuses(campRes.data);
      setSecurityGuards(secRes.data);
    } catch (err) {
      console.error("Failed to load filter options", err);
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (campusId) params.append('campus_id', campusId);
      if (securityId) params.append('security_id', securityId);

      const res = await apiClient.get(`/api/vehicles/?${params.toString()}`);
      setVehicles(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (vehicleId: number) => {
    setCheckingOutId(vehicleId);
    try {
      await apiClient.post(`/api/vehicles/${vehicleId}/checkout`);
      // Update local state to reflect the checkout
      setVehicles(prev => prev.map(v => 
        v.id === vehicleId ? { ...v, checked_out_at: new Date().toISOString() } : v
      ));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to check out vehicle");
    } finally {
      setCheckingOutId(null);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setSkip(0);
  };

  const exportCSV = () => {
    if (vehicles.length === 0) return;
    const rows = vehicles.map(v => {
      const dateStr = new Date(v.created_at).toLocaleString().replace(/,/g, '');
      let baseRow = [v.id, dateStr, v.campus_name, v.gate_name, v.security_name];
      const formDetails = Object.entries(v.form_data).map(([k, val]) => `${k}: ${val}`).join(' | ');
      baseRow.push(formDetails);
      return baseRow.join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + ['ID,Date,Campus,Gate,Authorized By,Details'].join(',') + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vehicle_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (vehicles.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Vehicle Logs - ${new Date().toLocaleDateString()}`, 14, 15);
    
    const tableColumn = ["Date/Time", "Campus", "Gate", "Authorized By", "Details"];
    const tableRows = vehicles.map(v => {
      const dateStr = new Date(v.created_at).toLocaleString();
      const formDetails = Object.entries(v.form_data).map(([k, val]) => `${k}: ${val}`).join('\n');
      return [
        dateStr,
        v.campus_name,
        v.gate_name,
        v.security_name,
        formDetails
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      columnStyles: {
        4: { cellWidth: 70 }
      }
    });

    doc.save(`vehicle_logs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 md:pb-12 transition-colors duration-300">
      <Navbar currentUser={currentUser} />

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300">
          
          {/* Header & Controls */}
          <div className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Vehicle Audit Logs</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Total records: {total}</p>
            </div>
            <div className="relative group w-full sm:w-auto">
              <button
                disabled={vehicles.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" /> Export Report <ChevronDown className="w-4 h-4 ml-1 opacity-70 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute right-0 top-full pt-1 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                  <button onClick={exportCSV} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" /> CSV
                  </button>
                  <button onClick={exportPDF} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800">
                    <FileText className="w-4 h-4 text-red-600" /> PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-colors">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Date Range</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="w-full text-xs p-2.5 md:p-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setSkip(0); }}
                />
                <input 
                  type="date" 
                  className="w-full text-xs p-2.5 md:p-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setSkip(0); }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Campus</label>
              <select 
                className="w-full text-sm p-2.5 md:p-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                value={campusId}
                onChange={(e) => { setCampusId(e.target.value); setSkip(0); }}
              >
                <option value="">All Campuses</option>
                {campuses.map(c => (
                  <option key={c.campus_id} value={c.campus_id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Security Guard</label>
              <select 
                className="w-full text-sm p-2.5 md:p-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                value={securityId}
                onChange={(e) => { setSecurityId(e.target.value); setSkip(0); }}
              >
                <option value="">All Guards</option>
                {securityGuards.map(s => (
                  <option key={s.security_id} value={s.security_id}>{s.security_name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); setCampusId(''); setSecurityId(''); setSkip(0); }}
                className="w-full p-2.5 md:p-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Results Area */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">{error}</div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400 space-y-4">
              <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <div>
                <h4 className="text-slate-800 dark:text-slate-200 font-bold">No Vehicle Logs Found</h4>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Try adjusting your filters.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 transition-colors">
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center gap-1">Date/Time <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4">Details</th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('campus_name')}>
                        <div className="flex items-center gap-1">Entry Point <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('security_name')}>
                        <div className="flex items-center justify-end gap-1">Entry / Exit Guards <ArrowUpDown className="w-3 h-3" /></div>
                      </th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4 text-right">Status / Check-out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                    {vehicles.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{new Date(log.created_at).toLocaleDateString()}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <ul className="text-xs space-y-1">
                            {Object.entries(log.form_data).map(([k, v]) => (
                              <li key={k}><span className="font-semibold text-slate-700 dark:text-slate-300">{k}:</span> <span className="text-slate-600 dark:text-slate-400">{String(v)}</span></li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{log.campus_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{log.gate_name} ({log.qr_name})</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-medium text-slate-700 dark:text-slate-300">In: {log.security_name}</div>
                          {log.checkout_security_name && (
                            <div className="text-xs text-slate-500 mt-1">Out: {log.checkout_security_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {log.checked_out_at ? (
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {Math.floor((new Date(log.checked_out_at).getTime() - new Date(log.created_at).getTime()) / 60000)} mins
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">--</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {log.checked_out_at ? (
                            <div className="flex flex-col items-end">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                Checked Out
                              </span>
                              <span className="text-[10px] text-slate-500 mt-1">
                                {new Date(log.checked_out_at).toLocaleTimeString()}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Active
                              </span>
                              <button
                                onClick={() => handleCheckout(log.id)}
                                disabled={checkingOutId === log.id}
                                className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                              >
                                {checkingOutId === log.id ? 'Processing...' : 'Check Out'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                {vehicles.map((log) => (
                  <div key={log.id} className="p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                          {new Date(log.created_at).toLocaleDateString()}
                          {!log.checked_out_at && (
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Authorized By</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">In: {log.security_name}</div>
                        {log.checkout_security_name && (
                          <div className="text-xs text-slate-500 mt-0.5">Out: {log.checkout_security_name}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Vehicle Details</p>
                      <ul className="text-xs space-y-1.5">
                        {Object.entries(log.form_data).map(([k, v]) => (
                          <li key={k} className="flex flex-col">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{k}</span> 
                            <span className="text-slate-600 dark:text-slate-400">{String(v)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{log.campus_name}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{log.gate_name}</span>
                      </div>

                      {!log.checked_out_at ? (
                        <button
                          onClick={() => handleCheckout(log.id)}
                          disabled={checkingOutId === log.id}
                          className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {checkingOutId === log.id ? '...' : 'Check Out'}
                        </button>
                      ) : (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-medium block">Out: {new Date(log.checked_out_at).toLocaleTimeString()}</span>
                          <span className="text-[10px] text-slate-400 font-medium block">{Math.floor((new Date(log.checked_out_at).getTime() - new Date(log.created_at).getTime()) / 60000)} mins</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {!loading && total > 0 && (
            <div className="px-4 md:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Showing {skip + 1} to {Math.min(skip + limit, total)} of {total} results
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                <button 
                  onClick={() => setSkip(Math.max(0, skip - limit))}
                  disabled={skip === 0}
                  className="p-2 md:p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
                </button>
                <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-300">Page {currentPage} of {totalPages}</span>
                <button 
                  onClick={() => setSkip(skip + limit)}
                  disabled={currentPage >= totalPages}
                  className="p-2 md:p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
