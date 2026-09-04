import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronDown,
  Plus,
  ShieldAlert,
  Package,
  MapPin,
  Truck,
  X,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2,
  RefreshCw,
  AlertCircle,
  Bell,
  Check,
  Send,
  Building2,
  User,
  LogOut
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';

const SRI_LANKA_PROVINCES = [
  'All Island (9 Provinces)',
  'Western', 'Central', 'Southern', 'Northern', 'Eastern',
  'North Western', 'North Central', 'Uva', 'Sabaragamuwa'
];

const CATEGORIES = [
  { id: 'ALL', label: 'All Items' },
  { id: 'SURGICAL', label: 'Surgical & PPE', keywords: ['glove', 'mask', 'gauze', 'sterile'] },
  { id: 'INJECTIONS', label: 'Injections & IV', keywords: ['injection', 'iv', 'ampoule', 'vial', 'atropine', 'adrenaline', 'insulin', 'saline'] },
  { id: 'ANTIBIOTICS', label: 'Antibiotics & Meds', keywords: ['paracetamol', 'amoxicillin', 'metformin', 'ceftriaxone', 'omeprazole', 'tablet', 'capsule'] },
  { id: 'CRITICAL', label: 'High Stock (>= 500 units)', minQty: 500 },
];

const MatchSupply = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login, logout } = useAuth();

  // URL Context Parameters from Dashboard "Match Stock"
  const medicineParam = searchParams.get('medicine') || '';
  const requestIdParam = searchParams.get('requestId') || '';
  const neededQtyParam = searchParams.get('neededQty') || '';
  const urgencyParam = searchParams.get('urgency') || '';

  const [stocks, setStocks] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Profile & Facility Switcher
  const [showProfile, setShowProfile] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState(medicineParam);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedProvince, setSelectedProvince] = useState('All Island (9 Provinces)');
  const [minQty, setMinQty] = useState(0);
  const [sortBy, setSortBy] = useState('HIGHEST_QTY');

  // Notifications State (Transfers)
  const [showNotifications, setShowNotifications] = useState(false);
  const [incomingTransfers, setIncomingTransfers] = useState([]);
  const [processingTransferId, setProcessingTransferId] = useState(null);

  // Modal: Add Stock
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [newStock, setNewStock] = useState({
    medicine: '',
    quantity: 500,
    expiryDate: '2027-12-31',
    location: user?.hospital?.location || user?.location || 'Jaffna',
    province: user?.hospital?.province || user?.province || 'Northern'
  });
  const [addingStock, setAddingStock] = useState(false);
  const [stockSuccess, setStockSuccess] = useState('');
  const [stockError, setStockError] = useState('');

  // Transfer Action State
  const [requestingStockId, setRequestingStockId] = useState(null);
  const [transferQuantities, setTransferQuantities] = useState({});
  const [sentRequests, setSentRequests] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [actionError, setActionError] = useState('');

  // When medicineParam changes, update searchTerm
  useEffect(() => {
    if (medicineParam) {
      setSearchTerm(medicineParam);
    }
  }, [medicineParam]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      setError('');
      const [stockRes, notifRes, hospRes] = await Promise.all([
        api.get('/stock/available').catch(() => ({ data: { data: [] } })),
        api.get('/transfers/notifications').catch(() => ({ data: { data: { incomingPending: [] } } })),
        api.get('/auth/hospitals').catch(() => ({ data: { hospitals: [] } })),
      ]);

      setStocks(stockRes.data?.data || []);
      setIncomingTransfers(notifRes.data?.data?.incomingPending || []);
      setHospitals(hospRes.data?.hospitals || []);
    } catch (err) {
      setError('Could not load inventory ledgers from MongoDB cluster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const getHospitalName = (hospId) => {
    if (!hospId) return 'Unknown Facility';
    const found = hospitals.find(h => h.hospitalId?.toLowerCase() === hospId.toLowerCase());
    return found ? found.name : hospId;
  };

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

  // Accept incoming transfer -> DEDUCTS STOCK IN MONGODB
  const handleAcceptTransfer = async (transfer) => {
    setProcessingTransferId(transfer.transferId);
    try {
      const { data } = await api.post(`/transfers/${transfer.transferId}/accept`);
      setSuccessMessage(`Transfer accepted! Deducted ${transfer.quantity} units of ${transfer.medicine} from your stock in MongoDB.`);
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchStock();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept transfer.');
    } finally {
      setProcessingTransferId(null);
    }
  };

  // Decline incoming transfer
  const handleRejectTransfer = async (transfer) => {
    setProcessingTransferId(transfer.transferId);
    try {
      await api.post(`/transfers/${transfer.transferId}/reject`);
      setSuccessMessage(`Transfer declined. Stock quantity unchanged.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      fetchStock();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to decline transfer.');
    } finally {
      setProcessingTransferId(null);
    }
  };

  // Submit Add Stock
  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    setStockError('');
    setStockSuccess('');

    if (!newStock.medicine.trim()) {
      setStockError('Medicine name is required.');
      return;
    }

    setAddingStock(true);
    try {
      const stockId = `STK-${Date.now().toString().slice(-6)}`;
      await api.post('/stock', {
        stockId,
        medicine: newStock.medicine.trim(),
        quantity: Number(newStock.quantity),
        location: newStock.location || user?.location || 'Jaffna',
        province: newStock.province || user?.province || 'Northern',
        expiryDate: new Date(newStock.expiryDate).toISOString()
      });

      setStockSuccess(`Stock item ${newStock.medicine} added to MongoDB!`);
      setNewStock({
        medicine: '',
        quantity: 500,
        expiryDate: '2027-12-31',
        location: user?.hospital?.location || 'Jaffna',
        province: user?.hospital?.province || 'Northern'
      });
      setTimeout(() => {
        setStockSuccess('');
        setShowAddStockModal(false);
      }, 1500);

      fetchStock();
    } catch (err) {
      setStockError(err.response?.data?.message || 'Failed to save stock item to MongoDB.');
    } finally {
      setAddingStock(false);
    }
  };

  // Submit Request Transfer -> SENDS NOTIFICATION TO SUPPLIER (Stock deducted upon supplier acceptance)
  const handleRequestTransfer = async (item) => {
    setActionError('');
    setSuccessMessage('');

    const defaultQty = neededQtyParam ? Math.min(Number(neededQtyParam), Number(item.quantity)) : Math.min(Number(item.quantity), 100);
    const requestedQty = Number(transferQuantities[item.stockId] ?? defaultQty);

    if (requestedQty <= 0) {
      setActionError('Transfer quantity must be at least 1 unit.');
      return;
    }
    if (requestedQty > Number(item.quantity)) {
      setActionError(`Cannot request ${requestedQty} units. Only ${item.quantity} units available.`);
      return;
    }

    setRequestingStockId(item.stockId);
    try {
      const medName = typeof item.medicine === 'string' ? item.medicine : item.medicine?.name;

      // Send provision request to supplier hospital (Status: pending)
      const { data } = await api.post('/transfers/request', {
        stockId: item.stockId,
        quantity: requestedQty,
        requestId: requestIdParam || '',
        message: `Provision request for ${requestedQty} units of ${medName} to resolve shortage ${requestIdParam || ''}`,
      });

      setSentRequests(prev => ({
        ...prev,
        [item.stockId]: {
          transferId: data.data?.transferId,
          quantity: requestedQty,
          status: 'pending'
        }
      }));

      setSuccessMessage(`Provision request for ${requestedQty} units of ${medName} sent to ${item.hospitalId}! A notification was sent to ${item.hospitalId} to accept and release the stock.`);
      setTimeout(() => setSuccessMessage(''), 7000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to send provision request to supplier.');
      setTimeout(() => setActionError(''), 5000);
    } finally {
      setRequestingStockId(null);
    }
  };

  // Filter Logic
  const filteredStocks = stocks.filter(stock => {
    const medName = (typeof stock.medicine === 'string' ? stock.medicine : (stock.medicine?.name || '')).toLowerCase();
    
    // Search keyword
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || 
      medName.includes(q) ||
      (stock.stockId && stock.stockId.toLowerCase().includes(q)) ||
      (stock.hospitalId && stock.hospitalId.toLowerCase().includes(q)) ||
      (stock.location && stock.location.toLowerCase().includes(q));

    // Category filter
    let matchesCategory = true;
    const cat = CATEGORIES.find(c => c.id === activeCategory);
    if (cat && cat.keywords) {
      matchesCategory = cat.keywords.some(kw => medName.includes(kw));
    } else if (cat && cat.minQty) {
      matchesCategory = (Number(stock.quantity) || 0) >= cat.minQty;
    }

    // Province filter
    const matchesProvince = selectedProvince === 'All Island (9 Provinces)' || 
      (stock.province && stock.province.toLowerCase() === selectedProvince.toLowerCase());

    // Min Quantity filter
    const matchesQty = (Number(stock.quantity) || 0) >= minQty;

    return matchesSearch && matchesCategory && matchesProvince && matchesQty;
  });

  // Sorting
  const sortedStocks = [...filteredStocks].sort((a, b) => {
    if (sortBy === 'HIGHEST_QTY') return Number(b.quantity) - Number(a.quantity);
    if (sortBy === 'LOWEST_QTY') return Number(a.quantity) - Number(b.quantity);
    if (sortBy === 'EARLIEST_EXP') return new Date(a.expiryDate) - new Date(b.expiryDate);
    if (sortBy === 'LATEST_EXP') return new Date(b.expiryDate) - new Date(a.expiryDate);
    return 0;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setActiveCategory('ALL');
    setSelectedProvince('All Island (9 Provinces)');
    setMinQty(0);
    setSortBy('HIGHEST_QTY');
    navigate('/match-supply');
  };

  const isFiltered = searchTerm !== '' || activeCategory !== 'ALL' || selectedProvince !== 'All Island (9 Provinces)' || minQty !== 0;

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
            
            {/* Left side - Logo & Nav */}
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
                <Link to="/report-shortage" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Report Shortage</Link>
                <Link to="/match-supply" className="px-4 py-2 text-sm font-semibold text-[#0d3c4b] border-b-2 border-[#0d3c4b]">Available Stock</Link>
              </div>
            </div>

            {/* Right side - Add Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddStockModal(true)}
                className="flex items-center gap-1.5 bg-[#0d3c4b] hover:bg-[#092a35] text-white px-3.5 py-2 rounded-md text-sm font-semibold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Stock
              </button>

              <Link to="/report-shortage" className="hidden sm:flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-md text-sm font-semibold transition-all shadow-sm">
                <ShieldAlert className="w-4 h-4" />
                Report Shortage
              </Link>

              <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-1">
                <button 
                  onClick={fetchStock} 
                  title="Reload from MongoDB"
                  className="p-2 text-slate-400 hover:text-[#0d3c4b] rounded-md hover:bg-slate-100 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0d3c4b]' : ''}`} />
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-500 hover:text-[#0d3c4b] rounded-md hover:bg-slate-100 transition-colors relative"
                    title="Transfer Authorization Alerts"
                  >
                    <Bell className="w-5 h-5" />
                    {incomingTransfers.length > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {incomingTransfers.length}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Provision Transfer Alerts</h4>
                          <p className="text-[11px] text-slate-500">Incoming requests for your facility stock</p>
                        </div>
                        <span className="text-xs font-bold text-[#0d3c4b] bg-white px-2 py-0.5 rounded border border-slate-200">
                          {incomingTransfers.length} Pending
                        </span>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2">
                        {incomingTransfers.length === 0 ? (
                          <div className="py-8 text-center text-slate-400">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-xs font-medium">No pending provision requests.</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">When other hospitals request transfer from your stock, you will review them here.</p>
                          </div>
                        ) : (
                          incomingTransfers.map((notif) => (
                            <div key={notif.transferId} className="p-3 hover:bg-slate-50 rounded-lg transition-colors">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {notif.transferId}
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                  Pending Authorization
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-900 leading-snug">
                                {notif.requesterHospitalName || notif.requesterHospitalId}
                              </h5>
                              <p className="text-xs text-slate-600 mt-1">
                                Requests <span className="font-bold text-[#0d3c4b]">{notif.quantity} units</span> of <span className="font-semibold">{notif.medicine}</span>
                              </p>
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={() => handleAcceptTransfer(notif)}
                                  disabled={processingTransferId === notif.transferId}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
                                >
                                  {processingTransferId === notif.transferId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  Accept & Deduct Stock
                                </button>
                                <button
                                  onClick={() => handleRejectTransfer(notif)}
                                  disabled={processingTransferId === notif.transferId}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative ml-1">
                  <div 
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
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
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Facility ID: {hospitalId}</p>
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
                          className="w-full px-3 py-2 rounded-lg hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-2.5 text-red-600 text-xs font-semibold"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* Click outside to close notifications or profile */}
      {(showNotifications || showProfile) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotifications(false); setShowProfile(false); }}></div>
      )}

      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 text-sm">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center text-slate-500 font-medium">
            <Link to="/dashboard" className="hover:text-[#0d3c4b] transition-colors">Dashboard</Link>
            <ChevronDown className="w-3.5 h-3.5 mx-2 -rotate-90 text-slate-400" />
            <span className="text-slate-900 font-semibold">Available Stock & Facility Matching</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="uppercase tracking-wider font-bold text-slate-500">Facility Context:</span>
            <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">
              {hospitalName} ({hospitalId})
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Dynamic Context Requisition Match Banner */}
        {medicineParam && (
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-[#0d3c4b]/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 bg-[#0d3c4b] text-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold uppercase bg-[#0d3c4b] text-white px-2.5 py-0.5 rounded">
                    Requisition: {requestIdParam}
                  </span>
                  <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded uppercase">
                    {urgencyParam || 'HIGH'} Urgency Shortage
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Target Match: <span className="text-[#0d3c4b]">{medicineParam}</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  Seeking <span className="font-bold text-slate-800">{neededQtyParam || 100} units</span>. Below are verified hospital stocks matching this medicine item. Click "Request Provision Transfer" to notify the supplier.
                </p>
              </div>
            </div>

            <button 
              onClick={clearAllFilters}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <X className="w-4 h-4" /> View All National Stocks
            </button>
          </div>
        )}

        {/* Toast Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-semibold">{successMessage}</p>
          </div>
        )}
        {actionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-semibold">{actionError}</p>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
          
          {/* Top Row: Search & Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            
            {/* Search Input */}
            <div className="lg:col-span-5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Search Supply Item or SKU
              </label>
              <div className="relative">
                <Package className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. Surgical Gloves, Insulin, Atropine..."
                  className="w-full pl-10 pr-9 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] bg-slate-50/50" 
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Target Province */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Target Province
              </label>
              <div className="relative">
                <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <select 
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] appearance-none bg-white"
                >
                  {SRI_LANKA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Min Buffer */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Min. Quantity
              </label>
              <select 
                value={minQty}
                onChange={(e) => setMinQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] bg-white"
              >
                <option value={0}>All Quantities</option>
                <option value={100}>&gt;= 100 units</option>
                <option value={500}>&gt;= 500 units</option>
                <option value={1000}>&gt;= 1,000 units</option>
              </select>
            </div>

            {/* Match / Search Button */}
            <div className="lg:col-span-2 flex gap-2">
              <button 
                onClick={fetchStock}
                className="w-full py-2 bg-[#0d3c4b] hover:bg-[#092a35] text-white text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <Search className="w-4 h-4" /> Match
              </button>
            </div>

          </div>

          {/* Bottom Row: Category Buttons & Active Filter Tags */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mr-1">Categories:</span>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-full transition-all border ${
                    activeCategory === cat.id
                      ? 'bg-[#0d3c4b] text-white border-[#0d3c4b] shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Clear All Filters */}
            {isFiltered && (
              <button 
                onClick={clearAllFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear All Filters
              </button>
            )}

          </div>

        </div>

        {/* Results Header with Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">Available Hospital Inventories (MongoDB)</h2>
            <span className="bg-[#0d3c4b] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              {sortedStocks.length} Ledgers Found
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline text-sm text-slate-500 font-medium">Real-Time Hospital Telemetry</span>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort:</span>
            <div className="relative w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] appearance-none"
              >
                <option value="HIGHEST_QTY">Highest Quantity (Buffer)</option>
                <option value="LOWEST_QTY">Lowest Quantity</option>
                <option value="EARLIEST_EXP">Earliest Expiry</option>
                <option value="LATEST_EXP">Latest Expiry</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0d3c4b]" />
            <span className="text-base font-semibold">Streaming stock from MongoDB Atlas...</span>
          </div>
        ) : sortedStocks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Stock Matches Found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {medicineParam ? `No donor facilities currently have stock for "${medicineParam}".` : 'Try resetting your filters.'}
            </p>
            {isFiltered && (
              <button 
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-[#0d3c4b] text-white text-xs font-bold rounded-lg"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {sortedStocks.map((stock) => {
              const medName = typeof stock.medicine === 'string' ? stock.medicine : (stock.medicine?.name || 'Medical Supply');
              const expDateStr = stock.expiryDate ? new Date(stock.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Nov 2027';
              
              // Strict ownership check
              const isUserFacility = Boolean(currentHospitalId && stock.hospitalId && stock.hospitalId.trim().toLowerCase() === currentHospitalId.toLowerCase());
              const donorFacilityName = getHospitalName(stock.hospitalId);
              const hasSentRequest = sentRequests[stock.stockId];

              // Default transfer quantity to needed quantity from URL param if present
              const defaultQty = neededQtyParam ? Math.min(Number(neededQtyParam), Number(stock.quantity)) : Math.min(Number(stock.quantity), 100);
              const currentRequestedQty = transferQuantities[stock.stockId] ?? defaultQty;

              return (
                <div key={stock._id || stock.stockId} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden transition-all hover:shadow-md relative">
                  
                  <div className="p-5 flex-grow">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-2">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {stock.stockId}
                          </span>
                          {isUserFacility ? (
                            <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-blue-600" /> Your Facility Inventory
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Donor: {donorFacilityName} ({stock.hospitalId})
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight mt-1">{medName}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{donorFacilityName} • {stock.location}, {stock.province} Province</span>
                        </div>
                      </div>
                      
                      {/* Availability Badge */}
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="flex items-center gap-1.5 border border-emerald-100 bg-emerald-50 px-3 py-1.5 rounded-md text-emerald-700 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="font-bold text-sm">
                            {Number(stock.quantity).toLocaleString()} <span className="font-medium text-xs opacity-80">units</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Details Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-4 text-xs space-y-2">
                      <div className="flex justify-between text-slate-600">
                        <span className="font-medium">Batch Expiry:</span>
                        <span className="font-bold text-slate-800">{expDateStr}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="font-medium">MSD Verification:</span>
                        <span className="font-semibold text-emerald-700">MoH Certified</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="font-medium">Allocation Status:</span>
                        <span className="font-semibold text-slate-800 uppercase tracking-wider text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200">
                          {stock.status || 'available'}
                        </span>
                      </div>
                    </div>

                    {/* Transit Details Box */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-md">
                        <Truck className="w-4 h-4 text-[#0d3c4b]" />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 text-xs">MoH Fleet Transfer Enabled</h5>
                        <p className="text-[11px] text-slate-500">Priority cold-chain corridor available</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="px-5 pb-5 pt-0 mt-auto">
                    {!isUserFacility ? (
                      <>
                        <div className="mb-3 flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Units to Request:</span>
                            <span className="text-[10px] text-slate-500 font-medium">From {donorFacilityName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="number" 
                              min={1}
                              max={Number(stock.quantity)}
                              value={currentRequestedQty}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(Number(stock.quantity), Number(e.target.value) || 1));
                                setTransferQuantities(prev => ({ ...prev, [stock.stockId]: val }));
                              }}
                              className="w-20 px-2 py-1 text-xs font-bold border border-slate-300 rounded bg-white text-center focus:ring-1 focus:ring-[#0d3c4b]"
                            />
                            <span className="text-[10px] text-slate-500 font-medium">units</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleRequestTransfer(stock)}
                          disabled={requestingStockId === stock.stockId || Number(stock.quantity) <= 0 || !!hasSentRequest}
                          className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                            hasSentRequest
                              ? 'bg-amber-500 text-white cursor-default'
                              : Number(stock.quantity) <= 0
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-[#0d3c4b] hover:bg-[#092a35] text-white hover:shadow-md'
                          }`}
                        >
                          {requestingStockId === stock.stockId ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Sending Provision Alert...</>
                          ) : hasSentRequest ? (
                            <><Clock className="w-4 h-4" /> Provision Requested (Pending)</>
                          ) : Number(stock.quantity) <= 0 ? (
                            'Depleted (0 Units)'
                          ) : (
                            <>Request Provision Transfer ({currentRequestedQty} units) <Send className="w-4 h-4" /></>
                          )}
                        </button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
                          <p className="font-bold flex items-center gap-1.5 mb-1 text-blue-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Local Facility Inventory ({stock.quantity} Units)
                          </p>
                          <p className="text-[11px] text-blue-700 leading-relaxed">
                            This stock is already held at your facility ({hospitalName}). Inter-hospital transfer requests are sent to external donor facilities.
                          </p>
                        </div>
                        <button 
                          disabled
                          className="w-full py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          Your Facility Stock (No Transfer Needed)
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Protocol Alert */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex gap-4 mt-4">
          <div className="flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6 text-[#0d3c4b]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">MoH Sri Lanka Logistics Protocol</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              When you click "Request Provision Transfer", a high-priority transfer request is routed to the donor hospital. Stock is safely held and only deducted upon authorization by the donor facility's chief pharmacist.
            </p>
          </div>
        </div>

      </main>

      {/* Modal: Add Stock to MongoDB */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 relative">
            <button 
              onClick={() => setShowAddStockModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Stock to Facility</h3>
                <p className="text-xs text-slate-500">Record new medical inventory directly into MongoDB.</p>
              </div>
            </div>

            {stockSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {stockSuccess}
              </div>
            )}
            {stockError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold flex items-center gap-2">
                <X className="w-4 h-4" /> {stockError}
              </div>
            )}

            <form onSubmit={handleAddStockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Medicine / Supply Name *</label>
                <input 
                  type="text" 
                  value={newStock.medicine}
                  onChange={e => setNewStock({ ...newStock, medicine: e.target.value })}
                  placeholder="e.g. Paracetamol Tablets 500mg"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d3c4b]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity (Units) *</label>
                  <input 
                    type="number" 
                    min={1}
                    value={newStock.quantity}
                    onChange={e => setNewStock({ ...newStock, quantity: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d3c4b]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date *</label>
                  <input 
                    type="date" 
                    value={newStock.expiryDate}
                    onChange={e => setNewStock({ ...newStock, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d3c4b]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location / City</label>
                  <input 
                    type="text" 
                    value={newStock.location}
                    onChange={e => setNewStock({ ...newStock, location: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d3c4b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Province</label>
                  <select
                    value={newStock.province}
                    onChange={e => setNewStock({ ...newStock, province: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] bg-white"
                  >
                    {SRI_LANKA_PROVINCES.filter(p => p !== 'All Island (9 Provinces)').map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingStock}
                  className="flex-1 py-2.5 bg-[#0d3c4b] hover:bg-[#092a35] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                >
                  {addingStock ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MatchSupply;
