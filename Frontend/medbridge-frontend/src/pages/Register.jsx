import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Mail, Lock, Building2, MapPin, ShieldCheck,
  ArrowRight, ChevronLeft, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, Hash
} from 'lucide-react';
import api from '../api';

const SRI_LANKA_PROVINCES = [
  'Western', 'Central', 'Southern', 'Northern', 'Eastern',
  'North Western', 'North Central', 'Uva', 'Sabaragamuwa'
];

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    hospitalId: '',
    name: '',
    location: '',
    province: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    if (!form.hospitalId.trim()) return 'Hospital ID is required.';
    if (!form.name.trim()) return 'Hospital name is required.';
    if (!form.location.trim()) return 'Location is required.';
    if (!form.province) return 'Please select a province.';
    if (!form.email.trim()) return 'Email is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', {
        hospitalId: form.hospitalId.trim(),
        name: form.name.trim(),
        location: form.location.trim(),
        province: form.province,
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center p-4">
        <div className="bg-white border border-emerald-200 rounded-xl p-10 shadow-sm text-center max-w-md w-full">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Facility Registered!</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-1">
            <span className="font-semibold text-slate-700">{form.name}</span> has been successfully registered in the MSD network.
          </p>
          <p className="text-xs text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans text-slate-900 bg-white">
      {/* Left Side Branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#0d3c4b] relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px,transparent 1px)', backgroundSize: '24px 24px' }}></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <Plus className="w-7 h-7 text-[#0d3c4b]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight tracking-tight">MedBridge LK</h1>
              <p className="text-xs text-blue-200 font-semibold tracking-widest uppercase bg-white/10 inline-block px-2 py-0.5 rounded mt-1">MSD-PORTAL</p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold leading-tight mb-4">Register Your Facility</h2>
          <p className="text-base text-blue-100/80 leading-relaxed font-medium mb-10">
            Join the National Medical Supplies Division network to enable real-time inventory coordination and emergency pharmaceutical transfers across Sri Lanka.
          </p>

          <div className="space-y-5">
            {[
              { icon: <Building2 className="w-5 h-5 text-emerald-400" />, title: 'Facility Onboarding', desc: 'Connects your hospital to the national supply mesh' },
              { icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />, title: 'MoH Certified Gateway', desc: 'All registrations are verified by the Ministry of Health' },
              { icon: <MapPin className="w-5 h-5 text-emerald-400" />, title: 'Province-Aware Matching', desc: 'Automated shortage matching within your cluster first' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5">{item.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-blue-200/70 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-xs font-semibold text-blue-200/60 uppercase tracking-wider">
          <p>Government of Sri Lanka (GoSL) • MoH MSD v3.4.1</p>
        </div>
      </div>

      {/* Right Side Form */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center items-center p-6 sm:p-10 relative overflow-y-auto">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0d3c4b] rounded flex items-center justify-center"><Plus className="w-5 h-5 text-white" /></div>
          <h1 className="text-lg font-bold text-[#0d3c4b]">MedBridge LK</h1>
        </div>

        <div className="w-full max-w-lg pt-12 lg:pt-0">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Facility Registration</h2>
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Register your hospital to join the MSD inter-facility supply coordination network.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Section: Facility Info */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Facility Information</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">Hospital / Facility Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Building2 className="h-4 w-4 text-slate-400" /></div>
                    <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Jaffna General Hospital"
                      className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-all shadow-sm text-sm" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">MSD Hospital ID <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Hash className="h-4 w-4 text-slate-400" /></div>
                    <input type="text" value={form.hospitalId} onChange={set('hospitalId')} placeholder="e.g. JGH-NP-01"
                      className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-all shadow-sm text-sm" required />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Unique identifier assigned by the National Medical Supplies Division.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-1.5">Location / City <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><MapPin className="h-4 w-4 text-slate-400" /></div>
                      <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Jaffna"
                        className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-all shadow-sm text-sm" required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-1.5">Province <span className="text-red-500">*</span></label>
                    <select value={form.province} onChange={set('province')}
                      className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-all shadow-sm text-sm bg-white appearance-none" required>
                      <option value="">Select province...</option>
                      {SRI_LANKA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Administrator Account</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">Institutional Email <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-slate-400" /></div>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="pharmacist@jgh.health.gov.lk"
                      className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-all shadow-sm text-sm" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-1.5">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-slate-400" /></div>
                      <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min. 6 characters"
                        className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-all shadow-sm text-sm" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-1.5">Confirm Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-slate-400" /></div>
                      <input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password"
                        className={`block w-full pl-10 pr-4 py-2.5 border rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] focus:border-transparent transition-all shadow-sm text-sm ${
                          form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-400 bg-red-50' : 'border-slate-300'
                        }`} required />
                    </div>
                    {form.confirmPassword && form.password !== form.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1 font-medium">Passwords do not match</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Authorization checkbox */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[#0d3c4b] cursor-pointer flex-shrink-0" />
                <p className="text-xs text-slate-700 leading-relaxed">
                  I confirm that this registration is authorized by the Chief Medical Officer of the above facility and that all information provided is accurate. False registration is subject to Ministry of Health audit under MSD Circular 2023/11.
                </p>
              </label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#0d3c4b] hover:bg-[#092a35] disabled:opacity-70 disabled:cursor-not-allowed text-white py-3.5 rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Registering Facility...</> : <>Register Facility <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#0d3c4b] transition-colors">
              <ChevronLeft className="w-4 h-4" /> Already registered? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
