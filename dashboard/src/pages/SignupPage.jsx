import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:5000/api';

export default function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Signup failed');
        return;
      }

      alert('Account created successfully! Please login.');
      navigate('/login');
    } catch (err) {
      setError('Failed to create account. Please try again.');
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
            Create Account
          </h1>
          <p className="text-[#5E936C] mt-2 text-sm">
            Join Plant Monitor and start tracking your farm data
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#3E5F44] mb-2">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 w-5 h-5 text-[#5E936C]" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-3 border border-[#93DA97] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E936C] text-[#3E5F44] placeholder:text-[#5E936C]/60"
                disabled={loading}
              />
            </div>
          </div>

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
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-3 border border-[#93DA97] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E936C] text-[#3E5F44] placeholder:text-[#5E936C]/60"
                disabled={loading}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-[#3E5F44] mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-3 w-5 h-5 text-[#5E936C]" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-4 py-3 border border-[#93DA97] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5E936C] text-[#3E5F44] placeholder:text-[#5E936C]/60"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3E5F44] hover:bg-[#2f4734] text-white font-medium py-3 rounded-xl transition disabled:opacity-60"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 text-center text-sm text-[#5E936C]">
          Already have an account?
        </div>

        {/* Login Link */}
        <Link
          to="/login"
          className="block w-full text-center border border-[#93DA97] text-[#3E5F44] font-medium py-3 rounded-xl hover:bg-[#93DA97]/20 transition"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
