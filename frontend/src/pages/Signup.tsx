import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { AuthLeftPanel } from '../components/AuthLeftPanel';
import signupBg from '../assets/signup.png';

import { apiFetch } from '../utils/api';

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    address: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessHours: '',
    servicesOffered: '',
    bookingPolicies: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email && formData.fullName && formData.password && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
      setCurrentStep(2);
    } else {
      alert("Please fill in all required fields.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiFetch('/signup/', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          address: formData.address,
          phone_number: formData.phoneNumber,
          business_profile: {
            business_name: formData.businessName,
            business_hours: formData.businessHours,
            services_offered: formData.servicesOffered,
            booking_policies: formData.bookingPolicies,
          }
        }),
      });
      // Redirect to verification page with email in state
      navigate('/verify-email', { state: { email: formData.email, purpose: 'signup' } });
    } catch (err: any) {
      setError(err.data?.email?.[0] || err.data?.detail || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <AuthLeftPanel
        title="Run Business on Autopilot"
        subtitle="Automate bookings, reminders & customer chats all from one powerful dashboard."
        imageUrl={signupBg}
      />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-xl border border-gray-100 rounded-2xl p-8 lg:p-10 shadow-sm bg-white">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[#4355FF] uppercase tracking-wider">Step {currentStep} of 2</span>
              <div className="flex gap-2">
                <div className={`h-1.5 w-12 rounded-full transition-colors ${currentStep >= 1 ? 'bg-[#4355FF]' : 'bg-gray-100'}`}></div>
                <div className={`h-1.5 w-12 rounded-full transition-colors ${currentStep >= 2 ? 'bg-[#4355FF]' : 'bg-gray-100'}`}></div>
              </div>
            </div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">
              {currentStep === 1 ? 'Create an Account' : 'Business Details'}
            </h2>
            <p className="text-gray-500">
              {currentStep === 1 ? 'Fill in your account information to get started' : 'Tell us more about your business to personalize your experience'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          {currentStep === 1 ? (
            <form onSubmit={handleNext} className="space-y-6">
              <Input
                name="email"
                label="Email address"
                type="email"
                placeholder="esteban_schiller@gmail.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />

              <Input
                name="fullName"
                label="Full Name"
                type="text"
                placeholder="Esteban Schiller"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  name="phoneNumber"
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  name="address"
                  label="Address"
                  type="text"
                  placeholder="123 Main St, City, Country"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  icon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  onIconClick={() => setShowPassword(!showPassword)}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="********"
                  icon={showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  onIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#4355FF] focus:ring-[#4355FF]" />
                  <span className="text-sm text-gray-600">Remember Password</span>
                </label>
                <Link to="/forgot-password" university-link="true" className="text-sm text-[#4355FF] hover:underline">
                  Forget Password?
                </Link>
              </div>

              <Button type="submit">Continue</Button>

              <div className="text-center text-sm text-gray-500 mt-6">
                Already have Account?{' '}
                <Link to="/" university-link="true" className="text-[#4355FF] font-medium hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  name="businessName"
                  label="Business Name"
                  type="text"
                  placeholder="EKKO Solutions"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  name="businessHours"
                  label="Business hours"
                  type="text"
                  placeholder="Mon-Fri: 9AM - 6PM"
                  value={formData.businessHours}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <Textarea
                name="servicesOffered"
                label="Services offered"
                placeholder="List the services you provide..."
                value={formData.servicesOffered}
                onChange={handleInputChange}
                required
                className="min-h-[100px]"
              />

              <Textarea
                name="bookingPolicies"
                label="Booking policies"
                placeholder="Outline your cancellation and booking terms..."
                value={formData.bookingPolicies}
                onChange={handleInputChange}
                required
                className="min-h-[100px]"
              />

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <div className="flex-[2]">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : 'Sign Up'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
