'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/services/authService';
import Navbar from '@/app/components/Navbar';
import { apiClient } from '@/services/apiClient';
import CreationProgressModal from '@/app/components/CreationProgressModal';
import { Plus, X, Trash2, Save } from 'lucide-react';

interface FormFieldSchema {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

interface DynamicForm {
  form_id: string;
  name: string;
  description: string;
  schema: FormFieldSchema[];
  is_active: boolean;
}

export default function FormsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [forms, setForms] = useState<DynamicForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Builder State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [newFormId, setNewFormId] = useState('');
  const [newFormName, setNewFormName] = useState('');
  const [newFormDesc, setNewFormDesc] = useState('');
  const [newFormFields, setNewFormFields] = useState<FormFieldSchema[]>([]);

  // Progress Modal State
  const [progressModal, setProgressModal] = useState({ isOpen: false, progress: 0, title: '', message: '' });

  const simulateProgress = (title: string, message: string) => {
    setProgressModal({ isOpen: true, progress: 0, title, message });
    return new Promise<void>((resolve) => {
      let current = 0;
      const interval = setInterval(() => {
        current += Math.floor(Math.random() * 15) + 5;
        if (current >= 90) {
          current = 90;
          clearInterval(interval);
          setProgressModal(prev => ({ ...prev, progress: current }));
          resolve();
        } else {
          setProgressModal(prev => ({ ...prev, progress: current }));
        }
      }, 50);
    });
  };

