import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronDown,
  Plus,
  User,
  ShieldAlert,
  Package,
  MapPin,
  BarChart2,
  Truck,
  X,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  ShieldCheck,
  Snowflake,
  Zap
} from 'lucide-react';

const MatchSupply = () => {
  const facilityMatches = [
    {
      id: "SL-MSD #WP-01",
      name: "Colombo National Hospital",
      badge: { text: "RECOMMENDED MATCH", color: "bg-[#0d3c4b] text-white" },
      available: "1,200",
      surplusStatus: "Surplus buffer +320%",
      statusColor: "text-emerald-600",
      location: "Western Province",
      distance: "395 km from Jaffna",
      itemCode: "SL-MSD-SURG-7501",
      exp: "Nov 2026",
      details: ["Sterile 50 pairs/box", "Batch #SL-2024-91B"],
      transitIcon: <Truck className="w-5 h-5 text-slate-500" />,
      transitTitle: "MOH Dedicated Fleet Ready",
      transitDesc: "Est. Transit: 6h 30m via A9 Corridor",
      buttonText: "Request Transfer (500 units)",
      showDetailsLink: true,
      borderColor: "border-[#0d3c4b]",
      borderThickness: "border-2"
    },
    {
      id: "SL-MSD #CP-04",
      name: "Teaching Hospital Peradeniya",
      available: "650",
      surplusStatus: "Buffer surplus +130%",
      statusColor: "text-emerald-600",
      location: "Central Province",
      distance: "310 km from Jaffna",
      itemCode: "SL-MSD-SURG-7501",
      exp: "Jan 2027",
      details: ["Batch #SL-2024-44C", "Pre-Inspected"],
      detailColors: ["text-slate-600", "text-emerald-700 bg-emerald-50 border-emerald-200"],
      transitIcon: <Package className="w-5 h-5 text-slate-500" />,
      transitTitle: "Regional Logistics Hub Depot",
      transitDesc: "Est. Transit: 8h 15m via A9 / Kandy Route",
      buttonText: "Request Transfer",
      borderColor: "border-slate-200",
      borderThickness: "border"
    },
    {
      id: "SL-MSD #NW-02",
      name: "Provincial General Hospital Kurunegala",
      available: "800",
      surplusStatus: "Buffer surplus +160%",
      statusColor: "text-emerald-600",
      location: "North Western",
      distance: "240 km from Jaffna",
      itemCode: "SL-MSD-SURG-7501",
      exp: "Aug 2026",
      details: ["Sterile Sealed", "Batch #SL-2023-88A"],
      transitIcon: <Truck className="w-5 h-5 text-slate-500" />,
      transitTitle: "Scheduled Route Available",
      transitDesc: "Est. Transit: 5h 45m via Direct Northern Way",
      buttonText: "Request Transfer",
      borderColor: "border-slate-200",
      borderThickness: "border"
    },
    {
      id: "SL-MSD #CP-01",
      name: "National Hospital Kandy",
      available: "550",
      surplusStatus: "Buffer surplus +110%",
      statusColor: "text-emerald-600",
      location: "Central Province",
      distance: "325 km from Jaffna",
      itemCode: "SL-MSD-SURG-7501",
      exp: "Oct 2026",
      details: ["Batch #SL-2024-12F"],
      transitIcon: <Snowflake className="w-5 h-5 text-slate-500" />,
      transitTitle: "Cold / Sterile Bay Staged",
      transitDesc: "Est. Transit: 8h 00m Dispatch Hub",
      buttonText: "Request Transfer",
      borderColor: "border-slate-200",
      borderThickness: "border"
    },
    {
      id: "SL-MSD #NP-03",
      name: "Base Hospital Vavuniya",
      badge: { text: "NEAREST NODE", color: "bg-amber-100 text-amber-800" },
      available: "350",
      isPartial: true,
      surplusStatus: "Meets 70% of Deficit",
      statusColor: "text-orange-600",
      location: "Northern Province",
      distance: "145 km from Jaffna",
      itemCode: "SL-MSD-SURG-7501",
      exp: "Dec 2028",
      details: ["Batch #SL-2024-19A", "Rapid Fulfillment"],
      detailColors: ["text-slate-600", "text-amber-700 bg-amber-50 border-amber-200"],
      transitIcon: <Zap className="w-5 h-5 text-orange-500" />,
      transitTitle: "Rapid Courier Transit Direct",
      transitDesc: "Est. Transit: 2h 30m Express Dispatch",
      buttonText: "Request Partial Transfer (350 units)",
      buttonColor: "bg-[#0d3c4b]",
      borderColor: "border-amber-400",
      borderThickness: "border-2"
    },
    {
      id: "SL-MSD #SP-01",
      name: "Karapitiya Teaching Hospital Galle",
      available: "1,500",
      surplusStatus: "Major Buffer Surplus",
      statusColor: "text-emerald-600",
      location: "Southern Province",
      distance: "510 km from Jaffna",
      itemCode: "SL-MSD-SURG-7501",
      exp: "Mar 2027",
      details: ["Batch #SL-2024-77E", "Bulk Pallet"],
      transitIcon: <Truck className="w-5 h-5 text-slate-500" />,
      transitTitle: "Express Reefer / Inter-Provincial",
      transitDesc: "Est. Transit: 9h 30m Southern Highway Link",
      buttonText: "Request Transfer",
      borderColor: "border-slate-200",
      borderThickness: "border"
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
                <Link to="/report-shortage" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Report Shortage</Link>
                <Link to="/match-supply" className="px-4 py-2 text-sm font-semibold text-[#0d3c4b] border-b-2 border-[#0d3c4b]">Available Stock</Link>
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

      {/* Breadcrumb & Request Context Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 text-sm">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center text-slate-500 font-medium">
            <Link to="/dashboard" className="hover:text-[#0d3c4b] transition-colors">Dashboard</Link>
            <ChevronDown className="w-3.5 h-3.5 mx-2 -rotate-90 text-slate-400" />
            <a href="#" className="hover:text-[#0d3c4b] transition-colors">Supply Network</a>
            <ChevronDown className="w-3.5 h-3.5 mx-2 -rotate-90 text-slate-400" />
            <span className="text-slate-900 font-semibold">Search & Facility Matching</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider font-bold text-slate-500">Requesting Facility:</span>
              <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">Jaffna General Hospital (Northern Province)</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider font-bold text-red-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Active Shortage:
              </span>
              <span className="font-medium text-slate-700">
                Surgical Gloves (Size 7.5) — <span className="font-bold text-red-600">500 units deficit</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Filters Toolbar */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Supply Name or Item Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  defaultValue="Surgical Gloves (Latex Size 7.5)"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] bg-slate-50/50" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Target Region / Province</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-slate-400" />
                </div>
                <select className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] appearance-none bg-white">
                  <option>All Island (9 Provinces)</option>
                  <option>Northern Province</option>
                  <option>Western Province</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Min. Surplus Buffer</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BarChart2 className="h-4 w-4 text-slate-400" />
                </div>
                <select className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] appearance-none bg-white">
                  <option>&gt;= 500 units</option>
                  <option>&gt;= 100 units</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Transport Readiness</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Truck className="h-4 w-4 text-slate-400" />
                </div>
                <select className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] appearance-none bg-white">
                  <option>Immediate / Fleet Ready</option>
                  <option>Any Readiness</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-5 flex justify-end mt-2 md:mt-0 lg:absolute lg:right-5 lg:top-[68px]">
               <button className="w-full lg:w-auto px-6 py-2 bg-[#0d3c4b] hover:bg-[#092a35] text-white text-sm font-semibold rounded-md shadow-sm flex items-center justify-center gap-2 transition-colors">
                  <Search className="w-4 h-4" /> Match
               </button>
            </div>
          </div>

          {/* Active Filter Pills */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Active Filters:</span>
              
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                Surgical & PPE
                <button className="hover:bg-blue-100 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </span>
              
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                Quantity &gt;= 500 units
                <button className="hover:bg-blue-100 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </span>
              
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active MSD Verified
                <button className="hover:bg-emerald-100 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </span>
              
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                Distance: Closest First
                <button className="hover:bg-blue-100 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </span>
            </div>
            <button className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Clear all filters
            </button>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">Available Supply Matches</h2>
            <span className="bg-[#0d3c4b] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">6 Facilities Found</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline text-sm text-slate-500 font-medium">National Medical Supplies Division Real-Time Ledger</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort By:</span>
            <div className="relative w-48">
              <select className="block w-full pl-3 pr-10 py-1.5 border border-slate-300 rounded-md text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d3c4b] appearance-none bg-white">
                <option>Highest Surplus (Buffer)</option>
                <option>Closest Distance</option>
                <option>Fastest Transit Time</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {facilityMatches.map((match, idx) => (
            <div key={idx} className={`bg-white rounded-xl shadow-sm ${match.borderThickness} ${match.borderColor} flex flex-col h-full overflow-hidden transition-all hover:shadow-md relative`}>
              
              {/* Optional Top Badge */}
              {match.badge && (
                <div className={`absolute top-0 left-0 px-3 py-1 rounded-br-lg text-[10px] font-bold tracking-wider ${match.badge.color}`}>
                  {match.badge.text}
                </div>
              )}

              <div className="p-5 flex-grow">
                {/* Header Row */}
                <div className="flex justify-between items-start mb-4 mt-1">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{match.id}</p>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{match.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{match.location} • {match.distance}</span>
                    </div>
                  </div>
                  
                  {/* Availability Badge */}
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="inline-flex flex-col items-end">
                      <div className="flex items-center gap-1.5 border border-emerald-100 bg-emerald-50 px-3 py-1.5 rounded-md text-emerald-700 mb-1 shadow-sm">
                        <span className={`w-2 h-2 rounded-full ${match.isPartial ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                        <span className="font-bold text-sm">
                          {match.available} <span className="font-medium text-xs opacity-80">units</span>
                        </span>
                        {match.isPartial && <span className="text-xs font-bold ml-1">(Partial)</span>}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${match.statusColor}`}>
                        {match.surplusStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Supply Details Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900 text-sm">Surgical Gloves (Latex Size 7.5)</h4>
                    <span className="text-xs text-slate-400 font-mono font-medium">{match.itemCode}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-600">
                      Exp: {match.exp}
                    </span>
                    {match.details.map((detail, dIdx) => (
                      <span key={dIdx} className={`px-2 py-1 rounded text-xs font-medium border ${
                        match.detailColors && match.detailColors[dIdx] 
                          ? match.detailColors[dIdx] 
                          : "bg-white border-slate-200 text-slate-600"
                      }`}>
                        {detail}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Transit Details Box */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 flex gap-3">
                  <div className="mt-0.5 bg-slate-50 p-1.5 rounded-md border border-slate-100">
                    {match.transitIcon}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{match.transitTitle}</h5>
                    <p className="text-xs text-slate-500 mt-0.5">{match.transitDesc}</p>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-5 pb-5 pt-0 mt-auto flex flex-col gap-3">
                <button className={`w-full py-2.5 rounded-md text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2 shadow-sm ${
                  match.buttonColor || "bg-[#0d3c4b] hover:bg-[#092a35]"
                }`}>
                  {match.buttonText} <ArrowRight className="w-4 h-4" />
                </button>
                {match.showDetailsLink && (
                  <button className="text-xs font-bold text-slate-500 hover:text-[#0d3c4b] text-center w-full transition-colors">
                    View Facility Stock Details
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 py-6 text-sm">
          <p className="text-slate-500 mb-4 sm:mb-0">Showing <span className="font-semibold text-slate-900">1 - 6</span> of <span className="font-semibold text-slate-900">11</span> matching facilities</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md flex items-center gap-1 hover:bg-slate-50 disabled:opacity-50">
              <ChevronDown className="w-4 h-4 rotate-90" /> Previous
            </button>
            <button className="px-3 py-1.5 text-sm font-semibold text-white bg-[#0d3c4b] border border-[#0d3c4b] rounded-md shadow-sm">
              1
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
              2
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md flex items-center gap-1 hover:bg-slate-50">
              Next <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        </div>

        {/* Info Alert Footer */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex gap-4 mt-2">
          <div className="flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6 text-[#0d3c4b]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Ministry of Health Sri Lanka — Emergency Stock Coordination Protocol (Circular MSD-2023/11)</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-5xl">
              Inter-hospital stock redistributions exceeding 250 units are automatically logged into the National Medical Supplies Division (MSD) ledger with priority transport clearance. Transferred units are decremented from the donor facility's ERP and receipt must be confirmed with digital sign-off upon delivery via the MOH Logistical Network.
            </p>
          </div>
        </div>

        {/* Very Bottom Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-10 border-t border-slate-200 pt-6 text-[10px] text-slate-500 font-medium">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <span className="font-bold text-slate-900 text-sm">MedBridge LK</span>
            <div className="w-px h-6 bg-slate-300"></div>
            <span className="max-w-xs">National Medical Supplies Division (MSD) • Ministry of Health Sri Lanka</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Emergency Dispatch Hotline: 1990</span>
            <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> MSD Standard Operating Procedures</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> System Status: Operative (Latency 18ms)</span>
          </div>
        </div>
        
      </main>
    </div>
  );
};

export default MatchSupply;
