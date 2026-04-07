import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  AlertCircle, 
  Clock, 
  Zap, 
  CheckCircle2, 
  Star, 
  UserPlus, 
  MessageSquare,
  ExternalLink,
  MessageCircle,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../utils/api';

const NotificationIcon = ({ type }: { type: string }) => {
  const normType = type.toLowerCase();
  
  if (normType.includes('booking') || normType.includes('appointment')) {
    return (
      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl ring-4 ring-emerald-50/50">
        <UserPlus size={20} />
      </div>
    );
  } else if (normType.includes('review')) {
    return (
      <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl ring-4 ring-amber-50/50">
        <Star size={20} fill="currentColor" />
      </div>
    );
  } else if (normType.includes('reminder')) {
    return (
      <div className="p-2.5 bg-blue-50 text-[#4355FF] rounded-xl ring-4 ring-blue-50/50">
        <Clock size={20} />
      </div>
    );
  } else if (normType.includes('alert') || normType.includes('cancel')) {
    return (
      <div className="p-2.5 bg-red-50 text-red-600 rounded-xl ring-4 ring-red-50/50">
        <AlertCircle size={20} />
      </div>
    );
  }
  
  return (
    <div className="p-2.5 bg-slate-50 text-slate-500 rounded-xl ring-4 ring-slate-50/50">
      <Zap size={20} />
    </div>
  );
};

interface NotificationCardProps {
  notification: any;
  onRead: (id: number) => void | Promise<void>;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onRead }) => {
  const isUnread = !notification.read;
  
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.raw.customer_phone) return;
    const phone = notification.raw.customer_phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => isUnread && onRead(notification.id)}
      className={`group relative flex items-start gap-4 p-5 bg-white border rounded-2xl transition-all ${
        isUnread 
          ? 'border-blue-200 shadow-[0_4px_20px_-4px_rgba(67,85,255,0.08)] cursor-pointer hover:bg-blue-50/20' 
          : 'border-slate-100 opacity-80 hover:opacity-100'
      }`}
    >
      <NotificationIcon type={notification.type} />
      
      <div className="flex-1 min-w-0 pr-12">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`text-[15px] font-semibold truncate ${isUnread ? 'text-slate-900' : 'text-slate-600'}`}>
            {notification.title}
          </h3>
          {isUnread && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#4355FF] ring-4 ring-blue-50" />
          )}
        </div>
        
        <p className="text-[14px] text-slate-500 leading-relaxed max-w-2xl mb-3">
          {notification.message}
        </p>

        <div className="flex items-center gap-4 text-[12px] font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {notification.raw.created_at_human || notification.time}
          </span>
          {notification.raw.customer_name && (
            <span className="flex items-center gap-1 uppercase tracking-wider text-[10px]">
              <MessageSquare size={10} />
              {notification.raw.customer_name}
            </span>
          )}
        </div>
      </div>

      <div className="absolute right-5 top-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {notification.raw.customer_phone && (
          <button
            onClick={handleWhatsApp}
            title="Chat on WhatsApp"
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100 bg-white shadow-sm"
          >
            <MessageCircle size={18} />
          </button>
        )}
        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 bg-white shadow-sm">
          <ExternalLink size={18} />
        </button>
      </div>
    </motion.div>
  );
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

  const formattedNotifications = useMemo(() => {
    return dbNotifications.map(n => {
      const date = new Date(n.created_at);
      return {
        id: n.id,
        title: n.title,
        message: n.message,
        time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type: n.notification_type || 'appointment',
        read: n.is_read,
        raw: n,
        dateObject: date
      };
    }).filter(notif => activeTab === 'all' ? true : !notif.read);
  }, [dbNotifications, activeTab]);

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    formattedNotifications.forEach(n => {
      const d = new Date(n.dateObject);
      d.setHours(0, 0, 0, 0);
      
      let groupKey = "Earlier";
      if (d.getTime() === today.getTime()) groupKey = "Today";
      else if (d.getTime() === yesterday.getTime()) groupKey = "Yesterday";
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(n);
    });

    return groups;
  }, [formattedNotifications]);

  const groupOrder = ["Today", "Yesterday", "Earlier"];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 mt-1.5 text-[15px]">Keep track of bookings, reviews, and customer activities.</p>
        </div>

        <div className="flex items-center gap-4 self-start md:self-center">
        <button 
            onClick={handleMarkAllAsRead}
            disabled={!dbNotifications.some(n => !n.is_read)}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-slate-500 hover:text-[#4355FF] disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <CheckCircle2 size={16} />
            Mark all read
          </button>
          
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['unread', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 text-[13px] font-bold rounded-lg capitalize transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-[#4355FF] shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-blue-50"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-[#4355FF] animate-spin"></div>
            </div>
            <p className="text-slate-400 text-sm font-medium">Fetching alerts...</p>
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {groupOrder.map(group => {
                const items = groupedNotifications[group];
                if (!items?.length) return null;

                return (
                  <div key={group} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">
                        {group}
                      </h2>
                      <div className="h-px w-full bg-slate-100" />
                    </div>
                    <div className="grid gap-4">
                      {items.map((notification) => (
                        <NotificationCard 
                          key={notification.id} 
                          notification={notification} 
                          onRead={handleMarkAsRead}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </AnimatePresence>

            {formattedNotifications.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-50 rounded-full blur-3xl opacity-60 animate-pulse" />
                  <div className="relative w-48 h-48 flex items-center justify-center bg-white rounded-3xl shadow-xl border border-slate-50 overflow-hidden group">
                    <img 
                      src="/inbox-zero.png" 
                      alt="Inbox Zero" 
                      className="w-32 h-32 object-contain group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">You're all caught up!</h3>
                <p className="text-slate-500 text-[16px] max-w-xs leading-relaxed">
                  {activeTab === 'unread' 
                    ? "Great job! You've handled all your recent activity."
                    : "No notifications yet. Check back soon for new bookings and reviews!"}
                </p>
              </motion.div>
            )}
            
            {hasMore && formattedNotifications.length > 0 && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => fetchNotifications(page + 1, true)}
                  disabled={loadingMore}
                  className="group flex items-center gap-3 px-8 py-3 bg-white border border-slate-200 text-slate-600 shadow-sm rounded-2xl font-bold text-sm hover:border-[#4355FF] hover:text-[#4355FF] hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <div className="w-5 h-5 border-2 border-[#4355FF] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>View more activity</span>
                      <MoreVertical size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
