import React, { useState, useEffect } from 'react';
import { getCurrentUser, updateProfile, changePassword, deleteAccount } from '../services/api';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  Cog6ToothIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile form
  const [profile, setProfile] = useState({
    username: '',
    email: ''
  });

  // Password form
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Preferences (local only - no backend endpoint)
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('user_preferences');
    return saved ? JSON.parse(saved) : {
      currency: 'USD',
      notifications: true,
      weeklyReport: true,
      anomalyAlerts: true,
      budgetWarnings: true
    };
  });

  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await getCurrentUser();
      // Backend returns: { success: true, user: { id, username, email, ... } }
      const userData = response.data?.user || response.data;
      setUser(userData);
      setProfile({
        username: userData?.username || '',
        email: userData?.email || ''
      });
    } catch (error) {
      
      // Fallback to localStorage
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setProfile({ username: parsed.username || '', email: parsed.email || '' });
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  // Update Profile - matches PUT /api/auth/me
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    if (!profile.username.trim()) {
      setMessage({ type: 'error', text: 'Username is required' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await updateProfile({
        username: profile.username,
        email: profile.email
      });
      
      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Update stored user
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem('user', JSON.stringify({ 
            ...parsed, 
            username: profile.username, 
            email: profile.email 
          }));
        }
      } else {
        throw new Error(response.data?.message || 'Update failed');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.response?.data?.error || 'Failed to update profile' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  // Change Password - matches PUT /api/auth/password
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!passwords.currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwords.currentPassword === passwords.newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      
      if (response.data?.success) {
        setMessage({ type: 'success', text: 'Password changed successfully! Please login again.' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        
        // Clear tokens to force re-login (backend blacklists the old token)
        setTimeout(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 2000);
      } else {
        throw new Error(response.data?.message || 'Password change failed');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.response?.data?.error || 'Failed to change password' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  // Save Preferences (local only)
  const handlePreferencesSave = () => {
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    setMessage({ type: 'success', text: 'Preferences saved!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Delete Account - matches DELETE /api/auth/me
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account?\n\nThis action cannot be undone. All your data, transactions, and budgets will be permanently removed.'
    );
    
    if (!confirmed) return;
    
    setSaving(true);
    try {
      const response = await deleteAccount();
      
      if (response.data?.success) {
        localStorage.clear();
        window.location.href = '/login';
      } else {
        throw new Error(response.data?.message || 'Delete failed');
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete account' 
      });
      setActiveTab('profile');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'password', label: 'Password', icon: LockClosedIcon },
    { id: 'preferences', label: 'Preferences', icon: Cog6ToothIcon },
    { id: 'danger', label: 'Danger Zone', icon: TrashIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Message Toast */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm animate-slideDown ${
          message.type === 'success' 
            ? 'bg-emerald-900/30 border border-emerald-500/50' 
            : 'bg-red-900/30 border border-red-500/50'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            )}
            <p className={`text-sm ${message.type === 'success' ? 'text-emerald-200' : 'text-red-200'}`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Tabs Card */}
      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-400/5'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                  {profile.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{profile.username}</h3>
                  <p className="text-sm text-gray-400">{profile.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    className="block w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                    placeholder="Your username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="block w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 shadow-lg shadow-yellow-500/25"
              >
                {saving ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    className="block w-full pl-12 pr-12 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    tabIndex={-1}
                  >
                    {showPasswords.current ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className="block w-full pl-12 pr-12 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    tabIndex={-1}
                  >
                    {showPasswords.new ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ShieldCheckIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="block w-full pl-12 pr-12 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-60 shadow-lg shadow-yellow-500/25"
              >
                {saving ? (
                  <>
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="h-5 w-5" />
                    Change Password
                  </>
                )}
              </button>
            </form>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Currency
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GlobeAltIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <select
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    className="block w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all appearance-none"
                  >
                    <option value="USD">USD - US Dollar ($)</option>
                    <option value="EUR">EUR - Euro (€)</option>
                    <option value="GBP">GBP - British Pound (£)</option>
                    <option value="GHS">GHS - Ghanaian Cedi (₵)</option>
                    <option value="NGN">NGN - Nigerian Naira (₦)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  { key: 'notifications', label: 'Push Notifications', icon: BellIcon, desc: 'Receive alerts for important updates' },
                  { key: 'weeklyReport', label: 'Weekly Report', icon: ArrowPathIcon, desc: 'Get a weekly summary of your spending' },
                  { key: 'anomalyAlerts', label: 'Anomaly Alerts', icon: ExclamationCircleIcon, desc: 'Get notified when unusual spending is detected' },
                  { key: 'budgetWarnings', label: 'Budget Warnings', icon: ShieldCheckIcon, desc: 'Alert when approaching budget limits' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-900/30 rounded-xl border border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-200">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreferences({ ...preferences, [item.key]: !preferences[item.key] })}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                        preferences[item.key] ? 'bg-yellow-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                        preferences[item.key] ? 'translate-x-6' : 'translate-x-0.5'
                      }`}></div>
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handlePreferencesSave}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-yellow-500/25"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Save Preferences
              </button>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <TrashIcon className="h-6 w-6 text-red-400" />
                  <h3 className="text-lg font-semibold text-red-300">Delete Account</h3>
                </div>
                <p className="text-sm text-red-200/80 mb-4">
                  Once you delete your account, there is no going back. All your data, 
                  transactions, and budgets will be permanently removed.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={saving}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-60"
                >
                  {saving ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;