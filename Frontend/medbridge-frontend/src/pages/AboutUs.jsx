import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, Users, HeartPulse } from 'lucide-react';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20">
            <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#0d3c4b] leading-tight tracking-tight">MedBridge LK</h1>
              <p className="text-[11px] text-slate-500 font-semibold tracking-widest uppercase">About Us</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
          <p className="text-slate-600 leading-relaxed mb-8 text-lg">
            MedBridge LK is dedicated to optimising medical supply distribution across Sri Lanka.
            By connecting hospitals and leveraging AI-powered insights, we ensure that critical medicines reach
            the facilities that need them most, reducing waste and improving patient care.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="p-6 border border-slate-100 bg-slate-50 rounded-xl text-left">
              <Users className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">For Healthcare Workers</h3>
              <p className="text-sm text-slate-600">Empowering you with real-time visibility into nationwide inventory and smart redistribution recommendations.</p>
            </div>
            <div className="p-6 border border-slate-100 bg-slate-50 rounded-xl text-left">
              <Info className="w-8 h-8 text-teal-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Smart Technology</h3>
              <p className="text-sm text-slate-600">Our platform uses advanced algorithms to prioritize urgency, match quantities, and minimize expiry waste.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutUs;

