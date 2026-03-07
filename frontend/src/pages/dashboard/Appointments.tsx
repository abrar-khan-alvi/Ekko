import { Search, Filter, Edit, Trash2 } from 'lucide-react';

const appointments = [
  {
    id: 1,
    name: "Sarah Williams",
    service: "Hair Styling",
    date: "2026-02-14",
    time: "10:22 am",
    status: "Confirmed",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
  {
    id: 2,
    name: "Mike Chen",
    service: "Beard Trim",
    date: "2026-02-14",
    time: "03:07 pm",
    status: "Confirmed",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
  {
    id: 3,
    name: "Anna Park",
    service: "Manicure",
    date: "2026-02-15",
    time: "06:32 pm",
    status: "Pending",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
  {
    id: 4,
    name: "Tom Brown",
    service: "Full Styling",
    date: "2026-02-15",
    time: "09:01 am",
    status: "Confirmed",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
  {
    id: 5,
    name: "James Wilson",
    service: "Full Service",
    date: "2026-02-16",
    time: "11:50 pm",
    status: "Cancelled",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  }
];

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    Confirmed: "bg-orange-50 text-orange-800 border-orange-100",
    Pending: "bg-blue-50 text-blue-800 border-blue-100",
    Cancelled: "bg-red-50 text-red-800 border-red-100"
  };
  
  return (
    <span className={`px-4 py-1.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

export default function Appointments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-500 mt-1">Manage your bookings and walk-ins.</p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search appointments..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF]"
            />
          </div>
          <button className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-500 font-normal">Service</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-500 font-normal">Date</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-500 font-normal">Time</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-500 font-normal">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-500 font-normal"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {appointments.map((appt) => (
              <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={appt.avatar} alt={appt.name} className="w-10 h-10 rounded-full object-cover" />
                    <span className="font-medium text-gray-900">{appt.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{appt.service}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{appt.date}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{appt.time}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={appt.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-900">
                      <Edit size={16} />
                    </button>
                    <button className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Showing 1 to 4 of 154 customers</span>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs disabled:opacity-50">
              &lt;
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#4355FF] text-white text-xs font-medium">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs">
              3
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs">
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
