import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Inbox, Loader2, User, Search, Store } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

interface Review {
  id: number;
  Name: string;
  Email: string;
  Phone: string;
  Rating: string;
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, reviewsData] = await Promise.all([
          apiFetch('/user/').catch(() => null),
          fetch('https://ekkoflow.app.n8n.cloud/webhook/getreview').then(res => res.json())
        ]);
        
        setUser(userData);

        if (Array.isArray(reviewsData)) {
          // Sort reviews by latest first
          const sorted = reviewsData.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          if (userData?.is_superuser) {
            setReviews(sorted);
          } else {
            const bizName = userData?.business_profile?.business_name;
            if (bizName) {
              setReviews(sorted.filter(r => r.BusinessName === bizName));
            } else {
              setReviews([]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching reviews data:', error);
        toast.error('Failed to load recent reviews.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredReviews = reviews.filter(review =>
    (review.Name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (review.Email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user?.is_superuser && (review.BusinessName?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto pb-16">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="text-gray-500 mt-2 text-lg">
            {user?.is_superuser 
              ? 'View all customer feedback across all businesses.' 
              : 'See what your customers are saying about you.'}
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] sm:text-sm transition-all"
            placeholder="Search by customer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#4355FF]" />
            <p className="text-gray-500 font-medium animate-pulse">Loading reviews...</p>
          </div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm"
        >
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100 placeholder-glow">
            <Inbox className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No reviews found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {searchQuery 
              ? "We couldn't find any reviews matching your search." 
              : "Looks like there are no reviews yet. When customers submit feedback, it will appear here."}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={review.id || idx}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#4355FF]/5 to-transparent rounded-bl-[100px] pointer-events-none transition-transform group-hover:scale-110"></div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold relative z-10">
                    {review.Name ? review.Name.charAt(0).toUpperCase() : <User size={18} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight flex items-center gap-1.5">
                      {review.Name || 'Anonymous User'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{review.Email}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-lg tracking-widest">{review.Rating || 'No rating'}</span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-2 relative z-10">
                {user?.is_superuser && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 w-fit px-2 py-1 rounded-md">
                    <Store size={12} className="text-indigo-500" />
                    <span className="truncate max-w-[150px]">{review.BusinessName || 'Unknown Business'}</span>
                  </div>
                )}
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  • {new Date(review.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
