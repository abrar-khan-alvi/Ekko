import { Calendar, MessageSquare, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Mon', bookings: 24 },
  { name: 'Tue', bookings: 30 },
  { name: 'Wed', bookings: 10 },
  { name: 'Thu', bookings: 28 },
  { name: 'Fri', bookings: 22 },
  { name: 'Sat', bookings: 30 },
  { name: 'Sun', bookings: 38 },
];

const StatCard = ({ title, value, subtext, icon: Icon, iconColor, bgColor }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-gray-600 font-medium">{title}</h3>
      <div className={`p-2 rounded-lg ${bgColor}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
    <div className="space-y-1">
      <h2 className="text-3xl font-bold text-gray-900">{value}</h2>
      <p className="text-sm text-gray-500">{subtext}</p>
    </div>
  </div>
);

export default function Overview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">overview of bookings, conversations and business performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Appointments"
          value="1,283"
          subtext="All time bookings"
          icon={Calendar}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Active Conversations"
          value="1,283"
          subtext="Currently ongoing"
          icon={MessageSquare}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
        />
        <StatCard
          title="Overdue Customers"
          value="1,283"
          subtext="Pending confirmations"
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="bg-red-50"
        />
        <StatCard
          title="Monthly Revenue"
          value="1,283"
          subtext="Estimated earnings"
          icon={TrendingUp}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-8">Bookings</h3>
        <div className="h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="bookings" radius={[4, 4, 4, 4]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#4355FF" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center mt-4 items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#4355FF]"></div>
          <span className="text-sm text-gray-900 font-medium">Registered Users</span>
        </div>
      </div>
    </div>
  );
}
