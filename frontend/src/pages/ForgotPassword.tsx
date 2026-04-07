import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/Logo';
import { apiFetch } from '../utils/api';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiFetch('/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      navigate('/verify-email', { state: { email, purpose: 'reset' } });
    } catch (err: any) {
      setError(err.data?.detail || 'Failed to send verification code');
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

        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Forget Password?</h2>
        <p className="text-gray-500 mb-8">Please enter your email to get verification code</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <Input
            label="Email address"
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Code'}
          </Button>
        </form>
      </div>
    </div>
  );
}
