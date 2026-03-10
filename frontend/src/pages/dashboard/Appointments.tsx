import { useState, useEffect } from 'react';
import {
  Calendar, Search, Loader2, RefreshCw, Mail, Phone, Clock,
  ExternalLink, X, MapPin, Briefcase, Info, ChevronRight,
  User, ClipboardList, ShieldCheck, Hash, ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Appointment {
  id: number;
  BusinessName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  appointmentDateTime: string;
  service: string;
  Whatsapp_Number: string;
  Business_hours: string;
  Services_offered: string;
  Booking_policies: string;
  businessId: string;
  tool_call_id: string;
}

const ITEMS_PER_PAGE = 10;

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAppointments = async (isBgRefresh = false) => {
    if (!isBgRefresh) setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/chatbot/appointments/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load appointments.');
    } finally {
      if (!isBgRefresh) setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/chatbot/appointments/sync/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Sync failed');
      const result = await response.json();
      if (result.new_appointments_synced > 0) {
        toast.success(`${result.new_appointments_synced} new appointments synced!`);
      } else {
        toast.success('Appointments are already up to date.');
      }
      await fetchAppointments(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync appointments.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter(app =>
    app.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.BusinessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[#4355FF] animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">Manage and monitor all incoming customer bookings.</p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#4355FF] text-white rounded-xl hover:bg-[#3245FF] transition-all shadow-lg shadow-blue-200 disabled:opacity-70 font-semibold text-sm"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {syncing ? 'Syncing...' : 'Sync Latest'}
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by customer, business or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#4355FF]/10 focus:border-[#4355FF] transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            {filteredAppointments.length} Bookings found
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Business Detail</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">Service</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Scheduled Time</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedAppointments.length > 0 ? (
                paginatedAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/80 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#4355FF] text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md shadow-blue-100">
                          {app.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm leading-none">{app.customerName}</p>
                          <p className="text-[11px] text-gray-500 mt-1 font-medium">{app.customerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-700">{app.BusinessName}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">{app.businessId || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-[#4355FF] text-[10px] font-black uppercase tracking-wider">
                        {app.service}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-gray-900">{formatTime(app.appointmentDateTime)}</span>
                        <span className="text-[11px] text-gray-400 font-bold uppercase">{formatShortDate(app.appointmentDateTime)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedAppointment(app)}
                        className="h-8 w-8 inline-flex items-center justify-center text-gray-400 hover:text-[#4355FF] hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 hover:shadow-sm"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-gray-300">
                      <Calendar className="w-12 h-12 opacity-20" />
                      <div>
                        <p className="text-lg font-bold text-gray-400">No appointments found</p>
                        <p className="text-sm font-medium mt-1">Try refreshing the database to see latest bookings.</p>
                      </div>
                      <button
                        onClick={handleSync}
                        className="mt-2 text-[#4355FF] text-sm font-black hover:underline px-4 py-2 bg-blue-50 rounded-xl"
                      >
                        Sync Appointments Now
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
              Showing <span className="text-gray-900">{startIndex + 1}</span> to <span className="text-gray-900">{Math.min(startIndex + ITEMS_PER_PAGE, filteredAppointments.length)}</span> of <span className="text-gray-900">{filteredAppointments.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-xl hover:bg-white hover:shadow-sm transition-all disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-xl font-black text-[11px] transition-all ${currentPage === i + 1
                        ? "bg-[#4355FF] text-white shadow-md shadow-blue-200"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-xl hover:bg-white hover:shadow-sm transition-all disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#0a0a1a]/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl shadow-blue-900/10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-white/20">
            {/* Top Bar Navigation */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#4355FF]" />
                </div>
                <span className="text-[10px] font-black text-[#4355FF] uppercase tracking-[0.2em]">Verified Booking</span>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 md:p-12">
              {/* Hero Section */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#4355FF] to-[#3245FF] rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/20">
                    {selectedAppointment.customerName.charAt(0)}
                  </div>
                  <div>
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[#4355FF] text-[10px] font-black uppercase tracking-wider mb-2">
                      {selectedAppointment.service}
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                      {selectedAppointment.customerName}
                    </h2>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="flex items-center gap-1.5 text-sm font-bold text-gray-500">
                        <Briefcase className="w-4 h-4" /> {selectedAppointment.BusinessName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#f8f9ff] p-6 rounded-[2rem] border border-blue-50/50 flex flex-col items-end min-w-[200px]">
                  <div className="flex items-center gap-2 text-[#4355FF] mb-1">
                    <Clock className="w-5 h-5" />
                    <span className="text-2xl font-black">{formatTime(selectedAppointment.appointmentDateTime)}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {formatDate(selectedAppointment.appointmentDateTime)}
                  </p>
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Contact Group */}
                <div>
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <User className="w-3 h-3" /> Contact Information
                  </h3>
                  <div className="space-y-6">
                    <div className="group">
                      <p className="text-[10px] font-black text-gray-300 uppercase mb-1 group-hover:text-[#4355FF] transition-colors">Phone Number</p>
                      <p className="text-lg font-bold text-gray-800 tracking-tight">{selectedAppointment.customerPhone}</p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-black text-gray-300 uppercase mb-1 group-hover:text-[#4355FF] transition-colors">Email Address</p>
                      <p className="text-lg font-bold text-gray-800 tracking-tight truncate">{selectedAppointment.customerEmail || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Business & Policies */}
                <div>
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Info className="w-3 h-3" /> Business Operations
                  </h3>
                  <div className="space-y-6">
                    <div className="group">
                      <p className="text-[10px] font-black text-gray-300 uppercase mb-1">Standard Hours</p>
                      <p className="text-base font-bold text-gray-700 leading-snug">{selectedAppointment.Business_hours || 'Not specified'}</p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-black text-gray-300 uppercase mb-1 uppercase">Booking Guidelines</p>
                      <p className="text-sm font-medium text-gray-600 leading-relaxed italic border-l-2 border-blue-100 pl-4 py-1">
                        "{selectedAppointment.Booking_policies || 'General terms of service apply to this booking.'}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Footer */}
              <div className="mt-16 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Transaction ID</span>
                    <span className="text-[11px] font-mono text-gray-500 font-medium">{selectedAppointment.tool_call_id}</span>
                  </div>
                  <div className="h-8 w-px bg-gray-100"></div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Database Record</span>
                    <span className="text-[11px] font-mono text-gray-500 font-medium">#{String(selectedAppointment.id).padStart(5, '0')}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="w-full md:w-auto px-10 py-4 bg-gray-900 text-white rounded-[1.5rem] font-bold text-sm hover:bg-gray-800 hover:shadow-2xl hover:shadow-black/20 transition-all transform active:scale-95"
                >
                  Keep exploring
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
