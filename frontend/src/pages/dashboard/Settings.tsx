import React, { useState, useEffect } from 'react';
import { Save, Loader2, User, Briefcase, Lock, ShieldCheck, FileText } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface UserProfile {
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  is_superuser: boolean;
  is_paid: boolean;
  business_profile: {
    business_name: string;
    business_hours: string;
    services_offered: string;
    booking_policies: string;
    facebook_link: string;
    instagram_link: string;
    linkedin_link: string;
  };
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'security'>('profile');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile Update State (Business Only)
  const [profileLoading, setProfileLoading] = useState(false);
  const [businessData, setBusinessData] = useState({
    business_name: '',
    business_hours: '',
    services_offered: '',
    booking_policies: '',
    facebook_link: '',
    instagram_link: '',
    linkedin_link: ''
  });

  // Password Update State
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleBusinessInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBusinessData({ ...businessData, [e.target.name]: e.target.value });
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      // Exclude business_name — it cannot be changed after registration
      const { business_name: _excluded, ...updatableFields } = businessData;
      const data = await apiFetch('/user/', {
        method: 'PATCH',
        body: JSON.stringify({
          business_profile: updatableFields
        })
      });
      setUser(data);
      toast.success('Business details updated successfully!');
    } catch (err: any) {
      console.error('Profile update failed', err);
      const serverErrors = err.data;
      let firstMessage = 'Failed to update business details. Please check your inputs.';

      if (typeof serverErrors === 'object' && serverErrors !== null) {
        // Business profile errors often come nested under "business_profile"
        let errorSource = serverErrors;
        if (serverErrors.business_profile) {
          errorSource = serverErrors.business_profile;
        }

        const errorValues = Object.values(errorSource);
        if (errorValues.length > 0) {
          const firstErr = errorValues[0];
          firstMessage = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
        } else if (serverErrors.detail) {
          firstMessage = serverErrors.detail;
        }
      }
      toast.error(firstMessage);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match.');
      setPasswordLoading(false);
      return;
    }

    try {
      await apiFetch('/change-password/', {
        method: 'POST',
        body: JSON.stringify(passwordData)
      });
      toast.success('Password successfully updated!');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      console.error('Password update failed', err);
      const serverErrors = err.data;
      let firstMessage = 'Failed to update password. Please check your current password.';

      if (typeof serverErrors === 'object' && serverErrors !== null) {
        const errorValues = Object.values(serverErrors);
        if (errorValues.length > 0) {
          const firstErr = errorValues[0];
          firstMessage = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
        } else if (serverErrors.detail) {
          firstMessage = serverErrors.detail;
        }
      }
      toast.error(firstMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiFetch('/user/');
        setUser(data);
        if (data.business_profile) {
          setBusinessData({
            business_name: data.business_profile.business_name || '',
            business_hours: data.business_profile.business_hours || '',
            services_offered: data.business_profile.services_offered || '',
            booking_policies: data.business_profile.booking_policies || '',
            facebook_link: data.business_profile.facebook_link || '',
            instagram_link: data.business_profile.instagram_link || '',
            linkedin_link: data.business_profile.linkedin_link || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#4355FF]" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Account Profile', icon: User, desc: 'Your personal locked details' },
    ...(!user?.is_superuser ? [{ id: 'business', label: 'Business Details', icon: Briefcase, desc: 'Manage public business info' }] : []),
    { id: 'security', label: 'Security', icon: ShieldCheck, desc: 'Update passwords and auth' }
  ];

  return (
    <div className="max-w-6xl w-full pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-2 text-lg">Manage your account preferences and business configurations.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left Navigation Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm sticky top-6">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-200 relative overflow-hidden ${isActive
                      ? 'bg-[#4355FF]/5 border border-[#4355FF]/20 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-[#4355FF]"
                      />
                    )}
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-[#4355FF] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                      <tab.icon size={20} />
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isActive ? 'text-[#4355FF]' : 'text-gray-700'}`}>
                        {tab.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{tab.desc}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#4355FF]/10 text-[#4355FF] flex items-center justify-center text-2xl font-bold shadow-inner">
                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Personal Account Info</h2>
                        <p className="text-gray-500 text-sm mt-1">Identity verification details provided during registration.</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full uppercase tracking-wider">
                      <Lock size={12} /> View Only
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Legal Full Name</label>
                      <div className="px-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl">
                        <p className="text-gray-900 font-medium">{user?.full_name || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                      <div className="px-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl">
                        <p className="text-gray-900 font-medium">{user?.email || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                      <div className="px-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl">
                        <p className="text-gray-900 font-medium">{user?.phone_number || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Role</label>
                      <div className="px-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user?.is_superuser ? 'bg-indigo-500' : 'bg-green-500'}`}></div>
                        <p className="text-gray-900 font-medium">{user?.is_superuser ? 'System Administrator' : 'Standard Member'}</p>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registered Address</label>
                      <div className="px-4 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl">
                        <p className="text-gray-900 font-medium">{user?.address || 'No address provided on file'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100 bg-[#4355FF]/5 rounded-xl p-4 flex gap-4 items-start">
                    <FileText className="w-5 h-5 text-[#4355FF]" />
                    <p className="text-sm text-[#4355FF] font-medium leading-relaxed">
                      Your personal details are securely recorded for compliance. If you need to legally change your name or ownership information, please contact our support team to initiate a secure transfer process.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* BUSINESS TAB */}
            {activeTab === 'business' && (
              <motion.div
                key="business"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                        <Briefcase className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Public Business Data</h2>
                        <p className="text-gray-500 text-sm mt-1">This information may be visible to your customers.</p>
                      </div>
                    </div>
                  </div>

                  {!user?.is_paid && (
                    <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-5 flex items-start gap-4">
                      <Lock className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <h3 className="font-bold text-orange-800">PRO Subscription Required</h3>
                        <p className="text-sm text-orange-700 mt-1">You must have an active PRO subscription to update your business profile output and manage your public data. Please contact support or your administrator to activate your subscription.</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Public Trading Name</label>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            <Lock size={9} /> Locked
                          </span>
                        </div>
                        <input
                          type="text"
                          name="business_name"
                          value={businessData.business_name}
                          readOnly
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-medium cursor-not-allowed select-none"
                        />
                        <p className="text-[11px] text-gray-400">Business name is locked after registration. Contact support to request a change.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Standard Operating Hours</label>
                        <input
                          type="text"
                          name="business_hours"
                          value={businessData.business_hours}
                          onChange={handleBusinessInputChange}
                          disabled={!user?.is_paid}
                          placeholder="e.g. Mon-Fri: 9am - 5pm"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] transition-all disabled:opacity-50 disabled:bg-gray-50"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <div className="flex justify-between items-end mb-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Core Services Offered</label>
                          <span className="text-[10px] text-gray-400">Use line breaks for multiple</span>
                        </div>
                        <textarea
                          name="services_offered"
                          value={businessData.services_offered}
                          onChange={handleBusinessInputChange}
                          disabled={!user?.is_paid}
                          rows={4}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] resize-y transition-all disabled:opacity-50 disabled:bg-gray-50"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <div className="flex justify-between items-end mb-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Booking Policies</label>
                          <span className="text-[10px] text-gray-400">Cancellation rules, deposits, etc.</span>
                        </div>
                        <textarea
                          name="booking_policies"
                          value={businessData.booking_policies}
                          onChange={handleBusinessInputChange}
                          disabled={!user?.is_paid}
                          rows={4}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] resize-y transition-all disabled:opacity-50 disabled:bg-gray-50"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900">Social Media Links (Optional)</h3>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Facebook Link</label>
                          <input
                            type="url"
                            name="facebook_link"
                            value={businessData.facebook_link}
                            onChange={handleBusinessInputChange}
                            disabled={!user?.is_paid}
                            placeholder="https://facebook.com/yourbusiness"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] transition-all disabled:opacity-50 disabled:bg-gray-50"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Instagram Link</label>
                          <input
                            type="url"
                            name="instagram_link"
                            value={businessData.instagram_link}
                            onChange={handleBusinessInputChange}
                            disabled={!user?.is_paid}
                            placeholder="https://instagram.com/yourbusiness"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] transition-all disabled:opacity-50 disabled:bg-gray-50"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">LinkedIn Link</label>
                          <input
                            type="url"
                            name="linkedin_link"
                            value={businessData.linkedin_link}
                            onChange={handleBusinessInputChange}
                            disabled={!user?.is_paid}
                            placeholder="https://linkedin.com/company/yourbusiness"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] transition-all disabled:opacity-50 disabled:bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>



                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                      <button
                        type="submit"
                        disabled={profileLoading || !user?.is_paid}
                        className="flex items-center gap-2 px-8 py-3.5 bg-[#4355FF] text-white rounded-xl font-bold hover:bg-[#3644CC] transition-all shadow-lg shadow-[#4355FF]/25 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-[#4355FF] disabled:cursor-not-allowed"
                      >
                        {profileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Publish Business Changes
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
                        <Lock className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Account Security</h2>
                        <p className="text-gray-500 text-sm mt-1">Manage passwords and authentication methods.</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-2 max-w-md">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Password</label>
                      <input
                        type="password"
                        name="old_password"
                        required
                        value={passwordData.old_password}
                        onChange={handlePasswordInputChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] transition-all"
                      />
                    </div>

                    <div className="pt-4 pb-2">
                      <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Create New Password</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Password</label>
                        <input
                          type="password"
                          name="new_password"
                          required
                          value={passwordData.new_password}
                          onChange={handlePasswordInputChange}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm New Password</label>
                        <input
                          type="password"
                          name="confirm_password"
                          required
                          value={passwordData.confirm_password}
                          onChange={handlePasswordInputChange}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] transition-all"
                        />
                      </div>
                    </div>



                    <div className="pt-6 border-t border-gray-100">
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                        Update Security Credentials
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
