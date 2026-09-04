import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

const Analysis = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Assuming a token is in localStorage, though simplified here
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/v1/requests/open', { headers });
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setRequests(data.data || []);
    } catch (err) {
      console.error(err);
      setError('Could not load requests for analysis. Ensure you are logged in.');
    }
  };

  const runAnalysis = async (request) => {
    setSelectedRequest(request);
    setLoading(true);
    setRecommendations(null);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/v1/recommendations/requests/${request._id || request.requestId}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
      setError('AI Analysis failed or no recommendations available.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20">
            <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#0d3c4b] leading-tight tracking-tight">AI Analysis</h1>
              <p className="text-[11px] text-slate-500 font-semibold tracking-widest uppercase">Smart Supply Matching</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        {/* Left Column: Requests List */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-8rem)]">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" /> Open Requests
          </h2>
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md mb-4">{error}</div>}
          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {requests.length === 0 && !error ? (
              <p className="text-sm text-slate-500 text-center mt-10">No open requests available.</p>
            ) : (
              requests.map(req => (
                <div 
                  key={req._id}
                  onClick={() => runAnalysis(req)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedRequest?._id === req._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-900">{req.medicine}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${req.urgency === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {req.urgency}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">Qty: {req.quantity}</p>
                  <p className="text-xs text-slate-400 truncate">{req.location} • {req.province}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Analysis Results */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[calc(100vh-8rem)] overflow-y-auto">
          {!selectedRequest ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Sparkles className="w-12 h-12 mb-4 opacity-50" />
              <p>Select a request from the list to view AI matching insights.</p>
            </div>
          ) : loading ? (
            <div className="h-full flex flex-col items-center justify-center text-blue-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p>Running AI analysis...</p>
            </div>
          ) : recommendations ? (
            <div>
              <div className="mb-6 pb-6 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <Sparkles className="w-6 h-6 text-indigo-600" /> Match Analysis for {selectedRequest.medicine}
                </h2>
                <p className="text-slate-600">
                  Target Quantity: <span className="font-semibold text-slate-900">{selectedRequest.quantity}</span> • 
                  Requested by: <span className="font-semibold text-slate-900">{selectedRequest.location}</span>
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium">
                  {recommendations.totalCandidates} potential stock items evaluated
                </div>
              </div>

              {recommendations.recommendations?.length === 0 ? (
                <div className="p-6 bg-slate-50 text-slate-500 rounded-lg text-center flex flex-col items-center">
                  <AlertTriangle className="w-8 h-8 mb-2 text-slate-400" />
                  <p>No matching stock found for this request.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-slate-800 mb-4">Top Recommendations</h3>
                  {recommendations.recommendations?.map((rec, idx) => (
                    <div key={idx} className="p-5 border border-slate-200 rounded-lg flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 font-bold text-slate-700">
                            #{idx + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">{rec.hospitalId?.hospitalName || rec.hospitalId || 'Unknown Hospital'}</h4>
                            <p className="text-xs text-slate-500">Available Qty: <span className="font-semibold text-slate-700">{rec.availableQty || rec.quantity}</span></p>
                          </div>
                        </div>
                        <ul className="mt-4 space-y-1">
                          {rec.reasons?.map((reason, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="sm:w-32 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-3xl font-black text-indigo-600">{rec.matchScore}%</div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mt-1">Match Score</div>
                        {rec.canFulfil && (
                          <div className="mt-3 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">Full Match</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-red-500">
              Analysis failed to load.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analysis;

