import { useState, useEffect } from 'react';
import {
  Calendar, MessageSquare, AlertTriangle, TrendingUp,
  CheckCircle2, Zap, Users, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';

interface StatsData {
  total_appointments: number;
  total_conversations: number;
  total_customers: number;
  booking_trend: { name: string; bookings: number }[];
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/api/chatbot/stats/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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

      {/* Chart Section */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
        {/* Decorative background logo or pattern could go here */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-xl font-black text-gray-900 leading-none">Booking Trends</h3>
            <p className="text-sm text-gray-400 font-medium mt-2 uppercase tracking-widest">Last 7 Days Performance</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
            <TrendingUp className="w-4 h-4 text-[#4355FF]" />
            <span className="text-xs font-bold text-gray-700">Live Data</span>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={stats?.booking_trend || []} barSize={24} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f1f1" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip
                cursor={{ fill: '#f8f9ff', radius: 12 }}
                contentStyle={{
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                  padding: '12px 16px',
                  fontFamily: 'inherit',
                  fontWeight: 'bold'
                }}
              />
              <Bar dataKey="bookings" radius={[12, 12, 12, 12]} animationDuration={1500}>
                {(stats?.booking_trend || []).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === (stats?.booking_trend?.length ?? 0) - 1 ? "#4355FF" : "#cbd5e1"}
                    className="hover:fill-[#4355FF] transition-all cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center mt-10 items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#4355FF]"></div>
            <span className="text-[11px] text-gray-400 font-black uppercase tracking-widest">Today's Peak</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#cbd5e1]"></div>
            <span className="text-[11px] text-gray-400 font-black uppercase tracking-widest">Historical Data</span>
          </div>
        </div>
      </div>
    </div>
  );
}
