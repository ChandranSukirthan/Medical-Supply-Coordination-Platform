import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Mail, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  Building2,
  ChevronLeft
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex font-sans text-slate-900 bg-white">
      
      {/* Left Side (Branding - Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0d3c4b] relative overflow-hidden flex-col justify-between p-12 text-white">
        
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent"></div>
          {/* Dot grid pattern */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <Plus className="w-7 h-7 text-[#0d3c4b]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight tracking-tight">MedBridge LK</h1>
              <p className="text-xs text-blue-200 font-semibold tracking-widest uppercase bg-white/10 inline-block px-2 py-0.5 rounded mt-1">MSD-PORTAL</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-extrabold leading-tight mb-6">
              National Healthcare Supply Coordination Network
            </h2>
            <p className="text-lg text-blue-100/80 leading-relaxed font-medium mb-12">
              Connecting Sri Lankan hospital inventories in real-time to prevent critical stockouts and accelerate emergency pharmaceutical transfers across all 9 provinces.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-medium text-blue-50">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Ministry of Health Certified Inter-Facility Gateway
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-blue-50">
                <Lock className="w-5 h-5 text-emerald-400" />
                256-Bit Encrypted Real-Time Stock Telemetry
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-blue-50">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Direct Priority Integration with 1990 Suwa Seriya Logistics
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex justify-between items-center text-xs font-semibold text-blue-200/60 uppercase tracking-wider">
          <p>Government of Sri Lanka (GoSL) • MoH MSD v3.4.1</p>
          <p>SLMC Certified</p>
        </div>
      </div>

      {/* Right Side (Form) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0d3c4b] rounded flex items-center justify-center shadow-sm">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-[#0d3c4b] leading-tight">MedBridge LK</h1>
        </div>

        <div className="w-full max-w-md">
          <div className="text-center sm:text-left mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Staff & Facility Sign In</h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Enter your institutional credentials or SLMC registration ID to access your facility's inventory ledger and transfer portal.
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Institutional Email or Staff ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  placeholder="pharmacist@jgh.health.gov.lk"
                  className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-all shadow-sm"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Pharmacist In-Charge or Logistics Director credentials registered with MSD.</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-900">
                  Password <span className="text-red-500">*</span>
                </label>
                <a href="#" className="text-sm font-semibold text-[#0d3c4b] hover:text-[#1e6075] transition-colors">
                  Forgot Password / Reset Key?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••••••••••"
                  className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-[#0d3c4b] focus:ring-[#0d3c4b] accent-[#0d3c4b] cursor-pointer" />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Remember this terminal for 30 days</span>
              </label>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                 TLS 1.3
              </span>
            </div>

            <button type="button" onClick={() => navigate('/dashboard')} className="w-full bg-[#0d3c4b] hover:bg-[#092a35] text-white py-3.5 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-4">
              Access Dashboard <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="relative mt-8 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-xs font-bold uppercase tracking-wider text-slate-400">Institutional Single Sign-On</span>
              </div>
            </div>

            <button type="button" className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0d3c4b]" /> Verify via MoH Gov-ID (SL-NDI)
            </button>
            
          </form>

          {/* Emergency Notice */}
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
             <div className="text-red-600 font-bold mt-0.5">!</div>
             <div>
                <h4 className="text-sm font-bold text-red-700 mb-1">Immediate Critical Stockout?</h4>
                <p className="text-xs text-red-600/90 font-medium leading-relaxed">
                  For emergency requisitions of ICU anesthetics, antivenoms, or whole blood, bypass web queuing and contact the National Command Center directly at <span className="font-bold">1990 Ext 4</span>.
                </p>
             </div>
          </div>

          <div className="mt-10 text-center">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#0d3c4b] transition-colors">
              <ChevronLeft className="w-4 h-4" /> Return to public homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
