import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { apiFetch } from '../../utils/api';

interface UserProfile {
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  is_superuser: boolean;
  business_profile: {
    business_name: string;
    business_hours: string;
    services_offered: string;
    booking_policies: string;
  };
}

export default function Settings() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile Update State (Business Only)
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [businessData, setBusinessData] = useState({
    business_name: '',
    business_hours: '',
    services_offered: '',
    booking_policies: ''
  });

  // Password Update State
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
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
    setProfileError('');
    setProfileSuccess('');

    try {
      const data = await apiFetch('/user/', {
        method: 'PATCH',
        body: JSON.stringify({
          business_profile: businessData
        })
      });
      setUser(data);
      setProfileSuccess("Business details updated successfully!");
    } catch (err: any) {
      console.error("Profile update failed", err);
      setProfileError("Failed to update business details.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("New passwords do not match.");
      setPasswordLoading(false);
      return;
    }

    try {
      await apiFetch('/change-password/', {
        method: 'POST',
        body: JSON.stringify(passwordData)
      });
      setPasswordSuccess("Password updated successfully!");
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      console.error("Password update failed", err);
      // Try to extract the first error message from any field
      const serverErrors = err.data;
      let firstMessage = "Failed to update password.";

      if (typeof serverErrors === 'object' && serverErrors !== null) {
        // If it's a field-specific error (like old_password, new_password)
        const errorValues = Object.values(serverErrors);
        if (errorValues.length > 0) {
          const firstErr = errorValues[0];
          firstMessage = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
        } else if (serverErrors.detail) {
          firstMessage = serverErrors.detail;
        }
      }

      setPasswordError(firstMessage);
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
            booking_policies: data.business_profile.booking_policies || ''
          });
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#4355FF]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Business Settings</h1>
        <p className="text-gray-500 mt-1">Review your personal information and update your business details.</p>
      </div>

      <div className="space-y-6">
        {/* Personal Details (Locked) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Personal Account Details</h2>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Locked</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <input
                type="text"
                readOnly
                value={user?.full_name || ''}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed italic"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Email Address</label>
              <input
                type="email"
                readOnly
                value={user?.email || ''}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed italic"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Phone Number</label>
              <input
                type="text"
                readOnly
                value={user?.phone_number || ''}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed italic"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Role</label>
              <input
                type="text"
                value={user?.is_superuser ? 'Super Admin' : 'Member'}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed italic"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-500">Address</label>
              <input
                type="text"
                readOnly
                value={user?.address || ''}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed italic"
              />
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400 italic">* Personal details cannot be changed. Please contact support to request an update.</p>
        </div>

        {/* Business Details (Editable) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Business Profile Details</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Business Name</label>
                <input
                  type="text"
                  name="business_name"
                  value={businessData.business_name}
                  onChange={handleBusinessInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Business Hours</label>
                <input
                  type="text"
                  name="business_hours"
                  value={businessData.business_hours}
                  onChange={handleBusinessInputChange}
                  placeholder="e.g. 9:00 AM - 5:00 PM"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF]"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-900">Services Offered</label>
                <textarea
                  name="services_offered"
                  value={businessData.services_offered}
                  onChange={handleBusinessInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] resize-none"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-900">Booking Policies</label>
                <textarea
                  name="booking_policies"
                  value={businessData.booking_policies}
                  onChange={handleBusinessInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF] resize-none"
                />
              </div>
            </div>

            {profileError && (
              <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100 italic">
                {profileError}
              </p>
            )}

            {profileSuccess && (
              <p className="text-sm text-green-600 font-medium bg-green-50 p-3 rounded-lg border border-green-100">
                {profileSuccess}
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={profileLoading}
                className="flex items-center gap-2 px-8 py-3 bg-[#4355FF] text-white rounded-lg font-bold hover:bg-[#3644CC] transition-all shadow-md shadow-[#4355FF]/20 active:scale-95 disabled:opacity-50"
              >
                {profileLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Save Business Profile
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Security & Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Current Password</label>
                <input
                  type="password"
                  name="old_password"
                  required
                  value={passwordData.old_password}
                  onChange={handlePasswordInputChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF]"
                />
              </div>

              <div className="hidden md:block"></div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">New Password</label>
                <input
                  type="password"
                  name="new_password"
                  required
                  value={passwordData.new_password}
                  onChange={handlePasswordInputChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Confirm New Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  value={passwordData.confirm_password}
                  onChange={handlePasswordInputChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4355FF]/20 focus:border-[#4355FF]"
                />
              </div>
            </div>

            {passwordError && (
              <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100 italic">
                {passwordError}
              </p>
            )}

            {passwordSuccess && (
              <p className="text-sm text-green-600 font-medium bg-green-50 p-3 rounded-lg border border-green-100">
                {passwordSuccess}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="flex items-center gap-2 px-8 py-3 bg-[#4355FF] text-white rounded-lg font-bold hover:bg-[#3644CC] transition-all shadow-md shadow-[#4355FF]/20 active:scale-95 disabled:opacity-50"
              >
                {passwordLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
