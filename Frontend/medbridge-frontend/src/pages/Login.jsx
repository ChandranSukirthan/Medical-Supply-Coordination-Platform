import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Mail, Lock, ArrowRight, ShieldCheck, Building2, ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success) {
        login(data.token, data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans text-slate-900 bg-white">
      {/* Left Side Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0d3c4b] relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent"></div>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px,transparent 1px)', backgroundSize: '24px 24px' }}></div>
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
            <h2 className="text-4xl font-extrabold leading-tight mb-6">National Healthcare Supply Coordination Network</h2>
            <p className="text-lg text-blue-100/80 leading-relaxed font-medium mb-12">
              Connecting Sri Lankan hospital inventories in real-time to prevent critical stockouts and accelerate emergency pharmaceutical transfers across all 9 provinces.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-medium text-blue-50"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Ministry of Health Certified Inter-Facility Gateway</div>
              <div className="flex items-center gap-3 text-sm font-medium text-blue-50"><Lock className="w-5 h-5 text-emerald-400" /> 256-Bit Encrypted Real-Time Stock Telemetry</div>
              <div className="flex items-center gap-3 text-sm font-medium text-blue-50"><Building2 className="w-5 h-5 text-emerald-400" /> Direct Priority Integration with 1990 Suwa Seriya Logistics</div>
            </div>
          </div>
        </div>
        <div className="relative z-10 flex justify-between items-center text-xs font-semibold text-blue-200/60 uppercase tracking-wider">
          <p>Government of Sri Lanka (GoSL) • MoH MSD v3.4.1</p>
          <p>SLMC Certified</p>
        </div>
      </div>

      {/* Right Side Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0d3c4b] rounded flex items-center justify-center shadow-sm"><Plus className="w-5 h-5 text-white" /></div>
          <h1 className="text-lg font-bold text-[#0d3c4b] leading-tight">MedBridge LK</h1>
        </div>

        <div className="w-full max-w-md">
          <div className="text-center sm:text-left mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Staff & Facility Sign In</h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Enter your institutional credentials to access your facility's inventory ledger and transfer portal.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Institutional Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="pharmacist@jgh.health.gov.lk"
                  className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-all shadow-sm" required />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-900">Password <span className="text-red-500">*</span></label>
                <a href="#" className="text-sm font-semibold text-[#0d3c4b] hover:text-[#1e6075] transition-colors">Forgot Password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••••••"
                  className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-all shadow-sm" required />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#0d3c4b] hover:bg-[#092a35] disabled:opacity-70 disabled:cursor-not-allowed text-white py-3.5 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <>Access Dashboard <ArrowRight className="w-5 h-5" /></>}
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center"><span className="px-3 bg-white text-xs font-bold uppercase tracking-wider text-slate-400">New facility?</span></div>
            </div>

            <Link to="/register"
              className="w-full bg-white border-2 border-[#0d3c4b] hover:bg-[#0d3c4b]/5 text-[#0d3c4b] py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
              Register Your Facility
            </Link>
          </form>

          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <div className="text-red-600 font-bold mt-0.5">!</div>
            <div>
              <h4 className="text-sm font-bold text-red-700 mb-1">Immediate Critical Stockout?</h4>
              <p className="text-xs text-red-600/90 font-medium leading-relaxed">
                For emergency requisitions of ICU anesthetics, antivenoms, or whole blood, contact the National Command Center at <span className="font-bold">1990 Ext 4</span>.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
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
