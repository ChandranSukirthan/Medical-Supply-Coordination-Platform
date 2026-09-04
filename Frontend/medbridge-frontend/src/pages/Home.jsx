import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ArrowRight, 
  AlertTriangle, 
  Search, 
  ArrowLeftRight 
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const targetRoute = isAuthenticated ? '/dashboard' : '/login';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#0d3c4b] selection:text-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0d3c4b] rounded flex items-center justify-center shadow-sm">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0d3c4b] leading-tight tracking-tight">MedBridge LK</h1>
                <p className="text-[11px] text-slate-500 font-semibold tracking-widest uppercase">National Supply Coordination</p>
              </div>
            </div>
            
            {/* Action */}
            <div>
              <button onClick={() => navigate(targetRoute)} className="bg-[#0d3c4b] hover:bg-[#092a35] text-white px-6 py-2.5 rounded-md text-sm font-semibold transition-all shadow-sm flex items-center gap-2">
                {isAuthenticated ? 'Open Dashboard' : 'Facility Login'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>
        
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider mb-6 border border-blue-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Ministry of Health Sri Lanka
            </div>
            
            <h2 className="text-5xl sm:text-6xl font-extrabold text-[#0d3c4b] leading-tight tracking-tight mb-6">
              Bridging the Gap in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0d3c4b] to-blue-600">Healthcare Supplies</span>
            </h2>
            
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl font-medium">
              Sri Lanka's hospitals frequently face acute pharmaceutical and equipment shortages due to uneven regional distribution and logistical bottlenecks. MedBridge LK provides a real-time, centralized platform to map provincial inventories, dynamically matching surplus stocks with critical deficits to ensure uninterrupted patient care.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => navigate(targetRoute)} className="bg-[#0d3c4b] hover:bg-[#092a35] text-white px-8 py-4 rounded-md text-base font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                Access the Network <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => navigate(isAuthenticated ? '/match-supply' : '/login')} className="bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 px-8 py-4 rounded-md text-base font-bold transition-all flex items-center justify-center">
                Explore Available Stock
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-50 py-24 border-t border-slate-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-16 max-w-2xl">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Standard Operating Protocol</h3>
            <h2 className="text-3xl font-bold text-[#0d3c4b] mb-4">How MedBridge Operates</h2>
            <p className="text-slate-600 text-lg font-medium">A streamlined 3-step digital protocol for clinical stock resilience engineered for Chief Pharmacists, Medical Superintendents, and Regional Drug Stores.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div onClick={() => navigate('/login')} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertTriangle className="w-32 h-32 text-red-500" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-6 border border-red-100">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="text-slate-300 font-mono font-bold text-lg mb-2 block">01</span>
                <h4 className="text-xl font-bold text-slate-900 mb-3">1. Report Shortages</h4>
                <p className="text-slate-600 font-medium leading-relaxed mb-6">
                  Hospitals facing stockout risks submit standardized triage reports specifying item codes, current quantities, and depletion runway.
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <Plus className="w-4 h-4" /> Direct MSD Barcode Mapping
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div onClick={() => navigate('/login')} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Search className="w-32 h-32 text-blue-500" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 border border-blue-100">
                  <Search className="w-6 h-6" />
                </div>
                <span className="text-slate-300 font-mono font-bold text-lg mb-2 block">02</span>
                <h4 className="text-xl font-bold text-slate-900 mb-3">2. Locate Surplus</h4>
                <p className="text-slate-600 font-medium leading-relaxed mb-6">
                  Automated regional matching identifies neighboring or provincial teaching hospitals with safe surplus buffers, checking expiry dates.
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <Plus className="w-4 h-4" /> Proximity Optimization
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div onClick={() => navigate('/login')} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <ArrowLeftRight className="w-32 h-32 text-emerald-500" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6 border border-emerald-100">
                  <ArrowLeftRight className="w-6 h-6" />
                </div>
                <span className="text-slate-300 font-mono font-bold text-lg mb-2 block">03</span>
                <h4 className="text-xl font-bold text-slate-900 mb-3">3. Coordinate Transfer</h4>
                <p className="text-slate-600 font-medium leading-relaxed mb-6">
                  Facilities authorize bilateral transfer manifests and coordinate direct transit via MOH refrigerated logistics fleets immediately.
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <Plus className="w-4 h-4" /> Live Sensor Integrity Logs
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-slate-500">
          <p>© 2026 MedBridge LK. Institutional Healthcare Logistics Network.</p>
          <div className="flex gap-6">
            <button onClick={() => navigate('/dashboard')} className="hover:text-[#0d3c4b]">National Formulary</button>
            <button onClick={() => navigate('/dashboard')} className="hover:text-[#0d3c4b]">System Status</button>
            <button onClick={() => navigate('/login')} className="hover:text-[#0d3c4b]">Logout</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
