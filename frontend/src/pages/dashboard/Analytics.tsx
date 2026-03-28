import { useState, useEffect } from 'react';
import {
  BarChart2, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight,
  Loader2, Filter, ChevronDown, CheckCircle2, Zap
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

interface AnalyticsData {
  monthly_growth: { name: string; value: number }[];
  conversion_rate: number;
  growth_percentage: number;
  total_appointments: number;
  selected_year: number;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isYearOpen, setIsYearOpen] = useState(false);

  const years = [2024, 2025, 2026];

  const fetchAnalytics = async (year: number) => {
    setLoading(true);
    try {
      const result = await apiFetch(`/api/chatbot/analytics/?year=${year}`);
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedYear);
  }, [selectedYear]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[#4355FF] animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Analyzing your business performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Business Analytics</h1>
          <p className="text-gray-500 font-medium mt-1">Deep dive into your booking performance and conversion trends.</p>
        </div>

        {/* Year Filter */}
        <div className="relative">
          <button
            onClick={() => setIsYearOpen(!isYearOpen)}
            className="flex items-center gap-3 bg-white border border-gray-100 px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all font-bold text-sm text-gray-700"
          >
            <Filter className="w-4 h-4 text-[#4355FF]" />
            Year: {selectedYear}
            <ChevronDown className={`w-4 h-4 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
          </button>

          {isYearOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-50 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => {
                    setSelectedYear(year);
                    setIsYearOpen(false);
                  }}
                  className={`w-full px-6 py-3 text-left text-sm font-bold transition-colors ${selectedYear === year ? "bg-[#4355FF] text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Key Metrics */}
        <div className="space-y-6">
          {/* Conversion Rate Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-blue-50/50 rounded-full blur-2xl group-hover:bg-blue-100/50 transition-all"></div>

            <div className="relative">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">Conversion rate</h3>
                <div className="p-3 rounded-2xl bg-[#4355FF]/10 text-[#4355FF]">
                  <Zap size={20} fill="currentColor" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter">
                  {data?.conversion_rate || 0}%
                </h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">Appts per interaction</p>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-50 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Optimized Performance</span>
              </div>
            </div>
          </div>

          {/* Growth Card */}
          <div className={`p-8 rounded-[2.5rem] border shadow-sm relative overflow-hidden transition-all ${(data?.growth_percentage || 0) >= 0
            ? "bg-white border-gray-100"
            : "bg-red-50/10 border-red-100"
            }`}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">Monthly Growth</h3>
              <div className={`p-3 rounded-2xl ${(data?.growth_percentage || 0) >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                }`}>
                {(data?.growth_percentage || 0) >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                {(data?.growth_percentage || 0) >= 0 ? '+' : ''}{data?.growth_percentage || 0}%
              </h2>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tighter mt-1">vs Previous Month</p>
            </div>
          </div>

          {/* Total Appointments Mini Card */}
          <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-black/10">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-4 h-4 text-white/40" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Yearly Total</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">{data?.total_appointments || 0}</h2>
            <p className="text-xs text-white/50 font-medium mt-1">Confirmed bookings in {selectedYear}</p>
          </div>
        </div>

        {/* Right Column: Growth Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Booking Volatility</h3>
              <p className="text-[11px] text-gray-400 font-bold mt-3 uppercase tracking-widest">Monthly Trend Analysis • {selectedYear}</p>
            </div>
            <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
              <BarChart2 className="w-5 h-5 text-[#4355FF]" />
            </div>
          </div>

          <div className="h-[400px] w-full mt-4">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#4355FF]/20 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={data?.monthly_growth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4355FF" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4355FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f1f1" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '20px',
                      border: 'none',
                      boxShadow: '0 25px 30px -5px rgb(0 0 0 / 0.1)',
                      padding: '16px 20px',
                      fontFamily: 'inherit',
                      fontWeight: 'bold'
                    }}
                    cursor={{ stroke: '#4355FF', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#4355FF"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorGrowth)"
                    animationDuration={2000}
                    activeDot={{ r: 8, fill: "#4355FF", stroke: "#fff", strokeWidth: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex justify-center mt-10 items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#4355FF]"></div>
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Monthly Volume</span>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl">
              <TrendingUp className="w-3 h-3 text-[#4355FF]" />
              <span className="text-[10px] font-black text-[#4355FF] uppercase tracking-widest">Calculated Real-time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
