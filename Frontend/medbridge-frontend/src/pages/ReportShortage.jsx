import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  Building2, 
  ChevronDown,
  Plus,
  User,
  ShieldAlert,
  PackageSearch,
  AlertCircle,
  AlertOctagon,
  Clock,
  History,
  CheckSquare,
  Building,
  Send,
  ArrowLeft
} from 'lucide-react';

const ReportShortage = () => {
  const navigate = useNavigate();
  const [selectedPriority, setSelectedPriority] = useState('Critical');

  const priorities = [
    {
      id: 'Low',
      title: 'Low',
      description: 'Routine replenishment',
      runway: 'Runway > 14 days',
      color: 'bg-emerald-500',
      borderColor: 'border-slate-200',
      bgHover: 'hover:border-emerald-500'
    },
    {
      id: 'Medium',
      title: 'Medium',
      description: 'Standard transfer',
      runway: 'Runway 7-14 days',
      color: 'bg-amber-500',
      borderColor: 'border-slate-200',
      bgHover: 'hover:border-amber-500'
    },
    {
      id: 'High',
      title: 'High',
      description: 'Alert cluster hub',
      runway: 'Runway 48-72 hours',
      color: 'bg-orange-500',
      borderColor: 'border-slate-200',
      bgHover: 'hover:border-orange-500'
    },
    {
      id: 'Critical',
      title: 'Critical',
      description: 'Immediate dispatch broadcast',
      runway: 'Depletion < 24 hours',
      color: 'bg-red-600',
      borderColor: 'border-red-600',
      bgHover: 'hover:border-red-600',
      selectedBg: 'bg-red-50'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left side - Logo & Nav */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#0d3c4b] rounded flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#0d3c4b] leading-tight">MedBridge LK</h1>
                  <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">National Supply Coordination Hub</p>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-1">
                <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Dashboard</Link>
                <Link to="/report-shortage" className="px-4 py-2 text-sm font-semibold text-[#0d3c4b] border-b-2 border-[#0d3c4b]">Report Shortage</Link>
                <Link to="/match-supply" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Available Stock</Link>
                <a href="#" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Transfers</a>
              </div>
            </div>

            {/* Right side - Search, Actions, Profile */}
            <div className="flex items-center gap-4">
              <div className="relative hidden lg:block w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0d3c4b] focus:border-[#0d3c4b] sm:text-sm transition-colors" 
                  placeholder="Search item, SKU or facility..." 
                />
              </div>

              <button className="hidden sm:flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                <ShieldAlert className="w-4 h-4" />
                + Emergency Request
              </button>

              <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
                <button className="text-slate-400 hover:text-slate-600 relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                </button>
                <button className="text-slate-400 hover:text-slate-600">
                  <HelpCircle className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3 ml-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-md transition-colors">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-slate-900">Jaffna General Hospital</p>
                    <p className="text-xs text-slate-500">Northern Province • Chief Pharmacist</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* Breadcrumbs */}
      <div className="max-w-4xl mx-auto px-4 mt-6 flex items-center text-sm text-slate-500 font-medium">
        <Link to="/dashboard" className="hover:text-[#0d3c4b] transition-colors">Dashboard</Link>
        <ChevronDown className="w-3.5 h-3.5 mx-2 -rotate-90 text-slate-400" />
        <a href="#" className="hover:text-[#0d3c4b] transition-colors">Shortages</a>
        <ChevronDown className="w-3.5 h-3.5 mx-2 -rotate-90 text-slate-400" />
        <span className="text-slate-900 font-semibold">Report Supply Shortage</span>
      </div>

      <main className="max-w-4xl mx-auto px-4 mt-4">
        
        {/* Facility Metadata Banner */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Building2 className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-0.5">Reporting Facility Context</p>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Jaffna General Hospital</h2>
                <span className="text-slate-400">•</span>
                <p className="text-sm text-slate-600 font-medium">Northern Province (Cluster 01)</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              Facility ID: <span className="font-semibold text-slate-700">JGH-NP-01</span>
            </span>
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              MSD Network Live
            </div>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* Form Header */}
          <div className="px-6 py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Report Supply Shortage</h2>
              <p className="text-sm text-slate-500 mt-1">Submit acute stock deficit data to trigger automated matching across provincial hospital reserves and MSD dispatch nodes.</p>
            </div>
            <div className="flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide">
              <AlertOctagon className="w-3.5 h-3.5" />
              Triage Level Required
            </div>
          </div>

          <div className="p-6 space-y-8">
            
            {/* Select Supply Item */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Select Supply Item <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-500 font-medium">Search by item name or MSD Code</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PackageSearch className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  defaultValue="Surgical Gloves (Latex Size 7.5) - SL-MSD-SURG-7501"
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-shadow" 
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Standard Ministry of Health item classification. Matching will scan Northern & North Central clusters first.</p>
            </div>

            {/* Quantities Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Current Quantity */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-semibold text-slate-900">
                    Current Quantity on Hand <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500 font-medium">Physical stock count</span>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    defaultValue="50"
                    className="block w-full pl-4 pr-16 py-2.5 border border-slate-300 rounded-md text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-shadow" 
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm font-medium">pairs</span>
                  </div>
                </div>
              </div>

              {/* Quantity Required */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-semibold text-slate-900">
                    Quantity Required <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-500 font-medium">Buffer target</span>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    defaultValue="500"
                    className="block w-full pl-4 pr-16 py-2.5 border border-slate-300 rounded-md text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-shadow" 
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm font-medium">pairs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deficit Alert */}
            <div className="bg-red-50/50 border border-red-200 rounded-md px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold text-sm">-450 pairs urgent deficit</span>
                <span className="text-sm font-medium text-red-500/80 hidden sm:inline">(90% stock shortfall against standard 14-day quota)</span>
              </div>
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider bg-red-100 px-2 py-1 rounded">High Deficit Alert</span>
            </div>

            {/* Priority Level */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Priority Level <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-500 font-medium">Defines automated escalation thresholds</span>
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
                      <span className={`text-sm font-bold ${
                        selectedPriority === priority.id && priority.id === 'Critical' ? 'text-red-700' : 'text-slate-900'
                      }`}>
                        {priority.title}
                      </span>
                      {priority.id === 'Critical' ? (
                        <AlertOctagon className={`w-4 h-4 ${selectedPriority === priority.id ? 'text-red-600' : 'text-slate-400'}`} />
                      ) : (
                        <span className={`w-2 h-2 rounded-full mt-1 ${priority.color}`}></span>
                      )}
                    </div>
                    <p className={`text-xs font-medium mb-1 ${
                      selectedPriority === priority.id && priority.id === 'Critical' ? 'text-red-900' : 'text-slate-700'
                    }`}>
                      {priority.description}
                    </p>
                    <p className={`text-[11px] ${
                      selectedPriority === priority.id && priority.id === 'Critical' ? 'text-red-600 font-semibold' : 'text-slate-500'
                    }`}>
                      {priority.runway}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Department and Runway Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Clinical Department / Primary Ward <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-4 w-4 text-slate-400" />
                  </div>
                  <select className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent appearance-none bg-white">
                    <option>ICU & Emergency Operating Theatres (Theatres 1-4)</option>
                    <option>General Surgery Ward</option>
                    <option>Maternity & Neonatal</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Primary point of consumption impacted by stockout.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Estimated Depletion Runway <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-4 w-4 text-slate-400" />
                  </div>
                  <select className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent appearance-none bg-white">
                    <option>&lt; 24 Hours (Immediate critical shortage)</option>
                    <option>24 - 48 Hours</option>
                    <option>2 - 5 Days</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Time remaining until complete bed/theatre halt.</p>
              </div>
            </div>

            {/* Justification Textarea */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Clinical Justification & Notes <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-slate-500 font-medium">248 / 500 characters</span>
              </div>
              <textarea 
                rows="4" 
                className="block w-full p-4 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-shadow resize-none"
                defaultValue="Emergency surgical caseload increased by 40% over the last 48 hours following road traffic casualty transfers from Kilinochchi. Size 7.5 sterile gloves depleted; immediate stock required to maintain round-the-clock neuro and trauma operations."
              ></textarea>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-slate-500">Include batch specifics, emergency patient counts, or acceptable alternative sizes (e.g. Size 7.0/8.0).</p>
                <button className="text-xs font-semibold text-[#0d3c4b] hover:text-[#1e6075] flex items-center gap-1">
                  <History className="w-3.5 h-3.5" />
                  Insert previous requisition note
                </button>
              </div>
            </div>

            {/* Authorization Checkbox */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 rounded bg-[#0d3c4b] flex items-center justify-center cursor-pointer shadow-sm">
                  <CheckSquare className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">Institutional & Clinical Officer Authorization</p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  I confirm that this shortage is verified by the Chief Medical Officer / Supervising Pharmacist (SLMC Reg active). 
                  False reporting of critical alerts triggers provincial audit under Ministry of Health logistics guidelines.
                </p>
              </div>
            </div>

          </div>

          {/* Form Actions / Footer */}
          <div className="px-6 py-5 border-t border-slate-100 bg-white flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors w-full sm:w-auto justify-center">
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                Save Draft
              </button>
              <button className="w-full sm:w-auto px-5 py-2.5 bg-[#0d3c4b] hover:bg-[#092a35] rounded-md text-sm font-semibold text-white transition-colors shadow-sm flex items-center justify-center gap-2">
                Submit Report & Match Stock
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Global Footer Notes */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-[11px] text-slate-500 font-medium">
          <div className="flex gap-6 mb-2 sm:mb-0">
            <span className="flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> Automated matching active (Radius: 120km)</span>
            <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> SLMC Level-3 Encrypted Requisition</span>
          </div>
          <span>System Version: v2.4.1 (MSD Gov-LK)</span>
        </div>
      </main>
    </div>
  );
};

export default ReportShortage;
