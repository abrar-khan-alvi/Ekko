import { useState } from 'react';
import { Calendar, AlertCircle, Clock, Zap } from 'lucide-react';

const notifications = [
  {
    id: 1,
    title: "New Appointment",
    message: "Sarah Johnson booked a \"Classic Haircut\" for Feb 21, 2026 at 10:00 AM.",
    time: "2 mins ago",
    type: "appointment",
    read: false
  },
  {
    id: 2,
    title: "Overdue Booking Detected",
    message: "Emily Davis has not booked an appointment in 30 days. Automated re-engagement sent.",
    time: "2 mins ago",
    type: "alert",
    read: false
  },
  {
    id: 3,
    title: "Reminder Sent",
    message: "WhatsApp reminder sent to Mike Chen for his appointment tomorrow.",
    time: "23 mins ago",
    type: "reminder",
    read: true
  },
  {
    id: 4,
    title: "System Update",
    message: "New automation workflows are now available in your dashboard.",
    time: "44 mins ago",
    type: "system",
    read: true
  },
  {
    id: 5,
    title: "Appointment Cancelled",
    message: "James Wilson cancelled his appointment for Feb 15, 2026.",
    time: "44 mins ago",
    type: "appointment",
    read: true
  }
];

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'appointment':
      return <div className="p-3 bg-blue-50 text-[#4355FF] rounded-xl"><Calendar size={20} /></div>;
    case 'alert':
      return <div className="p-3 bg-orange-50 text-orange-500 rounded-xl"><AlertCircle size={20} /></div>;
    case 'reminder':
      return <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl"><Clock size={20} /></div>;
    case 'system':
      return <div className="p-3 bg-gray-100 text-gray-600 rounded-xl"><Zap size={20} /></div>;
    default:
      return <div className="p-3 bg-gray-50 text-gray-600 rounded-xl"><Calendar size={20} /></div>;
  }
};

export default function Notifications() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');

  const filteredNotifications = notifications.filter(notif =>
    activeTab === 'all' ? true : !notif.read
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-[#8B98AD] mt-1 text-[15px]">Stay updated with your business activities and alerts.</p>
        </div>

        <div className="flex items-center gap-5">
          <button className="text-sm text-[#9BA5B7] hover:text-[#4355FF] font-medium transition-colors">
            Mark all as read
          </button>
          <div className="flex bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-5 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'all'
                  ? 'bg-[#4355FF] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-5 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeTab === 'unread'
                  ? 'bg-[#4355FF] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              Unread
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-5 p-6 bg-white border rounded-2xl transition-all ${!notification.read ? 'border-[#A0ABFF] shadow-sm' : 'border-gray-200'
              }`}
          >
            <NotificationIcon type={notification.type} />
            <div className="flex-1 mt-0.5">
              <div className="flex justify-between items-start mb-1.5">
                <h3 className="font-semibold text-gray-900 text-[15px]">{notification.title}</h3>
                <span className="text-[13px] text-[#9BA5B7] font-medium">{notification.time}</span>
              </div>
              <p className="text-sm text-gray-500">{notification.message}</p>
            </div>
          </div>
        ))}
        {filteredNotifications.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No notifications found.
          </div>
        )}
      </div>
    </div>
  );
}
