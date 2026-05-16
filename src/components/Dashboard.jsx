import React, { useState, useEffect } from "react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { getDashboardData, getTransactions, getCurrentUser } from "../services/api";
import { useCurrency } from "../context/CurrencyContext";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area,
  RadialBarChart, RadialBar
} from "recharts";

const CHART_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

function DashboardHome() {
  const { formatAmount, symbol } = useCurrency();  // ← Currency context

  const [dashboardData, setDashboardData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [chartView, setChartView] = useState("pie");

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userRes, dashboardRes, transactionsRes] = await Promise.allSettled([
        getCurrentUser(),
        getDashboardData(),
        getTransactions({ limit: 5, sort: '-date' })
      ]);
      if (userRes.status === 'fulfilled') {
        const userData = userRes.value.data?.user || userRes.value.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      }
      if (dashboardRes.status === 'fulfilled') {
        setDashboardData(dashboardRes.value.data?.data || dashboardRes.value.data);
        setError(null);
      } else setError('Failed to load dashboard');
      if (transactionsRes.status === 'fulfilled') {
        const txData = transactionsRes.value.data?.data || transactionsRes.value.data || [];
        setRecentTransactions(txData.slice(0, 5));
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, [currentTime]);

  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const formatTxDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const balance = dashboardData?.balance || 0;
  const totalIncome = dashboardData?.total_income || 0;
  const totalExpenses = dashboardData?.total_expenses || 0;
  const transactionCount = dashboardData?.transaction_count || 0;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
  const categoryBreakdown = dashboardData?.category_breakdown || [];
  const monthlySummary = dashboardData?.monthly_summary || [];
  const budgetStatus = dashboardData?.budget_status || [];
  const anomalyCount = dashboardData?.anomalies?.total_anomalies || 0;
  const nextMonthPrediction = dashboardData?.predictions?.next_month_spending || {};
  const insights = dashboardData?.insights || [];

  const pieData = categoryBreakdown.map(c => ({ name: c.category, value: c.total }));
  const barData = monthlySummary.slice(-6).map(m => ({
    month: m.month?.slice(5) || m.month,
    expenses: m.expenses,
    income: m.income,
    savings: m.savings,
  }));
  const radialData = budgetStatus.slice(0, 4).map((b, i) => ({
    name: b.category,
    value: Math.min(b.percentage || 0, 100),
    fill: CHART_COLORS[i]
  }));

  const getUsername = () => {
    if (user?.username) return user.username;
    try { return JSON.parse(localStorage.getItem('user') || '{}')?.username || 'User'; }
    catch { return 'User'; }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const daysInMonth = new Date(currentTime.getFullYear(), currentTime.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentTime.getFullYear(), currentTime.getMonth(), 1).getDay();
  const days = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-2 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ name, value, icon: Icon, trend, color }) => {
    const colors = {
      emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
      red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
      yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    };
    const c = colors[color] || colors.blue;
    return (
      <div className={`${c.bg} backdrop-blur-xl rounded-2xl border ${c.border} p-6 hover:shadow-lg transition-all duration-300`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-sm font-medium">{name}</span>
          <div className={`p-2.5 rounded-xl ${c.bg} border ${c.border}`}><Icon className={`h-5 w-5 ${c.text}`} /></div>
        </div>
        <p className="text-2xl font-bold text-white mb-2">{value}</p>
        {trend && (
          <div className="flex items-center gap-1.5">
            {trend > 0 ? <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-400" /> : <ArrowTrendingDownIcon className="h-4 w-4 text-red-400" />}
            <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">{greeting}, {getUsername()}!</h1>
            <span className="text-2xl">👋</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <CalendarIcon className="h-4 w-4" /><span className="text-sm">{formatDate(currentTime)}</span>
            <span className="text-gray-600">•</span>
            <ClockIcon className="h-4 w-4" /><span className="text-sm">{formatTime(currentTime)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {anomalyCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
              <span className="text-red-400 text-sm font-medium">{anomalyCount} anomalies</span>
            </div>
          )}
          {savingsRate >= 20 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">{savingsRate.toFixed(0)}% savings</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid - Uses formatAmount */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard name="Total Balance" value={formatAmount(balance)} icon={BanknotesIcon} color="yellow" trend={5.2} />
        <StatCard name="Monthly Income" value={formatAmount(totalIncome)} icon={ArrowTrendingUpIcon} color="emerald" trend={3.8} />
        <StatCard name="Monthly Expenses" value={formatAmount(totalExpenses)} icon={ArrowTrendingDownIcon} color="red" trend={-2.1} />
        <StatCard name="Savings Rate" value={`${savingsRate.toFixed(1)}%`} icon={CurrencyDollarIcon} color="blue" />
      </div>

      {/* AI Alerts */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.slice(0, 4).map((insight, i) => (
            <div key={i} className={`p-4 rounded-xl border backdrop-blur-xl flex items-start gap-3 ${
              insight.type === 'danger' ? 'bg-red-500/5 border-red-500/20' :
              insight.type === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
              insight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-blue-500/5 border-blue-500/20'
            }`}>
              <span className="text-lg mt-0.5">{insight.icon || '💡'}</span>
              <p className="text-gray-300 text-sm">{insight.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-semibold text-lg">Spending Breakdown</h3>
              <p className="text-gray-500 text-sm">Category distribution</p>
            </div>
            <div className="flex bg-gray-700/50 rounded-lg p-1">
              {['pie', 'bar', 'area'].map(view => (
                <button key={view} onClick={() => setChartView(view)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${chartView === view ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-white'}`}>{view}</button>
              ))}
            </div>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              {chartView === 'pie' ? (
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '12px', color: '#F9FAFB' }} formatter={(v) => formatAmount(v)} />
                  <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                </PieChart>
              ) : chartView === 'bar' ? (
                <BarChart data={pieData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '12px', color: '#F9FAFB' }} formatter={(v) => formatAmount(v)} />
                  <Bar dataKey="value" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={pieData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '12px', color: '#F9FAFB' }} formatter={(v) => formatAmount(v)} />
                  <Area type="monotone" dataKey="value" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center"><ShoppingCartIcon className="h-12 w-12 mx-auto mb-3 text-gray-600" /><p>No data yet</p></div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {radialData.length > 0 && (
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-white font-semibold text-lg mb-4">Budget Usage</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart innerRadius="30%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                  <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
                  <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '12px', color: '#F9FAFB' }} formatter={(v) => `${v.toFixed(1)}%`} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-3">
                {radialData.map((d, i) => (<div key={i} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }}></div><span className="text-xs text-gray-400 capitalize">{d.name}</span></div>))}
              </div>
            </div>
          )}
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-white font-semibold text-lg mb-4">{monthNames[currentTime.getMonth()]} {currentTime.getFullYear()}</h3>
            <div className="grid grid-cols-7 gap-1 mb-2">{weekDays.map(d => <div key={d} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => (
                <div key={i} className="aspect-square flex items-center justify-center">
                  {day && <div className={`text-sm w-8 h-8 flex items-center justify-center rounded-full ${day === currentTime.getDate() ? 'bg-yellow-500 text-white font-bold shadow-lg shadow-yellow-500/25' : 'text-gray-300 hover:bg-gray-700'}`}>{day}</div>}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-400">Transactions</span><span className="text-white font-medium">{transactionCount}</span></div>
              {nextMonthPrediction.prediction && (
                <div className="flex justify-between text-sm"><span className="text-gray-400">Next Month</span>
                  <span className={nextMonthPrediction.trend === 'increasing' ? 'text-red-400 font-medium' : 'text-emerald-400 font-medium'}>{formatAmount(nextMonthPrediction.prediction)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      {barData.length > 0 && (
        <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
          <h3 className="text-white font-semibold text-lg mb-2">Monthly Trend</h3>
          <p className="text-gray-500 text-sm mb-6">Income vs Expenses over time</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '12px', color: '#F9FAFB' }} formatter={(v) => formatAmount(v)} />
              <Legend wrapperStyle={{ color: '#9CA3AF' }} />
              <Area type="monotone" dataKey="income" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="savings" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
        <div className="flex justify-between items-center mb-6">
          <div><h3 className="text-white font-semibold text-lg">Recent Transactions</h3><p className="text-gray-500 text-sm">Your latest activity</p></div>
          <Link to="/transactions" className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors">View All →</Link>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-700/50"><th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Desc</th><th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Category</th><th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th><th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Amount</th></tr></thead>
              <tbody className="divide-y divide-gray-700/30">
                {recentTransactions.map((t) => (
                  <tr key={t._id || t.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 text-white text-sm">{t.description || t.category || '—'}</td>
                    <td className="py-3.5 px-4"><span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-medium border border-yellow-500/20 capitalize">{t.category}</span></td>
                    <td className="py-3.5 px-4 text-gray-400 text-sm">{formatTxDate(t.date)}</td>
                    <td className={`py-3.5 px-4 text-right text-sm font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '−'}{formatAmount(Math.abs(t.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4"><ShoppingCartIcon className="h-8 w-8 text-gray-500" /></div>
            <p className="text-gray-400 mb-4">No transactions recorded yet</p>
            <Link to="/add" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 transition-all shadow-lg shadow-yellow-500/25">Add Your First Transaction</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardHome;