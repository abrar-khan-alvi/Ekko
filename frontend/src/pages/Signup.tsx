import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { AuthLeftPanel } from '../components/AuthLeftPanel';
import signupBg from '../assets/signup.png';

import { apiFetch } from '../utils/api';

// ─── Validation helpers ────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE  = /^[a-zA-Z\s'\-\.]{2,100}$/;
const PHONE_RE = /^[\d\s\+\(\)\-]{7,20}$/;

// Accepts: Mon-Fri 09:00-17:00 | Monday-Friday 09:00-17:00 | Sun-Fri 09:00-17:00 etc.
const HOURS_RE =
  /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[\s\-]+(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+\d{2}:\d{2}-\d{2}:\d{2}$/i;

// Business name: letters, digits, spaces, & . , ' -
const BIZ_NAME_RE = /^[\w\s&.,'\-]{2,100}$/;

type FieldErrors = {
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  password?: string;
  confirmPassword?: string;
  businessName?: string;
  businessHours?: string;
  servicesOffered?: string;
  bookingPolicies?: string;
  facebookLink?: string;
  instagramLink?: string;
  linkedinLink?: string;
};

function validateStep1(formData: typeof initialFormData): FieldErrors {
  const errs: FieldErrors = {};

  if (!formData.email) {
    errs.email = 'Email is required.';
  } else if (!EMAIL_RE.test(formData.email)) {
    errs.email = 'Enter a valid email address (e.g. user@example.com).';
  }

  if (!formData.fullName) {
    errs.fullName = 'Full name is required.';
  } else if (!NAME_RE.test(formData.fullName)) {
    errs.fullName = 'Name must be 2–100 characters and contain only letters, spaces or hyphens.';
  }

  if (!formData.phoneNumber) {
    errs.phoneNumber = 'Phone number is required.';
  } else if (!PHONE_RE.test(formData.phoneNumber)) {
    errs.phoneNumber = 'Enter a valid phone number (e.g. +1 555 000-0000).';
  }

  if (!formData.address || formData.address.trim().length < 5) {
    errs.address = 'Enter a full address (at least 5 characters).';
  }

  if (!formData.password) {
    errs.password = 'Password is required.';
  } else if (formData.password.length < 8) {
    errs.password = 'Password must be at least 8 characters.';
  } else if (!/[A-Z]/.test(formData.password)) {
    errs.password = 'Password must contain at least one uppercase letter.';
  } else if (!/\d/.test(formData.password)) {
    errs.password = 'Password must contain at least one number.';
  }

  if (!formData.confirmPassword) {
    errs.confirmPassword = 'Please confirm your password.';
  } else if (formData.password !== formData.confirmPassword) {
    errs.confirmPassword = 'Passwords do not match.';
  }

  return errs;
}

function validateStep2(formData: typeof initialFormData): FieldErrors {
  const errs: FieldErrors = {};

  if (!formData.businessName) {
    errs.businessName = 'Business name is required.';
  } else if (!BIZ_NAME_RE.test(formData.businessName)) {
    errs.businessName = 'Business name must be 2–100 characters (letters, digits, spaces, & . , \' -)';
  }

  if (!formData.businessHours) {
    errs.businessHours = 'Business hours are required.';
  } else if (!HOURS_RE.test(formData.businessHours.trim())) {
    errs.businessHours = 'Use format: Mon-Fri 09:00-17:00 or Sun-Sat 10:00-18:00';
  }

  if (!formData.servicesOffered || formData.servicesOffered.trim().length === 0) {
    errs.servicesOffered = 'Please list the services you offer (e.g. Haircut, Beard Trim).';
  } else {
    const services = formData.servicesOffered.split(',').map(s => s.trim()).filter(Boolean);
    if (services.length === 0 || services.some(s => s.length < 2)) {
      errs.servicesOffered = 'Each service must be at least 2 characters, separated by commas.';
    }
  }

  if (!formData.bookingPolicies || formData.bookingPolicies.trim().length < 5) {
    errs.bookingPolicies = 'Please describe your booking policy (e.g. Monday to Saturday).';
  }

  const URL_RE = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
  
  if (formData.facebookLink && !URL_RE.test(formData.facebookLink)) {
    errs.facebookLink = 'Please enter a valid URL.';
  }
  if (formData.instagramLink && !URL_RE.test(formData.instagramLink)) {
    errs.instagramLink = 'Please enter a valid URL.';
  }
  if (formData.linkedinLink && !URL_RE.test(formData.linkedinLink)) {
    errs.linkedinLink = 'Please enter a valid URL.';
  }

  return errs;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const initialFormData = {
  email: '',
  fullName: '',
  address: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  businessName: '',
  businessHours: '',
  servicesOffered: '',
  bookingPolicies: '',
  facebookLink: '',
  instagramLink: '',
  linkedinLink: ''
};

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear the error for this field as the user types
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateStep1(formData);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setCurrentStep(2);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateStep2(formData);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
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
            facebook_link: formData.facebookLink.trim() || 'N/A',
            instagram_link: formData.instagramLink.trim() || 'N/A',
            linkedin_link: formData.linkedinLink.trim() || 'N/A',
          }
        }),
      });
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
            <form onSubmit={handleNext} className="space-y-6" noValidate>
              <Input
                name="email"
                label="Email address"
                type="email"
                placeholder="esteban_schiller@gmail.com"
                value={formData.email}
                onChange={handleInputChange}
                error={fieldErrors.email}
              />

              <Input
                name="fullName"
                label="Full Name"
                type="text"
                placeholder="Esteban Schiller"
                value={formData.fullName}
                onChange={handleInputChange}
                error={fieldErrors.fullName}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  name="phoneNumber"
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  error={fieldErrors.phoneNumber}
                />

                <Input
                  name="address"
                  label="Address"
                  type="text"
                  placeholder="123 Main St, City, Country"
                  value={formData.address}
                  onChange={handleInputChange}
                  error={fieldErrors.address}
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
                  error={fieldErrors.password}
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
                  error={fieldErrors.confirmPassword}
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
            <form onSubmit={handleSignup} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  name="businessName"
                  label="Business Name"
                  type="text"
                  placeholder="EKKO Solutions"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  error={fieldErrors.businessName}
                />

                <Input
                  name="businessHours"
                  label="Business hours"
                  type="text"
                  placeholder="Mon-Fri 09:00-17:00"
                  value={formData.businessHours}
                  onChange={handleInputChange}
                  error={fieldErrors.businessHours}
                />
              </div>

              <Textarea
                name="servicesOffered"
                label="Services offered"
                placeholder="Haircut, Beard Trim, Consultation"
                value={formData.servicesOffered}
                onChange={handleInputChange}
                error={fieldErrors.servicesOffered}
                className="min-h-[100px]"
              />

              <Textarea
                name="bookingPolicies"
                label="Booking policies"
                placeholder="Monday to Saturday"
                value={formData.bookingPolicies}
                onChange={handleInputChange}
                error={fieldErrors.bookingPolicies}
                className="min-h-[100px]"
              />

              <div className="pt-2">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Social Media Links (Optional)</h3>
                <div className="space-y-4">
                  <Input
                    name="facebookLink"
                    label="Facebook Link"
                    type="text"
                    placeholder="https://facebook.com/yourbusiness"
                    value={formData.facebookLink}
                    onChange={handleInputChange}
                    error={fieldErrors.facebookLink}
                  />
                  <Input
                    name="instagramLink"
                    label="Instagram Link"
                    type="text"
                    placeholder="https://instagram.com/yourbusiness"
                    value={formData.instagramLink}
                    onChange={handleInputChange}
                    error={fieldErrors.instagramLink}
                  />
                  <Input
                    name="linkedinLink"
                    label="LinkedIn Link"
                    type="text"
                    placeholder="https://linkedin.com/company/yourbusiness"
                    value={formData.linkedinLink}
                    onChange={handleInputChange}
                    error={fieldErrors.linkedinLink}
                  />
                </div>
              </div>

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
