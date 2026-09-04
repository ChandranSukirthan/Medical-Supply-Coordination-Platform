import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  Activity, 
  Clock, 
  Building2, 
  Package,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Truck,
  Plus,
  User,
  ShieldAlert,
  X,
  LogOut,
  Settings
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    { id: 1, title: "Transfer REQ-9042 dispatched", desc: "Atropine shipment en route to Jaffna TH", time: "12 min ago", unread: true },
    { id: 2, title: "Critical shortage alert", desc: "Surgical Gloves stock below threshold at Jaffna GH", time: "45 min ago", unread: true },
    { id: 3, title: "Transfer REQ-9043 delivered", desc: "Enoxaparin received at Badulla PGH", time: "2 hours ago", unread: false },
    { id: 4, title: "New facility linked", desc: "Base Hospital Trincomalee joined the network", time: "5 hours ago", unread: false },
  ];

  const summaryCards = [
    {
      title: "Active Facilities",
      value: "48",
      subtitle: "Linked across Sri Lanka",
      icon: <Building2 className="w-5 h-5 text-blue-600" />,
      trend: "+2 this month",
      trendUp: true
    },
    {
      title: "Units Reallocated",
      value: "14,280+",
      subtitle: "Vital units safely transferred",
      icon: <Package className="w-5 h-5 text-emerald-600" />,
      trend: "+1,200 this week",
      trendUp: true
    },
    {
      title: "Average Dispatch Time",
      value: "4.2 hrs",
      subtitle: "Down from 36h historical lag",
      icon: <Clock className="w-5 h-5 text-purple-600" />,
      trend: "-12% vs last month",
      trendUp: true
    },
    {
      title: "Active Shortages",
      value: "12",
      subtitle: "Critical depletion < 24h",
      icon: <Activity className="w-5 h-5 text-red-600" />,
      trend: "Requires immediate action",
      trendUp: false
    }
  ];

  const allTableData = [
    {
      id: "REQ-9042",
      item: "Atropine Sulfate Injection 0.6mg/mL",
      origin: "National Hospital Colombo",
      destination: "Jaffna Teaching Hospital",
      quantity: "450 ampoules",
      status: "In Transit",
      eta: "1h 40m",
      statusColor: "bg-amber-100 text-amber-800 border-amber-200"
    },
    {
      id: "REQ-9043",
      item: "Enoxaparin Sodium 40mg",
      origin: "Kandy TH",
      destination: "Badulla PGH",
      quantity: "800 vials",
      status: "Delivered",
      eta: "-",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
    },
    {
      id: "REQ-9044",
      item: "Sevoflurane Inhalation 250ml",
      origin: "Karapitiya TH",
      destination: "Ratnapura PGH",
      quantity: "50 btls",
      status: "In Transit",
      eta: "2h 15m",
      statusColor: "bg-amber-100 text-amber-800 border-amber-200"
    },
    {
      id: "REQ-9045",
      item: "Surgical Gloves (Latex Size 7.5)",
      origin: "Colombo National Hospital",
      destination: "Jaffna General Hospital",
      quantity: "500 units",
      status: "Pending Dispatch",
      eta: "Est. 8h",
      statusColor: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
      id: "REQ-9046",
      item: "Anti-Rabies Vaccine (Purified)",
      origin: "Teaching Hospital Peradeniya",
      destination: "Base Hospital Vavuniya",
      quantity: "120 vials",
      status: "Delivered",
      eta: "-",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
    },
    // Page 2 data
    {
      id: "REQ-9047",
      item: "Paracetamol Tablets 500mg",
      origin: "Colombo National Hospital",
      destination: "Batticaloa TH",
      quantity: "2,000 tabs",
      status: "Delivered",
      eta: "-",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
    },
    {
      id: "REQ-9048",
      item: "Insulin Injection (Actrapid) 100IU/mL",
      origin: "Kandy TH",
      destination: "Polonnaruwa GH",
      quantity: "300 vials",
      status: "In Transit",
      eta: "3h 20m",
      statusColor: "bg-amber-100 text-amber-800 border-amber-200"
    },
    {
      id: "REQ-9049",
      item: "Amoxicillin Capsules 250mg",
      origin: "Karapitiya TH",
      destination: "Matara GH",
      quantity: "1,500 caps",
      status: "Pending Dispatch",
      eta: "Est. 4h",
      statusColor: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
      id: "REQ-9050",
      item: "Normal Saline IV 500ml",
      origin: "Teaching Hospital Peradeniya",
      destination: "Nuwara Eliya DH",
      quantity: "200 bags",
      status: "In Transit",
      eta: "1h 10m",
      statusColor: "bg-amber-100 text-amber-800 border-amber-200"
    },
    {
      id: "REQ-9051",
      item: "Diazepam Injection 5mg/mL",
      origin: "National Hospital Colombo",
      destination: "Anuradhapura TH",
      quantity: "150 ampoules",
      status: "Delivered",
      eta: "-",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
    },
    // Page 3 data
    {
      id: "REQ-9052",
      item: "Metformin Tablets 500mg",
      origin: "Colombo National Hospital",
      destination: "Kurunegala TH",
      quantity: "3,000 tabs",
      status: "Pending Dispatch",
      eta: "Est. 6h",
      statusColor: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
      id: "REQ-9053",
      item: "Ceftriaxone Injection 1g",
      origin: "Kandy TH",
      destination: "Trincomalee GH",
      quantity: "400 vials",
      status: "In Transit",
      eta: "4h 50m",
      statusColor: "bg-amber-100 text-amber-800 border-amber-200"
    },
    {
      id: "REQ-9054",
      item: "Omeprazole Capsules 20mg",
      origin: "Karapitiya TH",
      destination: "Hambantota GH",
      quantity: "1,000 caps",
      status: "Delivered",
      eta: "-",
      statusColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
    },
    {
      id: "REQ-9055",
      item: "Adrenaline Injection 1mg/mL",
      origin: "National Hospital Colombo",
      destination: "Jaffna Teaching Hospital",
      quantity: "250 ampoules",
      status: "In Transit",
      eta: "5h 30m",
      statusColor: "bg-amber-100 text-amber-800 border-amber-200"
    },
  ];

  const filteredData = allTableData.filter(row => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      row.id.toLowerCase().includes(query) ||
      row.item.toLowerCase().includes(query) ||
      row.origin.toLowerCase().includes(query) ||
      row.destination.toLowerCase().includes(query) ||
      row.status.toLowerCase().includes(query) ||
      row.quantity.toLowerCase().includes(query)
    );
  });

  const totalItems = filteredData.length;
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const tableData = filteredData.slice(startIndex, endIndex);

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
                <Link to="/match-supply" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Transfers</Link>
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
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0d3c4b] focus:border-[#0d3c4b] sm:text-sm transition-colors" 
                  placeholder="Search item, SKU or facility..." 
                />
              </div>

              <Link to="/report-shortage" className="hidden sm:flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                <ShieldAlert className="w-4 h-4" />
                + Emergency Request
              </Link>

              <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
                {/* Notifications Bell */}
                <div className="relative">
                  <button 
                    onClick={() => { setShowNotifications(!showNotifications); setShowHelp(false); }}
                    className="text-slate-400 hover:text-slate-600 relative"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                        <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.map((n) => (
                          <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${n.unread ? 'bg-blue-50/30' : ''}`}>
                            <div className="flex items-start gap-2">
                              {n.unread && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>}
                              <div className={!n.unread ? 'ml-4' : ''}>
                                <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">{n.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                        <button className="text-xs font-semibold text-[#0d3c4b] hover:text-[#1e6075] w-full text-center">
                          View All Notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Help Button */}
                <div className="relative">
                  <button 
                    onClick={() => { setShowHelp(!showHelp); setShowNotifications(false); }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>

                  {/* Help Dropdown */}
                  {showHelp && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h4 className="text-sm font-bold text-slate-900">Help & Support</h4>
                        <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                          <HelpCircle className="w-4 h-4 text-[#0d3c4b] mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">User Guide</p>
                            <p className="text-xs text-slate-500">Learn how to use MedBridge LK</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                          <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Emergency Hotline</p>
                            <p className="text-xs text-slate-500">Call 1990 Ext 4 for critical needs</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                          <Building2 className="w-4 h-4 text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">MSD Contact</p>
                            <p className="text-xs text-slate-500">National Medical Supplies Division</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-center">
                        <p className="text-[10px] text-slate-400 font-medium">MedBridge LK v3.4.1 • MoH Sri Lanka</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Profile */}
                <div className="relative">
                  <div 
                    onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowHelp(false); }}
                    className="flex items-center gap-3 ml-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-md transition-colors"
                  >
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-semibold text-slate-900">Jaffna General Hospital</p>
                      <p className="text-xs text-slate-500">Northern Province • Chief Pharmacist</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                  </div>

                  {/* Profile Dropdown */}
                  {showProfile && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
                      <div className="px-4 py-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#0d3c4b] flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Dr. K. Thirunavukarasu</p>
                            <p className="text-xs text-slate-500 font-medium">Chief Pharmacist</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">SLMC Reg: PH-2019-4821</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <div className="px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Jaffna General Hospital</p>
                            <p className="text-xs text-slate-500">Northern Province • Facility ID: JGH-NP-01</p>
                          </div>
                        </div>
                        <div className="px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3">
                          <Settings className="w-4 h-4 text-slate-400" />
                          <p className="text-sm font-medium text-slate-700">Account Settings</p>
                        </div>
                      </div>
                      <div className="p-2 border-t border-slate-100">
                        <button 
                          onClick={() => navigate('/')}
                          className="w-full px-3 py-2 rounded-lg hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-3 text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          <p className="text-sm font-semibold">Sign Out</p>
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
      {(showNotifications || showHelp || showProfile) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotifications(false); setShowHelp(false); setShowProfile(false); }}></div>
      )}

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Facility Dashboard</h2>
            <p className="text-sm text-slate-500 mt-1">Real-time overview of network stock and active transfers.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Network: Fully Operational
          </div>
        </div>

        {/* Grid of Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  {card.icon}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  card.trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
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

        {/* Data Table / List at the bottom */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Active Provincial Mesh Monitors</h3>
              <p className="text-sm text-slate-500 mt-1">Live telemetry of inter-hospital dispatch network.</p>
            </div>
            <Link to="/match-supply" className="text-sm font-semibold text-[#0d3c4b] hover:text-[#1e6075] flex items-center gap-1 transition-colors">
              View Complete Ledger <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="px-6 py-4">Requisition ID</th>
                  <th className="px-6 py-4">Item Catalog</th>
                  <th className="px-6 py-4">Route (Origin → Destination)</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableData.map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-medium text-slate-600">{row.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{row.item}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-600 font-medium truncate max-w-[120px]" title={row.origin}>{row.origin}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-900 font-medium truncate max-w-[120px]" title={row.destination}>{row.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-700">{row.quantity}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${row.statusColor}`}>
                        {row.status === 'In Transit' && <Truck className="w-3 h-3" />}
                        {row.status === 'Delivered' && <CheckCircle2 className="w-3 h-3" />}
                        {row.status === 'Pending Dispatch' && <Clock className="w-3 h-3" />}
                        {row.status}
                        {row.eta !== '-' && <span className="ml-1 opacity-75 font-medium">(ETA: {row.eta})</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-[#0d3c4b] hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination / Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <p className="text-sm text-slate-500">Showing <span className="font-semibold text-slate-700">{startIndex + 1} - {endIndex}</span> of <span className="font-semibold text-slate-700">{totalItems}</span> active monitors</p>
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
                      ? 'text-white bg-[#0d3c4b] border border-[#0d3c4b] hover:bg-[#092a35]'
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
    </div>
  );
};

export default Dashboard;
