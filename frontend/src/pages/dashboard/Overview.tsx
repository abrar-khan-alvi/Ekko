import { useState, useEffect } from 'react';
import {
  Calendar, MessageSquare, AlertTriangle, TrendingUp,
  CheckCircle2, Zap, Users, Loader2, History, LayoutList, Clock, ChevronRight, UserPlus, Star
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { useOutletContext } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

interface StatsData {
  total_appointments: number;
  total_conversations: number;
  total_customers: number;
  booking_trend: { name: string; bookings: number }[];
  latest_appointments?: any[];
}

const StatCard = ({ title, value, subtext, icon: Icon, iconColor, bgColor }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest">{title}</h3>
      <div className={`p-2 rounded-xl ${bgColor}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
    <div className="space-y-1">
      <h2 className="text-4xl font-black text-gray-900 tracking-tight">{value.toLocaleString()}</h2>
      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">{subtext}</p>
    </div>
  </div>
);

export default function Overview() {
  const { user } = useOutletContext<{ user: any }>();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Default range: Last 30 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const statsUrl = `/api/chatbot/stats/?start_date=${startDate}&end_date=${endDate}`;
      const notifUrl = `/api/auth/notifications/?page=1&page_size=3`;
      
      const [statsData, notifData] = await Promise.all([
        apiFetch(statsUrl),
        apiFetch(notifUrl)
      ]);
      
      setStats(statsData);
      if (notifData && notifData.results) {
        setRecentNotifications(notifData.results.slice(0, 3));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const ActivityIcon = ({ type, colorClass, bgColorClass }: any) => {
    const normType = (type || '').toLowerCase();
    if (normType.includes('booking')) {
      return <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><UserPlus size={16} /></div>;
    } else if (normType.includes('review')) {
      return <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Star size={16} fill="currentColor" /></div>;
    }
    return <div className={`p-2 ${bgColorClass} ${colorClass} rounded-lg`}><Clock size={16} /></div>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[#4355FF] animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Crunching your business data...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Appointments",
      value: stats?.total_appointments || 0,
      subtext: "Successful bookings",
      icon: Calendar,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Conversations",
      value: stats?.total_conversations || 0,
      subtext: "Total AI interactions",
      icon: MessageSquare,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      title: "Total Customers",
      value: stats?.total_customers || 0,
      subtext: "Unique contacts reached",
      icon: Users,
      iconColor: "text-green-600",
      bgColor: "bg-green-50"
    }
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Overview</h1>
          <p className="text-gray-500 font-medium mt-1">Real-time performance metrics for your business automation.</p>
        </div>

        {user?.is_paid && (
          <div className="flex items-center gap-3 bg-[#4355FF] px-6 py-4 rounded-[1.5rem] shadow-xl shadow-blue-500/20">
            <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <p className="text-white font-black text-sm leading-tight uppercase tracking-tighter">Business Pro Active</p>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-0.5">Full automation enabled</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <StatCard key={idx} {...card} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="xl:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div>
              <h3 className="text-xl font-black text-gray-900 leading-none">Booking Trends</h3>
              <p className="text-sm text-gray-400 font-medium mt-2 uppercase tracking-widest">Performance by Date Range</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
               <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                 <span className="text-[10px] font-black text-gray-400 uppercase">From</span>
                 <input 
                   type="date" 
                   value={startDate}
                   onChange={(e) => setStartDate(e.target.value)}
                   className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
                 />
               </div>
               <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                 <span className="text-[10px] font-black text-gray-400 uppercase">To</span>
                 <input 
                   type="date" 
                   value={endDate}
                   onChange={(e) => setEndDate(e.target.value)}
                   className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
                 />
               </div>
               <button 
                 onClick={fetchStats}
                 className="px-4 py-2 bg-[#4355FF] text-white text-xs font-black rounded-xl hover:bg-[#3245FF] transition-all shadow-lg shadow-blue-200"
               >
                 Filter
               </button>
            </div>
          </div>

          <div className="h-[300px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.booking_trend || []} barSize={24}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f1f1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  cursor={{ fill: '#f8f9ff', radius: 12 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="bookings" radius={[8, 8, 8, 8]}>
                  {(stats?.booking_trend || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.bookings > 0 ? "#4355FF" : "#cbd5e1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900 leading-none">Recent Activity</h3>
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">Active Pulse</span>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notif, idx) => (
                <div 
                  key={notif.id || idx} 
                  className="flex gap-4 group cursor-pointer" 
                  onClick={() => (window.location.href = '/dashboard/notifications')}
                >
                  <div className="relative">
                    <ActivityIcon 
                      type={notif.notification_type} 
                      colorClass="text-blue-600" 
                      bgColorClass="bg-blue-50" 
                    />
                    {idx < recentNotifications.length - 1 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-100" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[13px] font-bold text-slate-800 line-clamp-1 group-hover:text-[#4355FF] transition-colors">
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {notif.created_at_human || 'Just now'}
                    </p>
                    <p className="text-[12px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60">
                <div className="p-4 bg-slate-50 rounded-full mb-3 text-slate-300">
                   <History size={24} />
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No recent alerts</p>
                <p className="text-slate-300 text-[10px] mt-1 font-medium italic">Your activity will appear here</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => (window.location.href = '/dashboard/notifications')}
            className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-[#4355FF] hover:gap-3 transition-all"
          >
            Explore all activity
            <ChevronRight size={14} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
