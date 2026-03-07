import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/Logo';
import { apiFetch } from '../utils/api';

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;
  const code = location.state?.code;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiFetch('/reset-password/', {
        method: 'POST',
        body: JSON.stringify({
          email,
          code,
          new_password: password
        }),
      });
      navigate('/success?type=reset');
    } catch (err: any) {
      setError(err.data?.error || err.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[500px] bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
        <div className="mb-8">
          <Logo />
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Set a new password</h2>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">
          Create a new password. Ensure it differs from previous ones for security
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <Input
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="********"
            icon={showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            onIconClick={() => setShowPassword(!showPassword)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="********"
            icon={showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            onIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" disabled={loading}>
            {loading ? 'Confirming...' : 'Confirm'}
          </Button>
        </form>
      </div>
    </div>
  );
}
