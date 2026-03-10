import { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Clock, Zap, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';

const NotificationIcon = ({ type }: { type: string }) => {
  const normType = type.toLowerCase();
  if (normType.includes('appointment')) {
    return <div className="p-3 bg-blue-50 text-[#4355FF] rounded-xl"><Calendar size={20} /></div>;
  } else if (normType.includes('alert') || normType.includes('cancel')) {
    return <div className="p-3 bg-red-50 text-red-500 rounded-xl"><AlertCircle size={20} /></div>;
  } else if (normType.includes('reminder')) {
    return <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl"><Clock size={20} /></div>;
  } else if (normType.includes('system') || normType.includes('update')) {
    return <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Zap size={20} /></div>;
  }
  return <div className="p-3 bg-gray-50 text-gray-500 rounded-xl"><Calendar size={20} /></div>;
};

export default function Notifications() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
  const [dbNotifications, setDbNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = async (pageNum = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const data = await apiFetch(`/api/auth/notifications/?page=${pageNum}`);
      if (data && data.results) {
        if (isLoadMore) {
          setDbNotifications(prev => [...prev, ...data.results]);
        } else {
          setDbNotifications(data.results);
        }
        setHasMore(data.next !== null);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, false);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      setDbNotifications(prev => prev.map(notif => 
        notif.id === id ? { ...notif, is_read: true } : notif
      ));
      await apiFetch(`/api/auth/notifications/${id}/read/`, { method: 'PATCH' });
    } catch (error) {
      console.error("Failed to mark as read:", error);
      fetchNotifications(1, false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setDbNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      await apiFetch('/api/auth/notifications/read-all/', { method: 'POST' });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      fetchNotifications(1, false);
    }
  };

  const dynamicNotifications = dbNotifications.map(n => {
    const date = new Date(n.created_at);
    return {
      id: n.id,
      title: n.title,
      message: n.message,
      time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      type: n.notification_type || 'appointment',
      read: n.is_read,
      raw: n
    };
  });

  const filteredNotifications = dynamicNotifications.filter(notif =>
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
          <button 
            onClick={handleMarkAllAsRead}
            title="Mark all notifications as read"
            className="flex items-center gap-1.5 text-sm text-[#9BA5B7] hover:text-[#4355FF] font-medium transition-colors"
          >
            <CheckCircle2 size={16} />
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
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4355FF]"></div>
          </div>
        ) : (
          <>
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => typeof notification.id === 'number' && !notification.read ? handleMarkAsRead(notification.id) : null}
                className={`flex items-start gap-5 p-6 bg-white border rounded-2xl transition-all ${
                  !notification.read ? 'border-[#A0ABFF] shadow-sm cursor-pointer hover:bg-blue-50/30' : 'border-gray-200'
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
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <div className="w-56 h-56 mb-4 flex items-center justify-center bg-[#F8FAFF] rounded-full">
                  <img 
                    src="/inbox-zero.png" 
                    alt="Inbox Zero" 
                    className="w-48 h-48 object-contain drop-shadow-sm" 
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">You're all caught up!</h3>
                <p className="text-gray-500 text-[15px] max-w-sm">
                  {activeTab === 'unread' 
                    ? "You don't have any unread notifications right now."
                    : "Your inbox is completely empty. Take a deep breath and enjoy your day!"}
                </p>
              </div>
            )}
            
            {hasMore && filteredNotifications.length > 0 && (
              <div className="flex justify-center pt-6 pb-4">
                <button
                  onClick={() => fetchNotifications(page + 1, true)}
                  disabled={loadingMore}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 shadow-sm rounded-xl font-medium text-sm hover:bg-gray-50 hover:text-gray-900 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                      Loading...
                    </>
                  ) : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
