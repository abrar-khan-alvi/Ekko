import React, { useRef, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/Logo';
import { apiFetch } from '../utils/api';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const email = location.state?.email;
  const purpose = location.state?.purpose || 'signup';

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple chars

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = code.join('');
    if (otpCode.length < 6) return;

    setLoading(true);
    setError('');

    try {
      await apiFetch('/verify-email/', {
        method: 'POST',
        body: JSON.stringify({
          email,
          code: otpCode,
          purpose
        }),
      });

      if (purpose === 'signup') {
        navigate('/success?type=signup');
      } else {
        navigate('/reset-password', { state: { email, code: otpCode } });
      }
    } catch (err: any) {
      setError(err.data?.error || err.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiFetch(purpose === 'signup' ? '/signup/' : '/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      alert('A new code has been sent to your email.');
    } catch (err: any) {
      alert('Failed to resend code. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-[500px] bg-white rounded-xl p-10 text-center shadow-[0px_4px_24px_rgba(0,0,0,0.04)] border border-gray-100">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <h2 className="text-[28px] font-bold text-gray-900 mb-3">Check your email</h2>
        <p className="text-[#6B7280] text-[15px] mb-10 max-w-[320px] mx-auto leading-relaxed">
          We sent a code to {email || 'your email address'}. Please check your email for the 6 digit code.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="flex justify-center gap-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputs.current[index] = el}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-[52px] h-[64px] text-center text-2xl font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4355FF] focus:border-transparent transition-all shadow-sm"
              />
            ))}
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </Button>

          <div className="text-sm text-gray-600">
            You have not received the email?{' '}
            <button
              type="button"
              onClick={handleResend}
              className="text-[#4355FF] font-medium hover:underline"
            >
              Resend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
