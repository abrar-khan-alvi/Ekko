import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Inbox, Loader2, User, Search, Store, RefreshCw, Quote, X, Calendar, Phone, Mail, Award, MousePointer2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

interface Review {
  id: number;
  Name: string;
  Email: string;
  Phone: string;
  Rating: string;
  Feedback: string;
  BusinessName: string;
  createdAt: string;
}

interface UserProfile {
  is_superuser: boolean;
  business_profile: {
    business_name: string;
  } | null;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const fetchReviews = async () => {
    try {
      const data = await apiFetch('/api/chatbot/reviews/');
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews.');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await apiFetch('/api/chatbot/reviews/sync/', { method: 'POST' });
      toast.success(response.message || 'Sync successful!');
      await fetchReviews();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync reviews.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const userData = await apiFetch('/user/').catch(() => null);
        setUser(userData);
        await fetchReviews();
      } catch (error) {
        console.error('Initial load error:', error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const filteredReviews = reviews.filter(review =>
    (review.Name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (review.Email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (review.Feedback?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user?.is_superuser && (review.BusinessName?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto pb-16 px-4">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-5xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            Reviews
            <span className="text-sm font-black bg-blue-50 text-blue-600 px-4 py-1.5 rounded-2xl uppercase tracking-[0.2em] shadow-sm border border-blue-100/50">
              {filteredReviews.length} Total
            </span>
          </h1>
          <p className="text-gray-400 mt-3 text-lg font-medium">
            {user?.is_superuser 
              ? 'Omniscient view of all customer feedback across the ecosystem.' 
              : 'Direct pulse of your customer satisfaction and feedback.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 border-2 border-transparent rounded-[2rem] leading-5 bg-white placeholder-gray-400 shadow-xl shadow-gray-100/50 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 sm:text-sm transition-all"
              placeholder="Search feedback, names, or business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-[2rem] font-black text-sm hover:bg-black transition-all shadow-2xl shadow-gray-900/10 disabled:opacity-50 disabled:cursor-not-allowed group w-full sm:w-auto"
          >
            {syncing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
            )}
            {syncing ? 'Syncing...' : 'Sync Database'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-50/50 gap-6">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-blue-50 rounded-full animate-pulse absolute inset-0"></div>
             <Loader2 className="w-16 h-16 animate-spin text-blue-600 relative z-10" />
          </div>
          <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Establishing Connection</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] border border-gray-100 py-32 text-center shadow-xl shadow-gray-50/50"
        >
          <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-gray-100 shadow-inner">
            <Inbox className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">No results found</h3>
          <p className="text-gray-400 max-w-sm mx-auto font-medium">
            {searchQuery 
              ? "We couldn't find any feedback matching your search criteria." 
              : "Your feedback vault is empty. Try syncing to pull the latest data."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-16">
          {user?.is_superuser ? (
            Object.entries(
              filteredReviews.reduce((acc, review) => {
                const biz = review.BusinessName || 'Unassigned';
                if (!acc[biz]) acc[biz] = [];
                acc[biz].push(review);
                return acc;
              }, {} as Record<string, Review[]>)
            ).map(([bizName, bizReviews]) => {
              const reviewsList = bizReviews as Review[];
              return (
                <div key={bizName} className="space-y-6">
                  <div className="flex items-center gap-6 px-4">
                    <div className="flex items-center gap-3 bg-gray-900 text-white px-5 py-2.5 rounded-2xl shadow-xl shadow-gray-900/10">
                      <Store className="w-5 h-5 text-blue-400" />
                      <h2 className="text-xs font-black uppercase tracking-[0.2em]">{bizName}</h2>
                    </div>
                    <div className="h-[2px] bg-gray-100 flex-1"></div>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{reviewsList.length} Reviews</span>
                  </div>
                  <ReviewTable 
                    reviews={reviewsList} 
                    onRowClick={setSelectedReview} 
                  />
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-2xl shadow-gray-100/50">
               <ReviewTable 
                  reviews={filteredReviews} 
                  onRowClick={setSelectedReview} 
                />
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedReview && (
          <ReviewDetailModal 
            review={selectedReview} 
            onClose={() => setSelectedReview(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ReviewTable({ reviews, onRowClick }: { reviews: Review[], onRowClick: (r: Review) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Rating</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Feedback Sneak-Peek</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {reviews.map((review) => (
            <motion.tr 
              key={review.id}
              onClick={() => onRowClick(review)}
              whileHover={{ backgroundColor: 'rgba(249, 250, 251, 0.5)' }}
              className="group cursor-pointer transition-colors hover:bg-gray-50/50"
            >
              <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 border-4 border-white shadow-xl flex items-center justify-center text-white font-black">
                    {review.Name?.charAt(0).toUpperCase() || <User size={18} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{review.Name || 'Anonymous'}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{review.Email}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 border border-blue-100/50 rounded-xl w-fit">
                   <div className="text-xs font-black text-blue-600">{review.Rating}</div>
                   <div className="text-[10px] text-blue-300 tracking-[-1px]">★★★★★</div>
                </div>
              </td>
              <td className="px-8 py-6">
                <p className="text-sm text-gray-500 font-medium line-clamp-1 max-w-sm truncate italic">
                  "{review.Feedback || 'No written feedback provided.'}"
                </p>
              </td>
              <td className="px-8 py-6">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100/50 px-3 py-1.5 rounded-lg">
                  {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </td>
              <td className="px-8 py-6 text-right">
                <div className="flex items-center justify-end gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                  View Full <MousePointer2 size={14} className="animate-bounce" />
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewDetailModal({ review, onClose }: { review: Review, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] overflow-hidden border border-white"
      >
        {/* Header Section */}
        <div className="bg-gray-50/80 px-10 py-10 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 border-[6px] border-white shadow-2xl flex items-center justify-center text-white text-3xl font-black">
              {review.Name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{review.Name}</h2>
              <div className="flex items-center gap-3 mt-1.5">
                 <span className="text-[10px] font-black bg-blue-500 text-white px-3 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-blue-500/20">Verified reviewer</span>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                   <Calendar size={12} /> {new Date(review.createdAt).toLocaleDateString()}
                 </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-10 space-y-10">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Mail size={12} /> Email Address
               </p>
               <p className="text-sm font-black text-gray-900 lowercase">{review.Email}</p>
            </div>
            <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Phone size={12} /> Phone Number
               </p>
               <p className="text-sm font-black text-gray-900">{review.Phone || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Award size={14} /> Overall Experience
                </p>
                <div className="flex items-center gap-1">
                   {[...Array(5)].map((_, i) => (
                     <Star 
                      key={i} 
                      size={14} 
                      className={i < parseInt(review.Rating) ? "fill-blue-500 text-blue-500" : "text-gray-200"} 
                     />
                   ))}
                </div>
             </div>
             <div className="bg-blue-50/30 p-8 rounded-[2.5rem] border border-blue-100 relative overflow-hidden">
                <Quote className="absolute -top-6 -left-6 w-32 h-32 text-blue-500 opacity-[0.03]" />
                <p className="text-lg font-medium text-blue-900 leading-relaxed italic relative z-10">
                  "{review.Feedback || 'Customer did not leave a written comment.'}"
                </p>
             </div>
          </div>

          <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-gray-900 text-white rounded-xl shadow-xl shadow-gray-900/10">
                    <Store size={14} />
                 </div>
                 <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Source Business</p>
                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{review.BusinessName}</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="px-10 py-4 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-900/10"
              >
                Close Portal
              </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
