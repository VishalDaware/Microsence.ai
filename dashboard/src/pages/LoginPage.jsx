import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:5000/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        return;
      }

      // Store user data including userId
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
      };
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userId', data.user.id.toString());
      window.dispatchEvent(new Event('userLoggedIn'));

      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } catch (err) {
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8FFD7] flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#93DA97]/40 p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#3E5F44]">
            Welcome Back
          </h1>
          <p className="text-[#5E936C] mt-2 text-sm">
            Sign in to access your farm dashboard
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#3E5F44] mb-2">
              Email Address
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-3 w-5 h-5 text-[#5E936C]" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 border border-[#93DA97] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E936C] text-[#3E5F44] placeholder:text-[#5E936C]/60"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#3E5F44] mb-2">
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-3 w-5 h-5 text-[#5E936C]" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-3 border border-[#93DA97] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E936C] text-[#3E5F44] placeholder:text-[#5E936C]/60"
                disabled={loading}
              />
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-[#5E936C]">
              <input
                type="checkbox"
                className="rounded border-[#93DA97] text-[#3E5F44] focus:ring-[#5E936C]"
                disabled={loading}
              />
              Remember me
            </label>

            <button
              type="button"
              className="text-[#3E5F44] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3E5F44] hover:bg-[#2f4734] text-white font-medium py-3 rounded-xl transition disabled:opacity-60"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 text-center text-sm text-[#5E936C]">
          Don’t have an account?
        </div>

        {/* Signup Link */}
        <Link
          to="/signup"
          className="block w-full text-center border border-[#93DA97] text-[#3E5F44] font-medium py-3 rounded-xl hover:bg-[#93DA97]/20 transition"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}
