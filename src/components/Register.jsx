import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters';
    } 

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setApiError('');
    setSuccessMessage('');

    try {
      const response = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (response.data?.success) {
        setSuccessMessage('Account created successfully! Redirecting...');

        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        if (onLogin && typeof onLogin === 'function') {
          onLogin(response.data.access_token, response.data.user);
        }

        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        setApiError(response.data?.message || response.data?.error || 'Registration failed');
      }
    } catch (err) {
      

      if (err.response) {
        const message = err.response.data?.message || err.response.data?.error;
        switch (err.response.status) {
          case 400:
            setApiError(message || 'Invalid information. Please check your details.');
            break;
          case 409:
            setApiError(message || 'Username or email already exists.');
            break;
          case 500:
            setApiError('Server error. Please try again later.');
            break;
          default:
            setApiError(message || `Error: ${err.response.status}`);
        }
      } else if (err.request) {
        setApiError('Cannot connect to server. Please check your connection.');
      } else {
        setApiError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!formData.password) return null;

    let strength = 0;
    if (formData.password.length >= 6) strength++;
    if (formData.password.length >= 10) strength++;
    if (/(?=.*[0-9])/.test(formData.password)) strength++;
    if (/(?=.*[a-z])/.test(formData.password)) strength++;
    if (/(?=.*[A-Z])/.test(formData.password)) strength++;
    if (/(?=.*[!@#$%^&*])/.test(formData.password)) strength++;

    if (strength <= 2) return { text: 'Weak', color: 'text-red-400', bg: 'bg-red-500', width: 'w-1/4' };
    if (strength <= 4) return { text: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500', width: 'w-2/4' };
    if (strength <= 5) return { text: 'Strong', color: 'text-emerald-400', bg: 'bg-emerald-500', width: 'w-3/4' };
    return { text: 'Very Strong', color: 'text-emerald-300', bg: 'bg-emerald-400', width: 'w-full' };
  };

  const passwordStrength = getPasswordStrength();

  const getInputClasses = (fieldName) => {
    const baseClasses = "block w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300";
    if (errors[fieldName]) {
      return `${baseClasses} border-red-500/50 focus:border-red-500 focus:ring-red-500/20`;
    }
    if (focusedField === fieldName) {
      return `${baseClasses} border-yellow-500/50 focus:border-yellow-500 focus:ring-yellow-500/20`;
    }
    return `${baseClasses} border-gray-700 focus:border-yellow-500/50 focus:ring-yellow-500/20`;
  };

  const getIconClasses = (fieldName) => {
    const baseClasses = "h-5 w-5 transition-colors duration-300";
    if (errors[fieldName]) return `${baseClasses} text-red-400`;
    if (focusedField === fieldName) return `${baseClasses} text-yellow-400`;
    return `${baseClasses} text-gray-500`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Content */}
      <div className="max-w-md w-full relative z-10">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-2xl shadow-yellow-500/25 mb-6 transform hover:scale-105 transition-all duration-500">
            <SparklesIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Create Account
          </h2>
          <p className="text-gray-400">
            Start tracking expenses with AI-powered insights
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>

          <div className="p-8">
            {/* API Error */}
            {apiError && (
              <div className="mb-6 bg-red-900/30 border border-red-500/50 rounded-xl px-4 py-3 animate-slideDown backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">{apiError}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 bg-emerald-900/30 border border-emerald-500/50 rounded-xl px-4 py-3 animate-slideDown backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <CheckBadgeIcon className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-200">{successMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className={getIconClasses('username')} />
                  </div>
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    className={getInputClasses('username')}
                    placeholder="Choose a username"
                    autoComplete="username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-slideDown">
                    <ExclamationCircleIcon className="h-3 w-3" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className={getIconClasses('email')} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className={getInputClasses('email')}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-slideDown">
                    <ExclamationCircleIcon className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className={getIconClasses('password')} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`${getInputClasses('password')} pr-12`}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-slideDown">
                    <ExclamationCircleIcon className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}

                {/* Password Strength */}
                {formData.password && !errors.password && (
                  <div className="mt-3 animate-slideDown">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500">Strength:</span>
                      <span className={`text-xs font-semibold ${passwordStrength?.color}`}>
                        {passwordStrength?.text}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength?.bg} rounded-full transition-all duration-500 ease-out ${passwordStrength?.width}`}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ShieldCheckIcon className={getIconClasses('confirmPassword')} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    className={`${getInputClasses('confirmPassword')} pr-12`}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-slideDown">
                    <ExclamationCircleIcon className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms */}
              <div>
                <div className="flex items-start gap-3">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-gray-800 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-400 cursor-pointer select-none">
                    I agree to the{' '}
                    <span className="text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer">
                      Terms of Service
                    </span>
                    {' '}and{' '}
                    <span className="text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer">
                      Privacy Policy
                    </span>
                  </label>
                </div>
                {errors.terms && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1 animate-slideDown">
                    <ExclamationCircleIcon className="h-3 w-3" />
                    {errors.terms}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Create Account</span>
                    <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-800 text-gray-500">
                    Already have an account?
                  </span>
                </div>
              </div>
            </div>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-gray-300 hover:text-yellow-400 font-medium transition-all duration-300 group"
              >
                <span>Sign in to your account</span>
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            Secure registration • Your data is encrypted
          </p>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}

export default Register;