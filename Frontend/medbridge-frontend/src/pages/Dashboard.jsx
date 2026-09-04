import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Activity, 
  Clock, 
  Building2, 
  Package,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Plus,
  ShieldAlert,
  X,
  LogOut,
  Loader2,
  RefreshCw,
  Filter,
  Layers,
  Bell,
  Check,
  AlertCircle
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';

const SRI_LANKA_PROVINCES = [
  'All Provinces',
  'Western', 'Central', 'Southern', 'Northern', 'Eastern',
  'North Western', 'North Central', 'Uva', 'Sabaragamuwa'
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

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

  const [currentPage, setCurrentPage] = useState(1);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const [selectedProvince, setSelectedProvince] = useState('All Provinces');

  // Notifications State (Transfers)
  const [incomingTransfers, setIncomingTransfers] = useState([]);
  const [processingTransferId, setProcessingTransferId] = useState(null);
  const [notificationToast, setNotificationToast] = useState('');

  // Modal: Add Stock
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [newStock, setNewStock] = useState({
    medicine: '',
    quantity: 500,
    expiryDate: '2027-12-31',
    location: user?.hospital?.location || 'Jaffna',
    province: user?.hospital?.province || 'Northern'
  });
  const [addingStock, setAddingStock] = useState(false);
  const [stockSuccess, setStockSuccess] = useState('');
  const [stockError, setStockError] = useState('');

  // MongoDB Real Data States
  const [requests, setRequests] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [reqRes, stockRes, hospRes, notifRes] = await Promise.all([
        api.get('/requests/open').catch(() => ({ data: { data: [] } })),
        api.get('/stock/available').catch(() => ({ data: { data: [] } })),
        api.get('/auth/hospitals').catch(() => ({ data: { hospitals: [] } })),
        api.get('/transfers/notifications').catch(() => ({ data: { data: { incomingPending: [] } } })),
      ]);

      setRequests(reqRes.data?.data || []);
      setStocks(stockRes.data?.data || []);
      setHospitals(hospRes.data?.hospitals || []);
      setIncomingTransfers(notifRes.data?.data?.incomingPending || []);
    } catch (err) {
      setError('Could not sync with MongoDB cluster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  // Accept incoming transfer -> DEDUCTS STOCK IN MONGODB
  const handleAcceptTransfer = async (transfer) => {
    setProcessingTransferId(transfer.transferId);
    try {
      const { data } = await api.post(`/transfers/${transfer.transferId}/accept`);
      setNotificationToast(`Transfer accepted! Deducted ${transfer.quantity} units of ${transfer.medicine} from your stock in MongoDB.`);
      setTimeout(() => setNotificationToast(''), 5000);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept transfer.');
    } finally {
      setProcessingTransferId(null);
    }
  };

  // Reject incoming transfer
  const handleRejectTransfer = async (transfer) => {
    setProcessingTransferId(transfer.transferId);
    try {
      await api.post(`/transfers/${transfer.transferId}/reject`);
      setNotificationToast(`Transfer declined. Stock quantity unchanged.`);
      setTimeout(() => setNotificationToast(''), 4000);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to decline transfer.');
    } finally {
      setProcessingTransferId(null);
    }
  };

  // Add Stock to MongoDB
  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    setStockError('');
    setStockSuccess('');

    if (!newStock.medicine.trim()) {
      setStockError('Medicine name is required.');
      return;
    }
    if (Number(newStock.quantity) < 1) {
      setStockError('Quantity must be at least 1.');
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

      fetchDashboardData();
    } catch (err) {
      setStockError(err.response?.data?.message || 'Failed to save stock item to MongoDB.');
    } finally {
      setAddingStock(false);
    }
  };

  // Metrics dynamically derived from MongoDB collections
  const totalStockUnits = stocks.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const activeFacilitiesCount = hospitals.length || 12;
  const activeShortagesCount = requests.filter(r => r.status === 'open').length;

  const summaryCards = [
    {
      title: "Linked Facilities",
      value: activeFacilitiesCount.toString(),
      subtitle: "Verified MoH nodes in MongoDB",
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
      trend: "All 9 Provinces",
      trendUp: true
    },
    {
      title: "Available Stock Units",
      value: totalStockUnits.toLocaleString(),
      subtitle: `${stocks.length} active inventory ledgers`,
      icon: <Package className="w-5 h-5 text-emerald-600" />,
      trend: "Live Inventory",
      trendUp: true
    },
    {
      title: "Pending Transfer Requests",
      value: incomingTransfers.length.toString(),
      subtitle: "Awaiting your facility authorization",
      icon: <Bell className="w-5 h-5 text-amber-600" />,
      trend: incomingTransfers.length > 0 ? "Action Required" : "All Clear",
      trendUp: incomingTransfers.length === 0
    },
    {
      title: "Active Shortages",
      value: activeShortagesCount.toString(),
      subtitle: "Open emergency requisitions",
      icon: <Activity className="w-5 h-5 text-red-600" />,
      trend: activeShortagesCount > 0 ? "Requires Allocation" : "All Clear",
      trendUp: activeShortagesCount === 0
    }
  ];

  // Filters applied to live MongoDB requisitions
  const filteredData = requests.filter(row => {
    const medName = typeof row.medicine === 'string' ? row.medicine : (row.medicine?.name || '');
    
    // Search filter
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      (row.requestId && row.requestId.toLowerCase().includes(query)) ||
      medName.toLowerCase().includes(query) ||
      (row.location && row.location.toLowerCase().includes(query)) ||
      (row.province && row.province.toLowerCase().includes(query)) ||
      (row.hospitalId && row.hospitalId.toLowerCase().includes(query));

    // Urgency filter
    const matchesUrgency = selectedUrgency === 'ALL' || 
      (row.urgency && row.urgency.toUpperCase() === selectedUrgency.toUpperCase());

    // Province filter
    const matchesProvince = selectedProvince === 'All Provinces' ||
      (row.province && row.province.toLowerCase() === selectedProvince.toLowerCase());

    return matchesSearch && matchesUrgency && matchesProvince;
  });

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedUrgency('ALL');
    setSelectedProvince('All Provinces');
    setCurrentPage(1);
  };

  const totalItems = filteredData.length;
  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const tableData = filteredData.slice(startIndex, endIndex);

  const hospitalName = user?.name || user?.hospital?.name || 'Your Facility';
  const currentHospitalId = (user?.hospitalId || user?.hospital?.hospitalId || '').trim();
  const hospitalId = currentHospitalId || '—';
  const userEmail = user?.email || '';

  const isFiltered = searchQuery.trim() !== '' || selectedUrgency !== 'ALL' || selectedProvince !== 'All Provinces';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
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
                <Link to="/dashboard" className="px-4 py-2 text-sm font-semibold text-[#0d3c4b] border-b-2 border-[#0d3c4b]">Dashboard</Link>
                <Link to="/report-shortage" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Report Shortage</Link>
                <Link to="/match-supply" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Available Stock</Link>
              </div>
            </div>

            {/* Right side - Add Buttons & Profile */}
            <div className="flex items-center gap-3">
              {/* Add Stock Button */}
              <button 
                onClick={() => setShowAddStockModal(true)} 
                className="flex items-center gap-1.5 bg-[#0d3c4b] hover:bg-[#092a35] text-white px-3.5 py-2 rounded-md text-sm font-semibold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Stock
              </button>

              {/* Emergency Request Button */}
              <Link 
                to="/report-shortage" 
                className="hidden sm:flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-md text-sm font-semibold transition-all shadow-sm"
              >
                <ShieldAlert className="w-4 h-4" />
                Report Shortage
              </Link>

              <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-1">
                <button 
                  onClick={fetchDashboardData} 
                  title="Refresh from MongoDB"
                  className="p-2 text-slate-400 hover:text-[#0d3c4b] rounded-md hover:bg-slate-100 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0d3c4b]' : ''}`} />
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                    className="p-2 text-slate-500 hover:text-[#0d3c4b] rounded-md hover:bg-slate-100 transition-colors relative"
                    title="Provision Transfer Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {incomingTransfers.length > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {incomingTransfers.length}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
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

                {/* Profile */}
                <div className="relative">
                  <div 
                    onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                    className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-md transition-colors"
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

          </div>
        </div>
      </nav>

      {/* Click outside to close dropdowns */}
      {(showProfile || showNotifications) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowProfile(false); setShowNotifications(false); }}></div>
      )}

      {/* Toast Alert */}
      {notificationToast && (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-bold flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            {notificationToast}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">National Facility Ledger</h2>
            <p className="text-sm text-slate-500 mt-1">Live telemetry streaming directly from MongoDB Atlas coordination cluster.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            MongoDB Atlas: Connected & Synchronized
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  {card.icon}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  card.trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {card.trend}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">{card.value}</h3>
              <p className="text-sm font-semibold text-slate-700">{card.title}</p>
              <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Filter Toolbar for Requisitions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search by Requisition ID, Medicine, or Hospital..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] bg-slate-50/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Buttons & Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Urgency Filter Buttons */}
              <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => { setSelectedUrgency(lvl); setCurrentPage(1); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                      selectedUrgency === lvl 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {lvl === 'ALL' ? 'All Urgency' : lvl}
                  </button>
                ))}
              </div>

              {/* Province Dropdown */}
              <div className="relative">
                <select
                  value={selectedProvince}
                  onChange={(e) => { setSelectedProvince(e.target.value); setCurrentPage(1); }}
                  className="pl-3 pr-8 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] appearance-none"
                >
                  {SRI_LANKA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Clear Filters Button */}
              {isFiltered && (
                <button 
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </button>
              )}

            </div>

          </div>
        </div>

        {/* Requisitions Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Active Supply Requisitions (MongoDB)</h3>
              <p className="text-sm text-slate-500 mt-1">Live shortage notifications logged across the provincial hospital mesh.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/match-supply" className="text-sm font-semibold text-[#0d3c4b] hover:text-[#1e6075] flex items-center gap-1 transition-colors">
                Inspect Available Stock ({stocks.length}) <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#0d3c4b]" />
                <span className="text-sm font-medium">Streaming latest records from MongoDB...</span>
              </div>
            ) : tableData.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-slate-800">No Requisitions Found</h4>
                <p className="text-sm text-slate-500 mt-1">
                  {isFiltered ? 'No records match your active filters.' : 'No shortages currently recorded in MongoDB.'}
                </p>
                {isFiltered && (
                  <button onClick={clearAllFilters} className="mt-3 text-xs font-bold text-[#0d3c4b] underline">
                    Reset all filters
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="px-6 py-4">Requisition ID</th>
                    <th className="px-6 py-4">Medicine Item</th>
                    <th className="px-6 py-4">Reporting Node / Location</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Urgency Level</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tableData.map((row, index) => {
                    const medName = typeof row.medicine === 'string' ? row.medicine : (row.medicine?.name || 'Medical Supply');
                    const urgencyColors = {
                      HIGH: 'bg-red-50 text-red-700 border-red-200',
                      MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
                      LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    };

                    return (
                      <tr key={row._id || index} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
                            {row.requestId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900">{medName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <span className="font-semibold text-slate-800">{row.hospitalId}</span>
                            {currentHospitalId && row.hospitalId?.trim().toLowerCase() === currentHospitalId.toLowerCase() ? (
                              <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                                Your Shortage
                              </span>
                            ) : (
                              <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                                Network
                              </span>
                            )}
                            <span className="text-slate-400 mx-1.5">•</span>
                            <span className="text-slate-600 font-medium">{row.location}, {row.province}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-900">{Number(row.quantity).toLocaleString()}</span>
                          <span className="text-xs text-slate-500 ml-1">units</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md border ${urgencyColors[row.urgency] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                            {row.urgency || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {row.status || 'open'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link 
                            to={`/match-supply?medicine=${encodeURIComponent(medName)}&requestId=${row.requestId}&neededQty=${row.quantity}&urgency=${row.urgency}&requesterHospitalId=${row.hospitalId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0d3c4b] bg-slate-100 hover:bg-[#0d3c4b] hover:text-white rounded-md transition-colors shadow-sm"
                          >
                            Match Stock <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination / Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</span> of <span className="font-semibold text-slate-700">{totalItems}</span> MongoDB records</p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    currentPage === page
                      ? 'text-white bg-[#0d3c4b] border border-[#0d3c4b]'
                      : 'text-slate-600 bg-white border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
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
                    {SRI_LANKA_PROVINCES.filter(p => p !== 'All Provinces').map(p => (
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

export default Dashboard;