  const completeProgress = () => {
    setProgressModal(prev => ({ ...prev, progress: 100 }));
    setTimeout(() => {
      setProgressModal({ isOpen: false, progress: 0, title: '', message: '' });
    }, 400);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(storedUser));
    fetchForms();
  }, [router]);

  const fetchForms = async () => {
    try {
      const resp = await apiClient.get('/api/forms/');
      setForms(resp.data);
    } catch (e) {
      console.error('Failed to load forms', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBuilder = (form?: DynamicForm) => {
    if (form) {
      setIsEditingForm(true);
      setNewFormId(form.form_id);
      setNewFormName(form.name);
      setNewFormDesc(form.description || '');
      setNewFormFields(form.schema);
    } else {
      setIsEditingForm(false);
      // Pre-populate with primary required fields as requested by user
      setNewFormFields([
        { id: `field_${Date.now()}_1`, type: 'text', label: 'Full Name', required: true },
        { id: `field_${Date.now()}_2`, type: 'text', label: 'Phone Number', required: true },
        { id: `field_${Date.now()}_3`, type: 'textarea', label: 'Address', required: true },
        { id: `field_${Date.now()}_4`, type: 'textarea', label: 'Reason for Visit', required: true },
        { id: `field_${Date.now()}_5`, type: 'text', label: 'Person to Visit', required: true }
      ]);
      setNewFormId('');
      setNewFormName('');
      setNewFormDesc('');
    }
    setIsBuilderOpen(true);
  };

  const handleAddField = (type: string) => {
    const newField: FormFieldSchema = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} field`,
      required: false,
      options: type === 'select' ? ['Option 1'] : undefined
    };
    setNewFormFields([...newFormFields, newField]);
  };

  const handleUpdateField = (id: string, updates: Partial<FormFieldSchema>) => {
    setNewFormFields(newFormFields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleRemoveField = (id: string) => {
    setNewFormFields(newFormFields.filter(f => f.id !== id));
  };

  const handleSaveForm = async () => {
    setError('');
    if (!newFormId) {
      setError("Please provide a unique Form ID.");
      return;
    }
    if (!newFormName) {
      setError("Please provide a name for the form.");
      return;
    }
    
    await simulateProgress(isEditingForm ? 'Updating Form' : 'Creating Form', 'Saving form schema to database...');
    
    try {
      const payload = {
        form_id: newFormId, // Passed for POST, ignored by PUT if not matching path
        name: newFormName,
        description: newFormDesc,
        schema: newFormFields
      };
      
      if (isEditingForm) {
        await apiClient.put(`/api/forms/${newFormId}`, payload);
      } else {
        await apiClient.post('/api/forms/', payload);
      }
      
      completeProgress();
      
      setIsBuilderOpen(false);
      setIsEditingForm(false);
      setNewFormId('');
      setNewFormName('');
      setNewFormDesc('');
      setNewFormFields([]);
      fetchForms();
    } catch (e) {
      setProgressModal({ isOpen: false, progress: 0, title: '', message: '' });
      console.error('Failed to save form', e);
      setError("Error saving form");
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar currentUser={currentUser} />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dynamic Forms</h1>
            <p className="text-slate-500 text-sm">Create and manage custom forms for your QR Codes.</p>
          </div>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition-colors font-medium flex items-center gap-2"
            onClick={() => handleOpenBuilder()}
          >
            <Plus className="w-4 h-4" /> Create New Form
          </button>
        </div>

        {loading ? (
          <p>Loading forms...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map(form => (
              <div key={form.form_id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-2">{form.name}</h3>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">{form.description}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <span className={`w-2 h-2 rounded-full ${form.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {form.is_active ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {form.schema.length} Fields
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => handleOpenBuilder(form)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    Edit Form
                  </button>
                </div>
              </div>
            ))}
            {forms.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                <p>No forms found. Create one to get started!</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Form Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">{isEditingForm ? 'Edit Form' : 'Form Builder'}</h2>
              <button onClick={() => setIsBuilderOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            {error && (
              <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-600 text-sm font-semibold">
                {error}
              </div>
            )}
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-8">
              {/* Left Column: Form Details & Tools */}
              <div className="w-full md:w-1/3 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 border-b pb-2">Form Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Form ID (Unique) <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={newFormId} 
                      onChange={e => setNewFormId(e.target.value)} 
                      disabled={isEditingForm}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono disabled:opacity-50 disabled:bg-slate-100"
                      placeholder="e.g. FORM-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Form Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={newFormName} 
                      onChange={e => setNewFormName(e.target.value)} 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g. VIP Event Registration"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                      value={newFormDesc} 
                      onChange={e => setNewFormDesc(e.target.value)} 
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-800 border-b pb-2">Add Field</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleAddField('text')} className="border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-medium py-2 rounded-lg text-slate-700">Text Input</button>
                    <button onClick={() => handleAddField('number')} className="border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-medium py-2 rounded-lg text-slate-700">Number</button>
                    <button onClick={() => handleAddField('email')} className="border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-medium py-2 rounded-lg text-slate-700">Email</button>
                    <button onClick={() => handleAddField('textarea')} className="border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-medium py-2 rounded-lg text-slate-700">Long Text</button>
                    <button onClick={() => handleAddField('select')} className="border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-medium py-2 rounded-lg text-slate-700 col-span-2">Dropdown (Select)</button>
                  </div>
                </div>
              </div>

              {/* Right Column: Fields Preview */}
              <div className="w-full md:w-2/3 bg-slate-50 rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  Form Preview 
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{newFormFields.length} Fields</span>
                </h3>
                
                {newFormFields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg text-slate-400">
                    <p>No fields added yet. Use the tools on the left to add fields.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {newFormFields.map((field, index) => (
                      <div key={field.id} className="bg-white border border-slate-200 rounded-lg p-4 relative group shadow-sm">
                        <button 
                          onClick={() => handleRemoveField(field.id)}
                          className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors"
                          title="Remove Field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="flex gap-4 items-start">
                          <div className="bg-slate-100 text-slate-500 font-bold w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-1">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Field Label</label>
                                <input 
                                  type="text" 
                                  value={field.label}
                                  onChange={e => handleUpdateField(field.id, { label: e.target.value })}
                                  className="w-full border border-slate-300 rounded text-sm px-2 py-1.5 focus:border-blue-500 outline-none font-medium text-slate-800"
                                />
                              </div>
                              <div className="w-24 shrink-0">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Required</label>
                                <div className="flex items-center h-8">
                                  <input 
                                    type="checkbox" 
                                    checked={field.required}
                                    onChange={e => handleUpdateField(field.id, { required: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {field.type === 'select' && (
                              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dropdown Options (comma separated)</label>
                                <input 
                                  type="text" 
                                  value={field.options?.join(', ') || ''}
                                  onChange={e => {
                                    const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                    handleUpdateField(field.id, { options: opts.length ? opts : ['Option 1'] });
                                  }}
                                  className="w-full border border-slate-300 rounded text-sm px-2 py-1.5 focus:border-blue-500 outline-none"
                                  placeholder="e.g. Yes, No, Maybe"
                                />
                              </div>
                            )}
                            
                            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">type: {field.type}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsBuilderOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveForm}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                disabled={!newFormName || !newFormId}
              >
                <Save className="w-4 h-4" /> Save Form
              </button>
            </div>
          </div>
        </div>
      )}
      
      <CreationProgressModal 
        isOpen={progressModal.isOpen} 
        progress={progressModal.progress} 
        title={progressModal.title} 
        message={progressModal.message} 
      />
    </div>
  );
}
