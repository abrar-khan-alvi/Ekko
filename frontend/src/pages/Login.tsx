import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { AuthLeftPanel } from '../components/AuthLeftPanel';
import signinBg from '../assets/signin.png';
import { Logo } from '../components/Logo';
import { apiFetch } from '../utils/api';


export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/login/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.data?.code === 'email_not_verified') {
        navigate('/verify-email', { state: { email: formData.email, purpose: 'signup' } });
      } else {
        setError(err.data?.detail || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <AuthLeftPanel
        title="Welcome Back!"
        subtitle="Manage your bookings, conversations & business automation all in one place."
        imageUrl={signinBg}
      />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md border border-gray-100 rounded-2xl p-8 shadow-sm bg-white">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">Login to Account</h2>
            <p className="text-gray-500">Please enter your email and password to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              name="email"
              label="Email address"
              type="email"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />

            <div className="space-y-1">
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#4355FF] focus:ring-[#4355FF]" />
                <span className="text-sm text-gray-600">Remember Password</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-[#4355FF] hover:underline">
                Forget Password?
              </Link>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Sign in'}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-6">
              Don't have any account?{' '}
              <Link to="/signup" className="text-[#4355FF] font-medium hover:underline">
                Create an Account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
