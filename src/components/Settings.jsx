import React, { useState, useEffect } from 'react';
import { getCurrentUser, updateProfile, changePassword, deleteAccount, getAvailableCurrencies, updateCurrency } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
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
  GlobeAltIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

function Settings() {
  const { currency, setUserCurrency } = useCurrency();  // ← Currency context
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currencies, setCurrencies] = useState([]);

  const [profile, setProfile] = useState({ username: '', email: '' });
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('user_preferences');
    return saved ? JSON.parse(saved) : { notifications: true, weeklyReport: true, anomalyAlerts: true, budgetWarnings: true };
  });

  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadUserData();
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const res = await getAvailableCurrencies();
      setCurrencies(res.data?.data || [
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
        { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
        { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
      ]);
    } catch {}
  };

  const loadUserData = async () => {
    try {
      const response = await getCurrentUser();
      const userData = response.data?.user || response.data;
      setUser(userData);
      setProfile({ username: userData?.username || '', email: userData?.email || '' });
      setSelectedCurrency(userData?.currency || 'USD');
    } catch (error) {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setProfile({ username: parsed.username || '', email: parsed.email || '' });
          setSelectedCurrency(parsed.currency || 'USD');
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle currency change - syncs with backend
  const handleCurrencyChange = async (newCurrency) => {
    setSelectedCurrency(newCurrency);
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await updateCurrency(newCurrency);
      setUserCurrency(newCurrency);  // Update context
      
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.currency = newCurrency;
      localStorage.setItem('user', JSON.stringify(stored));

      setMessage({ type: 'success', text: 'Currency updated globally!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update currency' });
      // Revert
      setSelectedCurrency(currency);
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profile.username.trim()) { setMessage({ type: 'error', text: 'Username required' }); return; }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await updateProfile({ username: profile.username, email: profile.email });
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Profile updated!' });
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, username: profile.username, email: profile.email }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword) { setMessage({ type: 'error', text: 'Current password required' }); return; }
    if (passwords.newPassword.length < 6) { setMessage({ type: 'error', text: 'Min 6 characters' }); return; }
    if (passwords.newPassword !== passwords.confirmPassword) { setMessage({ type: 'error', text: 'Passwords do not match' }); return; }

    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Password changed! Redirecting...' });
        setTimeout(() => { localStorage.clear(); window.location.href = '/login'; }, 2000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handlePreferencesSave = () => {
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    setMessage({ type: 'success', text: 'Preferences saved!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return;
    setSaving(true);
    try {
      const res = await deleteAccount();
      if (res.data?.success) { localStorage.clear(); window.location.href = '/login'; }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
    } finally { setSaving(false); }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'password', label: 'Password', icon: LockClosedIcon },
    { id: 'preferences', label: 'Preferences', icon: Cog6ToothIcon },
    { id: 'danger', label: 'Danger Zone', icon: TrashIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-yellow-500 border-t-transparent"></div>
      </div>
    );
  }

  const selectedCurrencyData = currencies.find(c => c.code === selectedCurrency);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm animate-slideDown ${message.type === 'success' ? 'bg-emerald-900/30 border border-emerald-500/50' : 'bg-red-900/30 border border-red-500/50'}`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? <CheckCircleIcon className="h-5 w-5 text-emerald-400" /> : <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />}
            <p className={`text-sm ${message.type === 'success' ? 'text-emerald-200' : 'text-red-200'}`}>{message.text}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>

        <div className="flex border-b border-gray-700 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-400/5' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'}`}>
              <tab.icon className="h-5 w-5" /><span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">{profile.username?.charAt(0)?.toUpperCase() || 'U'}</div>
                <div><h3 className="text-lg font-semibold text-white">{profile.username}</h3><p className="text-sm text-gray-400">{profile.email}</p></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><UserIcon className="h-5 w-5 text-gray-500" /></div>
                  <input type="text" value={profile.username} onChange={(e) => setProfile({...profile, username: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><EnvelopeIcon className="h-5 w-5 text-gray-500" /></div>
                  <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 disabled:opacity-60 shadow-lg shadow-yellow-500/25">
                {saving ? <><ArrowPathIcon className="h-5 w-5 animate-spin" />Saving...</> : <><CheckCircleIcon className="h-5 w-5" />Save Changes</>}
              </button>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><KeyIcon className="h-5 w-5 text-gray-500" /></div>
                  <input type={showPasswords.current ? "text" : "password"} value={passwords.currentPassword} onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} className="w-full pl-12 pr-12 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50" placeholder="Enter current password" />
                  <button type="button" onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})} className="absolute right-0 pr-4 inset-y-0" tabIndex={-1}>{showPasswords.current ? <EyeSlashIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><LockClosedIcon className="h-5 w-5 text-gray-500" /></div>
                  <input type={showPasswords.new ? "text" : "password"} value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} className="w-full pl-12 pr-12 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50" />
                  <button type="button" onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})} className="absolute right-0 pr-4 inset-y-0" tabIndex={-1}>{showPasswords.new ? <EyeSlashIcon className="h-5 w-5 text-gray-500" /> : <EyeIcon className="h-5 w-5 text-gray-500" />}</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center"><ShieldCheckIcon className="h-5 w-5 text-gray-500" /></div>
                  <input type={showPasswords.confirm ? "text" : "password"} value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 disabled:opacity-60 shadow-lg shadow-yellow-500/25">
                {saving ? <><ArrowPathIcon className="h-5 w-5 animate-spin" />Updating...</> : <><LockClosedIcon className="h-5 w-5" />Change Password</>}
              </button>
            </form>
          )}

          {/* Preferences Tab - Updated with live currency */}
          {activeTab === 'preferences' && (
            <div className="space-y-5">
              {/* Currency Selector - Synced with backend */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    disabled={saving}
                    className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500/50 appearance-none cursor-pointer disabled:opacity-60"
                  >
                    {currencies.map(c => (
                      <option key={c.code} value={c.code} className="bg-gray-900">
                        {c.symbol} {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedCurrencyData && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    All amounts across the app will display in {selectedCurrencyData.symbol} ({selectedCurrencyData.code})
                  </p>
                )}
              </div>

              {/* Toggle Switches */}
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
                      <div><p className="text-sm font-medium text-gray-200">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
                    </div>
                    <button type="button" onClick={() => setPreferences({ ...preferences, [item.key]: !preferences[item.key] })} className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${preferences[item.key] ? 'bg-yellow-500' : 'bg-gray-600'}`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${preferences[item.key] ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                    </button>
                  </div>
                ))}
              </div>

              <button onClick={handlePreferencesSave} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 shadow-lg shadow-yellow-500/25">
                <CheckCircleIcon className="h-5 w-5" />Save Preferences
              </button>
            </div>
          )}

          {/* Danger Zone */}
          {activeTab === 'danger' && (
            <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-3 mb-4"><TrashIcon className="h-6 w-6 text-red-400" /><h3 className="text-lg font-semibold text-red-300">Delete Account</h3></div>
              <p className="text-sm text-red-200/80 mb-4">This permanently removes all your data, transactions, and budgets.</p>
              <button onClick={handleDeleteAccount} disabled={saving} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold disabled:opacity-60">{saving ? 'Deleting...' : 'Delete My Account'}</button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}.animate-slideDown{animation:slideDown .3s ease-out}`}</style>
    </div>
  );
}

export default Settings;