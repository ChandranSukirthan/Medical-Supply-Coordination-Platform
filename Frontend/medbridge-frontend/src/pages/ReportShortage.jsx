import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ChevronDown,
  Plus,
  ShieldAlert,
  PackageSearch,
  AlertCircle,
  AlertOctagon,
  Clock,
  CheckSquare,
  Building,
  Send,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogOut
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';

const ReportShortage = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const handleQuickSwitch = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success) {
        login(data.token, data.user);
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to switch facility: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const [medicine, setMedicine] = useState('Surgical Gloves (Latex Size 7.5)');
  const [currentQty, setCurrentQty] = useState(50);
  const [requiredQty, setRequiredQty] = useState(500);
  const [selectedPriority, setSelectedPriority] = useState('Critical');
  const [department, setDepartment] = useState('ICU & Emergency Operating Theatres (Theatres 1-4)');
  const [runway, setRunway] = useState('< 24 Hours (Immediate critical shortage)');
  const [notes, setNotes] = useState('Depleted stock in trauma theatre. Urgent reallocation required to maintain continuous operations.');
  const [authorized, setAuthorized] = useState(true);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const priorities = [
    { id: 'Low', title: 'Low', apiVal: 'LOW', description: 'Routine replenishment', runway: 'Runway > 14 days', color: 'bg-emerald-500', borderColor: 'border-slate-200' },
    { id: 'Medium', title: 'Medium', apiVal: 'MEDIUM', description: 'Standard transfer', runway: 'Runway 7-14 days', color: 'bg-amber-500', borderColor: 'border-slate-200' },
    { id: 'High', title: 'High', apiVal: 'HIGH', description: 'Alert cluster hub', runway: 'Runway 48-72 hours', color: 'bg-orange-500', borderColor: 'border-slate-200' },
    { id: 'Critical', title: 'Critical', apiVal: 'HIGH', description: 'Immediate dispatch', runway: 'Depletion < 24 hours', color: 'bg-red-600', borderColor: 'border-red-600', selectedBg: 'bg-red-50' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authorized) {
      setError('Please certify the clinical officer authorization.');
      return;
    }
    if (!medicine.trim()) {
      setError('Please specify the medical supply item.');
      return;
    }
    if (Number(requiredQty) <= 0) {
      setError('Quantity required must be at least 1 unit.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const requestId = `REQ-${Date.now().toString().slice(-6)}`;
      const reqDate = new Date();
      reqDate.setDate(reqDate.getDate() + (selectedPriority === 'Critical' ? 1 : 5));

      const selectedPriorityObj = priorities.find(p => p.id === selectedPriority);

      await api.post('/requests', {
        requestId,
        medicine: medicine.trim(),
        quantity: Number(requiredQty),
        urgency: selectedPriorityObj ? selectedPriorityObj.apiVal : 'HIGH',
        location: user?.hospital?.location || user?.location || 'Jaffna',
        province: user?.hospital?.province || user?.province || 'Northern',
        requiredBy: reqDate.toISOString(),
      });

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2200);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not record requisition in MongoDB.');
    } finally {
      setLoading(false);
    }
  };

  const deficit = Math.max(0, requiredQty - currentQty);
  const hospitalName = user?.name || user?.hospital?.name || 'Your Facility';
  const currentHospitalId = (user?.hospitalId || user?.hospital?.hospitalId || '').trim();
  const hospitalId = currentHospitalId || '—';
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#0d3c4b] rounded flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#0d3c4b] leading-tight">MedBridge LK</h1>
                  <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">National Supply Coordination Hub</p>
                </div>
              </Link>

              <div className="hidden md:flex items-center space-x-1">
                <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Dashboard</Link>
                <Link to="/report-shortage" className="px-4 py-2 text-sm font-semibold text-[#0d3c4b] border-b-2 border-[#0d3c4b]">Report Shortage</Link>
                <Link to="/match-supply" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Available Stock</Link>
              </div>
            </div>

            <div className="relative">
              <div 
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-slate-900">{hospitalName}</p>
                  <p className="text-xs text-slate-500">ID: {hospitalId}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#0d3c4b] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {hospitalName.charAt(0)}
                </div>
              </div>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="px-4 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#0d3c4b] flex items-center justify-center text-white font-bold text-base shadow-sm">
                        {hospitalName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{hospitalName}</p>
                        <p className="text-xs text-slate-500 font-medium">{userEmail || 'hospital_admin'}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Facility ID: {hospitalId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Facility Switcher */}
                  <div className="p-2 border-b border-slate-100 bg-slate-50/40">
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Switch Facility (Testing)</p>
                    <button 
                      onClick={() => handleQuickSwitch('sukirsukirthan347@gmail.com', 'password123')}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${currentHospitalId.toLowerCase() === 'jf001' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-white text-slate-700'}`}
                    >
                      <span>Jaffna Hospital (JF001)</span>
                      {currentHospitalId.toLowerCase() === 'jf001' && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Active</span>}
                    </button>
                    <button 
                      onClick={() => handleQuickSwitch('sukirthan@gmail.com', 'password123')}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${currentHospitalId.toLowerCase() === 'kk001' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-white text-slate-700'}`}
                    >
                      <span>Kilionochchi Hospital (KK001)</span>
                      {currentHospitalId.toLowerCase() === 'kk001' && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Active</span>}
                    </button>
                  </div>

                  <div className="p-2">
                    <button 
                      onClick={handleSignOut}
                      className="w-full px-3 py-2 rounded-lg hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-3 text-red-600 text-sm font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Click outside to close profile */}
      {showProfile && (
        <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)}></div>
      )}

      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 mt-6 flex items-center text-sm text-slate-500 font-medium">
        <Link to="/dashboard" className="hover:text-[#0d3c4b] transition-colors">Dashboard</Link>
        <ChevronDown className="w-3.5 h-3.5 mx-2 -rotate-90 text-slate-400" />
        <span className="text-slate-900 font-semibold">Report Supply Shortage (MongoDB Record)</span>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-4">
        
        {/* Facility Context Banner */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Building2 className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-0.5">Origin Facility Context</p>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{hospitalName}</h2>
                <span className="text-slate-400">•</span>
                <p className="text-sm text-slate-600 font-medium">Facility ID: {hospitalId}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-medium text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            MongoDB Live Sync
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 shadow-sm">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Requisition Logged to MongoDB!</h4>
              <p className="text-xs text-emerald-700 mt-0.5">Your shortage notice has been recorded in the database. Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Main Form Container */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* Form Header */}
          <div className="px-6 py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Broadcast Supply Shortage</h2>
              <p className="text-sm text-slate-500 mt-1">Saves directly to MongoDB and triggers national logistics dispatch matching.</p>
            </div>
            <div className="flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide">
              <AlertOctagon className="w-3.5 h-3.5" />
              Triage Alert Level
            </div>
          </div>

          <div className="p-6 space-y-8">
            
            {/* Supply Item Input */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Supply Item / Medicine Catalog <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-500 font-medium">Standard MoH Classification</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PackageSearch className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={medicine}
                  onChange={(e) => setMedicine(e.target.value)}
                  placeholder="e.g. Atropine Sulfate, Surgical Gloves, Insulin..."
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-shadow" 
                  required
                />
              </div>
            </div>

            {/* Quantities Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-semibold text-slate-900">
                    Current Quantity on Hand
                  </label>
                  <span className="text-xs text-slate-500 font-medium">Stock count</span>
                </div>
                <input 
                  type="number" 
                  value={currentQty}
                  min={0}
                  onChange={(e) => setCurrentQty(Number(e.target.value))}
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-md text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent" 
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-semibold text-slate-900">
                    Quantity Required <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500 font-medium">Deficit target</span>
                </div>
                <input 
                  type="number" 
                  value={requiredQty}
                  min={1}
                  onChange={(e) => setRequiredQty(Number(e.target.value))}
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-md text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent" 
                  required
                />
              </div>
            </div>

            {/* Deficit Alert Box */}
            {deficit > 0 && (
              <div className="bg-red-50/70 border border-red-200 rounded-md px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-bold text-sm">-{deficit.toLocaleString()} units net deficit</span>
                </div>
                <span className="text-xs font-bold text-red-700 uppercase tracking-wider bg-red-100 px-2 py-1 rounded">Priority Requisition</span>
              </div>
            )}

            {/* Priority Level */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Priority Level <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-500 font-medium">Determines cluster routing urgency</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {priorities.map((priority) => (
                  <div 
                    key={priority.id}
                    onClick={() => setSelectedPriority(priority.id)}
                    className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                      selectedPriority === priority.id 
                        ? `${priority.borderColor} ${priority.selectedBg || 'bg-white'} shadow-sm` 
                        : `border-slate-200 bg-white hover:border-slate-300`
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold text-slate-900">
                        {priority.title}
                      </span>
                      <span className={`w-2.5 h-2.5 rounded-full ${priority.color}`}></span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 mb-1">{priority.description}</p>
                    <p className="text-[11px] text-slate-500">{priority.runway}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Clinical Ward / Department
                </label>
                <input 
                  type="text" 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Estimated Depletion Runway
                </label>
                <input 
                  type="text" 
                  value={runway}
                  onChange={(e) => setRunway(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b]"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Clinical Justification & Notes
              </label>
              <textarea 
                rows="3" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full p-3.5 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] resize-none"
              ></textarea>
            </div>

            {/* Authorization Checkbox */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex gap-3">
              <input 
                type="checkbox" 
                id="auth"
                checked={authorized}
                onChange={(e) => setAuthorized(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-[#0d3c4b] accent-[#0d3c4b] cursor-pointer"
              />
              <label htmlFor="auth" className="cursor-pointer">
                <p className="text-sm font-bold text-slate-900 mb-0.5">Clinical Officer Verification</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  I confirm that this requisition is authorized by the Supervising Pharmacist / Medical Superintendent. Saving will write directly to the national MongoDB database.
                </p>
              </label>
            </div>

          </div>

          {/* Form Actions */}
          <div className="px-6 py-5 border-t border-slate-100 bg-white flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')} 
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                type="button"
                onClick={() => {
                  localStorage.setItem('shortage_draft', JSON.stringify({ medicine, currentQty, requiredQty, selectedPriority, department, runway, notes }));
                  alert('Draft saved locally in your browser!');
                }}
                className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Save Draft
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#0d3c4b] hover:bg-[#092a35] disabled:opacity-70 disabled:cursor-not-allowed rounded-md text-sm font-bold text-white transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving to MongoDB...</>
                ) : (
                  <>Submit Requisition & Save to MongoDB <Send className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>

        </form>

      </main>
    </div>
  );
};

export default ReportShortage;
