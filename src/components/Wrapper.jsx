import React, { useState, useEffect, useRef } from "react";
import {
  HomeIcon,
  CreditCardIcon,
  PlusCircleIcon,
  TagIcon,
  LightBulbIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  ShieldExclamationIcon,
  ChartBarIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, getDashboardData, logout } from "../services/api";

function Wrapper({ children, onLogout }) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const notificationRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShowNotifications(false);
  }, [location]);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed);
  }, [collapsed]);

  const loadUserData = async () => {
    try {
      const response = await getCurrentUser();
      // Backend: GET /auth/me → { success, user }
      const userData = response.data?.user || response.data;
      setUser(userData);
      if (userData) localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      
      const stored = localStorage.getItem('user');
      if (stored) try { setUser(JSON.parse(stored)); } catch {}
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await getDashboardData();
      // Backend: GET /dashboard → { success, data: { anomalies, budget_status, insights, predictions } }
      const data = response.data?.data || response.data;
      const notifs = [];

      if (data?.anomalies?.total_anomalies > 0) {
        notifs.push({
          id: 'anomalies',
          type: 'warning',
          icon: ShieldExclamationIcon,
          message: `${data.anomalies.total_anomalies} unusual transaction(s) detected`,
          time: 'Just now',
          path: '/insights'
        });
      }

      const exceeded = data?.budget_status?.filter(b => b.status === 'exceeded') || [];
      if (exceeded.length > 0) {
        notifs.push({
          id: 'budget',
          type: 'danger',
          icon: ChartBarIcon,
          message: `Budget exceeded: ${exceeded.map(b => b.category).join(', ')}`,
          time: 'Just now',
          path: '/categories'
        });
      }

      if (data?.insights?.length > 0) {
        notifs.push({
          id: 'insight',
          type: 'info',
          icon: LightBulbIcon,
          message: data.insights[0]?.message || 'New insight available',
          time: 'Just now',
          path: '/insights'
        });
      }

      if (data?.predictions?.next_month_spending) {
        notifs.push({
          id: 'prediction',
          type: 'info',
          icon: SparklesIcon,
          message: `Next month: $${data.predictions.next_month_spending.prediction?.toFixed(2)}`,
          time: 'Updated',
          path: '/insights'
        });
      }

      setNotifications(notifs);
    } catch (error) {
     
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      
    } finally {
      localStorage.clear();
      if (onLogout) onLogout();
      navigate('/login');
    }
  };

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: HomeIcon },
    { name: "Transactions", path: "/transactions", icon: CreditCardIcon },
    { name: "Add", path: "/add", icon: PlusCircleIcon },
    { name: "Categories", path: "/categories", icon: TagIcon },
    { name: "Insights", path: "/insights", icon: LightBulbIcon },
    { name: "Export", path: "/export", icon: DocumentArrowDownIcon },
    { name: "Settings", path: "/settings", icon: Cog6ToothIcon },
  ];

  const getInitials = () => {
    const username = user?.username || JSON.parse(localStorage.getItem('user') || '{}')?.username || 'U';
    return username.substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    return user?.username || JSON.parse(localStorage.getItem('user') || '{}')?.username || 'User';
  };

  const getEmail = () => {
    return user?.email || JSON.parse(localStorage.getItem('user') || '{}')?.email || '';
  };

  const getPageTitle = () => {
    const current = menu.find(m => 
      m.path === location.pathname || 
      (m.path !== '/dashboard' && location.pathname.startsWith(m.path))
    );
    return current?.name || 'Dashboard';
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'danger': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ===== SIDEBAR ===== */}
      <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static z-50 h-full transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} bg-gray-900 border-r border-gray-800 flex flex-col`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800 flex-shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-yellow-500/20">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-white text-lg truncate">TriNova</span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-gray-400 hover:text-white p-1.5">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title={collapsed ? item.name : ''}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-yellow-400' : ''
                }`} />
                {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                {isActive && <span className="absolute right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg">
              {getInitials()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{getDisplayName()}</p>
                <p className="text-xs text-gray-500 truncate">{getEmail()}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800">
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h2 className="text-lg font-semibold text-white hidden sm:block">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
              >
                <BellIcon className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slideDown">
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-white">Notifications</h3>
                      {notifications.length > 0 && (
                        <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-full">{notifications.length} new</span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map((notif) => {
                      const Icon = notif.icon || BellIcon;
                      return (
                        <button
                          key={notif.id}
                          onClick={() => { setShowNotifications(false); if (notif.path) navigate(notif.path); }}
                          className="w-full p-4 flex items-start gap-3 hover:bg-gray-800 transition border-b border-gray-800 last:border-0 text-left"
                        >
                          <div className={`p-2 rounded-lg ${getNotificationColor(notif.type)}/10 flex-shrink-0`}>
                            <Icon className={`h-5 w-5 ${getNotificationColor(notif.type).replace('bg-', 'text-')}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-300">{notif.message}</p>
                            <p className="text-xs text-gray-600 mt-1">{notif.time}</p>
                          </div>
                        </button>
                      );
                    }) : (
                      <div className="p-8 text-center">
                        <BellIcon className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">All caught up!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <button onClick={() => navigate('/settings')} className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-800 transition-all group">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {getInitials()}
              </div>
              <span className="hidden md:block text-sm text-gray-400 group-hover:text-white transition-colors">{getDisplayName()}</span>
            </button>

            {/* Logout */}
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all" title="Logout">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#0F172A]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-400 text-sm">Loading...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
      `}</style>
    </div>
  );
}

export default Wrapper;